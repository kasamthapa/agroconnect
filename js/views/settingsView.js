import BaseView from './baseView.js';

export default class SettingsView extends BaseView {
    constructor() {
        super();
        this.user = app.auth.currentUser;
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('submit', async (e) => {
            if (e.target.matches('#profileForm')) {
                e.preventDefault();
                await this.updateProfile(e.target);
            }
            if (e.target.matches('#passwordForm')) {
                e.preventDefault();
                await this.updatePassword(e.target);
            }
            if (e.target.matches('#notificationForm')) {
                e.preventDefault();
                await this.updateNotificationSettings(e.target);
            }
        });
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadUserSettings();
            
            this.container.innerHTML = `
                <div class="container py-4">
                    <div class="row g-4">
                        <!-- Profile Settings -->
                        <div class="col-md-6">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Profile Settings</h5>
                                </div>
                                <div class="card-body">
                                    <form id="profileForm">
                                        <div class="mb-3">
                                            <label class="form-label">Full Name</label>
                                            <input type="text" class="form-control" name="name" 
                                                value="${this.user.name}" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Phone Number</label>
                                            <input type="tel" class="form-control" name="phone" 
                                                value="${this.user.phone || ''}" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Address</label>
                                            <textarea class="form-control" name="address" 
                                                rows="3" required>${this.user.address || ''}</textarea>
                                        </div>
                                        <button type="submit" class="btn btn-primary">
                                            Update Profile
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- Security Settings -->
                        <div class="col-md-6">
                            <div class="card mb-4">
                                <div class="card-header">
                                    <h5 class="mb-0">Security Settings</h5>
                                </div>
                                <div class="card-body">
                                    <form id="passwordForm">
                                        <div class="mb-3">
                                            <label class="form-label">Current Password</label>
                                            <input type="password" class="form-control" 
                                                name="currentPassword" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">New Password</label>
                                            <input type="password" class="form-control" 
                                                name="newPassword" minlength="8" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Confirm New Password</label>
                                            <input type="password" class="form-control" 
                                                name="confirmPassword" minlength="8" required>
                                        </div>
                                        <button type="submit" class="btn btn-primary">
                                            Change Password
                                        </button>
                                    </form>
                                </div>
                            </div>

                            <!-- Notification Settings -->
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Notification Settings</h5>
                                </div>
                                <div class="card-body">
                                    <form id="notificationForm">
                                        <div class="mb-3">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" 
                                                    name="emailNotifications" 
                                                    ${this.user.settings?.emailNotifications ? 'checked' : ''}>
                                                <label class="form-check-label">
                                                    Email Notifications
                                                </label>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" 
                                                    name="orderUpdates" 
                                                    ${this.user.settings?.orderUpdates ? 'checked' : ''}>
                                                <label class="form-check-label">
                                                    Order Updates
                                                </label>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" 
                                                    name="qualityAlerts" 
                                                    ${this.user.settings?.qualityAlerts ? 'checked' : ''}>
                                                <label class="form-check-label">
                                                    Quality Inspection Alerts
                                                </label>
                                            </div>
                                        </div>
                                        <button type="submit" class="btn btn-primary">
                                            Save Preferences
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            this.showError('Failed to load settings');
            console.error(error);
        }
    }

    async loadUserSettings() {
        const doc = await firebase.firestore()
            .collection('users')
            .doc(this.user.id)
            .get();
            
        this.user = {
            ...this.user,
            ...doc.data()
        };
    }

    async updateProfile(form) {
        try {
            const formData = new FormData(form);
            const updates = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore()
                .collection('users')
                .doc(this.user.id)
                .update(updates);

            this.showToast('Profile updated successfully');
            await this.loadUserSettings();
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showError('Failed to update profile');
        }
    }

    async updatePassword(form) {
        try {
            const currentPassword = form.currentPassword.value;
            const newPassword = form.newPassword.value;
            const confirmPassword = form.confirmPassword.value;

            if (newPassword !== confirmPassword) {
                throw new Error('New passwords do not match');
            }

            // Reauthenticate user
            const credential = firebase.auth.EmailAuthProvider.credential(
                this.user.email, 
                currentPassword
            );
            await firebase.auth().currentUser.reauthenticateWithCredential(credential);

            // Update password
            await firebase.auth().currentUser.updatePassword(newPassword);

            form.reset();
            this.showToast('Password updated successfully');
        } catch (error) {
            console.error('Error updating password:', error);
            this.showError(error.message);
        }
    }

    async updateNotificationSettings(form) {
        try {
            const settings = {
                emailNotifications: form.emailNotifications.checked,
                orderUpdates: form.orderUpdates.checked,
                qualityAlerts: form.qualityAlerts.checked,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore()
                .collection('users')
                .doc(this.user.id)
                .update({ settings });

            this.showToast('Notification preferences updated');
            await this.loadUserSettings();
        } catch (error) {
            console.error('Error updating notification settings:', error);
            this.showError('Failed to update notification settings');
        }
    }

    showToast(message) {
        const toastHtml = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast" role="alert">
                    <div class="toast-header">
                        <i class="fas fa-check-circle text-success me-2"></i>
                        <strong class="me-auto">Success</strong>
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