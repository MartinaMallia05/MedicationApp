// main.js - Complete version with medication API integration
let allPatients = [];
let currentPage = 1;
let itemsPerPage = 10;
let dropdownsData = {};
let medicationsCache = []; // Cache medications to avoid repeated API calls

// ==================== COOKIE HELPERS ====================
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

function setCookie(name, value, days = 30) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function deleteCookie(name) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

// ==================== COOKIE CONSENT POPUP ====================
function showCookieConsent() {
    const consent = getCookie('cookie_consent');
    if (consent) {
        const darkMode = getCookie('dark_mode') === 'true';
        const tableLimit = getCookie('table_limit');
        if (darkMode) document.documentElement.className = 'dark-mode';
        if (tableLimit) itemsPerPage = parseInt(tableLimit);
        return;
    }

    const popup = document.createElement('div');
    popup.id = 'cookieConsent';
    popup.innerHTML = `
        <div style="position: fixed; bottom: 0; left: 0; right: 0; background: var(--bg-secondary); 
                    border-top: 3px solid var(--accent-color); padding: 20px; z-index: 9999; 
                    display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
            <div style="flex: 1; min-width: 300px;">
                <h3 style="margin: 0 0 10px 0; color: var(--text-primary);">🍪 Cookie Preferences</h3>
                <p style="margin: 0 0 15px 0; color: var(--text-secondary); font-size: 14px;">
                    We use cookies to save your preferences. Choose your settings below:
                </p>
                <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 10px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" id="consentDarkMode" style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: var(--text-primary);">🌙 Enable Dark Mode</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <span style="color: var(--text-primary);">📊 Rows per page:</span>
                        <select id="consentTableLimit" style="padding: 5px 10px; border: 1px solid var(--input-border); 
                                border-radius: 5px; background: var(--input-bg); color: var(--text-primary); cursor: pointer;">
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </label>
                </div>
            </div>
            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button id="acceptCookies" style="padding: 12px 24px; background: var(--accent-color); 
                        color: white; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; 
                        transition: all 0.3s ease;">
                    ✓ Accept & Save
                </button>
                <button id="declineCookies" style="padding: 12px 24px; background: var(--text-secondary); 
                        color: white; border: none; border-radius: 5px; font-weight: 600; cursor: pointer; 
                        transition: all 0.3s ease;">
                    ✗ Use Defaults
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);

    document.getElementById('acceptCookies').addEventListener('click', () => {
        const darkMode = document.getElementById('consentDarkMode').checked;
        const tableLimit = document.getElementById('consentTableLimit').value;
        setCookie('cookie_consent', 'accepted', 365);
        setCookie('dark_mode', darkMode, 365);
        setCookie('table_limit', tableLimit, 365);
        if (darkMode) document.documentElement.className = 'dark-mode';
        itemsPerPage = parseInt(tableLimit);
        currentPage = 1;
        renderTable();
        updatePagination();
        popup.remove();
        showNotification('Preferences saved successfully!', 'success');
    });

    document.getElementById('declineCookies').addEventListener('click', () => {
        setCookie('cookie_consent', 'declined', 365);
        popup.remove();
        showNotification('Using default settings', 'info');
    });
}

// ==================== NOTIFICATIONS ====================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; padding: 15px 20px; 
        background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--accent-color)'}; 
        color: white; border-radius: 5px; box-shadow: 0 4px 12px var(--shadow); 
        z-index: 10000; animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== LOAD MEDICATIONS FROM API ====================
async function loadMedications() {
    const medicationSelect = document.getElementById('medicationSelect');
    const loadingIndicator = document.getElementById('medLoadingIndicator');

    medicationSelect.disabled = true;
    medicationSelect.innerHTML = '<option value="">Loading medications...</option>';
    if (loadingIndicator) loadingIndicator.style.display = 'inline';

    try {
        const res = await fetch('get_medications.php', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            cache: 'no-cache'
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        if (data.success && Array.isArray(data.medications) && data.medications.length > 0) {
            medicationsCache = data.medications;
            medicationSelect.innerHTML = '<option value="">Select Medication</option>' +
                data.medications.map(med => `<option value="${escapeHtml(med)}">${escapeHtml(med)}</option>`).join('');
        } else throw new Error('Invalid medication data');

    } catch (err) {
        console.error('Medication load failed:', err);
        const fallbackMeds = ['Acetaminophen', 'Amoxicillin', 'Aspirin'];
        medicationsCache = fallbackMeds;
        medicationSelect.innerHTML = '<option value="">Select Medication</option>' +
            fallbackMeds.map(med => `<option value="${med}">${med}</option>`).join('');
    } finally {
        medicationSelect.disabled = false;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}


// Helper function to escape HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== DROPDOWNS ====================
async function loadDropdowns() {
    try {
        const res = await fetch('backend.php?action=get_dropdowns');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load dropdowns');
        dropdownsData = data;

        document.getElementById('countrySelect').innerHTML = '<option value="">Select Country</option>' +
            (data.countries || []).map(c => `<option value="${c.Country_Rec_Ref}">${c.Country}</option>`).join('');
        document.getElementById('genderSelect').innerHTML = '<option value="">Select Gender</option>' +
            (data.genders || []).map(g => `<option value="${g.Gender_Rec_Ref}">${g.Gender}</option>`).join('');
        document.getElementById('patientSelect').innerHTML = '<option value="">Select Patient</option>' +
            (data.patients || []).map(p => `<option value="${p.Patient_ID}">${p.Patient_Surname}, ${p.Patient_Name}</option>`).join('');

        document.getElementById('countrySelect').addEventListener('change', async (e) => {
            await loadTowns(e.target.value);
        });
    } catch (err) {
        console.error('Dropdown error:', err);
        showNotification('Failed to load form data: ' + err.message, 'error');
    }
}

async function loadTowns(countryId) {
    const townSelect = document.getElementById('townSelect');
    townSelect.innerHTML = '<option value="">Loading towns...</option>';
    if (!countryId) return townSelect.innerHTML = '<option value="">Select Country First</option>';

    try {
        const res = await fetch(`backend.php?action=get_towns&countryId=${countryId}`);
        const towns = await res.json();
        if (Array.isArray(towns) && towns.length > 0) {
            townSelect.innerHTML = '<option value="">Select Town</option>' +
                towns.map(t => `<option value="${t.Town_Rec_Ref}">${t.Town}</option>`).join('');
        } else townSelect.innerHTML = '<option value="">No towns available</option>';
    } catch {
        townSelect.innerHTML = '<option value="">Error loading towns</option>';
    }
}

// ==================== PATIENTS TABLE ====================
async function loadPatientsTable() {
    const tbody = document.querySelector('#patientTable tbody');
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Loading...</td></tr>';

    try {
        const res = await fetch('backend.php?action=get_patients');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load patients');
        allPatients = data.patients || [];
        currentPage = 1;
        renderTable();
        updatePagination();
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:red;">Error: ${err.message}</td></tr>`;
    }
}

function renderTable() {
    const tbody = document.querySelector('#patientTable tbody');
    tbody.innerHTML = '';
    if (!allPatients.length) return tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No patients found</td></tr>';

    const start = (currentPage-1)*itemsPerPage;
    const pagePatients = allPatients.slice(start, start+itemsPerPage);

    pagePatients.forEach(p => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${p.Patient_ID}</td>
            <td>${p.Patient_Name||''}</td>
            <td>${p.Patient_Surname||''}</td>
            <td>${p.Country||'N/A'}</td>
            <td>${p.Town||'N/A'}</td>
            <td>${p.Gender||'N/A'}</td>
            <td>-</td><td>-</td><td>-</td>
            <td>
                <button onclick="editPatient(${p.Patient_ID})">Edit</button>
                <button onclick="deletePatient(${p.Patient_ID})">Delete</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePagination() {
    const totalPages = Math.ceil(allPatients.length/itemsPerPage);
    const start = (currentPage-1)*itemsPerPage+1;
    const end = Math.min(currentPage*itemsPerPage, allPatients.length);
    document.getElementById('paginationInfo').textContent = `${start}-${end} of ${allPatients.length}`;
    document.getElementById('prevPageBtn').disabled = currentPage===1;
    document.getElementById('nextPageBtn').disabled = currentPage>=totalPages;
}

function nextPage(){ 
    const totalPages = Math.ceil(allPatients.length/itemsPerPage); 
    if(currentPage<totalPages){
        currentPage++; 
        renderTable(); 
        updatePagination();
    } 
}

function prevPage(){ 
    if(currentPage>1){
        currentPage--; 
        renderTable(); 
        updatePagination();
    } 
}

// ==================== PATIENT CRUD ====================
window.editPatient = async function(id) {
    try {
        const res = await fetch(`backend.php?action=get_patient&id=${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        
        const p = data.patient;
        document.getElementById('patientID').value = p.Patient_ID;
        document.getElementById('patientName').value = p.Patient_Name;
        document.getElementById('patientSurname').value = p.Patient_Surname;
        document.getElementById('address1').value = p.Add_1 || '';
        document.getElementById('address2').value = p.Add_2 || '';
        document.getElementById('address3').value = p.Add_3 || '';
        document.getElementById('countrySelect').value = p.Country_Rec_Ref;
        await loadTowns(p.Country_Rec_Ref);
        document.getElementById('townSelect').value = p.Town_Rec_Ref;
        document.getElementById('genderSelect').value = p.Gender_Rec_Ref;
        
        document.querySelector('#patientForm').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        showNotification('Failed to load patient: ' + err.message, 'error');
    }
};

window.deletePatient = async function(id) {
    if (!confirm('Are you sure you want to delete this patient?')) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'delete_patient');
        formData.append('Patient_ID', id);
        
        const res = await fetch('backend.php', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            await loadPatientsTable();
            await loadDropdowns(); // Refresh patient dropdown
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Delete failed: ' + err.message, 'error');
    }
};

// ==================== FORM HANDLERS ====================
function setupForms() {
    // Patient Form
    document.getElementById('patientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const patientId = document.getElementById('patientID').value;
        formData.append('action', patientId ? 'update_patient' : 'add_patient');
        
        try {
            const res = await fetch('backend.php', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.success) {
                showNotification(data.message, 'success');
                e.target.reset();
                document.getElementById('patientID').value = '';
                await loadPatientsTable();
                await loadDropdowns(); // Refresh patient dropdown
            } else {
                showNotification(data.message, 'error');
            }
        } catch (err) {
            showNotification('Operation failed: ' + err.message, 'error');
        }
    });
    
    // Patient Reset
    document.getElementById('patientReset').addEventListener('click', () => {
        document.getElementById('patientForm').reset();
        document.getElementById('patientID').value = '';
        document.getElementById('townSelect').innerHTML = '<option value="">Select Country First</option>';
    });
    
    // Medication Form
    document.getElementById('medForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        showNotification('Medication form submitted (functionality to be implemented)', 'info');
    });
    
    // Medication Reset
    document.getElementById('medReset').addEventListener('click', () => {
        document.getElementById('medForm').reset();
        document.getElementById('medicationRef').value = '';
    });
}

// ==================== SETTINGS MODAL ====================
function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = modal.querySelector('.close');
    
    settingsBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    // Save Settings
    document.getElementById('saveSettings').addEventListener('click', () => {
        const darkMode = document.getElementById('darkModeToggle').checked;
        const tableLimit = document.getElementById('tableLimitSelect').value;
        
        setCookie('dark_mode', darkMode, 365);
        setCookie('table_limit', tableLimit, 365);
        
        document.documentElement.className = darkMode ? 'dark-mode' : '';
        itemsPerPage = parseInt(tableLimit);
        currentPage = 1;
        renderTable();
        updatePagination();
        
        modal.style.display = 'none';
        showNotification('Settings saved successfully!', 'success');
    });
    
    // Reset Settings
    document.getElementById('resetSettings').addEventListener('click', () => {
        deleteCookie('dark_mode');
        deleteCookie('table_limit');
        document.getElementById('darkModeToggle').checked = false;
        document.getElementById('tableLimitSelect').value = '10';
        document.documentElement.className = '';
        itemsPerPage = 10;
        currentPage = 1;
        renderTable();
        updatePagination();
        showNotification('Settings reset to defaults', 'info');
    });
}

// ==================== INITIALIZE ====================
document.addEventListener('DOMContentLoaded', async () => {
    showCookieConsent();
    setupSettingsModal();
    setupForms();
    document.getElementById('prevPageBtn').addEventListener('click', prevPage);
    document.getElementById('nextPageBtn').addEventListener('click', nextPage);
    
    // Load all data in parallel
    await Promise.all([
        loadDropdowns(),
        loadPatientsTable(),
        loadMedications() // Load medications from API
    ]);
});

// ==================== NOTIFICATION ANIMATION ====================
const style = document.createElement('style');
style.textContent = `
@keyframes slideIn{from{transform:translateX(400px);opacity:0;}to{transform:translateX(0);opacity:1;}}
@keyframes slideOut{from{transform:translateX(0);opacity:1;}to{transform:translateX(400px);opacity:0;}}
`;
document.head.appendChild(style);