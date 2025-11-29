<?php
if (php_sapi_name() === 'cli') {
    echo "This script is intended to be run via a web server.";
    exit;
}

// Backend script thats private
require_once __DIR__ . '/../src/backend.php';
exit;
