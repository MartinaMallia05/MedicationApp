// js/main.js - Dashboard functionality
let allPatients = [];
let allMedications = [];
let allRecords = [];
let currentPage = 1;
let itemsPerPage = 10;
let dropdownsData = {};
let medicationsCache = [];
let csrfToken = '';

// ==================== HELPERS ====================
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

function getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

function showNotification(message, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('animate-fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ==================== API CALLS ====================
async function loadMedications() {
    const medicationSelect = document.getElementById('medicationSelect');
    const loadingIndicator = document.getElementById('medLoadingIndicator');

    medicationSelect.disabled = true;
    medicationSelect.innerHTML = '<option value="">Loading medications...</option>';
    if (loadingIndicator) loadingIndicator.style.display = 'inline';

    try {
        const res = await fetch('get_medications.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();

        if (data.success && Array.isArray(data.medications) && data.medications.length > 0) {
            medicationsCache = data.medications;
            medicationSelect.innerHTML = '<option value="">Select Medication</option>' +
                data.medications.map(med => `<option value="${escapeHtml(med)}">${escapeHtml(med)}</option>`).join('');
        } else throw new Error('Invalid medication data');

    } catch (err) {
        console.error('Medication load failed:', err);
        const fallbackMeds = ['Acetaminophen', 'Amoxicillin', 'Aspirin', 'Ibuprofen', 'Metformin'];
        medicationsCache = fallbackMeds;
        medicationSelect.innerHTML = '<option value="">Select Medication</option>' +
            fallbackMeds.map(med => `<option value="${med}">${med}</option>`).join('');
    } finally {
        medicationSelect.disabled = false;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

async function loadDropdowns() {
    try {
        const res = await fetch('backend.php?action=get_dropdowns');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load dropdowns');
        dropdownsData = data;

        document.getElementById('countrySelect').innerHTML = '<option value="">Select Country</option>' +
            (data.countries || []).map(c => `<option value="${c.Country_Rec_Ref}">${escapeHtml(c.Country)}</option>`).join('');
        document.getElementById('genderSelect').innerHTML = '<option value="">Select Gender</option>' +
            (data.genders || []).map(g => `<option value="${g.Gender_Rec_Ref}">${escapeHtml(g.Gender)}</option>`).join('');
        document.getElementById('patientSelect').innerHTML = '<option value="">Select Patient</option>' +
            (data.patients || []).map(p => `<option value="${p.Patient_ID}">${escapeHtml(p.Patient_Surname)}, ${escapeHtml(p.Patient_Name)}</option>`).join('');

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
                towns.map(t => `<option value="${t.Town_Rec_Ref}">${escapeHtml(t.Town)}</option>`).join('');
        } else townSelect.innerHTML = '<option value="">No towns available</option>';
    } catch {
        townSelect.innerHTML = '<option value="">Error loading towns</option>';
    }
}

async function loadAllData() {
    const tbody = document.querySelector('#patientTable tbody');
    tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500">Loading...</td></tr>';

    try {
        const patientsRes = await fetch('backend.php?action=get_patients');
        const patientsData = await patientsRes.json();

        if (!patientsData.success) throw new Error(patientsData.message || 'Failed to load patients');
        
        allPatients = patientsData.patients || [];
        
        try {
            const medicationsRes = await fetch('backend.php?action=get_medications');
            const medicationsData = await medicationsRes.json();
            allMedications = medicationsData.success ? (medicationsData.medications || []) : [];
        } catch (medError) {
            console.warn('Failed to load medications:', medError);
            allMedications = [];
        }

        combineRecords();
        currentPage = 1;
        renderTable();
        updatePagination();
    } catch (err) {
        console.error('Load data error:', err);
        tbody.innerHTML = `<tr><td colspan="10" class="px-4 py-8 text-center text-red-500">Error: ${err.message}</td></tr>`;
    }
}

function combineRecords() {
    allRecords = [];
    const medsByPatient = {};
    
    allMedications.forEach(med => {
        if (!medsByPatient[med.Patient_ID]) medsByPatient[med.Patient_ID] = [];
        medsByPatient[med.Patient_ID].push(med);
    });
    
    allPatients.forEach(patient => {
        const meds = medsByPatient[patient.Patient_ID] || [];
        if (meds.length === 0) {
            allRecords.push({...patient, Medication_Rec_Ref: null, Medication_Name: null, System_Date: null, Remarks: null});
        } else {
            meds.forEach(med => allRecords.push({...patient, ...med}));
        }
    });
}

function renderTable(records = null) {
    const tbody = document.querySelector('#patientTable tbody');
    tbody.innerHTML = '';
    
    const dataToRender = records !== null ? records : allRecords;
    
    if (!dataToRender.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No records found</td></tr>';
        return;
    }

    const start = (currentPage - 1) * itemsPerPage;
    const pageRecords = dataToRender.slice(start, start + itemsPerPage);

    pageRecords.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${record.Patient_ID}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${escapeHtml(record.Patient_Name) || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${escapeHtml(record.Patient_Surname) || ''}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${escapeHtml(record.Country) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${escapeHtml(record.Town) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${escapeHtml(record.Gender) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${record.Medication_Name ? escapeHtml(record.Medication_Name) : '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${record.System_Date || '-'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${record.Remarks ? escapeHtml(record.Remarks) : '-'}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex gap-1 flex-wrap">
                    <button onclick="editPatient(${record.Patient_ID})" class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">✏️ Edit</button>
                    ${record.Medication_Rec_Ref ? `<button onclick="editMedication(${record.Medication_Rec_Ref})" class="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600">💊 Med</button>` : ''}
                    ${record.Medication_Rec_Ref ? `<button onclick="deleteMedication(${record.Medication_Rec_Ref})" class="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600">🗑️ Med</button>` : ''}
                    <button onclick="deletePatient(${record.Patient_ID})" class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">🗑️ Patient</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updatePagination(totalRecords = null) {
    const total = totalRecords !== null ? totalRecords : allRecords.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, total);
    
    document.getElementById('paginationInfo').textContent = `${start}-${end} of ${total}`;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;
}

function nextPage() {
    const totalPages = Math.ceil(allRecords.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTable();
        updatePagination();
    }
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
        updatePagination();
    }
}

// ==================== SEARCH ====================
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (!searchTerm) {
            currentPage = 1;
            renderTable();
            updatePagination();
            return;
        }
        
        const filtered = allRecords.filter(record => 
            (record.Patient_Name?.toLowerCase().includes(searchTerm)) ||
            (record.Patient_Surname?.toLowerCase().includes(searchTerm)) ||
            (record.Country?.toLowerCase().includes(searchTerm)) ||
            (record.Town?.toLowerCase().includes(searchTerm)) ||
            (record.Gender?.toLowerCase().includes(searchTerm)) ||
            (record.Medication_Name?.toLowerCase().includes(searchTerm)) ||
            (record.Remarks?.toLowerCase().includes(searchTerm))
        );
        
        currentPage = 1;
        renderTable(filtered);
        updatePagination(filtered.length);
    });
}

// ==================== CRUD OPERATIONS ====================
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
    if (!confirm('Delete this patient and all associated medications?')) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'delete_patient');
        formData.append('Patient_ID', id);
        formData.append('csrf_token', csrfToken);
        
        const res = await fetch('backend.php', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            await loadAllData();
            await loadDropdowns();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Delete failed: ' + err.message, 'error');
    }
};

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
        showNotification('Failed to load medication: ' + err.message, 'error');
    }
};

