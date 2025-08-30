/**
 * THE PIPELINE - MAIN APPLICATION CONTROLLER
 * Enhanced functionality with animations and API integration
 */

class PipelineApp {
    constructor() {
        this.isInitialized = false;
        this.scrollController = null;
        this.animationController = null;
        this.dataService = null;

        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showLoadingScreen();

            // Initialize core systems
            await this.initializeCore();

            // Initialize components
            this.initializeComponents();

            // Setup event listeners
            this.setupEventListeners();

            // Load initial data
            await this.loadInitialData();

            // Hide loading screen
            this.hideLoadingScreen();

            // Mark as initialized
            this.isInitialized = true;

            console.log("🚀 The Pipeline initialized successfully");
        } catch (error) {
            console.error("Failed to initialize The Pipeline:", error);
            this.handleInitializationError(error);
        }
    }

    showLoadingScreen() {
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) {
            loadingScreen.classList.remove("hidden");
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) {
            setTimeout(() => {
                loadingScreen.classList.add("hidden");
                // Trigger entrance animations
                this.triggerEntranceAnimations();
            }, 1000);
        }
    }

    async initializeCore() {
        // Initialize scroll controller
        this.scrollController = new ScrollController();

        // Initialize animation controller
        this.animationController = new AnimationController();

        // Initialize data service
        this.dataService = new DataService();

        // Wait for critical resources
        await this.waitForCriticalResources();
    }

    async waitForCriticalResources() {
        // Wait for fonts to load
        if ("fonts" in document) {
            await document.fonts.ready;
        }

        // Wait for critical images to load (if any)
        const criticalImages = document.querySelectorAll("img[data-critical]");
        if (criticalImages.length > 0) {
            await Promise.all(
                [...criticalImages].map(img => {
                    return new Promise(resolve => {
                        if (img.complete) {
                            resolve();
                        } else {
                            img.onload = resolve;
                            img.onerror = resolve; // Don't fail if image doesn't load
                        }
                    });
                })
            );
        }
    }

    initializeComponents() {
        // Initialize counter animations
        this.initializeCounters();

        // Initialize scroll animations
        this.initializeScrollAnimations();

        // Initialize quick access grid
        this.initializeQuickAccess();

        // Initialize toast notifications
        this.initializeToasts();
    }

    initializeCounters() {
        const counters = document.querySelectorAll("[data-count]");
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (
                        entry.isIntersecting &&
                        !entry.target.classList.contains("counted")
                    ) {
                        this.animateCounter(entry.target);
                        entry.target.classList.add("counted");
                    }
                });
            },
            { threshold: 0.7 }
        );

        counters.forEach(counter => observer.observe(counter));
    }

    animateCounter(element) {
        const target = parseInt(element.getAttribute("data-count"));
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += step;
            if (current < target) {
                element.textContent = Math.floor(current);
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = target;
            }
        };

        updateCounter();
    }

    initializeScrollAnimations() {
        const animatedElements = document.querySelectorAll(
            ".fade-in, .slide-up, .scale-in"
        );
        const observer = new IntersectionObserver(
            entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.animationDelay = "0s";
                        entry.target.style.animationFillMode = "forwards";
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "0px 0px -50px 0px"
            }
        );

        animatedElements.forEach(el => {
            el.style.opacity = "0";
            observer.observe(el);
        });
    }

    async initializeQuickAccess() {
        const quickAccessGrid = document.getElementById("quickAccessGrid");
        if (!quickAccessGrid) return;

        try {
            const quickAccessItems =
                await this.dataService.getQuickAccessItems();
            this.renderQuickAccessItems(quickAccessGrid, quickAccessItems);
        } catch (error) {
            console.error("Failed to load quick access items:", error);
            this.renderQuickAccessFallback(quickAccessGrid);
        }
    }

    renderQuickAccessItems(container, items) {
        const itemsHTML = items
            .map(
                item => `
            <div class="quick-access-item card" onclick="pipelineApp.handleQuickAccessClick('${item.type}', '${item.id}')">
                <div class="quick-access-icon">${item.icon}</div>
                <h4 class="quick-access-title">${item.title}</h4>
                <p class="quick-access-description">${item.description}</p>
                <div class="quick-access-meta">
                    <span class="badge ${item.badgeClass}">${item.badge}</span>
                </div>
            </div>
        `
            )
            .join("");

        container.innerHTML = itemsHTML;
    }

    renderQuickAccessFallback(container) {
        const fallbackItems = [
            {
                icon: "⚡",
                title: "Latest Jobs",
                description: "View recent job postings",
                badge: "Hot",
                badgeClass: "badge-primary",
                type: "opportunities",
                id: "latest-jobs"
            },
            {
                icon: "📊",
                title: "Production Data",
                description: "Current production metrics",
                badge: "Updated",
                badgeClass: "badge-success",
                type: "insights",
                id: "production-data"
            },
            {
                icon: "📋",
                title: "New Regulations",
                description: "Recent regulatory updates",
                badge: "NUPRC",
                badgeClass: "badge-warning",
                type: "regulatory",
                id: "new-regulations"
            },
            {
                icon: "🏢",
                title: "Top Companies",
                description: "Leading industry players",
                badge: "Verified",
                badgeClass: "badge-secondary",
                type: "directory",
                id: "top-companies"
            }
        ];

        this.renderQuickAccessItems(container, fallbackItems);
    }

    handleQuickAccessClick(type, id) {
        // Track analytics
        this.trackEvent("quick_access", "click", `${type}_${id}`);

        // Navigate to appropriate section
        switch (type) {
            case "opportunities":
                window.location.href = "pages/opportunities.html";
                break;
            case "insights":
                window.location.href = "pages/insights.html";
                break;
            case "regulatory":
                window.location.href = "pages/regulatory.html";
                break;
            case "directory":
                window.location.href = "pages/directory.html";
                break;
        }
    }

    initializeToasts() {
        // Auto-show welcome toast after loading
        setTimeout(() => {
            this.showToast(
                "Welcome to The Pipeline! Your gateway to Nigeria's O&G sector.",
                "info",
                5000
            );
        }, 2000);
    }

    setupEventListeners() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener("click", e => {
                e.preventDefault();
                const target = document.querySelector(
                    anchor.getAttribute("href")
                );
                if (target) {
                    this.scrollToElement(target);
                }
            });
        });

        // CTA button interactions
        document
            .querySelectorAll(".cta-primary, .cta-secondary")
            .forEach(button => {
                button.addEventListener("click", e => {
                    this.handleCTAClick(e.target, e);
                });
            });

        // Feature card interactions
        document.querySelectorAll(".feature-card").forEach(card => {
            card.addEventListener("click", () => {
                this.handleFeatureCardClick(card);
            });
        });

        // Performance monitoring
        window.addEventListener("load", () => {
            this.measurePerformance();
        });

        // Error handling
        window.addEventListener("error", e => {
            this.handleError(e.error);
        });

        // Unhandled promise rejections
        window.addEventListener("unhandledrejection", e => {
            this.handleError(e.reason);
        });
    }

    async loadInitialData() {
        try {
            // Load homepage stats
            const stats = await this.dataService.getHomePageStats();
            this.updateStats(stats);

            // Load recent updates
            const recentUpdates = await this.dataService.getRecentUpdates();
            this.updateRecentUpdates(recentUpdates);
        } catch (error) {
            console.error("Failed to load initial data:", error);
            // Continue with fallback data
        }
    }

    updateStats(stats) {
        if (!stats) return;

        Object.entries(stats).forEach(([key, value]) => {
            const element = document.querySelector(`[data-count="${key}"]`);
            if (element) {
                element.setAttribute("data-count", value);
            }
        });
    }

    updateRecentUpdates(updates) {
        // This would update any recent updates sections
        console.log("Recent updates:", updates);
    }

    handleCTAClick(button, event) {
        // Add click effect
        button.style.transform = "scale(0.98)";
        setTimeout(() => {
            button.style.transform = "";
        }, 150);

        // Track analytics
        const action = button.textContent
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
        this.trackEvent("cta", "click", action);

        // Handle specific actions
        if (button.textContent.includes("Explore")) {
            event.preventDefault();
            this.scrollToElement(document.getElementById("features"));
        }
    }

    handleFeatureCardClick(card) {
        const featureType = card.getAttribute("data-feature");
        if (featureType) {
            this.trackEvent("feature_card", "click", featureType);

            // Navigate to appropriate page
            const pageMap = {
                opportunities: "pages/opportunities.html",
                directory: "pages/directory.html",
                regulatory: "pages/regulatory.html",
                insights: "pages/insights.html"
            };

            if (pageMap[featureType]) {
                window.location.href = pageMap[featureType];
            }
        }
    }

    scrollToElement(element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition =
            elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }

    triggerEntranceAnimations() {
        // Trigger hero content animation
        const heroContent = document.querySelector(".hero-content");
        if (heroContent) {
            heroContent.style.animation = "fade-in 1s ease forwards";
        }

        // Trigger feature cards animation with delay
        const featureCards = document.querySelectorAll(".feature-card");
        featureCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.animation = "slide-up 0.6s ease forwards";
            }, index * 200);
        });
    }

    // Toast notification system
    showToast(message, type = "info", duration = 4000) {
        const toast = document.createElement("div");
        toast.className = `toast ${type}`;

        const icons = {
            info: "ℹ️",
            success: "✅",
            warning: "⚠️",
            error: "❌"
        };

        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icons[type]}</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Show toast
        setTimeout(() => toast.classList.add("show"), 100);

        // Auto hide
        const hideTimeout = setTimeout(() => this.hideToast(toast), duration);

        // Manual close
        toast.querySelector(".toast-close").addEventListener("click", () => {
            clearTimeout(hideTimeout);
            this.hideToast(toast);
        });
    }

    hideToast(toast) {
        toast.classList.remove("show");
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    measurePerformance() {
        if ("performance" in window) {
            const navigation = performance.getEntriesByType("navigation")[0];
            const loadTime =
                navigation.loadEventEnd - navigation.loadEventStart;

            console.log(`Page load time: ${loadTime}ms`);

            // Track performance metrics
            this.trackEvent("performance", "page_load", Math.round(loadTime));
        }
    }

    handleError(error) {
        console.error("Application error:", error);

        // Show user-friendly error message
        this.showToast(
            "Something went wrong. Please refresh the page if issues persist.",
            "error",
            6000
        );

        // Track error
        this.trackEvent("error", "application_error", error.message);
    }

    handleInitializationError(error) {
        console.error("Initialization failed:", error);

        // Hide loading screen
        const loadingScreen = document.getElementById("loadingScreen");
        if (loadingScreen) {
            loadingScreen.classList.add("hidden");
        }

        // Show error state
        document.body.innerHTML = `
            <div class="error-state">
                <h1>⚠️ System Unavailable</h1>
                <p>The Pipeline is currently experiencing technical difficulties.</p>
                <button onclick="window.location.reload()" class="btn btn-primary">
                    Try Again
                </button>
            </div>
        `;
    }

    trackEvent(category, action, label = null, value = null) {
        // Console logging for development
        console.log(
            `📊 Analytics: ${category} -> ${action}${
                label ? ` (${label})` : ""
            }${value ? ` = ${value}` : ""}`
        );

        // Google Analytics 4
        if (typeof gtag !== "undefined") {
            gtag("event", action, {
                event_category: category,
                event_label: label,
                value: value
            });
        }

        // Custom analytics can be added here
    }
}

