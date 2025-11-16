// js/patient.js - Patient management functionality
let allPatients = [];

// ==================== LOAD PATIENTS ====================
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

// ==================== RENDER PATIENTS TABLE ====================
function renderPatientsTable() {
    const tbody = document.getElementById('patientsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!allPatients.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No patients found</td></tr>';
        return;
    }

    // Get table limit from user-specific settings
    const tableLimit = parseInt(window.commonUtils.getUserSetting('table_limit', '10'));
    const recentPatients = allPatients.slice(-tableLimit).reverse();

    recentPatients.forEach(patient => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition';
        
        // Build address string from parts
        const addressParts = [patient.Add_1, patient.Add_2, patient.Add_3].filter(a => a);
        const address = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';
        
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

// ==================== EDIT PATIENT ====================
window.editPatient = async function(id) {
    try {
        const res = await fetch(`backend.php?action=get_patient&id=${id}`);
        const data = await res.json();
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
        await window.commonUtils.loadTowns(p.Country_Rec_Ref);
        document.getElementById('townSelect').value = p.Town_Rec_Ref;
        document.getElementById('genderSelect').value = p.Gender_Rec_Ref;
        
        document.querySelector('#patientForm').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        window.commonUtils.showNotification('Failed to load patient: ' + err.message, 'error');
    }
};

// ==================== DELETE PATIENT ====================
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
            await loadPatients();
            await window.commonUtils.loadDropdowns();
        } else {
            window.commonUtils.showNotification(data.message, 'error');
        }
    } catch (err) {
        window.commonUtils.showNotification('Delete failed: ' + err.message, 'error');
    }
};

// ==================== SETUP PATIENT FORM ====================
function setupPatientForm() {
    const form = document.getElementById('patientForm');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const patientId = document.getElementById('patientID').value;
        formData.append('action', patientId ? 'update_patient' : 'add_patient');
        formData.append('csrf_token', window.commonUtils.getCsrfToken());
        
        try {
            const res = await fetch('backend.php', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.success) {
                window.commonUtils.showNotification(data.message, 'success');
                e.target.reset();
                document.getElementById('patientID').value = '';
                await loadPatients();
                await window.commonUtils.loadDropdowns();
            } else {
                window.commonUtils.showNotification(data.message, 'error');
            }
        } catch (err) {
            window.commonUtils.showNotification('Operation failed: ' + err.message, 'error');
        }
    });
    
    document.getElementById('patientReset')?.addEventListener('click', () => {
        form.reset();
        document.getElementById('patientID').value = '';
        document.getElementById('townSelect').innerHTML = '<option value="">Select Country First</option>';
    });
}

// ==================== INIT PATIENTS PAGE ====================
document.addEventListener('DOMContentLoaded', async () => {
    setupPatientForm();
    await window.commonUtils.loadDropdowns();
    await loadPatients();
});