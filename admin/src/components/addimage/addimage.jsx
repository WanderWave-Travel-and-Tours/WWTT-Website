import React, { useState, useEffect } from 'react';
import { Upload, Trash2, ImageIcon, Info, Loader2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './addimage.css';

const AddImage = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file (JPG, PNG, WebP).');
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

    const handleSubmit = async () => {
        if (!imageFile) {
            alert('Please select an image to upload.');
            return;
        }

        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', imageFile.name);

        try {
            const response = await fetch('https://wanderwaveph-backend.onrender.com0/api/images/add', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (response.ok) {
                alert('✅ Image uploaded successfully!');
                removeImage(); 
            } else {
                alert(`❌ Error: ${data.message || 'Failed to upload'}`);
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert('❌ Failed to connect to server. Make sure the backend is running.');
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