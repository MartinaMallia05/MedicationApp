let allMedications = [];

// Load medications
async function loadMedicationRecords() {
    const tbody = document.getElementById('medicationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">Loading medications...</td></tr>';

    try {
        const res = await fetch('backend.php?action=get_medications');
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Failed to load medications');
        
        allMedications = data.medications || [];
        renderMedicationsTable();
    } catch (err) {
        console.error('Load medications error:', err);
        tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-8 text-center text-red-500">Error: ${err.message}</td></tr>`;
    }
}

// Load medications into table
function renderMedicationsTable() {
    const tbody = document.getElementById('medicationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!allMedications.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No medications found</td></tr>';
        return;
    }

    // Get table limit from user specific settings
    const tableLimit = parseInt(window.commonUtils.getUserSetting('table_limit', '10'));
    const recentMedications = allMedications.slice(0, tableLimit);

    recentMedications.forEach(med => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition';
        // Table with the Patient ID Card, Name, Medication, Date, Remarks, Actions (Prescribed_By is hidden)
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(med.Patient_Number) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(med.Patient_Surname)}, ${window.commonUtils.escapeHtml(med.Patient_Name)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(med.Medication_Name) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.formatDate(med.System_Date)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(med.Remarks) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex gap-1 flex-wrap">
                    <button onclick="editMedication(${med.Medication_Rec_Ref})" class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">✏️ Edit</button>
                    <button onclick="deleteMedication(${med.Medication_Rec_Ref})" class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">🗑️ Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Searchable dropdown for patients
let allPatients = [];

function setupPatientSearch() {
    const searchInput = document.getElementById('patientSearch');
    const dropdown = document.getElementById('patientDropdown');
    const hiddenInput = document.getElementById('selectedPatientId');
    
    if (!searchInput || !dropdown || !hiddenInput) return;
    
    // Load patients data
    loadPatientsForSearch();
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        if (query.length < 1) {
            dropdown.classList.add('hidden');
            return;
        }
        
        const filtered = allPatients.filter(patient => {
            const name = `${patient.Patient_Name} ${patient.Patient_Surname}`.toLowerCase();
            const number = patient.Patient_Number ? patient.Patient_Number.toLowerCase() : '';
            return name.includes(query) || number.includes(query);
        });
        
        displayPatientOptions(filtered);
        dropdown.classList.remove('hidden');
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

// Load patients for search dropdown
async function loadPatientsForSearch() {
    try {
        const res = await fetch('backend.php?action=get_patients');
        const data = await res.json();
        if (data.success) {
            allPatients = data.patients || [];
        }
    } catch (err) {
        console.error('Failed to load patients for search:', err);
    }
}

// Display patient options in dropdown
function displayPatientOptions(patients) {
    const dropdown = document.getElementById('patientDropdown');
    if (!dropdown) return;
    
    if (patients.length === 0) {
        dropdown.innerHTML = '<div class="px-4 py-2 text-gray-500 dark:text-gray-400">No patients found</div>';
        return;
    }
    
    dropdown.innerHTML = patients.map(patient => `
        <div class="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer patient-option" 
             data-id="${patient.Patient_ID}"
             data-name="${window.commonUtils.escapeHtml(patient.Patient_Name)} ${window.commonUtils.escapeHtml(patient.Patient_Surname)}"
             data-number="${window.commonUtils.escapeHtml(patient.Patient_Number) || 'N/A'}">
            <div class="font-medium text-gray-900 dark:text-gray-100">
                ${window.commonUtils.escapeHtml(patient.Patient_Surname)}, ${window.commonUtils.escapeHtml(patient.Patient_Name)}
            </div>
            <div class="text-sm text-gray-600 dark:text-gray-400">
                Patient ID Card: ${window.commonUtils.escapeHtml(patient.Patient_Number) || 'N/A'}
            </div>
        </div>
    `).join('');
    
    // Add click listeners
    dropdown.querySelectorAll('.patient-option').forEach(option => {
        option.addEventListener('click', () => {
            const patientId = option.getAttribute('data-id');
            const patientName = option.getAttribute('data-name');
            const patientNumber = option.getAttribute('data-number');
            
            document.getElementById('patientSearch').value = `${patientName} (ID Card: ${patientNumber})`;
            document.getElementById('selectedPatientId').value = patientId;
            dropdown.classList.add('hidden');
        });
    });
}

// Setup medication edit and delete
window.editMedication = async function(id) {
    try {
        const res = await fetch(`backend.php?action=get_medication&id=${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        
        const m = data.medication;
        document.getElementById('medicationRef').value = m.Medication_Rec_Ref;
        
        // Set patient search field
        const patientName = `${m.Patient_Name} ${m.Patient_Surname}`;
        const patientNumber = m.Patient_Number || 'N/A';
        document.getElementById('patientSearch').value = `${patientName} (ID Card: ${patientNumber})`;
        document.getElementById('selectedPatientId').value = m.Patient_ID;
        
        document.getElementById('medicationSelect').value = m.Medication_Name;
        document.getElementById('systemDate').value = m.System_Date;
        document.getElementById('remarks').value = m.Remarks;
        
        document.querySelector('#medForm').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        window.commonUtils.showNotification('Failed to load medication: ' + err.message, 'error');
    }
};

// Delete medication record
window.deleteMedication = async function(id) {
    if (!confirm('Delete this medication record?')) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'delete_medication');
        formData.append('Medication_Rec_Ref', id);
        formData.append('csrf_token', window.commonUtils.getCsrfToken());
        
        const res = await fetch('backend.php', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.success) {
            window.commonUtils.showNotification(data.message, 'success');
            await loadMedicationRecords();
        } else {
            window.commonUtils.showNotification(data.message, 'error');
        }
    } catch (err) {
        window.commonUtils.showNotification('Delete failed: ' + err.message, 'error');
    }
};

// Setup medication form
function setupMedicationForm() {
    const form = document.getElementById('medForm');
    if (!form) return;
    
    // Setup searchable dropdown for patient
    setupPatientSearch();
    
    const dateInput = document.getElementById('systemDate');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const medicationRef = document.getElementById('medicationRef').value;
        formData.append('action', medicationRef ? 'update_medication' : 'add_medication');
        formData.append('csrf_token', window.commonUtils.getCsrfToken());
        
        try {
            const res = await fetch('backend.php', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.success) {
                window.commonUtils.showNotification(data.message, 'success');
                e.target.reset();
                document.getElementById('medicationRef').value = '';
                if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
                await loadMedicationRecords();
            } else {
                window.commonUtils.showNotification(data.message, 'error');
            }
        } catch (err) {
            window.commonUtils.showNotification('Operation failed: ' + err.message, 'error');
        }
    });
    
    // Reset form
    document.getElementById('medReset')?.addEventListener('click', () => {
        form.reset();
        document.getElementById('medicationRef').value = '';
        document.getElementById('patientSearch').value = '';
        document.getElementById('selectedPatientId').value = '';
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    });
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    setupMedicationForm();
    await window.commonUtils.loadDropdowns();
    await window.commonUtils.loadMedications();
    await loadMedicationRecords();
});