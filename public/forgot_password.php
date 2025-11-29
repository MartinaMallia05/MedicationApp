<?php
session_start();

if (isset($_SESSION['user_id'])) {
    // User is already logged in redirect to homepage
    header('Location: index.php');
    exit;
}

// Load Twig
require_once __DIR__ . '/../vendor/autoload.php';

// Use TwigConfig to render the forgot password page
use App\TwigConfig;

// Determine dark mode from cookie
$darkMode = isset($_COOKIE['dark_mode']) ? $_COOKIE['dark_mode'] === 'true' : false;

echo TwigConfig::render('forgot_password.html.twig', [
    'darkMode' => $darkMode
]);