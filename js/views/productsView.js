import BaseView from './baseView.js';

export default class ProductsView extends BaseView {
    constructor() {
        super();
        this.products = [];
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'addProductForm') {
                e.preventDefault();
                await this.handleAddProduct(e.target);
            }
            if (e.target.id === 'editProductForm') {
                e.preventDefault();
                await this.handleEditProduct(e.target);
            }
        });
    }

    async showAddProduct() {
        const modal = this.createProductModal('Add New Product');
        modal.show();
    }

    async editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modal = this.createProductModal('Edit Product', product);
        modal.show();
    }

    createProductModal(title, product = null) {
        const modalHtml = `
            <div class="modal fade" id="productModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${title}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="${product ? 'editProductForm' : 'addProductForm'}">
                                ${product ? `<input type="hidden" name="id" value="${product.id}">` : ''}
                                <div class="mb-3">
                                    <label class="form-label">Product Name</label>
                                    <input type="text" class="form-control" name="name" 
                                        value="${product?.name || ''}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" name="description" rows="3" required>
                                        ${product?.description || ''}
                                    </textarea>
                                </div>
                                <div class="row mb-3">
                                    <div class="col">
                                        <label class="form-label">Price</label>
                                        <input type="number" class="form-control" name="price" 
                                            value="${product?.price || ''}" step="0.01" required>
                                    </div>
                                    <div class="col">
                                        <label class="form-label">Unit</label>
                                        <select class="form-select" name="unit" required>
                                            <option value="kg" ${product?.unit === 'kg' ? 'selected' : ''}>Kilogram</option>
                                            <option value="piece" ${product?.unit === 'piece' ? 'selected' : ''}>Piece</option>
                                            <option value="dozen" ${product?.unit === 'dozen' ? 'selected' : ''}>Dozen</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Stock Quantity</label>
                                    <input type="number" class="form-control" name="stock" 
                                        value="${product?.stock || ''}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Product Image</label>
                                    <input type="file" class="form-control" name="image" 
                                        accept="image/*" ${product ? '' : 'required'}>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    ${product ? 'Update' : 'Add'} Product
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('productModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        return new bootstrap.Modal(document.getElementById('productModal'));
    }

    async handleAddProduct(form) {
        try {
            const formData = new FormData(form);
            const imageFile = formData.get('image');
            
            // Upload image first
            const imageUrl = await this.uploadImage(imageFile);
            
            // Create product in Firestore
            const productData = {
                name: formData.get('name'),
                description: formData.get('description'),
                price: parseFloat(formData.get('price')),
                unit: formData.get('unit'),
                stock: parseInt(formData.get('stock')),
                image: imageUrl,
                userId: app.auth.currentUser.id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore().collection('products').add(productData);
            
            // Close modal and refresh
            bootstrap.Modal.getInstance(document.getElementById('productModal')).hide();
            await this.render();
            
        } catch (error) {
            console.error('Error adding product:', error);
            alert('Failed to add product. Please try again.');
        }
    }

    async uploadImage(file) {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child(`products/${Date.now()}_${file.name}`);
        await fileRef.put(file);
        return await fileRef.getDownloadURL();
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await firebase.firestore().collection('products').doc(productId).delete();
            await this.render();
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product. Please try again.');
        }
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadProducts();
            
            this.container.innerHTML = `
                <div class="container py-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>My Products</h2>
                        <button class="btn btn-primary" onclick="productsView.showAddProduct()">
                            <i class="fas fa-plus me-2"></i>Add Product
                        </button>
                    </div>
                    
                    <div class="row g-4">
                        ${this.renderProducts()}
                    </div>
                </div>
            `;
        } catch (error) {
            this.showError('Failed to load products');
            console.error(error);
        }
    }

    async loadProducts() {
        // Load products from Firebase
        const snapshot = await firebase.firestore()
            .collection('products')
            .where('userId', '==', app.auth.currentUser.id)
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
                        No products yet. Click "Add Product" to get started.
                    </div>
                </div>
            `;
        }

        return this.products.map(product => `
            <div class="col-md-4">
                <div class="card h-100">
                    <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    <div class="card-body">
                        <h5 class="card-title">${product.name}</h5>
                        <p class="card-text">${product.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">$${product.price}/${product.unit}</h6>
                            <span class="badge bg-${product.stock > 0 ? 'success' : 'danger'}">
                                ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                            </span>
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-top-0">
                        <div class="btn-group w-100">
                            <button class="btn btn-outline-primary" 
                                onclick="productsView.editProduct('${product.id}')">
                                Edit
                            </button>
                            <button class="btn btn-outline-danger" 
                                onclick="productsView.deleteProduct('${product.id}')">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // ... other methods for CRUD operations
} 