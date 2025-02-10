class UserManagement {
    constructor() {
        this.users = [];
        this.currentFilter = 'all';
    }

    async render() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="container py-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>User Management</h2>
                    <div class="btn-group">
                        <button class="btn ${this.currentFilter === 'all' ? 'btn-primary' : 'btn-outline-primary'}" 
                            onclick="userManagement.filterUsers('all')">All</button>
                        <button class="btn ${this.currentFilter === 'farmer' ? 'btn-primary' : 'btn-outline-primary'}" 
                            onclick="userManagement.filterUsers('farmer')">Farmers</button>
                        <button class="btn ${this.currentFilter === 'business' ? 'btn-primary' : 'btn-outline-primary'}" 
                            onclick="userManagement.filterUsers('business')">Businesses</button>
                        <button class="btn ${this.currentFilter === 'pending' ? 'btn-primary' : 'btn-outline-primary'}" 
                            onclick="userManagement.filterUsers('pending')">Pending</button>
                    </div>
                </div>

                <div class="card">
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="userTableBody">
                                    ${this.renderUserRows()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Load users from Firebase
        await this.loadUsers();
    }

    async loadUsers() {
        try {
            // Mock data for now - replace with Firebase later
            this.users = [
                {
                    id: 'u1',
                    name: 'Green Valley Farm',
                    role: 'farmer',
                    status: 'active',
                    joinedDate: '2024-01-01',
                    email: 'green@valley.com'
                },
                {
                    id: 'u2',
                    name: 'Local Restaurant',
                    role: 'business',
                    status: 'pending',
                    joinedDate: '2024-01-15',
                    email: 'local@restaurant.com'
                }
            ];
            
            this.updateUserTable();
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Failed to load users');
        }
    }

    renderUserRows() {
        return this.users
            .filter(user => this.currentFilter === 'all' || 
                          this.currentFilter === user.role ||
                          (this.currentFilter === 'pending' && user.status === 'pending'))
            .map(user => `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle ${this.getRoleColor(user.role)}">
                                ${user.name.charAt(0).toUpperCase()}
                            </div>
                            <div class="ms-2">
                                <div>${user.name}</div>
                                <small class="text-muted">${user.email}</small>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="badge bg-${this.getRoleColor(user.role)}">
                            ${user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </span>
                    </td>
                    <td>
                        <span class="badge bg-${user.status === 'active' ? 'success' : 'warning'}">
                            ${user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </span>
                    </td>
                    <td>${new Date(user.joinedDate).toLocaleDateString()}</td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-sm btn-outline-primary" 
                                onclick="userManagement.viewUser('${user.id}')">
                                View
                            </button>
                            ${user.status === 'pending' ? `
                                <button class="btn btn-sm btn-success" 
                                    onclick="userManagement.approveUser('${user.id}')">
                                    Approve
                                </button>
                            ` : ''}
                            <button class="btn btn-sm btn-danger" 
                                onclick="userManagement.deactivateUser('${user.id}')">
                                ${user.status === 'active' ? 'Deactivate' : 'Delete'}
                            </button>
                        </div>
                    </td>
                </tr>
            `).join('');
    }

    updateUserTable() {
        const tbody = document.getElementById('userTableBody');
        if (tbody) {
            tbody.innerHTML = this.renderUserRows();
        }
    }

    getRoleColor(role) {
        const colors = {
            'farmer': 'success',
            'business': 'primary',
            'admin': 'danger'
        };
        return colors[role] || 'secondary';
    }

    async filterUsers(filter) {
        this.currentFilter = filter;
        this.updateUserTable();
    }

    async viewUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        const modal = new bootstrap.Modal(document.getElementById('userDetailsModal') || this.createUserModal());
        const modalBody = document.querySelector('#userDetailsModal .modal-body');
        
        modalBody.innerHTML = `
            <div class="user-details">
                <h3>${user.name}</h3>
                <p class="text-muted">${user.email}</p>
                <hr>
                <div class="row">
                    <div class="col-md-6">
                        <p><strong>Role:</strong> ${user.role}</p>
                        <p><strong>Status:</strong> ${user.status}</p>
                        <p><strong>Joined:</strong> ${new Date(user.joinedDate).toLocaleDateString()}</p>
                    </div>
                    <div class="col-md-6">
                        <p><strong>Last Login:</strong> ${new Date().toLocaleDateString()}</p>
                        <p><strong>Total Orders:</strong> 25</p>
                        <p><strong>Rating:</strong> 4.5/5</p>
                    </div>
                </div>
            </div>
        `;

        modal.show();
    }

    createUserModal() {
        const modalHtml = `
            <div class="modal fade" id="userDetailsModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">User Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        return document.getElementById('userDetailsModal');
    }

    async approveUser(userId) {
        try {
            // Update user status in Firebase
            const user = this.users.find(u => u.id === userId);
            if (user) {
                user.status = 'active';
                this.updateUserTable();
                // Show success message
                alert(`User ${user.name} has been approved`);
            }
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
        }
    }

    async deactivateUser(userId) {
        if (!confirm('Are you sure you want to deactivate this user?')) return;

        try {
            // Update user status in Firebase
            const user = this.users.find(u => u.id === userId);
            if (user) {
                user.status = user.status === 'active' ? 'inactive' : 'deleted';
                this.updateUserTable();
                // Show success message
                alert(`User ${user.name} has been ${user.status}`);
            }
        } catch (error) {
            console.error('Error deactivating user:', error);
            alert('Failed to deactivate user');
        }
    }
}

// Update the Dashboard class to use UserManagement
Dashboard.prototype.showUserManagement = async function() {
    const userManagement = new UserManagement();
    await userManagement.render();
};

const userManagement = new UserManagement(); 