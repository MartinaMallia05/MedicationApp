<?php
// public/test_connection.php - Debug script to test database connection
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Database Connection Test</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .box { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: green; font-weight: bold; }
        .error { color: red; font-weight: bold; }
        .info { color: blue; }
        pre { background: #f8f8f8; padding: 10px; border-radius: 4px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>🔍 Database Connection Test</h1>
    
    <?php
    // Database credentials
    $host = 'localhost';
    $user = 'root';
    $pass = '';
    $db = 'medical_db';
    
    echo '<div class="box">';
    echo '<h2>Step 1: Testing MySQL Connection</h2>';
    
    $conn = @new mysqli($host, $user, $pass, $db);
    
    if ($conn->connect_error) {
        echo '<p class="error">❌ Connection failed: ' . $conn->connect_error . '</p>';
        echo '<p>Please check:</p>';
        echo '<ul>';
        echo '<li>MySQL server is running</li>';
        echo '<li>Database credentials are correct</li>';
        echo '<li>Database "' . $db . '" exists</li>';
        echo '</ul>';
        exit;
    }
    
    echo '<p class="success">✅ Connected successfully to database: ' . $db . '</p>';
    echo '</div>';
    
    // Check tables
    echo '<div class="box">';
    echo '<h2>Step 2: Checking Required Tables</h2>';
    
    $tables = ['TBL_User', 'TBL_Patient', 'TBL_Medication', 'TBL_Country', 'TBL_Town', 'TBL_Gender'];
    $missingTables = [];
    
    foreach ($tables as $table) {
        $result = $conn->query("SHOW TABLES LIKE '$table'");
        if ($result->num_rows > 0) {
            echo '<p class="success">✅ Table exists: ' . $table . '</p>';
        } else {
            echo '<p class="error">❌ Table missing: ' . $table . '</p>';
            $missingTables[] = $table;
        }
    }
    
    if (!empty($missingTables)) {
        echo '<p class="error">Please import your SQL schema to create missing tables.</p>';
    }
    echo '</div>';
    
    // Check table structures
    if (empty($missingTables)) {
        echo '<div class="box">';
        echo '<h2>Step 3: Table Structures</h2>';
        
        foreach ($tables as $table) {
            echo '<h3>' . $table . '</h3>';
            $result = $conn->query("DESCRIBE $table");
            if ($result) {
                echo '<pre>';
                while ($row = $result->fetch_assoc()) {
                    echo $row['Field'] . ' - ' . $row['Type'] . ' - ' . $row['Null'] . ' - ' . $row['Key'] . "\n";
                }
                echo '</pre>';
            }
        }
        echo '</div>';
        
        // Check data counts
        echo '<div class="box">';
        echo '<h2>Step 4: Data Counts</h2>';
        
        $dataTables = [
            'TBL_User' => 'Users',
            'TBL_Patient' => 'Patients',
            'TBL_Medication' => 'Medications',
            'TBL_Country' => 'Countries',
            'TBL_Town' => 'Towns',
            'TBL_Gender' => 'Genders'
        ];
        
        foreach ($dataTables as $table => $label) {
            $result = $conn->query("SELECT COUNT(*) as count FROM $table");
            if ($result) {
                $row = $result->fetch_assoc();
                $count = $row['count'];
                if ($count > 0) {
                    echo '<p class="success">✅ ' . $label . ': ' . $count . ' records</p>';
                } else {
                    echo '<p class="info">ℹ️ ' . $label . ': 0 records (empty table)</p>';
                }
            }
        }
        echo '</div>';
    }
    
    // Test API endpoints
    echo '<div class="box">';
    echo '<h2>Step 5: Test Backend API</h2>';
    echo '<p>Try these tests after logging in:</p>';
    echo '<ul>';
    echo '<li><a href="../src/backend.php?action=get_dropdowns" target="_blank">Test Get Dropdowns</a></li>';
    echo '<li><a href="../src/backend.php?action=get_patients" target="_blank">Test Get Patients</a></li>';
    echo '<li><a href="../src/backend.php?action=get_medications" target="_blank">Test Get Medications</a></li>';
    echo '</ul>';
    echo '<p class="info">Note: Some endpoints require authentication and will return 401 if not logged in.</p>';
    echo '</div>';
    
    // PHP Info
    echo '<div class="box">';
    echo '<h2>Step 6: PHP Configuration</h2>';
    echo '<p><strong>PHP Version:</strong> ' . phpversion() . '</p>';
    echo '<p><strong>Display Errors:</strong> ' . (ini_get('display_errors') ? 'On' : 'Off') . '</p>';
    echo '<p><strong>Error Reporting:</strong> ' . ini_get('error_reporting') . '</p>';
    echo '<p><strong>Session Support:</strong> ' . (function_exists('session_start') ? 'Yes' : 'No') . '</p>';
    echo '<p><strong>MySQLi Extension:</strong> ' . (extension_loaded('mysqli') ? 'Loaded' : 'Not Loaded') . '</p>';
    echo '</div>';
    
    // Check Composer
    echo '<div class="box">';
    echo '<h2>Step 7: Composer Dependencies</h2>';
    if (file_exists('../vendor/autoload.php')) {
        echo '<p class="success">✅ Composer vendor directory exists</p>';
        require_once '../vendor/autoload.php';
        if (class_exists('Twig\Environment')) {
            echo '<p class="success">✅ Twig is installed and working</p>';
        } else {
            echo '<p class="error">❌ Twig class not found</p>';
        }
    } else {
        echo '<p class="error">❌ Composer vendor directory not found</p>';
        echo '<p>Run: <code>composer install</code></p>';
    }
    echo '</div>';
    
    echo '<div class="box">';
    echo '<h2>✅ All Tests Complete</h2>';
    echo '<p>If all tests pass, your application should work correctly.</p>';
    echo '<p><a href="login.php">→ Go to Login Page</a></p>';
    echo '</div>';
    
    $conn->close();
    ?>
</body>
</html>