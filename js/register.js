document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const registerMessage = document.getElementById("registerMessage");
  const registerBtn = document.getElementById("registerBtn");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm_password").value;
    
    if (!username || !password || !confirmPassword) {
      showMessage("Please fill in all fields", "error");
      return;
    }
    
    if (username.length < 3 || username.length > 50) {
      showMessage("Username must be 3-50 characters", "error");
      return;
    }
    
    if (password.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }
    
    if (password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }
    
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    
    const formData = new FormData();
    formData.append("action", "register");
    formData.append("username", username);
    formData.append("password", password);
    formData.append("confirm_password", confirmPassword);
    
    try {
      const res = await fetch("../src/backend.php", {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      
      const data = await res.json();
      
      if (data.success) {
        showMessage(data.message + " Redirecting to login...", "success");
        registerForm.reset();
        setTimeout(() => window.location.href = "login.php", 2000);
      } else {
        showMessage(data.message, "error");
        registerBtn.disabled = false;
        registerBtn.textContent = "Register";
      }
    } catch (err) {
      console.error("Registration error:", err);
      showMessage("Registration failed: " + err.message, "error");
      registerBtn.disabled = false;
      registerBtn.textContent = "Register";
    }
  });
  
  function showMessage(msg, type) {
    registerMessage.textContent = msg;
    registerMessage.className = type === "success" 
      ? "block rounded-lg p-4 text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border border-green-200 dark:border-green-700"
      : "block rounded-lg p-4 text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border border-red-200 dark:border-red-700";
  }
});