// js/record.js v5.0 - All Records functionality with Ajax autocomplete
let allRecords = [];
let filteredRecords = [];
let currentPage = 1;
let itemsPerPage = 10;

// ==================== LOAD RECORDS ====================
async function loadRecords() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="11" class="px-4 py-8 text-center text-gray-500">Loading records...</td></tr>';

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
        tbody.innerHTML = `<tr><td colspan="11" class="px-4 py-8 text-center text-red-500">Error: ${err.message}</td></tr>`;
    }
}

// ==================== RENDER RECORDS TABLE ====================
function renderRecordsTable() {
    const tbody = document.getElementById('recordsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!filteredRecords.length) {
        tbody.innerHTML = '<tr><td colspan="11" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">No records found</td></tr>';
        return;
    }

    // Get current table limit from user settings
    itemsPerPage = parseInt(window.commonUtils.getUserSetting('table_limit', '10'));

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
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${record.Prescribed_By ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}">
                    ${record.Prescribed_By ? '👨‍⚕️ ' + window.commonUtils.escapeHtml(record.Prescribed_By) : '❓ Unknown'}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.formatDate(record.System_Date)}</td>
            <td class="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">${window.commonUtils.escapeHtml(record.Remarks) || 'N/A'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Make renderRecordsTable globally available for settings sync
window.renderRecordsTable = renderRecordsTable;

// ==================== PAGINATION ====================
function updatePagination() {
    const info = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevPageBtn');
    const nextBtn = document.getElementById('nextPageBtn');
    
    if (!info || !prevBtn || !nextBtn) return;

    // Ensure we use current table limit
    itemsPerPage = parseInt(window.commonUtils.getUserSetting('table_limit', '10'));
    
    const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
    
    // Adjust current page if it's beyond the new total pages
    if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
    }
    
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
function performSearch() {
    const mainQuery = (document.getElementById('searchInput').value || '').toLowerCase().trim();
    const medicationQuery = (document.getElementById('medicationAutocomplete').value || '').toLowerCase().trim();
    
    filteredRecords = allRecords.filter(record => {
        let matches = true;
        
        // Check main search query (searches all fields)
        if (mainQuery) {
            const searchText = `
                ${record.Patient_Number || ''}
                ${record.Patient_Name} 
                ${record.Patient_Surname}
                ${record.Medication_Name}
                ${record.Town}
                ${record.Country}
            `.toLowerCase();
            
            matches = matches && searchText.includes(mainQuery);
        }
        
        // Check medication-specific query
        if (medicationQuery) {
            const medicationName = (record.Medication_Name || '').toLowerCase();
            matches = matches && medicationName.includes(medicationQuery);
        }
        
        return matches;
    });

    currentPage = 1;
    renderRecordsTable();
    updatePagination();
    
    // Show/hide clear button if any filter is active
    const clearBtn = document.getElementById('clearFilter');
    if (clearBtn) {
        clearBtn.style.display = (mainQuery || medicationQuery) ? 'block' : 'none';
    }
    
    console.log(`Filtered records: ${filteredRecords.length}/${allRecords.length}`);
}

function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', performSearch);
}

// ==================== INIT RECORDS PAGE ====================
document.addEventListener('DOMContentLoaded', async () => {
    // Get table limit from user-specific settings
    itemsPerPage = parseInt(window.commonUtils.getUserSetting('table_limit', '10'));
    
    setupSearch();
    
    // Initialize Ajax autocomplete for medication search (Assessment requirement)
    if (window.createAutocomplete) {
        const medicationInput = document.getElementById('medicationAutocomplete');
        
        // Add real-time filtering as user types in medication field
        if (medicationInput) {
            medicationInput.addEventListener('input', performSearch);
        }
        
        window.createAutocomplete('#medicationAutocomplete', 'backend.php?action=autocomplete_medications', {
            minLength: 2,
            onSelect: function(selectedMedication) {
                console.log('Ajax autocomplete selected:', selectedMedication);
                
                // Set the value and trigger search
                document.getElementById('medicationAutocomplete').value = selectedMedication;
                performSearch();
            }
        });
        
        // Add clear filter functionality
        const clearFilterBtn = document.getElementById('clearFilter');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', function() {
                // Reset both search fields
                document.getElementById('medicationAutocomplete').value = '';
                document.getElementById('searchInput').value = '';
                
                // Trigger unified search (which will show all records when both fields are empty)
                performSearch();
                
                console.log('Filters cleared - showing all records:', allRecords.length);
            });
        }
    }
    
    // Setup pagination buttons
    document.getElementById('prevPageBtn')?.addEventListener('click', window.prevPage);
    document.getElementById('nextPageBtn')?.addEventListener('click', window.nextPage);
    
    await loadRecords();
});