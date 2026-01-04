import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, Calendar } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; // Ensure correct path
import './EditPoster.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

const EditPoster = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        status: 'Active',
        startDate: '',
        endDate: '',
        description: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
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
            // 🛑 FIX: Don't save draft if data is still loading or form is empty
            if (isLoading) {
                setDraftPayload(null);
                return;
            }

            // Check if form is effectively empty/default
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
                ...formData,
                image: imageBase64, // Saved as Base64 string
                imageMeta: imageMeta,
                originalId: id // Store ID to ensure we only restore draft for THIS poster
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500); // Debounce

        return () => clearTimeout(timeoutId);
    }, [formData, imageFile, isLoading, id]);

    // 4. Restore Function
    const restoreDraftData = async (data) => {
        if (!data) return;
        
        // Safety check: Ensure the draft belongs to the poster we are currently editing
        if (data.originalId && data.originalId !== id) {
            console.warn("Draft found but belongs to a different poster ID. Ignoring.");
            return;
        }

        setFormData({
            title: data.title || '',
            status: data.status || 'Active',
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            description: data.description || ''
        });

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
        module: `edit-poster-${id}`, // Unique ID per poster to avoid conflicts
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview, 
        autoRestore: false // Manual via modal
    });

    // 6. Modal State
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        // Only show modal if we have a draft AND we are done loading the original data
        if (hasDraft && !isLoading) {
            setShowRestoreModal(true);
        }
    }, [hasDraft, isLoading]);

    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
    };

    const handleDiscardDraft = async () => {
        await discardDraft(); // Ensure storage is cleared
        setShowRestoreModal(false);
    };

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    // Fetch Poster Data
    useEffect(() => {
        const fetchPosterDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/posters/${id}`);
                if (!response.ok) throw new Error('Failed to fetch poster details');
                
                const data = await response.json();
                
                // Only update state if not restoring a draft immediately (handled by logic above)
                setFormData({
                    title: data.title || '',
                    status: data.status || 'Active',
                    startDate: formatDateForInput(data.startDate),
                    endDate: formatDateForInput(data.endDate),
                    description: data.description || ''
                });

                if (data.imageUrl) {
                    setImagePreview(`http://localhost:5000/${data.imageUrl}`);
                }
            } catch (err) {
                console.error(err);
                alert('Could not load poster details. Please check connection.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchPosterDetails();
        }
    }, [id]);

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
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.title);
            formDataToSend.append("status", formData.status);
            formDataToSend.append("startDate", formData.startDate);
            formDataToSend.append("endDate", formData.endDate);
            formDataToSend.append("description", formData.description);

            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            const response = await fetch(`http://localhost:5000/api/posters/update/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Failed to update poster');
            }

            alert('✅ Poster updated successfully!');
            
            // ✅ CLEAR DRAFT ON SUCCESS
            await clearDraft();
            
            navigate('/view-posters'); 
        } catch (err) {
            console.error(err);
            alert('❌ Failed to update poster. Please try again.');
        } finally {
            setSubmitting(false);
        }
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
            
            {/* ✅ RESTORE DRAFT MODAL */}
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
                    
                    {/* Header */}
                    <header className="epo-header">
                        <div className="epo-header-content">
                            <button className="epo-back-btn" onClick={() => navigate('/view-posters')}>
                                <ArrowLeft size={18} />
                                Back to Posters
                            </button>
                            <h1 className="epo-title">EDIT POSTER</h1>
                            <p className="epo-subtitle">Update poster visuals and display settings</p>
                        </div>
                    </header>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="epo-form">
                        
                        {/* Section 1: Image Upload */}
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

                        {/* Section 2: Poster Details */}
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

                        {/* Footer Actions */}
                        <div className="epo-form-actions">
                            <button 
                                type="button" 
                                className="epo-btn epo-btn--cancel" 
                                onClick={async () => {
                                    await clearDraft(); // Clear draft on cancel
                                    navigate('/view-posters');
                                }}
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
        </div>
    );
};

export default EditPoster;