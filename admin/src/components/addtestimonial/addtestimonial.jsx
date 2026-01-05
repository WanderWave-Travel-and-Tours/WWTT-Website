import React, { useState, useEffect } from 'react';
import { User, Quote, Camera, Loader2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './addtestimonial.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

const AddTestimonial = () => {
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

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC START
    // =========================================================

    // 1. Helper: File <-> Base64 Converters
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

    // 2. Draft Payload State
    const [draftPayload, setDraftPayload] = useState(null);

    // 3. Listen to state changes and update Draft Payload
    useEffect(() => {
        const updateDraft = async () => {
            // 🛑 FIX: Check if form is completely empty before saving
            // This prevents saving a draft if the user just visited the page or cleared it
            const isFormEmpty = 
                !testimonialDetails.name && 
                !testimonialDetails.feedback && 
                !testimonialDetails.source && 
                !pictureFile;

            if (isFormEmpty) {
                setDraftPayload(null); // Do not save anything
                return;
            }

            let imageBase64 = null;
            let imageMeta = null;

            // Handle Image Conversion
            if (pictureFile) {
                try {
                    // Limit draft image size (~3MB limit safety)
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
                image: imageBase64, // Saved as Base64 string
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500); // Debounce

        return () => clearTimeout(timeoutId);
    }, [testimonialDetails, pictureFile]);

    // 4. Restore Function
    const restoreDraftData = async (data) => {
        if (!data) return;

        // Restore Text Fields
        setTestimonialDetails({
            name: data.name || '',
            feedback: data.feedback || '',
            source: data.source || '',
        });

        // Restore Image
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

    // 5. Initialize Hook
    const { 
        clearDraft, 
        hasDraft, 
        restoreDraft, 
        discardDraft,
        draftInfo 
    } = useAutoDraft({
        module: 'add-testimonial', // Unique ID
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: previewUrl, 
        autoRestore: false // Manual via modal
    });

    // 6. Modal State
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft) {
            setShowRestoreModal(true);
        }
    }, [hasDraft]);

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
    };

    const handleDiscardDraft = async () => {
        await discardDraft(); // Ensure draft is cleared from storage
        setShowRestoreModal(false);
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
        setPictureFile(file);
        if (file) setPreviewUrl(URL.createObjectURL(file));
    };

    const handleCancel = async () => {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            // ✅ CLEAR DRAFT ON CANCEL
            await clearDraft();

            setTestimonialDetails({
                name: '',
                feedback: '',
                source: '',
            });
            setPictureFile(null);
            setPreviewUrl(null);
        }
    };

    const handleSubmit = async (e) => { 
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData();

        formData.append('customerName', testimonialDetails.name); 
        formData.append('source', testimonialDetails.source);
        formData.append('feedback', testimonialDetails.feedback);

        if (pictureFile) {
            formData.append('customerImage', pictureFile); 
        }

        // =========================================================
        // ADDED: KUNIN ANG USER DATA PARA SA ACTIVITY LOGS
        // =========================================================
        try {
            const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
            const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
            const activeId = adminData.id || adminData._id || "";

            formData.append("userEmail", activeUser);
            formData.append("adminId", activeId);
            
            console.log("Submitting Testimonial by:", activeUser);
        } catch (err) {
            console.error("Error parsing admin data:", err);
        }
        // =========================================================

        try {
            const response = await fetch('https://wanderwaveph-backend.onrender.com/api/testimonials', {
                method: 'POST',
                body: formData, 
            });

            if (response.ok) {
                alert(`Testimonial from ${testimonialDetails.name} added successfully!`);
                
                // ✅ CLEAR DRAFT ON SUCCESS
                await clearDraft();

                // Reset manually since handleCancel has a confirm
                setTestimonialDetails({
                    name: '',
                    feedback: '',
                    source: '',
                });
                setPictureFile(null);
                setPreviewUrl(null);
                e.target.reset(); 

            } else {
                alert("Error submitting testimonial.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Something went wrong with the server.");
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