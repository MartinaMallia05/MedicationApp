
let csrfToken = '';

// Common code in all 3 pages
function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Cookie with options
function setCookie(name, value, days = 30) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// CSRF token for secure requests
function getCsrfToken() {
    const metaTag = document.querySelector('meta[name="csrf-token"]');
    return metaTag ? metaTag.getAttribute('content') : '';
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

// Date format DD-MM-YYYY 
function formatDate(dateString) {
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'N/A';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    } catch (e) {
        return 'N/A';
    }
}

// Notification for when changes are made or errors
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

// Calling from the database
async function loadDropdowns() {
    try {
        const res = await fetch('backend.php?action=get_dropdowns');
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed to load dropdowns');

        // Country dropdown
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            countrySelect.innerHTML = '<option value="">Select Country</option>' +
                (data.countries || []).map(c => `<option value="${c.Country_Rec_Ref}">${escapeHtml(c.Country)}</option>`).join('');

            countrySelect.addEventListener('change', async (e) => {
                await loadTowns(e.target.value);
            });
        }

        // Gender dropdown
        const genderSelect = document.getElementById('genderSelect');
        if (genderSelect) {
            genderSelect.innerHTML = '<option value="">Select Gender</option>' +
                (data.genders || []).map(g => `<option value="${g.Gender_Rec_Ref}">${escapeHtml(g.Gender)}</option>`).join('');
        }

        // Patient dropdown
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

// Load towns depending on selected country
async function loadTowns(countryId) {
    const townSelect = document.getElementById('townSelect');
    if (!townSelect) return;

    // Show loading state
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

// API and if it fails
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

        // Populate
        medicationSelect.innerHTML = '<option value="">Select Medication</option>' +
            fallbackMeds.map(med => `<option value="${med}">${med}</option>`).join('');
        showNotification('Using default medication list', 'warning');
        return fallbackMeds;
    } finally {
        medicationSelect.disabled = false;
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }
}

// Making use of local storage 
function getUserId() {
    // User ID from on page load (Currenct user)
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

    // Else fallback
    const storedUserId = localStorage.getItem('user_id');
    if (storedUserId) {
        console.log('Using stored user ID:', storedUserId);
        return storedUserId;
    }

    // Else not found
    console.warn('No user ID found, using guest');
    return 'guest';
}

function getSettingKey(key) {
    // Specific cookies based on user ID
    const currentUserId = getUserId();
    const settingKey = `settings_${currentUserId}_${key}`;
    console.log('Setting key:', settingKey);
    return settingKey;
}

function getUserSetting(key, defaultValue = null) {
    const storageKey = getSettingKey(key);
    const value = localStorage.getItem(storageKey);
    
    // Defaults for guest user if cookies not accepted
    const currentUserId = getUserId();
    if (currentUserId === 'guest' && value === null) {
        if (key === 'dark_mode') {
            console.log(`Getting ${storageKey}: null, using guest default: false`);
            return 'false';
        }
        if (key === 'table_limit') {
            console.log(`Getting ${storageKey}: null, using guest default: 10`);
            return '10';
        }
    }
    
    console.log(`Getting ${storageKey}:`, value || defaultValue);
    return value !== null ? value : defaultValue;
}

function setUserSetting(key, value) {
    const storageKey = getSettingKey(key);
    localStorage.setItem(storageKey, value);
    console.log(`Saved ${storageKey}:`, value);

    // All pages are updated
    window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: { key, value, storageKey }
    }));
}

