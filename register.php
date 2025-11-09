<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Register - Medical System</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="auth-container">
    <div class="auth-box">
      <h1>Medical System</h1>
      <h2>Create Account</h2>
      
      <form id="registerForm">
        <div class="form-group">
          <label for="username">Username:</label>
          <input type="text" id="username" name="username" required autofocus 
                 minlength="3" maxlength="50" />
          <small>3-50 characters</small>
        </div>
        
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required 
                 minlength="6" />
          <small>At least 6 characters</small>
        </div>
        
        <div class="form-group">
          <label for="confirm_password">Confirm Password:</label>
          <input type="password" id="confirm_password" name="confirm_password" required />
        </div>
        
        <div id="registerMessage" class="message"></div>
        
        <div class="form-buttons">
          <button type="submit" id="registerBtn">Register</button>
        </div>
      </form>
      
      <div class="auth-links">
        <a href="login.php">Already have an account? Login</a>
      </div>
    </div>
  </div>
  
  <script src="register.js"></script>
</body>
</html>