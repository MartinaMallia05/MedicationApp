// Forget password button handler
document.addEventListener("DOMContentLoaded", () => {
  const forgotForm = document.getElementById("forgotPasswordForm");
  const forgotMessage = document.getElementById("forgotMessage");
  const forgotBtn = document.getElementById("forgotBtn");

  // If clicked
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById("username");
    const username = usernameInput.value.trim();

    if (!username) {
      showMessage("Please enter your username", "error");
      return;
    }

      let data = null;
      try { data = await res.json(); } catch (e) { }

    forgotBtn.disabled = true;
    forgotBtn.textContent = "Processing...";

    const formData = new FormData();
    formData.append("action", "forgot_password");
    formData.append("username", username);

    // If username is valid
    try {
      const res = await fetch("backend.php", {
        method: "POST",
        body: formData,
      });

      let data = null;
      try { data = await res.json(); } catch (e) { }

      if (!res.ok) {
        const msg = data && data.message ? data.message : `HTTP error: ${res.status}`;
        throw new Error(msg);
      }

      if (data && data.success && data.token) {
        forgotMessage.innerHTML = `
          <div class="bg-blue-50 dark:bg-blue-900 border-2 border-blue-500 rounded-lg p-6 text-center">
            <p class="text-green-600 dark:text-green-400 font-semibold mb-4">
              ✓ Reset Token Generated Successfully!
            </p>
            <div class="bg-white dark:bg-gray-800 border-2 border-dashed border-blue-500 rounded-lg p-4 mb-4">
              <p class="text-gray-600 dark:text-gray-400 text-sm mb-2">Your Reset Token:</p>
              <p class="text-4xl font-mono font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                ${data.token}
              </p>
              <button id="copyTokenBtn" class="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
                📋 Copy Token
              </button>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Token expires in 1 hour.
            </p>
            <a href="reset_password.php" class="inline-block px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition">
              → Go to Reset Password
            </a>
          </div>
        `;

        // Copy to clipboard 
        document.getElementById("copyTokenBtn").addEventListener("click", () => {
          navigator.clipboard.writeText(data.token).then(() => {
            const btn = document.getElementById("copyTokenBtn");
            btn.textContent = "Copied!";
            btn.className = "mt-3 px-4 py-2 bg-green-600 text-white rounded-lg";
            setTimeout(() => {
              btn.textContent = "Copy Token";
              btn.className = "mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition";
            }, 2000);
          }).catch(() => alert("Copy manually: " + data.token));
        });

        forgotBtn.disabled = false;
        forgotBtn.textContent = "Request Reset Token";
      } else {
        showMessage((data && data.message) || "Failed to generate token", "error");
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

  // Error or success message display
  function showMessage(msg, type) {
    forgotMessage.innerHTML = `<div class="rounded-lg p-4 text-sm font-medium ${
      type === 'error' 
        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 border border-red-200 dark:border-red-700' 
        : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 border border-green-200 dark:border-green-700'
    }">${msg}</div>`;
  }
});