import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, User, MessageSquare, HelpCircle, Star } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditTestimonial.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ Import Toast and Icons for the Modal
import { useToast } from "../toast/ToastManager"; 

// 🔥 HELPER FUNCTION - GET ADMIN DATA (Activity Logs) 🔥
const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('❌ Error getting admin data:', error);
        return { userEmail: 'Unknown Admin', adminId: null };
    }
};

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

// ✅ STAR RATING DISPLAY COMPONENT (WITH HALF-STAR SUPPORT)
const StarRating = ({ rating, size = 16, color = '#fbbf24' }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars.push(
            <Star key={`full-${i}`} size={size} fill={color} color={color} />
        );
    }

    // Half star
    if (hasHalfStar) {
        stars.push(
            <div key="half" style={{ position: 'relative', display: 'inline-block' }}>
                <Star size={size} color="#e5e7eb" fill="#e5e7eb" />
                <div style={{ 
                    position: 'absolute', 
                    top: 0, 
                    left: 0, 
                    width: '50%', 
                    overflow: 'hidden' 
                }}>
                    <Star size={size} fill={color} color={color} />
                </div>
            </div>
        );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars.push(
            <Star key={`empty-${i}`} size={size} color="#e5e7eb" fill="#e5e7eb" />
        );
    }

    return <div style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>{stars}</div>;
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
        feedback: '',
        rating: 5 // ✅ Default rating
    });

    // Store original data to track changes for Activity Logs
    const [originalData, setOriginalData] = useState(null);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com';

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

        if (data.customerName) setFormData(prev => ({ ...prev, customerName: data.customerName }));
        if (data.source) setFormData(prev => ({ ...prev, source: data.source }));
        if (data.feedback) setFormData(prev => ({ ...prev, feedback: data.feedback }));
        if (data.rating !== undefined) setFormData(prev => ({ ...prev, rating: data.rating })); // ✅ Restore rating

        if (data.image && data.imageMeta) {
            try {
                const restoredFile = await base64ToFile(
                    data.image, 
                    data.imageMeta.name, 
                    data.imageMeta.type
                );
                setImageFile(restoredFile);
                setImagePreview(data.image);
            } catch (err) {
                console.error("Failed to restore image:", err);
            }
        }
    };

    // 5. Use the custom hook
    const {
        showRestoreModal,
        draftInfo,
        handleRestoreDraft,
        handleDiscardDraft,
        clearDraft
    } = useAutoDraft(
        `edit-testimonial-${id}`,
        draftPayload,
        restoreDraftData
    );

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    // Fetch existing testimonial data
    useEffect(() => {
        const fetchTestimonial = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/api/testimonials/${id}`);
                if (!response.ok) {
                    throw new Error('Testimonial not found');
                }
                const data = await response.json();
                
                setFormData({
                    customerName: data.customerName || '',
                    source: data.source || 'Facebook',
                    feedback: data.feedback || '',
                    rating: data.rating || 5 // ✅ Load rating
                });

                // Store original data for Activity Log comparison
                setOriginalData({
                    customerName: data.customerName || '',
                    source: data.source || 'Facebook',
                    feedback: data.feedback || '',
                    rating: data.rating || 5 // ✅ Store original rating
                });

                if (data.customerImage) {
                    const imageUrl = `${API_BASE_URL}/${data.customerImage.replace(/\\/g, '/')}`;
                    setImagePreview(imageUrl);
                }

                setIsLoading(false);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load testimonial data.');
                setIsLoading(false);
            }
        };

        fetchTestimonial();
    }, [id]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        }
    };

    // 🔥🔥🔥 HELPER: IDENTIFY CHANGES FOR ACTIVITY LOGS 🔥🔥🔥
    const getChangedFields = () => {
        if (!originalData) return {};

        const changes = {};
        if (formData.customerName !== originalData.customerName) {
            changes.customerName = { old: originalData.customerName, new: formData.customerName };
        }
        if (formData.source !== originalData.source) {
            changes.source = { old: originalData.source, new: formData.source };
        }
        if (formData.feedback !== originalData.feedback) {
            changes.feedback = { old: originalData.feedback, new: formData.feedback };
        }
        if (formData.rating !== originalData.rating) { // ✅ Track rating changes
            changes.rating = { old: originalData.rating, new: formData.rating };
        }
        if (imageFile) {
            changes.customerImage = { old: 'Existing Image', new: imageFile.name };
        }
        return changes;
    };

    const handleSaveConfirmation = (e) => {
        e.preventDefault();
        askConfirmation(
            "Save Changes?",
            "Are you sure you want to update this testimonial?",
            handleActualSave,
            "primary"
        );
    };

    const handleActualSave = async () => {
        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append("customerName", formData.customerName);
            formDataToSend.append("source", formData.source);
            formDataToSend.append("feedback", formData.feedback);
            formDataToSend.append("rating", formData.rating); // ✅ Send rating

            // 🔥 INCLUDE ADMIN DATA FOR ACTIVITY LOGS
            const { userEmail, adminId } = getAdminData();
            formDataToSend.append("userEmail", userEmail);
            if (adminId) formDataToSend.append("adminId", adminId);

            // 🔥 INCLUDE CHANGED FIELDS
            const changedFields = getChangedFields();
            formDataToSend.append("changedFields", JSON.stringify(changedFields));

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

    const handleCancelClick = () => {
        askConfirmation(
            "Cancel Editing?",
            "Are you sure you want to cancel? Any unsaved changes and drafts will be cleared.",
            async () => {
                await clearDraft();
                navigate('/view-testimonials');
            },
            "danger"
        );
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

                                {/* ✅ RATING DROPDOWN WITH HALF-STAR SUPPORT */}
                                <div className="eto-form-group">
                                    <label className="eto-label">Rating *</label>
                                    <select
                                        name="rating"
                                        value={formData.rating}
                                        onChange={handleInputChange}
                                        className="eto-select"
                                        required
                                    >
                                        <option value={5}>5.0 Stars (Excellent)</option>
                                        <option value={4.5}>4.5 Stars</option>
                                        <option value={4}>4.0 Stars (Good)</option>
                                        <option value={3.5}>3.5 Stars</option>
                                        <option value={3}>3.0 Stars (Average)</option>
                                        <option value={2.5}>2.5 Stars</option>
                                        <option value={2}>2.0 Stars (Poor)</option>
                                        <option value={1.5}>1.5 Stars</option>
                                        <option value={1}>1.0 Star (Very Poor)</option>
                                        <option value={0.5}>0.5 Stars</option>
                                        <option value={0}>0 Stars</option>
                                    </select>
                                    {/* ✅ LIVE PREVIEW OF RATING */}
                                    <div style={{ marginTop: '8px' }}>
                                        <StarRating rating={formData.rating} size={18} />
                                    </div>
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