// Settings structure
function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    // Handle close button and click on the outside 
    const closeBtn = modal?.querySelector('.close') || modal?.querySelector('#closeSettings');

    if (!modal || !settingsBtn || !closeBtn) {
        console.log('Settings modal elements missing:', {
            modal: !!modal,
            settingsBtn: !!settingsBtn,
            closeBtn: !!closeBtn
        });
        return;
    }

    // Load current user settings
    const darkMode = getUserSetting('dark_mode') === 'true';
    const tableLimit = getUserSetting('table_limit', '10');

    const darkModeToggle = document.getElementById('darkModeToggle');
    const tableLimitSelect = document.getElementById('tableLimitSelect');

    if (darkModeToggle) darkModeToggle.checked = darkMode;
    if (tableLimitSelect) tableLimitSelect.value = tableLimit;

    // Open popup
    settingsBtn.addEventListener('click', () => modal.style.display = 'flex');

    // Close popup
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // Save settings
    document.getElementById('saveSettings')?.addEventListener('click', () => {
        const darkMode = darkModeToggle?.checked || false;
        const tableLimit = tableLimitSelect?.value || '10';
        const currentUserId = getUserId();

        console.log(`[settings] Saving settings for user ${currentUserId}: darkMode=${darkMode}, tableLimit=${tableLimit}`);

        // Save user specific settings to localStorage
        setUserSetting('dark_mode', darkMode);
        setUserSetting('table_limit', tableLimit);

        // Apply dark mode 
        document.documentElement.className = darkMode ? 'dark' : '';

        modal.style.display = 'none';
        showNotification('Settings saved successfully!', 'success');

        // Apply settings
        applySettingsImmediately();

        // Dispatch event to synchronize settings across pages/tabs
        const settingsEvent = new CustomEvent('settingsChanged', {
            detail: {
                userId: currentUserId,
                darkMode: darkMode,
                tableLimit: tableLimit,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(settingsEvent);
        console.log('[settings] Settings change event dispatched for cross-page sync');
    });

    // Reset settings and back to default
    document.getElementById('resetSettings')?.addEventListener('click', () => {
        setUserSetting('dark_mode', 'false');
        setUserSetting('table_limit', '10');

        if (darkModeToggle) darkModeToggle.checked = false;
        if (tableLimitSelect) tableLimitSelect.value = '10';

        document.documentElement.className = '';

        showNotification('Settings reset to defaults', 'info');
        applySettingsImmediately();
    });
}

// Dark mode
function initializeDarkMode() {
    // Load dark mode setting
    const darkMode = getUserSetting('dark_mode') === 'true';
    if (darkMode) {
        document.documentElement.classList.add('dark');
    }
}

// Real time updates
function applySettingsImmediately() {
    // Apply dark mode
    const darkMode = getUserSetting('dark_mode') === 'true';
    document.documentElement.className = darkMode ? 'dark' : '';

    // Update of tables with new limits 
    if (typeof renderPatientsTable === 'function') {
        renderPatientsTable();
    }
    if (typeof renderMedicationsTable === 'function') {
        renderMedicationsTable();
    }
    if (typeof renderRecordsTable === 'function') {
        renderRecordsTable();
    }
}

function setupSettingsSync() {
    // Settings changes from other pages
    window.addEventListener('storage', (e) => {
        const currentUserId = getUserId();
        if (e.key && e.key.startsWith(`settings_${currentUserId}_`)) {
            console.log('Settings changed in another tab:', e.key, e.newValue);
            applySettingsImmediately();

            updateSettingsModalValues();
        }
    });

    // Settings changes from current tab
    window.addEventListener('settingsChanged', (e) => {
        console.log('Settings changed in current tab:', e.detail);
        applySettingsImmediately();
    });
}

function updateSettingsModalValues() {
    // Update popup controls to reflect current settings
    const darkModeToggle = document.getElementById('darkModeToggle');
    const tableLimitSelect = document.getElementById('tableLimitSelect');

    if (darkModeToggle) {
        const currentDarkMode = getUserSetting('dark_mode') === 'true';
        darkModeToggle.checked = currentDarkMode;
        console.log('Updated dark mode toggle to:', currentDarkMode);
    }
    if (tableLimitSelect) {
        const currentLimit = getUserSetting('table_limit', '10');
        tableLimitSelect.value = currentLimit;
        console.log('Updated table limit to:', currentLimit);
    }
}

// Cookies consent management
function initializeUserConsent() {
    const userConsent = localStorage.getItem(getConsentKey('cookie_consent'));
    if (userConsent === null) {
        // New user has not made a choice yet
        console.log('[consent] new user detected');
    }
    return userConsent;
}

function getConsentKey(key) {
    const uid = getUserId();
    return `consent_${uid}_${key}`;
}

function isCookieDecisionMade() {
    const userConsent = localStorage.getItem(getConsentKey('cookie_consent'));
    // Default to rejected for new users only return true if accepted
    return sessionStorage.getItem('cookie_decision_made') === 'true' || userConsent === 'accepted';
}

function hideSettingsForRejectedCookies() {
    console.log('[settings] Hiding settings if cookies are rejected for this session Only');

    // Hide settings button on all pages
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.style.display = 'none';
        console.log('[settings] Settings button hidden');
    }

    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal && settingsModal.style.display === 'flex') {
        settingsModal.style.display = 'none';
        console.log('[settings] Settings popup closed');
    }
}

