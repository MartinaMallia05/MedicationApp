// js/common.js - Shared utilities and functions across all pages

// GLOBAL VARIABLES
let csrfToken = '';

// HELPER FUNCTIONS
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

// Format date to DD-MM-YYYY format
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

// API FUNCTIONS
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

// USER-SPECIFIC SETTINGS (localStorage)
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
    
    // Broadcast settings change to all open tabs/pages
    window.dispatchEvent(new CustomEvent('settingsChanged', {
        detail: { key, value, storageKey }
    }));
}

// SETTINGS MODAL
function setupSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const settingsBtn = document.getElementById('settingsBtn');
    // Handle both close button styles
    const closeBtn = modal?.querySelector('.close') || modal?.querySelector('#closeSettings');
    
    if (!modal || !settingsBtn || !closeBtn) {
        console.log('Settings modal elements missing:', {
            modal: !!modal,
            settingsBtn: !!settingsBtn, 
            closeBtn: !!closeBtn
        });
        return;
    }
    
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
        const currentUserId = getUserId();
        
        console.log(`[settings] Saving settings for user ${currentUserId}: darkMode=${darkMode}, tableLimit=${tableLimit}`);
        
        // Save user-specific settings to localStorage
        setUserSetting('dark_mode', darkMode);
        setUserSetting('table_limit', tableLimit);
        
        // Apply dark mode immediately
        document.documentElement.className = darkMode ? 'dark' : '';
        
        modal.style.display = 'none';
        showNotification('Settings saved successfully!', 'success');
        
        // Apply settings immediately without reload
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
    
    // Reset settings
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

// DARK MODE INITIALIZATION
function initializeDarkMode() {
    // Load user-specific dark mode setting
    const darkMode = getUserSetting('dark_mode') === 'true';
    if (darkMode) {
        document.documentElement.classList.add('dark');
    }
}

// REAL-TIME SETTINGS SYNCHRONIZATION
function applySettingsImmediately() {
    // Apply dark mode
    const darkMode = getUserSetting('dark_mode') === 'true';
    document.documentElement.className = darkMode ? 'dark' : '';
    
    // Re-render tables with new limits if functions exist
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
    // Listen for settings changes from other tabs/pages
    window.addEventListener('storage', (e) => {
        // Check if it's a settings change for current user
        const currentUserId = getUserId();
        if (e.key && e.key.startsWith(`settings_${currentUserId}_`)) {
            console.log('Settings changed in another tab:', e.key, e.newValue);
            applySettingsImmediately();
            
            // Update settings modal if open
            updateSettingsModalValues();
        }
    });
    
    // Listen for settings changes in same tab
    window.addEventListener('settingsChanged', (e) => {
        console.log('Settings changed in current tab:', e.detail);
        applySettingsImmediately();
    });
}

function updateSettingsModalValues() {
    // Update modal controls to reflect current settings
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

// USER-SCOPED CONSENT HELPERS
// Generate user-specific consent storage key for per-user privacy preferences
function initializeUserConsent() {
    const userConsent = localStorage.getItem(getConsentKey('cookie_consent'));
    if (userConsent === null) {
        // New user - don't set anything, let them choose
        console.log('[consent] new user detected - no stored consent, will show popup');
    }
    return userConsent;
}

function getConsentKey(key) {
    const uid = getUserId();
    return `consent_${uid}_${key}`;
}

function isCookieDecisionMade() {
    const userConsent = localStorage.getItem(getConsentKey('cookie_consent'));
    // Default to 'rejected' for new users, only return true if explicitly 'accepted'
    return sessionStorage.getItem('cookie_decision_made') === 'true' || userConsent === 'accepted';
}

function hideSettingsForRejectedCookies() {
    console.log('[settings] Hiding settings - cookies rejected this session');
    
    // Hide settings button on all pages
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.style.display = 'none';
        console.log('[settings] Settings button hidden');
    }
    
    // Close settings modal if open, but don't hide it permanently
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal && settingsModal.style.display === 'flex') {
        settingsModal.style.display = 'none';
        console.log('[settings] Settings modal closed');
    }
}

