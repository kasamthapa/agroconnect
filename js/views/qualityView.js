import BaseView from './baseView.js';

export default class QualityView extends BaseView {
    constructor() {
        super();
        this.inspections = [];
        this.products = [];
        this.currentFilter = 'pending';
        this.bindEvents();
    }

    bindEvents() {
        document.addEventListener('change', (e) => {
            if (e.target.matches('#filterSelect')) {
                this.currentFilter = e.target.value;
                this.render();
            }
        });

        document.addEventListener('submit', async (e) => {
            if (e.target.matches('#inspectionForm')) {
                e.preventDefault();
                await this.submitInspection(e.target);
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
                        <h2>Quality Control</h2>
                        <div class="d-flex gap-2">
                            <select class="form-select" id="filterSelect">
                                <option value="pending" ${this.currentFilter === 'pending' ? 'selected' : ''}>
                                    Pending Inspections
                                </option>
                                <option value="completed" ${this.currentFilter === 'completed' ? 'selected' : ''}>
                                    Completed Inspections
                                </option>
                                <option value="failed" ${this.currentFilter === 'failed' ? 'selected' : ''}>
                                    Failed Inspections
                                </option>
                            </select>
                            <button class="btn btn-primary" onclick="qualityView.showNewInspectionModal()">
                                <i class="fas fa-plus me-2"></i>New Inspection
                            </button>
                        </div>
                    </div>

                    ${this.renderQualityStats()}

                    <div class="card">
                        <div class="card-body">
                            <div class="table-responsive">
                                <table class="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Batch #</th>
                                            <th>Inspector</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                            <th>Score</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${this.renderInspectionRows()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } catch (error) {
            this.showError('Failed to load quality control data');
            console.error(error);
        }
    }

    async loadData() {
        const [inspectionsSnapshot, productsSnapshot] = await Promise.all([
            this.loadInspections(),
            this.loadProducts()
        ]);

        this.inspections = inspectionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        this.products = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    async loadInspections() {
        const userId = app.auth.currentUser.id;
        const isFarmer = app.auth.currentUser.role === 'farmer';

        let query = firebase.firestore().collection('inspections');
        
        if (isFarmer) {
            query = query.where('farmerId', '==', userId);
        } else {
            query = query.where('inspectorId', '==', userId);
        }

        return query.orderBy('createdAt', 'desc').get();
    }

    async loadProducts() {
        const userId = app.auth.currentUser.id;
        return firebase.firestore()
            .collection('products')
            .where('userId', '==', userId)
            .get();
    }

    renderQualityStats() {
        const total = this.inspections.length;
        const passed = this.inspections.filter(i => i.status === 'passed').length;
        const failed = this.inspections.filter(i => i.status === 'failed').length;
        const pending = this.inspections.filter(i => i.status === 'pending').length;

        return `
            <div class="row g-4 mb-4">
                <div class="col-md-3">
                    <div class="card bg-primary text-white">
                        <div class="card-body">
                            <h6 class="card-title">Total Inspections</h6>
                            <h3>${total}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-success text-white">
                        <div class="card-body">
                            <h6 class="card-title">Passed</h6>
                            <h3>${passed}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-danger text-white">
                        <div class="card-body">
                            <h6 class="card-title">Failed</h6>
                            <h3>${failed}</h3>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card bg-warning text-white">
                        <div class="card-body">
                            <h6 class="card-title">Pending</h6>
                            <h3>${pending}</h3>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderInspectionRows() {
        const filteredInspections = this.inspections.filter(
            inspection => inspection.status === this.currentFilter
        );

        if (filteredInspections.length === 0) {
            return `
                <tr>
                    <td colspan="7">No ${this.currentFilter} inspections found.</td>
                </tr>
            `;
        }

        return filteredInspections.map(inspection => `
            <tr>
                <td>${inspection.productName}</td>
                <td>${inspection.batchNumber}</td>
                <td>${inspection.inspectorName}</td>
                <td>${new Date(inspection.createdAt.toDate()).toLocaleDateString()}</td>
                <td>${inspection.status.toUpperCase()}</td>
                <td>${inspection.score}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary" onclick="qualityView.showInspectionDetails('${inspection.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-success" onclick="qualityView.generateQualityReport('${inspection.id}')">
                            <i class="fas fa-file-alt"></i>
                        </button>
                        ${inspection.certifications?.length ? `
                            <button class="btn btn-info" onclick="qualityView.verifyCertification('${inspection.id}')">
                                <i class="fas fa-certificate"></i>
                            </button>
                        ` : ''}
                        ${inspection.status === 'pending' ? `
                            <button class="btn btn-warning" onclick="qualityView.scheduleInspection('${inspection.productId}')">
                                <i class="fas fa-calendar-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showNewInspectionModal() {
        const modalHtml = `
            <div class="modal fade" id="inspectionModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Request Quality Inspection</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="inspectionForm" onsubmit="qualityView.submitInspectionRequest(event)">
                                <div class="mb-3">
                                    <label class="form-label">Product Name</label>
                                    <input type="text" class="form-control" name="productName" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Description</label>
                                    <textarea class="form-control" name="description" rows="3" required></textarea>
                                </div>
                                <div class="row mb-3">
                                    <div class="col-md-6">
                                        <label class="form-label">Quantity</label>
                                        <input type="number" class="form-control" name="quantity" required>
                                    </div>
                                    <div class="col-md-6">
                                        <label class="form-label">Unit</label>
                                        <select class="form-select" name="unit" required>
                                            <option value="kg">Kilograms</option>
                                            <option value="pieces">Pieces</option>
                                            <option value="boxes">Boxes</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Harvest Date</label>
                                    <input type="date" class="form-control" name="harvestDate" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Certifications (Optional)</label>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="certifications" value="organic">
                                        <label class="form-check-label">Organic</label>
                                    </div>
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="certifications" value="pesticide-free">
                                        <label class="form-check-label">Pesticide Free</label>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Product Images</label>
                                    <input type="file" class="form-control" name="images" 
                                        accept="image/*" multiple required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">
                                    Submit Request
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('inspectionModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add modal to DOM and show it
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('inspectionModal'));
        modal.show();
    }

    async submitInspectionRequest(event) {
        event.preventDefault();
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        
        try {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

            const formData = {
                productName: form.productName.value,
                description: form.description.value,
                quantity: parseInt(form.quantity.value),
                unit: form.unit.value,
                harvestDate: form.harvestDate.value,
                certifications: Array.from(form.certifications)
                    .filter(cb => cb.checked)
                    .map(cb => cb.value),
                status: 'pending',
                farmerId: app.auth.currentUser.id,
                farmerName: app.auth.currentUser.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add inspection request
            const docRef = await firebase.firestore()
                .collection('inspections')
                .add(formData);

            bootstrap.Modal.getInstance(document.getElementById('inspectionModal')).hide();
            this.showToast('Inspection request submitted successfully');
            await this.render();

        } catch (error) {
            console.error('Error submitting inspection:', error);
            this.showError('Failed to submit inspection request');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submit Request';
        }
    }

    async showInspectionDetails(inspectionId) {
        const inspection = this.inspections.find(i => i.id === inspectionId);
        if (!inspection) return;

        const modalHtml = `
            <div class="modal fade" id="inspectionDetailsModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Inspection Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <!-- Product Information -->
                            <div class="card mb-3">
                                <div class="card-body">
                                    <h6 class="card-title">Product Information</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p><strong>Product:</strong> ${inspection.productName}</p>
                                            <p><strong>Quantity:</strong> ${inspection.quantity} ${inspection.unit}</p>
                                            <p><strong>Harvest Date:</strong> ${inspection.harvestDate}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p><strong>Farmer:</strong> ${inspection.farmerName}</p>
                                            <p><strong>Status:</strong> 
                                                <span class="badge bg-${this.getStatusColor(inspection.status)}">
                                                    ${inspection.status.toUpperCase()}
                                                </span>
                                            </p>
                                            <p><strong>Certifications:</strong> 
                                                ${inspection.certifications?.map(cert => 
                                                    `<span class="badge bg-info me-1">${cert}</span>`
                                                ).join('') || 'None'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Quality Checklist -->
                            ${this.renderQualityChecklist(inspection)}

                            <!-- Inspector Actions -->
                            ${app.auth.currentUser.role !== 'farmer' && inspection.status === 'pending' ? `
                                <div class="card">
                                    <div class="card-body">
                                        <h6 class="card-title">Inspector Actions</h6>
                                        <form id="inspectionResultForm" onsubmit="qualityView.submitInspectionResult(event, '${inspectionId}')">
                                            <div class="mb-3">
                                                <label class="form-label">Quality Score (0-100)</label>
                                                <input type="number" class="form-control" name="score" 
                                                    min="0" max="100" required>
                                            </div>
                                            <div class="mb-3">
                                                <label class="form-label">Notes</label>
                                                <textarea class="form-control" name="notes" rows="3" required></textarea>
                                            </div>
                                            <div class="d-flex gap-2">
                                                <button type="submit" class="btn btn-success flex-grow-1" 
                                                    onclick="this.form.dataset.action='pass'">
                                                    Pass Inspection
                                                </button>
                                                <button type="submit" class="btn btn-danger flex-grow-1"
                                                    onclick="this.form.dataset.action='fail'">
                                                    Fail Inspection
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('inspectionDetailsModal'));
        modal.show();
    }

    renderQualityChecklist(inspection) {
        const criteria = [
            { name: 'appearance', label: 'Visual Appearance' },
            { name: 'freshness', label: 'Freshness' },
            { name: 'size', label: 'Size Consistency' },
            { name: 'damage', label: 'Damage Assessment' },
            { name: 'cleanliness', label: 'Cleanliness' },
            { name: 'packaging', label: 'Packaging Quality' }
        ];

        return `
            <div class="card mb-3">
                <div class="card-body">
                    <h6 class="card-title">Quality Checklist</h6>
                    <div class="table-responsive">
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>Criteria</th>
                                    <th>Rating</th>
                                    <th>Notes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${criteria.map(criterion => `
                                    <tr>
                                        <td>${criterion.label}</td>
                                        <td>
                                            <select class="form-select form-select-sm" 
                                                name="${criterion.name}_rating"
                                                ${inspection.status !== 'pending' ? 'disabled' : ''}>
                                                <option value="">Select rating...</option>
                                                <option value="5">Excellent</option>
                                                <option value="4">Good</option>
                                                <option value="3">Average</option>
                                                <option value="2">Poor</option>
                                                <option value="1">Unacceptable</option>
                                            </select>
                                        </td>
                                        <td>
                                            <input type="text" class="form-control form-control-sm"
                                                name="${criterion.name}_notes"
                                                ${inspection.status !== 'pending' ? 'disabled' : ''}>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    async submitInspectionResult(event, inspectionId) {
        event.preventDefault();
        const form = event.target;
        const action = form.dataset.action;
        
        try {
            const score = parseInt(form.score.value);
            const notes = form.notes.value;

            // Collect criteria ratings
            const criteria = {};
            form.querySelectorAll('select[name$="_rating"]').forEach(select => {
                const name = select.name.replace('_rating', '');
                criteria[name] = {
                    rating: parseInt(select.value),
                    notes: form.querySelector(`input[name="${name}_notes"]`).value
                };
            });

            await firebase.firestore()
                .collection('inspections')
                .doc(inspectionId)
                .update({
                    status: action === 'pass' ? 'passed' : 'failed',
                    score,
                    notes,
                    criteria,
                    inspectorId: app.auth.currentUser.id,
                    inspectorName: app.auth.currentUser.name,
                    completedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            bootstrap.Modal.getInstance(document.getElementById('inspectionDetailsModal')).hide();
            this.showToast('Inspection result submitted successfully');
            await this.render();

        } catch (error) {
            console.error('Error submitting inspection result:', error);
            this.showError('Failed to submit inspection result');
        }
    }

    getStatusColor(status) {
        const colors = {
            pending: 'warning',
            passed: 'success',
            failed: 'danger'
        };
        return colors[status] || 'secondary';
    }

    showToast(message) {
        const toastHtml = `
            <div class="toast-container position-fixed bottom-0 end-0 p-3">
                <div class="toast" role="alert">
                    <div class="toast-header">
                        <i class="fas fa-info-circle text-primary me-2"></i>
                        <strong class="me-auto">Quality Inspection</strong>
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

    async generateQualityReport(inspectionId = null) {
        try {
            let inspectionsToReport = inspectionId ? 
                [this.inspections.find(i => i.id === inspectionId)] : 
                this.inspections.filter(i => i.status !== 'pending');

            const reportHtml = `
                <div class="modal fade" id="reportModal" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">Quality Inspection Report</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <div class="mb-4">
                                    <h6>Summary</h6>
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <div class="border rounded p-3 text-center">
                                                <div class="h4">${inspectionsToReport.length}</div>
                                                <div class="text-muted">Total Inspections</div>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="border rounded p-3 text-center">
                                                <div class="h4">
                                                    ${Math.round(inspectionsToReport.reduce((sum, i) => sum + i.score, 0) / inspectionsToReport.length)}%
                                                </div>
                                                <div class="text-muted">Average Score</div>
                                            </div>
                                        </div>
                                        <div class="col-md-4">
                                            <div class="border rounded p-3 text-center">
                                                <div class="h4">
                                                    ${inspectionsToReport.filter(i => i.status === 'passed').length}
                                                </div>
                                                <div class="text-muted">Passed Inspections</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="table-responsive">
                                    <table class="table table-bordered">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Date</th>
                                                <th>Score</th>
                                                <th>Status</th>
                                                <th>Inspector</th>
                                                <th>Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            ${inspectionsToReport.map(inspection => `
                                                <tr>
                                                    <td>${inspection.productName}</td>
                                                    <td>${inspection.completedAt.toDate().toLocaleDateString()}</td>
                                                    <td>${inspection.score}%</td>
                                                    <td>
                                                        <span class="badge bg-${this.getStatusColor(inspection.status)}">
                                                            ${inspection.status.toUpperCase()}
                                                        </span>
                                                    </td>
                                                    <td>${inspection.inspectorName}</td>
                                                    <td>${inspection.notes || '-'}</td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>

                                <div class="mt-3 d-flex justify-content-end">
                                    <button class="btn btn-primary" onclick="qualityView.downloadReport()">
                                        <i class="fas fa-download me-2"></i>Download Report
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', reportHtml);
            const modal = new bootstrap.Modal(document.getElementById('reportModal'));
            modal.show();

        } catch (error) {
            console.error('Error generating report:', error);
            this.showError('Failed to generate report');
        }
    }

    async verifyCertification(certificationId) {
        const modalHtml = `
            <div class="modal fade" id="certificationModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Certification Verification</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="certificationForm">
                                <div class="mb-3">
                                    <label class="form-label">Certification Type</label>
                                    <select class="form-select" name="type" required>
                                        <option value="organic">Organic</option>
                                        <option value="pesticide-free">Pesticide Free</option>
                                        <option value="fair-trade">Fair Trade</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Certificate Number</label>
                                    <input type="text" class="form-control" name="certificateNumber" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Issuing Authority</label>
                                    <input type="text" class="form-control" name="authority" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Issue Date</label>
                                    <input type="date" class="form-control" name="issueDate" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Expiry Date</label>
                                    <input type="date" class="form-control" name="expiryDate" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Certificate Document</label>
                                    <input type="file" class="form-control" name="document" accept=".pdf,.jpg,.png" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Verify Certification</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('certificationModal'));
        modal.show();
    }

    async scheduleInspection(productId) {
        const modalHtml = `
            <div class="modal fade" id="scheduleModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Schedule Inspection</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="scheduleForm" onsubmit="qualityView.submitSchedule(event)">
                                <input type="hidden" name="productId" value="${productId}">
                                <div class="mb-3">
                                    <label class="form-label">Preferred Date</label>
                                    <input type="date" class="form-control" name="preferredDate" 
                                        min="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Preferred Time</label>
                                    <select class="form-select" name="preferredTime" required>
                                        <option value="morning">Morning (9:00 - 12:00)</option>
                                        <option value="afternoon">Afternoon (13:00 - 16:00)</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Notes</label>
                                    <textarea class="form-control" name="notes" rows="3"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Schedule Inspection</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const modal = new bootstrap.Modal(document.getElementById('scheduleModal'));
        modal.show();
    }

    async submitSchedule(event) {
        event.preventDefault();
        const form = event.target;
        
        try {
            const scheduleData = {
                productId: form.productId.value,
                preferredDate: form.preferredDate.value,
                preferredTime: form.preferredTime.value,
                notes: form.notes.value,
                status: 'pending',
                farmerId: app.auth.currentUser.id,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore()
                .collection('inspection_schedules')
                .add(scheduleData);

            bootstrap.Modal.getInstance(document.getElementById('scheduleModal')).hide();
            this.showToast('Inspection scheduled successfully');
            await this.render();

        } catch (error) {
            console.error('Error scheduling inspection:', error);
            this.showError('Failed to schedule inspection');
        }
    }

    downloadReport() {
        // Simple implementation - in real app, would generate PDF
        const reportContent = document.querySelector('#reportModal .modal-body').innerText;
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quality-report-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
} 