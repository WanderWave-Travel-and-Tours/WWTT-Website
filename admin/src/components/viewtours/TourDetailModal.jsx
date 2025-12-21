import React from 'react';
import { X, MapPin, Clock, Tag, CreditCard, Edit, Trash2, CheckCircle } from 'lucide-react';

const TourDetailModal = ({ tour, close, onArchive, navigate }) => {
    if (!tour) return null;

    return (
        <div className="tdm-overlay" onClick={close}>
            <div className="tdm-content" onClick={e => e.stopPropagation()}>
                <div className="tdm-header">
                    <div className="tdm-header-left">
                        <h2 className="tdm-main-title">Tour Details</h2>
                        <div className="tdm-ref-tag">REF: #{tour._id.slice(-8).toUpperCase()}</div>
                    </div>
                    <div className="tdm-header-right">
                        <div className="tdm-status-pill active">
                            <CheckCircle size={16} /><span className="tdm-status-label">ACTIVE</span>
                        </div>
                        <button className="tdm-close-x" onClick={close}><X size={18}/></button>
                    </div>
                </div>
                <div className="tdm-body">
                    <div className="tdm-section-card dashed-border">
                        <img src={`https://wanderwaveph-backend.onrender.com0/uploads/${tour.image}`} className="tdm-customer-image" alt="" />
                    </div>
                    <div className="tdm-section-card">
                        <h3 className="tdm-section-title">PACKAGE INFORMATION</h3>
                        <div className="tdm-info-grid">
                            <div className="tdm-info-box">
                                <div className="tdm-box-icon blue"><MapPin size={18}/></div>
                                <div className="tdm-box-content"><label>DESTINATION</label><p>{tour.destination.toUpperCase()}</p></div>
                            </div>
                            <div className="tdm-info-box">
                                <div className="tdm-box-icon yellow"><Clock size={18}/></div>
                                <div className="tdm-box-content"><label>DURATION</label><p>{tour.duration}</p></div>
                            </div>
                            <div className="tdm-info-box">
                                <div className="tdm-box-icon green"><Tag size={18}/></div>
                                <div className="tdm-box-content"><label>CATEGORY</label><p>{tour.category}</p></div>
                            </div>
                            <div className="tdm-info-box">
                                <div className="tdm-box-icon orange"><CreditCard size={18}/></div>
                                <div className="tdm-box-content"><label>PRICE</label><p>₱{tour.price?.toLocaleString()}</p></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tdm-footer">
                    <button className="tdm-btn-close" onClick={close}>Close</button>
                    <button className="tdm-btn-edit" onClick={() => navigate(`/edit-tour/${tour._id}`)}>
                        <Edit size={16}/> Edit Tour
                    </button>
                    <button className="tdm-btn-danger" onClick={() => {onArchive(tour._id); close();}}>
                        <Trash2 size={16}/> Archive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TourDetailModal;