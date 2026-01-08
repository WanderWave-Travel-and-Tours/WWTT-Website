import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../sidebar/sidebar';
import './EditPoster.css';

// ✅ Imports for Draft Functionality
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

    // Store original data to track changes for Activity Logs
    const [originalData, setOriginalData] = useState(null);

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

    const { 
        clearDraft, 
        hasDraft, 
        restoreDraft, 
        discardDraft,
        draftInfo 
    } = useAutoDraft({
        module: `edit-poster-${id}`,
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview, 
        autoRestore: false
    });

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

    // Fetch Poster Data
    useEffect(() => {
        const fetchPosterDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:5000/api/posters/${id}`);
                const data = response.data;
                
                // Set Original Data for Activity Logging comparison
                setOriginalData(data);
                
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

    // ✅ UPDATED: Handle Submit LOGIC for Activity Logs
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        const { userEmail, adminId } = getAdminData(); // 🔥 Get current admin info

        try {
            const formDataToSend = new FormData();
            
            // Append standard fields
            formDataToSend.append("title", formData.title);
            formDataToSend.append("status", formData.status);
            formDataToSend.append("startDate", formData.startDate);
            formDataToSend.append("endDate", formData.endDate);
            formDataToSend.append("description", formData.description);

            // 🔥 Activity Logs: Append Admin Data
            formDataToSend.append("userEmail", userEmail);
            formDataToSend.append("adminId", adminId);

            // 🔥 Activity Logs: Track Changes Logic
            let changes = [];
            
            const trackChange = (label, oldVal, newVal) => {
                const cleanOld = String(oldVal || "").trim();
                const cleanNew = String(newVal || "").trim();
                // Avoid logging if both are empty/null effectively
                if (cleanOld !== cleanNew) {
                    changes.push(`${label} changed from "${cleanOld || 'None'}" to "${cleanNew}"`);
                }
            };

            if (originalData) {
                trackChange("Title", originalData.title, formData.title);
                trackChange("Status", originalData.status, formData.status);
                trackChange("Start Date", formatDateForInput(originalData.startDate), formData.startDate);
                trackChange("End Date", formatDateForInput(originalData.endDate), formData.endDate);
                trackChange("Description", originalData.description, formData.description);
                
                if (imageFile) {
                    changes.push(`Poster image was replaced.`);
                }
            }

            // Explicitly append changes as JSON string so backend can parse it
            if (changes.length > 0) {
                formDataToSend.append("changes", JSON.stringify(changes)); 
            }

            // Append Image if new one exists
            if (imageFile) {
                formDataToSend.append("image", imageFile);
                if (originalData && originalData.imagePublicId) {
                    formDataToSend.append("imagePublicId", originalData.imagePublicId);
                }
            }

            // ✅ Using axios.put (Correct way to send FormData with logs)
            // Note: Assuming route is /update/:id based on common pattern, verify route in router file
            const response = await axios.put(`http://localhost:5000/api/posters/update/${id}`, formDataToSend);

            if (response.data) {
                alert('✅ Poster updated successfully!');
                await clearDraft(); // Clear draft on success
                navigate('/view-posters'); 
            }
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