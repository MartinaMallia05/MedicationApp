<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
ob_start();
header('Content-Type: application/json');
header("Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;");

//  DATABASE CONNECTION 
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

//  HELPER FUNCTION 
function respond($data, $code = 200)
{
    http_response_code($code);
    echo json_encode($data);
    ob_end_flush();
    exit;
}

//  GET ACTION 
$action = $_POST['action'] ?? $_GET['action'] ?? '';

//  PUBLIC ACTIONS 
if (in_array($action, ['login', 'register', 'forgot_password', 'reset_password'])) {

    //  REGISTER 
    if ($action === 'register') {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';
        $confirm = $_POST['confirm_password'] ?? '';

        if (!$username || !$password || !$confirm) {
            respond(['success' => false, 'message' => 'All fields are required'], 400);
        }

        if (strlen($username) < 3 || strlen($username) > 50) {
            respond(['success' => false, 'message' => 'Username must be 3-50 characters'], 400);
        }

        if (strlen($password) < 6) {
            respond(['success' => false, 'message' => 'Password must be at least 6 characters'], 400);
        }

        if ($password !== $confirm) {
            respond(['success' => false, 'message' => 'Passwords do not match'], 400);
        }

        $stmt = $conn->prepare("SELECT User_ID FROM TBL_User WHERE Username=?");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $stmt->store_result();
        if ($stmt->num_rows > 0)
            respond(['success' => false, 'message' => 'Username already exists'], 400);

        $hash = password_hash($password, PASSWORD_DEFAULT);
        $stmt = $conn->prepare("INSERT INTO TBL_User (Username, Password_Hash) VALUES (?,?)");
        $stmt->bind_param("ss", $username, $hash);
        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Account created successfully!']);
        } else {
            respond(['success' => false, 'message' => 'Registration failed: ' . $stmt->error], 500);
        }
    }

    //  LOGIN 
    if ($action === 'login') {
        $username = trim($_POST['username'] ?? '');
        $password = $_POST['password'] ?? '';

        if (!$username || !$password)
            respond(['success' => false, 'message' => 'Username and password required'], 400);

        $stmt = $conn->prepare("SELECT User_ID, Password_Hash, Is_Active, Role FROM TBL_User WHERE Username=? LIMIT 1");
        $stmt->bind_param("s", $username);
        $stmt->execute();
        $result = $stmt->get_result();
        if ($result->num_rows === 0)
            respond(['success' => false, 'message' => 'Invalid username or password'], 401);

        $user = $result->fetch_assoc();
        if (!$user['Is_Active'])
            respond(['success' => false, 'message' => 'User inactive'], 401);

        if (password_verify($password, $user['Password_Hash'])) {
            $_SESSION['user_id'] = $user['User_ID'];
            $_SESSION['username'] = $username;
            $_SESSION['role'] = $user['Role'] ?? 'user';
            
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            
            $conn->query("UPDATE TBL_User SET Last_Login=NOW() WHERE User_ID=" . $user['User_ID']);
            respond(['success' => true, 'message' => 'Login successful']);
        } else {
            respond(['success' => false, 'message' => 'Invalid username or password'], 401);
        }
    }

    //  FORGOT PASSWORD 
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

    //  RESET PASSWORD 
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

//  CHECK SESSION 
if (!isset($_SESSION['user_id'])) {
    respond(['success' => false, 'message' => 'Unauthorized. Please log in.'], 401);
}

//  CSRF CHECK FOR POST 
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        respond(['success' => false, 'message' => 'Invalid CSRF token'], 403);
    }
}

