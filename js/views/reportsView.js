import BaseView from './baseView.js';

export default class ReportsView extends BaseView {
    constructor() {
        super();
        this.data = {
            sales: [],
            products: [],
            quality: []
        };
        this.dateRange = 'month';
        this.charts = {};
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('#dateRangeSelect')) {
                this.dateRange = e.target.value;
                this.updateCharts();
            }
        });
    }

    async render() {
        this.showLoading();
        
        try {
            await this.loadData();
            
            this.container.innerHTML = `
                <div class="container py-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h2>Analytics & Reports</h2>
                        <div class="d-flex gap-2">
                            <select class="form-select" id="dateRangeSelect">
                                <option value="week">Last 7 Days</option>
                                <option value="month" selected>Last 30 Days</option>
                                <option value="year">Last 12 Months</option>
                            </select>
                            <button class="btn btn-outline-primary" onclick="reportsView.exportReport()">
                                <i class="fas fa-download me-2"></i>Export
                            </button>
                        </div>
                    </div>

                    <!-- Summary Cards -->
                    <div class="row g-4 mb-4">
                        ${this.renderSummaryCards()}
                    </div>

                    <!-- Charts -->
                    <div class="row g-4">
                        <div class="col-md-8">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Sales Trend</h5>
                                    <canvas id="salesChart" height="300"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Product Distribution</h5>
                                    <canvas id="productChart" height="300"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Quality Metrics</h5>
                                    <canvas id="qualityChart" height="250"></canvas>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">Top Products</h5>
                                    ${this.renderTopProducts()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            this.initializeCharts();
        } catch (error) {
            this.showError('Failed to load reports');
            console.error(error);
        }
    }

    async loadData() {
        const startDate = this.getStartDate();
        const userId = app.auth.currentUser.id;

        // Load sales data
        const salesQuery = firebase.firestore()
            .collection('orders')
            .where('createdAt', '>=', startDate)
            .where(app.auth.currentUser.role === 'business' ? 'userId' : 'farmerId', '==', userId);

        const salesSnapshot = await salesQuery.get();
        this.data.sales = salesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Load quality data
        const qualityQuery = firebase.firestore()
            .collection('quality_inspections')
            .where('createdAt', '>=', startDate)
            .where('farmerId', '==', userId);

        const qualitySnapshot = await qualityQuery.get();
        this.data.quality = qualitySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Load products data
        const productsQuery = firebase.firestore()
            .collection('products')
            .where('userId', '==', userId);

        const productsSnapshot = await productsQuery.get();
        this.data.products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    renderSummaryCards() {
        const totalSales = this.data.sales.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = this.data.sales.length;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
        const qualityScore = this.calculateQualityScore();

        return `
            <div class="col-md-3">
                <div class="card bg-primary text-white">
                    <div class="card-body">
                        <h6 class="card-title">Total Sales</h6>
                        <h3>$${totalSales.toFixed(2)}</h3>
                        <small>${this.getGrowthRate(totalSales)}% from last period</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white">
                    <div class="card-body">
                        <h6 class="card-title">Orders</h6>
                        <h3>${totalOrders}</h3>
                        <small>${this.getGrowthRate(totalOrders)}% from last period</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white">
                    <div class="card-body">
                        <h6 class="card-title">Avg Order Value</h6>
                        <h3>$${avgOrderValue.toFixed(2)}</h3>
                        <small>${this.getGrowthRate(avgOrderValue)}% from last period</small>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-white">
                    <div class="card-body">
                        <h6 class="card-title">Quality Score</h6>
                        <h3>${qualityScore}%</h3>
                        <small>${this.getGrowthRate(qualityScore)}% from last period</small>
                    </div>
                </div>
            </div>
        `;
    }

    calculateQualityScore() {
        if (this.data.quality.length === 0) return 100;
        const approved = this.data.quality.filter(q => q.status === 'approved').length;
        return Math.round((approved / this.data.quality.length) * 100);
    }

    getGrowthRate(currentValue) {
        // Simulate growth rate calculation
        return ((Math.random() * 20) - 10).toFixed(1);
    }

    renderTopProducts() {
        const topProducts = this.data.products
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5);

        return `
            <div class="table-responsive">
                <table class="table table-sm">
                    <thead>
                        <tr>
                            <th>Product</th>
                            <th>Sales</th>
                            <th>Revenue</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topProducts.map(product => `
                            <tr>
                                <td>${product.name}</td>
                                <td>${product.sales || 0}</td>
                                <td>$${(product.sales * product.price).toFixed(2)}</td>
                                <td>
                                    <span class="badge bg-${product.stock > 0 ? 'success' : 'danger'}">
                                        ${product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    initializeCharts() {
        // Sales Trend Chart
        const salesCtx = document.getElementById('salesChart')?.getContext('2d');
        if (salesCtx) {
            this.charts.sales = new Chart(salesCtx, {
                type: 'line',
                data: this.prepareSalesData(),
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

        // Product Distribution Chart
        const productCtx = document.getElementById('productChart')?.getContext('2d');
        if (productCtx) {
            this.charts.products = new Chart(productCtx, {
                type: 'doughnut',
                data: this.prepareProductData(),
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

        // Quality Metrics Chart
        const qualityCtx = document.getElementById('qualityChart')?.getContext('2d');
        if (qualityCtx) {
            this.charts.quality = new Chart(qualityCtx, {
                type: 'bar',
                data: this.prepareQualityData(),
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
    }

    prepareSalesData() {
        // Group sales by date
        const salesByDate = this.groupByDate(this.data.sales);
        const labels = Object.keys(salesByDate);
        const values = Object.values(salesByDate);

        return {
            labels,
            datasets: [{
                label: 'Sales ($)',
                data: values,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        };
    }

    prepareProductData() {
        const productCategories = this.data.products.reduce((acc, product) => {
            acc[product.category] = (acc[product.category] || 0) + 1;
            return acc;
        }, {});

        return {
            labels: Object.keys(productCategories),
            datasets: [{
                data: Object.values(productCategories),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(54, 162, 235, 0.5)',
                    'rgba(255, 206, 86, 0.5)',
                    'rgba(75, 192, 192, 0.5)'
                ]
            }]
        };
    }

    prepareQualityData() {
        const qualityMetrics = {
            approved: this.data.quality.filter(q => q.status === 'approved').length,
            rejected: this.data.quality.filter(q => q.status === 'rejected').length,
            pending: this.data.quality.filter(q => q.status === 'pending').length
        };

        return {
            labels: ['Approved', 'Rejected', 'Pending'],
            datasets: [{
                label: 'Quality Inspections',
                data: Object.values(qualityMetrics),
                backgroundColor: [
                    'rgba(75, 192, 192, 0.5)',
                    'rgba(255, 99, 132, 0.5)',
                    'rgba(255, 206, 86, 0.5)'
                ]
            }]
        };
    }

    groupByDate(data) {
        return data.reduce((acc, item) => {
            const date = new Date(item.createdAt.toDate()).toLocaleDateString();
            acc[date] = (acc[date] || 0) + item.total;
            return acc;
        }, {});
    }

    getStartDate() {
        const now = new Date();
        switch (this.dateRange) {
            case 'week':
                return new Date(now.setDate(now.getDate() - 7));
            case 'month':
                return new Date(now.setMonth(now.getMonth() - 1));
            case 'year':
                return new Date(now.setFullYear(now.getFullYear() - 1));
            default:
                return new Date(now.setMonth(now.getMonth() - 1));
        }
    }

    async updateCharts() {
        await this.loadData();
        
        if (this.charts.sales) {
            this.charts.sales.data = this.prepareSalesData();
            this.charts.sales.update();
        }
        
        if (this.charts.products) {
            this.charts.products.data = this.prepareProductData();
            this.charts.products.update();
        }
        
        if (this.charts.quality) {
            this.charts.quality.data = this.prepareQualityData();
            this.charts.quality.update();
        }
    }

    async exportReport() {
        await this.generateCustomReport();
    }

    async loadComparativeData() {
        // Load data for previous period for comparison
        const previousStartDate = this.getPreviousPeriodDate();
        const userId = app.auth.currentUser.id;

        const previousSalesQuery = firebase.firestore()
            .collection('orders')
            .where('createdAt', '>=', previousStartDate)
            .where('createdAt', '<', this.getStartDate())
            .where(app.auth.currentUser.role === 'business' ? 'userId' : 'farmerId', '==', userId);

        const snapshot = await previousSalesQuery.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    getPreviousPeriodDate() {
        const startDate = this.getStartDate();
        const now = new Date(startDate);
        switch (this.dateRange) {
            case 'week':
                return new Date(now.setDate(now.getDate() - 7));
            case 'month':
                return new Date(now.setMonth(now.getMonth() - 1));
            case 'year':
                return new Date(now.setFullYear(now.getFullYear() - 1));
            default:
                return new Date(now.setMonth(now.getMonth() - 1));
        }
    }

    calculateDetailedMetrics() {
        return {
            salesMetrics: {
                totalRevenue: this.data.sales.reduce((sum, order) => sum + order.total, 0),
                averageOrderValue: this.data.sales.reduce((sum, order) => sum + order.total, 0) / (this.data.sales.length || 1),
                orderCount: this.data.sales.length,
                topCustomers: this.getTopCustomers(),
                salesByCategory: this.getSalesByCategory()
            },
            productMetrics: {
                totalProducts: this.data.products.length,
                outOfStock: this.data.products.filter(p => p.stock === 0).length,
                lowStock: this.data.products.filter(p => p.stock < 10).length,
                topPerformers: this.getTopPerformingProducts(),
                categoryDistribution: this.getCategoryDistribution()
            },
            qualityMetrics: {
                inspectionCount: this.data.quality.length,
                approvalRate: this.calculateQualityScore(),
                averageProcessingTime: this.calculateAverageProcessingTime(),
                issuesByType: this.getIssuesByType()
            }
        };
    }

    async generateCustomReport() {
        const metrics = this.calculateDetailedMetrics();
        const previousPeriodData = await this.loadComparativeData();
        
        const reportHtml = `
            <div class="modal fade" id="reportModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Detailed Analytics Report</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row g-4">
                                <!-- Performance Overview -->
                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title">Performance Overview</h6>
                                            <div class="table-responsive">
                                                <table class="table table-bordered">
                                                    <thead>
                                                        <tr>
                                                            <th>Metric</th>
                                                            <th>Current Period</th>
                                                            <th>Previous Period</th>
                                                            <th>Change</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        ${this.renderComparisonRows(metrics, previousPeriodData)}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Detailed Analytics -->
                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title">Sales Analysis</h6>
                                            ${this.renderSalesAnalysis(metrics.salesMetrics)}
                                        </div>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title">Product Performance</h6>
                                            ${this.renderProductAnalysis(metrics.productMetrics)}
                                        </div>
                                    </div>
                                </div>

                                <div class="col-12">
                                    <div class="card">
                                        <div class="card-body">
                                            <h6 class="card-title">Quality Insights</h6>
                                            ${this.renderQualityAnalysis(metrics.qualityMetrics)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" onclick="reportsView.downloadReport()">
                                <i class="fas fa-download me-2"></i>Download PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('reportModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM and show it
        document.body.insertAdjacentHTML('beforeend', reportHtml);
        const modal = new bootstrap.Modal(document.getElementById('reportModal'));
        modal.show();
    }

    renderComparisonRows(metrics, previousData) {
        const previousMetrics = this.calculateMetricsForData(previousData);
        const rows = [];

        // Add comparison rows for key metrics
        const compareMetric = (name, current, previous) => {
            const change = ((current - previous) / previous * 100).toFixed(1);
            const changeClass = change > 0 ? 'text-success' : 'text-danger';
            return `
                <tr>
                    <td>${name}</td>
                    <td>${current.toFixed(2)}</td>
                    <td>${previous.toFixed(2)}</td>
                    <td class="${changeClass}">
                        ${change}% ${change > 0 ? '↑' : '↓'}
                    </td>
                </tr>
            `;
        };

        rows.push(compareMetric('Total Revenue ($)', metrics.salesMetrics.totalRevenue, previousMetrics.totalRevenue));
        rows.push(compareMetric('Average Order Value ($)', metrics.salesMetrics.averageOrderValue, previousMetrics.averageOrderValue));
        rows.push(compareMetric('Order Count', metrics.salesMetrics.orderCount, previousMetrics.orderCount));
        rows.push(compareMetric('Quality Score (%)', metrics.qualityMetrics.approvalRate, previousMetrics.approvalRate));

        return rows.join('');
    }

    async downloadReport() {
        try {
            const reportContent = document.querySelector('#reportModal .modal-body').innerHTML;
            
            // Convert HTML to PDF using html2pdf
            const opt = {
                margin: 1,
                filename: 'analytics-report.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
            };

            await html2pdf().set(opt).from(reportContent).save();
            
            this.showToast('Report downloaded successfully');
        } catch (error) {
            console.error('Error downloading report:', error);
            this.showToast('Failed to download report', 'error');
        }
    }
} 