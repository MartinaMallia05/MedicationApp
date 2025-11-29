document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const loginBtn = document.getElementById("loginBtn");

  // When login is submitted
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    
    // If fields are empty
    if (!username || !password) {
      showMessage("Please enter both username and password", "error");
      return;
    }
    
    loginBtn.disabled = true;
    // Show loading spinner
    loginBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>';
    
    // Prepare form data
    const formData = new FormData();
    formData.append("action", "login");
    formData.append("username", username);
    formData.append("password", password);
    
    // Send login request
    try {
      const res = await fetch("backend.php", {
        method: "POST",
        body: formData
      });

      // We show server messages
      let data = null;
      try {
        data = await res.json();
      } catch (e) {
      }

      if (!res.ok) {
        const serverMsg = data && data.message ? data.message : `HTTP error: ${res.status}`;
        throw new Error(serverMsg);
      }
      
      // Check success or failure
      if (data.success) {
        showMessage(data.message, "success");
        setTimeout(() => window.location.href = "index.php", 1000);
      } else {
        showMessage(data.message, "error");
        loginBtn.disabled = false;
        loginBtn.textContent = "Login";
      }
    } catch (err) {
      console.error("Login error:", err);
      showMessage("Login failed: " + err.message, "error");
      loginBtn.disabled = false;
      loginBtn.textContent = "Login";
    }
  });
  
  // Show error or success messages
  function showMessage(msg, type) {
    loginMessage.textContent = msg;
    loginMessage.className = type === "success" 
      ? "block rounded-lg p-4 text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border border-green-200 dark:border-green-700"
      : "block rounded-lg p-4 text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border border-red-200 dark:border-red-700";
  }
});