function showSettingsForAcceptedCookies() {
    console.log('[settings] showSettingsForAcceptedCookies() called');

    // Show settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.style.display = 'block';
        console.log('[settings] Settings button shown');

        // Ensure settings mode is properly set up
        setupSettingsModal();

        // Load current user settings into the mode
        updateSettingsModalValues();

        // Apply current settings immediately
        applySettingsImmediately();

        console.log('[settings] Settings popup reinitialized and current settings loaded');
    } else {
        console.log('[settings] Settings button NOT FOUND in DOM');
    }
}

function ensureCookieBannerVisible() {
    try {
        const userConsentKey = getConsentKey('cookie_consent');
        const cookieConsent = localStorage.getItem(userConsentKey) ?? localStorage.getItem('cookie_consent');

        // If user accepted
        if (cookieConsent === 'accepted') {
            console.log('[banner] User accepted permanently');
            return;
        }

        if (sessionStorage.getItem('cookie_banner_shown_this_session') === 'true') {
            console.log('[banner] Already shown this session');
            return;
        }

        // Banner is shown only once per session
        if (!document.getElementById('cookieConsentBanner')) {
            console.log('[banner] creating new banner for new user or rejected consent');
            showCookieConsent();
        } else {
            const existing = document.getElementById('cookieConsentBanner');
            existing.style.display = 'block';
            console.log('[banner] showing existing banner');
        }
    } catch (e) { console.error('[banner] error:', e); }
}

function resetCookieConsent(forceShow = true) {
    try {
        // Clear local storage consent
        localStorage.removeItem('cookie_consent');
        // Clear user specific consent
        localStorage.removeItem(getConsentKey('cookie_consent'));
        // Defualt to rejected
        localStorage.setItem(getConsentKey('cookie_consent'), 'rejected');
        sessionStorage.removeItem('cookie_decision_made');
        localStorage.removeItem('analytics_enabled');
        localStorage.removeItem('cookie_consent_source');
        localStorage.removeItem('cookie_consent_decided_at');

        // Clear user scope
        localStorage.removeItem(getConsentKey('cookie_consent'));
        localStorage.removeItem(getConsentKey('analytics_enabled'));
        localStorage.removeItem(getConsentKey('cookie_consent_source'));
        localStorage.removeItem(getConsentKey('cookie_consent_decided_at'));
        sessionStorage.removeItem('cookie_decision_made');
        const existing = document.getElementById('cookieConsentBanner');
        if (existing) existing.remove();
        if (forceShow) {
            showCookieConsent();
            setTimeout(ensureCookieBannerVisible, 100);
        }
        console.log('[cookies] consent reset');
    } catch (e) { console.error('[reset] error:', e); }
}

// Cookie consent
let cookieConsentInProgress = false; 

