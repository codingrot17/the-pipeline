/**
 * THE PIPELINE - NAVIGATION SYSTEM
 * Enhanced mobile-first navigation with smooth animations
 */

class NavigationController {
    constructor() {
        this.navbar = document.getElementById('navbar');
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.navOverlay = document.getElementById('navOverlay');
        this.navClose = document.getElementById('navClose');
        this.fabButton = document.getElementById('fabButton');
        
        this.isNavOpen = false;
        this.scrollY = 0;
        this.lastScrollY = 0;
        this.scrollDirection = 'up';
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.handleScroll();
        this.updateActiveNavItem();
        this.setupFAB();
    }

    setupEventListeners() {
        // Mobile menu toggle
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileNav());
        }

        // Navigation overlay close
        if (this.navClose) {
            this.navClose.addEventListener('click', () => this.closeMobileNav());
        }

        // Close nav on overlay click
        if (this.navOverlay) {
            this.navOverlay.addEventListener('click', (e) => {
                if (e.target === this.navOverlay) {
                    this.closeMobileNav();
                }
            });
        }

        // FAB functionality
        if (this.fabButton) {
            this.fabButton.addEventListener('click', () => this.toggleMobileNav());
        }

        // Scroll events
        window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => this.handleKeydown(e));

        // Navigation item clicks
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.setActiveNavItem(item);
                this.closeMobileNav();
            });
        });

        // Hash change for single page navigation
        window.addEventListener('hashchange', () => this.updateActiveNavItem());
    }

    toggleMobileNav() {
        if (this.isNavOpen) {
            this.closeMobileNav();
        } else {
            this.openMobileNav();
        }
    }

    openMobileNav() {
        this.isNavOpen = true;
        
        if (this.navOverlay) {
            this.navOverlay.classList.add('active');
        }
        
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.classList.add('active');
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Add animation delay to nav items
        this.animateNavItems();
        
        // Analytics
        this.trackEvent('navigation', 'mobile_menu_opened');
    }

    closeMobileNav() {
        this.isNavOpen = false;
        
        if (this.navOverlay) {
            this.navOverlay.classList.remove('active');
        }
        
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.classList.remove('active');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Analytics
        this.trackEvent('navigation', 'mobile_menu_closed');
    }

    animateNavItems() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.3s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 100 + 200);
        });
    }

    handleScroll() {
        this.scrollY = window.pageYOffset;
        
        // Determine scroll direction
        if (this.scrollY > this.lastScrollY) {
            this.scrollDirection = 'down';
        } else {
            this.scrollDirection = 'up';
        }
        
        // Update navbar appearance
        this.updateNavbarAppearance();
        
        // Update FAB visibility
        this.updateFABVisibility();
        
        this.lastScrollY = this.scrollY;
    }

    updateNavbarAppearance() {
        if (!this.navbar) return;
        
        if (this.scrollY > 100) {
            this.navbar.classList.add('scrolled');
        } else {
            this.navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar based on scroll direction (optional)
        if (this.scrollDirection === 'down' && this.scrollY > 300) {
            this.navbar.style.transform = 'translateY(-100%)';
        } else {
            this.navbar.style.transform = 'translateY(0)';
        }
    }

    updateFABVisibility() {
        if (!this.fabButton) return;
        
        if (this.scrollY > 200) {
            this.fabButton.style.opacity = '1';
            this.fabButton.style.visibility = 'visible';
            this.fabButton.style.transform = 'scale(1)';
        } else {
            this.fabButton.style.opacity = '0';
            this.fabButton.style.visibility = 'hidden';
            this.fabButton.style.transform = 'scale(0.8)';
        }
    }

    setupFAB() {
        if (!this.fabButton) return;
        
        // Initial state
        this.fabButton.style.opacity = '0';
        this.fabButton.style.visibility = 'hidden';
        this.fabButton.style.transform = 'scale(0.8)';
        this.fabButton.style.transition = 'all 0.3s ease';
        
        // Pulse animation on hover
        this.fabButton.addEventListener('mouseenter', () => {
            this.fabButton.style.animation = 'pulse 0.6s ease-in-out';
        });
        
        this.fabButton.addEventListener('animationend', () => {
            this.fabButton.style.animation = '';
        });
    }

    updateActiveNavItem() {
        const currentPath = window.location.pathname;
        const currentHash = window.location.hash;
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            
            const href = item.getAttribute('href');
            if (href === currentPath || href === currentHash) {
                item.classList.add('active');
            }
        });
        
        // Special case for homepage
        if (currentPath === '/' || currentPath === '/index.html') {
            const homeItem = document.querySelector('.nav-item[href="index.html"]');
            if (homeItem) homeItem.classList.add('active');
        }
    }

    setActiveNavItem(clickedItem) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        clickedItem.classList.add('active');
    }

    handleKeydown(e) {
        // Close navigation with Escape key
        if (e.key === 'Escape' && this.isNavOpen) {
            this.closeMobileNav();
        }
        
        // Open navigation with Ctrl+M
        if (e.ctrlKey && e.key === 'm') {
            e.preventDefault();
            this.toggleMobileNav();
        }
    }

    // Smooth scroll to sections
    scrollToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const offsetTop = section.getBoundingClientRect().top + window.pageYOffset;
            const headerHeight = this.navbar ? this.navbar.offsetHeight : 80;
            
            window.scrollTo({
                top: offsetTop - headerHeight - 20,
                behavior: 'smooth'
            });
            
            // Analytics
            this.trackEvent('navigation', 'section_scroll', sectionId);
        }
    }

    // Analytics helper
    trackEvent(category, action, label = null) {
        // Implement your analytics tracking here
        console.log(`Analytics: ${category} - ${action}${label ? ` - ${label}` : ''}`);
        
        // Example for Google Analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
    }
}

