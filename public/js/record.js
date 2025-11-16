// js/record.js - All Records functionality (combined patients with medications)
let allRecords = [];
let filteredRecords = [];
let currentPage = 1;
let itemsPerPage = 10;

// ==================== LOAD RECORDS ====================
async function loadRecords() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500">Loading records...</td></tr>';

    try {
        // Get patients
        const patientsRes = await fetch('backend.php?action=get_patients');
        const patientsData = await patientsRes.json();
        
        // Get medications
        const medicationsRes = await fetch('backend.php?action=get_medications');
        const medicationsData = await medicationsRes.json();

        if (!patientsData.success || !medicationsData.success) {
            throw new Error('Failed to load records');
        }

        // Combine data: for each medication, attach patient info
        allRecords = (medicationsData.medications || []).map(med => ({
            ...med,
            Patient_ID: med.Patient_ID,
            Patient_Name: med.Patient_Name,
            Patient_Surname: med.Patient_Surname,
            Patient_Number: med.Patient_Number || 'N/A',
            Country: med.Country || 'N/A',
            Town: med.Town || 'N/A',
            Gender: med.Gender || 'N/A'
        }));
        
        // Sort by System_Date in ascending order (oldest first) for consistency
        allRecords.sort((a, b) => new Date(a.System_Date) - new Date(b.System_Date));

        filteredRecords = [...allRecords];
        currentPage = 1;
        renderRecordsTable();
        updatePagination();
    } catch (err) {
        console.error('Load records error:', err);
        tbody.innerHTML = `<tr><td colspan="10" class="px-4 py-8 text-center text-red-500">Error: ${err.message}</td></tr>`;
    }
}

// ==================== RENDER RECORDS TABLE ====================
function renderRecordsTable() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!filteredRecords.length) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No records found</td></tr>';
        return;
    }

    // Paginate
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageRecords = filteredRecords.slice(start, end);

    pageRecords.forEach(record => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 dark:hover:bg-gray-700 transition';
        row.innerHTML = `
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Patient_Number) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Patient_Name) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Patient_Surname) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Gender) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Country) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Town) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Medication_Name) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.formatDate(record.System_Date)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Remarks) || 'N/A'}</td>
            <td class="px-4 py-3 text-sm">
                <div class="flex gap-1 flex-wrap">
                    <button onclick="editRecord(${record.Medication_Rec_Ref})" class="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600">✏️ Edit</button>
                    <button onclick="deleteRecord(${record.Medication_Rec_Ref})" class="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600">🗑️ Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// ==================== PAGINATION ====================
function updatePagination() {
    const info = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (!info || !prevBtn || !nextBtn) return;

    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    info.textContent = `Page ${currentPage} of ${totalPages}`;
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

window.prevPage = function() {
    if (currentPage > 1) {
        currentPage--;
        renderRecordsTable();
        updatePagination();
    }
};

window.nextPage = function() {
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderRecordsTable();
        updatePagination();
    }
};

// ==================== SEARCH ====================
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        filteredRecords = allRecords.filter(record => {
            const searchText = `
                ${record.Patient_Name} 
                ${record.Patient_Surname}
                ${record.Medication_Name}
                ${record.Town}
                ${record.Country}
            `.toLowerCase();
            
            return searchText.includes(query);
        });

        currentPage = 1;
        renderRecordsTable();
        updatePagination();
    });
}

// ==================== EDIT RECORD ====================
window.editRecord = async function(id) {
    window.commonUtils.showNotification('Edit functionality coming soon', 'info');
};

// ==================== DELETE RECORD ====================
window.deleteRecord = async function(id) {
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
            await loadRecords();
        } else {
            window.commonUtils.showNotification(data.message, 'error');
        }
    } catch (err) {
        window.commonUtils.showNotification('Delete failed: ' + err.message, 'error');
    }
};

// ==================== SETTINGS ====================
function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = modal?.querySelector('.close');
    
    if (!modal || !settingsBtn || !closeBtn) return;
    
    // Load current settings
    const darkMode = window.commonUtils.getCookie('dark_mode') === 'true';
    const tableLimit = window.commonUtils.getCookie('table_limit') || '10';
    
    const darkModeToggle = document.getElementById('darkModeToggle');
    const tableLimitSelect = document.getElementById('tableLimitSelect');
    
    if (darkModeToggle) darkModeToggle.checked = darkMode;
    if (tableLimitSelect) tableLimitSelect.value = tableLimit;
    
    // Open modal
    settingsBtn.addEventListener('click', () => modal.style.display = 'flex');
    
    // Close modal
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
    
    // Save settings
    document.getElementById('saveSettings')?.addEventListener('click', () => {
        const darkMode = darkModeToggle?.checked || false;
        const tableLimit = tableLimitSelect?.value || '10';
        
        window.commonUtils.setCookie('dark_mode', darkMode, 365);
        window.commonUtils.setCookie('table_limit', tableLimit, 365);
        
        // Apply dark mode immediately
        document.documentElement.className = darkMode ? 'dark' : '';
        itemsPerPage = parseInt(tableLimit);
        
        modal.style.display = 'none';
        window.commonUtils.showNotification('Settings saved successfully!', 'success');
        
        // Reload page to apply table limit
        setTimeout(() => window.location.reload(), 1000);
    });
    
    // Reset settings
    document.getElementById('resetSettings')?.addEventListener('click', () => {
        window.commonUtils.setCookie('dark_mode', 'false', 365);
        window.commonUtils.setCookie('table_limit', '10', 365);
        
        if (darkModeToggle) darkModeToggle.checked = false;
        if (tableLimitSelect) tableLimitSelect.value = '10';
        
        document.documentElement.className = '';
        itemsPerPage = 10;
        
        window.commonUtils.showNotification('Settings reset to defaults', 'info');
        setTimeout(() => window.location.reload(), 1000);
    });
}

// ==================== INIT RECORDS PAGE ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Get table limit from user-specific settings
    itemsPerPage = parseInt(window.commonUtils.getUserSetting('table_limit', '10'));
    
    setupSearch();
    setupSettingsModal();
    
    // Setup pagination buttons
    document.getElementById('prevPageBtn')?.addEventListener('click', window.prevPage);
    document.getElementById('nextPageBtn')?.addEventListener('click', window.nextPage);
    
    await loadRecords();
});