/**
 * THE PIPELINE - CLIENT-SIDE ROUTER
 * Simple hash-based routing for single-page navigation
 */

class PipelineRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.contentContainer = null;
        this.loadingElement = null;

        this.init();
    }

    init() {
        this.contentContainer =
            document.getElementById("main-content") || document.body;
        this.setupRoutes();
        this.setupEventListeners();

        // Handle initial route
        this.handleRoute();
    }

    setupRoutes() {
        // Define all routes
        this.addRoute("", this.renderHome);
        this.addRoute("home", this.renderHome);
        this.addRoute("opportunities", this.renderOpportunities);
        this.addRoute("opportunities/:id", this.renderOpportunityDetail);
        this.addRoute("directory", this.renderDirectory);
        this.addRoute("directory/:id", this.renderCompanyDetail);
        this.addRoute("regulatory", this.renderRegulatory);
        this.addRoute("regulatory/:id", this.renderRegulatoryDetail);
        this.addRoute("insights", this.renderInsights);
        this.addRoute("insights/:id", this.renderInsightDetail);
        this.addRoute("search", this.renderSearch);
    }

    setupEventListeners() {
        // Listen for hash changes
        window.addEventListener("hashchange", () => this.handleRoute());

        // Intercept navigation clicks
        document.addEventListener("click", e => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const route = link.getAttribute("href").substring(1);
                this.navigate(route);
            }
        });
    }

    addRoute(path, handler) {
        this.routes.set(path, handler.bind(this));
    }

    navigate(route) {
        if (route !== this.getCurrentRoute()) {
            window.location.hash = route;
        }
    }

    getCurrentRoute() {
        return window.location.hash.substring(1) || "";
    }

    parseRoute(route) {
        const parts = route.split("/");
        const params = {};
        let matchedPath = "";

        // Find matching route pattern
        for (const [path] of this.routes) {
            const pathParts = path.split("/");

            if (pathParts.length === parts.length) {
                let isMatch = true;
                const tempParams = {};

                for (let i = 0; i < pathParts.length; i++) {
                    if (pathParts[i].startsWith(":")) {
                        // Parameter placeholder
                        const paramName = pathParts[i].substring(1);
                        tempParams[paramName] = parts[i];
                    } else if (pathParts[i] !== parts[i]) {
                        isMatch = false;
                        break;
                    }
                }

                if (isMatch) {
                    matchedPath = path;
                    Object.assign(params, tempParams);
                    break;
                }
            }
        }

        return { path: matchedPath, params, route };
    }

    async handleRoute() {
        const route = this.getCurrentRoute();
        const { path, params } = this.parseRoute(route);

        // Show loading state
        this.showLoading();

        try {
            const handler = this.routes.get(path);
            if (handler) {
                this.currentRoute = route;
                await handler(params);
                this.updateNavigation();
                this.trackPageView(route);
            } else {
                this.render404();
            }
        } catch (error) {
            console.error("Route handling error:", error);
            this.renderError(error);
        } finally {
            this.hideLoading();
        }
    }

    updateNavigation() {
        // Update active navigation states
        document.querySelectorAll(".nav-item").forEach(item => {
            item.classList.remove("active");
        });

        const route = this.getCurrentRoute();
        const mainRoute = route.split("/")[0];

        const activeNavItem = document.querySelector(
            `.nav-item[href="#${mainRoute}"]`
        );
        if (activeNavItem) {
            activeNavItem.classList.add("active");
        }
    }

    showLoading() {
        const existingLoader = document.querySelector(".route-loader");
        if (!existingLoader) {
            const loader = document.createElement("div");
            loader.className = "route-loader";
            loader.innerHTML = '<div class="spinner"></div>';
            document.body.appendChild(loader);
        }
    }

    hideLoading() {
        const loader = document.querySelector(".route-loader");
        if (loader) {
            loader.remove();
        }
    }

    // ROUTE HANDLERS

    async renderHome(params = {}) {
        const template = `
            <section class="hero-section" id="home">
                <!-- Existing hero content -->
                ${this.getHeroHTML()}
            </section>
            <section class="features-section" id="features">
                ${await this.getFeaturesHTML()}
            </section>
            <section class="quick-access-section">
                ${await this.getQuickAccessHTML()}
            </section>
        `;

        this.setContent(template);
    }

    async renderOpportunities(params = {}) {
        const { page = 1, type = "", sector = "" } = params;

        try {
            const opportunities = await window.appwriteAPI.getOpportunities({
                type,
                sector,
                limit: 12,
                offset: (page - 1) * 12
            });

            const template = `
                <div class="page-header">
                    <div class="container">
                        <h1 class="page-title">Opportunities Hub</h1>
                        <p class="page-subtitle">Latest jobs, tenders, and procurement opportunities</p>
                    </div>
                </div>
                
                <div class="page-content">
                    <div class="container">
                        ${this.getFiltersHTML("opportunities", {
                            type,
                            sector
                        })}
                        <div class="opportunities-grid">
                            ${opportunities
                                .map(opp => this.getOpportunityCardHTML(opp))
                                .join("")}
                        </div>
                        ${this.getPaginationHTML(page, opportunities.length)}
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    async renderOpportunityDetail(params) {
        const { id } = params;

        try {
            const opportunity = await window.appwriteAPI.getOpportunityById(id);

            if (!opportunity) {
                this.render404();
                return;
            }

            const template = `
                <div class="detail-page">
                    <div class="detail-header">
                        <div class="container">
                            <nav class="breadcrumb">
                                <a href="#opportunities">Opportunities</a> › ${
                                    opportunity.title
                                }
                            </nav>
                            <div class="detail-meta">
                                <span class="badge badge-primary">${
                                    opportunity.opportunityType
                                }</span>
                                <span class="detail-date">Closes: ${window.appwriteAPI.formatDate(
                                    opportunity.closingDate
                                )}</span>
                            </div>
                            <h1 class="detail-title">${opportunity.title}</h1>
                            <div class="company-info">
                                <strong>${
                                    opportunity.company.companyName
                                }</strong> • ${opportunity.company.sector}
                            </div>
                        </div>
                    </div>
                    
                    <div class="detail-content">
                        <div class="container">
                            <div class="content-grid">
                                <div class="main-content">
                                    <section class="detail-section">
                                        <h3>Description</h3>
                                        <p>${opportunity.description}</p>
                                    </section>
                                    
                                    ${
                                        opportunity.requirements
                                            ? `
                                        <section class="detail-section">
                                            <h3>Requirements</h3>
                                            <p>${opportunity.requirements}</p>
                                        </section>
                                    `
                                            : ""
                                    }
                                    
                                    ${
                                        opportunity.benefits
                                            ? `
                                        <section class="detail-section">
                                            <h3>Benefits</h3>
                                            <p>${opportunity.benefits}</p>
                                        </section>
                                    `
                                            : ""
                                    }
                                </div>
                                
                                <div class="sidebar">
                                    <div class="card">
                                        <h4>Application Details</h4>
                                        <div class="detail-item">
                                            <strong>Closing Date:</strong>
                                            <span>${window.appwriteAPI.formatDate(
                                                opportunity.closingDate
                                            )}</span>
                                        </div>
                                        ${
                                            opportunity.location
                                                ? `
                                            <div class="detail-item">
                                                <strong>Location:</strong>
                                                <span>${opportunity.location}</span>
                                            </div>
                                        `
                                                : ""
                                        }
                                        <a href="${
                                            opportunity.link
                                        }" target="_blank" class="btn btn-primary">
                                            Apply Now
                                        </a>
                                    </div>
                                    
                                    <div class="card">
                                        <h4>Company Information</h4>
                                        <div class="company-card">
                                            <h5>${
                                                opportunity.company.companyName
                                            }</h5>
                                            <p>Sector: ${
                                                opportunity.company.sector
                                            }</p>
                                            ${
                                                opportunity.company.website
                                                    ? `
                                                <a href="${opportunity.company.website}" target="_blank">Visit Website</a>
                                            `
                                                    : ""
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    async renderDirectory(params = {}) {
        const { page = 1, sector = "" } = params;

        try {
            const companies = await window.appwriteAPI.getCompanies({
                sector,
                limit: 12,
                offset: (page - 1) * 12
            });

            const template = `
                <div class="page-header">
                    <div class="container">
                        <h1 class="page-title">Company Directory</h1>
                        <p class="page-subtitle">NCDMB-verified companies in Nigeria's oil and gas sector</p>
                    </div>
                </div>
                
                <div class="page-content">
                    <div class="container">
                        ${this.getFiltersHTML("directory", { sector })}
                        <div class="companies-grid">
                            ${companies
                                .map(company =>
                                    this.getCompanyCardHTML(company)
                                )
                                .join("")}
                        </div>
                        ${this.getPaginationHTML(page, companies.length)}
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    async renderCompanyDetail(params) {
        const { id } = params;

        try {
            const company = await window.appwriteAPI.getCompanyById(id);

            if (!company) {
                this.render404();
                return;
            }

            const template = `
                <div class="detail-page">
                    <div class="detail-header">
                        <div class="container">
                            <nav class="breadcrumb">
                                <a href="#directory">Directory</a> › ${
                                    company.companyName
                                }
                            </nav>
                            <div class="detail-meta">
                                <span class="badge badge-secondary">${
                                    company.sector
                                }</span>
                                ${
                                    company.ncdmbNumber
                                        ? `<span class="badge badge-success">NCDMB: ${company.ncdmbNumber}</span>`
                                        : ""
                                }
                            </div>
                            <h1 class="detail-title">${company.companyName}</h1>
                        </div>
                    </div>
                    
                    <div class="detail-content">
                        <div class="container">
                            <div class="content-grid">
                                <div class="main-content">
                                    <section class="detail-section">
                                        <h3>About</h3>
                                        <p>${company.description}</p>
                                    </section>
                                    
                                    ${
                                        company.servicesOffered &&
                                        company.servicesOffered.length > 0
                                            ? `
                                        <section class="detail-section">
                                            <h3>Services Offered</h3>
                                            <ul class="services-list">
                                                ${company.servicesOffered
                                                    .map(
                                                        service =>
                                                            `<li>${service}</li>`
                                                    )
                                                    .join("")}
                                            </ul>
                                        </section>
                                    `
                                            : ""
                                    }
                                    
                                    ${
                                        company.projects &&
                                        company.projects.length > 0
                                            ? `
                                        <section class="detail-section">
                                            <h3>Recent Projects</h3>
                                            <div class="projects-list">
                                                ${company.projects
                                                    .map(
                                                        project => `
                                                    <div class="project-item">
                                                        <h4>${project.title}</h4>
                                                        <p>${project.description}</p>
                                                        <span class="badge">${project.status}</span>
                                                    </div>
                                                `
                                                    )
                                                    .join("")}
                                            </div>
                                        </section>
                                    `
                                            : ""
                                    }
                                </div>
                                
                                <div class="sidebar">
                                    <div class="card">
                                        <h4>Contact Information</h4>
                                        ${
                                            company.website
                                                ? `
                                            <div class="detail-item">
                                                <strong>Website:</strong>
                                                <a href="${company.website}" target="_blank">${company.website}</a>
                                            </div>
                                        `
                                                : ""
                                        }
                                        ${
                                            company.contactEmail
                                                ? `
                                            <div class="detail-item">
                                                <strong>Email:</strong>
                                                <a href="mailto:${company.contactEmail}">${company.contactEmail}</a>
                                            </div>
                                        `
                                                : ""
                                        }
                                        <div class="detail-item">
                                            <strong>Sector:</strong>
                                            <span>${company.sector}</span>
                                        </div>
                                        ${
                                            company.ncdmbNumber
                                                ? `
                                            <div class="detail-item">
                                                <strong>NCDMB Number:</strong>
                                                <span>${company.ncdmbNumber}</span>
                                            </div>
                                        `
                                                : ""
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    async renderRegulatory(params = {}) {
        const { page = 1, source = "" } = params;

        try {
            const updates = await window.appwriteAPI.getRegulatoryUpdates({
                source,
                limit: 12,
                offset: (page - 1) * 12
            });

            const template = `
                <div class="page-header">
                    <div class="container">
                        <h1 class="page-title">Regulatory Updates</h1>
                        <p class="page-subtitle">Latest policy changes and compliance requirements</p>
                    </div>
                </div>
                
                <div class="page-content">
                    <div class="container">
                        ${this.getFiltersHTML("regulatory", { source })}
                        <div class="updates-list">
                            ${updates
                                .map(update =>
                                    this.getRegulatoryCardHTML(update)
                                )
                                .join("")}
                        </div>
                        ${this.getPaginationHTML(page, updates.length)}
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    async renderRegulatoryDetail(params) {
        const { id } = params;

        try {
            const update = await window.appwriteAPI.getRegulatoryUpdateById(id);

            if (!update) {
                this.render404();
                return;
            }

            const template = `
                <div class="detail-page">
                    <div class="detail-header">
                        <div class="container">
                            <nav class="breadcrumb">
                                <a href="#regulatory">Regulatory Updates</a> › ${
                                    update.title
                                }
                            </nav>
                            <div class="detail-meta">
                                <span class="badge badge-warning">${
                                    update.source
                                }</span>
                                <span class="detail-date">${window.appwriteAPI.formatDate(
                                    update.publishedDate
                                )}</span>
                            </div>
                            <h1 class="detail-title">${update.title}</h1>
                        </div>
                    </div>
                    
                    <div class="detail-content">
                        <div class="container">
                            <div class="content-grid">
                                <div class="main-content">
                                    <section class="detail-section">
                                        <h3>Summary</h3>
                                        <p>${update.summary}</p>
                                    </section>
                                    
                                    ${
                                        update.fullText
                                            ? `
                                        <section class="detail-section">
                                            <h3>Full Details</h3>
                                            <div class="regulatory-text">${update.fullText}</div>
                                        </section>
                                    `
                                            : ""
                                    }
                                    
                                    ${
                                        update.impact
                                            ? `
                                        <section class="detail-section">
                                            <h3>Impact Assessment</h3>
                                            <p>${update.impact}</p>
                                        </section>
                                    `
                                            : ""
                                    }
                                    
                                    ${
                                        update.relatedUpdates &&
                                        update.relatedUpdates.length > 0
                                            ? `
                                        <section class="detail-section">
                                            <h3>Related Updates</h3>
                                            <div class="related-updates">
                                                ${update.relatedUpdates
                                                    .map(
                                                        related => `
                                                    <div class="related-item">
                                                        <h4><a href="#regulatory/${
                                                            related._id
                                                        }">${
                                                            related.title
                                                        }</a></h4>
                                                        <span class="meta">${
                                                            related.source
                                                        } • ${window.appwriteAPI.formatDate(
                                                            related.publishedDate
                                                        )}</span>
                                                    </div>
                                                `
                                                    )
                                                    .join("")}
                                            </div>
                                        </section>
                                    `
                                            : ""
                                    }
                                </div>
                                
                                <div class="sidebar">
                                    <div class="card">
                                        <h4>Update Details</h4>
                                        <div class="detail-item">
                                            <strong>Source:</strong>
                                            <span>${update.source}</span>
                                        </div>
                                        <div class="detail-item">
                                            <strong>Published:</strong>
                                            <span>${window.appwriteAPI.formatDate(
                                                update.publishedDate
                                            )}</span>
                                        </div>
                                        ${
                                            update.effectiveDate
                                                ? `
                                            <div class="detail-item">
                                                <strong>Effective Date:</strong>
                                                <span>${window.appwriteAPI.formatDate(
                                                    update.effectiveDate
                                                )}</span>
                                            </div>
                                        `
                                                : ""
                                        }
                                        ${
                                            update.document
                                                ? `
                                            <a href="${update.document}" target="_blank" class="btn btn-outline">
                                                Download Document
                                            </a>
                                        `
                                                : ""
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    // Continue with the remaining methods that were cut off...

    async renderInsights(params = {}) {
        const { page = 1, category = "" } = params;

        try {
            const articles = await window.appwriteAPI.getArticles({
                category,
                limit: 12,
                offset: (page - 1) * 12
            });

            const template = `
                <div class="page-header">
                    <div class="container">
                        <h1 class="page-title">Market Intelligence</h1>
                        <p class="page-subtitle">Industry insights, analysis, and market trends</p>
                    </div>
                </div>
                
                <div class="page-content">
                    <div class="container">
                        ${this.getFiltersHTML("insights", { category })}
                        <div class="insights-grid">
                            ${articles
                                .map(article =>
                                    this.getInsightCardHTML(article)
                                )
                                .join("")}
                        </div>
                        ${this.getPaginationHTML(page, articles.length)}
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    async renderInsightDetail(params) {
        const { id } = params;

        try {
            const article = await window.appwriteAPI.getArticleById(id);

            if (!article) {
                this.render404();
                return;
            }

            const template = `
                <div class="detail-page article-detail">
                    <div class="detail-header">
                        <div class="container">
                            <nav class="breadcrumb">
                                <a href="#insights">Market Intelligence</a> › ${
                                    article.title
                                }
                            </nav>
                            <div class="detail-meta">
                                ${article.tags
                                    .map(
                                        tag =>
                                            `<span class="badge badge-primary">${tag}</span>`
                                    )
                                    .join("")}
                                <span class="detail-date">${window.appwriteAPI.formatDate(
                                    article.publishedDate
                                )}</span>
                            </div>
                            <h1 class="detail-title">${article.title}</h1>
                            <div class="article-meta">
                                By <strong>${
                                    article.author
                                }</strong> • ${window.appwriteAPI.getTimeAgo(
                                    article.publishedDate
                                )}
                            </div>
                        </div>
                    </div>
                    
                    ${
                        article.coverImage
                            ? `
                        <div class="article-image">
                            <img src="${window.appwriteAPI.urlFor(
                                article.coverImage
                            )}" alt="${article.title}">
                        </div>
                    `
                            : ""
                    }
                    
                    <div class="detail-content">
                        <div class="container">
                            <div class="article-content">
                                <div class="article-summary">
                                    <p class="lead">${article.summary}</p>
                                </div>
                                
                                <div class="article-body">
                                    ${article.body}
                                </div>
                                
                                ${
                                    article.relatedArticles &&
                                    article.relatedArticles.length > 0
                                        ? `
                                    <section class="related-articles">
                                        <h3>Related Articles</h3>
                                        <div class="related-grid">
                                            ${article.relatedArticles
                                                .map(
                                                    related => `
                                                <div class="related-card">
                                                    <h4><a href="#insights/${
                                                        related._id
                                                    }">${related.title}</a></h4>
                                                    <p>${related.summary}</p>
                                                    <span class="meta">${window.appwriteAPI.formatDate(
                                                        related.publishedDate
                                                    )}</span>
                                                </div>
                                            `
                                                )
                                                .join("")}
                                        </div>
                                    </section>
                                `
                                        : ""
                                }
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    async renderSearch(params = {}) {
        const urlParams = new URLSearchParams(
            window.location.hash.split("?")[1] || ""
        );
        const q = urlParams.get("q") || "";
        const type = urlParams.get("type") || "";

        if (!q.trim()) {
            this.setContent(this.getSearchPageHTML());
            return;
        }

        try {
            const results = await window.appwriteAPI.search(
                q,
                type ? [type] : []
            );

            const template = `
                <div class="page-header">
                    <div class="container">
                        <h1 class="page-title">Search Results</h1>
                        <p class="page-subtitle">Found ${
                            results.length
                        } results for "${q}"</p>
                    </div>
                </div>
                
                <div class="page-content">
                    <div class="container">
                        ${this.getSearchFormHTML(q, type)}
                        
                        ${
                            results.length > 0
                                ? `
                            <div class="search-results">
                                ${results
                                    .map(result =>
                                        this.getSearchResultHTML(result)
                                    )
                                    .join("")}
                            </div>
                        `
                                : `
                            <div class="no-results">
                                <h3>No results found</h3>
                                <p>Try adjusting your search terms or filters</p>
                            </div>
                        `
                        }
                    </div>
                </div>
            `;

            this.setContent(template);
        } catch (error) {
            this.renderError(error);
        }
    }

    // HELPER METHODS FOR GENERATING HTML

    getHeroHTML() {
        return `
            <div class="geological-layer layer-surface" data-speed="0.2" data-depth="1"></div>
            <div class="geological-layer layer-crust" data-speed="0.5" data-depth="2"></div>
            <div class="geological-layer layer-mantle" data-speed="0.8" data-depth="3"></div>
            <div class="geological-layer layer-core" data-speed="1.2" data-depth="4"></div>

            <div class="data-vein-container">
                <div class="data-vein vein-primary" data-flow="1"></div>
                <div class="data-vein vein-secondary" data-flow="2"></div>
                <div class="data-vein vein-tertiary" data-flow="3"></div>
                <div class="data-vein vein-quaternary" data-flow="4"></div>
            </div>

            <div class="floating-elements">
                <div class="floating-element oil-rig" data-float="slow">🏗️</div>
                <div class="floating-element pipeline" data-float="medium">🔗</div>
                <div class="floating-element data-node" data-float="fast">💎</div>
                <div class="floating-element regulatory-seal" data-float="slow">🛡️</div>
            </div>

            <div class="hero-content">
                <div class="hero-badge">
                    <span class="badge-text">Nigeria's Premier O&G Platform</span>
                </div>
                <h1 class="hero-title">
                    <span class="title-primary">THE PIPELINE</span>
                    <span class="title-secondary">Navigate Nigeria's Energy Sector</span>
                </h1>
                <p class="hero-description">
                    Your central intelligence hub for market data, regulatory compliance, 
                    company insights, and industry opportunities across Nigeria's oil and gas sector.
                </p>
                <div class="hero-actions">
                    <a href="#features" class="cta-primary">Explore the Depths</a>
                    <a href="#opportunities" class="cta-secondary">View Opportunities</a>
                </div>
                <div class="hero-stats">
                    <div class="stat-item">
                        <span class="stat-number" data-count="500">0</span>
                        <span class="stat-label">Companies</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" data-count="1250">0</span>
                        <span class="stat-label">Opportunities</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-number" data-count="48">0</span>
                        <span class="stat-label">Updates/Month</span>
                    </div>
                </div>
            </div>
        `;
    }

    async getFeaturesHTML() {
        return `
            <div class="section-header">
                <h2 class="section-title">Intelligence at Every Layer</h2>
                <p class="section-subtitle">
                    Dive deep into Nigeria's oil and gas ecosystem with comprehensive data and insights
                </p>
            </div>

            <div class="features-grid">
                <div class="feature-card enhanced" data-feature="opportunities">
                    <div class="card-header">
                        <div class="feature-icon opportunities-icon">💼</div>
                        <div class="feature-badge">Live Updates</div>
                    </div>
                    <div class="card-content">
                        <h3 class="feature-title">Opportunities Hub</h3>
                        <p class="feature-description">
                            Access the latest job openings, tenders, and procurement opportunities from 
                            major operators and service companies across Nigeria.
                        </p>
                        <div class="feature-stats">
                            <div class="stat">
                                <span class="stat-value" data-count="156">0</span>
                                <span class="stat-text">Active Jobs</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value" data-count="89">0</span>
                                <span class="stat-text">Open Tenders</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-action">
                        <a href="#opportunities" class="action-btn">View Opportunities</a>
                    </div>
                </div>

                <div class="feature-card enhanced" data-feature="directory">
                    <div class="card-header">
                        <div class="feature-icon directory-icon">🏢</div>
                        <div class="feature-badge">NCDMB Verified</div>
                    </div>
                    <div class="card-content">
                        <h3 class="feature-title">Company Directory</h3>
                        <p class="feature-description">
                            Comprehensive database of operators, service providers, and suppliers 
                            with real-time NCDMB compliance and certification status.
                        </p>
                        <div class="feature-stats">
                            <div class="stat">
                                <span class="stat-value" data-count="500">0</span>
                                <span class="stat-text">Companies</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value" data-count="78">0</span>
                                <span class="stat-text">% Local Content</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-action">
                        <a href="#directory" class="action-btn">Browse Directory</a>
                    </div>
                </div>

                <div class="feature-card enhanced" data-feature="regulatory">
                    <div class="card-header">
                        <div class="feature-icon regulatory-icon">📋</div>
                        <div class="feature-badge">Real-time</div>
                    </div>
                    <div class="card-content">
                        <h3 class="feature-title">Regulatory Intelligence</h3>
                        <p class="feature-description">
                            Stay ahead of NUPRC, NCDMB, and NNPC policy changes with instant 
                            notifications and detailed compliance guidance.
                        </p>
                        <div class="feature-stats">
                            <div class="stat">
                                <span class="stat-value" data-count="24">0</span>
                                <span class="stat-text">This Month</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value" data-count="98">0</span>
                                <span class="stat-text">% Accuracy</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-action">
                        <a href="#regulatory" class="action-btn">View Updates</a>
                    </div>
                </div>

                <div class="feature-card enhanced" data-feature="insights">
                    <div class="card-header">
                        <div class="feature-icon insights-icon">📊</div>
                        <div class="feature-badge">AI-Powered</div>
                    </div>
                    <div class="card-content">
                        <h3 class="feature-title">Market Intelligence</h3>
                        <p class="feature-description">
                            Advanced analytics on production trends, pricing dynamics, and market 
                            opportunities powered by AI and local expertise.
                        </p>
                        <div class="feature-stats">
                            <div class="stat">
                                <span class="stat-value" data-count="1.8">0</span>
                                <span class="stat-text">Mbpd Production</span>
                            </div>
                            <div class="stat">
                                <span class="stat-value" data-count="12">0</span>
                                <span class="stat-text">Key Insights</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-action">
                        <a href="#insights" class="action-btn">View Insights</a>
                    </div>
                </div>
            </div>
        `;
    }

    async getQuickAccessHTML() {
        try {
            const featured = await window.appwriteAPI.getFeaturedContent();

            // Check if data exists and has properties
            if (!featured) {
                return this.getQuickAccessFallback();
            }

            return `
                <div class="quick-access-header">
                    <h3>Quick Access</h3>
                    <p>Jump directly to what you need</p>
                </div>
                <div class="quick-access-grid" id="quickAccessGrid">
                   ${this.getQuickAccessFallback()}
                </div>
            `;
        } catch (error) {
            console.error("Failed to load quick access content:", error);
            return this.getQuickAccessFallback();
        }
    }

    getQuickAccessFallback() {
        return `
        <div class="quick-access-item card" onclick="router.navigate('opportunities')">
            <div class="quick-access-icon">💼</div>
            <h4 class="quick-access-title">Latest Jobs</h4>
            <p class="quick-access-description">View recent job postings</p>
            <div class="quick-access-meta">
                <span class="badge badge-primary">Hot</span>
            </div>
        </div>
        <div class="quick-access-item card" onclick="router.navigate('regulatory')">
            <div class="quick-access-icon">📋</div>
            <h4 class="quick-access-title">New Regulations</h4>
            <p class="quick-access-description">Recent regulatory updates</p>
            <div class="quick-access-meta">
                <span class="badge badge-warning">NUPRC</span>
            </div>
        </div>
        <div class="quick-access-item card" onclick="router.navigate('directory')">
            <div class="quick-access-icon">🏢</div>
            <h4 class="quick-access-title">Top Companies</h4>
            <p class="quick-access-description">Leading industry players</p>
            <div class="quick-access-meta">
                <span class="badge badge-secondary">Verified</span>
            </div>
        </div>
    `;
    }

    getOpportunityCardHTML(opportunity) {
        return `
            <div class="opportunity-card card" onclick="router.navigate('opportunities/${
                opportunity._id
            }')">
                <div class="card-header">
                    <span class="badge badge-primary">${
                        opportunity.opportunityType
                    }</span>
                    <span class="card-date">${window.appwriteAPI.getTimeAgo(
                        opportunity.publishedAt || opportunity._createdAt
                    )}</span>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${opportunity.title}</h3>
                    <p class="card-description">${opportunity.description.substring(
                        0,
                        150
                    )}...</p>
                    <div class="card-meta">
                        <strong>${
                            opportunity.company?.companyName || "Company"
                        }</strong>
                        <span class="closing-date">Closes: ${window.appwriteAPI.formatDate(
                            opportunity.closingDate
                        )}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getCompanyCardHTML(company) {
        return `
            <div class="company-card card" onclick="router.navigate('directory/${
                company._id
            }')">
                <div class="card-header">
                    ${
                        company.logo
                            ? `<img src="${window.appwriteAPI.urlFor(
                                  company.logo
                              )}" alt="${
                                  company.companyName
                              }" class="company-logo">`
                            : ""
                    }
                    <span class="badge badge-secondary">${company.sector}</span>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${company.companyName}</h3>
                    <p class="card-description">${company.description.substring(
                        0,
                        120
                    )}...</p>
                    ${
                        company.ncdmbNumber
                            ? `<div class="ncdmb-badge">NCDMB: ${company.ncdmbNumber}</div>`
                            : ""
                    }
                </div>
            </div>
        `;
    }

    getRegulatoryCardHTML(update) {
        return `
            <div class="regulatory-card card" onclick="router.navigate('regulatory/${
                update._id
            }')">
                <div class="card-header">
                    <span class="badge badge-warning">${update.source}</span>
                    <span class="card-date">${window.appwriteAPI.formatDate(
                        update.publishedDate
                    )}</span>
                </div>
                <div class="card-body">
                    <h3 class="card-title">${update.title}</h3>
                    <p class="card-description">${update.summary.substring(
                        0,
                        150
                    )}...</p>
                </div>
            </div>
        `;
    }

    getInsightCardHTML(article) {
        return `
            <div class="insight-card card" onclick="router.navigate('insights/${
                article._id
            }')">
                ${
                    article.coverImage
                        ? `
                    <div class="card-image">
                        <img src="${window.appwriteAPI.urlFor(
                            article.coverImage
                        )}" alt="${article.title}">
                    </div>
                `
                        : ""
                }
                <div class="card-body">
                    <div class="card-meta">
                        ${
                            article.tags
                                ?.map(tag => `<span class="tag">${tag}</span>`)
                                .join("") || ""
                        }
                        <span class="card-date">${window.appwriteAPI.formatDate(
                            article.publishedDate
                        )}</span>
                    </div>
                    <h3 class="card-title">${article.title}</h3>
                    <p class="card-description">${article.summary.substring(
                        0,
                        120
                    )}...</p>
                    <div class="card-footer">
                        <span class="author">By ${article.author}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getFiltersHTML(section, currentFilters) {
        const filterOptions = {
            opportunities: [
                {
                    key: "type",
                    label: "Type",
                    options: ["Job", "Tender", "Procurement", "Partnership"]
                }
            ],
            directory: [
                {
                    key: "sector",
                    label: "Sector",
                    options: ["Upstream", "Midstream", "Downstream", "Services"]
                }
            ],
            regulatory: [
                {
                    key: "source",
                    label: "Source",
                    options: ["NUPRC", "NCDMB", "NNPC", "DPR"]
                }
            ],
            insights: [
                {
                    key: "category",
                    label: "Category",
                    options: [
                        "Production",
                        "Market Analysis",
                        "Policy",
                        "Technology"
                    ]
                }
            ]
        };

        const filters = filterOptions[section] || [];

        return `
            <div class="filters-section">
                <div class="filters-bar">
                    ${filters
                        .map(
                            filter => `
                        <select class="filter-select" data-filter="${
                            filter.key
                        }">
                            <option value="">All ${filter.label}s</option>
                            ${filter.options
                                .map(
                                    option => `
                                <option value="${option}" ${
                                    currentFilters[filter.key] === option
                                        ? "selected"
                                        : ""
                                }>${option}</option>
                            `
                                )
                                .join("")}
                        </select>
                    `
                        )
                        .join("")}
                    <button class="btn btn-outline" onclick="router.clearFilters('${section}')">Clear Filters</button>
                </div>
            </div>
        `;
    }

    getPaginationHTML(currentPage, itemCount, itemsPerPage = 12) {
        const totalPages = Math.ceil(itemCount / itemsPerPage);
        if (totalPages <= 1) return "";

        let paginationHTML = '<div class="pagination">';

        if (currentPage > 1) {
            paginationHTML += `<a href="#" class="pagination-item" onclick="router.goToPage(${
                currentPage - 1
            })">‹</a>`;
        }

        for (
            let i = Math.max(1, currentPage - 2);
            i <= Math.min(totalPages, currentPage + 2);
            i++
        ) {
            paginationHTML += `<a href="#" class="pagination-item ${
                i === currentPage ? "active" : ""
            }" onclick="router.goToPage(${i})">${i}</a>`;
        }

        if (currentPage < totalPages) {
            paginationHTML += `<a href="#" class="pagination-item" onclick="router.goToPage(${
                currentPage + 1
            })">›</a>`;
        }

        paginationHTML += "</div>";
        return paginationHTML;
    }

    getSearchPageHTML() {
        return `
            <div class="page-header">
                <div class="container">
                    <h1 class="page-title">Search</h1>
                    <p class="page-subtitle">Find opportunities, companies, updates, and insights</p>
                </div>
            </div>
            
            <div class="page-content">
                <div class="container">
                    ${this.getSearchFormHTML()}
                    
                    <div class="search-suggestions">
                        <h3>Popular Searches</h3>
                        <div class="suggestion-tags">
                            <span class="suggestion-tag" onclick="router.navigate('search?q=engineer')">Engineer</span>
                            <span class="suggestion-tag" onclick="router.navigate('search?q=procurement')">Procurement</span>
                            <span class="suggestion-tag" onclick="router.navigate('search?q=offshore')">Offshore</span>
                            <span class="suggestion-tag" onclick="router.navigate('search?q=NUPRC')">NUPRC</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getSearchFormHTML(query = "", type = "") {
        return `
            <div class="search-form">
                <div class="search-input-group">
                    <input type="text" class="search-input" placeholder="Search opportunities, companies, updates..." value="${query}" id="searchInput">
                    <select class="search-type-select" id="searchType">
                        <option value="">All Types</option>
                        <option value="opportunity" ${
                            type === "opportunity" ? "selected" : ""
                        }>Opportunities</option>
                        <option value="companyProfile" ${
                            type === "companyProfile" ? "selected" : ""
                        }>Companies</option>
                        <option value="regulatoryUpdate" ${
                            type === "regulatoryUpdate" ? "selected" : ""
                        }>Regulatory</option>
                        <option value="article" ${
                            type === "article" ? "selected" : ""
                        }>Insights</option>
                    </select>
                    <button class="btn btn-primary" onclick="router.performSearch()">Search</button>
                </div>
            </div>
        `;
    }

    getSearchResultHTML(result) {
        const typeLabels = {
            opportunity: "Opportunity",
            companyProfile: "Company",
            regulatoryUpdate: "Regulatory Update",
            article: "Article"
        };

        const routePaths = {
            opportunity: "opportunities",
            companyProfile: "directory",
            regulatoryUpdate: "regulatory",
            article: "insights"
        };

        return `
            <div class="search-result-item" onclick="router.navigate('${
                routePaths[result._type]
            }/${result._id}')">
                <div class="search-result-header">
                    <span class="badge">${typeLabels[result._type]}</span>
                    ${
                        result.date
                            ? `<span class="search-result-date">${window.appwriteAPI.formatDate(
                                  result.date
                              )}</span>`
                            : ""
                    }
                </div>
                <h3 class="search-result-title">${result.title}</h3>
                <p class="search-result-subtitle">${result.subtitle || ""}</p>
            </div>
        `;
    }

    // ERROR AND 404 HANDLING

    render404() {
        const template = `
            <div class="error-page">
                <div class="container">
                    <div class="error-content">
                        <h1 class="error-title">404</h1>
                        <h2>Page Not Found</h2>
                        <p>The page you're looking for doesn't exist or has been moved.</p>
                        <div class="error-actions">
                            <a href="#" class="btn btn-primary">Go Home</a>
                            <a href="#search" class="btn btn-outline">Search</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setContent(template);
    }

    renderError(error) {
        const template = `
            <div class="error-page">
                <div class="container">
                    <div class="error-content">
                        <h1 class="error-title">Error</h1>
                        <h2>Something went wrong</h2>
                        <p>We're having trouble loading this content. Please try again.</p>
                        <div class="error-actions">
                            <button class="btn btn-primary" onclick="window.location.reload()">Retry</button>
                            <a href="#" class="btn btn-outline">Go Home</a>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setContent(template);
        console.error("Route rendering error:", error);
    }

    // UTILITY METHODS

    setContent(html) {
        if (this.contentContainer) {
            this.contentContainer.innerHTML = html;
            window.scrollTo(0, 0);

            // Re-initialize any components that need setup after content change
            this.setupContentEventListeners();

            // Trigger content loaded event
            document.dispatchEvent(new CustomEvent("contentLoaded"));
        }
    }

    setupContentEventListeners() {
        // Setup filter change listeners
        const filterSelects = document.querySelectorAll(".filter-select");
        filterSelects.forEach(select => {
            select.addEventListener("change", e => {
                this.handleFilterChange(e.target);
            });
        });

        // Setup search form listeners
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
            searchInput.addEventListener("keypress", e => {
                if (e.key === "Enter") {
                    this.performSearch();
                }
            });
        }

        // Setup pagination listeners
        const paginationItems = document.querySelectorAll(".pagination-item");
        paginationItems.forEach(item => {
            item.addEventListener("click", e => {
                e.preventDefault();
                const page = parseInt(item.textContent);
                if (!isNaN(page)) {
                    this.goToPage(page);
                }
            });
        });
    }

    handleFilterChange(selectElement) {
        const filterKey = selectElement.getAttribute("data-filter");
        const filterValue = selectElement.value;
        const currentRoute = this.getCurrentRoute();
        const [basePath] = currentRoute.split("?");

        // Build new URL with filter
        let newRoute = basePath;
        if (filterValue) {
            newRoute += `?${filterKey}=${encodeURIComponent(filterValue)}`;
        }

        this.navigate(newRoute);
    }

    performSearch() {
        const query = document.getElementById("searchInput")?.value || "";
        const type = document.getElementById("searchType")?.value || "";

        if (query.trim()) {
            this.navigate(
                `search?q=${encodeURIComponent(query)}${
                    type ? `&type=${type}` : ""
                }`
            );
        }
    }

    goToPage(page) {
        const currentRoute = this.getCurrentRoute();
        const [path, queryString] = currentRoute.split("?");

        // Parse existing query parameters
        const urlParams = new URLSearchParams(queryString || "");
        urlParams.set("page", page.toString());

        const newRoute = `${path}?${urlParams.toString()}`;
        this.navigate(newRoute);
    }

    clearFilters(section) {
        this.navigate(section);
    }

    // Parse URL query parameters
    parseQueryParams(route) {
        const [, queryString] = route.split("?");
        const params = {};

        if (queryString) {
            const urlParams = new URLSearchParams(queryString);
            for (const [key, value] of urlParams.entries()) {
                params[key] = value;
            }
        }

        return params;
    }

    // Update browser title based on current route
    updatePageTitle(route) {
        const titles = {
            "": "The Pipeline - Nigerian Oil & Gas Hub",
            home: "The Pipeline - Nigerian Oil & Gas Hub",
            opportunities: "Opportunities Hub - The Pipeline",
            directory: "Company Directory - The Pipeline",
            regulatory: "Regulatory Updates - The Pipeline",
            insights: "Market Intelligence - The Pipeline",
            search: "Search - The Pipeline"
        };

        const basePath = route.split("/")[0].split("?")[0];
        const title = titles[basePath] || "The Pipeline";
        document.title = title;
    }

    // Analytics tracking
    trackPageView(route) {
        // Update page title
        this.updatePageTitle(route);

        // Google Analytics
        if (typeof gtag !== "undefined") {
            gtag("config", "GA_TRACKING_ID", {
                page_path: `/#${route}`,
                page_title: document.title
            });
        }

        // Custom analytics
        console.log(`Page view: ${route}`);

        // Track page load time
        if ("performance" in window) {
            const loadTime = performance.now();
            console.log(`Route load time: ${Math.round(loadTime)}ms`);
        }
    }

    // Error handling with user feedback
    handleRouteError(error, route) {
        console.error(`Route error for ${route}:`, error);

        // Show user-friendly error message
        if (window.pipelineApp && window.pipelineApp.showToast) {
            window.pipelineApp.showToast(
                "Failed to load page content. Please try again.",
                "error",
                5000
            );
        }

        // Track error
        if (typeof gtag !== "undefined") {
            gtag("event", "route_error", {
                event_category: "navigation",
                event_label: route,
                value: 1
            });
        }
    }

    // Preload route data for better performance
    async preloadRoute(route) {
        try {
            const { path, params } = this.parseRoute(route);

            // Preload common data based on route
            switch (path.split("/")[0]) {
                case "opportunities":
                    await window.appwriteAPI.getOpportunities({ limit: 5 });
                    break;
                case "directory":
                    await window.appwriteAPI.getCompanies({ limit: 5 });
                    break;
                case "regulatory":
                    await window.appwriteAPI.getRegulatoryUpdates({ limit: 5 });
                    break;
                case "insights":
                    await window.appwriteAPI.getArticles({ limit: 5 });
                    break;
            }
        } catch (error) {
            console.log("Preload failed (non-critical):", error);
        }
    }

    // Cleanup method
    destroy() {
        // Remove event listeners
        window.removeEventListener("hashchange", this.handleRoute);
        document.removeEventListener("click", this.handleLinkClick);

        // Clear any timers or intervals
        if (this.preloadTimer) {
            clearTimeout(this.preloadTimer);
        }

        console.log("Router destroyed");
    }

    // Development helpers
    getRouteInfo() {
        return {
            currentRoute: this.currentRoute,
            availableRoutes: Array.from(this.routes.keys()),
            routeHistory: this.routeHistory || []
        };
    }

    // Route debugging
    debugRoute(route) {
        const { path, params } = this.parseRoute(route);
        console.log("Route Debug:", {
            input: route,
            parsed: { path, params },
            handler: this.routes.has(path) ? "Found" : "Not Found",
            allRoutes: Array.from(this.routes.keys())
        });
    }
}