/**
 * BREADCRUMB NAVIGATION
 */
class BreadcrumbController {
    constructor() {
        this.breadcrumbContainer = document.querySelector('.breadcrumb');
        this.init();
    }

    init() {
        if (this.breadcrumbContainer) {
            this.generateBreadcrumb();
        }
    }

    generateBreadcrumb() {
        const path = window.location.pathname;
        const segments = path.split('/').filter(segment => segment);
        
        let breadcrumbHTML = '<a href="/" class="breadcrumb-item">Home</a>';
        
        segments.forEach((segment, index) => {
            const isLast = index === segments.length - 1;
            const segmentPath = '/' + segments.slice(0, index + 1).join('/');
            const segmentName = this.formatSegmentName(segment);
            
            if (isLast) {
                breadcrumbHTML += ` <span class="breadcrumb-separator">›</span> <span class="breadcrumb-item active">${segmentName}</span>`;
            } else {
                breadcrumbHTML += ` <span class="breadcrumb-separator">›</span> <a href="${segmentPath}" class="breadcrumb-item">${segmentName}</a>`;
            }
        });
        
        this.breadcrumbContainer.innerHTML = breadcrumbHTML;
    }

    formatSegmentName(segment) {
        // Convert URL segment to readable name
        return segment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }
}

/**
 * QUICK SEARCH FUNCTIONALITY
 */
class QuickSearchController {
    constructor() {
        this.searchInput = document.querySelector('.search-input');
        this.searchResults = document.querySelector('.search-results');
        this.searchIcon = document.querySelector('.search-icon');
        
        this.searchData = []; // Will be populated from API
        this.searchTimeout = null;
        
        this.init();
    }

    init() {
        if (this.searchInput) {
            this.setupEventListeners();
            this.loadSearchData();
        }
    }

    setupEventListeners() {
        this.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.performSearch(e.target.value);
            }, 300);
        });

        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.trim()) {
                this.showResults();
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                this.hideResults();
            }
        });

        this.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideResults();
                this.searchInput.blur();
            }
        });
    }

    async loadSearchData() {
        try {
            // This will be replaced with actual API calls
            this.searchData = [
                { type: 'opportunity', title: 'Senior Reservoir Engineer', company: 'Shell Nigeria' },
                { type: 'company', title: 'TotalEnergies Nigeria', sector: 'Upstream' },
                { type: 'regulatory', title: 'New EIA Guidelines', source: 'NUPRC' },
                { type: 'insight', title: 'Q3 Production Report', category: 'Market Intelligence' }
            ];
        } catch (error) {
            console.error('Failed to load search data:', error);
        }
    }

    performSearch(query) {
        if (!query.trim()) {
            this.hideResults();
            return;
        }

        const results = this.searchData.filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            (item.company && item.company.toLowerCase().includes(query.toLowerCase())) ||
            (item.sector && item.sector.toLowerCase().includes(query.toLowerCase()))
        ).slice(0, 5); // Limit to 5 results

        this.displayResults(results, query);
    }

    displayResults(results, query) {
        if (!this.searchResults) return;

        if (results.length === 0) {
            this.searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
        } else {
            this.searchResults.innerHTML = results.map(result => `
                <div class="search-result-item" onclick="navigationController.handleSearchResult('${result.type}', '${result.title}')">
                    <div class="search-result-title">${this.highlightQuery(result.title, query)}</div>
                    <div class="search-result-meta">${result.company || result.sector || result.source || result.category}</div>
                </div>
            `).join('');
        }

        this.showResults();
    }

    highlightQuery(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<mark>$1</mark>');
    }

    showResults() {
        if (this.searchResults) {
            this.searchResults.classList.add('show');
        }
    }

    hideResults() {
        if (this.searchResults) {
            this.searchResults.classList.remove('show');
        }
    }

    handleSearchResult(type, title) {
        // Handle search result click
        console.log(`Search result clicked: ${type} - ${title}`);
        this.hideResults();
        this.searchInput.value = '';
        
        // Navigate to appropriate page based on type
        switch (type) {
            case 'opportunity':
                window.location.href = 'pages/opportunities.html';
                break;
            case 'company':
                window.location.href = 'pages/directory.html';
                break;
            case 'regulatory':
                window.location.href = 'pages/regulatory.html';
                break;
            case 'insight':
                window.location.href = 'pages/insights.html';
                break;
        }
    }
}

// Initialize navigation controllers when DOM is loaded
let navigationController;
let breadcrumbController;
let quickSearchController;

document.addEventListener('DOMContentLoaded', () => {
    navigationController = new NavigationController();
    breadcrumbController = new BreadcrumbController();
    quickSearchController = new QuickSearchController();
});

// Export for global access
window.NavigationController = NavigationController;
window.navigationController = navigationController;