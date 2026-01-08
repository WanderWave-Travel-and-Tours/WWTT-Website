import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, User, MessageSquare, HelpCircle } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditTestimonial.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ Import Toast and Icons for the Modal
import { useToast } from "../toast/ToastManager"; 

// 🔥🔥🔥 HELPER COMPONENT - CUSTOM CONFIRM MODAL 🔥🔥🔥
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

const EditTestimonial = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast(); // ✅ Initialize Toast
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // ✅ Confirmation Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    // Form State
    const [formData, setFormData] = useState({
        customerName: '',
        source: 'Facebook', // Default
        feedback: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const API_BASE_URL = 'http://localhost:5000';

    // ✅ Helper for showing confirmation
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
            if (isLoading) {
                setDraftPayload(null);
                return;
            }

            const isFormEmpty = 
                !formData.customerName && 
                !formData.feedback && 
                !imageFile;

            if (isFormEmpty) {
                setDraftPayload(null);
                return;
            }

            let imageBase64 = null;
            let imageMeta = null;

            if (imageFile) {
                try {
                    if (imageFile.size < 3 * 1024 * 1024) { 
                        imageBase64 = await fileToBase64(imageFile);
                        imageMeta = { name: imageFile.name, type: imageFile.type };
                    }
                } catch (err) {
                    console.warn("Image too large for draft, saving text only.");
                }
            }

            setDraftPayload({
                ...formData,
                image: imageBase64, 
                imageMeta: imageMeta,
                originalId: id 
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [formData, imageFile, isLoading, id]);

    // 4. Restore Function
    const restoreDraftData = async (data) => {
        if (!data) return;
        if (data.originalId && data.originalId !== id) {
            console.warn("Draft found but belongs to a different testimonial ID. Ignoring.");
            return;
        }

        setFormData({
            customerName: data.customerName || '',
            source: data.source || 'Facebook',
            feedback: data.feedback || ''
        });

        if (data.image && data.imageMeta) {
            try {
                const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
                setImageFile(restoredFile);
                setImagePreview(URL.createObjectURL(restoredFile));
                toast.info("Draft content and image restored.");
            } catch (err) {
                console.error("Failed to restore image:", err);
            }
        } else {
            toast.info("Draft text restored.");
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
        module: `edit-testimonial-${id}`, 
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview, 
        autoRestore: false 
    });

    // 6. Modal State
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft && !isLoading) {
            setShowRestoreModal(true);
        }
    }, [hasDraft, isLoading]);

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
    };

    const handleDiscardDraft = async () => {
        await discardDraft(); 
        setShowRestoreModal(false);
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    // Fetch Testimonial Data
    useEffect(() => {
        const fetchTestimonialDetails = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/testimonials/${id}`);
                if (!response.ok) throw new Error('Failed to fetch testimonial details');
                
                const data = await response.json();
                
                setFormData({
                    customerName: data.customerName || '',
                    source: data.source || 'Facebook',
                    feedback: data.feedback || ''
                });

                if (data.customerImage) {
                    const imgUrl = data.customerImage.startsWith('http') 
                        ? data.customerImage 
                        : `${API_BASE_URL}/${data.customerImage}`;
                    setImagePreview(imgUrl);
                }
            } catch (err) {
                console.error(err);
                toast.error('Could not load testimonial details.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchTestimonialDetails();
        }
    }, [id, toast]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
            toast.info(`Selected image: ${file.name}`);
        }
    };

    // ✅ Handlers for Confirmation Modals
    const handleCancelClick = () => {
        askConfirmation(
            "Discard Changes",
            "Are you sure you want to discard your changes and go back?",
            async () => {
                await clearDraft();
                navigate('/view-testimonials');
            }
        );
    };

    const handleSaveConfirmation = (e) => {
        e.preventDefault();
        // Basic validation before asking
        if (!formData.customerName || !formData.feedback) {
            toast.warning("Please fill in all required fields.");
            return;
        }

        askConfirmation(
            "Update Testimonial",
            "Are you sure you want to save the changes to this testimonial?",
            () => performSubmit()
        );
    };

    const performSubmit = async () => {
        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("customerName", formData.customerName);
            formDataToSend.append("source", formData.source);
            formDataToSend.append("feedback", formData.feedback);

            if (imageFile) {
                formDataToSend.append("customerImage", imageFile);
            }

            const response = await fetch(`${API_BASE_URL}/api/testimonials/update/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Failed to update testimonial');
            }

            toast.success('Testimonial updated successfully!');
            await clearDraft();
            navigate('/view-testimonials'); 
        } catch (err) {
            console.error(err);
            toast.error('Failed to update testimonial. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="eto-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`eto-main ${isSidebarCollapsed ? "eto-main--collapsed" : ""}`}>
                    <div className="eto-loading">
                        <div className="eto-spinner"></div>
                        <p>Loading testimonial data...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="eto-page">
            
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

            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            
            <main className={`eto-main ${isSidebarCollapsed ? "eto-main--collapsed" : ""}`}>
                <div className="eto-container">
                    
                    {/* Header */}
                    <header className="eto-header">
                        <div className="eto-header-content">
                            <button className="eto-back-btn" type="button" onClick={handleCancelClick}>
                                <ArrowLeft size={18} />
                                Back to Testimonials
                            </button>
                            <h1 className="eto-title">EDIT TESTIMONIAL</h1>
                            <p className="eto-subtitle">Update customer feedback and details</p>
                        </div>
                    </header>

                    {/* Form */}
                    <form onSubmit={handleSaveConfirmation} className="eto-form">
                        
                        {/* Section 1: Image Upload */}
                        <div className="eto-section">
                            <h2 className="eto-section-title">Customer Photo</h2>
                            <div className="eto-upload-area">
                                <input
                                    type="file"
                                    id="customerImageUpload"
                                    className="eto-file-input"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <label htmlFor="customerImageUpload" className="eto-upload-label">
                                    {imagePreview ? (
                                        <div className="eto-image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <div className="eto-image-overlay">
                                                <Upload size={32} />
                                                <span>Click to change photo</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="eto-upload-placeholder">
                                            <User size={48} />
                                            <span>Click to upload customer photo</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Section 2: Testimonial Details */}
                        <div className="eto-section">
                            <h2 className="eto-section-title">Testimonial Details</h2>
                            <div className="eto-form-grid">
                                <div className="eto-form-group">
                                    <label className="eto-label">Customer Name *</label>
                                    <input 
                                        type="text" 
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleInputChange}
                                        required
                                        className="eto-input"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>

                                <div className="eto-form-group">
                                    <label className="eto-label">Source *</label>
                                    <select 
                                        name="source" 
                                        value={formData.source} 
                                        onChange={handleInputChange}
                                        className="eto-select"
                                        required
                                    >
                                        <option value="Facebook">Facebook</option>
                                        <option value="Google Reviews">Google Reviews</option>
                                        <option value="Email">Email</option>
                                        <option value="Direct Message">Direct Message</option>
                                        <option value="Website">Website</option>
                                    </select>
                                </div>

                                <div className="eto-form-group eto-form-group--full">
                                    <label className="eto-label">Feedback / Message *</label>
                                    <textarea 
                                        name="feedback"
                                        value={formData.feedback}
                                        onChange={handleInputChange}
                                        className="eto-textarea"
                                        rows="6"
                                        required
                                        placeholder="Enter what the customer said..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="eto-form-actions">
                            <button 
                                type="button" 
                                className="eto-btn eto-btn--cancel" 
                                onClick={handleCancelClick}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="eto-btn eto-btn--submit" 
                                disabled={submitting}
                            >
                                {submitting ? (
                                    'Updating...' 
                                ) : (
                                    <>
                                        <Save size={18} /> Update Testimonial
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default EditTestimonial;