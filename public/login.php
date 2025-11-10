<?php
session_start();

// Redirect if already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

use App\TwigConfig;

// Get user preferences from cookies
$darkMode = isset($_COOKIE['dark_mode']) ? $_COOKIE['dark_mode'] === 'true' : false;

// Render template
echo TwigConfig::render('login.html.twig', [
    'darkMode' => $darkMode
]);