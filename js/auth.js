import { auth, db } from './config/firebase.js';

class Auth {
    constructor() {
        this.auth = auth;
        this.db = db;
        this.currentUser = null;
        this.init();
        this.addValidationListeners();
        this.setupAuthStateListener();
        this.setupPasswordValidation();
    }

    setupAuthStateListener() {
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                // Get additional user data from Firestore
                const userDoc = await this.db.collection('users').doc(user.uid).get();
                this.currentUser = {
                    id: user.uid,
                    email: user.email,
                    role: userDoc.data()?.role || 'guest',
                    name: userDoc.data()?.name || user.email.split('@')[0],
                    verified: user.emailVerified || userDoc.data()?.role === 'admin',
                    loginTime: new Date()
                };
                this.saveUserSession();
                this.updateUI();
                await this.loadDashboard();
            } else {
                this.logout();
            }
        });
    }

    init() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        
        loginBtn?.addEventListener('click', () => this.login());
        registerBtn?.addEventListener('click', () => this.register());
    }

    setupPasswordValidation() {
        const passwordInput = document.querySelector('input[name="password"]');
        if (passwordInput) {
            passwordInput.addEventListener('input', (e) => this.updatePasswordStrength(e.target));
        }
    }

    updatePasswordStrength(input) {
        const password = input.value;
        const strengthIndicator = document.getElementById('passwordStrength') || this.createStrengthIndicator(input);
        
        // Calculate password strength
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^A-Za-z0-9]/)) strength++;

        // Update indicator
        const strengthClasses = ['bg-danger', 'bg-warning', 'bg-info', 'bg-success'];
        const strengthTexts = ['Weak', 'Fair', 'Good', 'Strong'];
        
        strengthIndicator.className = `password-strength-bar progress-bar ${strengthClasses[strength - 1]}`;
        strengthIndicator.style.width = `${strength * 25}%`;
        strengthIndicator.textContent = strengthTexts[strength - 1];
    }

    createStrengthIndicator(input) {
        const wrapper = document.createElement('div');
        wrapper.className = 'progress mt-2';
        wrapper.style.height = '24px';
        
        const indicator = document.createElement('div');
        indicator.id = 'passwordStrength';
        indicator.className = 'password-strength-bar progress-bar';
        indicator.style.transition = 'all 0.3s ease';
        
        wrapper.appendChild(indicator);
        input.parentNode.appendChild(wrapper);
        return indicator;
    }

    async login() {
        try {
            this.setLoading(true);
            const email = document.getElementById('emailInput').value;
            const password = document.getElementById('passwordInput').value;
            
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }

            // Sign in with Firebase
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            
            // Auth state listener will handle the rest
        } catch (error) {
            console.error('Login error:', error);
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    validateEmail(email) {
        return email && email.includes('@') && email.includes('.');
    }

    updateUI() {
        const loginSection = document.getElementById('loginSection');
        const mainContent = document.getElementById('mainContent');
        const userNav = document.getElementById('userNav');

        loginSection.style.display = 'none';
        mainContent.style.display = 'block';

        userNav.innerHTML = `
            <div class="text-white d-flex align-items-center">
                <span class="me-2">${this.currentUser.name}</span>
                <span class="badge bg-${this.currentUser.verified ? 'success' : 'warning'} me-2">
                    ${this.currentUser.role.toUpperCase()}
                </span>
                <button class="btn btn-outline-light btn-sm" onclick="auth.logout()">Logout</button>
            </div>
        `;
    }

    async logout() {
        try {
            await this.auth.signOut();
            this.currentUser = null;
            this.clearUserSession();
            document.getElementById('loginSection').style.display = 'block';
            document.getElementById('mainContent').style.display = 'none';
            document.getElementById('userNav').innerHTML = '';
        } catch (error) {
            console.error('Logout error:', error);
            this.handleError(error);
        }
    }

    async loadDashboard() {
        const dashboard = new Dashboard(this.currentUser);
        await dashboard.render();
    }

    handleError(error) {
        console.error('Auth Error:', error);
        const errorDiv = document.getElementById('loginError') || this.createErrorElement();
        
        // Map Firebase errors to user-friendly messages
        const errorMessage = this.getErrorMessage(error.code);
        
        errorDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-exclamation-circle text-danger me-2"></i>
                <span>${errorMessage}</span>
            </div>
        `;
        errorDiv.style.display = 'block';

        // Hide error after 5 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/email-already-in-use': 'An account already exists with this email.',
            'auth/weak-password': 'Password should be at least 8 characters long.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'default': 'An error occurred. Please try again.'
        };
        return errorMessages[errorCode] || errorMessages.default;
    }

    createErrorElement() {
        const errorDiv = document.createElement('div');
        errorDiv.id = 'loginError';
        errorDiv.className = 'alert alert-danger mt-3';
        document.getElementById('loginSection').appendChild(errorDiv);
        return errorDiv;
    }

    saveUserSession() {
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }

    clearUserSession() {
        localStorage.removeItem('currentUser');
    }

    checkExistingSession() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
            this.loadDashboard();
            return true;
        }
        return false;
    }

    addValidationListeners() {
        const roleSelect = document.getElementById('roleSelect');
        roleSelect.addEventListener('change', () => {
            const errorDiv = document.getElementById('loginError');
            if (errorDiv) {
                errorDiv.style.display = 'none';
            }
        });
    }

    async register(event) {
        event.preventDefault();
        const form = event.target;
        
        try {
            this.setRegistrationLoading(true);
            
            if (!this.validateRegistrationForm(form)) {
                return;
            }

            const formData = new FormData(form);
            const email = formData.get('email');
            const password = formData.get('password');
            const role = formData.get('role');

            // Create user in Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // Add additional user data to Firestore
            await this.db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                role: role,
                name: formData.get('name'),
                business: formData.get('businessName'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                verified: false,
                registrationDate: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Show success message
            this.showSuccessMessage('Account created successfully! Please verify your email.');
            
            // Close registration modal
            bootstrap.Modal.getInstance(document.getElementById('registrationModal')).hide();
            
            // Send verification email
            await userCredential.user.sendEmailVerification();
            
        } catch (error) {
            console.error('Registration error:', error);
            this.handleError(error);
        } finally {
            this.setRegistrationLoading(false);
        }
    }

    validateRegistrationForm(form) {
        const password = form.querySelector('input[name="password"]').value;
        const phone = form.querySelector('input[name="phone"]').value;
        
        // Validate password strength
        if (this.getPasswordStrength(password) < 3) {
            this.handleError({ code: 'auth/weak-password' });
            return false;
        }

        // Validate phone number
        if (!this.validatePhone(phone)) {
            this.handleError({ message: 'Please enter a valid phone number' });
            return false;
        }

        return true;
    }

    getPasswordStrength(password) {
        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.match(/[A-Z]/)) strength++;
        if (password.match(/[0-9]/)) strength++;
        if (password.match(/[^A-Za-z0-9]/)) strength++;
        return strength;
    }

    validatePhone(phone) {
        return /^\+?[\d\s-]{10,}$/.test(phone);
    }

    setRegistrationLoading(isLoading) {
        const button = document.querySelector('#registrationForm button[type="submit"]');
        if (button) {
            button.disabled = isLoading;
            button.innerHTML = isLoading ? 
                '<span class="spinner-border spinner-border-sm me-2"></span>Creating Account...' : 
                'Create Account';
        }
    }

    showSuccessMessage(message) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success alert-dismissible fade show';
        alert.innerHTML = `
            <i class="fas fa-check-circle me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.querySelector('.modal-body').insertBefore(alert, document.querySelector('#registrationForm'));
    }

    setLoading(isLoading) {
        const button = document.querySelector('#loginForm button[type="submit"]');
        if (button) {
            button.disabled = isLoading;
            button.innerHTML = isLoading ? 
                '<span class="spinner-border spinner-border-sm me-2"></span>Loading...' : 
                'Sign In';
        }
    }

    async signInWithGoogle() {
        try {
            this.setLoading(true);
            const provider = new firebase.auth.GoogleAuthProvider();
            const result = await this.auth.signInWithPopup(provider);
            
            // Check if user exists in Firestore
            const userDoc = await this.db.collection('users').doc(result.user.uid).get();
            
            if (!userDoc.exists) {
                // First time Google sign-in - show role selection modal
                this.showRoleSelectionModal(result.user);
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    showRoleSelectionModal(user) {
        const modalHtml = `
            <div class="modal fade" id="roleSelectionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Complete Your Profile</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="roleSelectionForm" onsubmit="auth.completeGoogleSignUp(event, '${user.uid}')">
                                <div class="mb-3">
                                    <label class="form-label">Select Your Role</label>
                                    <select class="form-select" name="role" required>
                                        <option value="">Choose role...</option>
                                        <option value="farmer">Farmer</option>
                                        <option value="business">Business</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Phone Number</label>
                                    <input type="tel" class="form-control" name="phone" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Address</label>
                                    <textarea class="form-control" name="address" rows="2" required></textarea>
                                </div>
                                <div id="businessFieldsGoogle" style="display: none;">
                                    <div class="mb-3">
                                        <label class="form-label">Business Name</label>
                                        <input type="text" class="form-control" name="businessName">
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Complete Registration</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('roleSelectionModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('roleSelectionModal'));
        modal.show();

        // Add role change listener
        document.querySelector('#roleSelectionForm select[name="role"]').addEventListener('change', function() {
            const businessFields = document.getElementById('businessFieldsGoogle');
            businessFields.style.display = this.value === 'business' ? 'block' : 'none';
            const businessNameInput = businessFields.querySelector('input[name="businessName"]');
            businessNameInput.required = this.value === 'business';
        });
    }

    async completeGoogleSignUp(event, userId) {
        event.preventDefault();
        const form = event.target;
        
        try {
            this.setLoading(true);
            const formData = new FormData(form);
            
            await this.db.collection('users').doc(userId).set({
                email: this.auth.currentUser.email,
                name: this.auth.currentUser.displayName,
                role: formData.get('role'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                business: formData.get('businessName') || null,
                verified: true,
                registrationDate: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('roleSelectionModal')).hide();
            
            // Show success message
            this.showSuccessMessage('Profile completed successfully!');
            
        } catch (error) {
            console.error('Profile completion error:', error);
            this.handleError(error);
        } finally {
            this.setLoading(false);
        }
    }

    showForgotPassword() {
        const modalHtml = `
            <div class="modal fade" id="passwordResetModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Reset Password</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="passwordResetForm" onsubmit="auth.resetPassword(event)">
                                <div class="mb-4">
                                    <label class="form-label">Email Address</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-light">
                                            <i class="fas fa-envelope"></i>
                                        </span>
                                        <input type="email" class="form-control" name="email" required>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Send Reset Link</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('passwordResetModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('passwordResetModal'));
        modal.show();
    }

    async resetPassword(event) {
        event.preventDefault();
        const form = event.target;
        const email = form.email.value;

        try {
            const button = form.querySelector('button');
            button.disabled = true;
            button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

            await this.auth.sendPasswordResetEmail(email);
            
            // Show success message
            this.showSuccessMessage('Password reset link sent! Check your email.');
            
            // Close modal
            bootstrap.Modal.getInstance(document.getElementById('passwordResetModal')).hide();
        } catch (error) {
            console.error('Password reset error:', error);
            this.handleError(error);
        } finally {
            const button = form.querySelector('button');
            button.disabled = false;
            button.textContent = 'Send Reset Link';
        }
    }

    showRegistrationModal() {
        const modal = new bootstrap.Modal(document.getElementById('registrationModal'));
        modal.show();
    }
}

const auth = new Auth();
// Check for existing session on page load
auth.checkExistingSession();

export default Auth; 