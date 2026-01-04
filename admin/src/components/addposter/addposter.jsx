import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import './addposter.css';
import Sidebar from '../sidebar/sidebar';

const AddPoster = () => {
    // --- SIDEBAR LOGIC ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // --- STATE MANAGEMENT ---
    const [posterDetails, setPosterDetails] = useState({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'Active'
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (imagePreview) URL.revokeObjectURL(imagePreview);
        };
    }, [imagePreview]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPosterDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Please upload a valid image file (JPG, PNG).');
                return;
            }
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleCancel = () => {
        setPosterDetails({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'Active'
        });
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!posterDetails.title || !imageFile) {
            alert('Please provide a title and upload an image.');
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', posterDetails.title);
        formData.append('description', posterDetails.description);
        formData.append('startDate', posterDetails.startDate);
        formData.append('endDate', posterDetails.endDate);
        formData.append('status', posterDetails.status);

        // =========================================================
        // ADDED: KUNIN ANG USER DATA PARA SA ACTIVITY LOGS
        // =========================================================
        try {
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
            const activeId = adminData.id || adminData._id || "";

            formData.append("userEmail", activeUser);
            formData.append("adminId", activeId);
        } catch (err) {
            console.error("Error parsing admin data:", err);
        }
        // =========================================================

        try {
            const response = await fetch('http://localhost:5000/api/posters/add', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('✅ Poster uploaded successfully!');
                handleCancel();
            } else {
                const data = await response.json();
                alert(`❌ Error: ${data.message || 'Failed to upload'}`);
            }
        } catch (error) {
            alert('❌ Failed to connect to server.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="apstr-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`apstr-main ${isSidebarCollapsed ? "apstr-main--collapsed" : ""}`}>
                <div className="apstr-container">
                    {/* HEADER MATCHED TO PROMO WITH DESTINATION FEEL */}
                    <header className="apstr-header">
                        <div className="apstr-header-content">
                            <h1 className="apstr-title">NEW POSTER</h1>
                            <p className="apstr-subtitle">Upload marketing banners for your website or app</p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit}>
                        <div className="apstr-grid">
                            <div className="apstr-left">
                                <section className="pstr-section">
                                    <h2 className="pstr-section-title">POSTER IMAGE</h2>
                                    {!imagePreview ? (
                                        <div className="apstr-upload-empty">
                                            <label className="apstr-upload-label" style={{ cursor: 'pointer' }}>
                                                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
                                                <div className="apstr-upload-icon-box">
                                                    <Upload size={32} />
                                                </div>
                                                <p style={{ fontWeight: '700', color: '#1e293b' }}>Click to upload poster</p>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>JPG, PNG or WebP (Max 5MB)</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="apstr-upload-preview-box">
                                            <img src={imagePreview} alt="Preview" />
                                            <div className="apstr-upload-actions">
                                                <label className="apstr-upload-change-btn">
                                                    <input type="file" onChange={handleImageChange} accept="image/*" hidden />
                                                    Change
                                                </label>
                                                <button type="button" className="apstr-upload-remove-btn" onClick={removeImage}>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>

                                <section className="pstr-section">
                                    <h2 className="pstr-section-title">POSTER DETAILS</h2>
                                    <div className="pstr-fields">
                                        <div className="pstr-field pstr-field--full">
                                            <label>Poster Title</label>
                                            <input
                                                type="text"
                                                name="title"
                                                placeholder="e.g. Summer Sale 2024"
                                                value={posterDetails.title}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="pstr-field pstr-field--full">
                                            <label>Description / Caption</label>
                                            <textarea
                                                name="description"
                                                placeholder="Optional caption for the poster..."
                                                value={posterDetails.description}
                                                onChange={handleChange}
                                                rows="4"
                                            ></textarea>
                                        </div>
                                        <div className="pstr-field">
                                            <label>Start Display Date</label>
                                            <input type="date" name="startDate" value={posterDetails.startDate} onChange={handleChange} />
                                        </div>
                                        <div className="pstr-field">
                                            <label>End Display Date</label>
                                            <input type="date" name="endDate" value={posterDetails.endDate} onChange={handleChange} />
                                        </div>
                                        <div className="pstr-field pstr-field--full">
                                            <label>Status</label>
                                            <select name="status" value={posterDetails.status} onChange={handleChange}>
                                                <option value="Active">Active (Visible)</option>
                                                <option value="Inactive">Inactive (Hidden)</option>
                                                <option value="Scheduled">Scheduled</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <aside className="apstr-right">
                                <div className="pstr-preview-card">
                                    <span className="pstr-preview-label">LIVE PREVIEW</span>
                                    <div className="pstr-phone-mockup">
                                        <div className="pstr-phone-screen">
                                            <div className="pstr-phone-header">
                                                <div className="pstr-phone-brand">Wanderwave</div>
                                            </div>
                                            <div className="pstr-phone-content">
                                                {imagePreview ? (
                                                    <div className="pstr-preview-hero">
                                                        <img src={imagePreview} alt="Hero" />
                                                        <div className="pstr-preview-overlay">
                                                            {posterDetails.title && <h3>{posterDetails.title}</h3>}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="pstr-empty-state">
                                                        <ImageIcon size={40} />
                                                        <p>Upload an image to see preview</p>
                                                    </div>
                                                )}
                                                <div className="pstr-fake-item"></div>
                                                <div className="pstr-fake-item"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pstr-stats">
                                        <div className="pstr-stat">
                                            <strong>Type</strong>
                                            <span>{imageFile ? imageFile.type.split('/')[1].toUpperCase() : '--'}</span>
                                        </div>
                                        <div className="pstr-stat">
                                            <strong>Size</strong>
                                            <span>{imageFile ? (imageFile.size / 1024 / 1024).toFixed(2) + ' MB' : '--'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="apstr-actions">
                                    <button 
                                        type="button" 
                                        className="apstr-btn apstr-btn--cancel" 
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="apstr-btn apstr-btn--submit" 
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Uploading...' : 'Upload'}
                                    </button>
                                </div>
                            </aside>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default AddPoster;