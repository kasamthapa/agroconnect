class SearchService {
    constructor() {
        this.db = firebase.firestore();
        this.searchIndex = {};
        this.buildSearchIndex();
    }

    async buildSearchIndex() {
        try {
            const snapshot = await this.db.collection('products').get();
            snapshot.docs.forEach(doc => {
                const product = doc.data();
                this.searchIndex[doc.id] = {
                    id: doc.id,
                    searchableText: this.createSearchableText(product),
                    ...product
                };
            });
        } catch (error) {
            console.error('Error building search index:', error);
        }
    }

    createSearchableText(product) {
        return [
            product.name,
            product.description,
            product.category,
            product.farmerName,
            product.location,
            ...(product.tags || [])
        ].join(' ').toLowerCase();
    }

    search(query, filters = {}) {
        const searchResults = Object.values(this.searchIndex).filter(product => {
            // Text search
            if (query && !product.searchableText.includes(query.toLowerCase())) {
                return false;
            }

            // Category filter
            if (filters.category && filters.category !== 'all' && 
                product.category !== filters.category) {
                return false;
            }

            // Price range filter
            if (filters.minPrice && product.price < filters.minPrice) {
                return false;
            }
            if (filters.maxPrice && product.price > filters.maxPrice) {
                return false;
            }

            // Rating filter
            if (filters.rating && product.rating < filters.rating) {
                return false;
            }

            // Stock status filter
            if (filters.inStockOnly && product.stock <= 0) {
                return false;
            }

            // Location filter
            if (filters.location && product.location !== filters.location) {
                return false;
            }

            return true;
        });

        // Apply sorting
        if (filters.sortBy) {
            searchResults.sort((a, b) => {
                switch (filters.sortBy) {
                    case 'price_asc':
                        return a.price - b.price;
                    case 'price_desc':
                        return b.price - a.price;
                    case 'rating':
                        return b.rating - a.rating;
                    case 'newest':
                        return b.createdAt - a.createdAt;
                    default:
                        return 0;
                }
            });
        }

        return searchResults;
    }

    // Real-time search index updates
    startListening() {
        this.db.collection('products').onSnapshot(snapshot => {
            snapshot.docChanges().forEach(change => {
                if (change.type === 'added' || change.type === 'modified') {
                    this.searchIndex[change.doc.id] = {
                        id: change.doc.id,
                        searchableText: this.createSearchableText(change.doc.data()),
                        ...change.doc.data()
                    };
                }
                if (change.type === 'removed') {
                    delete this.searchIndex[change.doc.id];
                }
            });
        });
    }
} 