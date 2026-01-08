import React, { useState, useEffect } from 'react';
import { User, Quote, Camera, Loader2, HelpCircle } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './addtestimonial.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ Import Toast and ToastManager
import { useToast } from '../toast/ToastManager';

// ✅ Custom Confirm Modal Component (Reference from EditVisa.jsx)
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

const AddTestimonial = () => {
    const toast = useToast(); // ✅ Initialize Toast

    // --- SIDEBAR LOGIC ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    
    // --- STATE MANAGEMENT ---
    const [testimonialDetails, setTestimonialDetails] = useState({
        name: '',
        feedback: '',
        source: '',
    });
    const [pictureFile, setPictureFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- CONFIRM MODAL STATE ---
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

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

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC START
    // =========================================================

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = (error) => reject(error);
        });
    };

    const base64ToFile = async (base64String, fileName, mimeType) => {
        const res = await fetch(base64String);
        const blob = await res.blob();
        return new File([blob], fileName, { type: mimeType });
    };

    const [draftPayload, setDraftPayload] = useState(null);

    useEffect(() => {
        const updateDraft = async () => {
            const isFormEmpty = 
                !testimonialDetails.name && 
                !testimonialDetails.feedback && 
                !testimonialDetails.source && 
                !pictureFile;

            if (isFormEmpty) {
                setDraftPayload(null);
                return;
            }

            let imageBase64 = null;
            let imageMeta = null;

            if (pictureFile) {
                try {
                    if (pictureFile.size < 3 * 1024 * 1024) { 
                        imageBase64 = await fileToBase64(pictureFile);
                        imageMeta = { name: pictureFile.name, type: pictureFile.type };
                    }
                } catch (err) {
                    console.warn("Image too large for draft, saving text only.");
                }
            }

            setDraftPayload({
                ...testimonialDetails,
                image: imageBase64,
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [testimonialDetails, pictureFile]);

    const restoreDraftData = async (data) => {
        if (!data) return;

        setTestimonialDetails({
            name: data.name || '',
            feedback: data.feedback || '',
            source: data.source || '',
        });

        if (data.image && data.imageMeta) {
            try {
                const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
                setPictureFile(restoredFile);
                setPreviewUrl(URL.createObjectURL(restoredFile));
            } catch (err) {
                console.error("Failed to restore image:", err);
            }
        }
    };

    const { 
        clearDraft, 
        hasDraft, 
        restoreDraft, 
        discardDraft,
        draftInfo 
    } = useAutoDraft({
        module: 'add-testimonial',
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: previewUrl, 
        autoRestore: false 
    });

    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft) {
            setShowRestoreModal(true);
        }
    }, [hasDraft]);

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
        toast.success("Draft restored successfully!");
    };

    const handleDiscardDraft = async () => {
        await discardDraft();
        setShowRestoreModal(false);
        toast.info("Draft discarded.");
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setTestimonialDetails(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.warning("File is too large. Max limit is 2MB.");
                return;
            }
            setPictureFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            toast.info("Photo selected.");
        }
    };

    const handleCancel = () => {
        // ✅ REPLACED window.confirm with Custom Modal
        askConfirmation(
            "Cancel Entry",
            "Are you sure you want to cancel? All unsaved changes and drafts will be lost.",
            async () => {
                await clearDraft();
                setTestimonialDetails({
                    name: '',
                    feedback: '',
                    source: '',
                });
                setPictureFile(null);
                setPreviewUrl(null);
                toast.info("Form cleared.");
            },
            "danger"
        );
    };

    const handleSubmit = (e) => { 
        e.preventDefault();
        
        // ✅ ADDED Confirmation before submit
        askConfirmation(
            "Submit Testimonial",
            `Do you want to add this testimonial from ${testimonialDetails.name}?`,
            () => performSubmit()
        );
    };

    const performSubmit = async () => {
        setIsSubmitting(true);
        const formData = new FormData();

        formData.append('customerName', testimonialDetails.name); 
        formData.append('source', testimonialDetails.source);
        formData.append('feedback', testimonialDetails.feedback);

        if (pictureFile) {
            formData.append('customerImage', pictureFile); 
        }

        try {
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
            const activeId = adminData.id || adminData._id || "";

            formData.append("userEmail", activeUser);
            formData.append("adminId", activeId);
        } catch (err) {
            console.error("Error parsing admin data:", err);
        }

        try {
            const response = await fetch('http://localhost:5000/api/testimonials', {
                method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                toast.success(`Testimonial from ${testimonialDetails.name} added successfully!`);
                
                await clearDraft();

                setTestimonialDetails({
                    name: '',
                    feedback: '',
                    source: '',
                });
                setPictureFile(null);
                setPreviewUrl(null);
            } else {
                toast.error("Error submitting testimonial.");
            }
        } catch (error) {
            console.error("Error:", error);
            toast.error("Something went wrong with the server.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="testi-page">
            
            {/* ✅ RESTORE DRAFT MODAL */}
            <RestoreDraftModal
                isOpen={showRestoreModal}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
                draftInfo={draftInfo}
            />

            {/* ✅ CUSTOM CONFIRMATION MODAL */}
            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />

            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`testi-main ${isSidebarCollapsed ? "testi-main--collapsed" : ""}`}>
                <div className="testi-container">
                    <header className="testi-header">
                        <div className="testi-header-content">
                            <h1 className="testi-title">NEW TESTIMONIAL</h1>
                            <p className="testi-subtitle">Add a customer testimonial to display on your website gallery</p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit} className="testi-form">
                        <div className="testi-grid">
                            <div className="testi-left">
                                <section className="testi-section">
                                    <h2 className="testi-section-title">CUSTOMER PHOTO</h2>
                                    <div className="testi-upload-area">
                                        <label className="testi-upload-label-poster">
                                            <input type="file" accept="image/*" onChange={handleFileChange} hidden />
                                            {!previewUrl ? (
                                                <div className="testi-upload-placeholder">
                                                    <div className="testi-upload-icon-box">
                                                        <Camera size={32} />
                                                    </div>
                                                    <p style={{ fontWeight: '700', color: '#1e293b', margin: '0' }}>Click to upload photo</p>
                                                    <span style={{ fontSize: '12px', color: '#64748b' }}>JPG, PNG • Max 2MB</span>
                                                </div>
                                            ) : (
                                                <div className="testi-upload-preview-box">
                                                    <img src={previewUrl} alt="Preview" />
                                                    <div className="testi-upload-overlay">
                                                        <span>Change Photo</span>
                                                    </div>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </section>

                                <section className="testi-section">
                                    <h2 className="testi-section-title">CUSTOMER DETAILS</h2>
                                    <div className="testi-fields">
                                        <div className="testi-field">
                                            <label>Customer Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={testimonialDetails.name}
                                                onChange={handleChange}
                                                placeholder="e.g., Maria T. Reyes"
                                                required
                                            />
                                        </div>
                                        <div className="testi-field">
                                            <label>Feedback Source</label>
                                            <select
                                                name="source"
                                                value={testimonialDetails.source}
                                                onChange={handleChange}
                                                required
                                            >
                                                <option value="" disabled>Select Source</option>
                                                <option value="Facebook">Facebook</option>
                                                <option value="Google Review">Google Review</option>
                                                <option value="Website Form">Website Form</option>
                                                <option value="Email">Email</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="testi-field testi-field--full">
                                            <label>Feedback / Testimonial</label>
                                            <textarea
                                                name="feedback"
                                                value={testimonialDetails.feedback}
                                                onChange={handleChange}
                                                placeholder="Enter the full quote or review here..."
                                                rows="6"
                                                required
                                            ></textarea>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            <aside className="testi-right">
                                <div className="testi-preview-card">
                                    <span className="testi-preview-label">LIVE PREVIEW</span>
                                    <div className="testi-card">
                                        <div className="testi-card-quote">
                                            <Quote size={32} />
                                        </div>
                                        <p className="testi-card-feedback">
                                            {testimonialDetails.feedback || 'Customer feedback will appear here...'}
                                        </p>
                                        <div className="testi-card-author">
                                            <div className="testi-card-avatar">
                                                {previewUrl ? (
                                                    <img src={previewUrl} alt="Avatar" />
                                                ) : (
                                                    <User size={24} />
                                                )}
                                            </div>
                                            <div className="testi-card-info">
                                                <strong>{testimonialDetails.name || 'Customer Name'}</strong>
                                                <span>{testimonialDetails.source || 'Source'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="testi-stats">
                                        <div className="testi-stat">
                                            <strong>{testimonialDetails.name ? '✓' : '--'}</strong>
                                            <span>Name</span>
                                        </div>
                                        <div className="testi-stat">
                                            <strong>{testimonialDetails.source ? '✓' : '--'}</strong>
                                            <span>Source</span>
                                        </div>
                                        <div className="testi-stat">
                                            <strong>{previewUrl ? '✓' : '--'}</strong>
                                            <span>Photo</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="testi-actions">
                                    <button 
                                        type="button" 
                                        className="testi-btn testi-btn--cancel" 
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="testi-btn testi-btn--submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="vb-spinner" size={18} /> Submit</>
                                        ) : 'Submit'}
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

export default AddTestimonial;