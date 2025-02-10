class App {
    constructor() {
        this.currentView = null;
        this.views = {
            farmer: ['products', 'orders', 'quality'],
            business: ['marketplace', 'orders', 'saved'],
            admin: ['users', 'quality', 'reports']
        };
    }

    async init() {
        // Initialize Firebase Auth
        this.auth = new Auth();
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                await this.handleLogin(user);
            } else {
                this.showLoginView();
            }
        });

        // Initialize navigation events
        this.initNavigation();

        // Add to app initialization
        this.searchService = new SearchService();
        this.searchService.startListening();
    }

    async handleLogin(user) {
        // Get user role and show appropriate dashboard
        const role = user.role;
        this.updateNavigation(role);
        this.showDashboard(role);
    }

    updateNavigation(role) {
        const navHtml = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
                <div class="container">
                    <a class="navbar-brand" href="#">Farmer Market</a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarNav">
                        <ul class="navbar-nav me-auto">
                            ${this.views[role].map(view => `
                                <li class="nav-item">
                                    <a class="nav-link" href="#${view}" data-view="${view}">
                                        ${view.charAt(0).toUpperCase() + view.slice(1)}
                                    </a>
                                </li>
                            `).join('')}
                        </ul>
                        <div class="d-flex align-items-center">
                            <span class="text-white me-3">${this.auth.currentUser.name}</span>
                            <button class="btn btn-outline-light btn-sm" onclick="app.logout()">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>
        `;

        document.getElementById('navigation').innerHTML = navHtml;
    }

    initNavigation() {
        window.addEventListener('hashchange', () => this.handleRoute());
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-view]')) {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.navigateTo(view);
            }
        });
    }

    navigateTo(view) {
        window.location.hash = view;
    }

    async handleRoute() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        await this.showView(hash);
    }

    async showView(viewName) {
        if (this.currentView) {
            this.currentView.hide();
        }

        const ViewClass = await this.loadView(viewName);
        this.currentView = new ViewClass();
        await this.currentView.render();

        // Update active navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.view === viewName);
        });
    }

    async loadView(viewName) {
        // Dynamic import based on view name
        try {
            const module = await import(`./views/${viewName}View.js`);
            return module.default;
        } catch (error) {
            console.error(`Error loading view: ${viewName}`, error);
            return null;
        }
    }

    async showDashboard(role) {
        const defaultView = this.views[role][0];
        this.navigateTo(defaultView);
    }

    async logout() {
        await this.auth.logout();
        this.showLoginView();
    }

    showLoginView() {
        window.location.hash = '';
        document.getElementById('navigation').innerHTML = '';
        document.getElementById('mainContent').innerHTML = '';
        // Show login form
        const loginView = new LoginView();
        loginView.render();
    }
}

// Initialize app
const app = new App();
app.init(); 