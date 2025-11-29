let allPatients = [];

const originalFetch = window.fetch;
window.fetch = function(...args) {
    console.log('FETCH REQUEST:', args);
    return originalFetch.apply(this, args).catch(error => {
        console.error('FETCH ERROR:', error);
        throw error;
    });
};

// Laod patients from backend
async function loadPatients() {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-500">Loading patients...</td></tr>';

    try {
        const res = await fetch('backend.php?action=get_patients');
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Failed to load patients');
        
        allPatients = data.patients || [];
        renderPatientsTable();
    } catch (err) {
        console.error('Load patients error:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-red-500">Error: ${err.message}</td></tr>`;
    }
}

// Provide patients table
function renderPatientsTable() {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!allPatients.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No patients found</td></tr>';
        return;
    }

    // Get table limit from user specific settings
    const tableLimit = parseInt(window.commonUtils.getUserSetting('table_limit', '10'));
    const recentPatients = allPatients.slice(0, tableLimit);

    recentPatients.forEach((patient, index) => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition';
        
        // Build address string from parts
        const addressParts = [patient.Add_1, patient.Add_2, patient.Add_3].filter(a => a);
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
        
        // Populate row
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(patient.Patient_Number) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(patient.Patient_Name)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(patient.Patient_Surname)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.formatDate(patient.DOB)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(address)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(patient.Country) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(patient.Town) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(patient.Gender) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex gap-1 flex-wrap">
                    <button onclick="editPatient(${patient.Patient_ID})" class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">✏️ Edit</button>
                    <button onclick="deletePatient(${patient.Patient_ID})" class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">🗑️ Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Edit patient
window.editPatient = async function(id) {
    console.log('Edit patient called with ID:', id);
    try {
        const url = `backend.php?action=get_patient&id=${id}`;
        console.log('Fetching URL:', url);
        const res = await fetch(url);
        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Response data:', data);
        if (!data.success) throw new Error(data.message);
        
        const p = data.patient;
        document.getElementById('patientID').value = p.Patient_ID;
        document.getElementById('patientNumber').value = p.Patient_Number || '';
        document.getElementById('patientName').value = p.Patient_Name;
        document.getElementById('patientSurname').value = p.Patient_Surname;
        document.getElementById('dateOfBirth').value = p.DOB || '';
        document.getElementById('address1').value = p.Add_1 || '';
        document.getElementById('address2').value = p.Add_2 || '';
        document.getElementById('address3').value = p.Add_3 || '';
        document.getElementById('countrySelect').value = p.Country_Rec_Ref;
        // Load towns for selected country
        await window.commonUtils.loadTowns(p.Country_Rec_Ref);
        document.getElementById('townSelect').value = p.Town_Rec_Ref;
        document.getElementById('genderSelect').value = p.Gender_Rec_Ref;
        
        document.querySelector('#patientForm').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error('Edit patient error:', err);
        window.commonUtils.showNotification('Failed to load patient: ' + err.message, 'error');
    }
};

// Delete patient
window.deletePatient = async function(id) {
    if (!confirm('Delete this patient and all associated medications?')) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'delete_patient');
        formData.append('Patient_ID', id);
        formData.append('csrf_token', window.commonUtils.getCsrfToken());
        
        const res = await fetch('backend.php', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.success) {
            window.commonUtils.showNotification(data.message, 'success');
            // Reset form if the deleted patient was being edited
            await loadPatients();
            await window.commonUtils.loadDropdowns();
        } else {
            window.commonUtils.showNotification(data.message, 'error');
        }
    } catch (err) {
        window.commonUtils.showNotification('Delete failed: ' + err.message, 'error');
    }
};

// Setup patient form
function setupPatientForm() {
    const form = document.getElementById('patientForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('FORM SUBMISSION TRIGGERED!');
        console.log('Event target:', e.target);
        console.log('Submitter:', e.submitter);
        
        // Validate required fields before sending
        const patientId = document.getElementById('patientID').value;
        const name = document.getElementById('patientName').value.trim();
        const surname = document.getElementById('patientSurname').value.trim();
        const country = document.getElementById('countrySelect').value;
        const town = document.getElementById('townSelect').value;
        const gender = document.getElementById('genderSelect').value;
        
        console.log('PATIENT ID CHECK:', patientId, typeof patientId);
        console.log('IS UPDATE?', !!patientId);
        console.log('ACTION WILL BE:', patientId ? 'update_patient' : 'add_patient');
        
        // Validation
        if (!name || !surname || !country || !town || !gender) {
            console.log('CLIENT-SIDE VALIDATION FAILED');
            console.log('Missing:', {name, surname, country, town, gender});
            window.commonUtils.showNotification('Please fill in all required fields (Name, Surname, Country, Town, Gender)', 'error');
            return;
        }
        
        // Validation for update operations
        if (patientId && (isNaN(parseInt(patientId)) || parseInt(patientId) <= 0)) {
            console.log('INVALID PATIENT ID FOR UPDATE:', patientId);
            window.commonUtils.showNotification('Invalid Patient ID for update operation', 'error');
            return;
        }
        
        const formData = new FormData(e.target);
        
        // Ensure Patient_ID (Rec_Ref) is properly set for updates
        if (patientId) {
            formData.set('Patient_ID', patientId);
            console.log('SET Patient_ID for update:', patientId);
        }
        
        formData.append('action', patientId ? 'update_patient' : 'add_patient');
        formData.append('csrf_token', window.commonUtils.getCsrfToken());
        
        // Debug: Log form data with special attention to dropdowns
        console.log('Form submission details:');
        console.log('Patient ID:', patientId);
        console.log('Action:', patientId ? 'update_patient' : 'add_patient');
        console.log('CSRF Token:', window.commonUtils.getCsrfToken());
        
        // Special debugging for dropdown values
        const countrySelect = document.getElementById('countrySelect');
        const townSelect = document.getElementById('townSelect'); 
        const genderSelect = document.getElementById('genderSelect');
        console.log('Country dropdown - value:', countrySelect?.value, 'selectedIndex:', countrySelect?.selectedIndex);
        console.log('Town dropdown - value:', townSelect?.value, 'selectedIndex:', townSelect?.selectedIndex);
        console.log('Gender dropdown - value:', genderSelect?.value, 'selectedIndex:', genderSelect?.selectedIndex);
        
        // Log all form data entries
        console.log('All form data:');
        for (let [key, value] of formData.entries()) {
            console.log('  ', key, '=', value);
        }
        
        try {
            const res = await fetch('backend.php', { method: 'POST', body: formData });
            console.log('Response status:', res.status);
            const data = await res.json();
            console.log('Response data:', data);
            
            if (data.success) {
                window.commonUtils.showNotification(data.message, 'success');
                e.target.reset();
                document.getElementById('patientID').value = '';
                await loadPatients();
                await window.commonUtils.loadDropdowns();
            } else {
                console.error('Form submission failed:', data);
                window.commonUtils.showNotification(data.message, 'error');
            }
        } catch (err) {
            console.error('Form submission error:', err);
            window.commonUtils.showNotification('Operation failed: ' + err.message, 'error');
        }
    });
    
    // Reset form
    document.getElementById('patientReset')?.addEventListener('click', () => {
        form.reset();
        document.getElementById('patientID').value = '';
        document.getElementById('townSelect').innerHTML = '<option value="">Select Country First</option>';
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    setupPatientForm();
    await window.commonUtils.loadDropdowns();
    await loadPatients();
});