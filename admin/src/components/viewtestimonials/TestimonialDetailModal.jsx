import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, User, Calendar, MessageSquare, Star, Edit, Trash2, CheckCircle, ImageIcon } from 'lucide-react';
import './TestimonialDetailModal.css';

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

    if (!showModal || !selectedTestimonial) return null;

    const closeModal = () => setShowModal(false);

    const handleArchiveClick = () => {
        handleArchive(selectedTestimonial._id, selectedTestimonial.customerName);
        closeModal();
    };

    // Edit Navigation
    const handleEditClick = () => {
        navigate(`/edit-testimonial/${selectedTestimonial._id}`);
    };

    const isActive = selectedTestimonial.isArchive === "No";

    return (
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
                                <button className="tdm-view-link" onClick={() => window.open(getImageUrl(selectedTestimonial.customerImage), '_blank')}>
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
                                    <p>5.0 / 5 Stars</p>
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
    );
};

export default TestimonialDetailModal;