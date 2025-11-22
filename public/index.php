<?php
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
    header('Location: login.php');
    exit;
}

// Generate CSRF token if not exists
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Load composer autoloader
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
echo TwigConfig::render('index.html.twig', [
    'username' => $username,
    'role' => $role,
    'csrfToken' => $csrfToken,
    'userId' => $userId,
    'darkMode' => $darkMode,
    'tableLimit' => $tableLimit
]);