/**
 * SCROLL CONTROLLER
 * Handles scroll-based animations and effects
 */
class ScrollController {
    constructor() {
        this.scrollY = 0;
        this.lastScrollY = 0;
        this.ticking = false;
        this.parallaxElements = [];

        this.init();
    }

    init() {
        this.findParallaxElements();
        this.setupScrollListener();
    }

    findParallaxElements() {
        // Geological layers
        this.parallaxElements = document.querySelectorAll("[data-speed]");

        // Floating elements
        const floatingElements = document.querySelectorAll("[data-float]");
        floatingElements.forEach(el => {
            const speed = el.getAttribute("data-float");
            const speedValue =
                speed === "slow" ? 0.2 : speed === "medium" ? 0.4 : 0.6;
            el.setAttribute("data-speed", speedValue);
            this.parallaxElements = [...this.parallaxElements, el];
        });
    }

    setupScrollListener() {
        window.addEventListener(
            "scroll",
            () => {
                this.requestTick();
            },
            { passive: true }
        );
    }

    requestTick() {
        if (!this.ticking) {
            requestAnimationFrame(() => {
                this.updateScroll();
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    updateScroll() {
        this.scrollY = window.pageYOffset;

        // Update parallax elements
        this.updateParallaxElements();

        // Update scroll-based animations
        this.updateScrollAnimations();

        this.lastScrollY = this.scrollY;
    }

    updateParallaxElements() {
        const windowHeight = window.innerHeight;

        this.parallaxElements.forEach(element => {
            const speed = parseFloat(element.getAttribute("data-speed")) || 0.5;
            const yPos = -(this.scrollY * speed);
            const opacity = Math.max(
                0.3,
                1 - (this.scrollY / windowHeight) * 0.8
            );

            element.style.transform = `translateY(${yPos}px)`;
            element.style.opacity = opacity;
        });
    }

    updateScrollAnimations() {
        // Add any scroll-based animations here
        const scrollProgress =
            this.scrollY / (document.body.scrollHeight - window.innerHeight);

        // Update any progress indicators
        const progressElements = document.querySelectorAll(
            "[data-scroll-progress]"
        );
        progressElements.forEach(el => {
            el.style.width = `${scrollProgress * 100}%`;
        });
    }
}

/**
 * ANIMATION CONTROLLER
 * Handles complex animations and transitions
 */
class AnimationController {
    constructor() {
        this.activeAnimations = new Map();
        this.init();
    }

    init() {
        this.setupIntersectionObserver();
        this.setupAnimationEndListeners();
    }

    setupIntersectionObserver() {
        const options = {
            threshold: [0.1, 0.3, 0.7],
            rootMargin: "0px 0px -10% 0px"
        };

        this.observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.triggerAnimation(
                        entry.target,
                        entry.intersectionRatio
                    );
                }
            });
        }, options);

