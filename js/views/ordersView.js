import BaseView from './baseView.js';

export default class OrdersView extends BaseView {
    constructor() {
        super();
        this.orders = [];
        this.currentTab = 'active';
        this.isBusinessUser = app.auth.currentUser.role === 'business';
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-tab]')) {
                e.preventDefault();
                this.currentTab = e.target.dataset.tab;
                this.filterOrders();
            }
        });
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadOrders();
            
            this.container.innerHTML = `
                <div class="container py-4">
                    <h2 class="mb-4">${this.isBusinessUser ? 'My Orders' : 'Orders Management'}</h2>
                    
                    <ul class="nav nav-tabs mb-4">
                        <li class="nav-item">
                            <a class="nav-link ${this.currentTab === 'active' ? 'active' : ''}" 
                                data-tab="active" href="#">
                                Active Orders
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${this.currentTab === 'completed' ? 'active' : ''}" 
                                data-tab="completed" href="#">
                                Completed
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link ${this.currentTab === 'cancelled' ? 'active' : ''}" 
                                data-tab="cancelled" href="#">
                                Cancelled
                            </a>
                        </li>
                    </ul>

                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Order ID</th>
                                    <th>${this.isBusinessUser ? 'Farmer' : 'Customer'}</th>
                                    <th>Items</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderOrders()}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        } catch (error) {
            this.showError('Failed to load orders');
            console.error(error);
        }
    }

    async loadOrders() {
        const query = this.isBusinessUser ?
            firebase.firestore().collection('orders').where('userId', '==', app.auth.currentUser.id) :
            firebase.firestore().collection('orders').where('items', 'array-contains', { farmerId: app.auth.currentUser.id });

        const snapshot = await query.orderBy('createdAt', 'desc').get();
        
        this.orders = await Promise.all(snapshot.docs.map(async doc => {
            const order = { id: doc.id, ...doc.data() };
            
            // Get user details
            const userDoc = await firebase.firestore()
                .collection('users')
                .doc(this.isBusinessUser ? order.farmerId : order.userId)
                .get();
                
            return {
                ...order,
                userDetails: userDoc.data()
            };
        }));
    }

    renderOrders() {
        const filteredOrders = this.orders.filter(order => {
            switch (this.currentTab) {
                case 'active':
                    return ['pending', 'processing', 'shipping'].includes(order.status);
                case 'completed':
                    return order.status === 'completed';
                case 'cancelled':
                    return order.status === 'cancelled';
                default:
                    return true;
            }
        });

        if (filteredOrders.length === 0) {
            return `
                <tr>
                    <td colspan="7" class="text-center py-4">
                        <div class="text-muted">No orders found</div>
                    </td>
                </tr>
            `;
        }

        return filteredOrders.map(order => `
            <tr>
                <td>
                    <a href="#" onclick="ordersView.showOrderDetails('${order.id}')">#${order.id.slice(0, 8)}</a>
                </td>
                <td>${order.userDetails.name}</td>
                <td>${this.renderOrderItems(order.items)}</td>
                <td>$${order.total.toFixed(2)}</td>
                <td>${this.renderStatus(order.status)}</td>
                <td>${new Date(order.createdAt.toDate()).toLocaleDateString()}</td>
                <td>
                    ${this.renderActions(order)}
                </td>
            </tr>
        `).join('');
    }

    renderOrderItems(items) {
        return `
            <div class="d-flex align-items-center">
                <span>${items.length} items</span>
                <button class="btn btn-sm btn-link" 
                    onclick="ordersView.showItemsModal(${JSON.stringify(items).replace(/"/g, '&quot;')})">
                    View Details
                </button>
            </div>
        `;
    }

    renderStatus(status) {
        const statusClasses = {
            pending: 'warning',
            processing: 'info',
            shipping: 'primary',
            completed: 'success',
            cancelled: 'danger'
        };

        return `
            <span class="badge bg-${statusClasses[status]}">
                ${status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        `;
    }

    renderActions(order) {
        if (this.isBusinessUser) {
            return `
                <button class="btn btn-sm btn-outline-danger" 
                    onclick="ordersView.cancelOrder('${order.id}')"
                    ${['completed', 'cancelled'].includes(order.status) ? 'disabled' : ''}>
                    Cancel Order
                </button>
            `;
        }

        return `
            <div class="btn-group">
                ${this.getActionButton(order)}
            </div>
        `;
    }

    getActionButton(order) {
        switch (order.status) {
            case 'pending':
                return `
                    <button class="btn btn-sm btn-success" 
                        onclick="ordersView.updateOrderStatus('${order.id}', 'processing')">
                        Accept Order
                    </button>
                    <button class="btn btn-sm btn-danger" 
                        onclick="ordersView.updateOrderStatus('${order.id}', 'cancelled')">
                        Reject
                    </button>
                `;
            case 'processing':
                return `
                    <button class="btn btn-sm btn-primary" 
                        onclick="ordersView.updateOrderStatus('${order.id}', 'shipping')">
                        Mark as Shipped
                    </button>
                `;
            case 'shipping':
                return `
                    <button class="btn btn-sm btn-success" 
                        onclick="ordersView.updateOrderStatus('${order.id}', 'completed')">
                        Mark as Delivered
                    </button>
                `;
            default:
                return '';
        }
    }

    showItemsModal(items) {
        const modalHtml = `
            <div class="modal fade" id="itemsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Order Items</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="table-responsive">
                                <table class="table">
                                    <thead>
                                        <tr>
                                            <th>Item</th>
                                            <th>Quantity</th>
                                            <th>Price</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${items.map(item => `
                                            <tr>
                                                <td>${item.name}</td>
                                                <td>${item.quantity} ${item.unit}</td>
                                                <td>$${item.price}</td>
                                                <td>$${(item.price * item.quantity).toFixed(2)}</td>
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

        // Remove existing modal if any
        const existingModal = document.getElementById('itemsModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('itemsModal'));
        modal.show();
    }

    async updateOrderStatus(orderId, newStatus) {
        try {
            await firebase.firestore()
                .collection('orders')
                .doc(orderId)
                .update({
                    status: newStatus,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Refresh the view
            await this.render();
            
            // Show success message
            this.showToast(`Order status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating order:', error);
            alert('Failed to update order status');
        }
    }

    async cancelOrder(orderId) {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            await this.updateOrderStatus(orderId, 'cancelled');
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('Failed to cancel order');
        }
    }

    showToast(message) {
        const toastHtml = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast" role="alert">
                    <div class="toast-header">
                        <i class="fas fa-info-circle text-primary me-2"></i>
                        <strong class="me-auto">Order Update</strong>
                        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body">
                        ${message}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.querySelector('.toast');
        const toast = new bootstrap.Toast(toastEl);
        toast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.parentElement.remove();
        });
    }
} 