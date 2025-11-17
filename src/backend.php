<?php
// Suppress error display to prevent breaking JSON responses
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

session_start();
ob_start();

// ==================== COMPREHENSIVE SECURITY HEADERS ====================
header('Content-Type: application/json');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
header("X-Content-Type-Options: nosniff");
header("X-Frame-Options: DENY");
header("X-XSS-Protection: 1; mode=block");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("Strict-Transport-Security: max-age=31536000; includeSubDomains");

// ==================== SECURITY FUNCTIONS ====================
function sanitizeInput($input, $type = 'string') {
    if (empty($input)) return '';
    
    switch ($type) {
        case 'email':
            $clean = filter_var(trim($input), FILTER_SANITIZE_EMAIL);
            return filter_var($clean, FILTER_VALIDATE_EMAIL) ? $clean : '';
        case 'int':
            return filter_var($input, FILTER_VALIDATE_INT, FILTER_NULL_ON_FAILURE) ?? 0;
        case 'string':
        default:
            $clean = filter_var(trim($input), FILTER_SANITIZE_STRING);
            return htmlspecialchars($clean, ENT_QUOTES, 'UTF-8');
    }
}

function validateCSRFToken() {
    if (!isset($_POST['csrf_token']) || !isset($_SESSION['csrf_token'])) {
        return false;
    }
    return hash_equals($_SESSION['csrf_token'], $_POST['csrf_token']);
}

function rateLimitCheck($action, $maxAttempts = 5, $timeWindow = 300) {
    $key = 'rate_limit_' . $action . '_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    
    if (!isset($_SESSION[$key])) {
        $_SESSION[$key] = ['count' => 0, 'reset_time' => time() + $timeWindow];
    }
    
    if (time() > $_SESSION[$key]['reset_time']) {
        $_SESSION[$key] = ['count' => 0, 'reset_time' => time() + $timeWindow];
    }
    
    $_SESSION[$key]['count']++;
    
    return $_SESSION[$key]['count'] <= $maxAttempts;
}

// ==================== DATABASE CONNECTION ====================
$host = 'localhost';
$user = 'root';
$pass = '';
$db = 'medical_db';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB connection failed: ' . $conn->connect_error]);
    ob_end_flush();
    exit;
}

// ==================== HELPER FUNCTION ====================
function respond($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    ob_end_flush();
    exit;
}

// ==================== GET ACTION ====================
$action = $_POST['action'] ?? $_GET['action'] ?? '';

// Handle empty action
if (empty($action)) {
    respond(['success' => false, 'message' => 'No action specified'], 400);
}

// ==================== SESSION-BASED REQUEST DEDUPLICATION ====================
if (!isset($_SESSION['last_request'])) {
    $_SESSION['last_request'] = [];
}

// Only apply deduplication to registration, not login
if ($action === 'register') {
    // Create request fingerprint for registration only
    $request_fingerprint = $action . '_' . md5($username ?? '');
    $current_time = time();
    
    // Check if same registration request was made within last 3 seconds
    if (isset($_SESSION['last_request'][$request_fingerprint]) && 
        ($current_time - $_SESSION['last_request'][$request_fingerprint]) < 3) {
        respond(['success' => false, 'message' => 'Please wait before trying again.'], 429);
    }
    
    // Store current request only after successful validation
    // This prevents blocking corrections to invalid forms
}

// Clean up old requests (older than 10 seconds)
$current_time = time();
foreach ($_SESSION['last_request'] as $fp => $time) {
    if (($current_time - $time) > 10) {
        unset($_SESSION['last_request'][$fp]);
    }
}

