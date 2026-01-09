import React, { useState, useEffect } from 'react';
import { Upload, Trash2, ImageIcon, Info, Loader2, HelpCircle } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useToast } from '../toast/ToastManager'; // Ginamit ang useToast
import './addimage.css';

// Reusable Confirmation Modal base sa EditVisa.jsx pattern
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

const AddImage = () => {
    const toast = useToast(); // Initialize Toast context
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirmation Modal State base sa EditVisa
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Function para mag-trigger ng modal
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

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload a valid image file (JPG, PNG, WebP).', 'Invalid File'); // Pinalitan ang alert
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        if (imagePreview) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(null);
        setImagePreview(null);
    };

    // Pinalitan ang window.confirm para sa pag-cancel/remove
    const handleCancelClick = () => {
        if (!imageFile) return;
        askConfirmation(
            "Discard Selection",
            "Are you sure you want to remove the selected image?",
            () => {
                removeImage();
                toast.info("Image selection cleared.");
            },
            "danger"
        );
    };

    // Pinalitan ang alert at window.confirm para sa submit
    const handleSubmitClick = () => {
        if (!imageFile) {
            toast.warning('Please select an image to upload.', 'Missing File');
            return;
        }

        askConfirmation(
            "Upload Confirmation",
            `Are you sure you want to upload "${imageFile.name}" to the gallery?`,
            () => performSubmit()
        );
    };

    const performSubmit = async () => {
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', imageFile.name);

        // Napanatili ang existing logic para sa activity logs
        try {
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
            const activeId = adminData.id || adminData._id || "";

            formData.append("userEmail", activeUser);
            formData.append("adminId", activeId);
            
            console.log("Uploading Image as:", activeUser); 
        } catch (err) {
            console.error("Error parsing admin data:", err);
        }

        try {
            const response = await fetch('https://wanderwaveph-backend.onrender.com/api/images/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Image uploaded successfully!', 'Upload Success'); // Pinalitan ang alert
                removeImage(); 
            } else {
                toast.error(data.message || 'Failed to upload', 'Upload Error');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            toast.error('Failed to connect to server. Make sure the backend is running.', 'Connection Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ai-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`ai-main ${isSidebarCollapsed ? "ai-main--collapsed" : ""}`}>
                <div className="ai-container">
                    
                    <header className="ai-header">
                        <div className="ai-header-content">
                            <h1 className="ai-title">GALLERY UPLOAD</h1>
                            <p className="ai-subtitle">Manage and expand your website's visual assets</p>
                        </div>
                    </header>

                    <div className="ai-grid">
                        <div className="ai-left">
                            <section className="ai-section">
                                <h2 className="ai-section-title">IMAGE UPLOAD</h2>
                                
                                {!imagePreview ? (
                                    <div className="ai-upload-zone-container">
                                        <input 
                                            type="file" 
                                            id="gallery-upload" 
                                            accept="image/*" 
                                            onChange={handleImageChange} 
                                            hidden 
                                        />
                                        <label htmlFor="gallery-upload" className="ai-upload-label-poster">
                                            <div className="ai-upload-icon-box">
                                                <Upload size={32} />
                                            </div>
                                            <p style={{ fontWeight: '700', color: '#1e293b', margin: '0' }}>Click to select image</p>
                                            <span style={{ fontSize: '12px', color: '#64748b' }}>JPG, PNG or WebP allowed</span>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="ai-upload-preview-box">
                                        <img src={imagePreview} alt="Preview" />
                                        <div className="ai-upload-actions">
                                            <label className="ai-upload-change-btn">
                                                <input type="file" onChange={handleImageChange} accept="image/*" hidden />
                                                Change
                                            </label>
                                            <button type="button" className="ai-upload-remove-btn" onClick={handleCancelClick}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section className="ai-section">
                                <h2 className="ai-section-title">FILE INFORMATION</h2>
                                <div className="ai-info-box">
                                    <div className="ai-info-item">
                                        <Info size={16} />
                                        <span>Images uploaded here will be visible in the public gallery.</span>
                                    </div>
                                    <div className="ai-info-item">
                                        <Info size={16} />
                                        <span>Recommended resolution: 1920x1080 for best quality.</span>
                                    </div>
                                </div>
                            </section>
                        </div>

                        <aside className="ai-right">
                            <div className="ai-preview-card">
                                <span className="ai-preview-label">LIVE PREVIEW</span>
                                
                                <div className="ai-card-mock">
                                    <div className="ai-card-img-wrapper">
                                        {imagePreview ? (
                                            <img src={imagePreview} alt="Preview" />
                                        ) : (
                                            <div className="ai-card-placeholder">
                                                <ImageIcon size={48} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="ai-card-body">
                                        <h4 className="ai-card-filename">
                                            {imageFile ? imageFile.name : 'No image selected'}
                                        </h4>
                                        <span className="ai-card-tag">Gallery Asset</span>
                                    </div>
                                </div>

                                <div className="ai-stats">
                                    <div className="ai-stat">
                                        <strong>Type</strong>
                                        <span>{imageFile ? imageFile.type.split('/')[1].toUpperCase() : '--'}</span>
                                    </div>
                                    <div className="ai-stat">
                                        <strong>Size</strong>
                                        <span>{imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) + ' MB' : '--'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="ai-actions-group">
                                <button 
                                    className="ai-btn-cancel" 
                                    onClick={handleCancelClick}
                                    disabled={!imageFile || isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="ai-btn-submit-styled" 
                                    onClick={handleSubmitClick} 
                                    disabled={isSubmitting || !imageFile}
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="ai-spinner" size={18} /> Uploading...</>
                                    ) : 'Upload'}
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            {/* In-add ang CustomConfirmModal sa dulo ng JSX */}
            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default AddImage;