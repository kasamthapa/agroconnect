import BaseView from './baseView.js';

export default class AdminView extends BaseView {
    constructor() {
        super();
        this.stats = {};
        this.users = [];
        this.currentSection = 'dashboard';
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-section]')) {
                e.preventDefault();
                this.currentSection = e.target.dataset.section;
                this.render();
            }
        });
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadData();
            
            this.container.innerHTML = `
                <div class="container-fluid py-4">
                    <div class="row">
                        <!-- Sidebar -->
                        <div class="col-md-3 col-lg-2">
                            <div class="list-group">
                                <a href="#" class="list-group-item list-group-item-action ${this.currentSection === 'dashboard' ? 'active' : ''}"
                                    data-section="dashboard">
                                    <i class="fas fa-chart-line me-2"></i>Dashboard
                                </a>
                                <a href="#" class="list-group-item list-group-item-action ${this.currentSection === 'users' ? 'active' : ''}"
                                    data-section="users">
                                    <i class="fas fa-users me-2"></i>User Management
                                </a>
                                <a href="#" class="list-group-item list-group-item-action ${this.currentSection === 'quality' ? 'active' : ''}"
                                    data-section="quality">
                                    <i class="fas fa-check-circle me-2"></i>Quality Control
                                </a>
                                <a href="#" class="list-group-item list-group-item-action ${this.currentSection === 'reports' ? 'active' : ''}"
                                    data-section="reports">
                                    <i class="fas fa-file-alt me-2"></i>Reports
                                </a>
                                <a href="#" class="list-group-item list-group-item-action ${this.currentSection === 'settings' ? 'active' : ''}"
                                    data-section="settings">
                                    <i class="fas fa-cog me-2"></i>System Settings
                                </a>
                            </div>
                        </div>

                        <!-- Main Content -->
                        <div class="col-md-9 col-lg-10">
                            ${this.renderSection()}
                        </div>
                    </div>
                </div>
            `;

            // Initialize any charts if on dashboard
            if (this.currentSection === 'dashboard') {
                this.initializeCharts();
            }
        } catch (error) {
            this.showError('Failed to load admin panel');
            console.error(error);
        }
    }

    async loadData() {
        switch (this.currentSection) {
            case 'dashboard':
                await this.loadDashboardStats();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'quality':
                await this.loadQualityData();
                break;
            case 'reports':
                await this.loadReportData();
                break;
        }
    }

    renderSection() {
        switch (this.currentSection) {
            case 'dashboard':
                return this.renderDashboard();
            case 'users':
                return this.renderUserManagement();
            case 'quality':
                return this.renderQualityControl();
            case 'reports':
                return this.renderReports();
            case 'settings':
                return this.renderSystemSettings();
            default:
                return this.renderDashboard();
        }
    }

    renderDashboard() {
        return `
            <div class="row g-4">
                <!-- Stats Cards -->
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Users</h6>
                            <h3>${this.stats.totalUsers || 0}</h3>
                            <small>${this.stats.newUsers || 0} new this month</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Active Orders</h6>
                            <h3>${this.stats.activeOrders || 0}</h3>
                            <small>$${this.stats.orderValue || 0} total value</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h6 class="card-title">Quality Score</h6>
                            <h3>${this.stats.qualityScore || 0}%</h3>
                            <small>${this.stats.inspections || 0} inspections</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h6 class="card-title">System Health</h6>
                            <h3>${this.stats.systemHealth || 'Good'}</h3>
                            <small>${this.stats.uptime || '100%'} uptime</small>
                        </div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">System Activity</h5>
                            <canvas id="activityChart" height="300"></canvas>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-body">
                            <h5 class="card-title">User Distribution</h5>
                            <canvas id="userChart" height="300"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderUserManagement() {
        return `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">User Management</h5>
                    <button class="btn btn-primary btn-sm" onclick="adminView.showAddUserModal()">
                        <i class="fas fa-plus me-2"></i>Add User
                    </button>
                </div>
                <div class="card-body">
                    <div class="table-responsive">
                        <table class="table table-hover">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.renderUserRows()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async loadDashboardStats() {
        // Load various statistics from Firestore
        const [users, orders, quality] = await Promise.all([
            this.loadUserStats(),
            this.loadOrderStats(),
            this.loadQualityStats()
        ]);

        this.stats = {
            ...users,
            ...orders,
            ...quality
        };
    }

    async loadUserStats() {
        const usersSnapshot = await firebase.firestore()
            .collection('users')
            .get();

        const now = new Date();
        const monthAgo = new Date(now.setMonth(now.getMonth() - 1));

        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            totalUsers: users.length,
            newUsers: users.filter(u => u.createdAt?.toDate() > monthAgo).length,
            usersByRole: this.groupByRole(users)
        };
    }

    groupByRole(users) {
        return users.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});
    }

    initializeCharts() {
        // Activity Chart
        const activityCtx = document.getElementById('activityChart')?.getContext('2d');
        if (activityCtx) {
            new Chart(activityCtx, {
                type: 'line',
                data: this.prepareActivityData(),
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    }
                }
            });
        }

        // User Distribution Chart
        const userCtx = document.getElementById('userChart')?.getContext('2d');
        if (userCtx) {
            new Chart(userCtx, {
                type: 'doughnut',
                data: this.prepareUserData(),
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                        }
                    }
                }
            });
        }
    }

    prepareActivityData() {
        // Prepare data for activity chart
        return {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Orders',
                data: this.stats.orderActivity || [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }, {
                label: 'Quality Inspections',
                data: this.stats.qualityActivity || [],
                borderColor: 'rgb(255, 99, 132)',
                tension: 0.1
            }]
        };
    }

    prepareUserData() {
        const roles = this.stats.usersByRole || {};
        return {
            labels: Object.keys(roles).map(role => 
                role.charAt(0).toUpperCase() + role.slice(1)
            ),
            datasets: [{
                data: Object.values(roles),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)'
                ]
            }]
        };
    }

    async toggleUserStatus(userId, currentStatus) {
        try {
            await firebase.firestore()
                .collection('users')
                .doc(userId)
                .update({
                    status: currentStatus === 'active' ? 'suspended' : 'active'
                });

            this.showToast('User status updated successfully');
            await this.loadUsers();
            await this.render();
        } catch (error) {
            console.error('Error updating user status:', error);
            this.showError('Failed to update user status');
        }
    }

    async loadUsers() {
        const snapshot = await firebase.firestore()
            .collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
        this.users = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    renderUserRows() {
        if (this.users.length === 0) {
            return `
                <tr>
                    <td colspan="6" class="text-center">No users found</td>
                </tr>
            `;
        }

        return this.users.map(user => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-circle bg-primary me-2">
                            ${user.name.charAt(0).toUpperCase()}
                        </div>
                        ${user.name}
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge bg-${this.getRoleBadgeColor(user.role)}">${user.role}</span></td>
                <td>
                    <span class="badge bg-${user.status === 'active' ? 'success' : 'danger'}">
                        ${user.status || 'active'}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="adminView.editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-${user.status === 'active' ? 'danger' : 'success'}"
                            onclick="adminView.toggleUserStatus('${user.id}', '${user.status || 'active'}')">
                            <i class="fas fa-${user.status === 'active' ? 'ban' : 'check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadOrderStats() {
        const snapshot = await firebase.firestore()
            .collection('orders')
            .where('status', 'in', ['pending', 'processing'])
            .get();

        const orders = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return {
            activeOrders: orders.length,
            orderValue: orders.reduce((sum, order) => sum + order.total, 0).toFixed(2),
            orderActivity: await this.getOrderActivity()
        };
    }

    async loadQualityStats() {
        const snapshot = await firebase.firestore()
            .collection('quality_inspections')
            .get();

        const inspections = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        const approved = inspections.filter(i => i.status === 'approved').length;

        return {
            inspections: inspections.length,
            qualityScore: inspections.length > 0 ? 
                Math.round((approved / inspections.length) * 100) : 0,
            qualityActivity: await this.getQualityActivity()
        };
    }

    async getOrderActivity() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activity = new Array(7).fill(0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const snapshot = await firebase.firestore()
            .collection('orders')
            .where('createdAt', '>=', weekAgo)
            .get();

        snapshot.docs.forEach(doc => {
            const date = doc.data().createdAt.toDate();
            activity[date.getDay()]++;
        });

        return activity;
    }

    async getQualityActivity() {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const activity = new Array(7).fill(0);
        
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const snapshot = await firebase.firestore()
            .collection('quality_inspections')
            .where('createdAt', '>=', weekAgo)
            .get();

        snapshot.docs.forEach(doc => {
            const date = doc.data().createdAt.toDate();
            activity[date.getDay()]++;
        });

        return activity;
    }

    renderQualityControl() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Quality Control Dashboard</h5>
                </div>
                <div class="card-body">
                    <div class="row g-4">
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title">Pending Inspections</h6>
                                    <div class="table-responsive">
                                        ${this.renderPendingInspections()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-body">
                                    <h6 class="card-title">Quality Metrics</h6>
                                    <canvas id="qualityMetricsChart" height="300"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSystemSettings() {
        return `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">System Settings</h5>
                </div>
                <div class="card-body">
                    <form id="systemSettingsForm" onsubmit="adminView.saveSystemSettings(event)">
                        <div class="row g-4">
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">General Settings</h6>
                                        <div class="mb-3">
                                            <label class="form-label">System Name</label>
                                            <input type="text" class="form-control" name="systemName" 
                                                value="${this.settings?.systemName || 'Farmer Market Platform'}">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Maintenance Mode</label>
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" name="maintenanceMode"
                                                    ${this.settings?.maintenanceMode ? 'checked' : ''}>
                                                <label class="form-check-label">Enable Maintenance Mode</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">Security Settings</h6>
                                        <div class="mb-3">
                                            <label class="form-label">Maximum Login Attempts</label>
                                            <input type="number" class="form-control" name="maxLoginAttempts"
                                                value="${this.settings?.maxLoginAttempts || 5}">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Session Timeout (minutes)</label>
                                            <input type="number" class="form-control" name="sessionTimeout"
                                                value="${this.settings?.sessionTimeout || 30}">
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="mt-4">
                            <button type="submit" class="btn btn-primary">Save Settings</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    getRoleBadgeColor(role) {
        const colors = {
            admin: 'danger',
            farmer: 'success',
            business: 'primary'
        };
        return colors[role] || 'secondary';
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        return new Date(timestamp.toDate()).toLocaleDateString();
    }

    async saveSystemSettings(event) {
        event.preventDefault();
        const form = event.target;
        const formData = new FormData(form);
        
        try {
            const settings = {
                systemName: formData.get('systemName'),
                maintenanceMode: formData.get('maintenanceMode') === 'on',
                maxLoginAttempts: parseInt(formData.get('maxLoginAttempts')),
                sessionTimeout: parseInt(formData.get('sessionTimeout')),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: app.auth.currentUser.id
            };

            await firebase.firestore()
                .collection('settings')
                .doc('system')
                .set(settings, { merge: true });

            this.showToast('System settings updated successfully');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showError('Failed to save settings');
        }
    }
} 