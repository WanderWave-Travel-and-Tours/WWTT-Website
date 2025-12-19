import React, { useState } from 'react';
import { X, Image as ImageIcon, ExternalLink, Calendar, FileText, CheckCircle, Copy, Check, Archive } from 'lucide-react';
import './ImageDetailModal.css';

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
    const [copied, setCopied] = useState(false);

    if (!showModal || !selectedImage) return null;

    const closeModal = () => setShowModal(false);

    const handleCopyUrl = () => {
        navigator.clipboard.writeText(selectedImage.imageUrl).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        }).catch(err => {
            console.error('Could not copy text:', err);
            alert('Failed to copy URL');
        });
    };

    const handleArchiveClick = () => {
        handleArchive(selectedImage._id, selectedImage.imageName);
        closeModal();
    };

    return (
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
    );
};

export default ImageDetailModal;