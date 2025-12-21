import React from 'react';
import { X, MapPin, Clock, Tag, CreditCard, Edit, Trash2, CheckCircle, ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PackageDetailModal = ({ showModal, selectedPackage, setShowModal, handleArchive }) => {
    const navigate = useNavigate();
    if (!showModal || !selectedPackage) return null;

    return (
        <div className="tdm-overlay" onClick={() => setShowModal(false)}>
            <div className="tdm-content" onClick={(e) => e.stopPropagation()}>
                <div className="tdm-header">
                    <div className="tdm-header-left">
                        <h2 className="tdm-main-title">Package Details</h2>
                        <div className="tdm-ref-tag">REF: #{selectedPackage._id.slice(-8).toUpperCase()}</div>
                    </div>
                    <div className="tdm-header-right">
                        <div className="tdm-status-pill active">
                            <CheckCircle size={16} />
                            <div className="tdm-status-text">
                                <span className="tdm-status-label">ACTIVE</span>
                                <span className="tdm-status-subtext">Visible to customers</span>
                            </div>
                        </div>
                        <button className="tdm-close-x" onClick={() => setShowModal(false)}><X size={18} /></button>
                    </div>
                </div>

                <div className="tdm-body">
                    <div className="tdm-section-card dashed-border">
                        <div className="tdm-image-box">
                            <img src={`https://wanderwaveph-backend.onrender.com/uploads/${selectedPackage.image}`} className="tdm-customer-image" alt="" />
                        </div>
                    </div>

                    <div className="tdm-section-card">
                        <h3 className="tdm-section-title">PACKAGE INFORMATION</h3>
                        <div className="tdm-info-grid">
                            <div className="tdm-info-box">
                                <div className="tdm-box-icon blue"><MapPin size={18} /></div>
                                <div className="tdm-box-content">
                                    <label>DESTINATION</label>
                                    <p>{selectedPackage.destination}</p>
                                </div>
                            </div>
                            <div className="tdm-info-box">
                                <div className="tdm-box-icon yellow"><Clock size={18} /></div>
                                <div className="tdm-box-content">
                                    <label>DURATION</label>
                                    <p>{selectedPackage.duration}</p>
                                </div>
                            </div>
                            <div className="tdm-info-box">
                                <div className="tdm-box-icon green"><Tag size={18} /></div>
                                <div className="tdm-box-content">
                                    <label>CATEGORY</label>
                                    <p>{selectedPackage.category}</p>
                                </div>
                            </div>
                            <div className="tdm-info-box">
                                <div className="tdm-box-icon orange"><CreditCard size={18} /></div>
                                <div className="tdm-box-content">
                                    <label>PRICE</label>
                                    <p>₱{selectedPackage.price.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tdm-footer">
                    <button className="tdm-btn-close" onClick={() => setShowModal(false)}>Close</button>
                    <button className="tdm-btn-edit" onClick={() => navigate('/edit-package', { state: { packageId: selectedPackage._id } })}>
                        <Edit size={16} /> Edit Package
                    </button>
                    <button className="tdm-btn-danger" onClick={() => { handleArchive(selectedPackage._id); setShowModal(false); }}>
                        <Trash2 size={16} /> Archive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PackageDetailModal;