        // Observe elements with animation classes
        document.querySelectorAll("[data-animate]").forEach(el => {
            this.observer.observe(el);
        });
    }

    setupAnimationEndListeners() {
        document.addEventListener("animationend", e => {
            this.handleAnimationEnd(e.target, e.animationName);
        });
    }

    triggerAnimation(element, ratio) {
        const animationType = element.getAttribute("data-animate");
        const delay = parseInt(element.getAttribute("data-delay")) || 0;

        setTimeout(() => {
            switch (animationType) {
                case "fade-in":
                    this.fadeIn(element);
                    break;
                case "slide-up":
                    this.slideUp(element);
                    break;
                case "scale-in":
                    this.scaleIn(element);
                    break;
                case "counter":
                    this.animateCounter(element);
                    break;
                default:
                    element.classList.add("animate");
            }
        }, delay);
    }

    fadeIn(element) {
        element.style.opacity = "0";
        element.style.transform = "translateY(20px)";
        element.style.transition = "all 0.6s ease";

        requestAnimationFrame(() => {
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";
        });
    }

    slideUp(element) {
        element.style.opacity = "0";
        element.style.transform = "translateY(50px)";
        element.style.transition = "all 0.8s cubic-bezier(0.25, 0.1, 0.25, 1)";

        requestAnimationFrame(() => {
            element.style.opacity = "1";
            element.style.transform = "translateY(0)";
        });
    }

    scaleIn(element) {
        element.style.opacity = "0";
        element.style.transform = "scale(0.8)";
        element.style.transition = "all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";

        requestAnimationFrame(() => {
            element.style.opacity = "1";
            element.style.transform = "scale(1)";
        });
    }

    handleAnimationEnd(element, animationName) {
        // Clean up completed animations
        if (this.activeAnimations.has(element)) {
            this.activeAnimations.delete(element);
        }

        // Remove animation classes
        element.classList.remove("animating");

        // Trigger any callback functions
        const callback = element.getAttribute("data-animation-callback");
        if (callback && typeof window[callback] === "function") {
            window[callback](element);
        }
    }
}

