export default class BaseView {
    constructor() {
        this.container = document.getElementById('mainContent');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.errorToastContainer = document.getElementById('errorToastContainer');
    }

    async render() {
        // To be implemented by child classes
    }

    hide() {
        this.container.innerHTML = '';
    }

    showLoading() {
        this.loadingOverlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    showError(message, duration = 5000) {
        const toastId = `toast-${Date.now()}`;
        const toastHtml = `
            <div class="toast error-toast" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <i class="fas fa-exclamation-circle text-white me-2"></i>
                    <strong class="me-auto text-white">Error</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;

        this.errorToastContainer.insertAdjacentHTML('beforeend', toastHtml);
        const toastEl = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastEl, { delay: duration });
        toast.show();

        toastEl.addEventListener('hidden.bs.toast', () => {
            toastEl.remove();
        });
    }

    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        let message = 'An unexpected error occurred.';
        
        if (error.code) {
            // Firebase errors
            switch (error.code) {
                case 'auth/user-not-found':
                    message = 'User not found. Please check your credentials.';
                    break;
                case 'auth/wrong-password':
                    message = 'Invalid password. Please try again.';
                    break;
                case 'permission-denied':
                    message = 'You don\'t have permission to perform this action.';
                    break;
                default:
                    message = error.message || message;
            }
        }

        this.showError(message);
    }

    showOfflineWarning() {
        if (!navigator.onLine) {
            this.showError('You are currently offline. Some features may not be available.', 0);
        }
    }
} 