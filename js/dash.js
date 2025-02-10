document.addEventListener('DOMContentLoaded', (event) => {
    // Function to check if user is logged in
    function isLoggedIn() {
        // Replace this with your actual login check logic
        return !!localStorage.getItem('userToken');
    }

    // Function to add dashboard link
    function addDashboardLink() {
        const nav = document.querySelector('nav');
        if (nav) {
            const dashboardLink = document.createElement('a');
            dashboardLink.href = '/dashboard';
            dashboardLink.textContent = 'Dashboard';
            nav.appendChild(dashboardLink);
        }
    }

    // Check if user is logged in and add dashboard link
    if (isLoggedIn()) {
        addDashboardLink();
    }
});