// reset_password.js - Updated for 6-digit token
document.addEventListener("DOMContentLoaded", () => {
  const resetForm = document.getElementById("resetPasswordForm");
  const resetMessage = document.getElementById("resetMessage");
  const resetBtn = document.getElementById("resetBtn");
  const tokenInput = document.getElementById("token");
  
  // Format token input to only accept numbers and max 6 digits
  tokenInput.addEventListener("input", (e) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 6) {
      value = value.substring(0, 6);
    }
    e.target.value = value;
  });
  
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = document.getElementById("username").value.trim();
    const token = document.getElementById("token").value.trim();
    const newPassword = document.getElementById("new_password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    
    // Client-side validation
    if (!username || !token || !newPassword || !confirmPassword) {
      showMessage("Please fill in all fields", "error");
      return;
    }
    
    if (token.length !== 6) {
      showMessage("Reset token must be exactly 6 digits", "error");
      return;
    }
    
    if (!/^\d{6}$/.test(token)) {
      showMessage("Reset token must contain only numbers", "error");
      return;
    }
    
    if (newPassword.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }
    
    // Disable button during request
    resetBtn.disabled = true;
    resetBtn.textContent = "Resetting...";
    
    const formData = new FormData();
    formData.append("action", "reset_password");
    formData.append("username", username);
    formData.append("token", token);
    formData.append("new_password", newPassword);
    formData.append("confirm_password", confirmPassword);
    
    try {
      const res = await fetch("backend.php", {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.success) {
        showMessage("✓ Password reset successfully! Redirecting to login...", "success");
        resetForm.reset();
        // Redirect to login after short delay
        setTimeout(() => {
          window.location.href = "login.php";
        }, 2000);
      } else {
        showMessage(data.message, "error");
        resetBtn.disabled = false;
        resetBtn.textContent = "Reset Password";
      }
    } catch (err) {
      console.error("Reset password error:", err);
      showMessage("Reset failed: " + err.message, "error");
      resetBtn.disabled = false;
      resetBtn.textContent = "Reset Password";
    }
  });
  
  function showMessage(msg, type) {
    resetMessage.textContent = msg;
    resetMessage.className = "message " + type;
  }
});