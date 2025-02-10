class Reports {
    constructor() {
        this.currentReport = 'sales';
        this.dateRange = 'week';
        this.chartInstances = {};
        this.db = firebase.firestore();
    }

    async render() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="container py-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Reports & Analytics</h2>
                    <div class="btn-group">
                        <button class="btn ${this.dateRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}"
                            onclick="reports.changeDateRange('week')">Week</button>
                        <button class="btn ${this.dateRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}"
                            onclick="reports.changeDateRange('month')">Month</button>
                        <button class="btn ${this.dateRange === 'year' ? 'btn-primary' : 'btn-outline-primary'}"
                            onclick="reports.changeDateRange('year')">Year</button>
                    </div>
                </div>

                <div class="row mb-4">
                    <div class="col-md-3">
                        <div class="list-group">
                            <button class="list-group-item list-group-item-action ${this.currentReport === 'sales' ? 'active' : ''}"
                                onclick="reports.switchReport('sales')">
                                Sales Analytics
                            </button>
                            <button class="list-group-item list-group-item-action ${this.currentReport === 'products' ? 'active' : ''}"
                                onclick="reports.switchReport('products')">
                                Product Performance
                            </button>
                            <button class="list-group-item list-group-item-action ${this.currentReport === 'quality' ? 'active' : ''}"
                                onclick="reports.switchReport('quality')">
                                Quality Metrics
                            </button>
                            <button class="list-group-item list-group-item-action ${this.currentReport === 'users' ? 'active' : ''}"
                                onclick="reports.switchReport('users')">
                                User Analytics
                            </button>
                        </div>

                        <div class="card mt-4">
                            <div class="card-body">
                                <h5 class="card-title">Export Report</h5>
                                <button class="btn btn-outline-primary w-100 mb-2" onclick="reports.exportPDF()">
                                    <i class="fas fa-file-pdf"></i> Export as PDF
                                </button>
                                <button class="btn btn-outline-success w-100" onclick="reports.exportExcel()">
                                    <i class="fas fa-file-excel"></i> Export as Excel
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="col-md-9">
                        <div class="card">
                            <div class="card-body">
                                <div id="reportContent">
                                    ${this.renderReportContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.initializeCharts();
    }

    renderReportContent() {
        switch (this.currentReport) {
            case 'sales':
                return this.renderSalesReport();
            case 'products':
                return this.renderProductsReport();
            case 'quality':
                return this.renderQualityReport();
            case 'users':
                return this.renderUsersReport();
            default:
                return '<div class="alert alert-warning">Report not found</div>';
        }
    }

    renderSalesReport() {
        return `
            <h4>Sales Analytics</h4>
            <div class="row mb-4">
                <div class="col-md-4">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6>Total Sales</h6>
                            <h3>$45,680</h3>
                            <small>+12% from last period</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6>Orders</h6>
                            <h3>256</h3>
                            <small>+8% from last period</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-info text-white">
                        <div class="card-body">
                            <h6>Average Order Value</h6>
                            <h3>$178</h3>
                            <small>+5% from last period</small>
                        </div>
                    </div>
                </div>
            </div>
            <div class="row">
                <div class="col-12 mb-4">
                    <canvas id="salesChart" height="300"></canvas>
                </div>
                <div class="col-md-6">
                    <canvas id="topProductsChart" height="250"></canvas>
                </div>
                <div class="col-md-6">
                    <canvas id="salesDistributionChart" height="250"></canvas>
                </div>
            </div>
        `;
    }

    async initializeCharts() {
        if (this.currentReport === 'sales') {
            try {
                const salesData = await this.loadSalesData();
                
                // Destroy existing charts
                Object.values(this.chartInstances).forEach(chart => chart.destroy());
                
                // Update stats cards
                this.updateStatsCards(salesData);

                // Sales trend chart
                const salesCtx = document.getElementById('salesChart')?.getContext('2d');
                if (salesCtx) {
                    const { labels, values } = this.prepareDailyData(salesData.dailySales);
                    this.chartInstances.sales = new Chart(salesCtx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [{
                                label: 'Sales ($)',
                                data: values,
                                borderColor: 'rgb(75, 192, 192)',
                                tension: 0.1
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Sales Trend'
                                }
                            }
                        }
                    });
                }

                // Top products chart
                const productsCtx = document.getElementById('topProductsChart')?.getContext('2d');
                if (productsCtx) {
                    const topProducts = this.getTopItems(salesData.productSales, 5);
                    this.chartInstances.products = new Chart(productsCtx, {
                        type: 'bar',
                        data: {
                            labels: topProducts.labels,
                            datasets: [{
                                label: 'Sales Volume',
                                data: topProducts.values,
                                backgroundColor: this.getChartColors(topProducts.labels.length)
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Top Products'
                                }
                            }
                        }
                    });
                }

                // Sales distribution chart
                const distributionCtx = document.getElementById('salesDistributionChart')?.getContext('2d');
                if (distributionCtx) {
                    const categories = this.getTopItems(salesData.categorySales);
                    this.chartInstances.distribution = new Chart(distributionCtx, {
                        type: 'doughnut',
                        data: {
                            labels: categories.labels,
                            datasets: [{
                                data: categories.values,
                                backgroundColor: this.getChartColors(categories.labels.length)
                            }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                title: {
                                    display: true,
                                    text: 'Sales Distribution'
                                }
                            }
                        }
                    });
                }
            } catch (error) {
                console.error('Error initializing charts:', error);
                alert('Failed to load report data');
            }
        }
    }

    async switchReport(reportType) {
        this.currentReport = reportType;
        const reportContent = document.getElementById('reportContent');
        if (reportContent) {
            reportContent.innerHTML = this.renderReportContent();
            this.initializeCharts();
        }
    }

    async changeDateRange(range) {
        this.dateRange = range;
        // Update charts with new date range
        this.initializeCharts();
    }

    async exportPDF() {
        alert('Exporting PDF...');
        // Implementation for PDF export
    }

    async exportExcel() {
        alert('Exporting Excel...');
        // Implementation for Excel export
    }

    async loadSalesData() {
        try {
            const startDate = this.getStartDate();
            const salesRef = this.db.collection('orders');
            
            const snapshot = await salesRef
                .where('createdAt', '>=', startDate)
                .orderBy('createdAt')
                .get();

            const salesData = {
                totalSales: 0,
                orderCount: 0,
                dailySales: {},
                productSales: {},
                categorySales: {}
            };

            snapshot.forEach(doc => {
                const order = doc.data();
                const date = new Date(order.createdAt.toDate()).toLocaleDateString();
                
                // Aggregate total sales
                salesData.totalSales += order.total;
                salesData.orderCount++;

                // Aggregate daily sales
                salesData.dailySales[date] = (salesData.dailySales[date] || 0) + order.total;

                // Aggregate product sales
                order.items.forEach(item => {
                    salesData.productSales[item.name] = (salesData.productSales[item.name] || 0) + item.quantity;
                    salesData.categorySales[item.category] = (salesData.categorySales[item.category] || 0) + item.quantity;
                });
            });

            return salesData;
        } catch (error) {
            console.error('Error loading sales data:', error);
            throw error;
        }
    }

    updateStatsCards(salesData) {
        const totalSalesEl = document.querySelector('.bg-primary h3');
        const ordersEl = document.querySelector('.bg-success h3');
        const avgOrderEl = document.querySelector('.bg-info h3');

        if (totalSalesEl) totalSalesEl.textContent = `$${salesData.totalSales.toLocaleString()}`;
        if (ordersEl) ordersEl.textContent = salesData.orderCount.toString();
        if (avgOrderEl) {
            const avgOrder = salesData.totalSales / (salesData.orderCount || 1);
            avgOrderEl.textContent = `$${avgOrder.toFixed(2)}`;
        }
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
                return new Date(now.setDate(now.getDate() - 7));
        }
    }

    prepareDailyData(dailySales) {
        const sortedDates = Object.keys(dailySales).sort();
        return {
            labels: sortedDates,
            values: sortedDates.map(date => dailySales[date])
        };
    }

    getTopItems(items, limit = 4) {
        const sorted = Object.entries(items)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit);
        
        return {
            labels: sorted.map(([label]) => label),
            values: sorted.map(([,value]) => value)
        };
    }

    getChartColors(count) {
        const colors = [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(153, 102, 255, 0.5)',
            'rgba(255, 159, 64, 0.5)'
        ];
        return colors.slice(0, count);
    }
}

// Update the Dashboard class to use Reports
Dashboard.prototype.showReports = async function() {
    const reports = new Reports();
    await reports.render();
};

const reports = new Reports(); 