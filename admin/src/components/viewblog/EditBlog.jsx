import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, HelpCircle, Calendar } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditBlog.css';

// ✅ Imports for Draft Functionality
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';

// ✅ Import Toast Management
import { useToast } from '../toast/ToastManager';

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

// ✅ Custom Confirm Modal Component
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
            type="button"
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            type="button"
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

const EditBlog = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const toast = useToast(); 

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // ✅ State para sa Confirmation Modal
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    // Form State (Now includes scheduledAt)
    const [formData, setFormData] = useState({
        title: '',
        author: '',
        category: '',
        status: 'Published',
        content: '',
        scheduledAt: '' // ✅ Added
    });

    // Store original data to track changes for Activity Logs
    const [originalData, setOriginalData] = useState(null);

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

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

    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `http://localhost:5000/${imagePath.replace(/\\/g, '/')}`;
    };

    // Helper: Convert ISO Date to Input compatible string (YYYY-MM-DDTHH:MM)
    const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        // Adjust for local timezone offset manually to fit input type="datetime-local"
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
        return localISOTime;
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

        setFormData(prev => ({
            ...prev,
            title: data.title || prev.title,
            author: data.author || prev.author,
            category: data.category || prev.category,
            status: data.status || prev.status,
            content: data.content || prev.content,
            scheduledAt: data.scheduledAt || prev.scheduledAt // ✅ Restore scheduled date
        }));

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
        `edit-blog-${id}`,
        draftPayload,
        restoreDraftData
    );

    // =========================================================
    // ✅ AUTO-DRAFT LOGIC END
    // =========================================================

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/blogs/${id}`);
                if (!response.ok) throw new Error('Blog not found');
                
                const blog = await response.json();
                
                // Format date for input if it exists
                const formattedDate = blog.scheduledAt ? formatDateForInput(blog.scheduledAt) : '';

                const data = {
                    title: blog.title || '',
                    author: blog.author || '',
                    category: blog.category || '',
                    status: blog.status || 'Published',
                    content: blog.content || '',
                    scheduledAt: formattedDate // ✅ Populate
                };

                setFormData(data);
                setOriginalData(data); // Important for tracking changes

                if (blog.imageUrl) {
                    setImagePreview(getImageUrl(blog.imageUrl));
                }

                setIsLoading(false);
            } catch (err) {
                console.error(err);
                toast.error('Failed to load blog data.');
                setIsLoading(false);
            }
        };

        fetchBlog();
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
        if (formData.title !== originalData.title) changes.title = { old: originalData.title, new: formData.title };
        if (formData.author !== originalData.author) changes.author = { old: originalData.author, new: formData.author };
        if (formData.category !== originalData.category) changes.category = { old: originalData.category, new: formData.category };
        if (formData.status !== originalData.status) changes.status = { old: originalData.status, new: formData.status };
        if (formData.content !== originalData.content) changes.content = { old: originalData.content, new: formData.content };
        // ✅ Track Schedule Change
        if (formData.status === 'Scheduled' && formData.scheduledAt !== originalData.scheduledAt) {
            changes.scheduledAt = { old: originalData.scheduledAt, new: formData.scheduledAt };
        }
        if (imageFile) {
            changes.imageUrl = { old: 'Existing Image', new: imageFile.name };
        }
        return changes;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ Validation for Scheduled Posts
        if (formData.status === "Scheduled") {
            if (!formData.scheduledAt) {
                toast.warning("Please select a date and time for the scheduled post.", "⚠️ Missing Date");
                return;
            }
            const scheduleDate = new Date(formData.scheduledAt);
            const now = new Date();
            // Optional: allow editing to a close future time, strict check might block quick edits
            if (scheduleDate <= now) {
                toast.warning("Scheduled time must be in the future.", "⚠️ Invalid Date");
                return;
            }
        }

        setSubmitting(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('title', formData.title);
            formDataToSend.append('author', formData.author);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('status', formData.status);
            formDataToSend.append('content', formData.content);

            // ✅ Append scheduled date if status is scheduled
            if (formData.status === "Scheduled" && formData.scheduledAt) {
                formDataToSend.append("scheduledAt", formData.scheduledAt);
            }

            const { userEmail, adminId } = getAdminData();
            formDataToSend.append("userEmail", userEmail);
            if (adminId) formDataToSend.append("adminId", adminId);

            const changedFields = getChangedFields();
            formDataToSend.append("changedFields", JSON.stringify(changedFields));

            if (imageFile) {
                formDataToSend.append('imageUrl', imageFile);
            }

            const response = await fetch(`http://localhost:5000/api/blogs/update/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (!response.ok) throw new Error('Failed to update blog');

            const successMsg = formData.status === 'Scheduled' 
                ? 'Blog post rescheduled successfully!' 
                : 'Blog updated successfully!';

            toast.success(successMsg);
            await clearDraft();
            navigate('/view-blogs');
        } catch (err) {
            console.error(err);
            toast.error('Failed to update blog. Please try again.');
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
                                        <option value="Scheduled">Scheduled</option> {/* ✅ Added Option */}
                                    </select>
                                </div>

                                {/* ✅ CONDITIONAL DATE FIELD */}
                                {formData.status === 'Scheduled' && (
                                    <div className="ebl-form-group ebl-form-group--full">
                                        <label className="ebl-label" style={{display:'flex', gap:'5px', alignItems:'center'}}>
                                            <Calendar size={14}/> Schedule Date & Time *
                                        </label>
                                        <input
                                            type="datetime-local"
                                            name="scheduledAt"
                                            value={formData.scheduledAt}
                                            onChange={handleInputChange}
                                            required={formData.status === 'Scheduled'}
                                            className="ebl-input"
                                        />
                                    </div>
                                )}
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
                                onClick={() => {
                                    askConfirmation(
                                        "Cancel Editing",
                                        "Are you sure you want to cancel? Any unsaved changes and drafts will be cleared.",
                                        async () => {
                                            await clearDraft();
                                            navigate('/view-blogs');
                                        },
                                        "danger"
                                    );
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
                                        <Save size={18} /> 
                                        {formData.status === 'Scheduled' ? 'Schedule Update' : 'Update Blog'} 
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            {/* ✅ Confirmation Modal Implementation */}
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

export default EditBlog;