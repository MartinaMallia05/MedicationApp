// js/common.js - Shared utilities and functions across all pages

// ==================== GLOBAL VARIABLES ====================
let csrfToken = '';

// ==================== HELPER FUNCTIONS ====================
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
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
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

// ==================== API FUNCTIONS ====================
async function loadDropdowns() {
    try {
        const res = await fetch('backend.php?action=get_dropdowns');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load dropdowns');

        // Populate country dropdown
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.innerHTML = '<option value="">Select Country</option>' +
                (data.countries || []).map(c => `<option value="${c.Country_Rec_Ref}">${escapeHtml(c.Country)}</option>`).join('');
            
            // Add change listener for towns
            countrySelect.addEventListener('change', async (e) => {
                await loadTowns(e.target.value);
            });
        }

        // Populate gender dropdown
        const genderSelect = document.getElementById('genderSelect');
        if (genderSelect) {
            genderSelect.innerHTML = '<option value="">Select Gender</option>' +
                (data.genders || []).map(g => `<option value="${g.Gender_Rec_Ref}">${escapeHtml(g.Gender)}</option>`).join('');
        }

        // Populate patient dropdown
        const patientSelect = document.getElementById('patientSelect');
        if (patientSelect) {
            patientSelect.innerHTML = '<option value="">Select Patient</option>' +
                (data.patients || []).map(p => `<option value="${p.Patient_ID}">${escapeHtml(p.Patient_Surname)}, ${escapeHtml(p.Patient_Name)}</option>`).join('');
        }

        return data;
    } catch (err) {
        console.error('Dropdown error:', err);
        showNotification('Failed to load form data: ' + err.message, 'error');
        throw err;
    }
}

async function loadTowns(countryId) {
    const townSelect = document.getElementById('townSelect');
    if (!townSelect) return;
    
    townSelect.innerHTML = '<option value="">Loading towns...</option>';
    if (!countryId) {
        townSelect.innerHTML = '<option value="">Select Country First</option>';
        return;
    }

    try {
        const res = await fetch(`backend.php?action=get_towns&countryId=${countryId}`);
        const towns = await res.json();
        if (Array.isArray(towns) && towns.length > 0) {
            townSelect.innerHTML = '<option value="">Select Town</option>' +
                towns.map(t => `<option value="${t.Town_Rec_Ref}">${escapeHtml(t.Town)}</option>`).join('');
        } else {
            townSelect.innerHTML = '<option value="">No towns available</option>';
        }
    } catch (err) {
        console.error('Towns error:', err);
        townSelect.innerHTML = '<option value="">Error loading towns</option>';
    }
}

