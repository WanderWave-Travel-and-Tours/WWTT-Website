import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Calendar, HelpCircle } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../sidebar/sidebar';
import './EditPoster.css';

// ✅ Imports for Notifications and Draft Functionality
import { useToast } from "../toast/ToastManager"; 
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

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

// ✅ Confirmation Modal Component (Patterned after EditVisa)
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

const EditPoster = () => {
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
        title: '',
        status: 'Active',
        startDate: '',
        endDate: '',
        description: ''
    });

    // Store original data to track changes for Activity Logs
    const [originalData, setOriginalData] = useState(null);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // ✅ Confirmation Helper
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

    // Helper to format date for input type="date"
    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
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
            if (isLoading) {
                setDraftPayload(null);
                return;
            }

            const isFormEmpty = 
                !formData.title && 
                !formData.startDate && 
                !formData.endDate && 
                !formData.description && 
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

    const restoreDraftData = async (data) => {
        if (!data) return;

        if (data.title) setFormData(prev => ({ ...prev, title: data.title }));
        if (data.status) setFormData(prev => ({ ...prev, status: data.status }));
        if (data.startDate) setFormData(prev => ({ ...prev, startDate: data.startDate }));
        if (data.endDate) setFormData(prev => ({ ...prev, endDate: data.endDate }));
        if (data.description) setFormData(prev => ({ ...prev, description: data.description }));

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

    const {
        showRestoreModal,
        draftInfo,
        handleRestoreDraft,
        handleDiscardDraft,
        clearDraft
    } = useAutoDraft(
        `edit-poster-${id}`,
        draftPayload,
        restoreDraftData
    );

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    useEffect(() => {
        const fetchPoster = async () => {
            try {
                const response = await axios.get(`https://wanderwaveph-backend.onrender.com/api/posters/${id}`);
                const poster = response.data;

                setFormData({
                    title: poster.title || '',
                    status: poster.status || 'Active',
                    startDate: formatDateForInput(poster.startDate) || '',
                    endDate: formatDateForInput(poster.endDate) || '',
                    description: poster.description || ''
                });

                setOriginalData({
                    title: poster.title || '',
                    status: poster.status || 'Active',
                    startDate: formatDateForInput(poster.startDate) || '',
                    endDate: formatDateForInput(poster.endDate) || '',
                    description: poster.description || ''
                });

                if (poster.imageUrl) {
                    setImagePreview(`https://wanderwaveph-backend.onrender.com/${poster.imageUrl}`);
                }

                setIsLoading(false);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load poster data.');
                setIsLoading(false);
            }
        };

        fetchPoster();
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

    const getChangedFields = () => {
        if (!originalData) return {};

        const changes = {};
        if (formData.title !== originalData.title) {
            changes.title = { old: originalData.title, new: formData.title };
        }
        if (formData.status !== originalData.status) {
            changes.status = { old: originalData.status, new: formData.status };
        }
        if (formData.startDate !== originalData.startDate) {
            changes.startDate = { old: originalData.startDate, new: formData.startDate };
        }
        if (formData.endDate !== originalData.endDate) {
            changes.endDate = { old: originalData.endDate, new: formData.endDate };
        }
        if (formData.description !== originalData.description) {
            changes.description = { old: originalData.description, new: formData.description };
        }
        if (imageFile) {
            changes.imageUrl = { old: 'Existing Image', new: imageFile.name };
        }
        return changes;
    };

    const handleSaveConfirmation = (e) => {
        e.preventDefault();
        askConfirmation(
            "Save Changes?",
            "Are you sure you want to update this poster?",
            handleActualSave,
            "primary"
        );
    };

    const handleActualSave = async () => {
        setSubmitting(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('status', formData.status);
            formDataToSend.append('startDate', formData.startDate);
            formDataToSend.append('endDate', formData.endDate);
            formDataToSend.append('description', formData.description);

            const { userEmail, adminId } = getAdminData();
            formDataToSend.append("userEmail", userEmail);
            if (adminId) formDataToSend.append("adminId", adminId);

            const changedFields = getChangedFields();
            formDataToSend.append("changedFields", JSON.stringify(changedFields));

            if (imageFile) {
                formDataToSend.append('imageUrl', imageFile);
            }

            await axios.put(`https://wanderwaveph-backend.onrender.com/api/posters/update/${id}`, formDataToSend);

            toast.success('Poster updated successfully!');
            await clearDraft();
            navigate('/view-posters');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update poster. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDiscard = () => {
        askConfirmation(
            "Cancel Editing?",
            "Are you sure you want to cancel? Any unsaved changes and drafts will be cleared.",
            async () => {
                await clearDraft();
                navigate('/view-posters');
            },
            "danger"
        );
    };

    if (isLoading) {
        return (
            <div className="epo-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`epo-main ${isSidebarCollapsed ? "epo-main--collapsed" : ""}`}>
                    <div className="epo-loading">
                        <div className="epo-spinner"></div>
                        <p>Loading poster data...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="epo-page">
            
            <RestoreDraftModal
                isOpen={showRestoreModal}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
                draftInfo={draftInfo}
            />

            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            
            <main className={`epo-main ${isSidebarCollapsed ? "epo-main--collapsed" : ""}`}>
                <div className="epo-container">
                    
                    <header className="epo-header">
                        <div className="epo-header-content">
                            <button className="epo-back-btn" onClick={handleDiscard}>
                                <ArrowLeft size={18} />
                                Back to Posters
                            </button>
                            <h1 className="epo-title">EDIT POSTER</h1>
                            <p className="epo-subtitle">Update poster visuals and display settings</p>
                        </div>
                    </header>

                    <form onSubmit={handleSaveConfirmation} className="epo-form">
                        
                        <div className="epo-section">
                            <h2 className="epo-section-title">Poster Visual</h2>
                            <div className="epo-upload-area">
                                <input
                                    type="file"
                                    id="posterImageUpload"
                                    className="epo-file-input"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <label htmlFor="posterImageUpload" className="epo-upload-label">
                                    {imagePreview ? (
                                        <div className="epo-image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <div className="epo-image-overlay">
                                                <Upload size={32} />
                                                <span>Click to change image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="epo-upload-placeholder">
                                            <Upload size={48} />
                                            <span>Click to upload poster image</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        <div className="epo-section">
                            <h2 className="epo-section-title">Poster Details</h2>
                            <div className="epo-form-grid">
                                <div className="epo-form-group">
                                    <label className="epo-label">Title *</label>
                                    <input 
                                        type="text" 
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="epo-input"
                                        placeholder="e.g. Summer Sale Banner"
                                    />
                                </div>

                                <div className="epo-form-group">
                                    <label className="epo-label">Status *</label>
                                    <select 
                                        name="status" 
                                        value={formData.status} 
                                        onChange={handleInputChange}
                                        className="epo-select"
                                        required
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                        <option value="Scheduled">Scheduled</option>
                                    </select>
                                </div>

                                <div className="epo-form-group">
                                    <label className="epo-label">Start Date</label>
                                    <input 
                                        type="date" 
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className="epo-input"
                                    />
                                </div>

                                <div className="epo-form-group">
                                    <label className="epo-label">End Date</label>
                                    <input 
                                        type="date" 
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className="epo-input"
                                    />
                                </div>

                                <div className="epo-form-group epo-form-group--full">
                                    <label className="epo-label">Description</label>
                                    <textarea 
                                        name="description"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        className="epo-textarea"
                                        rows="4"
                                        placeholder="Internal notes or description..."
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <div className="epo-form-actions">
                            <button 
                                type="button" 
                                className="epo-btn epo-btn--cancel" 
                                onClick={handleDiscard}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="epo-btn epo-btn--submit" 
                                disabled={submitting}
                            >
                                {submitting ? (
                                    'Updating...' 
                                ) : (
                                    <>
                                        <Save size={18} /> Update Poster
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* ✅ Confirmation Modal */}
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

export default EditPoster;