<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login - Medical System</title>
    <link rel="stylesheet" href="style.css" />
</head>

<body>
    <div class="auth-container">
        <div class="auth-box">
            <h1>Medical System</h1>
            <h2>Login</h2>

            <form id="loginForm">
                <div class="form-group">
                    <label for="username">Username:</label>
                    <input type="text" id="username" name="username" required autofocus autocomplete="username" />
                </div>

                <div class="form-group">
                    <label for="password">Password:</label>
                    <input type="password" id="password" name="password" required autocomplete="current-password" />
                </div>

                <div id="loginMessage" class="message"></div>

                <div class="form-buttons">
                    <button type="submit" id="loginBtn">Login</button>
                </div>
            </form>

            <div class="auth-links">
                <a href="register.php">Create an account</a>
                <a href="forgot_password.php">Forgot password?</a>
            </div>
        </div>
    </div>

    <script src="login.js"></script>
</body>

</html>