window.deleteMedication = async function(id) {
    if (!confirm('Delete this medication record?')) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'delete_medication');
        formData.append('Medication_Rec_Ref', id);
        formData.append('csrf_token', csrfToken);
        
        const res = await fetch('backend.php', { method: 'POST', body: formData });
        const data = await res.json();
        
        if (data.success) {
            showNotification(data.message, 'success');
            await loadAllData();
        } else {
            showNotification(data.message, 'error');
        }
    } catch (err) {
        showNotification('Delete failed: ' + err.message, 'error');
    }
};

// ==================== FORMS ====================
function setupForms() {
    document.getElementById('patientForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const patientId = document.getElementById('patientID').value;
        formData.append('action', patientId ? 'update_patient' : 'add_patient');
        formData.append('csrf_token', csrfToken);
        
        try {
            const res = await fetch('backend.php', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.success) {
                showNotification(data.message, 'success');
                e.target.reset();
                document.getElementById('patientID').value = '';
                await loadAllData();
                await loadDropdowns();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (err) {
            showNotification('Operation failed: ' + err.message, 'error');
        }
    });
    
    document.getElementById('patientReset').addEventListener('click', () => {
        document.getElementById('patientForm').reset();
        document.getElementById('patientID').value = '';
        document.getElementById('townSelect').innerHTML = '<option value="">Select Country First</option>';
    });
    
    document.getElementById('medForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const medicationRef = document.getElementById('medicationRef').value;
        formData.append('action', medicationRef ? 'update_medication' : 'add_medication');
        formData.append('csrf_token', csrfToken);
        
        try {
            const res = await fetch('backend.php', { method: 'POST', body: formData });
            const data = await res.json();
            
            if (data.success) {
                showNotification(data.message, 'success');
                e.target.reset();
                document.getElementById('medicationRef').value = '';
                await loadAllData();
            } else {
                showNotification(data.message, 'error');
            }
        } catch (err) {
            showNotification('Operation failed: ' + err.message, 'error');
        }
    });
    
    document.getElementById('medReset').addEventListener('click', () => {
        document.getElementById('medForm').reset();
        document.getElementById('medicationRef').value = '';
    });
}

// ==================== SETTINGS ====================
function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = modal.querySelector('.close');
    
    settingsBtn.addEventListener('click', () => modal.style.display = 'flex');
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    document.getElementById('saveSettings').addEventListener('click', () => {
        const darkMode = document.getElementById('darkModeToggle').checked;
        const tableLimit = document.getElementById('tableLimitSelect').value;
        
        setCookie('dark_mode', darkMode, 365);
        setCookie('table_limit', tableLimit, 365);
        
        document.documentElement.className = darkMode ? 'dark' : '';
        itemsPerPage = parseInt(tableLimit);
        currentPage = 1;
        renderTable();
        updatePagination();
        
        modal.style.display = 'none';
        showNotification('Settings saved successfully!', 'success');
    });
    
    document.getElementById('resetSettings').addEventListener('click', () => {
        setCookie('dark_mode', 'false', 365);
        setCookie('table_limit', '10', 365);
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

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', async () => {
    csrfToken = getCsrfToken();
    
    // Apply saved settings
    const darkMode = getCookie('dark_mode') === 'true';
    const tableLimit = getCookie('table_limit');
    if (darkMode) document.documentElement.className = 'dark';
    if (tableLimit) itemsPerPage = parseInt(tableLimit);
    document.getElementById('darkModeToggle').checked = darkMode;
    
    setupSettingsModal();
    setupForms();
    setupSearch();
    document.getElementById('prevPageBtn').addEventListener('click', prevPage);
    document.getElementById('nextPageBtn').addEventListener('click', nextPage);
    
    await Promise.all([
        loadDropdowns(),
        loadMedications(),
        loadAllData()
    ]);
});