// ==================== PUBLIC ACTIONS ====================
if (in_array($action, ['login', 'register', 'forgot_password', 'reset_password'])) {

    // ==================== REGISTER ====================
    if ($action === 'register') {
        // Rate limiting for registration
        if (!rateLimitCheck('register', 3, 600)) {
            respond(['success' => false, 'message' => 'Too many registration attempts. Please try again in 10 minutes.'], 429);
        }
        
        $username = sanitizeInput($_POST['username'] ?? '', 'string');
        $password = $_POST['password'] ?? '';
        $confirm = $_POST['confirm_password'] ?? '';
        $role = sanitizeInput($_POST['role'] ?? '', 'string');

        if (!$username || !$password || !$confirm || !$role) {
            respond(['success' => false, 'message' => 'All fields are required'], 400);
        }

        // Enhanced validation
        if (strlen($username) < 3 || strlen($username) > 50) {
            respond(['success' => false, 'message' => 'Username must be 3-50 characters'], 400);
        }
        
        if (!preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            respond(['success' => false, 'message' => 'Username can only contain letters, numbers, and underscores'], 400);
        }

        if (strlen($password) < 6) {
            respond(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
        }

        if ($password !== $confirm) {
            respond(['success' => false, 'message' => 'Passwords do not match'], 400);
        }

        // Validate role with whitelist
        $validRoles = ['doctor', 'nurse', 'admin'];
        if (!in_array($role, $validRoles)) {
            respond(['success' => false, 'message' => 'Invalid role selected'], 400);
        }

        // Use standard password hashing for compatibility
        $hash = password_hash($password, PASSWORD_DEFAULT);
        
        // Check if user exists with prepared statement
        $checkStmt = $conn->prepare("SELECT COUNT(*) as count FROM TBL_User WHERE Username = ?");
        $checkStmt->bind_param("s", $username);
        $checkStmt->execute();
        $result = $checkStmt->get_result();
        $row = $result->fetch_assoc();
        $checkStmt->close();
        
        if ($row['count'] > 0) {
            respond(['success' => false, 'message' => 'Username already exists'], 400);
        }
        
        // Try to insert directly - let MySQL unique constraint handle duplicates
        $stmt = $conn->prepare("INSERT INTO TBL_User (Username, Password_Hash, Role) VALUES (?,?,?)");
        $stmt->bind_param("sss", $username, $hash, $role);
        
        if ($stmt->execute()) {
            $stmt->close();
            
            // Store successful registration to prevent immediate duplicates
            $request_fingerprint = 'register_' . md5($username);
            $_SESSION['last_request'][$request_fingerprint] = time();
            
            respond(['success' => true, 'message' => 'Account created successfully!']);
        } else {
            $error = $stmt->error;
            $stmt->close();
            
            // Check if it's a duplicate entry error
            if (strpos($error, 'Duplicate entry') !== false) {
                respond(['success' => false, 'message' => 'Username already exists'], 400);
            } else {
                respond(['success' => false, 'message' => 'Registration failed: ' . $error], 500);
            }
        }
    }

    // ==================== LOGIN ====================
    if ($action === 'login') {
        // Rate limiting for login attempts
        if (!rateLimitCheck('login', 5, 300)) {
            respond(['success' => false, 'message' => 'Too many login attempts. Please try again in 5 minutes.'], 429);
        }
        
        $username = sanitizeInput($_POST['username'] ?? '', 'string');
        $password = $_POST['password'] ?? '';

        if (!$username || !$password) {
            respond(['success' => false, 'message' => 'Username and password required'], 400);
        }

        // Input validation
        if (strlen($username) < 3 || strlen($username) > 50) {
            respond(['success' => false, 'message' => 'Invalid username format'], 400);
        }

        $stmt = $conn->prepare("SELECT u.User_ID, u.Password_Hash, u.Is_Active, u.Role FROM TBL_User u WHERE u.Username=? LIMIT 1");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 0) {
            respond(['success' => false, 'message' => 'Invalid username or password'], 401);
        }

        $user = $result->fetch_assoc();
        if (!$user['Is_Active']) {
            respond(['success' => false, 'message' => 'User inactive'], 401);
        }

        if (password_verify($password, $user['Password_Hash'])) {
            // Regenerate session ID for security
            session_regenerate_id(true);
            
            $_SESSION['user_id'] = $user['User_ID'];
            $_SESSION['username'] = htmlspecialchars($username, ENT_QUOTES, 'UTF-8');
            $_SESSION['role'] = strtolower($user['Role'] ?? 'user');
            
            // Generate secure CSRF token
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            
            // Update last login with prepared statement
            $updateStmt = $conn->prepare("UPDATE TBL_User SET Last_Login=NOW() WHERE User_ID=?");
            $updateStmt->bind_param("i", $user['User_ID']);
            $updateStmt->execute();
            
            // Reset rate limit on successful login
            unset($_SESSION['rate_limit_login_' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown')]);
            
            respond(['success' => true, 'message' => 'Login successful']);
        } else {
            respond(['success' => false, 'message' => 'Invalid username or password'], 401);
        }
    }

    // ==================== FORGOT PASSWORD ====================
    if ($action === 'forgot_password') {
        $username = trim($_POST['username'] ?? '');

        if (!$username) {
            respond(['success' => false, 'message' => 'Username is required'], 400);
        }

        $stmt = $conn->prepare("SELECT User_ID, Reset_Token, Reset_Token_Expiry FROM TBL_User WHERE Username=? AND Is_Active=1 LIMIT 1");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            respond(['success' => false, 'message' => 'Username not found'], 404);
        }

        $user = $result->fetch_assoc();
        $now = date('Y-m-d H:i:s');

        if (!empty($user['Reset_Token']) && $user['Reset_Token_Expiry'] > $now) {
            respond([
                'success' => true,
                'message' => 'Password reset token already generated',
                'token' => $user['Reset_Token']
            ]);
        }

        $token = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);
        $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

        $stmt = $conn->prepare("UPDATE TBL_User SET Reset_Token=?, Reset_Token_Expiry=? WHERE User_ID=?");
        $stmt->bind_param("ssi", $token, $expiry, $user['User_ID']);

        if ($stmt->execute()) {
            respond([
                'success' => true,
                'message' => 'Password reset token generated successfully!',
                'token' => $token
            ]);
        } else {
            respond(['success' => false, 'message' => 'Failed to generate token'], 500);
        }
    }

    // ==================== RESET PASSWORD ====================
    if ($action === 'reset_password') {
        $username = trim($_POST['username'] ?? '');
        $token = trim($_POST['token'] ?? '');
        $newPassword = $_POST['new_password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';

        if (!$username || !$token || !$newPassword || !$confirmPassword) {
            respond(['success' => false, 'message' => 'All fields are required'], 400);
        }

        if (strlen($newPassword) < 6) {
            respond(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
        }

        if ($newPassword !== $confirmPassword) {
            respond(['success' => false, 'message' => 'Passwords do not match'], 400);
        }

        $stmt = $conn->prepare("SELECT User_ID FROM TBL_User WHERE Username=? AND Reset_Token=? AND Reset_Token_Expiry > NOW() AND Is_Active=1 LIMIT 1");
        $stmt->bind_param("ss", $username, $token);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            respond(['success' => false, 'message' => 'Invalid or expired reset token'], 401);
        }

        $user = $result->fetch_assoc();

        $hash = password_hash($newPassword, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("UPDATE TBL_User SET Password_Hash=?, Reset_Token=NULL, Reset_Token_Expiry=NULL WHERE User_ID=?");
        $stmt->bind_param("si", $hash, $user['User_ID']);

        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Password reset successfully! You can now login.']);
        } else {
            respond(['success' => false, 'message' => 'Failed to reset password'], 500);
        }
    }
}

// ==================== CHECK SESSION ====================
if (!isset($_SESSION['user_id'])) {
    respond(['success' => false, 'message' => 'Unauthorized. Please log in.'], 401);
}

// ==================== CSRF CHECK FOR POST ====================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    $session_token = $_SESSION['csrf_token'] ?? '';
    
    if (!hash_equals($session_token, $token)) {
        respond(['success' => false, 'message' => 'Invalid CSRF token. Please refresh the page and try again.'], 403);
    }
}

