import React from 'react';
import { X, Calendar, Tag, Percent, DollarSign, FileText, CheckCircle, AlertCircle, Trash2, Edit, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    const navigate = useNavigate();

    if (!showModal || !selectedPromo) return null;

    // ✅ Resolves price from either flat field or nested pricing sub-document
    const localPrice  = selectedPromo.pricing?.local         ?? selectedPromo.localPrice         ?? null;
    const intlPrice   = selectedPromo.pricing?.international ?? selectedPromo.internationalPrice ?? null;

    const closeModal = () => setShowModal(false);

    const getStatus = (validUntil) => {
        const today = new Date();
        const expiryDate = new Date(validUntil);
        return expiryDate < today ? 'Expired' : 'Active';
    };

    const getStatusConfig = (status) => {
        const configs = {
            ACTIVE: { color: "active", label: "ACTIVE", description: "Currently available" },
            EXPIRED: { color: "inactive", label: "EXPIRED", description: "No longer valid" },
        };
        return configs[status.toUpperCase()] || configs.EXPIRED;
    };

    const status = getStatus(selectedPromo.validUntil).toUpperCase();
    const statusConfig = getStatusConfig(status);

    const handleArchiveClick = () => {
        handleArchive(selectedPromo._id, selectedPromo.code);
        closeModal();
    };

    // Redirect to Edit Page
    const handleEditClick = () => {
        navigate(`/edit-promo/${selectedPromo._id}`);
    };

    // Construct Image URL (FIXED: Handles both full URLs and local paths)
    const imageUrl = selectedPromo.image 
        ? (selectedPromo.image.startsWith('http') 
            ? selectedPromo.image 
            : `/uploads/${selectedPromo.image}`)
        : null;

    return (
        <div className="prdm-overlay" onClick={closeModal}>
            <div className="prdm-content" onClick={(e) => e.stopPropagation()}>
                
                {/* HEADER SECTION */}
                <div className="prdm-header">
                    <div className="prdm-header-left">
                        <h2 className="prdm-main-title">Promo Code Details</h2>
                        <div className="prdm-ref-tag">
                            REF: #{selectedPromo._id.slice(-8).toUpperCase()} <span className="prdm-dot">•</span> {formatDate(selectedPromo.createdAt)}
                        </div>
                    </div>
                    
                    <div className="prdm-header-right">
                        <div className={`prdm-status-pill ${statusConfig.color}`}>
                            {statusConfig.color === 'active' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            <div className="prdm-status-text">
                                <span className="prdm-status-label">{statusConfig.label}</span>
                                <span className="prdm-status-subtext">{statusConfig.description}</span>
                            </div>
                        </div>
                        <button className="prdm-close-x" onClick={closeModal}><X size={18} /></button>
                    </div>
                </div>

                <div className="prdm-body">
                    
                    {/* NEW: PROMO IMAGE BANNER */}
                    {imageUrl && (
                        <div className="prdm-image-section">
                            <div className="prdm-image-container">
                                <img src={imageUrl} alt="Promo Asset" className="prdm-promo-img" />
                                <div className="prdm-image-badge">
                                    <ImageIcon size={14} /> PROMO ASSET
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HIGHLIGHT: PROMO CODE DISPLAY */}
                    <div className="prdm-section-card dashed-border">
                        <div className="prdm-processing-bar">
                            <Tag size={18} className="prdm-icon-gold" />
                            <span>Voucher Asset & Redemption Code</span>
                        </div>
                        
                        <div className="prdm-code-hero">
                            <div className="prdm-hero-icon">
                                <Tag size={32} />
                            </div>
                            <div className="prdm-hero-content">
                                <label>REDEEMABLE CODE</label>
                                <span className="prdm-hero-value">{selectedPromo.code}</span>
                            </div>
                            <div className="prdm-hero-badge">OFFICIAL VOUCHER</div>
                        </div>
                    </div>

                    {/* PROMO INFORMATION GRID */}
                    <div className="prdm-section-card">
                        <h3 className="prdm-section-title">VOUCHER INFORMATION</h3>
                        <div className="prdm-info-grid">
                            <div className="prdm-info-box">
                                <div className="prdm-box-icon blue"><FileText size={18} /></div>
                                <div className="prdm-box-content">
                                    <label>CATEGORY</label>
                                    <p>{selectedPromo.category}</p>
                                </div>
                            </div>
                            <div className="prdm-info-box">
                                <div className="prdm-box-icon green">
                                    <span className="prdm-peso-icon">₱</span>
                                </div>
                                <div className="prdm-box-content">
                                    <label>PRICE</label>
                                    {Number(localPrice) > 0 && (
                                        <p className="prdm-amount-text">
                                            ₱{Number(localPrice).toLocaleString()}
                                            <span style={{fontSize:'11px', fontWeight:700, color:'#94a3b8', marginLeft:'6px', background:'#f1f5f9', borderRadius:'4px', padding:'1px 5px'}}>LOCAL</span>
                                        </p>
                                    )}
                                    {Number(intlPrice) > 0 && (
                                        <p className="prdm-amount-text">
                                            ₱{Number(intlPrice).toLocaleString()}
                                            <span style={{fontSize:'11px', fontWeight:700, color:'#94a3b8', marginLeft:'6px', background:'#f1f5f9', borderRadius:'4px', padding:'1px 5px'}}>INTL.</span>
                                        </p>
                                    )}
                                    {!(Number(localPrice) > 0) && !(Number(intlPrice) > 0) && (
                                        <p className="prdm-amount-text">N/A</p>
                                    )}
                                </div>
                            </div>
                            <div className="prdm-info-box">
                                <div className="prdm-box-icon yellow"><Calendar size={18} /></div>
                                <div className="prdm-box-content">
                                    <label>START DATE</label>
                                    <p>{selectedPromo.startDate ? formatDate(selectedPromo.startDate) : 'Not set'}</p>
                                </div>
                            </div>
                            <div className="prdm-info-box">
                                <div className="prdm-box-icon orange"><Calendar size={18} /></div>
                                <div className="prdm-box-content">
                                    <label>EXPIRATION DATE</label>
                                    <p>{selectedPromo.validUntil ? formatDate(selectedPromo.validUntil) : 'Not set'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DESCRIPTION SECTION */}
                    {selectedPromo.description && (
                        <div className="prdm-section-card">
                            <h3 className="prdm-section-title">VOUCHER DESCRIPTION</h3>
                            <div className="prdm-message-area">
                                <p>{selectedPromo.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER ACTIONS */}
                <div className="prdm-footer">
                    <button className="prdm-btn-edit" onClick={handleEditClick}>
                        <Edit size={16} />
                        Edit
                    </button>

                    <button className="prdm-btn-danger" onClick={handleArchiveClick}>
                        <Trash2 size={16} />
                        Archive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromoDetailModal;