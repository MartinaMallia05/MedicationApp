<?php
// public/logout.php
session_start();
session_unset();
session_destroy();

if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Clear session storage via JavaScript before redirect
echo '
<!DOCTYPE html>
<html>
<head><title>Logging out...</title></head>
<body>
<script>
    // Clear all session storage on logout
    sessionStorage.clear();
    console.log("[logout] Session storage cleared");
    
    // Clear specific cookie consent data
    localStorage.removeItem("cookie_consent");
    Object.keys(localStorage).forEach(key => {
        if (key.includes("consent_") && key.includes("cookie_consent")) {
            localStorage.removeItem(key);
        }
    });
    
    // Redirect to login
    window.location.href = "login.php";
</script>
</body>
</html>';
exit;
?>