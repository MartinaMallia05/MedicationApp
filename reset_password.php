<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Password - Medical System</title>
  <link rel="stylesheet" href="style.css" />
  <style>
    #token {
      font-size: 24px;
      letter-spacing: 4px;
      text-align: center;
      font-family: monospace;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="auth-container">
    <div class="auth-box">
      <h1>Medical System</h1>
      <h2>Reset Password</h2>
      <p style="text-align: center; color: #666; margin-bottom: 20px;">
        Enter your 6-digit reset token and new password.
      </p>
      
      <form id="resetPasswordForm">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" required autofocus />
        </div>
        
        <div class="form-group">
          <label for="token">Reset Token (6 digits):</label>
          <input 
            type="text" 
            id="token" 
            name="token" 
            required 
            maxlength="6" 
            pattern="\d{6}"
            placeholder="000000"
            inputmode="numeric"
          />
          <small>Enter the 6-digit code you received</small>
        </div>
        
        <div class="form-group">
          <label for="new_password">New Password:</label>
          <input type="password" id="new_password" name="new_password" required 
                 minlength="6" />
          <small>At least 6 characters</small>
        </div>
        
        <div class="form-group">
          <label for="confirm_password">Confirm Password:</label>
          <input type="password" id="confirm_password" name="confirm_password" required />
        </div>
        
        <div id="resetMessage" class="message"></div>
        
        <div class="form-buttons">
          <button type="submit" id="resetBtn">Reset Password</button>
        </div>
      </form>
      
      <div class="auth-links">
        <a href="login.php">Back to Login</a>
        <a href="forgot_password.php">Request new token</a>
      </div>
    </div>
  </div>
  
  <script src="reset_password.js"></script>
</body>
</html>