async function loadMedications() {
    const medicationSelect = document.getElementById('medicationSelect');
    const loadingIndicator = document.getElementById('medLoadingIndicator');
    
    if (!medicationSelect) return;

    medicationSelect.disabled = true;
    medicationSelect.innerHTML = '<option value="">Loading medications...</option>';
    if (loadingIndicator) loadingIndicator.style.display = 'inline';

    try {
        const res = await fetch('get_medications.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();

        if (data.success && Array.isArray(data.medications) && data.medications.length > 0) {
            medicationSelect.innerHTML = '<option value="">Select Medication</option>' +
                data.medications.map(med => `<option value="${escapeHtml(med)}">${escapeHtml(med)}</option>`).join('');
            return data.medications;
        } else {
            throw new Error('Invalid medication data');
        }
    } catch (err) {
        console.error('Medication load failed:', err);
        // Fallback medications
        const fallbackMeds = [
            'Acetaminophen', 'Amoxicillin', 'Aspirin', 'Ibuprofen', 
            'Metformin', 'Lisinopril', 'Atorvastatin', 'Omeprazole'
        ];
        medicationSelect.innerHTML = '<option value="">Select Medication</option>' +
            fallbackMeds.map(med => `<option value="${med}">${med}</option>`).join('');
        showNotification('Using default medication list', 'warning');
        return fallbackMeds;
    } finally {
        medicationSelect.disabled = false;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// ==================== USER-SPECIFIC SETTINGS (localStorage) ====================
function getUserId() {
    // ALWAYS get fresh user ID from meta tag on page load
    // This ensures we use the currently logged-in user's ID
    const metaTag = document.querySelector('meta[name="user-id"]');
    if (metaTag) {
        const userId = metaTag.getAttribute('content');
        if (userId) {
            // Update localStorage with current user ID
            localStorage.setItem('user_id', userId);
            console.log('Current user ID:', userId);
            return userId;
        }
    }
    
    // Fallback to previously stored user ID (for pages without meta tag)
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
        console.log('Using stored user ID:', storedUserId);
        return storedUserId;
    }
    
    // Last resort fallback
    console.warn('No user ID found, using guest');
    return 'guest';
}

function getSettingKey(key) {
    // Create user-specific setting key
    const currentUserId = getUserId();
    const settingKey = `settings_${currentUserId}_${key}`;
    console.log('Setting key:', settingKey);
    return settingKey;
}

function getUserSetting(key, defaultValue = null) {
    const storageKey = getSettingKey(key);
    const value = localStorage.getItem(storageKey);
    console.log(`Getting ${storageKey}:`, value || defaultValue);
    return value !== null ? value : defaultValue;
}

function setUserSetting(key, value) {
    const storageKey = getSettingKey(key);
    localStorage.setItem(storageKey, value);
    console.log(`Saved ${storageKey}:`, value);
}

// ==================== SETTINGS MODAL ====================
function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    const closeBtn = modal?.querySelector('.close');
    
    if (!modal || !settingsBtn || !closeBtn) return;
    
    // Load current user-specific settings
    const darkMode = getUserSetting('dark_mode') === 'true';
    const tableLimit = getUserSetting('table_limit', '10');
    
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
        
        // Save user-specific settings to localStorage
        setUserSetting('dark_mode', darkMode);
        setUserSetting('table_limit', tableLimit);
        
        // Apply dark mode immediately
        document.documentElement.className = darkMode ? 'dark' : '';
        
        modal.style.display = 'none';
        showNotification('Settings saved successfully!', 'success');
        
        // Reload page to apply table limit
        setTimeout(() => window.location.reload(), 1000);
    });
    
    // Reset settings
    document.getElementById('resetSettings')?.addEventListener('click', () => {
        setUserSetting('dark_mode', 'false');
        setUserSetting('table_limit', '10');
        
        if (darkModeToggle) darkModeToggle.checked = false;
        if (tableLimitSelect) tableLimitSelect.value = '10';
        
        document.documentElement.className = '';
        
        showNotification('Settings reset to defaults', 'info');
        setTimeout(() => window.location.reload(), 1000);
    });
}

// ==================== DARK MODE INITIALIZATION ====================
function initializeDarkMode() {
    // Load user-specific dark mode setting
    const darkMode = getUserSetting('dark_mode') === 'true';
    if (darkMode) {
        document.documentElement.classList.add('dark');
    }
}

// ==================== COOKIE CONSENT ====================
function showCookieConsent() {
    // Check if user has already made a choice using localStorage
    const cookieConsent = localStorage.getItem('cookie_consent');
    if (cookieConsent) return; // User has already decided, don't show again
    
    // Create cookie consent banner
    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.className = 'fixed bottom-0 left-0 right-0 bg-gray-800 dark:bg-gray-900 text-white p-4 shadow-lg z-50 animate-slide-in';
    banner.innerHTML = `
        <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex-1">
                    <p class="text-sm md:text-base">
                        🍪 We use cookies to enhance your experience, remember your preferences, and analyze usage patterns. 
                        By using our application, you agree to our use of cookies.
                    </p>
                </div>
                <div class="flex gap-3 flex-shrink-0">
                    <button id="acceptCookies" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                        ✓ Accept
                    </button>
                    <button id="rejectCookies" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                        ✗ Reject
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    // Accept cookies
    document.getElementById('acceptCookies').addEventListener('click', () => {
        localStorage.setItem('cookie_consent', 'accepted');
        localStorage.setItem('analytics_enabled', 'true');
        banner.classList.add('animate-fade-out');
        setTimeout(() => banner.remove(), 300);
        showNotification('Thank you! Cookies enabled.', 'success');
    });
    
    // Reject cookies
    document.getElementById('rejectCookies').addEventListener('click', () => {
        localStorage.setItem('cookie_consent', 'rejected');
        localStorage.setItem('analytics_enabled', 'false');
        banner.classList.add('animate-fade-out');
        setTimeout(() => banner.remove(), 300);
        showNotification('Cookies rejected. Essential cookies only.', 'info');
    });
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    csrfToken = getCsrfToken();
    initializeDarkMode();
    showCookieConsent(); // Show cookie consent for new users
    
    // Setup settings modal if it exists
    if (document.getElementById('settingsModal')) {
        setupSettingsModal();
    }
});

// ==================== EXPORT FOR USE IN OTHER SCRIPTS ====================
window.commonUtils = {
    getCookie,
    setCookie,
    getCsrfToken,
    escapeHtml,
    showNotification,
    loadDropdowns,
    loadTowns,
    loadMedications,
    getUserSetting,
    setUserSetting,
    getUserId
};