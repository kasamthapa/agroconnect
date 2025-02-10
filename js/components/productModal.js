class ProductModal {
    constructor() {
        this.modalHtml = `
            <div class="modal fade" id="newProductModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">List New Product</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="newProductForm" onsubmit="productModal.handleSubmit(event)">
                                <div class="mb-3">
                                    <label class="form-label">Product Name</label>
                                    <input type="text" class="form-control" name="name" required>
                                </div>
                                <div class="row mb-3">
                                    <div class="col">
                                        <label class="form-label">Price</label>
                                        <div class="input-group">
                                            <span class="input-group-text">$</span>
                                            <input type="number" class="form-control" name="price" step="0.01" required>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <label class="form-label">Unit</label>
                                        <select class="form-select" name="unit" required>
                                            <option value="kg">Kilogram (kg)</option>
                                            <option value="lb">Pound (lb)</option>
                                            <option value="piece">Piece</option>
                                            <option value="bunch">Bunch</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Category</label>
                                    <select class="form-select" name="category" required>
                                        <option value="vegetables">Vegetables</option>
                                        <option value="fruits">Fruits</option>
                                        <option value="grains">Grains</option>
                                        <option value="dairy">Dairy</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Initial Stock</label>
                                    <input type="number" class="form-control" name="stock" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" name="description" rows="3"></textarea>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Product Image</label>
                                    <input type="file" class="form-control" name="image" accept="image/*">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Expiry Date</label>
                                    <input type="date" class="form-control" name="expiryDate">
                                </div>
                                <div class="form-check mb-3">
                                    <input type="checkbox" class="form-check-input" name="organic" id="organicCheck">
                                    <label class="form-check-label" for="organicCheck">Organic Product</label>
                                </div>
                                <button type="submit" class="btn btn-primary">List Product</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    init() {
        // Add modal to document body
        document.body.insertAdjacentHTML('beforeend', this.modalHtml);
    }

    async handleSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            // Create product object
            const product = {
                id: 'p_' + Math.random().toString(36).substr(2, 9),
                name: formData.get('name'),
                price: parseFloat(formData.get('price')),
                unit: formData.get('unit'),
                category: formData.get('category'),
                stock: parseInt(formData.get('stock')),
                description: formData.get('description'),
                expiryDate: formData.get('expiryDate'),
                organic: formData.get('organic') === 'on',
                createdAt: new Date(),
                status: 'Pending'
            };

            // In a real app, this would be sent to a server
            console.log('New product:', product);
            
            // Close modal and reset form
            bootstrap.Modal.getInstance(document.getElementById('newProductModal')).hide();
            form.reset();
            
            // Refresh dashboard
            await dashboard.render();
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Failed to create product. Please try again.');
        }
    }
}

const productModal = new ProductModal();
productModal.init(); 