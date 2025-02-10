class Notifications {
    constructor() {
        this.db = firebase.firestore();
        this.unsubscribe = null;
        this.notifications = [];
        this.initializeNotifications();
    }

    async initializeNotifications() {
        // Listen for new notifications
        this.unsubscribe = this.db
            .collection('notifications')
            .where('userId', '==', app.auth.currentUser.id)
            .where('read', '==', false)
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                snapshot.docChanges().forEach(change => {
                    if (change.type === 'added') {
                        this.showNotification(change.doc.data());
                        this.updateNotificationBadge();
                    }
                });
            });

        // Add notification bell to navbar
        this.addNotificationBell();
    }

    addNotificationBell() {
        const userNav = document.getElementById('userNav');
        const bellHtml = `
            <div class="dropdown me-3">
                <button class="btn btn-link text-white position-relative" 
                    data-bs-toggle="dropdown">
                    <i class="fas fa-bell fa-lg"></i>
                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        id="notificationBadge" style="display: none;">
                        0
                    </span>
                </button>
                <div class="dropdown-menu dropdown-menu-end" style="width: 300px;" id="notificationDropdown">
                    <h6 class="dropdown-header">Notifications</h6>
                    <div id="notificationList" style="max-height: 300px; overflow-y: auto;">
                        <div class="text-center p-3 text-muted">
                            No new notifications
                        </div>
                    </div>
                    <div class="dropdown-divider"></div>
                    <a class="dropdown-item text-center" href="#" onclick="notifications.markAllAsRead()">
                        Mark all as read
                    </a>
                </div>
            </div>
        `;
        userNav.insertAdjacentHTML('afterbegin', bellHtml);
    }

    showNotification(notification) {
        // Add to notifications list
        this.notifications.unshift(notification);
        
        // Update dropdown
        this.updateNotificationList();

        // Show toast for new notification
        if (notification.showToast !== false) {
            this.showToast(notification);
        }
    }

    updateNotificationList() {
        const list = document.getElementById('notificationList');
        if (!list) return;

        if (this.notifications.length === 0) {
            list.innerHTML = `
                <div class="text-center p-3 text-muted">
                    No new notifications
                </div>
            `;
            return;
        }

        list.innerHTML = this.notifications.map(notification => `
            <a class="dropdown-item py-2 ${notification.read ? 'text-muted' : ''}" href="#"
                onclick="notifications.handleNotificationClick('${notification.id}', '${notification.link}')">
                <div class="d-flex align-items-center">
                    <div class="notification-icon me-2">
                        <i class="fas fa-${this.getNotificationIcon(notification.type)} text-${this.getNotificationColor(notification.type)}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="fw-bold">${notification.title}</div>
                        <div class="small">${notification.message}</div>
                        <div class="small text-muted">
                            ${this.formatTimestamp(notification.createdAt)}
                        </div>
                    </div>
                    ${!notification.read ? '<div class="notification-dot"></div>' : ''}
                </div>
            </a>
        `).join('');
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        const unreadCount = this.notifications.filter(n => !n.read).length;
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'block' : 'none';
    }

    async handleNotificationClick(notificationId, link) {
        // Mark as read
        await this.markAsRead(notificationId);
        
        // Navigate if link provided
        if (link) {
            window.location.hash = link;
        }
    }

    async markAsRead(notificationId) {
        try {
            await this.db.collection('notifications')
                .doc(notificationId)
                .update({ read: true });

            // Update local state
            const notification = this.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.updateNotificationList();
                this.updateNotificationBadge();
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    }

    async markAllAsRead() {
        try {
            const batch = this.db.batch();
            this.notifications.forEach(notification => {
                if (!notification.read) {
                    const ref = this.db.collection('notifications').doc(notification.id);
                    batch.update(ref, { read: true });
                }
            });
            await batch.commit();

            // Update local state
            this.notifications.forEach(n => n.read = true);
            this.updateNotificationList();
            this.updateNotificationBadge();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    }

    showToast(notification) {
        const toastHtml = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast" role="alert">
                    <div class="toast-header">
                        <i class="fas fa-${this.getNotificationIcon(notification.type)} text-${this.getNotificationColor(notification.type)} me-2"></i>
                        <strong class="me-auto">${notification.title}</strong>
                        <small>${this.formatTimestamp(notification.createdAt)}</small>
                        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
                    </div>
                    <div class="toast-body">
                        ${notification.message}
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

    getNotificationIcon(type) {
        const icons = {
            order: 'shopping-cart',
            quality: 'check-circle',
            product: 'box',
            system: 'info-circle',
            alert: 'exclamation-triangle'
        };
        return icons[type] || 'bell';
    }

    getNotificationColor(type) {
        const colors = {
            order: 'primary',
            quality: 'success',
            product: 'info',
            system: 'secondary',
            alert: 'warning'
        };
        return colors[type] || 'primary';
    }

    formatTimestamp(timestamp) {
        const date = timestamp.toDate();
        const now = new Date();
        const diff = now - date;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
        return date.toLocaleDateString();
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Initialize notifications when user logs in
Auth.prototype.updateUI = function() {
    // ... existing updateUI code ...
    
    // Initialize notifications
    if (!window.notifications) {
        window.notifications = new Notifications();
    }
}; 