/**
 * DATA SERVICE
 * Handles API communication and data management
 */
class DataService {
    constructor() {
        this.apiUrl =
            window.PIPELINE_CONFIG?.apiUrl ||
            "https://giving-ants-2f29c3b4e4.strapiapp.com/api";
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchWithCache(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            const data = await response.json();

            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error("Fetch error:", error);

            // Return cached data if available, even if expired
            if (cached) {
                console.warn("Using expired cache data due to fetch error");
                return cached.data;
            }

            throw error;
        }
    }

    async getHomePageStats() {
        try {
            // In development, return mock data
            if (
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1"
            ) {
                return this.getMockStats();
            }

            // Production API call
            const data = await this.fetchWithCache(
                `${this.apiUrl}/homepage-stats`
            );
            return data;
        } catch (error) {
            console.error("Failed to fetch homepage stats:", error);
            return this.getMockStats();
        }
    }

    getMockStats() {
        return {
            companies: 500 + Math.floor(Math.random() * 50),
            opportunities: 1250 + Math.floor(Math.random() * 100),
            updates: 48 + Math.floor(Math.random() * 10)
        };
    }

    async getRecentUpdates() {
        try {
            if (
                window.location.hostname === "localhost" ||
                window.location.hostname === "127.0.0.1"
            ) {
                return this.getMockUpdates();
            }

            const data = await this.fetchWithCache(
                `${this.apiUrl}/recent-updates`
            );
            return data;
        } catch (error) {
            console.error("Failed to fetch recent updates:", error);
            return this.getMockUpdates();
        }
    }

