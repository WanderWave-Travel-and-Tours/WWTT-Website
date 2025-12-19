import React from 'react';
import { X, Eye, EyeOff, Calendar, Image as ImageIcon, FileText, Archive, CheckCircle, ExternalLink } from 'lucide-react';
import './PosterDetailModal.css';

const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

const PosterDetailModal = ({ 
    showModal, 
    selectedPoster, 
    setShowModal,
    toggleStatus,
    handleArchive
}) => {
    if (!showModal || !selectedPoster) return null;

    const closeModal = () => setShowModal(false);

    const getStatusConfig = (status) => {
        const configs = {
            ACTIVE: { color: "active", label: "ACTIVE", description: "Listing is live" },
            INACTIVE: { color: "inactive", label: "INACTIVE", description: "Hidden from website" },
        };
        return configs[status.toUpperCase()] || configs.INACTIVE;
    };

    const status = (selectedPoster.status || 'INACTIVE').toUpperCase();
    const statusConfig = getStatusConfig(status);

    const handleToggleStatus = () => {
        toggleStatus(selectedPoster._id, selectedPoster.status);
        closeModal();
    };

    const handleArchiveClick = () => {
        handleArchive(selectedPoster._id, selectedPoster.title);
        closeModal();
    };

    return (
        <div className="pdm-overlay" onClick={closeModal}>
            <div className="pdm-content" onClick={(e) => e.stopPropagation()}>
                
                {/* HEADER SECTION */}
                <div className="pdm-header">
                    <div className="pdm-header-left">
                        <h2 className="pdm-main-title">Poster Details</h2>
                        <div className="pdm-ref-tag">
                            REF: #{selectedPoster._id.slice(-8).toUpperCase()} <span className="pdm-dot">•</span> {formatDate(selectedPoster.createdAt)}
                        </div>
                    </div>
                    
                    <div className="pdm-header-right">
                        <div className={`pdm-status-pill ${statusConfig.color}`}>
                            <CheckCircle size={16} />
                            <div className="pdm-status-text">
                                <span className="pdm-status-label">{statusConfig.label}</span>
                                <span className="pdm-status-subtext">{statusConfig.description}</span>
                            </div>
                        </div>
                        <button className="pdm-close-x" onClick={closeModal}><X size={18} /></button>
                    </div>
                </div>

                <div className="pdm-body">
                    
                    {/* MEDIA SECTION */}
                    <div className="pdm-section-card dashed-border">
                        <div className="pdm-processing-bar">
                            <CheckCircle size={18} className="pdm-icon-green" />
                            <span>Poster Media & Schedule</span>
                        </div>
                        
                        <div className="pdm-image-box">
                            <img 
                                src={`http://localhost:5000/${selectedPoster.imageUrl}`} 
                                alt={selectedPoster.title}
                                className="pdm-poster-image"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400'; }}
                            />
                            <div className="pdm-image-info">
                                <div className="pdm-file-pill">
                                    <ImageIcon size={14} className="pdm-icon-green" />
                                    <span>{selectedPoster.imageUrl?.split('/').pop() || 'poster_image.jpg'}</span>
                                </div>
                                <button className="pdm-view-link" onClick={() => window.open(`http://localhost:5000/${selectedPoster.imageUrl}`, '_blank')}>
                                    View Full Image
                                </button>
                            </div>
                        </div>

                        <div className="pdm-url-pill">
                            <ExternalLink size={14} />
                            <span>{selectedPoster.imageUrl}</span>
                        </div>
                    </div>

                    {/* INFORMATION GRID */}
                    <div className="pdm-section-card">
                        <h3 className="pdm-section-title">POSTER INFORMATION</h3>
                        <div className="pdm-info-grid">
                            <div className="pdm-info-box">
                                <div className="pdm-box-icon blue"><FileText size={18} /></div>
                                <div className="pdm-box-content">
                                    <label>TITLE</label>
                                    <p>{selectedPoster.title}</p>
                                </div>
                            </div>
                            <div className="pdm-info-box">
                                <div className="pdm-box-icon yellow"><CheckCircle size={18} /></div>
                                <div className="pdm-box-content">
                                    <label>STATUS</label>
                                    <p>{selectedPoster.status}</p>
                                </div>
                            </div>
                            <div className="pdm-info-box">
                                <div className="pdm-box-icon green"><Calendar size={18} /></div>
                                <div className="pdm-box-content">
                                    <label>START DATE</label>
                                    <p>{formatDate(selectedPoster.startDate)}</p>
                                </div>
                            </div>
                            <div className="pdm-info-box">
                                <div className="pdm-box-icon orange"><Calendar size={18} /></div>
                                <div className="pdm-box-content">
                                    <label>END DATE</label>
                                    <p>{formatDate(selectedPoster.endDate)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* DESCRIPTION SECTION */}
                    {selectedPoster.description && (
                        <div className="pdm-section-card">
                            <h3 className="pdm-section-title">POSTER DESCRIPTION</h3>
                            <div className="pdm-message-area">
                                <p>{selectedPoster.description}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* FOOTER SECTION */}
                <div className="pdm-footer">
                    <button className="pdm-btn-close" onClick={closeModal}>Close</button>
                    <button 
                        className={`pdm-btn-action ${status === 'ACTIVE' ? 'deactivate' : 'activate'}`}
                        onClick={handleToggleStatus}
                    >
                        {status === 'ACTIVE' ? <EyeOff size={16} /> : <Eye size={16} />}
                        {status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="pdm-btn-danger" onClick={handleArchiveClick}>
                        <Archive size={16} />
                        Archive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PosterDetailModal;