import React, { useState } from 'react';
import { 
  X, Image as ImageIcon, ExternalLink, Calendar, FileText, 
  CheckCircle, Copy, Check, Archive, HelpCircle 
} from 'lucide-react';
import { useToast } from "../toast/ToastManager"; // Inimport ang Toast Manager
import './ImageDetailModal.css';

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

const ImageDetailModal = ({ 
    showModal, 
    selectedImage, 
    setShowModal,
    handleArchive
}) => {
    const toast = useToast(); // Initialize toast
    const [copied, setCopied] = useState(false);
    
    // State para sa Confirmation Modal
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    if (!showModal || !selectedImage) return null;

    const closeModal = () => setShowModal(false);

    // Helper function para sa confirmation
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

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(selectedImage.imageUrl).then(() => {
            setCopied(true);
            toast.success("Image URL copied to clipboard!"); // Toast notification
            setTimeout(() => setCopied(false), 1500);
        }).catch(err => {
            console.error('Could not copy text:', err);
            toast.error("Failed to copy URL");
        });
    };

    const handleArchiveClick = () => {
        // Imbes na window.confirm, gagamit tayo ng Custom Confirmation Modal
        askConfirmation(
            "Archive Image",
            `Are you sure you want to archive "${selectedImage.imageName || 'this image'}"? This will hide it from the gallery.`,
            () => {
                handleArchive(selectedImage._id, selectedImage.imageName);
                toast.info("Image archived successfully"); // Toast notification
                closeModal();
            },
            "danger"
        );
    };

    return (
        <>
            <div className="idm-overlay" onClick={closeModal}>
                <div className="idm-content" onClick={(e) => e.stopPropagation()}>
                    
                    {/* HEADER SECTION */}
                    <div className="idm-header">
                        <div className="idm-header-left">
                            <h2 className="idm-main-title">Image Details</h2>
                            <div className="idm-ref-tag">
                                REF: #{selectedImage._id.slice(-8).toUpperCase()} <span className="idm-dot">•</span> {formatDate(selectedImage.createdAt)}
                            </div>
                        </div>
                        
                        <div className="idm-header-right">
                            <div className="idm-status-badge">
                                <CheckCircle size={14} className="idm-icon-blue" />
                                <div className="idm-status-text">
                                    <span className="idm-status-label">UPLOADED</span>
                                    <span className="idm-status-subtext">Image is live</span>
                                </div>
                            </div>
                            <button className="idm-close-x" onClick={closeModal}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="idm-body">
                        
                        {/* MEDIA SECTION */}
                        <div className="idm-section-card">
                            <div className="idm-section-header">
                                <CheckCircle size={18} className="idm-icon-blue" />
                                <span>Image Preview & Information</span>
                            </div>
                            
                            <div className="idm-image-box">
                                <img 
                                    src={selectedImage.imageUrl} 
                                    alt={selectedImage.imageName}
                                    className="idm-image-display"
                                    onError={(e) => { 
                                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%23ddd" width="800" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                                    }}
                                />
                                <div className="idm-image-info">
                                    <div className="idm-file-pill">
                                        <ImageIcon size={13} className="idm-icon-blue" />
                                        <span>{selectedImage.imageName || 'image_file.jpg'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="idm-url-pill">
                                <ExternalLink size={12} />
                                <span>{selectedImage.imageUrl}</span>
                            </div>
                        </div>

                        {/* INFORMATION GRID */}
                        <div>
                            <h3 className="idm-section-title">Image Information</h3>
                            <div className="idm-info-grid">
                                <div className="idm-info-box">
                                    <div className="idm-box-icon blue">
                                        <FileText size={18} />
                                    </div>
                                    <div className="idm-box-content">
                                        <label>File Name</label>
                                        <p>{selectedImage.imageName || 'Untitled'}</p>
                                    </div>
                                </div>
                                <div className="idm-info-box">
                                    <div className="idm-box-icon purple">
                                        <ImageIcon size={18} />
                                    </div>
                                    <div className="idm-box-content">
                                        <label>File Type</label>
                                        <p>{selectedImage.imageName?.split('.').pop()?.toUpperCase() || 'IMAGE'}</p>
                                    </div>
                                </div>
                                <div className="idm-info-box">
                                    <div className="idm-box-icon green">
                                        <Calendar size={18} />
                                    </div>
                                    <div className="idm-box-content">
                                        <label>Upload Date</label>
                                        <p>{formatDate(selectedImage.createdAt)}</p>
                                    </div>
                                </div>
                                <div className="idm-info-box">
                                    <div className="idm-box-icon orange">
                                        <CheckCircle size={18} />
                                    </div>
                                    <div className="idm-box-content">
                                        <label>Status</label>
                                        <p>Uploaded</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER SECTION */}
                    <div className="idm-footer">
                        <button className="idm-btn-close" onClick={closeModal}>
                            Close
                        </button>
                        <button 
                            className="idm-btn-action copy"
                            onClick={handleCopyUrl}
                        >
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                            {copied ? 'Copied!' : 'Copy URL'}
                        </button>
                        <button className="idm-btn-danger" onClick={handleArchiveClick}>
                            <Archive size={16} />
                            Archive
                        </button>
                    </div>
                </div>
            </div>

            {/* RENDER CUSTOM CONFIRM MODAL */}
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

export default ImageDetailModal;