// Initialize router when DOM is ready
let router;

document.addEventListener("DOMContentLoaded", () => {
    router = new PipelineRouter();
    window.router = router;

    console.log("🧭 Router initialized");
});

// Export for module systems
if (typeof module !== "undefined" && module.exports) {
    module.exports = PipelineRouter;
}

// Global error handler for router
window.addEventListener("error", e => {
    if (e.filename && e.filename.includes("router")) {
        console.error("Router error:", e.error);
        if (router && typeof router.handleRouteError === "function") {
            router.handleRouteError(e.error, router.getCurrentRoute());
        }
    }
});

// Handle browser back/forward buttons
window.addEventListener("popstate", () => {
    if (router) {
        router.handleRoute();
    }
});

// Keyboard shortcuts for navigation
document.addEventListener("keydown", e => {
    // Ctrl/Cmd + K for search
    if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (router) {
            router.navigate("search");
            setTimeout(() => {
                const searchInput = document.getElementById("searchInput");
                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
        }
    }

    // Alt + H for home
    if (e.altKey && e.key === "h") {
        e.preventDefault();
        if (router) {
            router.navigate("");
        }
    }
});

// Performance monitoring for routes
if ("PerformanceObserver" in window) {
    const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
            if (entry.name === "route-change") {
                console.log(`Route change took: ${entry.duration}ms`);
            }
        }
    });

    try {
        observer.observe({ entryTypes: ["measure"] });
    } catch (e) {
        // PerformanceObserver not supported
    }
}

console.log("🚀 Router system loaded and ready");
