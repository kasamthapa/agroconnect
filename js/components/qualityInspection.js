class QualityInspection {
    constructor() {
        this.currentView = 'pending';
        this.inspections = [];
    }

    async render() {
        const mainContent = document.getElementById('mainContent');
        mainContent.innerHTML = `
            <div class="container py-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Quality Inspection</h2>
                    <div class="btn-group">
                        <button class="btn ${this.currentView === 'pending' ? 'btn-primary' : 'btn-outline-primary'}"
                            onclick="qualityInspection.switchView('pending')">
                            Pending Inspections
                        </button>
                        <button class="btn ${this.currentView === 'completed' ? 'btn-primary' : 'btn-outline-primary'}"
                            onclick="qualityInspection.switchView('completed')">
                            Completed
                        </button>
                    </div>
                </div>

                <div class="row g-4">
                    ${this.renderInspectionCards()}
                </div>
            </div>
        `;

        await this.loadInspections();
    }

    async loadInspections() {
        // Mock data - replace with Firebase later
        this.inspections = [
            {
                id: 'insp1',
                productName: 'Organic Tomatoes',
                farmer: 'Green Valley Farm',
                submittedDate: '2024-01-15',
                status: 'pending',
                images: ['https://placeholder.com/300'],
                description: 'Fresh harvest of organic tomatoes',
                quantity: '100 kg',
                certifications: ['Organic', 'Local Produce'],
                temperature: '4°C',
                humidity: '85%'
            },
            {
                id: 'insp2',
                productName: 'Fresh Apples',
                farmer: 'Sunny Orchards',
                submittedDate: '2024-01-14',
                status: 'completed',
                result: 'approved',
                inspectionDate: '2024-01-15',
                inspector: 'John Smith',
                notes: 'Meets all quality standards',
                images: ['https://placeholder.com/300'],
                quantity: '75 kg'
            }
        ];

        this.updateDisplay();
    }

    renderInspectionCards() {
        return this.inspections
            .filter(insp => 
                (this.currentView === 'pending' && insp.status === 'pending') ||
                (this.currentView === 'completed' && insp.status === 'completed')
            )
            .map(inspection => `
                <div class="col-md-6 col-lg-4">
                    <div class="card h-100">
                        <img src="${inspection.images[0]}" class="card-img-top" alt="${inspection.productName}">
                        <div class="card-body">
                            <h5 class="card-title">${inspection.productName}</h5>
                            <p class="text-muted mb-2">Submitted by ${inspection.farmer}</p>
                            
                            ${inspection.status === 'pending' ? this.renderPendingCard(inspection) : this.renderCompletedCard(inspection)}
                            
                            <button class="btn btn-outline-primary w-100 mt-3" 
                                onclick="qualityInspection.viewDetails('${inspection.id}')">
                                View Details
                            </button>
                        </div>
                    </div>
                </div>
            `).join('') || `
                <div class="col-12">
                    <div class="alert alert-info">
                        No ${this.currentView} inspections found.
                    </div>
                </div>
            `;
    }

    renderPendingCard(inspection) {
        return `
            <div class="mb-3">
                <small class="text-muted">Submitted: ${new Date(inspection.submittedDate).toLocaleDateString()}</small>
                <div class="mt-2">
                    <span class="badge bg-warning">Pending Review</span>
                    ${inspection.certifications?.map(cert => 
                        `<span class="badge bg-info ms-1">${cert}</span>`
                    ).join('') || ''}
                </div>
            </div>
            <div class="btn-group w-100">
                <button class="btn btn-success" onclick="qualityInspection.approve('${inspection.id}')">
                    Approve
                </button>
                <button class="btn btn-danger" onclick="qualityInspection.reject('${inspection.id}')">
                    Reject
                </button>
            </div>
        `;
    }

    renderCompletedCard(inspection) {
        return `
            <div class="mb-3">
                <small class="text-muted">Inspected: ${new Date(inspection.inspectionDate).toLocaleDateString()}</small>
                <div class="mt-2">
                    <span class="badge bg-${inspection.result === 'approved' ? 'success' : 'danger'}">
                        ${inspection.result.charAt(0).toUpperCase() + inspection.result.slice(1)}
                    </span>
                </div>
                <p class="mt-2 mb-0"><small>${inspection.notes}</small></p>
            </div>
        `;
    }

    updateDisplay() {
        const container = document.querySelector('.row.g-4');
        if (container) {
            container.innerHTML = this.renderInspectionCards();
        }
    }

    async switchView(view) {
        this.currentView = view;
        this.updateDisplay();
    }

    async viewDetails(inspectionId) {
        const inspection = this.inspections.find(i => i.id === inspectionId);
        if (!inspection) return;

        const modal = new bootstrap.Modal(document.getElementById('inspectionModal') || this.createInspectionModal());
        const modalBody = document.querySelector('#inspectionModal .modal-body');

        modalBody.innerHTML = `
            <div class="inspection-details">
                <div class="row">
                    <div class="col-md-6">
                        <img src="${inspection.images[0]}" class="img-fluid rounded" alt="${inspection.productName}">
                    </div>
                    <div class="col-md-6">
                        <h4>${inspection.productName}</h4>
                        <p class="text-muted">${inspection.farmer}</p>
                        <hr>
                        <div class="mb-3">
                            <strong>Quantity:</strong> ${inspection.quantity}<br>
                            <strong>Temperature:</strong> ${inspection.temperature || 'N/A'}<br>
                            <strong>Humidity:</strong> ${inspection.humidity || 'N/A'}<br>
                            <strong>Status:</strong> 
                            <span class="badge bg-${this.getStatusColor(inspection.status)}">
                                ${inspection.status.charAt(0).toUpperCase() + inspection.status.slice(1)}
                            </span>
                        </div>
                        ${inspection.certifications ? `
                            <div class="mb-3">
                                <strong>Certifications:</strong><br>
                                ${inspection.certifications.map(cert => 
                                    `<span class="badge bg-info me-1">${cert}</span>`
                                ).join('')}
                            </div>
                        ` : ''}
                        ${inspection.notes ? `
                            <div class="mb-3">
                                <strong>Notes:</strong><br>
                                ${inspection.notes}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;

        modal.show();
    }

    createInspectionModal() {
        const modalHtml = `
            <div class="modal fade" id="inspectionModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Inspection Details</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        return document.getElementById('inspectionModal');
    }

    getStatusColor(status) {
        const colors = {
            'pending': 'warning',
            'completed': 'success',
            'rejected': 'danger'
        };
        return colors[status] || 'secondary';
    }

    async approve(inspectionId) {
        try {
            const inspection = this.inspections.find(i => i.id === inspectionId);
            if (inspection) {
                inspection.status = 'completed';
                inspection.result = 'approved';
                inspection.inspectionDate = new Date().toISOString();
                inspection.inspector = 'Admin'; // Replace with actual user name
                inspection.notes = 'Product meets quality standards';
                
                this.updateDisplay();
                alert(`Inspection for ${inspection.productName} has been approved`);
            }
        } catch (error) {
            console.error('Error approving inspection:', error);
            alert('Failed to approve inspection');
        }
    }

    async reject(inspectionId) {
        if (!confirm('Are you sure you want to reject this inspection?')) return;

        try {
            const inspection = this.inspections.find(i => i.id === inspectionId);
            if (inspection) {
                inspection.status = 'completed';
                inspection.result = 'rejected';
                inspection.inspectionDate = new Date().toISOString();
                inspection.inspector = 'Admin'; // Replace with actual user name
                inspection.notes = 'Product does not meet quality standards';
                
                this.updateDisplay();
                alert(`Inspection for ${inspection.productName} has been rejected`);
            }
        } catch (error) {
            console.error('Error rejecting inspection:', error);
            alert('Failed to reject inspection');
        }
    }
}

// Update the Dashboard class to use QualityInspection
Dashboard.prototype.showQualityInspection = async function() {
    const qualityInspection = new QualityInspection();
    await qualityInspection.render();
};

const qualityInspection = new QualityInspection(); 