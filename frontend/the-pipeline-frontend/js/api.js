/**
 * THE PIPELINE - APPWRITE API SERVICE
 * Complete integration with Appwrite for dynamic content
 */

class AppwriteAPIService {
    constructor() {
        // Appwrite configuration
        this.endpoint = 'https://cloud.appwrite.io/v1';
        this.projectId = '68bf9ed10019de00e1d5'; 
        this.databaseId = '68bfa1020007a42a4845';
        
        // Initialize Appwrite client
        this.client = new Appwrite.Client();
        this.databases = new Appwrite.Databases(this.client);
        this.storage = new Appwrite.Storage(this.client);
        this.account = new Appwrite.Account(this.client);

        this.client
            .setEndpoint(this.endpoint)
            .setProject(this.projectId);

        // Collection IDs (will be created in Appwrite console)
        this.collections = {
            opportunities: 'opportunities',
            companies: 'companies', 
            regulatory: 'regulatory',
            articles: 'articles'
        };

        // Cache for better performance
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generic cache helper
    getCacheKey(collection, query = {}) {
        return `${collection}_${JSON.stringify(query)}`;
    }

    isValidCache(cacheEntry) {
        return cacheEntry && (Date.now() - cacheEntry.timestamp < this.cacheTimeout);
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // OPPORTUNITIES API
    async getOpportunities(filters = {}) {
        const { type, sector, limit = 20, offset = 0 } = filters;
        const cacheKey = this.getCacheKey('opportunities', filters);
        const cached = this.cache.get(cacheKey);

        if (this.isValidCache(cached)) {
            return cached.data;
        }

        try {
            let queries = [
                Appwrite.Query.orderDesc('$createdAt'),
                Appwrite.Query.limit(limit),
                Appwrite.Query.offset(offset)
            ];

            if (type) {
                queries.push(Appwrite.Query.equal('opportunityType', type));
            }

            const response = await this.databases.listDocuments(
                this.databaseId,
                this.collections.opportunities,
                queries
            );

            this.setCache(cacheKey, response.documents);
            return response.documents;
        } catch (error) {
            console.error('Error fetching opportunities:', error);
            return this.getMockOpportunities();
        }
    }

    async getOpportunityById(id) {
        const cacheKey = this.getCacheKey('opportunity', { id });
        const cached = this.cache.get(cacheKey);

        if (this.isValidCache(cached)) {
            return cached.data;
        }

        try {
            const opportunity = await this.databases.getDocument(
                this.databaseId,
                this.collections.opportunities,
                id
            );

            // Get related company if exists
            if (opportunity.companyId) {
                opportunity.company = await this.databases.getDocument(
                    this.databaseId,
                    this.collections.companies,
                    opportunity.companyId
                );
            }

            this.setCache(cacheKey, opportunity);
            return opportunity;
        } catch (error) {
            console.error('Error fetching opportunity:', error);
            return null;
        }
    }

    async createOpportunity(data) {
        try {
            const docId = Appwrite.ID.unique();
            const opportunity = await this.databases.createDocument(
                this.databaseId,
                this.collections.opportunities,
                docId,
                {
                    ...data,
                    publishedAt: new Date().toISOString(),
                    featured: data.featured || false
                }
            );

            // Clear cache
            this.clearCacheByCollection('opportunities');
            return opportunity;
        } catch (error) {
            console.error('Error creating opportunity:', error);
            throw error;
        }
    }

    // COMPANIES API
    async getCompanies(filters = {}) {
        const { sector, limit = 20, offset = 0 } = filters;
        const cacheKey = this.getCacheKey('companies', filters);
        const cached = this.cache.get(cacheKey);

        if (this.isValidCache(cached)) {
            return cached.data;
        }

        try {
            let queries = [
                Appwrite.Query.orderAsc('companyName'),
                Appwrite.Query.limit(limit),
                Appwrite.Query.offset(offset)
            ];

            if (sector) {
                queries.push(Appwrite.Query.equal('sector', sector));
            }

            const response = await this.databases.listDocuments(
                this.databaseId,
                this.collections.companies,
                queries
            );

            this.setCache(cacheKey, response.documents);
            return response.documents;
        } catch (error) {
            console.error('Error fetching companies:', error);
            return this.getMockCompanies();
        }
    }

    async getCompanyById(id) {
        const cacheKey = this.getCacheKey('company', { id });
        const cached = this.cache.get(cacheKey);

        if (this.isValidCache(cached)) {
            return cached.data;
        }

        try {
            const company = await this.databases.getDocument(
                this.databaseId,
                this.collections.companies,
                id
            );

            this.setCache(cacheKey, company);
            return company;
        } catch (error) {
            console.error('Error fetching company:', error);
            return null;
        }
    }

    async createCompany(data) {
        try {
            const docId = Appwrite.ID.unique();
            const company = await this.databases.createDocument(
                this.databaseId,
                this.collections.companies,
                docId,
                {
                    ...data,
                    featured: data.featured || false
                }
            );

            this.clearCacheByCollection('companies');
            return company;
        } catch (error) {
            console.error('Error creating company:', error);
            throw error;
        }
    }

    // REGULATORY UPDATES API
    async getRegulatoryUpdates(filters = {}) {
        const { source, limit = 20, offset = 0 } = filters;
        const cacheKey = this.getCacheKey('regulatory', filters);
        const cached = this.cache.get(cacheKey);

        if (this.isValidCache(cached)) {
            return cached.data;
        }

        try {
            let queries = [
                Appwrite.Query.orderDesc('publishedDate'),
                Appwrite.Query.limit(limit),
                Appwrite.Query.offset(offset)
            ];

            if (source) {
                queries.push(Appwrite.Query.equal('source', source));
            }

            const response = await this.databases.listDocuments(
                this.databaseId,
                this.collections.regulatory,
                queries
            );

            this.setCache(cacheKey, response.documents);
            return response.documents;
        } catch (error) {
            console.error('Error fetching regulatory updates:', error);
            return this.getMockRegulatory();
        }
    }

    async getRegulatoryUpdateById(id) {
        try {
            const update = await this.databases.getDocument(
                this.databaseId,
                this.collections.regulatory,
                id
            );
            return update;
        } catch (error) {
            console.error('Error fetching regulatory update:', error);
            return null;
        }
    }

    async createRegulatoryUpdate(data) {
        try {
            const docId = Appwrite.ID.unique();
            const update = await this.databases.createDocument(
                this.databaseId,
                this.collections.regulatory,
                docId,
                data
            );

            this.clearCacheByCollection('regulatory');
            return update;
        } catch (error) {
            console.error('Error creating regulatory update:', error);
            throw error;
        }
    }

    // ARTICLES API
    async getArticles(filters = {}) {
        const { category, limit = 20, offset = 0 } = filters;
        const cacheKey = this.getCacheKey('articles', filters);
        const cached = this.cache.get(cacheKey);

        if (this.isValidCache(cached)) {
            return cached.data;
        }

        try {
            let queries = [
                Appwrite.Query.orderDesc('publishedDate'),
                Appwrite.Query.limit(limit),
                Appwrite.Query.offset(offset)
            ];

            if (category) {
                queries.push(Appwrite.Query.search('tags', category));
            }

            const response = await this.databases.listDocuments(
                this.databaseId,
                this.collections.articles,
                queries
            );

            this.setCache(cacheKey, response.documents);
            return response.documents;
        } catch (error) {
            console.error('Error fetching articles:', error);
            return this.getMockArticles();
        }
    }

    async getArticleById(id) {
        try {
            const article = await this.databases.getDocument(
                this.databaseId,
                this.collections.articles,
                id
            );
            return article;
        } catch (error) {
            console.error('Error fetching article:', error);
            return null;
        }
    }

    async createArticle(data) {
        try {
            const docId = Appwrite.ID.unique();
            const article = await this.databases.createDocument(
                this.databaseId,
                this.collections.articles,
                docId,
                {
                    ...data,
                    tags: Array.isArray(data.tags) ? data.tags : data.tags.split(',').map(t => t.trim())
                }
            );

            this.clearCacheByCollection('articles');
            return article;
        } catch (error) {
            console.error('Error creating article:', error);
            throw error;
        }
    }

    // SEARCH FUNCTIONALITY
    async search(searchTerm, types = []) {
        if (!searchTerm.trim()) return [];

        try {
            const results = [];
            const collectionsToSearch = types.length > 0 ? 
                types.filter(t => this.collections[t]) : 
                Object.keys(this.collections);

            for (const collectionKey of collectionsToSearch) {
                try {
                    const response = await this.databases.listDocuments(
                        this.databaseId,
                        this.collections[collectionKey],
                        [
                            Appwrite.Query.search('title', searchTerm),
                            Appwrite.Query.limit(5)
                        ]
                    );

                    const searchResults = response.documents.map(doc => ({
                        ...doc,
                        _type: collectionKey.slice(0, -1), // Remove 's' from collection name
                        subtitle: doc.companyName || doc.source || doc.author || doc.description?.substring(0, 100)
                    }));

                    results.push(...searchResults);
                } catch (error) {
                    console.warn(`Search failed for ${collectionKey}:`, error);
                }
            }

            return results.slice(0, 10); // Limit total results
        } catch (error) {
            console.error('Search error:', error);
            return [];
        }
    }

    // DASHBOARD STATS
    async getDashboardStats() {
        try {
            const [opportunities, companies, regulatory, articles] = await Promise.all([
                this.databases.listDocuments(this.databaseId, this.collections.opportunities, [Appwrite.Query.limit(1)]),
                this.databases.listDocuments(this.databaseId, this.collections.companies, [Appwrite.Query.limit(1)]),
                this.databases.listDocuments(this.databaseId, this.collections.regulatory, [Appwrite.Query.limit(1)]),
                this.databases.listDocuments(this.databaseId, this.collections.articles, [Appwrite.Query.limit(1)])
            ]);

            return {
                totalOpportunities: opportunities.total,
                totalCompanies: companies.total,
                totalUpdates: regulatory.total,
                totalArticles: articles.total
            };
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            return {
                totalOpportunities: 156,
                totalCompanies: 89,
                totalUpdates: 24,
                totalArticles: 12
            };
        }
    }

    // FEATURED CONTENT
    async getFeaturedContent() {
        try {
            const [featuredOpportunities, featuredCompanies, latestUpdates, recentArticles] = await Promise.all([
                this.databases.listDocuments(this.databaseId, this.collections.opportunities, [
                    Appwrite.Query.equal('featured', true),
                    Appwrite.Query.limit(3)
                ]),
                this.databases.listDocuments(this.databaseId, this.collections.companies, [
                    Appwrite.Query.equal('featured', true),
                    Appwrite.Query.limit(6)
                ]),
                this.databases.listDocuments(this.databaseId, this.collections.regulatory, [
                    Appwrite.Query.orderDesc('publishedDate'),
                    Appwrite.Query.limit(3)
                ]),
                this.databases.listDocuments(this.databaseId, this.collections.articles, [
                    Appwrite.Query.orderDesc('publishedDate'),
                    Appwrite.Query.limit(3)
                ])
            ]);

            return {
                featuredOpportunities: featuredOpportunities.documents,
                featuredCompanies: featuredCompanies.documents,
                latestUpdates: latestUpdates.documents,
                recentArticles: recentArticles.documents
            };
        } catch (error) {
            console.error('Error fetching featured content:', error);
            return this.getMockFeaturedContent();
        }
    }

    // FILE UPLOAD (for images, documents)
    async uploadFile(file) {
        try {
            const fileId = Appwrite.ID.unique();
            const response = await this.storage.createFile(
                'media', // bucket ID
                fileId,
                file
            );
            return response;
        } catch (error) {
            console.error('File upload error:', error);
            throw error;
        }
    }

    getFileUrl(fileId) {
        return `${this.endpoint}/storage/buckets/media/files/${fileId}/view?project=${this.projectId}`;
    }

    // UTILITY METHODS
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        return `${Math.floor(diffDays / 365)} years ago`;
    }

    clearCache() {
        this.cache.clear();
        console.log('API cache cleared');
    }

    clearCacheByCollection(collection) {
        const keysToDelete = [];
        for (const [key] of this.cache.entries()) {
            if (key.includes(collection)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    // MOCK DATA FALLBACKS
    getMockOpportunities() {
        return [
            {
                $id: 'mock-opp-1',
                title: 'Senior Reservoir Engineer - Lagos',
                description: 'Lead reservoir modeling and simulation projects for offshore oil fields. Minimum 8 years experience required.',
                opportunityType: 'Job',
                closingDate: '2024-09-15',
                location: 'Lagos, Nigeria',
                company: { companyName: 'Shell Nigeria', sector: 'Upstream' },
                $createdAt: '2024-08-22T10:00:00.000Z'
            },
            {
                $id: 'mock-opp-2',
                title: 'Equipment Supply Contract - $50M',
                description: 'Supply and maintenance of drilling equipment for deep water operations.',
                opportunityType: 'Tender',
                closingDate: '2024-09-30',
                location: 'Port Harcourt, Nigeria',
                company: { companyName: 'TotalEnergies', sector: 'Upstream' },
                $createdAt: '2024-08-21T10:00:00.000Z'
            }
        ];
    }

    getMockCompanies() {
        return [
            {
                $id: 'mock-comp-1',
                companyName: 'Shell Petroleum Development Company',
                sector: 'Upstream',
                description: 'Leading international oil and gas company operating in Nigeria since 1936.',
                ncdmbNumber: 'NCDMB-001-2024',
                website: 'https://shell.com.ng'
            },
            {
                $id: 'mock-comp-2',
                companyName: 'TotalEnergies Nigeria',
                sector: 'Upstream',
                description: 'French multinational integrated energy company.',
                ncdmbNumber: 'NCDMB-002-2024',
                website: 'https://totalenergies.com.ng'
            }
        ];
    }

    getMockRegulatory() {
        return [
            {
                $id: 'mock-reg-1',
                title: 'New Environmental Impact Assessment Guidelines',
                source: 'NUPRC',
                summary: 'Updated EIA requirements for oil and gas operations.',
                publishedDate: '2024-08-22'
            }
        ];
    }

    getMockArticles() {
        return [
            {
                $id: 'mock-art-1',
                title: 'Nigeria\'s Oil Production Reaches New Heights',
                summary: 'NNPC reports significant increase in daily production capacity.',
                author: 'Energy Analytics Team',
                publishedDate: '2024-08-22',
                tags: ['Production', 'NNPC', 'Oil']
            }
        ];
    }

    getMockFeaturedContent() {
        return {
            featuredOpportunities: this.getMockOpportunities().slice(0, 2),
            featuredCompanies: this.getMockCompanies(),
            latestUpdates: this.getMockRegulatory(),
            recentArticles: this.getMockArticles()
        };
    }
}

// Initialize and export
const appwriteAPI = new AppwriteAPIService();
window.appwriteAPI = appwriteAPI;