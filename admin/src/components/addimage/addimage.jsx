import React, { useState, useEffect } from 'react';
import { Upload, Trash2, ImageIcon, Info, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast'; // Import toast and Toaster
import Sidebar from '../sidebar/sidebar';
import './addimage.css';

const AddImage = () => {
    // --- SIDEBAR LOGIC ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Cleanup function for object URL
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const showToastError = (message) => {
        toast.error(message, {
            position: 'top-center', // Set position to top-center
            style: { 
                border: '1px solid #ef4444', 
                color: '#ef4444',
                padding: '16px',
                fontWeight: '600'
            },
            iconTheme: { 
                primary: '#ef4444', 
                secondary: '#fff' 
            },
        });
    };

    const showToastSuccess = (message) => {
        toast.success(message, {
            position: 'top-center', // Set position to top-center
            style: { 
                border: '1px solid #10b981', // Custom success color
                color: '#10b981',
                padding: '16px',
                fontWeight: '600'
            },
            iconTheme: { 
                primary: '#10b981', 
                secondary: '#fff' 
            },
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // File validation check
            if (!file.type.startsWith('image/')) {
                showToastError('Please upload a valid image file (JPG, PNG, GIF).'); // Use toast for error
                // Reset file input value to allow selecting the same file again after error
                e.target.value = null; 
                return;
            }
            setImageFile(file);
            // Create a preview URL
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const removeImage = () => {
        setImageFile(null);
        // Clean up the object URL before setting to null
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
    };

    const handleSubmit = async () => {
        if (!imageFile) {
            showToastError('Please select an image to upload.'); // Use toast for validation error
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', imageFile.name);

        try {
            const response = await fetch('http://localhost:5000/api/images/add', {
            const response = await fetch('http://localhost:5000/api/images/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                showToastSuccess('✅ Image uploaded successfully!'); // Use toast for success
                removeImage(); 
            } else {
                // Handle API error message
                showToastError(`Upload ❌ Error: ${data.message || 'Failed to upload image.'}`);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            showToastError('❌ Failed to connect to server. Please check your network.'); // Use toast for network error
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="ai-page">
            <Toaster /> {/* Add the Toaster component here */}
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
                                            <button type="button" className="ai-upload-remove-btn" onClick={removeImage}>
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
                                    onClick={removeImage}
                                    disabled={!imageFile || isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="ai-btn-submit-styled" 
                                    onClick={handleSubmit} 
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
        </div>
    );
};

export default AddImage;