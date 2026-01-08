import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; // Ensure correct path
import './EditBlog.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// 🔥🔥🔥 HELPER FUNCTION - GET ADMIN DATA (For Activity Logs) 🔥🔥🔥
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

const EditBlog = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        category: '',
        status: 'Published',
        content: ''
    });

    // Store original data to track changes for Activity Logs
    const [originalData, setOriginalData] = useState(null);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Helper to construct image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:5000/${imagePath.replace(/\\/g, '/')}`;
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

            // Check if form is effectively empty/default (to prevent saving empty state on load)
            const isFormEmpty = 
                !formData.title && 
                !formData.author && 
                !formData.category && 
                !formData.content && 
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
                originalId: id // Store ID to ensure we only restore draft for THIS blog
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
        
        // Safety check: Ensure the draft belongs to the blog we are currently editing
        if (data.originalId && data.originalId !== id) {
            console.warn("Draft found but belongs to a different blog ID. Ignoring.");
            return;
        }

        setFormData({
            title: data.title || '',
            author: data.author || '',
            category: data.category || '',
            status: data.status || 'Published',
            content: data.content || ''
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
        module: `edit-blog-${id}`, // Unique ID per blog post to avoid conflicts
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

    // Fetch Blog Data
    useEffect(() => {
        const fetchBlogDetails = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/blogs/${id}`);
                if (!response.ok) throw new Error('Failed to fetch blog details');
                
                const data = await response.json();
                
                // Set Original Data for Activity Logging comparison
                setOriginalData(data);

                setFormData({
                    title: data.title || '',
                    author: data.author || '',
                    category: data.category || '',
                    status: data.status || 'Published',
                    content: data.content || ''
                });

                if (data.imageUrl) {
                    setImagePreview(getImageUrl(data.imageUrl));
                }
            } catch (err) {
                console.error(err);
                alert('Could not load blog details. Please check connection.');
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchBlogDetails();
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

        const { userEmail, adminId } = getAdminData(); // 🔥 Get current admin info

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.title);
            formDataToSend.append("author", formData.author);
            formDataToSend.append("category", formData.category);
            formDataToSend.append("status", formData.status);
            formDataToSend.append("content", formData.content);

            // 🔥 Activity Logs: Append Admin Data
            formDataToSend.append("userEmail", userEmail);
            formDataToSend.append("adminId", adminId);

            // 🔥 Activity Logs: Track Changes Logic
            let changes = [];
            if (originalData) {
                if (originalData.title !== formData.title) changes.push(`Title changed from "${originalData.title}" to "${formData.title}"`);
                if (originalData.author !== formData.author) changes.push(`Author changed from "${originalData.author}" to "${formData.author}"`);
                if (originalData.category !== formData.category) changes.push(`Category changed from "${originalData.category}" to "${formData.category}"`);
                if (originalData.status !== formData.status) changes.push(`Status changed from "${originalData.status}" to "${formData.status}"`);
                // Note: Content might be too long to log specifically, so we just note it changed
                if (originalData.content !== formData.content) changes.push(`Blog content was updated.`);
                
                if (imageFile) {
                    changes.push(`Cover image was replaced.`);
                }
            }
            
            // Send the changes summary to backend (backend can choose to use it or generate its own)
            if (changes.length > 0) {
                formDataToSend.append("changes", JSON.stringify(changes)); 
            }

            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            const response = await fetch(`http://localhost:5000/api/blogs/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Failed to update blog');
            }

            alert('✅ Blog post updated successfully!');
            
            // ✅ CLEAR DRAFT ON SUCCESS
            await clearDraft();
            
            navigate('/view-blogs'); 
        } catch (err) {
            console.error(err);
            alert('❌ Failed to update blog. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="ebl-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`ebl-main ${isSidebarCollapsed ? "ebl-main--collapsed" : ""}`}>
                    <div className="ebl-loading">
                        <div className="ebl-spinner"></div>
                        <p>Loading blog data...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="ebl-page">
            
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
            
            <main className={`ebl-main ${isSidebarCollapsed ? "ebl-main--collapsed" : ""}`}>
                <div className="ebl-container">
                    
                    {/* Header */}
                    <header className="ebl-header">
                        <div className="ebl-header-content">
                            <button className="ebl-back-btn" onClick={() => navigate('/view-blogs')}>
                                <ArrowLeft size={18} />
                                Back to Blogs
                            </button>
                            <h1 className="ebl-title">EDIT BLOG</h1>
                            <p className="ebl-subtitle">Update article content and settings</p>
                        </div>
                    </header>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="ebl-form">
                        
                        {/* Section 1: Cover Image */}
                        <div className="ebl-section">
                            <h2 className="ebl-section-title">Cover Image</h2>
                            <div className="ebl-upload-area">
                                <input
                                    type="file"
                                    id="blogImageUpload"
                                    className="ebl-file-input"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                />
                                <label htmlFor="blogImageUpload" className="ebl-upload-label">
                                    {imagePreview ? (
                                        <div className="ebl-image-preview">
                                            <img src={imagePreview} alt="Preview" />
                                            <div className="ebl-image-overlay">
                                                <Upload size={32} />
                                                <span>Click to change cover image</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="ebl-upload-placeholder">
                                            <Upload size={48} />
                                            <span>Click to upload cover image</span>
                                        </div>
                                    )}
                                </label>
                            </div>
                        </div>

                        {/* Section 2: Blog Details */}
                        <div className="ebl-section">
                            <h2 className="ebl-section-title">Article Details</h2>
                            <div className="ebl-form-grid">
                                <div className="ebl-form-group">
                                    <label className="ebl-label">Title *</label>
                                    <input 
                                        type="text" 
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="ebl-input"
                                        placeholder="Enter blog title"
                                    />
                                </div>

                                <div className="ebl-form-group">
                                    <label className="ebl-label">Author *</label>
                                    <input 
                                        type="text" 
                                        name="author"
                                        value={formData.author}
                                        onChange={handleInputChange}
                                        required
                                        className="ebl-input"
                                        placeholder="Author name"
                                    />
                                </div>

                                <div className="ebl-form-group">
                                    <label className="ebl-label">Category *</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        required
                                        className="ebl-select"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="Trending Stories">Trending Stories</option>
                                        <option value="Travel Guide">Travel Guide</option>
                                        <option value="News & Updates">News & Updates</option>
                                        <option value="Latest Promos">Latest Promos</option>
                                        <option value="Travel Tips">Travel Tips</option>
                                    </select>
                                </div>

                                <div className="ebl-form-group">
                                    <label className="ebl-label">Status *</label>
                                    <select 
                                        name="status" 
                                        value={formData.status} 
                                        onChange={handleInputChange}
                                        className="ebl-select"
                                        required
                                    >
                                        <option value="Published">Published</option>
                                        <option value="Draft">Draft</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Content */}
                        <div className="ebl-section">
                            <h2 className="ebl-section-title">Article Content</h2>
                            <div className="ebl-form-group">
                                <textarea 
                                    name="content"
                                    value={formData.content}
                                    onChange={handleInputChange}
                                    required
                                    className="ebl-textarea"
                                    placeholder="Write your article content here..."
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="ebl-form-actions">
                            <button 
                                type="button" 
                                className="ebl-btn ebl-btn--cancel" 
                                onClick={async () => {
                                    await clearDraft(); // Clear draft on cancel
                                    navigate('/view-blogs');
                                }}
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                className="ebl-btn ebl-btn--submit" 
                                disabled={submitting}
                            >
                                {submitting ? (
                                    'Updating...' 
                                ) : (
                                    <>
                                        <Save size={18} /> Update Blog
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

export default EditBlog;