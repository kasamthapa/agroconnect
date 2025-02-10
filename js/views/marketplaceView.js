import BaseView from './baseView.js';

export default class MarketplaceView extends BaseView {
    constructor() {
        super();
        this.products = [];
        this.filteredProducts = [];
        this.filters = {
            category: 'all',
            minPrice: '',
            maxPrice: '',
            rating: 0,
            search: '',
            sortBy: 'newest'
        };
        this.categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat'];
        this.cart = [];
        this.showAdvancedFilters = false;
        this.locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'];
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('#searchInput')) {
                this.filters.search = e.target.value;
                this.debounceSearch();
            }
        });

        document.addEventListener('change', (e) => {
            if (e.target.matches('#categoryFilter')) {
                this.filters.category = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#sortFilter')) {
                this.filters.sortBy = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#minPrice')) {
                this.filters.minPrice = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#maxPrice')) {
                this.filters.maxPrice = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#ratingFilter')) {
                this.filters.rating = parseInt(e.target.value);
                this.applyFilters();
            }
            if (e.target.matches('#locationFilter')) {
                this.filters.location = e.target.value;
                this.applyFilters();
            }
            if (e.target.matches('#inStockOnly')) {
                this.filters.inStockOnly = e.target.checked;
                this.applyFilters();
            }
        });
    }

    renderSearchAndFilters() {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <form id="searchForm" class="mb-3">
                        <div class="row g-3">
                            <!-- Search Input -->
                            <div class="col-md-6">
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="fas fa-search"></i>
                                    </span>
                                    <input type="text" class="form-control" id="searchInput" 
                                        placeholder="Search products..." value="${this.filters.search || ''}">
                                    <button type="button" class="btn btn-outline-secondary" 
                                        onclick="marketplaceView.clearSearch()">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Category Filter -->
                            <div class="col-md-3">
                                <select class="form-select" id="categoryFilter">
                                    <option value="all">All Categories</option>
                                    ${this.categories.map(cat => `
                                        <option value="${cat.toLowerCase()}" 
                                            ${this.filters.category === cat.toLowerCase() ? 'selected' : ''}>
                                            ${cat}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <!-- Sort Options -->
                            <div class="col-md-3">
                                <select class="form-select" id="sortFilter">
                                    <option value="newest" ${this.filters.sortBy === 'newest' ? 'selected' : ''}>
                                        Newest First
                                    </option>
                                    <option value="price_asc" ${this.filters.sortBy === 'price_asc' ? 'selected' : ''}>
                                        Price: Low to High
                                    </option>
                                    <option value="price_desc" ${this.filters.sortBy === 'price_desc' ? 'selected' : ''}>
                                        Price: High to Low
                                    </option>
                                    <option value="rating" ${this.filters.sortBy === 'rating' ? 'selected' : ''}>
                                        Highest Rated
                                    </option>
                                </select>
                            </div>
                        </div>

                        <!-- Advanced Filters -->
                        <div class="collapse ${this.showAdvancedFilters ? 'show' : ''}" id="advancedFilters">
                            <div class="row g-3 mt-3">
                                <!-- Price Range -->
                                <div class="col-md-4">
                                    <label class="form-label">Price Range</label>
                                    <div class="input-group">
                                        <input type="number" class="form-control" id="minPrice" 
                                            placeholder="Min" value="${this.filters.minPrice || ''}">
                                        <span class="input-group-text">-</span>
                                        <input type="number" class="form-control" id="maxPrice" 
                                            placeholder="Max" value="${this.filters.maxPrice || ''}">
                                    </div>
                                </div>

                                <!-- Rating Filter -->
                                <div class="col-md-3">
                                    <label class="form-label">Minimum Rating</label>
                                    <select class="form-select" id="ratingFilter">
                                        <option value="">Any Rating</option>
                                        ${[4, 3, 2, 1].map(rating => `
                                            <option value="${rating}" 
                                                ${this.filters.rating === rating ? 'selected' : ''}>
                                                ${rating}+ Stars
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Location Filter -->
                                <div class="col-md-3">
                                    <label class="form-label">Location</label>
                                    <select class="form-select" id="locationFilter">
                                        <option value="">Any Location</option>
                                        ${this.locations.map(loc => `
                                            <option value="${loc}" 
                                                ${this.filters.location === loc ? 'selected' : ''}>
                                                ${loc}
                                            </option>
                                        `).join('')}
                                    </select>
                                </div>

                                <!-- Stock Status -->
                                <div class="col-md-2">
                                    <label class="form-label">Stock Status</label>
                                    <div class="form-check mt-2">
                                        <input class="form-check-input" type="checkbox" 
                                            id="inStockOnly" ${this.filters.inStockOnly ? 'checked' : ''}>
                                        <label class="form-check-label" for="inStockOnly">
                                            In Stock Only
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-3">
                            <button type="button" class="btn btn-link p-0" 
                                onclick="marketplaceView.toggleAdvancedFilters()">
                                ${this.showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                                <i class="fas fa-chevron-${this.showAdvancedFilters ? 'up' : 'down'} ms-1"></i>
                            </button>
                        </div>
                    </form>

                    <!-- Active Filters -->
                    ${this.renderActiveFilters()}
                </div>
            </div>
        `;
    }

    renderActiveFilters() {
        const activeFilters = [];
        
        if (this.filters.search) {
            activeFilters.push(`Search: "${this.filters.search}"`);
        }
        if (this.filters.category && this.filters.category !== 'all') {
            activeFilters.push(`Category: ${this.filters.category}`);
        }
        if (this.filters.minPrice) {
            activeFilters.push(`Min Price: $${this.filters.minPrice}`);
        }
        if (this.filters.maxPrice) {
            activeFilters.push(`Max Price: $${this.filters.maxPrice}`);
        }
        if (this.filters.rating) {
            activeFilters.push(`Min Rating: ${this.filters.rating} stars`);
        }
        if (this.filters.location) {
            activeFilters.push(`Location: ${this.filters.location}`);
        }
        if (this.filters.inStockOnly) {
            activeFilters.push('In Stock Only');
        }

        if (activeFilters.length === 0) return '';

        return `
            <div class="mt-3">
                <div class="d-flex gap-2 flex-wrap">
                    ${activeFilters.map(filter => `
                        <span class="badge bg-primary">
                            ${filter}
                            <i class="fas fa-times ms-1" style="cursor: pointer;" 
                                onclick="marketplaceView.removeFilter('${filter}')"></i>
                        </span>
                    `).join('')}
                    <button class="btn btn-link btn-sm p-0" onclick="marketplaceView.clearAllFilters()">
                        Clear All
                    </button>
                </div>
            </div>
        `;
    }

    toggleAdvancedFilters() {
        this.showAdvancedFilters = !this.showAdvancedFilters;
        this.render();
    }

    clearSearch() {
        this.filters.search = '';
        this.applyFilters();
    }

    removeFilter(filterText) {
        if (filterText.startsWith('Search:')) {
            this.filters.search = '';
        } else if (filterText.startsWith('Category:')) {
            this.filters.category = 'all';
        } else if (filterText.startsWith('Min Price:')) {
            this.filters.minPrice = '';
        } else if (filterText.startsWith('Max Price:')) {
            this.filters.maxPrice = '';
        } else if (filterText.startsWith('Min Rating:')) {
            this.filters.rating = '';
        } else if (filterText.startsWith('Location:')) {
            this.filters.location = '';
        } else if (filterText === 'In Stock Only') {
            this.filters.inStockOnly = false;
        }
        this.applyFilters();
    }

    clearAllFilters() {
        this.filters = {
            search: '',
            category: 'all',
            minPrice: '',
            maxPrice: '',
            rating: '',
            location: '',
            inStockOnly: false,
            sortBy: 'newest'
        };
        this.applyFilters();
    }

    applyFilters() {
        this.filteredProducts = app.searchService.search(this.filters.search, this.filters);
        this.render();
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadProducts();
            this.filteredProducts = [...this.products];
            
            this.container.innerHTML = `
                <div class="container py-4">
                    ${this.renderSearchAndFilters()}
                    
                    <div class="row g-4" id="productsGrid">
                        ${this.filteredProducts.map(product => this.renderProductCard(product)).join('')}
                    </div>
                </div>
            `;
        } catch (error) {
            this.showError('Failed to load marketplace');
            console.error(error);
        }
    }

    async loadProducts() {
        const snapshot = await firebase.firestore()
            .collection('products')
            .where('stock', '>', 0)
            .get();
            
        this.products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    renderProducts() {
        if (this.products.length === 0) {
            return `
                <div class="col-12">
                    <div class="alert alert-info">
                        No products available at the moment.
                    </div>
                </div>
            `;
        }

        return this.products.map(product => `
            <div class="col-md-4 col-lg-3">
                <div class="card h-100">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text text-muted">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <h6 class="mb-0">$${product.price}/${product.unit}</h6>
                            <small class="text-muted">${product.stock} available</small>
                        </div>
                        <button class="btn btn-outline-primary w-100" 
                            onclick="marketplaceView.addToCart('${product.id}')">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const cartItem = this.cart.find(item => item.id === productId);
        if (cartItem) {
            if (cartItem.quantity < product.stock) {
                cartItem.quantity++;
            } else {
                alert('Maximum available stock reached');
                return;
            }
        } else {
            this.cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                unit: product.unit,
                quantity: 1,
                maxStock: product.stock
            });
        }

        this.updateCartCount();
        this.showAddedToCartToast(product.name);
    }

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.cart.reduce((sum, item) => sum + item.quantity, 0);
        }
    }

    showAddedToCartToast(productName) {
        const toastHtml = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast" role="alert">
                    <div class="toast-header">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <strong class="me-auto">Added to Cart</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body">
                        ${productName} has been added to your cart.
                    </div>
                </div>
            </div>
        `;

        // Add toast to DOM
        document.body.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.querySelector('.toast');
        const toast = new bootstrap.Toast(toastEl);
        toast.show();

        // Remove toast after it's hidden
        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.parentElement.remove();
        });
    }

    showCart() {
        const modalHtml = `
            <div class="modal fade" id="cartModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Shopping Cart</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            ${this.renderCartItems()}
                        </div>
                        <div class="modal-footer">
                            <div class="text-end">
                                <h5>Total: $${this.calculateTotal()}</h5>
                                <button class="btn btn-primary" onclick="marketplaceView.checkout()">
                                    Proceed to Checkout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('cartModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('cartModal'));
        modal.show();
    }

    renderCartItems() {
        if (this.cart.length === 0) {
            return `
                <div class="text-center py-4">
                    <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        }

        return `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.cart.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>$${item.price}/${item.unit}</td>
                                <td>
                                    <div class="input-group" style="width: 120px">
                                        <button class="btn btn-outline-secondary" 
                                            onclick="marketplaceView.updateQuantity('${item.id}', -1)">-</button>
                                        <input type="text" class="form-control text-center" 
                                            value="${item.quantity}" readonly>
                                        <button class="btn btn-outline-secondary" 
                                            onclick="marketplaceView.updateQuantity('${item.id}', 1)">+</button>
                                    </div>
                                </td>
                                <td>$${(item.price * item.quantity).toFixed(2)}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-danger" 
                                        onclick="marketplaceView.removeFromCart('${item.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    calculateTotal() {
        return this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(i => i.id === productId);
        if (!item) return;

        const newQuantity = item.quantity + change;
        if (newQuantity > 0 && newQuantity <= item.maxStock) {
            item.quantity = newQuantity;
            this.updateCartCount();
            this.showCart(); // Refresh cart modal
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.updateCartCount();
        this.showCart(); // Refresh cart modal
    }

    async checkout() {
        if (this.cart.length === 0) return;

        try {
            // Create order in Firestore
            const order = {
                userId: app.auth.currentUser.id,
                items: this.cart,
                total: parseFloat(this.calculateTotal()),
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore().collection('orders').add(order);

            // Clear cart
            this.cart = [];
            this.updateCartCount();

            // Close cart modal
            bootstrap.Modal.getInstance(document.getElementById('cartModal')).hide();

            // Show success message
            alert('Order placed successfully!');

        } catch (error) {
            console.error('Checkout error:', error);
            alert('Failed to place order. Please try again.');
        }
    }

    async showCheckout() {
        const total = this.calculateTotal();
        await app.paymentService.loadSavedPaymentMethods();
        
        const modalHtml = `
            <div class="modal fade" id="checkoutModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Checkout</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row">
                                <!-- Order Summary -->
                                <div class="col-md-6">
                                    <h6 class="mb-3">Order Summary</h6>
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="table-responsive">
                                                <table class="table table-sm">
                                                    <tbody>
                                                        ${this.cart.map(item => `
                                                            <tr>
                                                                <td>${item.name}</td>
                                                                <td>${item.quantity} x $${item.price}</td>
                                                                <td class="text-end">$${(item.price * item.quantity).toFixed(2)}</td>
                                                            </tr>
                                                        `).join('')}
                                                        <tr class="fw-bold">
                                                            <td colspan="2">Total</td>
                                                            <td class="text-end">$${total.toFixed(2)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Payment Form -->
                                <div class="col-md-6">
                                    <h6 class="mb-3">Payment Details</h6>
                                    <form id="paymentForm">
                                        <!-- Saved Cards -->
                                        ${app.paymentService.paymentMethods.length > 0 ? `
                                            <div class="mb-3">
                                                <label class="form-label">Saved Cards</label>
                                                <div class="list-group">
                                                    ${app.paymentService.paymentMethods.map(method => `
                                                        <label class="list-group-item">
                                                            <input class="form-check-input me-2" type="radio" 
                                                                name="paymentMethod" value="${method.id}">
                                                            <span>
                                                                ${app.paymentService.formatCard(method)} 
                                                                (expires ${app.paymentService.formatExpiryDate(method.expMonth, method.expYear)})
                                                            </span>
                                                            <button type="button" class="btn btn-sm btn-outline-danger float-end"
                                                                onclick="marketplaceView.removeCard('${method.id}')">
                                                                <i class="fas fa-trash"></i>
                                                            </button>
                                                        </label>
                                                    `).join('')}
                                                </div>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="radio" 
                                                        name="paymentMethod" value="new" id="newCard">
                                                    <label class="form-check-label" for="newCard">
                                                        Use a new card
                                                    </label>
                                                </div>
                                            </div>
                                        ` : ''}

                                        <!-- New Card Form -->
                                        <div id="newCardForm" ${app.paymentService.paymentMethods.length > 0 ? 'style="display:none;"' : ''}>
                                            <div class="mb-3">
                                                <label class="form-label">Card Information</label>
                                                <div id="card-element" class="form-control"></div>
                                                <div id="card-errors" class="invalid-feedback"></div>
                                            </div>
                                            <div class="mb-3">
                                                <div class="form-check">
                                                    <input class="form-check-input" type="checkbox" 
                                                        id="saveCard" name="saveCard">
                                                    <label class="form-check-label" for="saveCard">
                                                        Save card for future payments
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="mb-3">
                                            <label class="form-label">Shipping Address</label>
                                            <textarea class="form-control" id="shippingAddress" 
                                                rows="3" required>${app.auth.currentUser.address || ''}</textarea>
                                        </div>

                                        <button type="submit" class="btn btn-primary w-100" id="submitButton">
                                            Pay $${total.toFixed(2)}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('checkoutModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Initialize Stripe elements
        const elements = this.stripe.elements();
        const card = elements.create('card');
        card.mount('#card-element');

        // Handle form submission
        const form = document.getElementById('paymentForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.processPayment(total);
        });

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('checkoutModal'));
        modal.show();

        // Add event listeners for payment method selection
        document.querySelectorAll('input[name="paymentMethod"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const newCardForm = document.getElementById('newCardForm');
                newCardForm.style.display = e.target.value === 'new' ? 'block' : 'none';
            });
        });
    }

    async removeCard(paymentMethodId) {
        if (confirm('Are you sure you want to remove this card?')) {
            try {
                await app.paymentService.removePaymentMethod(paymentMethodId);
                await this.showCheckout(); // Refresh the checkout form
            } catch (error) {
                console.error('Error removing card:', error);
                alert('Failed to remove card. Please try again.');
            }
        }
    }

    async processPayment(amount) {
        const submitButton = document.getElementById('submitButton');
        const shippingAddress = document.getElementById('shippingAddress').value;
        const paymentMethodInput = document.querySelector('input[name="paymentMethod"]:checked');
        const saveCard = document.getElementById('saveCard')?.checked;

        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

            // Create order first
            const order = await this.createOrder(shippingAddress);

            // Process payment
            const paymentMethodId = paymentMethodInput?.value === 'new' ? null : paymentMethodInput?.value;
            const payment = await app.paymentService.processPayment(
                order.id, 
                amount * 100, // Convert to cents
                saveCard,
                paymentMethodId
            );

            // Show success and cleanup
            bootstrap.Modal.getInstance(document.getElementById('checkoutModal')).hide();
            this.showPaymentSuccess();
            this.cart = [];
            this.updateCartCount();

        } catch (error) {
            console.error('Payment failed:', error);
            document.getElementById('card-errors').textContent = error.message;
            document.getElementById('card-errors').style.display = 'block';
            
            submitButton.disabled = false;
            submitButton.innerHTML = `Pay $${amount.toFixed(2)}`;
        }
    }

    async createOrder(shippingAddress) {
        const orderData = {
            userId: app.auth.currentUser.id,
            items: this.cart,
            total: this.calculateTotal(),
            status: 'pending',
            paymentStatus: 'pending',
            shippingAddress,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const orderRef = await firebase.firestore()
            .collection('orders')
            .add(orderData);

        return {
            id: orderRef.id,
            ...orderData
        };
    }

    showPaymentSuccess() {
        const modalHtml = `
            <div class="modal fade" id="successModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-body text-center p-4">
                            <i class="fas fa-check-circle text-success fa-3x mb-3"></i>
                            <h5>Payment Successful!</h5>
                            <p class="mb-0">Your order has been placed successfully.</p>
                        </div>
                        <div class="modal-footer justify-content-center">
                            <button type="button" class="btn btn-primary" onclick="window.location.hash = 'orders'">
                                View Orders
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
    }
}

// Helper function for debouncing
function debounce(func, wait) {
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