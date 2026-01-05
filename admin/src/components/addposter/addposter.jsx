import React, { useState, useEffect } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './addposter.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

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
            // 🛑 FIX 1: Check if form is completely empty/default before saving
            // This prevents overwriting a valid draft with an empty one, or saving an empty start state
            const isFormEmpty = 
                !posterDetails.title &&
                !posterDetails.description &&
                !posterDetails.startDate &&
                !posterDetails.endDate &&
                posterDetails.status === 'Active' && // Check default
                !imageFile;

            if (isFormEmpty) {
                setDraftPayload(null); // Do not save anything
                return;
            }

            let imageBase64 = null;
            let imageMeta = null;

            // Handle Image Conversion
            if (imageFile) {
                try {
                    // Limit draft image size (~3MB limit safety)
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
                image: imageBase64, // Saved as Base64 string
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500); // Debounce

        return () => clearTimeout(timeoutId);
    }, [posterDetails, imageFile]);

    // 4. Restore Function
    const restoreDraftData = async (data) => {
        if (!data) return;

        // Restore Text Fields
        setPosterDetails({
            title: data.title || '',
            description: data.description || '',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            status: data.status || 'Active'
        });

        // Restore Image
        if (data.image && data.imageMeta) {
            try {
                const restoredFile = await base64ToFile(data.image, data.imageMeta.name, data.imageMeta.type);
                setImageFile(restoredFile);
                setImagePreview(URL.createObjectURL(restoredFile));
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
        module: 'add-poster', // Unique ID
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview, 
        autoRestore: false // Manual via modal
    });

    // 6. Modal State with Smart Check
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft && draftInfo) {
            // 🛑 FIX 2: Check if the *saved* draft is actually empty (contains only defaults)
            // If it is empty, silently clear it and DO NOT show the modal
            const isDraftEmpty = 
                !draftInfo.title && 
                !draftInfo.description && 
                !draftInfo.startDate && 
                !draftInfo.endDate && 
                (draftInfo.status === 'Active' || !draftInfo.status) && 
                !draftInfo.image;

            if (isDraftEmpty) {
                clearDraft(); // Auto-clear ghost drafts
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
        await discardDraft(); // Ensure storage is cleared
        setShowRestoreModal(false);
        
        // Reset state to defaults to ensure isFormEmpty logic takes over
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
                alert('Please upload a valid image file (JPG, PNG).');
                return;
            }
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };

    const removeImage = () => {
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImageFile(null);
        setImagePreview(null);
    };

    const handleCancel = async () => {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            // ✅ CLEAR DRAFT ON CANCEL
            await clearDraft();

            setPosterDetails({
                title: '',
                description: '',
                startDate: '',
                endDate: '',
                status: 'Active'
            });
            removeImage();
        }
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
            const response = await fetch('https://wanderwaveph-backend.onrender.com/api/posters/add', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                alert('✅ Poster uploaded successfully!');
                
                // ✅ CLEAR DRAFT ON SUCCESS
                await clearDraft();
                
                // Reset Form manually
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
            
            {/* ✅ RESTORE DRAFT MODAL */}
            <RestoreDraftModal
                isOpen={showRestoreModal}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
                draftInfo={draftInfo}
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