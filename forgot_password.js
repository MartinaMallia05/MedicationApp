// forgot_password.js - Fully fixed version
document.addEventListener("DOMContentLoaded", () => {
  const forgotForm = document.getElementById("forgotPasswordForm");
  const forgotMessage = document.getElementById("forgotMessage");
  const forgotBtn = document.getElementById("forgotBtn");

  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById("username");
    const username = usernameInput.value.trim();

    if (!username) {
      showMessage("Please enter your username", "error");
      return;
    }

    // Disable button during request
    forgotBtn.disabled = true;
    forgotBtn.textContent = "Processing...";

    const formData = new FormData();
    formData.append("action", "forgot_password");
    formData.append("username", username);

    try {
      const res = await fetch("backend.php", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

      const data = await res.json();

      if (data.success && data.token) {
        // Show token without clearing username input
        forgotMessage.innerHTML = `
          <div style="text-align: center; padding: 20px; background: #f0f9ff; border: 2px solid #0284c7; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 15px 0; color: #333; font-size: 16px; font-weight: 600;">
              ✓ Reset Token Generated Successfully!
            </p>
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 15px 0; border: 2px dashed #0284c7;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Your Reset Token:</p>
              <p style="margin: 0; font-size: 36px; font-weight: bold; color: #0284c7; letter-spacing: 4px; font-family: monospace;">
                ${data.token}
              </p>
              <button id="copyTokenBtn" style="margin-top: 10px; padding: 10px 20px; background: #0284c7; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                📋 Copy Token
              </button>
            </div>
            <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
              Token expires in 1 hour.
            </p>
            <a href="reset_password.php" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 5px; font-weight: 600;">
              → Go to Reset Password
            </a>
          </div>
        `;

        // Copy token functionality
        const copyBtn = document.getElementById("copyTokenBtn");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(data.token).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = "✓ Copied!";
            copyBtn.style.background = "#16a34a";
            setTimeout(() => {
              copyBtn.textContent = originalText;
              copyBtn.style.background = "#0284c7";
            }, 2000);
          }).catch(err => {
            alert("Failed to copy token. Please copy manually: " + data.token);
          });
        });

        // Enable button again
        forgotBtn.disabled = false;
        forgotBtn.textContent = "Request Reset Token";
      } else {
        showMessage(data.message || "Failed to generate token", "error");
        forgotBtn.disabled = false;
        forgotBtn.textContent = "Request Reset Token";
      }
    } catch (err) {
      console.error("Forgot password error:", err);
      showMessage("Request failed: " + err.message, "error");
      forgotBtn.disabled = false;
      forgotBtn.textContent = "Request Reset Token";
    }
  });

  function showMessage(msg, type) {
    forgotMessage.innerHTML = msg;
    forgotMessage.className = "message " + type;
  }
});
