// Autocomplete search
class AutocompleteField {
    constructor(inputElement, dataSource, options = {}) {
        this.input = inputElement;
        this.dataSource = dataSource;
        this.options = {
            minLength: 2,
            maxResults: 10,
            delay: 300,
            ...options
        };
        
        this.currentRequest = null;
        this.suggestionsList = null;
        this.selectedIndex = -1;
        this.isOpen = false;
        
        this.init();
    }
    
    // Initialize the autocomplete functionality
    init() {
        this.createSuggestionsList();
        this.input.addEventListener('input', this.debounce(this.handleInput.bind(this), this.options.delay));
        this.input.addEventListener('keydown', this.handleKeydown.bind(this));
        this.input.addEventListener('blur', this.handleBlur.bind(this));
    }
    
    createSuggestionsList() {
        this.suggestionsList = document.createElement('ul');
        // Styling for the suggestions dropdown
        this.suggestionsList.className = 'absolute z-50 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto hidden';
        this.input.parentNode.style.position = 'relative';
        this.input.parentNode.appendChild(this.suggestionsList);
    }
    
    // Handle input event
    async handleInput(e) {
        const query = e.target.value.trim();
        
        // Minimum length check
        if (query.length < this.options.minLength) {
            this.hideSuggestions();
            return;
        }
        
        // Abort previous request if any
        if (this.currentRequest) {
            this.currentRequest.abort();
        }
        
        this.showLoading();

        // Fetch suggestions from server        
        try {
            const controller = new AbortController();
            this.currentRequest = controller;
            
            const url = this.dataSource + (this.dataSource.includes('?') ? '&' : '?') + 'term=' + encodeURIComponent(query);
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal
            });
            
            if (!response.ok) throw new Error('Network error');
            
            const suggestions = await response.json();
            this.currentRequest = null;
            this.displaySuggestions(suggestions);
            
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Autocomplete error:', error);
                this.hideSuggestions();
            }
        }
    }
    
    // Show that it is loading
    showLoading() {
        this.suggestionsList.innerHTML = '<li class="px-3 py-2 text-gray-500">Loading...</li>';
        this.suggestionsList.classList.remove('hidden');
        this.isOpen = true;
    }
    
    // Display reults
    displaySuggestions(suggestions) {
        this.suggestionsList.innerHTML = '';
        
        if (!suggestions.length) {
            this.suggestionsList.innerHTML = '<li class="px-3 py-2 text-gray-500">No results found</li>';
            this.suggestionsList.classList.remove('hidden');
            this.isOpen = true;
            return;
        }
        
        suggestions.slice(0, this.options.maxResults).forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600';
            li.textContent = item;
            li.dataset.index = index;
            
            li.addEventListener('click', () => {
                this.selectSuggestion(item);
            });
            
            this.suggestionsList.appendChild(li);
        });
        
        this.suggestionsList.classList.remove('hidden');
        this.isOpen = true;
        this.selectedIndex = -1;
    }
    
    // Keyboard use for accessability
    handleKeydown(e) {
        if (!this.isOpen) return;
        
        const items = this.suggestionsList.querySelectorAll('li[data-index]');
        
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
                this.updateSelection();
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
                this.updateSelection();
                break;
            case 'Enter':
                e.preventDefault();
                if (this.selectedIndex >= 0 && items[this.selectedIndex]) {
                    this.selectSuggestion(items[this.selectedIndex].textContent);
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }
    
    // Update visual selection
    updateSelection() {
        const items = this.suggestionsList.querySelectorAll('li[data-index]');
        items.forEach((item, index) => {
            if (index === this.selectedIndex) {
                item.classList.add('bg-blue-100');
            } else {
                item.classList.remove('bg-blue-100');
            }
        });
    }
    
    // Select a suggestion
    selectSuggestion(value) {
        this.input.value = value;
        this.hideSuggestions();
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Hide suggestions on blur
    handleBlur() {
        setTimeout(() => { this.hideSuggestions(); }, 150);
    }
    
    // Hide suggestions list
    hideSuggestions() {
        this.suggestionsList.classList.add('hidden');
        this.isOpen = false;
        this.selectedIndex = -1;
    }
    
    // Limit the rate of function calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global utility function
window.createAutocomplete = function(inputSelector, dataSource, options = {}) {
    const input = document.querySelector(inputSelector);
    if (!input) {
        console.warn('Autocomplete: Input not found: ' + inputSelector);
        return null;
    }
    return new AutocompleteField(input, dataSource, options);
};