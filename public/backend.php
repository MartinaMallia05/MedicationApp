<?php
// public/backend.php - proxy to src/backend.php
// This file allows frontend code in the `public` web root to call the API implemented in `src/backend.php`.
// It simply requires the implementation file so requests are handled the same way while keeping
// the implementation in `src/` for developer organization.

// Basic safety: ensure this file is executed only from a web request
if (php_sapi_name() === 'cli') {
    echo "This proxy should be called via HTTP from the public web root.";
    exit;
}

require_once __DIR__ . '/../src/backend.php';
exit;
