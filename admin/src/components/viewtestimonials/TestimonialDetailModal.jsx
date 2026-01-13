import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    X, User, Calendar, MessageSquare, Star, Edit, Trash2, 
    CheckCircle, ImageIcon, HelpCircle 
} from 'lucide-react';
import { useToast } from '../toast/ToastManager'; 
import './TestimonialDetailModal.css';

// --- CUSTOM CONFIRM MODAL COMPONENT (Based on EditVisa.jsx) ---
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

// ✅ HELPER: Format Rating (e.g., 4 => "4.0", 4.5 => "4.5")
const formatRating = (rating) => {
    if (rating === undefined || rating === null) return '5.0'; // Default
    return Number(rating).toFixed(1);
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

const TestimonialDetailModal = ({ 
    showModal, 
    selectedTestimonial, 
    setShowModal,
    handleArchive,
    getImageUrl
}) => {
    const navigate = useNavigate();
    const toast = useToast(); 

    // State para sa Confirmation Modal
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    if (!showModal || !selectedTestimonial) return null;

    const closeModal = () => setShowModal(false);

    // Helper function para buksan ang confirmation
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
            "Archive Testimonial",
            `Are you sure you want to archive the testimonial of ${selectedTestimonial.customerName}?`,
            async () => {
                try {
                    await handleArchive(selectedTestimonial._id, selectedTestimonial.customerName);
                    toast.success("Testimonial archived successfully!");
                    closeModal();
                } catch (error) {
                    toast.error("Failed to archive testimonial.");
                }
            },
            "danger"
        );
    };

    // Edit Navigation
    const handleEditClick = () => {
        toast.info("Redirecting to edit page...");
        navigate(`/edit-testimonial/${selectedTestimonial._id}`);
    };

    const isActive = selectedTestimonial.isArchive === "No";

    return (
        <>
            <div className="tdm-overlay" onClick={closeModal}>
                <div className="tdm-content" onClick={(e) => e.stopPropagation()}>
                    
                    {/* HEADER SECTION */}
                    <div className="tdm-header">
                        <div className="tdm-header-left">
                            <h2 className="tdm-main-title">Testimonial Details</h2>
                            <div className="tdm-ref-tag">
                                REF: #{selectedTestimonial._id.slice(-8).toUpperCase()} <span className="tdm-dot">•</span> {formatDate(selectedTestimonial.createdAt)}
                            </div>
                        </div>
                        
                        <div className="tdm-header-right">
                            <div className={`tdm-status-pill ${isActive ? 'active' : 'inactive'}`}>
                                <CheckCircle size={16} />
                                <div className="tdm-status-text">
                                    <span className="tdm-status-label">{isActive ? 'ACTIVE' : 'ARCHIVED'}</span>
                                    <span className="tdm-status-subtext">{isActive ? 'Live on website' : 'Not visible'}</span>
                                </div>
                            </div>
                            <button className="tdm-close-x" onClick={closeModal}><X size={18} /></button>
                        </div>
                    </div>

                    <div className="tdm-body">
                        
                        {/* CUSTOMER SECTION */}
                        <div className="tdm-section-card dashed-border">
                            <div className="tdm-processing-bar">
                                <CheckCircle size={18} className="tdm-icon-green" />
                                <span>Customer Profile & Image</span>
                            </div>
                            
                            <div className="tdm-image-box">
                                <img 
                                    src={getImageUrl(selectedTestimonial.customerImage)} 
                                    alt={selectedTestimonial.customerName}
                                    className="tdm-customer-image"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/400x400'; }}
                                />
                                <div className="tdm-image-info">
                                    <div className="tdm-file-pill">
                                        <ImageIcon size={14} className="tdm-icon-green" />
                                        <span>{selectedTestimonial.customerImage ? selectedTestimonial.customerImage.split(/[/\\]/).pop() : 'customer.jpg'}</span>
                                    </div>
                                    <button 
                                        className="tdm-view-link" 
                                        onClick={() => {
                                            toast.info("Opening image preview...");
                                            window.open(getImageUrl(selectedTestimonial.customerImage), '_blank');
                                        }}
                                    >
                                        Preview Image
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* TESTIMONIAL INFORMATION GRID */}
                        <div className="tdm-section-card">
                            <h3 className="tdm-section-title">TESTIMONIAL INFORMATION</h3>
                            <div className="tdm-info-grid">
                                <div className="tdm-info-box">
                                    <div className="tdm-box-icon blue"><User size={18} /></div>
                                    <div className="tdm-box-content">
                                        <label>CUSTOMER NAME</label>
                                        <p>{selectedTestimonial.customerName}</p>
                                    </div>
                                </div>
                                <div className="tdm-info-box">
                                    <div className="tdm-box-icon yellow"><Star size={18} /></div>
                                    <div className="tdm-box-content">
                                        <label>RATING</label>
                                        {/* ✅ DYNAMIC RATING DISPLAY */}
                                        <p>{formatRating(selectedTestimonial.rating)} / 5 Stars</p>
                                    </div>
                                </div>
                                <div className="tdm-info-box">
                                    <div className="tdm-box-icon green"><MessageSquare size={18} /></div>
                                    <div className="tdm-box-content">
                                        <label>SOURCE</label>
                                        <p>{selectedTestimonial.source}</p>
                                    </div>
                                </div>
                                <div className="tdm-info-box">
                                    <div className="tdm-box-icon orange"><Calendar size={18} /></div>
                                    <div className="tdm-box-content">
                                        <label>DATE SUBMITTED</label>
                                        <p>{formatDate(selectedTestimonial.createdAt)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* FEEDBACK SECTION */}
                        <div className="tdm-section-card">
                            <h3 className="tdm-section-title">CUSTOMER FEEDBACK</h3>
                            <div className="tdm-message-area">
                                <p>"{selectedTestimonial.feedback}"</p>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER SECTION */}
                    <div className="tdm-footer">
                        <button className="tdm-btn-edit" onClick={handleEditClick}>
                            <Edit size={16} />
                            Edit
                        </button>
                        
                        <button className="tdm-btn-danger" onClick={handleArchiveClick}>
                            <Trash2 size={16} />
                            Archive
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal Component */}
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

export default TestimonialDetailModal;