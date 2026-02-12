import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, Eye, EyeOff, Calendar, Image as ImageIcon, FileText, 
  Archive, CheckCircle, ExternalLink, Edit, HelpCircle 
} from 'lucide-react';
import { useToast } from '../toast/ToastManager'; // Inimport ang Toast Manager
import './PosterDetailModal.css';

// --- CUSTOM CONFIRMATION MODAL COMPONENT ---
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
    const navigate = useNavigate();
    const toast = useToast(); // Hook para sa notifications

    // State para sa Confirmation Modal
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    if (!showModal || !selectedPoster) return null;

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

    const getStatusConfig = (status) => {
        const configs = {
            ACTIVE: { color: "active", label: "ACTIVE", description: "Listing is live" },
            INACTIVE: { color: "inactive", label: "INACTIVE", description: "Hidden from website" },
        };
        return configs[status.toUpperCase()] || configs.INACTIVE;
    };

    const status = (selectedPoster.status || 'INACTIVE').toUpperCase();
    const statusConfig = getStatusConfig(status);

    // Pinalitan ang Logic para gumamit ng Custom Modal
    const handleToggleStatus = () => {
        const newStatusAction = status === 'ACTIVE' ? 'Deactivate' : 'Activate';
        
        askConfirmation(
            `${newStatusAction} Poster`,
            `Are you sure you want to ${newStatusAction.toLowerCase()} "${selectedPoster.title}"?`,
            () => {
                toggleStatus(selectedPoster._id, selectedPoster.status);
                toast.info(`Poster status is being updated...`);
                closeModal();
            },
            "primary"
        );
    };

    const handleArchiveClick = () => {
        askConfirmation(
            "Archive Poster",
            `Are you sure you want to archive "${selectedPoster.title}"? This action cannot be undone easily.`,
            () => {
                handleArchive(selectedPoster._id, selectedPoster.title);
                toast.warning("Poster sent to archives.");
                closeModal();
            },
            "danger"
        );
    };

    const handleEditClick = () => {
        navigate(`/edit-poster/${selectedPoster._id}`);
    };

    return (
        <>
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
                                    src={`https://wanderwaveph.onrender.com/${selectedPoster.imageUrl}`} 
                                    alt={selectedPoster.title}
                                    className="pdm-poster-image"
                                    onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400'; }}
                                />
                                <div className="pdm-image-info">
                                    <div className="pdm-file-pill">
                                        <ImageIcon size={14} className="pdm-icon-green" />
                                        <span>{selectedPoster.imageUrl?.split('/').pop() || 'poster_image.jpg'}</span>
                                    </div>
                                    <button className="pdm-view-link" onClick={() => window.open(`https://wanderwaveph.onrender.com/${selectedPoster.imageUrl}`, '_blank')}>
                                        View Full Image
                                    </button>
                                </div>
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
                        <button className="pdm-btn-edit" onClick={handleEditClick}>
                            <Edit size={16} />
                            Edit
                        </button>

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

            {/* RENDER THE CUSTOM MODAL */}
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

export default PosterDetailModal;