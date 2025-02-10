import BaseView from './baseView.js';

export default class ReviewsView extends BaseView {
    constructor() {
        super();
        this.reviews = [];
        this.products = [];
        this.currentFilter = 'all';
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('#filterSelect')) {
                this.currentFilter = e.target.value;
                this.filterReviews();
            }
        });
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadData();
            const stats = await this.loadReviewStats();
            
            this.container.innerHTML = `
                <div class="container py-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>Reviews & Ratings</h2>
                        <div class="d-flex gap-2">
                            <select class="form-select" id="filterSelect">
                                <option value="all">All Reviews</option>
                                <option value="pending">Pending Reviews</option>
                                <option value="completed">Responded Reviews</option>
                                <option value="reported">Reported Reviews</option>
                            </select>
                        </div>
                    </div>

                    ${this.renderReviewStats(stats)}

                    <div class="row g-4" id="reviewsContainer">
                        ${this.renderReviews()}
                    </div>
                </div>
            `;
        } catch (error) {
            this.showError('Failed to load reviews');
            console.error(error);
        }
    }

    async loadData() {
        const [reviewsSnapshot, productsSnapshot] = await Promise.all([
            this.loadReviews(),
            this.loadProducts()
        ]);

        this.reviews = reviewsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        this.products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async loadReviews() {
        const userId = app.auth.currentUser.id;
        const isBusinessUser = app.auth.currentUser.role === 'business';

        let query = this.db.collection('reviews');
        
        if (isBusinessUser) {
            query = query.where('userId', '==', userId);
        } else {
            query = query.where('farmerId', '==', userId);
        }

        return query.orderBy('createdAt', 'desc').get();
    }

    async loadProducts() {
        const userId = app.auth.currentUser.id;
        return this.db.collection('products')
            .where('userId', '==', userId)
            .get();
    }

    renderReviews() {
        const filteredReviews = this.filterReviews();

        if (filteredReviews.length === 0) {
            return `
                <div class="col-12">
                    <div class="alert alert-info">
                        No reviews found.
                    </div>
                </div>
            `;
        }

        return filteredReviews.map(review => `
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h5 class="card-title mb-1">${review.productName}</h5>
                                <div class="text-muted small">
                                    ${new Date(review.createdAt.toDate()).toLocaleDateString()}
                                </div>
                            </div>
                            <div class="rating-stars">
                                ${this.renderStars(review.rating)}
                            </div>
                        </div>
                        <p class="card-text">${review.comment}</p>
                        ${review.response ? `
                            <div class="review-response bg-light p-3 rounded mt-3">
                                <div class="fw-bold mb-1">Response:</div>
                                ${review.response}
                            </div>
                        ` : ''}
                        ${!review.response && app.auth.currentUser.role === 'farmer' ? `
                            <button class="btn btn-outline-primary btn-sm mt-3"
                                onclick="reviewsView.showResponseForm('${review.id}')">
                                Respond to Review
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterReviews() {
        switch (this.currentFilter) {
            case 'pending':
                return this.reviews.filter(r => !r.response);
            case 'completed':
                return this.reviews.filter(r => r.response);
            case 'reported':
                return this.reviews.filter(r => r.reported);
            default:
                return this.reviews;
        }
    }

    renderStars(rating) {
        return Array(5).fill(0).map((_, i) => `
            <i class="fas fa-star ${i < rating ? 'text-warning' : 'text-muted'}"></i>
        `).join('');
    }

    async showReviewForm(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modalHtml = `
            <div class="modal fade" id="reviewModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Write a Review</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="reviewForm">
                                <div class="mb-3">
                                    <label class="form-label">Rating</label>
                                    <div class="rating-input">
                                        ${Array(5).fill(0).map((_, i) => `
                                            <i class="fas fa-star star-rating" 
                                                data-rating="${i + 1}"
                                                onmouseover="reviewsView.highlightStars(${i + 1})"
                                                onclick="reviewsView.setRating(${i + 1})"></i>
                                        `).join('')}
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Your Review</label>
                                    <textarea class="form-control" rows="4" required
                                        placeholder="Share your experience with this product..."></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    Submit Review
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
        modal.show();

        document.getElementById('reviewForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitReview(productId, e.target);
            modal.hide();
        });
    }

    async submitReview(productId, form) {
        try {
            const rating = parseInt(form.querySelector('.rating-input').dataset.rating);
            const comment = form.querySelector('textarea').value;
            const images = form.querySelector('input[type="file"]')?.files;

            // Upload images if any
            const imageUrls = [];
            if (images && images.length > 0) {
                for (let image of images) {
                    const imageUrl = await this.uploadImage(image);
                    imageUrls.push(imageUrl);
                }
            }

            // Get product and farmer details
            const product = this.products.find(p => p.id === productId);
            
            await this.db.collection('reviews').add({
                productId,
                productName: product.name,
                farmerId: product.userId,
                userId: app.auth.currentUser.id,
                userName: app.auth.currentUser.name,
                rating,
                comment,
                images: imageUrls,
                helpful: 0,
                reported: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Update product rating
            await this.updateProductRating(productId);

            // Send notification to farmer
            await this.sendReviewNotification(product.userId, product.name, rating);

            this.showToast('Review submitted successfully');
            await this.render();
        } catch (error) {
            console.error('Error submitting review:', error);
            this.showError('Failed to submit review');
        }
    }

    async uploadImage(file) {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`reviews/${Date.now()}_${file.name}`);
        await fileRef.put(file);
        return await fileRef.getDownloadURL();
    }

    async updateProductRating(productId) {
        const reviews = await this.db.collection('reviews')
            .where('productId', '==', productId)
            .get();

        let totalRating = 0;
        reviews.forEach(doc => {
            totalRating += doc.data().rating;
        });

        const averageRating = reviews.size > 0 ? totalRating / reviews.size : 0;

        await this.db.collection('products')
            .doc(productId)
            .update({
                rating: averageRating,
                reviewCount: reviews.size
            });
    }

    async sendReviewNotification(farmerId, productName, rating) {
        await this.db.collection('notifications').add({
            userId: farmerId,
            type: 'review',
            title: 'New Review Received',
            message: `Your product "${productName}" received a ${rating}-star review`,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    async markHelpful(reviewId) {
        await this.db.collection('reviews')
            .doc(reviewId)
            .update({
                helpful: firebase.firestore.FieldValue.increment(1)
            });
        this.showToast('Review marked as helpful');
        await this.render();
    }

    async reportReview(reviewId) {
        const reason = prompt('Please provide a reason for reporting this review:');
        if (!reason) return;

        await this.db.collection('reports').add({
            reviewId,
            reason,
            reporterId: app.auth.currentUser.id,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        await this.db.collection('reviews')
            .doc(reviewId)
            .update({
                reported: true
            });

        this.showToast('Review reported successfully');
        await this.render();
    }

    async showResponseForm(reviewId) {
        const review = this.reviews.find(r => r.id === reviewId);
        if (!review) return;

        const modalHtml = `
            <div class="modal fade" id="responseModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Respond to Review</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="responseForm">
                                <div class="mb-3">
                                    <label class="form-label">Your Response</label>
                                    <textarea class="form-control" rows="4" required
                                        placeholder="Write your response..."></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    Submit Response
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('responseModal'));
        modal.show();

        document.getElementById('responseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.submitResponse(reviewId, e.target);
            modal.hide();
        });
    }

    async submitResponse(reviewId, form) {
        try {
            const response = form.querySelector('textarea').value;

            await this.db.collection('reviews')
                .doc(reviewId)
                .update({
                    response,
                    respondedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            this.showToast('Response submitted successfully');
            await this.render();
        } catch (error) {
            console.error('Error submitting response:', error);
            this.showError('Failed to submit response');
        }
    }

    async loadReviewStats() {
        const userId = app.auth.currentUser.id;
        const isBusinessUser = app.auth.currentUser.role === 'business';

        try {
            const reviews = await this.db.collection('reviews')
                .where(isBusinessUser ? 'userId' : 'farmerId', '==', userId)
                .get();

            const stats = {
                total: reviews.size,
                average: 0,
                distribution: {1: 0, 2: 0, 3: 0, 4: 0, 5: 0},
                pending: 0,
                responded: 0
            };

            let totalRating = 0;
            reviews.forEach(doc => {
                const review = doc.data();
                totalRating += review.rating;
                stats.distribution[review.rating]++;
                review.response ? stats.responded++ : stats.pending++;
            });

            stats.average = reviews.size > 0 ? (totalRating / reviews.size).toFixed(1) : 0;
            return stats;
        } catch (error) {
            console.error('Error loading review stats:', error);
            return null;
        }
    }

    renderReviewStats(stats) {
        if (!stats) return '';

        return `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-3 text-center">
                            <h2 class="mb-0">${stats.average}</h2>
                            <div class="rating-stars mb-2">
                                ${this.renderStars(Math.round(stats.average))}
                            </div>
                            <div class="text-muted">${stats.total} reviews</div>
                        </div>
                        <div class="col-md-6">
                            ${Object.entries(stats.distribution).reverse().map(([rating, count]) => `
                                <div class="d-flex align-items-center mb-1">
                                    <div class="text-muted me-2">${rating} stars</div>
                                    <div class="progress flex-grow-1" style="height: 8px;">
                                        <div class="progress-bar bg-warning" 
                                            style="width: ${(count/stats.total*100) || 0}%"></div>
                                    </div>
                                    <div class="text-muted ms-2">${count}</div>
                                </div>
                            `).join('')}
                        </div>
                        <div class="col-md-3 text-center">
                            <div class="mb-2">
                                <h4 class="mb-0 text-success">${stats.responded}</h4>
                                <small class="text-muted">Responded</small>
                            </div>
                            <div>
                                <h4 class="mb-0 text-warning">${stats.pending}</h4>
                                <small class="text-muted">Pending</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    highlightStars(rating) {
        document.querySelectorAll('.star-rating').forEach((star, index) => {
            star.classList.toggle('text-warning', index < rating);
        });
    }

    setRating(rating) {
        document.querySelector('.rating-input').dataset.rating = rating;
        this.highlightStars(rating);
    }
} 