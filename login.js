document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const loginBtn = document.getElementById("loginBtn");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    
    // Client-side validation
    if (!username || !password) {
      showMessage("Please enter both username and password", "error");
      return;
    }
    
    // Disable button during request
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    
    const formData = new FormData();
    formData.append("action", "login");
    formData.append("username", username);
    formData.append("password", password);
    
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
        showMessage(data.message, "success");
        // Redirect to main app after short delay
        setTimeout(() => {
          window.location.href = "index.php";
        }, 1000);
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
  
  function showMessage(msg, type) {
    loginMessage.textContent = msg;
    loginMessage.className = "message " + type;
  }
});