//  CRUD / DROPDOWNS 
switch ($action) {

    case 'logout':
        session_destroy();
        respond(['success' => true, 'message' => 'Logged out']);

    //  GET DROPDOWNS 
    case 'get_dropdowns':
        $countries = $genders = $patients = [];
        $res = $conn->query("SELECT Country_Rec_Ref, Country FROM TBL_Country WHERE In_Use=1 ORDER BY Country");
        while ($r = $res->fetch_assoc())
            $countries[] = $r;

        $res = $conn->query("SELECT Gender_Rec_Ref, Gender FROM TBL_Gender WHERE In_Use=1 ORDER BY Gender");
        while ($r = $res->fetch_assoc())
            $genders[] = $r;

        $res = $conn->query("SELECT Patient_ID, Patient_Name, Patient_Surname FROM TBL_Patient ORDER BY Patient_Surname,Patient_Name");
        while ($r = $res->fetch_assoc())
            $patients[] = $r;

        respond(['success' => true, 'countries' => $countries, 'genders' => $genders, 'patients' => $patients]);

    //  GET TOWNS 
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

    //  GET PATIENTS 
    case 'get_patients':
        $q = "SELECT 
                p.Patient_ID, p.Patient_Name, p.Patient_Surname, p.Add_1, p.Add_2, p.Add_3,
                p.Town_Rec_Ref, p.Country_Rec_Ref, p.Gender_Rec_Ref,
                c.Country, t.Town, g.Gender
            FROM TBL_Patient p
            LEFT JOIN TBL_Country c ON p.Country_Rec_Ref = c.Country_Rec_Ref
            LEFT JOIN TBL_Town t ON p.Town_Rec_Ref = t.Town_Rec_Ref
            LEFT JOIN TBL_Gender g ON p.Gender_Rec_Ref = g.Gender_Rec_Ref
            ORDER BY p.Patient_Surname, p.Patient_Name";

        $res = $conn->query($q);
        if (!$res)
            respond(['success' => false, 'message' => 'Query error: ' . $conn->error], 500);

        $patients = [];
        while ($r = $res->fetch_assoc())
            $patients[] = $r;
        respond(['success' => true, 'patients' => $patients]);

    //  GET SINGLE PATIENT 
    case 'get_patient':
        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0)
            respond(['success' => false, 'message' => 'Invalid patient ID']);
        $stmt = $conn->prepare("SELECT Patient_ID,Patient_Name,Patient_Surname,Add_1,Add_2,Add_3,Town_Rec_Ref,Country_Rec_Ref,Gender_Rec_Ref FROM TBL_Patient WHERE Patient_ID=? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 0)
            respond(['success' => false, 'message' => 'Patient not found']);
        respond(['success' => true, 'patient' => $res->fetch_assoc()]);

    //  ADD PATIENT 
    case 'add_patient':
        $name = trim($_POST['Patient_Name'] ?? '');
        $surname = trim($_POST['Patient_Surname'] ?? '');
        $add1 = trim($_POST['Add_1'] ?? '');
        $add2 = trim($_POST['Add_2'] ?? '');
        $add3 = trim($_POST['Add_3'] ?? '');
        $town = intval($_POST['Town_Rec_Ref'] ?? 0);
        $country = intval($_POST['Country_Rec_Ref'] ?? 0);
        $gender = intval($_POST['Gender_Rec_Ref'] ?? 0);

        if (!$name || !$surname || !$country || !$town || !$gender) {
            respond(['success' => false, 'message' => 'Required fields missing'], 400);
        }

        $stmt = $conn->prepare("INSERT INTO TBL_Patient (Patient_Name, Patient_Surname, Add_1, Add_2, Add_3, Town_Rec_Ref, Country_Rec_Ref, Gender_Rec_Ref) VALUES (?,?,?,?,?,?,?,?)");
        $stmt->bind_param("sssssiii", $name, $surname, $add1, $add2, $add3, $town, $country, $gender);

        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Patient added successfully', 'patient_id' => $stmt->insert_id]);
        } else {
            respond(['success' => false, 'message' => 'Failed to add patient: ' . $stmt->error], 500);
        }

    //  UPDATE PATIENT 
    case 'update_patient':
        $id = intval($_POST['Patient_ID'] ?? 0);
        $name = trim($_POST['Patient_Name'] ?? '');
        $surname = trim($_POST['Patient_Surname'] ?? '');
        $add1 = trim($_POST['Add_1'] ?? '');
        $add2 = trim($_POST['Add_2'] ?? '');
        $add3 = trim($_POST['Add_3'] ?? '');
        $town = intval($_POST['Town_Rec_Ref'] ?? 0);
        $country = intval($_POST['Country_Rec_Ref'] ?? 0);
        $gender = intval($_POST['Gender_Rec_Ref'] ?? 0);

        if ($id <= 0 || !$name || !$surname || !$country || !$town || !$gender) {
            respond(['success' => false, 'message' => 'Invalid data'], 400);
        }

        $stmt = $conn->prepare("UPDATE TBL_Patient SET Patient_Name=?, Patient_Surname=?, Add_1=?, Add_2=?, Add_3=?, Town_Rec_Ref=?, Country_Rec_Ref=?, Gender_Rec_Ref=? WHERE Patient_ID=?");
        $stmt->bind_param("ssssiiii", $name, $surname, $add1, $add2, $add3, $town, $country, $gender, $id);

        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Patient updated successfully']);
        } else {
            respond(['success' => false, 'message' => 'Failed to update patient: ' . $stmt->error], 500);
        }

    //  DELETE PATIENT 
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

    //  GET MEDICATIONS 
    case 'get_medications':
        // Check if table exists first
        $tableCheck = $conn->query("SHOW TABLES LIKE 'TBL_Medication'");
        if ($tableCheck->num_rows === 0) {
            respond(['success' => true, 'medications' => []]);
        }
        
        $q = "SELECT 
                m.Medication_Rec_Ref, m.System_Date, m.Remarks, m.Medication_Name,
                p.Patient_ID, p.Patient_Name, p.Patient_Surname
            FROM TBL_Medication m
            INNER JOIN TBL_Patient p ON m.Patient_ID = p.Patient_ID
            ORDER BY m.System_Date DESC";
        
        $res = $conn->query($q);
        if (!$res) {
            // If query fails, return empty array instead of error
            respond(['success' => true, 'medications' => []]);
        }
        
        $medications = [];
        while ($r = $res->fetch_assoc())
            $medications[] = $r;
        respond(['success' => true, 'medications' => $medications]);

    //  GET SINGLE MEDICATION 
    case 'get_medication':
        $id = intval($_GET['id'] ?? 0);
        if ($id <= 0)
            respond(['success' => false, 'message' => 'Invalid medication ID']);
        $stmt = $conn->prepare("SELECT Medication_Rec_Ref, Patient_ID, Medication_Name, System_Date, Remarks FROM TBL_Medication WHERE Medication_Rec_Ref=? LIMIT 1");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $res = $stmt->get_result();
        if ($res->num_rows === 0)
            respond(['success' => false, 'message' => 'Medication not found']);
        respond(['success' => true, 'medication' => $res->fetch_assoc()]);

    //  ADD MEDICATION 
    case 'add_medication':
        $patientId = intval($_POST['Patient_ID'] ?? 0);
        $medName = trim($_POST['Medication_Name'] ?? '');
        $systemDate = trim($_POST['System_Date'] ?? '');
        $remarks = trim($_POST['Remarks'] ?? '');
        
        if (!$patientId || !$medName || !$systemDate || !$remarks) {
            respond(['success' => false, 'message' => 'All fields required'], 400);
        }
        
        $stmt = $conn->prepare("INSERT INTO TBL_Medication (Patient_ID, Medication_Name, System_Date, Remarks) VALUES (?,?,?,?)");
        $stmt->bind_param("isss", $patientId, $medName, $systemDate, $remarks);
        
        if ($stmt->execute()) {
            respond(['success' => true, 'message' => 'Medication added successfully', 'medication_id' => $stmt->insert_id]);
        } else {
            respond(['success' => false, 'message' => 'Failed to add medication: ' . $stmt->error], 500);
        }

    //  UPDATE MEDICATION 
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

    //  DELETE MEDICATION 
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

    default:
        respond(['success' => false, 'message' => 'Invalid action'], 400);
}

$conn->close();
ob_end_flush();
?>