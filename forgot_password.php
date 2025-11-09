<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Forgot Password - Medical System</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="auth-container">
    <div class="auth-box">
      <h1>Medical System</h1>
      <h2>Forgot Password</h2>
      <p style="text-align: center; color: #666; margin-bottom: 20px;">
        Enter your username to receive a password reset token.
      </p>
      
      <form id="forgotPasswordForm">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" required autofocus />
        </div>
        
        <div id="forgotMessage" class="message"></div>
        
        <div class="form-buttons">
          <button type="submit" id="forgotBtn">Request Reset Token</button>
        </div>
      </form>
      
      <div class="auth-links">
        <a href="login.php">Back to Login</a>
        <a href="reset_password.php">Already have a token?</a>
      </div>
    </div>
  </div>
  
  <script src="forgot_password.js"></script>
</body>
</html>