<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
    header('Location: login.php');
    exit;
}

// Role-based access control (Only doctors and nurses can access medication management)
$userRole = $_SESSION['role'] ?? '';
if (!in_array($userRole, ['doctor', 'nurse'])) {
    // Admin users are completely blocked from medication page
    header('HTTP/1.1 403 Forbidden');
    echo '<!DOCTYPE html>
<html>
<head>
    <title>Access Denied</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
        .error-container { max-width: 500px; margin: 0 auto; padding: 20px; }
        .error-code { font-size: 72px; font-weight: bold; color: #d32f2f; }
        .error-message { font-size: 24px; margin: 20px 0; }
        .error-description { color: #666; margin-bottom: 30px; }
        .btn { background-color: #1976d2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="error-code">403</div>
        <div class="error-message">Access Denied</div>
        <div class="error-description">
            Only doctors and nurses can access the medication management system.<br>
            Your current role: <strong>' . htmlspecialchars($userRole) . '</strong>
        </div>
        <a href="index.php" class="btn">Return to Dashboard</a>
    </div>
</body>
</html>';
    exit;
}

// Generate CSRF token if not exists
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

use App\TwigConfig;

$username = $_SESSION['username'];
$role = $_SESSION['role'] ?? 'user';
$csrfToken = $_SESSION['csrf_token'];
$userId = $_SESSION['user_id'];

// Get user preferences from cookies
$darkMode = isset($_COOKIE['dark_mode']) ? $_COOKIE['dark_mode'] === 'true' : false;
$tableLimit = isset($_COOKIE['table_limit']) ? intval($_COOKIE['table_limit']) : 10;

// Render template
echo TwigConfig::render('medication.html.twig', [
    'username' => $username,
    'role' => $role,
    'csrfToken' => $csrfToken,
    'userId' => $userId,
    'darkMode' => $darkMode,
    'tableLimit' => $tableLimit
]);