// ==================== CRUD / DROPDOWNS ====================
switch ($action) {

    case 'logout':
        session_destroy();
        respond(['success' => true, 'message' => 'Logged out']);

    // ==================== GET DROPDOWNS ====================
    case 'get_dropdowns':
        $countries = $genders = $patients = [];
        $res = $conn->query("SELECT Country_Rec_Ref, Country FROM TBL_Country WHERE In_Use=1 ORDER BY Country");
        while ($r = $res->fetch_assoc())
            $countries[] = $r;

        $res = $conn->query("SELECT Gender_Rec_Ref, Gender FROM TBL_Gender WHERE In_Use=1 ORDER BY Gender");
        while ($r = $res->fetch_assoc())
            $genders[] = $r;

        $res = $conn->query("SELECT Patient_ID, Patient_Name, Patient_Surname FROM TBL_Patient ORDER BY Patient_ID ASC");
        while ($r = $res->fetch_assoc())
            $patients[] = $r;

        respond(['success' => true, 'countries' => $countries, 'genders' => $genders, 'patients' => $patients]);

    // ==================== GET TOWNS ====================
    case 'get_towns':
        $countryId = intval($_GET['countryId'] ?? 0);
        if ($countryId <= 0)
            respond([]);
        $stmt = $conn->prepare("SELECT Town_Rec_Ref,Town FROM TBL_Town WHERE Country_Rec_Ref=? AND In_Use=1 ORDER BY Town");
        $stmt->bind_param("i", $countryId);
        $stmt->execute();
        $res = $stmt->get_result();
        $towns = [];
        while ($r = $res->fetch_assoc())
            $towns[] = $r;
        respond($towns);

    // ==================== GET PATIENTS ====================
    case 'get_patients':
        $q = "SELECT 
                p.Patient_ID, p.Patient_Number, p.Patient_Name, p.Patient_Surname, p.DOB, p.Add_1, p.Add_2, p.Add_3,
                p.Town_Rec_Ref, p.Country_Rec_Ref, p.Gender_Rec_Ref, p.Created_At,
                c.Country, t.Town, g.Gender, u.Username as Created_By
            FROM TBL_Patient p
            LEFT JOIN TBL_Country c ON p.Country_Rec_Ref = c.Country_Rec_Ref
            LEFT JOIN TBL_Town t ON p.Town_Rec_Ref = t.Town_Rec_Ref
            LEFT JOIN TBL_Gender g ON p.Gender_Rec_Ref = g.Gender_Rec_Ref
            LEFT JOIN TBL_User u ON p.Created_By_User_ID = u.User_ID
            ORDER BY p.Patient_ID DESC";

        $res = $conn->query($q);
        if (!$res)
            respond(['success' => false, 'message' => 'Query error: ' . $conn->error], 500);

        $patients = [];
        while ($r = $res->fetch_assoc())
            $patients[] = $r;
        respond(['success' => true, 'patients' => $patients]);

    // ==================== GET SINGLE PATIENT ====================
    case 'get_patient':
        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0)
            respond(['success' => false, 'message' => 'Invalid patient ID']);
        $stmt = $conn->prepare("SELECT Patient_ID,Patient_Number,Patient_Name,Patient_Surname,DOB,Add_1,Add_2,Add_3,Town_Rec_Ref,Country_Rec_Ref,Gender_Rec_Ref FROM TBL_Patient WHERE Patient_ID=? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 0)
            respond(['success' => false, 'message' => 'Patient not found']);
        respond(['success' => true, 'patient' => $res->fetch_assoc()]);

    // ==================== ADD PATIENT ====================
    case 'add_patient':
        $patientNumber = trim($_POST['Patient_Number'] ?? '');
        $name = trim($_POST['Patient_Name'] ?? '');
        $surname = trim($_POST['Patient_Surname'] ?? '');
        $dob = trim($_POST['DOB'] ?? '');
        $add1 = trim($_POST['Add_1'] ?? '');
        $add2 = trim($_POST['Add_2'] ?? '');
        $add3 = trim($_POST['Add_3'] ?? '');
        $town = intval($_POST['Town_Rec_Ref'] ?? 0);
        $country = intval($_POST['Country_Rec_Ref'] ?? 0);
        $gender = intval($_POST['Gender_Rec_Ref'] ?? 0);

        if (!$name || !$surname || !$country || !$town || !$gender) {
            $missing = [];
            if (!$name) $missing[] = 'Patient_Name';
            if (!$surname) $missing[] = 'Patient_Surname'; 
            if (!$country) $missing[] = 'Country_Rec_Ref';
            if (!$town) $missing[] = 'Town_Rec_Ref';
            if (!$gender) $missing[] = 'Gender_Rec_Ref';
            respond(['success' => false, 'message' => 'Required fields missing: ' . implode(', ', $missing)], 400);
        }

        // Validate Patient_Number format: 7 digits + 1 letter
        if ($patientNumber && !preg_match('/^[0-9]{7}[A-Z]$/', $patientNumber)) {
            respond(['success' => false, 'message' => 'Patient Number must be 7 digits followed by a letter (e.g., 1234567A)'], 400);
        }

        // Get current user ID for audit trail
        $currentUserId = $_SESSION['user_id'] ?? 1; // Fallback to user 1 if session issue

        $stmt = $conn->prepare("INSERT INTO TBL_Patient (Patient_Number, Patient_Name, Patient_Surname, DOB, Add_1, Add_2, Add_3, Town_Rec_Ref, Country_Rec_Ref, Gender_Rec_Ref, Created_By_User_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
        $stmt->bind_param("sssssssiiii", $patientNumber, $name, $surname, $dob, $add1, $add2, $add3, $town, $country, $gender, $currentUserId);

        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Patient added successfully', 'patient_id' => $stmt->insert_id]);
        } else {
            respond(['success' => false, 'message' => 'Failed to add patient: ' . $stmt->error], 500);
        }

    // ==================== UPDATE PATIENT ====================
    case 'update_patient':
        $id = intval($_POST['Patient_ID'] ?? 0);
        $patientNumber = trim($_POST['Patient_Number'] ?? '');
        $name = trim($_POST['Patient_Name'] ?? '');
        $surname = trim($_POST['Patient_Surname'] ?? '');
        $dob = trim($_POST['DOB'] ?? '');
        $add1 = trim($_POST['Add_1'] ?? '');
        $add2 = trim($_POST['Add_2'] ?? '');
        $add3 = trim($_POST['Add_3'] ?? '');
        $town = intval($_POST['Town_Rec_Ref'] ?? 0);
        $country = intval($_POST['Country_Rec_Ref'] ?? 0);
        $gender = intval($_POST['Gender_Rec_Ref'] ?? 0);

        if ($id <= 0 || !$name || !$surname || !$country || !$town || !$gender) {
            $missing = [];
            if ($id <= 0) $missing[] = 'Patient_ID';
            if (!$name) $missing[] = 'Patient_Name';
            if (!$surname) $missing[] = 'Patient_Surname'; 
            if (!$country) $missing[] = 'Country_Rec_Ref';
            if (!$town) $missing[] = 'Town_Rec_Ref';
            if (!$gender) $missing[] = 'Gender_Rec_Ref';
            respond(['success' => false, 'message' => 'Invalid data: ' . implode(', ', $missing) . ' missing or invalid'], 400);
        }

        // Validate Patient_Number format: 7 digits + 1 letter
        if ($patientNumber && !preg_match('/^[0-9]{7}[A-Z]$/', $patientNumber)) {
            respond(['success' => false, 'message' => 'Patient Number must be 7 digits followed by a letter (e.g., 1234567A)'], 400);
        }

        $stmt = $conn->prepare("UPDATE TBL_Patient SET Patient_Number=?, Patient_Name=?, Patient_Surname=?, DOB=?, Add_1=?, Add_2=?, Add_3=?, Town_Rec_Ref=?, Country_Rec_Ref=?, Gender_Rec_Ref=? WHERE Patient_ID=?");
        $stmt->bind_param("sssssssiiii", $patientNumber, $name, $surname, $dob, $add1, $add2, $add3, $town, $country, $gender, $id);

        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Patient updated successfully']);
        } else {
            respond(['success' => false, 'message' => 'Failed to update patient: ' . $stmt->error], 500);
        }

    // ==================== DELETE PATIENT ====================
    case 'delete_patient':
        $id = intval($_POST['Patient_ID'] ?? 0);
        if ($id <= 0)
            respond(['success' => false, 'message' => 'Invalid patient ID'], 400);

        $stmt = $conn->prepare("DELETE FROM TBL_Medication WHERE Patient_ID=?");
        $stmt->bind_param("i", $id);
        $stmt->execute();

        $stmt = $conn->prepare("DELETE FROM TBL_Patient WHERE Patient_ID=?");
        $stmt->bind_param("i", $id);

        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Patient deleted successfully']);
        } else {
            respond(['success' => false, 'message' => 'Failed to delete patient: ' . $stmt->error], 500);
        }

    // ==================== GET MEDICATIONS ====================
    case 'get_medications':
        // Check if table exists first
        $tableCheck = $conn->query("SHOW TABLES LIKE 'TBL_Medication'");
        if ($tableCheck->num_rows === 0) {
            respond(['success' => true, 'medications' => []]);
        }
        
        $q = "SELECT 
                m.Medication_Rec_Ref, m.System_Date, m.Remarks, m.Medication_Name, m.Created_At,
                p.Patient_ID, p.Patient_Number, p.Patient_Name, p.Patient_Surname, p.Country_Rec_Ref, p.Town_Rec_Ref, p.Gender_Rec_Ref,
                c.Country, t.Town, g.Gender, u.Username as Prescribed_By
            FROM TBL_Medication m
            INNER JOIN TBL_Patient p ON m.Patient_ID = p.Patient_ID
            LEFT JOIN TBL_Country c ON p.Country_Rec_Ref = c.Country_Rec_Ref
            LEFT JOIN TBL_Town t ON p.Town_Rec_Ref = t.Town_Rec_Ref
            LEFT JOIN TBL_Gender g ON p.Gender_Rec_Ref = g.Gender_Rec_Ref
            LEFT JOIN TBL_User u ON m.Prescribed_By_User_ID = u.User_ID
            ORDER BY m.Medication_Rec_Ref DESC";
        
        $res = $conn->query($q);
        if (!$res) {
            // If query fails, return empty array instead of error
            respond(['success' => true, 'medications' => []]);
        }
        
        $medications = [];
        while ($r = $res->fetch_assoc())
            $medications[] = $r;
        respond(['success' => true, 'medications' => $medications]);

    // ==================== GET SINGLE MEDICATION ====================
    case 'get_medication':
        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0)
            respond(['success' => false, 'message' => 'Invalid medication ID']);
        $stmt = $conn->prepare("SELECT 
                m.Medication_Rec_Ref, m.Patient_ID, m.Medication_Name, m.System_Date, m.Remarks,
                p.Patient_Number, p.Patient_Name, p.Patient_Surname
            FROM TBL_Medication m
            INNER JOIN TBL_Patient p ON m.Patient_ID = p.Patient_ID
            WHERE m.Medication_Rec_Ref=? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 0)
            respond(['success' => false, 'message' => 'Medication not found']);
        respond(['success' => true, 'medication' => $res->fetch_assoc()]);

    // ==================== ADD MEDICATION ====================
    case 'add_medication':
        // Check user role - only doctors and nurses can prescribe medications
        $userRole = $_SESSION['role'] ?? '';
        if (!in_array($userRole, ['doctor', 'nurse'])) {
            respond(['success' => false, 'message' => 'Access denied. Only doctors and nurses can prescribe medications. Current role: ' . $userRole], 403);
        }
        
        $patientId = intval($_POST['Patient_ID'] ?? 0);
        $medName = trim($_POST['Medication_Name'] ?? '');
        $systemDate = trim($_POST['System_Date'] ?? '');
        $remarks = trim($_POST['Remarks'] ?? '');
        
        if (!$patientId || !$medName || !$systemDate || !$remarks) {
            respond(['success' => false, 'message' => 'All fields required'], 400);
        }
        
        // Get current user ID for audit trail (who prescribed this medication)
        $currentUserId = $_SESSION['user_id'] ?? 1; // Fallback to user 1 if session issue
        
        $stmt = $conn->prepare("INSERT INTO TBL_Medication (Patient_ID, Medication_Name, System_Date, Remarks, Prescribed_By_User_ID) VALUES (?,?,?,?,?)");
        $stmt->bind_param("isssi", $patientId, $medName, $systemDate, $remarks, $currentUserId);
        
        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Medication added successfully', 'medication_id' => $stmt->insert_id]);
        } else {
            respond(['success' => false, 'message' => 'Failed to add medication: ' . $stmt->error], 500);
        }

    // ==================== UPDATE MEDICATION ====================
    case 'update_medication':
        $id = intval($_POST['Medication_Rec_Ref'] ?? 0);
        $patientId = intval($_POST['Patient_ID'] ?? 0);
        $medName = trim($_POST['Medication_Name'] ?? '');
        $systemDate = trim($_POST['System_Date'] ?? '');
        $remarks = trim($_POST['Remarks'] ?? '');
        
        if ($id <= 0 || !$patientId || !$medName || !$systemDate || !$remarks) {
            respond(['success' => false, 'message' => 'Invalid data'], 400);
        }
        
        $stmt = $conn->prepare("UPDATE TBL_Medication SET Patient_ID=?, Medication_Name=?, System_Date=?, Remarks=? WHERE Medication_Rec_Ref=?");
        $stmt->bind_param("isssi", $patientId, $medName, $systemDate, $remarks, $id);
        
        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Medication updated successfully']);
        } else {
            respond(['success' => false, 'message' => 'Failed to update medication: ' . $stmt->error], 500);
        }

    // ==================== DELETE MEDICATION ====================
    case 'delete_medication':
        $id = intval($_POST['Medication_Rec_Ref'] ?? 0);
        if ($id <= 0)
            respond(['success' => false, 'message' => 'Invalid medication ID'], 400);
        
        $stmt = $conn->prepare("DELETE FROM TBL_Medication WHERE Medication_Rec_Ref=?");
        $stmt->bind_param("i", $id);
        
        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Medication deleted successfully']);
        } else {
            respond(['success' => false, 'message' => 'Failed to delete medication: ' . $stmt->error], 500);
        }

    // ==================== AJAX AUTOCOMPLETE ====================
    case 'autocomplete_medications':
        error_log("Autocomplete medications called with term: " . ($_GET['term'] ?? 'none'));
        
        if (!isset($_GET['term']) || strlen(trim($_GET['term'])) < 2) {
            respond([]);
        }
        
        // Input filtering for XSS protection
        $term = filter_var(trim($_GET['term']), FILTER_SANITIZE_STRING);
        $term = htmlspecialchars($term, ENT_QUOTES, 'UTF-8');
        
        error_log("Filtered term: " . $term);
        
        $stmt = $conn->prepare("SELECT DISTINCT Medication_Name FROM TBL_Medication WHERE Medication_Name LIKE ? ORDER BY Medication_Name LIMIT 10");
        $searchTerm = '%' . $term . '%';
        $stmt->bind_param("s", $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $medications = [];
        while ($row = $result->fetch_assoc()) {
            // Output escaping for additional XSS protection
            $medications[] = htmlspecialchars($row['Medication_Name'], ENT_QUOTES, 'UTF-8');
        }
        
        error_log("Found medications: " . json_encode($medications));
        respond($medications);
        break;

    case 'autocomplete_doctors':
        if (!isset($_GET['term']) || strlen(trim($_GET['term'])) < 2) {
            respond([]);
        }
        
        // Input filtering for XSS protection
        $term = filter_var(trim($_GET['term']), FILTER_SANITIZE_STRING);
        $term = htmlspecialchars($term, ENT_QUOTES, 'UTF-8');
        
        $stmt = $conn->prepare("SELECT DISTINCT Prescribed_by FROM record WHERE Prescribed_by LIKE ? AND Prescribed_by IS NOT NULL ORDER BY Prescribed_by LIMIT 10");
        $searchTerm = '%' . $term . '%';
        $stmt->bind_param("s", $searchTerm);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $doctors = [];
        while ($row = $result->fetch_assoc()) {
            // Output escaping for additional XSS protection
            $doctors[] = htmlspecialchars($row['Prescribed_by'], ENT_QUOTES, 'UTF-8');
        }
        
        respond($doctors);
        break;

    default:
        respond(['success' => false, 'message' => 'Invalid action'], 400);
}

$conn->close();
ob_end_flush();
?>