function showCookieConsent() {
    console.log('[cookies] showCookieConsent() called');
    
    // Banner only show in index, medication, record pages
    const currentPage = window.location.pathname.split('/').pop();
    const isUnauthenticatedPage = ['login.php', 'register.php', 'forgot_password.php', 'reset_password.php'].includes(currentPage);
    
    if (isUnauthenticatedPage) {
        console.log('[cookies] BLOCKED: Trying to show banner on unauthenticated page:', currentPage);
        return;
    }
    
    // Prevent multiple simultaneous calls
    if (cookieConsentInProgress) {
        console.log('[cookies] Cookie consent already in progress');
        return;
    }

    // Do not show if user already accepted 
    const userConsentKey = getConsentKey('cookie_consent');
    const userConsent = localStorage.getItem(userConsentKey);
    const globalConsent = localStorage.getItem('cookie_consent');
    
    console.log('[cookies] Consent check - user:', userConsent, 'global:', globalConsent);
    
    if (userConsent === 'accepted') {
        console.log('[cookies] User personally accepted');
        return;
    }

    // Avoid duplicate banners
    const existing = document.getElementById('cookieConsentBanner');
    if (existing) {
        existing.style.display = 'block';
        console.log('[cookies] Showing existing banner');
        return;
    }

    console.log('[cookies] Creating new cookie consent banner for authenticated page:', currentPage);
    cookieConsentInProgress = true;

    // Cookie consent banner
    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.className = 'fixed bottom-0 left-0 right-0 bg-gray-800 dark:bg-gray-900 text-white p-4 shadow-lg z-50 animate-slide-in';
    banner.innerHTML = `
        <div class="container mx-auto px-4">
            <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                <div class="flex-1">
                    <p class="text-sm md:text-base">
                        <strong>Choose Your Cookie Preferences</strong><br>
                        This medical system can remember your display preferences (dark mode, table rows).<br>
                        <span class="text-green-300">Accept:</span> Your settings will be saved between visits.<br>
                        <span class="text-red-300">Reject:</span> Settings will reset each time you visit.<br>
                        <small class="text-gray-300">Note: No medical data is stored in cookies.</small>
                    </p>
                </div>
                <div class="flex gap-3 flex-shrink-0">
                    <button id="rejectCookies" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                        Reject Cookies
                    </button>
                    <button id="acceptCookies" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                        Accept Cookies
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(banner);
    
    // Verify banner visibility
    console.log('[cookies] Banner created and added to page');
    console.log('[cookies] Banner element:', banner);
    console.log('[cookies] Banner is visible:', banner.offsetHeight > 0);
    
    // Settings hidden initially
    const settingsBtn = document.getElementById('settingsBtn');
    console.log('[cookies] Settings button found:', !!settingsBtn);
    console.log('[cookies] Settings button hidden:', settingsBtn ? settingsBtn.style.display === 'none' : 'N/A');

    // Accept cookies
    document.getElementById('acceptCookies').addEventListener('click', () => {
        const now = String(Date.now());
        const currentUserId = getUserId();
        
        console.log('[cookies] Accepted button clicked by user ID:', currentUserId);
        
        // Check per user permanently
        const userConsentKey = getConsentKey('cookie_consent');
        localStorage.setItem(userConsentKey, 'accepted');
        localStorage.setItem(getConsentKey('analytics_enabled'), 'true');
        localStorage.setItem(getConsentKey('cookie_consent_source'), 'user');
        localStorage.setItem(getConsentKey('cookie_consent_decided_at'), now);
        
        localStorage.setItem('cookie_consent', 'accepted');
        localStorage.setItem('analytics_enabled', 'true');
        localStorage.setItem('cookie_consent_source', 'user');
        localStorage.setItem('cookie_consent_decided_at', now);
        
        // Check save worked
        const savedUserConsent = localStorage.getItem(userConsentKey);
        const savedGlobalConsent = localStorage.getItem('cookie_consent');
        console.log('[cookies] saved cookies:');
        console.log('  - User consent key:', userConsentKey);
        console.log('  - User consent value:', savedUserConsent);
        console.log('  - Global consent value:', savedGlobalConsent);
        
        // Mark session decision
        sessionStorage.setItem('cookie_decision_made', 'true');
        
        console.log('[cookies] Permanent decision stored for user', currentUserId);
        
        // Show settings since cookies are accepted
        console.log('[cookies] Calling showSettingsForAcceptedCookies()');
        showSettingsForAcceptedCookies();
        
        banner.classList.add('animate-fade-out');
        setTimeout(() => banner.remove(), 300);
        showNotification('Thank you! Cookies enabled. Settings are now available.', 'success');
        
        try {
            document.dispatchEvent(new CustomEvent('cookie-decision-made', { detail: { decision: 'accepted' } }));
        } catch (e) { }
        
        cookieConsentInProgress = false;
        
        console.log('[cookies] Cookies accept process completed for user', currentUserId);
    });

    // Reject cookies
    document.getElementById('rejectCookies').addEventListener('click', () => {
        // Mark session decision but do not store permanently
        sessionStorage.setItem('cookie_decision_made', 'true');
        sessionStorage.setItem('cookies_rejected_this_session', 'true');

        // Remove any stored consent
        localStorage.removeItem(getConsentKey('cookie_consent'));
        localStorage.removeItem(getConsentKey('analytics_enabled'));
        localStorage.removeItem(getConsentKey('cookie_consent_source'));
        localStorage.removeItem(getConsentKey('cookie_consent_decided_at'));
        localStorage.removeItem('cookie_consent');
        localStorage.removeItem('analytics_enabled');
        localStorage.removeItem('cookie_consent_source');
        localStorage.removeItem('cookie_consent_decided_at');

        console.log('[cookies] rejected for user', getUserId(), '- NO permanent storage');

        // Hide settings since cookies are rejected
        hideSettingsForRejectedCookies();

        banner.classList.add('animate-fade-out');
        setTimeout(() => banner.remove(), 300);
        showNotification('Cookies rejected. Settings disabled until you accept cookies.', 'info');
        
        try {
            document.dispatchEvent(new CustomEvent('cookie-decision-made', { detail: { decision: 'rejected' } }));
        } catch (e) { }

        // Reset the flag after rejection
        cookieConsentInProgress = false;
    });

    // Reset flag when banner is created successfully  
    setTimeout(() => {
        cookieConsentInProgress = false;
    }, 100);
}


// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    csrfToken = getCsrfToken();

    const currentUserId = getUserId();
    const currentPage = window.location.pathname.split('/').pop();
    const isAuthenticatedPage = ['index.php', 'medication.php', 'record.php'].includes(currentPage);
    const isUnauthenticatedPage = ['login.php', 'register.php', 'forgot_password.php', 'reset_password.php'].includes(currentPage);

    console.log(`[consent] Current page: ${currentPage}, User ID: ${currentUserId}, Authenticated: ${isAuthenticatedPage}, Unauthenticated: ${isUnauthenticatedPage}`);

    //  Unauthenticated pages 
    if (isUnauthenticatedPage) {
        console.log('[consent] Unauthenticated page detected - SKIPPING cookie consent entirely');
        initializeDarkMode(); 
        return; 
    }

    //  Authenticated pages
    if (isAuthenticatedPage && currentUserId && currentUserId !== 'guest') {
        console.log('[consent] Authenticated page - initializing cookie consent');
        
        // Check stored consent only user specific
        const consentKey = getConsentKey('cookie_consent');
        const storedConsent = localStorage.getItem(consentKey); 

        // Debug: Show all consent related to localStorage
        console.log(`[consent]DEBUGGING CONSENT STORAGE:`);
        console.log(`Consent key for user: ${consentKey}`);
        console.log(`User consent value: ${localStorage.getItem(consentKey)}`);
        console.log(`Global consent value: ${localStorage.getItem('cookie_consent')}`);
        console.log(`User analytics: ${localStorage.getItem(getConsentKey('analytics_enabled'))}`);
        console.log(`Global analytics: ${localStorage.getItem('analytics_enabled')}`);
        
        const userConsent = localStorage.getItem(consentKey);
        const globalConsent = localStorage.getItem('cookie_consent'); // For debugging only
        if (userConsent === 'accepted') {
            console.log(`[consent]STATUS: USER ACCEPTED - Settings should be available`);
        } else if (userConsent === null) {
            console.log(`[consent] STATUS: NO USER DECISION - Banner should appear`);
        } else {
            console.log(`[consent] STATUS: USER REJECTED - Settings disabled`);
        }

        console.log(`[consent] Stored consent: ${storedConsent}`);

        // If THIS user has personally accepted show settings and NO banner
        if (storedConsent === 'accepted') {
            sessionStorage.setItem('cookie_decision_made', 'true');
            showSettingsForAcceptedCookies();
            console.log('[cookies] User personally accepted, no popup needed');
        } else {
            // If no permanent acceptance check session state
            const sessionDecided = sessionStorage.getItem('cookie_decision_made') === 'true';

            console.log(`[consent] Session decision made: ${sessionDecided}`);

            // Hide settings until user decides
            hideSettingsForRejectedCookies();

            // Only show banner if no session decision has been made
            if (!sessionDecided) {
                console.log(`[cookies] No decision made yet and showing popup on ${currentPage}`);
                showCookieConsent();
            } else {
                console.log('[cookies] Session decision already made and not showing banner');
            }
        }

        const lastUserId = sessionStorage.getItem('last_logged_in_user');
        if (lastUserId && lastUserId !== currentUserId.toString()) {
            console.log(`[consent] New user session detected and clearing session data`);
            sessionStorage.removeItem('cookie_banner_shown_this_session');
            sessionStorage.removeItem('cookie_decision_made');
            sessionStorage.removeItem('cookies_rejected_this_session');
        }
        sessionStorage.setItem('last_logged_in_user', currentUserId.toString());

        initializeDarkMode();
        setupSettingsSync();

        // Setup settings popup if it exists
        if (document.getElementById('settingsModal')) {
            setupSettingsModal();
        }
    } 
    else {
        console.log('[consent] Unknown page or guest user and no cookie consent needed');
        initializeDarkMode(); 
    }

    // Expose dev helpers only on localhost
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
            // TEST: Manually trigger cookie acceptance
            window.testAcceptCookies = () => {
                console.log('TESTING COOKIE ACCEPTANCE...');
                const now = new Date().toISOString();
                const currentUserId = getUserId();
                
                console.log('[test] Current user ID:', currentUserId);
                
                // Persist per user permanently
                const userConsentKey = getConsentKey('cookie_consent');
                localStorage.setItem(userConsentKey, 'accepted');
                localStorage.setItem(getConsentKey('analytics_enabled'), 'true');
                localStorage.setItem(getConsentKey('cookie_consent_source'), 'user');
                localStorage.setItem(getConsentKey('cookie_consent_decided_at'), now);
                
                localStorage.setItem('cookie_consent', 'accepted');
                localStorage.setItem('analytics_enabled', 'true');
                localStorage.setItem('cookie_consent_source', 'user');
                localStorage.setItem('cookie_consent_decided_at', now);
                
                // Mark session decision
                sessionStorage.setItem('cookie_decision_made', 'true');
                
                // Verify the saves worked
                const savedUserConsent = localStorage.getItem(userConsentKey);
                const savedGlobalConsent = localStorage.getItem('cookie_consent');
                console.log('[test] SAVE VERIFICATION:');
                console.log('  - User consent key:', userConsentKey);
                console.log('  - User consent value:', savedUserConsent);
                console.log('  - Global consent value:', savedGlobalConsent);
                
                // Remove existing banner if present
                const existingBanner = document.getElementById('cookie-consent');
                if (existingBanner) {
                    existingBanner.remove();
                    console.log('[test] Removed existing banner');
                }
                
                // Show settings
                showSettingsForAcceptedCookies();
                
                console.log('[test] TEST COMPLETED: Refresh page to see if banner is gone');
            };
            
            window.resetCookieConsent = resetCookieConsent;
            window.showCookieConsent = showCookieConsent;
            
            // Simple status checker
            window.checkCookieStatus = () => {
                const userId = getUserId();
                const userConsent = localStorage.getItem(getConsentKey('cookie_consent'));
                const globalConsent = localStorage.getItem('cookie_consent');
                
                console.log('COOKIE CONSENT STATUS:');
                console.log(`User ID: ${userId}`);
                console.log(`User consent: ${userConsent}`);
                console.log(`Global consent: ${globalConsent}`);
                
                if (userConsent === 'accepted' || globalConsent === 'accepted') {
                    console.log('RESULT: Cookies are ACCEPTED');
                    return 'ACCEPTED';
                } else if (userConsent === null && globalConsent === null) {
                    console.log(' RESULT: No decision made yet');
                    return 'NO_DECISION';
                } else {
                    console.log('RESULT: Cookies are REJECTED');
                    return 'REJECTED';
                }
            };
            
            // Consent status checker
            window.checkConsentStatus = () => {
                const userId = getUserId();
                const userConsent = localStorage.getItem(getConsentKey('cookie_consent'));
                const globalConsent = localStorage.getItem('cookie_consent');
                const sessionDecision = sessionStorage.getItem('cookie_decision_made');

                console.log('Consent Status for user:', userId);
                console.log('User-specific consent:', userConsent);
                console.log('Global consent:', globalConsent);
                console.log('Session decision made:', sessionDecision);
                console.log('Would show banner:', !(userConsent === 'accepted' || globalConsent === 'accepted'));

                return {
                    userId,
                    userConsent,
                    globalConsent,
                    sessionDecision,
                    effectiveConsent: userConsent || globalConsent,
                    wouldShowBanner: !(userConsent === 'accepted' || globalConsent === 'accepted')
                };
            };
        } catch (e) { }
    }

    try {
        window.resetCookieConsent = resetCookieConsent;
        window.ensureCookieBannerVisible = ensureCookieBannerVisible;
        window.initializeUserConsent = initializeUserConsent;
        window.showCookieConsent = showCookieConsent; // Make available for testing
        window.testCookieConsent = () => {
            // Clear session desecion to allow banner to show again
            sessionStorage.removeItem('cookie_banner_shown_this_session');
            sessionStorage.removeItem('cookie_decision_made');
            const existing = document.getElementById('cookieConsentBanner');
            if (existing) existing.remove();
            showCookieConsent();
            console.log('Cookie consent banner triggered for testing');
        };
        window.checkConsentStatus = () => {
            const userId = getUserId();
            const userConsent = localStorage.getItem(getConsentKey('cookie_consent'));
            const globalConsent = localStorage.getItem('cookie_consent');
            const sessionDecision = sessionStorage.getItem('cookie_decision_made');
            const userSource = localStorage.getItem(getConsentKey('cookie_consent_source'));
            const globalSource = localStorage.getItem('cookie_consent_source');

            console.log('Consent Status for user:', userId);
            console.log('User-specific consent:', userConsent, userSource ? `(source: ${userSource})` : '');
            console.log('Global consent:', globalConsent, globalSource ? `(source: ${globalSource})` : '');
            console.log('Session decision made:', sessionDecision);
            console.log('Effective consent:', userConsent || globalConsent);
            console.log('Would show banner:', !(userConsent === 'accepted' || globalConsent === 'accepted'));
            return {
                userId,
                userConsent,
                globalConsent,
                sessionDecision,
                effectiveConsent: userConsent || globalConsent,
                wouldShowBanner: !(userConsent === 'accepted' || globalConsent === 'accepted')
            };
        };
        window.simulateUserAccept = () => {
            console.log('Simulating user accepting cookies...');
            // Trigger the banner and autoaccept
            window.testCookieConsent();
            setTimeout(() => {
                const acceptBtn = document.getElementById('acceptCookies');
                if (acceptBtn) {
                    acceptBtn.click();
                    console.log('Auto-clicked Accept button');
                    setTimeout(() => {
                        console.log('Checking if decision was remembered...');
                        window.checkConsentStatus();
                    }, 1000);
                }
            }, 500);
        };
        window.testConsentMemory = () => {
            console.log('Testing consent memory system...');
            console.log('Checking initial state:');
            window.checkConsentStatus();

            console.log('Simulating user accepting cookies...');
            window.simulateUserAccept();

            setTimeout(() => {
                console.log('Testing if system remembers decision (trying to show banner again):');
                window.testCookieConsent(); // This should NOT show banner if user accepted
                setTimeout(() => {
                    const banner = document.getElementById('cookieConsentBanner');
                    if (banner && banner.style.display !== 'none') {
                        console.log('FAIL: Banner appeared even though user accepted');
                    } else {
                        console.log('SUCCESS: Banner did not appear - user decision remembered!');
                    }
                }, 1000);
            }, 3000);
        };
    } catch (e) { }
});

// Exports used in other scripts
window.commonUtils = {
    getCookie,
    setCookie,
    getCsrfToken,
    escapeHtml,
    formatDate,
    showNotification,
    loadDropdowns,
    loadTowns,
    loadMedications,
    getUserSetting,
    setUserSetting,
    getUserId,
    getConsentKey,
    resetCookieConsent,
    ensureCookieBannerVisible,
    isCookieDecisionMade
};

// Debug by function to completely reset cookie consent for testing
window.debugResetConsent = function () {
    const userId = getUserId();
    console.log('[DEBUG] Completely resetting all cookie consent data for user:', userId);

    // Clear localStorage
    localStorage.removeItem('cookie_consent');
    localStorage.removeItem('analytics_enabled');
    localStorage.removeItem('cookie_consent_source');
    localStorage.removeItem('cookie_consent_decided_at');
    localStorage.removeItem(getConsentKey('cookie_consent'));
    localStorage.removeItem(getConsentKey('analytics_enabled'));
    localStorage.removeItem(getConsentKey('cookie_consent_source'));
    localStorage.removeItem(getConsentKey('cookie_consent_decided_at'));

    // Clear sessionStorage including cookiedesision
    sessionStorage.removeItem('cookie_decision_made');
    sessionStorage.removeItem('cookie_banner_shown_this_session');
    sessionStorage.removeItem('cookies_rejected_this_session'); 
    sessionStorage.removeItem('last_logged_in_user');

    console.log('[DEBUG] All consent data cleared INCLUDING session rejection flag. Refresh page to see popup.');
    alert('All cookie consent data cleared. Refresh the page to see the popup.');
};

// Debug force clear session of storage immediately
window.forceResetSession = function () {
    console.log('[DEBUG] FORCE clearing session storage');
    sessionStorage.clear();
    localStorage.removeItem(getConsentKey('cookie_consent'));
    localStorage.removeItem('cookie_consent');
    console.log('[DEBUG] Session storage completely cleared. Refresh page.');
    alert('Session storage completely cleared. Refresh page now.');
};
