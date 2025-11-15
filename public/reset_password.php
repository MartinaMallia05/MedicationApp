<?php
// public/reset_password.php
session_start();

if (isset($_SESSION['user_id'])) {
    header('Location: index.php');
    exit;
}

require_once __DIR__ . '/../vendor/autoload.php';

use App\TwigConfig;

$darkMode = isset($_COOKIE['dark_mode']) ? $_COOKIE['dark_mode'] === 'true' : false;

echo TwigConfig::render('reset_password.html.twig', [
    'darkMode' => $darkMode
]);