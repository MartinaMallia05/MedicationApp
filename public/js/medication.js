// js/medication.js - Medication management functionality
let allMedications = [];

// ==================== LOAD MEDICATIONS ====================
async function loadMedicationRecords() {
    const tbody = document.getElementById('medicationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500">Loading medications...</td></tr>';

    try {
        const res = await fetch('backend.php?action=get_medications');
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Failed to load medications');
        
        allMedications = data.medications || [];
        renderMedicationsTable();
    } catch (err) {
        console.error('Load medications error:', err);
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-red-500">Error: ${err.message}</td></tr>`;
    }
}

// ==================== RENDER MEDICATIONS TABLE ====================
function renderMedicationsTable() {
    const tbody = document.getElementById('medicationsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!allMedications.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No medications found</td></tr>';
        return;
    }

    // Get table limit from user-specific settings
    const tableLimit = parseInt(window.commonUtils.getUserSetting('table_limit', '10'));
    const recentMedications = allMedications.slice(-tableLimit).reverse();

    recentMedications.forEach(med => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(med.Patient_Surname)}, ${window.commonUtils.escapeHtml(med.Patient_Name)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(med.Medication_Name) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${med.System_Date || 'N/A'}</td>
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

// ==================== EDIT MEDICATION ====================
window.editMedication = async function(id) {
    try {
        const res = await fetch(`backend.php?action=get_medication&id=${id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        
        const m = data.medication;
        document.getElementById('medicationRef').value = m.Medication_Rec_Ref;
        document.getElementById('patientSelect').value = m.Patient_ID;
        document.getElementById('medicationSelect').value = m.Medication_Name;
        document.getElementById('systemDate').value = m.System_Date;
        document.getElementById('remarks').value = m.Remarks;
        
        document.querySelector('#medForm').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        window.commonUtils.showNotification('Failed to load medication: ' + err.message, 'error');
    }
};

// ==================== DELETE MEDICATION ====================
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

// ==================== SETUP MEDICATION FORM ====================
function setupMedicationForm() {
    const form = document.getElementById('medForm');
    if (!form) return;
    
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
    
    document.getElementById('medReset')?.addEventListener('click', () => {
        form.reset();
        document.getElementById('medicationRef').value = '';
        if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
    });
}

// ==================== INIT MEDICATIONS PAGE ====================
document.addEventListener('DOMContentLoaded', async () => {
    setupMedicationForm();
    await window.commonUtils.loadDropdowns();
    await window.commonUtils.loadMedications();
    await loadMedicationRecords();
});