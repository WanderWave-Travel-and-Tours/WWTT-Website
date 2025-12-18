import React from 'react';
import { X, Calendar, Tag, Percent, DollarSign, FileText } from 'lucide-react';
import './PromoDetailModal.css';

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

const PromoDetailModal = ({ 
    showModal, 
    selectedPromo, 
    setShowModal,
    handleArchive
}) => {
    if (!showModal || !selectedPromo) return null;

    const closeModal = () => setShowModal(false);

    const getStatus = (validUntil) => {
        const today = new Date();
        const expiryDate = new Date(validUntil);
        return expiryDate < today ? 'Expired' : 'Active';
    };

    const getStatusConfig = (status) => {
        const configs = {
            ACTIVE: { color: "green", icon: Tag, label: "Active", description: "Currently available for use" },
            EXPIRED: { color: "red", icon: Tag, label: "Expired", description: "No longer valid" },
        };
        return configs[status.toUpperCase()] || configs.EXPIRED;
    };

    const status = getStatus(selectedPromo.validUntil).toUpperCase();
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;

    const handleArchiveClick = () => {
        handleArchive(selectedPromo._id, selectedPromo.code);
        closeModal();
    };

    return (
        <div className="prdm-overlay" onClick={closeModal}>
            <div className="prdm-content" onClick={(e) => e.stopPropagation()}>
                <div className="prdm-header">
                    <div className="prdm-header-content">
                        <div className="prdm-title-group">
                            <h2 className="prdm-title">Promo Code Details</h2>
                            <div className="prdm-meta">
                                <span className="prdm-ref">ID: #{selectedPromo._id.slice(-8)}</span>
                                <span className="prdm-divider">•</span>
                                <span className="prdm-date">Created: {formatDate(selectedPromo.createdAt)}</span>
                            </div>
                        </div>
                        <div className={`prdm-status-badge prdm-status-${statusConfig.color}`}>
                            <div className="prdm-status-icon"><StatusIcon size={16} /></div>
                            <div className="prdm-status-content">
                                <span className="prdm-status-label">{statusConfig.label}</span>
                                <span className="prdm-status-desc">{statusConfig.description}</span>
                            </div>
                        </div>
                    </div>
                    <button className="prdm-close" onClick={closeModal} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="prdm-body">
                    {/* PROMO CODE CARD */}
                    <div className="prdm-card prdm-card-highlight">
                        <div className="prdm-code-display">
                            <div className="prdm-code-icon">
                                <Tag size={32} />
                            </div>
                            <div className="prdm-code-content">
                                <label className="prdm-code-label">Promo Code</label>
                                <span className="prdm-code-value">{selectedPromo.code}</span>
                            </div>
                        </div>
                    </div>

                    {/* PROMO INFORMATION */}
                    <div className="prdm-card">
                        <div className="prdm-card-header">
                            <h3 className="prdm-card-title">Promo Information</h3>
                        </div>
                        <div className="prdm-grid">
                            <div className="prdm-info-item">
                                <div className="prdm-info-icon"><FileText size={18} /></div>
                                <div className="prdm-info-content">
                                    <label className="prdm-info-label">Category</label>
                                    <span className="prdm-info-value">{selectedPromo.category}</span>
                                </div>
                            </div>
                            <div className="prdm-info-item">
                                <div className="prdm-info-icon">
                                    {selectedPromo.discountType === 'Percentage' ? <Percent size={18} /> : <DollarSign size={18} />}
                                </div>
                                <div className="prdm-info-content">
                                    <label className="prdm-info-label">Discount</label>
                                    <span className="prdm-info-value prdm-val-discount">
                                        {selectedPromo.discountType === 'Percentage' 
                                            ? `${selectedPromo.discountValue}%` 
                                            : `₱${selectedPromo.discountValue.toLocaleString()}`
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* VALIDITY PERIOD */}
                    <div className="prdm-card">
                        <div className="prdm-card-header">
                            <h3 className="prdm-card-title">Validity Period</h3>
                        </div>
                        <div className="prdm-grid">
                            <div className="prdm-info-item">
                                <div className="prdm-info-icon"><Calendar size={18} /></div>
                                <div className="prdm-info-content">
                                    <label className="prdm-info-label">Start Date</label>
                                    <span className="prdm-info-value">
                                        {selectedPromo.startDate ? formatDate(selectedPromo.startDate) : 'Not set'}
                                    </span>
                                </div>
                            </div>
                            <div className="prdm-info-item">
                                <div className="prdm-info-icon"><Calendar size={18} /></div>
                                <div className="prdm-info-content">
                                    <label className="prdm-info-label">End Date</label>
                                    <span className="prdm-info-value">
                                        {selectedPromo.validUntil ? formatDate(selectedPromo.validUntil) : 'Not set'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DESCRIPTION */}
                    {selectedPromo.description && (
                        <div className="prdm-card">
                            <div className="prdm-card-header">
                                <h3 className="prdm-card-title">Description</h3>
                            </div>
                            <div className="prdm-message-box">
                                {selectedPromo.description}
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="prdm-footer">
                    <button className="prdm-btn prdm-btn-ghost" onClick={closeModal}>Close</button>
                    <button 
                        className="prdm-btn prdm-btn-danger prdm-btn-outline"
                        onClick={handleArchiveClick}
                    >
                        Archive Promo
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromoDetailModal;