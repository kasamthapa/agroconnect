class Dashboard {
    constructor(user) {
        this.user = user;
        this.mainContent = document.getElementById('mainContent');
        this.mockData = this.generateMockData();
    }

    async render() {
        switch (this.user.role) {
            case 'farmer':
                await this.renderFarmerDashboard();
                break;
            case 'business':
                await this.renderBusinessDashboard();
                break;
            case 'admin':
                await this.renderAdminDashboard();
                break;
        }
    }

    async renderFarmerDashboard() {
        const stats = this.mockData.farmerStats;
        this.mainContent.innerHTML = `
            <div class="container py-4">
                <h2>Farmer Dashboard</h2>
                
                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h6>Active Listings</h6>
                                <h3>${stats.activeListings}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h6>Total Sales</h6>
                                <h3>$${stats.totalSales}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-dark">
                            <div class="card-body">
                                <h6>Pending Orders</h6>
                                <h3>${stats.pendingOrders}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body">
                                <h6>Quality Rating</h6>
                                <h3>${stats.qualityRating}★</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="row mb-4">
                    <div class="col">
                        <button class="btn btn-primary" onclick="dashboard.showNewProductForm()">
                            <i class="fas fa-plus"></i> List New Product
                        </button>
                        <button class="btn btn-secondary" onclick="dashboard.showInventory()">
                            <i class="fas fa-box"></i> Manage Inventory
                        </button>
                    </div>
                </div>

                <!-- Active Listings -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Active Listings</h5>
                    </div>
                    <div class="card-body">
                        ${this.renderProductList(this.mockData.products)}
                    </div>
                </div>

                <!-- Recent Orders -->
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Recent Orders</h5>
                    </div>
                    <div class="card-body">
                        ${this.renderOrderList(this.mockData.orders)}
                    </div>
                </div>
            </div>
        `;
    }

    renderProductList(products) {
        return `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>${product.name}</td>
                                <td>$${product.price}</td>
                                <td>${product.stock} ${product.unit}</td>
                                <td>
                                    <span class="badge bg-${product.status === 'Active' ? 'success' : 'warning'}">
                                        ${product.status}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-primary" onclick="dashboard.editProduct('${product.id}')">
                                        Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="dashboard.markUrgent('${product.id}')">
                                        Mark Urgent
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderOrderList(orders) {
        return `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Business</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${orders.map(order => `
                            <tr>
                                <td>${order.id}</td>
                                <td>${order.business}</td>
                                <td>$${order.amount}</td>
                                <td>
                                    <span class="badge bg-${this.getStatusColor(order.status)}">
                                        ${order.status}
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-info" onclick="dashboard.viewOrder('${order.id}')">
                                        View
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    getStatusColor(status) {
        const colors = {
            'Pending': 'warning',
            'Processing': 'info',
            'Shipped': 'primary',
            'Delivered': 'success',
            'Cancelled': 'danger'
        };
        return colors[status] || 'secondary';
    }

    generateMockData() {
        return {
            farmerStats: {
                activeListings: 12,
                totalSales: 2450,
                pendingOrders: 5,
                qualityRating: 4.8
            },
            products: [
                {
                    id: 'p1',
                    name: 'Organic Tomatoes',
                    price: 2.99,
                    stock: 100,
                    unit: 'kg',
                    status: 'Active'
                },
                {
                    id: 'p2',
                    name: 'Fresh Lettuce',
                    price: 1.99,
                    stock: 50,
                    unit: 'heads',
                    status: 'Low Stock'
                }
            ],
            orders: [
                {
                    id: 'ORD001',
                    business: 'Local Restaurant',
                    amount: 299.99,
                    status: 'Processing'
                },
                {
                    id: 'ORD002',
                    business: 'Green Grocers',
                    amount: 150.50,
                    status: 'Pending'
                }
            ],
            businessStats: {
                activeOrders: 8,
                totalSpent: 12450,
                farmersNetwork: 15,
                savedItems: 24
            },
            availableProducts: [
                {
                    id: 'p1',
                    name: 'Organic Tomatoes',
                    farmer: 'Green Valley Farm',
                    price: 2.99,
                    unit: 'kg',
                    stock: 100,
                    image: 'https://placeholder.com/150',
                    category: 'vegetables'
                },
                {
                    id: 'p2',
                    name: 'Fresh Apples',
                    farmer: 'Sunny Orchards',
                    price: 3.99,
                    unit: 'kg',
                    stock: 75,
                    image: 'https://placeholder.com/150',
                    category: 'fruits'
                }
            ],
            businessOrders: [
                {
                    id: 'BO001',
                    farmer: 'Green Valley Farm',
                    products: ['Organic Tomatoes', 'Fresh Lettuce'],
                    total: 299.99,
                    status: 'Processing'
                },
                {
                    id: 'BO002',
                    farmer: 'Sunny Orchards',
                    products: ['Fresh Apples', 'Pears'],
                    total: 150.50,
                    status: 'Pending'
                }
            ],
            adminStats: {
                totalUsers: 156,
                totalSales: 45680,
                pendingApprovals: 12,
                activeProducts: 89
            },
            pendingApprovals: [
                {
                    id: 'apr1',
                    type: 'Product',
                    user: 'Green Valley Farm',
                    details: 'New product listing: Organic Carrots',
                    submitted: '2024-01-15'
                },
                {
                    id: 'apr2',
                    type: 'User',
                    user: 'Fresh Foods Inc.',
                    details: 'New business registration',
                    submitted: '2024-01-14'
                },
                {
                    id: 'apr3',
                    type: 'Quality',
                    user: 'Sunny Orchards',
                    details: 'Quality inspection request for Apple batch #A123',
                    submitted: '2024-01-13'
                }
            ],
            activityLog: [
                {
                    id: 'act1',
                    action: 'Product Approved',
                    details: 'Approved new product listing: Organic Tomatoes',
                    user: 'Admin',
                    timestamp: '2024-01-15T10:30:00'
                },
                {
                    id: 'act2',
                    action: 'User Verified',
                    details: 'Verified business account: Local Restaurant',
                    user: 'Admin',
                    timestamp: '2024-01-15T09:15:00'
                },
                {
                    id: 'act3',
                    action: 'Quality Check',
                    details: 'Completed quality inspection for Fresh Apples batch',
                    user: 'Quality Inspector',
                    timestamp: '2024-01-14T16:45:00'
                }
            ]
        };
    }

    // Event Handlers
    async showNewProductForm() {
        // Implementation for new product form
        const modal = new bootstrap.Modal(document.getElementById('newProductModal'));
        modal.show();
    }

    async showInventory() {
        // Implementation for inventory management
    }

    async editProduct(productId) {
        // Implementation for editing product
    }

    async markUrgent(productId) {
        // Implementation for marking product as urgent
    }

    async viewOrder(orderId) {
        // Implementation for viewing order details
    }

    async searchProducts(query) {
        // Implementation for product search
        console.log('Searching for:', query);
    }

    async filterProducts(category) {
        // Implementation for category filtering
        console.log('Filtering by category:', category);
    }

    async sortProducts(sortBy) {
        // Implementation for product sorting
        console.log('Sorting by:', sortBy);
    }

    async orderProduct(productId) {
        // Implementation for ordering products
        console.log('Ordering product:', productId);
    }

    async saveProduct(productId) {
        // Implementation for saving products
        console.log('Saving product:', productId);
    }

    async viewBusinessOrder(orderId) {
        // Implementation for viewing business order details
        console.log('Viewing order:', orderId);
    }

    async toggleViewMode() {
        // Implementation for toggling between grid and list view
        console.log('Toggling view mode');
    }

    async renderAdminDashboard() {
        const stats = this.mockData.adminStats;
        this.mainContent.innerHTML = `
            <div class="container py-4">
                <h2>Admin Dashboard</h2>
                
                <!-- Stats Cards -->
                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body">
                                <h6>Total Users</h6>
                                <h3>${stats.totalUsers}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h6>Total Sales</h6>
                                <h3>$${stats.totalSales}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-warning text-dark">
                            <div class="card-body">
                                <h6>Pending Approvals</h6>
                                <h3>${stats.pendingApprovals}</h3>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="card bg-info text-white">
                            <div class="card-body">
                                <h6>Active Products</h6>
                                <h3>${stats.activeProducts}</h3>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="row mb-4">
                    <div class="col">
                        <div class="btn-group">
                            <button class="btn btn-outline-primary" onclick="dashboard.showUserManagement()">
                                <i class="fas fa-users"></i> Manage Users
                            </button>
                            <button class="btn btn-outline-success" onclick="dashboard.showQualityInspection()">
                                <i class="fas fa-check-circle"></i> Quality Inspection
                            </button>
                            <button class="btn btn-outline-warning" onclick="dashboard.showReports()">
                                <i class="fas fa-chart-bar"></i> Reports
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Pending Approvals -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Pending Approvals</h5>
                    </div>
                    <div class="card-body">
                        ${this.renderPendingApprovals(this.mockData.pendingApprovals)}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div class="card">
                    <div class="card-header d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">Recent Activity</h5>
                        <button class="btn btn-sm btn-outline-primary" onclick="dashboard.showAllActivity()">
                            View All
                        </button>
                    </div>
                    <div class="card-body">
                        ${this.renderActivityLog(this.mockData.activityLog)}
                    </div>
                </div>
            </div>
        `;
    }

    renderPendingApprovals(approvals) {
        return `
            <div class="table-responsive">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>User</th>
                            <th>Details</th>
                            <th>Submitted</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${approvals.map(item => `
                            <tr>
                                <td>
                                    <span class="badge bg-${this.getApprovalTypeColor(item.type)}">
                                        ${item.type}
                                    </span>
                                </td>
                                <td>${item.user}</td>
                                <td>${item.details}</td>
                                <td>${new Date(item.submitted).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn btn-sm btn-success" onclick="dashboard.approveItem('${item.id}')">
                                        Approve
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="dashboard.rejectItem('${item.id}')">
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderActivityLog(activities) {
        return `
            <div class="list-group list-group-flush">
                ${activities.map(activity => `
                    <div class="list-group-item">
                        <div class="d-flex w-100 justify-content-between">
                            <h6 class="mb-1">${activity.action}</h6>
                            <small class="text-muted">${new Date(activity.timestamp).toLocaleString()}</small>
                        </div>
                        <p class="mb-1">${activity.details}</p>
                        <small class="text-muted">By ${activity.user}</small>
                    </div>
                `).join('')}
            </div>
        `;
    }

    getApprovalTypeColor(type) {
        const colors = {
            'Product': 'primary',
            'User': 'info',
            'Quality': 'warning',
            'Report': 'secondary'
        };
        return colors[type] || 'secondary';
    }

    // Add these admin methods
    async showUserManagement() {
        // Implementation for user management interface
        console.log('Opening user management');
    }

    async showQualityInspection() {
        // Implementation for quality inspection interface
        console.log('Opening quality inspection');
    }

    async showReports() {
        // Implementation for reports interface
        console.log('Opening reports');
    }

    async approveItem(itemId) {
        // Implementation for approving items
        console.log('Approving item:', itemId);
    }

    async rejectItem(itemId) {
        // Implementation for rejecting items
        console.log('Rejecting item:', itemId);
    }

    async showAllActivity() {
        // Implementation for showing all activity
        console.log('Showing all activity');
    }
} 