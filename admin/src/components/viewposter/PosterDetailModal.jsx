import React from 'react';
import { X, Eye, EyeOff, Calendar, Image, FileText, Archive } from 'lucide-react';
import './PosterDetailModal.css';

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
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
            ACTIVE: { color: "green", icon: Eye, label: "Active", description: "Currently displayed on website" },
            INACTIVE: { color: "gray", icon: EyeOff, label: "Inactive", description: "Hidden from website" },
        };
        return configs[status.toUpperCase()] || configs.INACTIVE;
    };

    const status = (selectedPoster.status || 'INACTIVE').toUpperCase();
    const statusConfig = getStatusConfig(status);
    const StatusIcon = statusConfig.icon;

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
                <div className="pdm-header">
                    <div className="pdm-header-content">
                        <div className="pdm-title-group">
                            <h2 className="pdm-title">Poster Details</h2>
                            <div className="pdm-meta">
                                <span className="pdm-ref">ID: #{selectedPoster._id.slice(-8)}</span>
                                <span className="pdm-divider">•</span>
                                <span className="pdm-date">Created: {formatDate(selectedPoster.createdAt)}</span>
                            </div>
                        </div>
                        <div className={`pdm-status-badge pdm-status-${statusConfig.color}`}>
                            <div className="pdm-status-icon"><StatusIcon size={16} /></div>
                            <div className="pdm-status-content">
                                <span className="pdm-status-label">{statusConfig.label}</span>
                                <span className="pdm-status-desc">{statusConfig.description}</span>
                            </div>
                        </div>
                    </div>
                    <button className="pdm-close" onClick={closeModal} aria-label="Close modal">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="pdm-body">
                    <div className="pdm-card">
                        <div className="pdm-card-header">
                            <h3 className="pdm-card-title">Poster Preview</h3>
                        </div>
                        <div className="pdm-image-container">
                            <img 
                                src={`http://localhost:5000/${selectedPoster.imageUrl}`} 
                                alt={selectedPoster.title}
                                className="pdm-poster-image"
                            />
                        </div>
                    </div>

                    <div className="pdm-card">
                        <div className="pdm-card-header">
                            <h3 className="pdm-card-title">Poster Information</h3>
                        </div>
                        <div className="pdm-grid">
                            <div className="pdm-info-item">
                                <div className="pdm-info-icon"><FileText size={18} /></div>
                                <div className="pdm-info-content">
                                    <label className="pdm-info-label">Title</label>
                                    <span className="pdm-info-value">{selectedPoster.title}</span>
                                </div>
                            </div>
                            <div className="pdm-info-item">
                                <div className="pdm-info-icon"><Image size={18} /></div>
                                <div className="pdm-info-content">
                                    <label className="pdm-info-label">Image URL</label>
                                    <span className="pdm-info-value pdm-val-url">{selectedPoster.imageUrl}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pdm-card">
                        <div className="pdm-card-header">
                            <h3 className="pdm-card-title">Display Schedule</h3>
                        </div>
                        <div className="pdm-grid">
                            <div className="pdm-info-item">
                                <div className="pdm-info-icon"><Calendar size={18} /></div>
                                <div className="pdm-info-content">
                                    <label className="pdm-info-label">Start Date</label>
                                    <span className="pdm-info-value">
                                        {selectedPoster.startDate ? formatDate(selectedPoster.startDate) : 'Not set'}
                                    </span>
                                </div>
                            </div>
                            <div className="pdm-info-item">
                                <div className="pdm-info-icon"><Calendar size={18} /></div>
                                <div className="pdm-info-content">
                                    <label className="pdm-info-label">End Date</label>
                                    <span className="pdm-info-value">
                                        {selectedPoster.endDate ? formatDate(selectedPoster.endDate) : 'Not set'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {selectedPoster.description && (
                        <div className="pdm-card">
                            <div className="pdm-card-header">
                                <h3 className="pdm-card-title">Description</h3>
                            </div>
                            <div className="pdm-message-box">
                                {selectedPoster.description}
                            </div>
                        </div>
                    )}
                </div>

                <div className="pdm-footer">
                    <button className="pdm-btn pdm-btn-ghost" onClick={closeModal}>Close</button>
                    <button 
                        className={`pdm-btn ${status === 'ACTIVE' ? 'pdm-btn-warning' : 'pdm-btn-success'}`}
                        onClick={handleToggleStatus}
                    >
                        {status === 'ACTIVE' ? (
                            <><EyeOff size={16} /> Deactivate</>
                        ) : (
                            <><Eye size={16} /> Activate</>
                        )}
                    </button>
                    <button 
                        className="pdm-btn pdm-btn-danger pdm-btn-outline"
                        onClick={handleArchiveClick}
                    >
                        <Archive size={16} /> Archive Poster
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PosterDetailModal;