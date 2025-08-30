/**
 * THE PIPELINE - SANITY.IO API SERVICE
 * Complete integration with Sanity CMS for dynamic content
 */

class SanityAPIService {
    constructor() {
        this.projectId = "xus3urqo";
        this.dataset = "production";
        this.apiVersion = "2024-08-22";
        this.baseUrl = `https://${this.projectId}.api.sanity.io/v${this.apiVersion}/data/query/${this.dataset}`;
        this.cdnUrl = `https://cdn.sanity.io/images/${this.projectId}/${this.dataset}`;

        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Helper to build image URLs
    urlFor(imageRef) {
        if (!imageRef || !imageRef.asset) return null;
        const ref = imageRef.asset._ref || imageRef.asset._id;
        const [, id, dimensions, format] = ref.split("-");
        return `${this.cdnUrl}/${id}-${dimensions}.${format}`;
    }

    // Generic fetch with caching
    async fetchWithCache(query, params = {}) {
        const cacheKey = `${query}_${JSON.stringify(params)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const url = `${this.baseUrl}?query=${encodeURIComponent(query)}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(
                    `Sanity API Error: ${response.status} ${response.statusText}`
                );
            }

            const result = await response.json();
            const data = result.result;

            // Cache successful results
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error("Sanity API fetch error:", error);

            // Return cached data if available, even if expired
            if (cached) {
                console.warn("Using expired cache data due to API error");
                return cached.data;
            }

            // Return mock data as fallback
            return this.getFallbackData(query);
        }
    }

    // OPPORTUNITIES API
    async getOpportunities(filters = {}) {
        const { type, sector, limit = 20, offset = 0 } = filters;

        let query = `*[_type == "opportunity"`;

        if (type) {
            query += ` && opportunityType == "${type}"`;
        }

        query += `] | order(publishedAt desc) [${offset}...${offset + limit}] {
            _id,
            title,
            description,
            opportunityType,
            closingDate,
            link,
            publishedAt,
            company->{
                _id,
                companyName,
                logo,
                sector
            }
        }`;

        return await this.fetchWithCache(query);
    }

    async getOpportunityById(id) {
        const query = `*[_type == "opportunity" && _id == "${id}"][0] {
            _id,
            title,
            description,
            opportunityType,
            closingDate,
            link,
            publishedAt,
            requirements,
            benefits,
            location,
            company->{
                _id,
                companyName,
                logo,
                sector,
                website,
                contactEmail
            }
        }`;

        return await this.fetchWithCache(query);
    }

    // COMPANIES API
    async getCompanies(filters = {}) {
        const { sector, limit = 20, offset = 0 } = filters;

        let query = `*[_type == "companyProfile"`;

        if (sector) {
            query += ` && sector == "${sector}"`;
        }

        query += `] | order(companyName asc) [${offset}...${offset + limit}] {
            _id,
            companyName,
            logo,
            description,
            sector,
            servicesOffered,
            ncdmbNumber,
            website
        }`;

        return await this.fetchWithCache(query);
    }

    async getCompanyById(id) {
        const query = `*[_type == "companyProfile" && _id == "${id}"][0] {
            _id,
            companyName,
            logo,
            description,
            sector,
            servicesOffered,
            ncdmbNumber,
            website,
            contactEmail,
            projects[]->{
                title,
                description,
                status
            }
        }`;

        return await this.fetchWithCache(query);
    }

    // REGULATORY UPDATES API
    async getRegulatoryUpdates(filters = {}) {
        const { source, limit = 20, offset = 0 } = filters;

        let query = `*[_type == "regulatoryUpdate"`;

        if (source) {
            query += ` && source == "${source}"`;
        }

        query += `] | order(publishedDate desc) [${offset}...${
            offset + limit
        }] {
            _id,
            title,
            source,
            summary,
            publishedDate,
            document
        }`;

        return await this.fetchWithCache(query);
    }

    async getRegulatoryUpdateById(id) {
        const query = `*[_type == "regulatoryUpdate" && _id == "${id}"][0] {
            _id,
            title,
            source,
            summary,
            publishedDate,
            document,
            fullText,
            impact,
            effectiveDate,
            relatedUpdates[]->{
                title,
                source,
                publishedDate
            }
        }`;

        return await this.fetchWithCache(query);
    }

    // ARTICLES API
    async getArticles(filters = {}) {
        const { category, limit = 20, offset = 0 } = filters;

        let query = `*[_type == "article"`;

        if (category) {
            query += ` && "${category}" in tags`;
        }

        query += `] | order(publishedDate desc) [${offset}...${
            offset + limit
        }] {
            _id,
            title,
            slug,
            summary,
            author,
            publishedDate,
            coverImage,
            tags
        }`;

        return await this.fetchWithCache(query);
    }

    async getArticleById(id) {
        const query = `*[_type == "article" && _id == "${id}"][0] {
            _id,
            title,
            slug,
            summary,
            body,
            author,
            publishedDate,
            coverImage,
            tags,
            relatedArticles[]->{
                title,
                slug,
                summary,
                publishedDate
            }
        }`;

        return await this.fetchWithCache(query);
    }

    // DASHBOARD STATS
    async getDashboardStats() {
        const query = `{
            "totalCompanies": count(*[_type == "companyProfile"]),
            "totalOpportunities": count(*[_type == "opportunity"]),
            "totalUpdates": count(*[_type == "regulatoryUpdate"]),
            "recentOpportunities": count(*[_type == "opportunity" && publishedAt > now() - 86400*7]),
            "sectors": *[_type == "companyProfile"]{sector} | [].sector | array::unique(),
            "topSources": *[_type == "regulatoryUpdate"]{source} | [].source | array::unique()
        }`;

        return await this.fetchWithCache(query);
    }

    // SEARCH
    async search(searchTerm, types = [], limit = 10) {
        if (!searchTerm.trim()) return [];

        const typeFilters =
            types.length > 0
                ? ` && _type in [${types.map(t => `"${t}"`).join(", ")}]`
                : "";

        const query = `*[${typeFilters} && (
            title match "*${searchTerm}*" ||
            description match "*${searchTerm}*" ||
            summary match "*${searchTerm}*" ||
            companyName match "*${searchTerm}*"
        )] | order(_score desc) [0...${limit}] {
            _id,
            _type,
            title,
            "subtitle": coalesce(summary, description, companyName),
            "image": coalesce(coverImage, logo),
            "date": coalesce(publishedDate, publishedAt, _createdAt)
        }`;

        return await this.fetchWithCache(query);
    }

    // FEATURED CONTENT
    async getFeaturedContent() {
        const query = `{
            "featuredOpportunities": *[_type == "opportunity" && featured == true] | order(publishedAt desc) [0...3] {
                _id, title, company->{companyName}, opportunityType
            },
            "latestUpdates": *[_type == "regulatoryUpdate"] | order(publishedDate desc) [0...3] {
                _id, title, source, publishedDate
            },
            "topCompanies": *[_type == "companyProfile" && featured == true] | order(companyName asc) [0...6] {
                _id, companyName, logo, sector
            },
            "recentArticles": *[_type == "article"] | order(publishedDate desc) [0...3] {
                _id, title, summary, author, publishedDate
            }
        }`;

        return await this.fetchWithCache(query);
    }

    // FALLBACK DATA (when Sanity is unavailable)
    getFallbackData(query) {
        console.warn("Using fallback mock data");

        if (query.includes("opportunity")) {
            return [
                {
                    _id: "mock-1",
                    title: "Senior Reservoir Engineer - Lagos",
                    description:
                        "Lead reservoir modeling and simulation projects for offshore oil fields. Minimum 8 years experience required.",
                    opportunityType: "Job",
                    closingDate: "2024-09-15",
                    company: {
                        companyName: "Shell Nigeria",
                        sector: "Upstream"
                    }
                },
                {
                    _id: "mock-2",
                    title: "Equipment Supply Contract - $50M",
                    description:
                        "Supply and maintenance of drilling equipment for deep water operations.",
                    opportunityType: "Tender",
                    closingDate: "2024-09-30",
                    company: {
                        companyName: "TotalEnergies",
                        sector: "Upstream"
                    }
                }
            ];
        }

        if (query.includes("companyProfile")) {
            return [
                {
                    _id: "company-1",
                    companyName: "Shell Petroleum Development Company",
                    sector: "Upstream",
                    description:
                        "Leading international oil and gas company operating in Nigeria since 1936.",
                    ncdmbNumber: "NCDMB-001-2024"
                },
                {
                    _id: "company-2",
                    companyName: "TotalEnergies Nigeria",
                    sector: "Upstream",
                    description:
                        "French multinational integrated energy company.",
                    ncdmbNumber: "NCDMB-002-2024"
                }
            ];
        }

        if (query.includes("regulatoryUpdate")) {
            return [
                {
                    _id: "reg-1",
                    title: "New Environmental Impact Assessment Guidelines",
                    source: "NUPRC",
                    summary:
                        "Updated EIA requirements for oil and gas operations.",
                    publishedDate: "2024-08-22"
                },
                {
                    _id: "reg-2",
                    title: "Local Content Implementation Roadmap",
                    source: "NCDMB",
                    summary:
                        "Strategic framework for achieving 70% local content.",
                    publishedDate: "2024-08-20"
                }
            ];
        }

        return [];
    }

    // UTILITY METHODS
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-NG", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    clearCache() {
        this.cache.clear();
        console.log("API cache cleared");
    }
}

// Initialize and export
const sanityAPI = new SanityAPIService();
window.sanityAPI = sanityAPI;
