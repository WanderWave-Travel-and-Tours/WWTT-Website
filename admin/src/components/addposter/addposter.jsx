import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon, HelpCircle, X } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './addposter.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ Imports for Toast Notifications
import { useToast } from '../toast/ToastManager';

// --- CUSTOM CONFIRMATION MODAL COMPONENT ---
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

const AddPoster = () => {
    // --- UTILITIES ---
    const toast = useToast();

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

    // --- CONFIRMATION MODAL STATE ---
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
                !posterDetails.title &&
                !posterDetails.description &&
                !posterDetails.startDate &&
                !posterDetails.endDate &&
                posterDetails.status === 'Active' && 
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
                ...posterDetails,
                image: imageBase64,
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [posterDetails, imageFile]);

    const restoreDraftData = async (data) => {
        if (!data) return;

        setPosterDetails({
            title: data.title || '',
            description: data.description || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            status: data.status || 'Active'
        });

        if (data.image && data.imageMeta) {
            try {
                const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
                setImageFile(restoredFile);
                setImagePreview(URL.createObjectURL(restoredFile));
                toast.info("Draft image and details restored.");
            } catch (err) {
                console.error("Failed to restore image:", err);
            }
        } else {
            toast.info("Draft details restored.");
        }
    };

    const { 
        clearDraft, 
        hasDraft, 
        restoreDraft, 
        discardDraft,
        draftInfo 
    } = useAutoDraft({
        module: 'add-poster',
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview, 
        autoRestore: false 
    });

    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft && draftInfo) {
            const isDraftEmpty = 
                !draftInfo.title && 
                !draftInfo.description && 
                !draftInfo.startDate && 
                !draftInfo.endDate && 
                (draftInfo.status === 'Active' || !draftInfo.status) && 
                !draftInfo.image;

            if (isDraftEmpty) {
                clearDraft();
                setShowRestoreModal(false);
            } else {
                setShowRestoreModal(true);
            }
        }
    }, [hasDraft, draftInfo, clearDraft]);

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
    };

    const handleDiscardDraft = async () => {
        await discardDraft();
        setShowRestoreModal(false);
        setPosterDetails({
            title: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'Active'
        });
        setImageFile(null);
        setImagePreview(null);
        toast.info("Draft discarded.");
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

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
                toast.error('Please upload a valid image file (JPG, PNG).', 'Invalid File');
                return;
            }
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
            toast.success("Image selected successfully.");
        }
    };

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleCancel = () => {
        // ✅ PALIT MULA window.confirm SA CUSTOM MODAL
        askConfirmation(
            "Discard Changes",
            "Are you sure you want to cancel? All unsaved changes will be lost and the draft will be cleared.",
            async () => {
                await clearDraft();
                setPosterDetails({
                    title: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    status: 'Active'
                });
                removeImage();
                toast.info("Form cleared.");
            },
            "danger"
        );
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        
        if (!posterDetails.title || !imageFile) {
            toast.warning('Please provide a title and upload an image.');
            return;
        }

        // ✅ PALIT MULA window.confirm SA CUSTOM MODAL PARA SA UPLOAD
        askConfirmation(
            "Confirm Upload",
            "Are you sure you want to upload this new poster?",
            () => performSubmit()
        );
    };

    const performSubmit = async () => {
        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('title', posterDetails.title);
        formData.append('description', posterDetails.description);
        formData.append('startDate', posterDetails.startDate);
        formData.append('endDate', posterDetails.endDate);
        formData.append('status', posterDetails.status);

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
            const response = await fetch('https://wanderwaveph-backend.onrender.com/api/posters/add', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                toast.success('Poster uploaded successfully!', 'Success');
                await clearDraft();
                
                setPosterDetails({
                    title: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    status: 'Active'
                });
                removeImage();
            } else {
                const data = await response.json();
                toast.error(data.message || 'Failed to upload', 'Server Error');
            }
        } catch (error) {
            toast.error('Failed to connect to server.', 'Connection Error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="apstr-page">
            
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
            
            <main className={`apstr-main ${isSidebarCollapsed ? "apstr-main--collapsed" : ""}`}>
                <div className="apstr-container">
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