import BaseView from './baseView.js';

export default class InventoryView extends BaseView {
    constructor() {
        super();
        this.products = [];
        this.categories = ['Vegetables', 'Fruits', 'Grains', 'Dairy', 'Meat'];
        this.lowStockThreshold = 10;
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('submit', async (e) => {
            if (e.target.matches('#stockUpdateForm')) {
                e.preventDefault();
                await this.updateStock(e.target);
            }
            if (e.target.matches('#batchForm')) {
                e.preventDefault();
                await this.addBatch(e.target);
            }
        });
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadInventory();
            
            this.container.innerHTML = `
                <div class="container py-4">
                    <!-- Inventory Summary -->
                    ${this.renderInventorySummary()}

                    <!-- Low Stock Alerts -->
                    ${this.renderLowStockAlerts()}

                    <!-- Inventory Table -->
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h5 class="mb-0">Inventory Management</h5>
                            <button class="btn btn-primary btn-sm" onclick="inventoryView.showAddBatchModal()">
                                <i class="fas fa-plus me-2"></i>Add New Batch
                            </button>
                        </div>
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Category</th>
                                            <th>Current Stock</th>
                                            <th>Unit</th>
                                            <th>Batch Info</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.renderInventoryRows()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            this.showError('Failed to load inventory');
            console.error(error);
        }
    }

    async loadInventory() {
        const snapshot = await firebase.firestore()
            .collection('products')
            .where('userId', '==', app.auth.currentUser.id)
            .get();

        this.products = await Promise.all(snapshot.docs.map(async doc => {
            const product = { id: doc.id, ...doc.data() };
            
            // Load batches for each product
            const batchesSnapshot = await firebase.firestore()
                .collection('batches')
                .where('productId', '==', doc.id)
                .orderBy('expiryDate')
                .get();
                
            product.batches = batchesSnapshot.docs.map(batchDoc => ({
                id: batchDoc.id,
                ...batchDoc.data()
            }));
            
            return product;
        }));
    }

    renderInventorySummary() {
        const totalProducts = this.products.length;
        const totalStock = this.products.reduce((sum, p) => sum + p.stock, 0);
        const lowStock = this.products.filter(p => p.stock <= this.lowStockThreshold).length;
        const outOfStock = this.products.filter(p => p.stock === 0).length;

        return `
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Products</h6>
                            <h3>${totalProducts}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Stock</h6>
                            <h3>${totalStock}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h6 class="card-title">Low Stock</h6>
                            <h3>${lowStock}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h6 class="card-title">Out of Stock</h6>
                            <h3>${outOfStock}</h3>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderLowStockAlerts() {
        const lowStockProducts = this.products.filter(p => p.stock <= this.lowStockThreshold);
        
        if (lowStockProducts.length === 0) return '';

        return `
            <div class="alert alert-warning mb-4">
                <h6 class="alert-heading mb-2">
                    <i class="fas fa-exclamation-triangle me-2"></i>Low Stock Alerts
                </h6>
                <ul class="mb-0">
                    ${lowStockProducts.map(product => `
                        <li>
                            ${product.name} - Only ${product.stock} ${product.unit} remaining
                            <button class="btn btn-sm btn-warning float-end" 
                                onclick="inventoryView.showStockUpdateModal('${product.id}')">
                                Update Stock
                            </button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    renderInventoryRows() {
        if (this.products.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center">No products in inventory</td>
                </tr>
            `;
        }

        return this.products.map(product => `
            <tr>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.stock} ${product.unit}</td>
                <td>${product.unit}</td>
                <td>
                    ${product.batches?.length ? `
                        <button class="btn btn-sm btn-outline-primary"
                            onclick="inventoryView.showBatchDetails('${product.id}')">
                            View ${product.batches.length} Batches
                        </button>
                    ` : 'No batches'}
                </td>
                <td>
                    <span class="badge bg-${this.getStockStatusColor(product.stock)}">
                        ${this.getStockStatus(product.stock)}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" 
                            onclick="inventoryView.showStockUpdateModal('${product.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-success" 
                            onclick="inventoryView.showAddBatchModal('${product.id}')">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="btn btn-outline-info" 
                            onclick="inventoryView.showStockHistory('${product.id}')">
                            <i class="fas fa-history"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    getStockStatus(stock) {
        if (stock === 0) return 'Out of Stock';
        if (stock <= this.lowStockThreshold) return 'Low Stock';
        return 'In Stock';
    }

    getStockStatusColor(stock) {
        if (stock === 0) return 'danger';
        if (stock <= this.lowStockThreshold) return 'warning';
        return 'success';
    }

    async showStockUpdateModal(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modalHtml = `
            <div class="modal fade" id="stockUpdateModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Update Stock - ${product.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="stockUpdateForm">
                                <input type="hidden" name="productId" value="${product.id}">
                                <div class="mb-3">
                                    <label class="form-label">Current Stock: ${product.stock} ${product.unit}</label>
                                    <div class="input-group">
                                        <button type="button" class="btn btn-outline-secondary" 
                                            onclick="inventoryView.adjustStock(-1)">-</button>
                                        <input type="number" class="form-control text-center" 
                                            name="quantity" value="${product.stock}" min="0" required>
                                        <button type="button" class="btn btn-outline-secondary" 
                                            onclick="inventoryView.adjustStock(1)">+</button>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Reason for Update</label>
                                    <select class="form-select" name="reason" required>
                                        <option value="">Select reason...</option>
                                        <option value="restock">Restock</option>
                                        <option value="adjustment">Inventory Adjustment</option>
                                        <option value="damage">Damage/Loss</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-control" name="notes" rows="2"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    Update Stock
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('stockUpdateModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('stockUpdateModal'));
        modal.show();
    }

    adjustStock(change) {
        const input = document.querySelector('#stockUpdateForm input[name="quantity"]');
        const newValue = parseInt(input.value) + change;
        if (newValue >= 0) {
            input.value = newValue;
        }
    }

    async updateStock(form) {
        const productId = form.productId.value;
        const newQuantity = parseInt(form.quantity.value);
        const reason = form.reason.value;
        const notes = form.notes.value;

        try {
            const product = this.products.find(p => p.id === productId);
            const oldQuantity = product.stock;
            const change = newQuantity - oldQuantity;

            // Update product stock
            await firebase.firestore()
                .collection('products')
                .doc(productId)
                .update({
                    stock: newQuantity,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Record stock movement
            await firebase.firestore()
                .collection('stock_movements')
                .add({
                    productId,
                    productName: product.name,
                    previousStock: oldQuantity,
                    newStock: newQuantity,
                    change,
                    reason,
                    notes,
                    userId: app.auth.currentUser.id,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Send notification if stock is low
            if (newQuantity <= this.lowStockThreshold) {
                await this.sendLowStockNotification(product, newQuantity);
            }

            // Close modal and refresh
            bootstrap.Modal.getInstance(document.getElementById('stockUpdateModal')).hide();
            this.showToast('Stock updated successfully');
            await this.render();

        } catch (error) {
            console.error('Error updating stock:', error);
            this.showError('Failed to update stock');
        }
    }

    async sendLowStockNotification(product, quantity) {
        await firebase.firestore()
            .collection('notifications')
            .add({
                userId: app.auth.currentUser.id,
                type: 'stock',
                title: 'Low Stock Alert',
                message: `${product.name} is running low (${quantity} ${product.unit} remaining)`,
                read: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
    }

    async showBatchDetails(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const modalHtml = `
            <div class="modal fade" id="batchDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Batch Details - ${product.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Batch #</th>
                                            <th>Quantity</th>
                                            <th>Production Date</th>
                                            <th>Expiry Date</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.renderBatchRows(product.batches)}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('batchDetailsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('batchDetailsModal'));
        modal.show();
    }

    renderBatchRows(batches) {
        if (!batches?.length) {
            return `
                <tr>
                    <td colspan="6" class="text-center">No batches found</td>
                </tr>
            `;
        }

        return batches.map(batch => {
            const now = new Date();
            const expiryDate = batch.expiryDate.toDate();
            const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            
            return `
                <tr>
                    <td>${batch.batchNumber}</td>
                    <td>${batch.quantity} ${batch.unit}</td>
                    <td>${batch.productionDate.toDate().toLocaleDateString()}</td>
                    <td>${expiryDate.toLocaleDateString()}</td>
                    <td>
                        <span class="badge bg-${this.getBatchStatusColor(daysUntilExpiry)}">
                            ${this.getBatchStatus(daysUntilExpiry)}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger"
                            onclick="inventoryView.removeBatch('${batch.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    getBatchStatus(daysUntilExpiry) {
        if (daysUntilExpiry < 0) return 'Expired';
        if (daysUntilExpiry <= 7) return 'Expiring Soon';
        if (daysUntilExpiry <= 30) return 'Good';
        return 'Fresh';
    }

    getBatchStatusColor(daysUntilExpiry) {
        if (daysUntilExpiry < 0) return 'danger';
        if (daysUntilExpiry <= 7) return 'warning';
        if (daysUntilExpiry <= 30) return 'info';
        return 'success';
    }

    async showAddBatchModal(productId = null) {
        const modalHtml = `
            <div class="modal fade" id="addBatchModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Add New Batch</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="batchForm">
                                ${!productId ? `
                                    <div class="mb-3">
                                        <label class="form-label">Product</label>
                                        <select class="form-select" name="productId" required>
                                            <option value="">Select product...</option>
                                            ${this.products.map(p => `
                                                <option value="${p.id}">${p.name}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                ` : `<input type="hidden" name="productId" value="${productId}">`}
                                
                                <div class="mb-3">
                                    <label class="form-label">Quantity</label>
                                    <input type="number" class="form-control" name="quantity" required min="1">
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Production Date</label>
                                    <input type="date" class="form-control" name="productionDate" required>
                                </div>

                                <div class="mb-3">
                                    <label class="form-label">Expiry Date</label>
                                    <input type="date" class="form-control" name="expiryDate" required>
                                </div>

                                <button type="submit" class="btn btn-primary w-100">Add Batch</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('addBatchModal'));
        modal.show();
    }

    async addBatch(form) {
        try {
            const productId = form.productId.value;
            const product = this.products.find(p => p.id === productId);
            
            const batchData = {
                productId,
                productName: product.name,
                batchNumber: await this.generateBatchNumber(productId),
                quantity: parseInt(form.quantity.value),
                unit: product.unit,
                productionDate: firebase.firestore.Timestamp.fromDate(new Date(form.productionDate.value)),
                expiryDate: firebase.firestore.Timestamp.fromDate(new Date(form.expiryDate.value)),
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: app.auth.currentUser.id
            };

            // Add batch
            await firebase.firestore()
                .collection('batches')
                .add(batchData);

            // Update product stock
            await firebase.firestore()
                .collection('products')
                .doc(productId)
                .update({
                    stock: firebase.firestore.FieldValue.increment(batchData.quantity),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            bootstrap.Modal.getInstance(document.getElementById('addBatchModal')).hide();
            this.showToast('Batch added successfully');
            await this.render();

        } catch (error) {
            console.error('Error adding batch:', error);
            this.showError('Failed to add batch');
        }
    }

    async generateBatchNumber(productId) {
        const snapshot = await firebase.firestore()
            .collection('batches')
            .where('productId', '==', productId)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        const lastBatch = snapshot.docs[0]?.data();
        const lastNumber = lastBatch ? parseInt(lastBatch.batchNumber.split('-')[1]) : 0;
        return `${productId.slice(0, 4)}-${(lastNumber + 1).toString().padStart(4, '0')}`;
    }

    async removeBatch(batchId) {
        if (!confirm('Are you sure you want to remove this batch?')) return;

        try {
            const batchRef = firebase.firestore().collection('batches').doc(batchId);
            const batch = (await batchRef.get()).data();

            await firebase.firestore().runTransaction(async (transaction) => {
                // Update product stock
                const productRef = firebase.firestore().collection('products').doc(batch.productId);
                const product = (await transaction.get(productRef)).data();

                transaction.update(productRef, {
                    stock: product.stock - batch.quantity,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Remove batch
                transaction.delete(batchRef);
            });

            this.showToast('Batch removed successfully');
            await this.render();

        } catch (error) {
            console.error('Error removing batch:', error);
            this.showError('Failed to remove batch');
        }
    }

    async showStockHistory(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const snapshot = await firebase.firestore()
            .collection('stock_movements')
            .where('productId', '==', productId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const movements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const modalHtml = `
            <div class="modal fade" id="stockHistoryModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Stock History - ${product.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Change</th>
                                            <th>Previous</th>
                                            <th>New</th>
                                            <th>Reason</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${movements.map(m => `
                                            <tr>
                                                <td>${m.createdAt.toDate().toLocaleString()}</td>
                                                <td class="text-${m.change > 0 ? 'success' : 'danger'}">
                                                    ${m.change > 0 ? '+' : ''}${m.change}
                                                </td>
                                                <td>${m.previousStock}</td>
                                                <td>${m.newStock}</td>
                                                <td>${m.reason}</td>
                                                <td>${m.notes || '-'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('stockHistoryModal'));
        modal.show();
    }
} 