function showSettingsForAcceptedCookies() {
    console.log('[settings] Showing settings - cookies accepted');
    
    // Show settings button
    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.style.display = 'block';
        console.log('[settings] Settings button shown');
        
        // Ensure settings modal is properly set up
        setupSettingsModal();
        
        // Load current user settings into the modal
        updateSettingsModalValues();
        
        // Apply current settings immediately
        applySettingsImmediately();
        
        console.log('[settings] Settings modal reinitialized and current settings loaded');
    }
}

function ensureCookieBannerVisible() {
    try {
        const userConsentKey = getConsentKey('cookie_consent');
        const cookieConsent = localStorage.getItem(userConsentKey) ?? localStorage.getItem('cookie_consent');
        
        // Don't show if user permanently accepted
        if (cookieConsent === 'accepted') {
            console.log('[banner] User accepted permanently, no banner needed');
            return;
        }
        
        // Don't show if already shown this session
        if (sessionStorage.getItem('cookie_banner_shown_this_session') === 'true') {
            console.log('[banner] Already shown this session, skipping');
            return;
        }
        
        // Show banner if conditions are met
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
        // Clear global (legacy)
        localStorage.removeItem('cookie_consent');
        // Clear user-specific consent
        localStorage.removeItem(getConsentKey('cookie_consent'));
        // Set default state to 'rejected' for new users
        localStorage.setItem(getConsentKey('cookie_consent'), 'rejected');
        sessionStorage.removeItem('cookie_decision_made');
        localStorage.removeItem('analytics_enabled');
        localStorage.removeItem('cookie_consent_source');
        localStorage.removeItem('cookie_consent_decided_at');
        // Clear user-scoped
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

// COOKIE CONSENT
function showCookieConsent() {
    // Don't show if user already accepted (permanent decision)
    const userConsentKey = getConsentKey('cookie_consent');
    let cookieConsent = localStorage.getItem(userConsentKey) ?? localStorage.getItem('cookie_consent');
    if (cookieConsent === 'accepted') {
        console.log('[cookies] User already accepted, skipping banner');
        return;
    }
    
    // Don't show if already shown this session (for rejections)
    if (sessionStorage.getItem('cookie_banner_shown_this_session') === 'true') {
        console.log('[cookies] Banner already shown this session, skipping');
        return;
    }
    
    // Avoid duplicate banners
    const existing = document.getElementById('cookieConsentBanner');
    if (existing) {
        existing.style.display = 'block';
        return;
    }
    
    // Mark as shown this session
    sessionStorage.setItem('cookie_banner_shown_this_session', 'true');
    
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
                        <strong>By default, we reject cookies to protect your privacy.</strong> You can choose to accept them below.
                    </p>
                </div>
                <div class="flex gap-3 flex-shrink-0">
                    <button id="rejectCookies" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition">
                        ✗ Reject (Default)
                    </button>
                    <button id="acceptCookies" class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition">
                        ✓ Accept
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(banner);
    
    // Accept cookies
    document.getElementById('acceptCookies').addEventListener('click', () => {
        const now = String(Date.now());
        // Persist per-user permanently
        localStorage.setItem(getConsentKey('cookie_consent'), 'accepted');
        localStorage.setItem(getConsentKey('analytics_enabled'), 'true');
        localStorage.setItem(getConsentKey('cookie_consent_source'), 'user');
        localStorage.setItem(getConsentKey('cookie_consent_decided_at'), now);
        // Legacy/global for backward-compat
        localStorage.setItem('cookie_consent', 'accepted');
        localStorage.setItem('analytics_enabled', 'true');
        localStorage.setItem('cookie_consent_source', 'user');
        localStorage.setItem('cookie_consent_decided_at', now);
        // Mark session decision
        sessionStorage.setItem('cookie_decision_made', 'true');
        sessionStorage.setItem('cookie_banner_shown_this_session', 'true');
        console.log('[cookies] accepted for user', getUserId(), '- permanent decision');
        
        // Show settings since cookies are accepted
        showSettingsForAcceptedCookies();
        
        banner.classList.add('animate-fade-out');
        setTimeout(() => banner.remove(), 300);
        showNotification('Thank you! Cookies enabled. Settings are now available.', 'success');
        try { document.dispatchEvent(new CustomEvent('cookie-decision-made', { detail: { decision: 'accepted' } })); } catch (e) {}
    });
    
    // Reject cookies
    document.getElementById('rejectCookies').addEventListener('click', () => {
        // For rejections, ONLY mark decision as made for THIS session - don't store permanently
        sessionStorage.setItem('cookie_decision_made', 'true');
        sessionStorage.setItem('cookie_banner_shown_this_session', 'true');
        sessionStorage.setItem('cookies_rejected_this_session', 'true'); // Track rejection for settings
        
        // DO NOT store rejection permanently - user should get fresh choice next login
        // Remove any stored consent so they get popup again next time
        localStorage.removeItem(getConsentKey('cookie_consent'));
        localStorage.removeItem(getConsentKey('analytics_enabled'));
        localStorage.removeItem(getConsentKey('cookie_consent_source'));
        localStorage.removeItem(getConsentKey('cookie_consent_decided_at'));
        localStorage.removeItem('cookie_consent');
        localStorage.removeItem('analytics_enabled');
        localStorage.removeItem('cookie_consent_source');
        localStorage.removeItem('cookie_consent_decided_at');
        
        console.log('[cookies] rejected for user', getUserId(), '- NO permanent storage, fresh choice next login');
        
        // Hide settings since cookies are rejected
        hideSettingsForRejectedCookies();
        
        banner.classList.add('animate-fade-out');
        setTimeout(() => banner.remove(), 300);
        showNotification('Cookies rejected. Settings disabled until you accept cookies.', 'info');
        try { document.dispatchEvent(new CustomEvent('cookie-decision-made', { detail: { decision: 'rejected' } })); } catch (e) {}
    });
}

// INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
    csrfToken = getCsrfToken();
    
    // Only proceed with cookie consent on authenticated pages
    const currentUserId = getUserId();
    const currentPage = window.location.pathname.split('/').pop();
    const isIndexPage = currentPage === 'index.php';
    const isAuthenticatedPage = ['index.php', 'medication.php', 'record.php'].includes(currentPage);
    
    if (!currentUserId || !isAuthenticatedPage) {
        console.log(`[consent] Not showing cookie consent - user ID: ${currentUserId}, page: ${currentPage}, authenticated: ${isAuthenticatedPage}`);
        return;
    }
    
    // Check cookie consent status and manage settings visibility on ALL authenticated pages
    const consentKey = getConsentKey('cookie_consent');
    const storedConsent = localStorage.getItem(consentKey) ?? localStorage.getItem('cookie_consent');
    
    // TEMPORARY FIX: Force clear rejection flag if no permanent consent stored
    // BUT preserve the "banner shown" flag to prevent repeated popups
    if (!storedConsent || storedConsent === 'null') {
        console.log('[TEMP FIX] No stored consent found - clearing session rejection flags');
        sessionStorage.removeItem('cookies_rejected_this_session');
        sessionStorage.removeItem('cookie_decision_made');
        // Don't clear 'cookie_banner_shown_this_session' - let it prevent repeated popups
    }
    
    const sessionRejected = sessionStorage.getItem('cookies_rejected_this_session') === 'true';
    const sessionDecided = sessionStorage.getItem('cookie_decision_made') === 'true';
    
    console.log(`[consent] Page: ${currentPage}`);
    console.log(`[consent] Stored consent: ${storedConsent}`);
    console.log(`[consent] Session rejected: ${sessionRejected}`);
    console.log(`[consent] Session decision made: ${sessionDecided}`);
    console.log(`[consent] All sessionStorage:`, {
        cookies_rejected_this_session: sessionStorage.getItem('cookies_rejected_this_session'),
        cookie_decision_made: sessionStorage.getItem('cookie_decision_made'),
        cookie_banner_shown_this_session: sessionStorage.getItem('cookie_banner_shown_this_session')
    });
    
    // Manage settings visibility based on cookie consent
    if (storedConsent === 'accepted') {
        showSettingsForAcceptedCookies();
        console.log('[settings] Settings shown - cookies permanently accepted');
    } else if (sessionRejected) {
        hideSettingsForRejectedCookies();
        console.log('[settings] Settings hidden - cookies rejected this session');
    } else {
        // No decision yet - hide settings until user decides
        hideSettingsForRejectedCookies();
        console.log('[settings] Settings hidden - no cookie decision made yet');
    }
    
    // Cookie popup logic - show on ALL pages if no decision made yet
    // Don't show if: permanently accepted OR rejected this session OR already shown this session
    if (storedConsent === 'accepted') {
        // User permanently accepted - no popup needed
        sessionStorage.setItem('cookie_decision_made', 'true');
        console.log('[cookies] User permanently accepted, no popup needed');
        return;
    } else if (sessionRejected || sessionDecided) {
        // User rejected this session or already decided - no popup
        console.log('[cookies] Session decision already made - rejected:', sessionRejected, 'decided:', sessionDecided);
        return;
    } else {
        // Check if banner was already shown this session
        const bannerShown = sessionStorage.getItem('cookie_banner_shown_this_session') === 'true';
        if (bannerShown) {
            console.log('[cookies] Banner already shown this session, not showing again');
            return;
        }
        
        // No decision yet and not shown yet - show popup
        console.log(`[cookies] No decision made yet - showing popup on ${currentPage}`);
        
        // Set session flag to prevent repeated popups
        sessionStorage.setItem('cookie_banner_shown_this_session', 'true');
        
        showCookieConsent();
        console.log('[cookies] Cookie consent banner displayed');
    }
    
    console.log('[session] Checking for user session changes...');
    
    // Development helper: Reset consent on localhost for testing (preserves user decisions)
    // BUT preserve if user explicitly accepted to avoid annoying them
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Current user ID:', currentUserId);
        
        // IMPORTANT: Clear session data if this is a different user (handles logout/re-login)
        const lastUserId = sessionStorage.getItem('last_logged_in_user');
        console.log(`[session] Last user ID: ${lastUserId}, Current user ID: ${currentUserId}`);
        
        if (lastUserId && lastUserId !== currentUserId.toString()) {
            console.log(`[consent] New user session detected (was ${lastUserId}, now ${currentUserId}) - clearing session data`);
            sessionStorage.removeItem('cookie_banner_shown_this_session');
            sessionStorage.removeItem('cookie_decision_made');
        } else if (!lastUserId) {
            console.log(`[session] First session for user ${currentUserId} - clearing any leftover session data`);
            sessionStorage.removeItem('cookie_banner_shown_this_session');
            sessionStorage.removeItem('cookie_decision_made');
        } else {
            console.log(`[session] Same user ${currentUserId} continuing session`);
        }
        sessionStorage.setItem('last_logged_in_user', currentUserId.toString());
        
        const userAccepted = localStorage.getItem(getConsentKey('cookie_consent')) === 'accepted';
        const globalAccepted = localStorage.getItem('cookie_consent') === 'accepted';
        const wasAcceptedByUser = localStorage.getItem(getConsentKey('cookie_consent_source')) === 'user' || 
                                 localStorage.getItem('cookie_consent_source') === 'user';
        
        if (!userAccepted && !globalAccepted) {
            console.log('[dev] Force clearing consent data for testing - user:', currentUserId);
            localStorage.removeItem('cookie_consent');
            localStorage.removeItem('analytics_enabled');
            localStorage.removeItem('cookie_consent_source');
            localStorage.removeItem('cookie_consent_decided_at');
            localStorage.removeItem(getConsentKey('cookie_consent'));
            localStorage.removeItem(getConsentKey('analytics_enabled'));
            localStorage.removeItem(getConsentKey('cookie_consent_source'));
            localStorage.removeItem(getConsentKey('cookie_consent_decided_at'));
            sessionStorage.removeItem('cookie_decision_made');
            sessionStorage.removeItem('cookie_banner_shown_this_session');
        } else {
            console.log('[dev] Preserving user acceptance - user:', currentUserId, 'accepted:', userAccepted || globalAccepted);
        }
    } else {
        // Production: Still need to handle user session changes
        console.log('Current user ID:', currentUserId);
        
        // Clear session data if this is a different user (handles logout/re-login)
        const lastUserId = sessionStorage.getItem('last_logged_in_user');
        console.log(`[session] Last user ID: ${lastUserId}, Current user ID: ${currentUserId}`);
        
        if (lastUserId && lastUserId !== currentUserId.toString()) {
            console.log(`[consent] New user session detected (was ${lastUserId}, now ${currentUserId}) - clearing session data`);
            sessionStorage.removeItem('cookie_banner_shown_this_session');
            sessionStorage.removeItem('cookie_decision_made');
        } else if (!lastUserId) {
            console.log(`[session] First session for user ${currentUserId} - clearing any leftover session data`);
            sessionStorage.removeItem('cookie_banner_shown_this_session');
            sessionStorage.removeItem('cookie_decision_made');
        } else {
            console.log(`[session] Same user ${currentUserId} continuing session`);
        }
        sessionStorage.setItem('last_logged_in_user', currentUserId.toString());
    }
    
    // Initialize user consent (defaults new users to 'rejected')
    initializeUserConsent();
    
    // Check if banner was already shown/decided this login session (across all pages)
    const sessionDecisionMade = sessionStorage.getItem('cookie_decision_made') === 'true';
    const bannerShownThisSession = sessionStorage.getItem('cookie_banner_shown_this_session') === 'true';
    
    console.log(`[consent] Session check for user ${getUserId()} - banner shown: ${bannerShownThisSession}, decision made: ${sessionDecisionMade}`);
    console.log('[consent] Full sessionStorage:', {
        cookie_decision_made: sessionStorage.getItem('cookie_decision_made'),
        cookie_banner_shown_this_session: sessionStorage.getItem('cookie_banner_shown_this_session')
    });
    
    // Show cookie consent only if user hasn't permanently accepted AND hasn't seen it this session
    const userConsentKey = getConsentKey('cookie_consent');
    const cookieConsent = localStorage.getItem(userConsentKey) ?? localStorage.getItem('cookie_consent');
    
    console.log(`[consent] Stored consent: ${cookieConsent}`);
    
    if (cookieConsent === 'accepted') {
        // User previously accepted permanently - mark session as decided
        sessionStorage.setItem('cookie_decision_made', 'true');
        showSettingsForAcceptedCookies(); // Show settings
        console.log('[cookies] User permanently accepted, no banner needed');
    } else if (!bannerShownThisSession && !sessionDecisionMade) {
        // Show banner if: no permanent acceptance AND not shown this session AND no session decision
        console.log('[cookies] Showing banner - user needs to make choice');
        hideSettingsForRejectedCookies(); // Hide settings until decision made
        showCookieConsent();
        // Removed setTimeout(ensureCookieBannerVisible, 200) - causes conflicts
    } else {
        // Banner already handled this session - check if rejected to hide settings
        if (sessionStorage.getItem('cookies_rejected_this_session') === 'true') {
            hideSettingsForRejectedCookies();
            console.log('[cookies] Settings hidden - cookies rejected this session');
        } else {
            showSettingsForAcceptedCookies();
        }
        console.log('[cookies] Banner already handled this session - shown:', bannerShownThisSession, 'decided:', sessionDecisionMade);
    }
    
    initializeDarkMode();
    setupSettingsSync(); // Enable real-time settings synchronization
    
    // Setup settings modal if it exists
    if (document.getElementById('settingsModal')) {
        setupSettingsModal();
    }
    
    // Expose dev helpers
    try {
        window.resetCookieConsent = resetCookieConsent;
        window.ensureCookieBannerVisible = ensureCookieBannerVisible;
        window.initializeUserConsent = initializeUserConsent;
        window.showCookieConsent = showCookieConsent; // Make available for testing
        window.testCookieConsent = () => {
            // Clear session flag to allow banner to show again
            sessionStorage.removeItem('cookie_banner_shown_this_session');
            sessionStorage.removeItem('cookie_decision_made');
            const existing = document.getElementById('cookieConsentBanner');
            if (existing) existing.remove();
            showCookieConsent();
            // Removed setTimeout(ensureCookieBannerVisible, 200) - causes conflicts
            console.log('Cookie consent banner triggered for testing');
        };
        window.checkConsentStatus = () => {
            const userId = getUserId();
            const userConsent = localStorage.getItem(getConsentKey('cookie_consent'));
            const globalConsent = localStorage.getItem('cookie_consent');
            const sessionDecision = sessionStorage.getItem('cookie_decision_made');
            const userSource = localStorage.getItem(getConsentKey('cookie_consent_source'));
            const globalSource = localStorage.getItem('cookie_consent_source');
            
            console.log('🍪 Consent Status for user:', userId);
            console.log('├─ User-specific consent:', userConsent, userSource ? `(source: ${userSource})` : '');
            console.log('├─ Global consent:', globalConsent, globalSource ? `(source: ${globalSource})` : '');
            console.log('├─ Session decision made:', sessionDecision);
            console.log('├─ Effective consent:', userConsent || globalConsent);
            console.log('└─ Would show banner:', !(userConsent === 'accepted' || globalConsent === 'accepted'));
            
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
            console.log('🧪 Simulating user accepting cookies...');
            // Trigger the banner and auto-accept
            window.testCookieConsent();
            setTimeout(() => {
                const acceptBtn = document.getElementById('acceptCookies');
                if (acceptBtn) {
                    acceptBtn.click();
                    console.log('✅ Auto-clicked Accept button');
                    setTimeout(() => {
                        console.log('🔍 Checking if decision was remembered...');
                        window.checkConsentStatus();
                    }, 1000);
                }
            }, 500);
        };
        window.testConsentMemory = () => {
            console.log('🧪 Testing consent memory system...');
            console.log('1️⃣ Checking initial state:');
            window.checkConsentStatus();
            
            console.log('2️⃣ Simulating user accepting cookies...');
            window.simulateUserAccept();
            
            setTimeout(() => {
                console.log('3️⃣ Testing if system remembers decision (trying to show banner again):');
                window.testCookieConsent(); // This should NOT show banner if user accepted
                setTimeout(() => {
                    const banner = document.getElementById('cookieConsentBanner');
                    if (banner && banner.style.display !== 'none') {
                        console.log('❌ FAIL: Banner appeared even though user accepted');
                    } else {
                        console.log('✅ SUCCESS: Banner did not appear - user decision remembered!');
                    }
                }, 1000);
            }, 3000);
        };
    } catch (e) {}
});

// EXPORT FOR USE IN OTHER SCRIPTS
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

// DEBUG: Temporary function to completely reset cookie consent (for testing)
window.debugResetConsent = function() {
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
    
    // Clear sessionStorage - including the rejection flag that's causing the issue
    sessionStorage.removeItem('cookie_decision_made');
    sessionStorage.removeItem('cookie_banner_shown_this_session');
    sessionStorage.removeItem('cookies_rejected_this_session'); // This was missing!
    sessionStorage.removeItem('last_logged_in_user');
    
    console.log('[DEBUG] All consent data cleared INCLUDING session rejection flag. Refresh page to see popup.');
    alert('All cookie consent data cleared. Refresh the page to see the popup.');
};

// DEBUG: Force clear session storage immediately (nuclear option)
window.forceResetSession = function() {
    console.log('[DEBUG] FORCE clearing session storage');
    sessionStorage.clear(); // Nuclear option - clears everything
    localStorage.removeItem(getConsentKey('cookie_consent'));
    localStorage.removeItem('cookie_consent');
    console.log('[DEBUG] Session storage completely cleared. Refresh page.');
    alert('Session storage completely cleared. Refresh page now.');
};

// Export for use in templates is no longer needed