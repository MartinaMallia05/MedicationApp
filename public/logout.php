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
    
    // Clear user session data but preserve accepted cookie consent
    Object.keys(localStorage).forEach(key => {
        // Preserve accepted cookie consent and user settings
        if (key.startsWith("settings_") || 
            (key.includes("cookie_consent") && localStorage.getItem(key) === "accepted") ||
            (key.includes("consent_") && key.includes("cookie_consent") && localStorage.getItem(key) === "accepted") ||
            (key.includes("analytics_enabled") && localStorage.getItem(key) === "true")) {
            console.log("[logout] Preserved:", key, "=", localStorage.getItem(key));
            return; // Skip removal
        }
        
        // Remove everything else: rejected consent, session data, user_id, etc.
        if (key.includes("cookie_consent") || 
            key.includes("consent_") || 
            key.includes("analytics_enabled") ||
            key.includes("cookie_consent_source") ||
            key.includes("cookie_consent_decided_at") ||
            key === "user_id" ||
            (key !== "dark_mode" && key !== "table_limit" && !key.startsWith("settings_"))) {
            localStorage.removeItem(key);
            console.log("[logout] Removed:", key);
        }
    });
    
    console.log("[logout] Cache cleared, accepted cookie consent and user settings preserved");
    
    // Redirect to login
    window.location.href = "login.php?cleared=" + Date.now();
</script>
</body>
</html>';
exit;
?>