<?php
if (php_sapi_name() === 'cli') {
    echo "This proxy should be called via HTTP from the public web root.";
    exit;
}

require_once __DIR__ . '/../src/backend.php';
exit;
