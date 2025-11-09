<?php
// index.php - Protected main application page with cookie preferences
session_start();

// Check if user is logged in
if (!isset($_SESSION['user_id']) || !isset($_SESSION['username'])) {
    header('Location: login.php');
    exit;
}

$username = $_SESSION['username'];
$role = $_SESSION['role'] ?? 'user';

// Get user preferences from cookies (default values if not set)
$darkMode = isset($_COOKIE['dark_mode']) ? $_COOKIE['dark_mode'] === 'true' : false;
$tableLimit = isset($_COOKIE['table_limit']) ? intval($_COOKIE['table_limit']) : 10;
?>
<!DOCTYPE html>
<html lang="en" class="<?php echo $darkMode ? 'dark-mode' : ''; ?>">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Patients & Medications - Medical System</title>
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: *; connect-src 'self' https://endlessmedical.com;">
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <!-- User Info Header -->
  <div class="user-header">
    <div class="user-info">
      <span>Welcome, <strong><?php echo htmlspecialchars($username); ?></strong></span>
      <span class="user-role">(<?php echo htmlspecialchars($role); ?>)</span>
    </div>
    <div class="user-actions">
      <!-- Settings Button -->
      <button id="settingsBtn" class="settings-btn" title="Settings">⚙️ Settings</button>
      <a href="logout.php" class="logout-link">Logout</a>
    </div>
  </div>

  <!-- Settings Modal -->
  <div id="settingsModal" class="modal">
    <div class="modal-content">
      <span class="close">&times;</span>
      <h2>User Preferences</h2>
      
      <div class="settings-section">
        <div class="setting-item">
          <label for="darkModeToggle">
            <span>🌙 Dark Mode</span>
            <input type="checkbox" id="darkModeToggle" <?php echo $darkMode ? 'checked' : ''; ?> />
          </label>
        </div>
        
        <div class="setting-item">
          <label for="tableLimitSelect">
            <span>📊 Rows per page:</span>
            <select id="tableLimitSelect">
              <option value="5" <?php echo $tableLimit === 5 ? 'selected' : ''; ?>>5</option>
              <option value="10" <?php echo $tableLimit === 10 ? 'selected' : ''; ?>>10</option>
              <option value="25" <?php echo $tableLimit === 25 ? 'selected' : ''; ?>>25</option>
              <option value="50" <?php echo $tableLimit === 50 ? 'selected' : ''; ?>>50</option>
              <option value="100" <?php echo $tableLimit === 100 ? 'selected' : ''; ?>>100</option>
            </select>
          </label>
        </div>
      </div>
      
      <div class="settings-footer">
        <button id="saveSettings" class="btn-primary">Save Preferences</button>
        <button id="resetSettings" class="btn-secondary">Reset to Default</button>
      </div>
    </div>
  </div>

  <h1>Patients & Medications Management</h1>

  <section class="section-container" aria-labelledby="patient-section-title">
    <h2 id="patient-section-title">Patient Management</h2>
    <form id="patientForm" aria-label="Patient form">
      <input type="hidden" name="Patient_ID" id="patientID" />
      <div class="form-group">
        <label for="patientName">Name:</label>
        <input type="text" id="patientName" name="Patient_Name" required />
      </div>
      <div class="form-group">
        <label for="patientSurname">Surname:</label>
        <input type="text" id="patientSurname" name="Patient_Surname" required />
      </div>
      <div class="form-group">
        <label for="address1">Address 1:</label>
        <input type="text" id="address1" name="Add_1" />
      </div>
      <div class="form-group">
        <label for="address2">Address 2:</label>
        <input type="text" id="address2" name="Add_2" />
      </div>
      <div class="form-group">
        <label for="address3">Address 3:</label>
        <input type="text" id="address3" name="Add_3" />
      </div>
      <div class="form-group">
        <label for="countrySelect">Country:</label>
        <select id="countrySelect" name="Country_Rec_Ref" required></select>
      </div>
      <div class="form-group">
        <label for="townSelect">Town:</label>
        <select id="townSelect" name="Town_Rec_Ref" required></select>
      </div>
      <div class="form-group">
        <label for="genderSelect">Gender:</label>
        <select id="genderSelect" name="Gender_Rec_Ref" required></select>
      </div>
      <div class="form-buttons">
        <button type="submit" id="savePatientBtn">Save / Update Patient</button>
        <button type="button" id="patientReset">Reset</button>
      </div>
    </form>
  </section>

  <hr />

  <section class="section-container" aria-labelledby="medication-section-title">
    <h2 id="medication-section-title">Medication Management</h2>
    <form id="medForm" aria-label="Medication form">
      <input type="hidden" name="Medication_Rec_Ref" id="medicationRef" />
      <div class="form-group">
        <label for="patientSelect">Patient:</label>
        <select id="patientSelect" name="Patient_ID" required></select>
      </div>
      <div class="form-group">
        <label for="medicationSelect">
          Medication: 
          <span class="loading-indicator" id="medLoadingIndicator" style="display: none;">⏳ Loading...</span>
        </label>
        <select id="medicationSelect" name="Medication_Name" required>
          <option value="">Loading medications...</option>
        </select>
      </div>
      <div class="form-group">
        <label for="systemDate">Date:</label>
        <input type="date" id="systemDate" name="System_Date" required />
      </div>
      <div class="form-group">
        <label for="remarks">Remarks:</label>
        <input type="text" id="remarks" name="Remarks" required maxlength="255" />
      </div>
      <div class="form-buttons">
        <button type="submit" id="saveMedBtn">Save / Update Medication</button>
        <button type="button" id="medReset">Reset</button>
      </div>
    </form>
  </section>

  <hr />

  <section class="section-container" aria-labelledby="table-section-title">
    <h2 id="table-section-title">Patients & Medications</h2>
    
    <!-- Pagination Controls -->
    <div class="pagination-controls">
      <div class="pagination-info">
        Showing <span id="paginationInfo">0-0 of 0</span> records
      </div>
      <div class="pagination-buttons">
        <button id="prevPageBtn" disabled>← Previous</button>
        <span id="pageNumbers"></span>
        <button id="nextPageBtn" disabled>Next →</button>
      </div>
    </div>
    
    <div class="table-container">
      <table id="patientTable" border="1" cellspacing="0" cellpadding="6">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Surname</th>
            <th>Country</th>
            <th>Town</th>
            <th>Gender</th>
            <th>Medication</th>
            <th>Date</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr><td colspan="10" style="text-align: center;">Loading...</td></tr>
        </tbody>
      </table>
    </div>
  </section>

  <script>
    // Pass PHP cookie values to JavaScript
    window.userPreferences = {
      darkMode: <?php echo $darkMode ? 'true' : 'false'; ?>,
      tableLimit: <?php echo $tableLimit; ?>
    };
  </script>
  <script src="main.js"></script>
</body>
</html>