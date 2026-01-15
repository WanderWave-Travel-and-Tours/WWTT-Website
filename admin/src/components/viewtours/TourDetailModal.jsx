import React, { useState } from 'react';
import { 
  X, MapPin, Clock, Tag, CreditCard, Edit, Trash2, 
  CheckCircle, HelpCircle 
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';

// --- CUSTOM CONFIRMATION MODAL COMPONENT (Based on EditVisa.jsx pattern) ---
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="arc-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="arc-confirm-modal" style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
              backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
              color: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const TourDetailModal = ({ tour, close, onArchive, navigate }) => {
    const toast = useToast();
    
    // State para sa Confirmation Modal
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    if (!tour) return null;

    // Helper function para sa pag-trigger ng confirmation (katulad ng sa EditVisa)
    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };

    const handleArchiveClick = () => {
        askConfirmation(
            "Archive Tour",
            `Are you sure you want to archive "${tour.destination}"? This will hide the tour from the public listing.`,
            async () => {
                try {
                    await onArchive(tour._id);
                    toast.success("Tour archived successfully");
                    close();
                } catch (error) {
                    toast.error("Failed to archive tour");
                }
            },
            "danger"
        );
    };

    const handleEditClick = () => {
        navigate(`/edit-tour/${tour._id}`);
        toast.info("Opening editor...");
    };

    return (
        <>
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
                            <img 
                                src={tour.image} 
                                className="tdm-customer-image" 
                                alt={tour.destination} 
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x200?text=No+Image+Available'; }}
                            />
                        </div>
                        <div className="tdm-section-card">
                            <h3 className="tdm-section-title">TOUR INFORMATION</h3>
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
                        <button className="tdm-btn-edit" onClick={handleEditClick}>
                            <Edit size={16}/> Edit
                        </button>
                        <button className="tdm-btn-danger" onClick={handleArchiveClick}>
                            <Trash2 size={16}/> Archive
                        </button>
                    </div>
                </div>
            </div>

            {/* Render confirmation modal */}
            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default TourDetailModal;