    getMockUpdates() {
        return [
            {
                id: 1,
                title: "NUPRC Issues New Drilling Guidelines",
                type: "regulatory",
                date: "2024-08-22",
                summary:
                    "Updated safety protocols for offshore drilling operations."
            },
            {
                id: 2,
                title: "Shell Nigeria Announces Major Investment",
                type: "news",
                date: "2024-08-21",
                summary: "$2B investment in gas development projects approved."
            }
        ];
    }

    async getQuickAccessItems() {
        // Return mock data for now - will be replaced with real API
        return [
            {
                id: "latest-opportunities",
                type: "opportunities",
                icon: "💼",
                title: "Latest Opportunities",
                description: "View the newest job postings and tenders",
                badge: "Hot",
                badgeClass: "badge-primary"
            },
            {
                id: "production-data",
                type: "insights",
                icon: "📊",
                title: "Production Dashboard",
                description: "Real-time production metrics and trends",
                badge: "Live",
                badgeClass: "badge-success"
            },
            {
                id: "regulatory-updates",
                type: "regulatory",
                icon: "📋",
                title: "Regulatory Updates",
                description: "Latest policy changes and compliance news",
                badge: "NUPRC",
                badgeClass: "badge-warning"
            },
            {
                id: "company-directory",
                type: "directory",
                icon: "🏢",
                title: "Company Directory",
                description: "Browse verified industry companies",
                badge: "Verified",
                badgeClass: "badge-secondary"
            }
        ];
    }

    // Sanity.io integration methods (for when content is ready)
    async fetchFromSanity(query) {
        try {
            const projectId = "your-project-id"; // Will be configured
            const dataset = "production";
            const apiVersion = "2024-08-22";

            const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}?query=${encodeURIComponent(
                query
            )}`;

            const response = await this.fetchWithCache(url);
            return response.result;
        } catch (error) {
            console.error("Sanity fetch error:", error);
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
        console.log("Data cache cleared");
    }
}

// Global error handler for unhandled promises
window.addEventListener("unhandledrejection", event => {
    console.error("Unhandled promise rejection:", event.reason);
    event.preventDefault(); // Prevent the default browser handling
});

// Performance monitoring
if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === "paint") {
                console.log(`${entry.name}: ${entry.startTime}ms`);
            }
        }
    });

    observer.observe({ entryTypes: ["paint"] });
}

// Initialize the application
let pipelineApp;

document.addEventListener("DOMContentLoaded", () => {
    pipelineApp = new PipelineApp();
});

// Export for global access
window.PipelineApp = PipelineApp;
window.pipelineApp = pipelineApp;
