import BaseView from './baseView.js';

export default class LoginView extends BaseView {
    constructor() {
        super();
        this.bindEvents();
    }

    async render() {
        this.container.innerHTML = `
            <div class="auth-wrapper d-flex align-items-center py-5">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-lg-5 col-md-7">
                            <div class="auth-card card">
                                <div class="card-body text-center">
                                    <h2 class="auth-title">Farmer Market Platform</h2>
                                    <div id="loginError" class="alert alert-danger" style="display: none;"></div>
                                    
                                    <form id="loginForm" class="text-start">
                                        <div class="mb-3">
                                            <label class="form-label">Email</label>
                                            <input type="email" class="form-control" id="emailInput" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Password</label>
                                            <input type="password" class="form-control" id="passwordInput" required>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Role</label>
                                            <select class="form-select" id="roleSelect" required>
                                                <option value="">Select Role</option>
                                                <option value="farmer">Farmer</option>
                                                <option value="business">Business</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                        <button type="submit" class="btn btn-primary w-100 mb-3">Login</button>
                                        <div class="text-center">
                                            <button type="button" class="btn btn-link" id="registerBtn">
                                                New user? Register here
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    bindEvents() {
        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'loginForm') {
                e.preventDefault();
                await this.handleLogin();
            }
        });

        document.addEventListener('click', (e) => {
            if (e.target.id === 'registerBtn') {
                this.showRegistrationForm();
            }
        });
    }

    async handleLogin() {
        const email = document.getElementById('emailInput').value;
        const password = document.getElementById('passwordInput').value;
        const role = document.getElementById('roleSelect').value;

        try {
            await app.auth.login(email, password, role);
        } catch (error) {
            const errorDiv = document.getElementById('loginError');
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }

    showRegistrationForm() {
        this.container.innerHTML = `
            <div class="auth-wrapper d-flex align-items-center py-5">
                <div class="container">
                    <div class="row justify-content-center">
                        <div class="col-lg-8 col-md-10">
                            <div class="auth-card card">
                                <div class="card-body">
                                    <h2 class="auth-title text-center mb-4">Create Account</h2>
                                    <div id="registerError" class="alert alert-danger" style="display: none;"></div>
                                    
                                    <form id="registerForm">
                                        <div class="row g-3">
                                            <div class="col-md-6">
                                                <label class="form-label">Email</label>
                                                <input type="email" class="form-control" name="email" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Password</label>
                                                <input type="password" class="form-control" name="password" 
                                                    minlength="8" required>
                                                <div class="password-strength mt-2"></div>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Full Name</label>
                                                <input type="text" class="form-control" name="name" required>
                                            </div>
                                            <div class="col-md-6">
                                                <label class="form-label">Role</label>
                                                <select class="form-select" name="role" required>
                                                    <option value="">Select Role</option>
                                                    <option value="farmer">Farmer</option>
                                                    <option value="business">Business</option>
                                                </select>
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Phone</label>
                                                <input type="tel" class="form-control" name="phone" required>
                                            </div>
                                            <div class="col-12">
                                                <label class="form-label">Address</label>
                                                <textarea class="form-control" name="address" rows="2" required></textarea>
                                            </div>
                                            <div class="col-12 mt-4">
                                                <button type="submit" class="btn btn-primary w-100">
                                                    Create Account
                                                </button>
                                                <button type="button" class="btn btn-link w-100" id="backToLogin">
                                                    Back to Login
                                                </button>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for registration form
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleRegistration(e.target);
        });

        document.getElementById('backToLogin').addEventListener('click', () => {
            this.render();
        });
    }

    async handleRegistration(form) {
        try {
            const formData = new FormData(form);
            const userData = Object.fromEntries(formData.entries());
            
            await app.auth.register(userData);
            
            // Show success message and return to login
            alert('Registration successful! Please login.');
            this.render();
        } catch (error) {
            const errorDiv = document.getElementById('registerError');
            errorDiv.textContent = error.message;
            errorDiv.style.display = 'block';
        }
    }
} 