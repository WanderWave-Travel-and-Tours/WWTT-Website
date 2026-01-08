import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, User, Loader2, X, AlertTriangle, HelpCircle } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useNavigate } from 'react-router-dom';
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';
import { useToast } from '../toast/ToastManager'; // Gagamitin ang Toast
import './addblog.css';
 
// --- INTEGRATED CUSTOM CONFIRM MODAL DESIGN FROM EDITVISA ---
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
          <div style={{
            marginBottom: '1rem', display: 'flex', justifyContent: 'center'
          }}>
            <div style={{
              padding: '1rem', borderRadius: '50%',
              backgroundColor: type === 'danger' ? '#fee2e2' : '#e0f2fe',
              color: type === 'danger' ? '#ef4444' : '#0ea5e9'
            }}>
              <AlertTriangle size={32} />
            </div>
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
          <p style={{ color: '#64748b', marginBottom: '2rem', lineHeight: '1.5' }}>{message}</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={onCancel} style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', color: '#64748b', fontWeight: '500', cursor: 'pointer'
            }}>
              Cancel
            </button>
            <button onClick={onConfirm} style={{
              padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none',
              backgroundColor: type === 'danger' ? '#ef4444' : '#0ea5e9',
              color: 'white', fontWeight: '500', cursor: 'pointer'
            }}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
};
 
const AddBlog = () => {
    const navigate = useNavigate();
    const toast = useToast(); // Initialize Toast
   
    // --- SIDEBAR LOGIC ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
   
    // --- STATE MANAGEMENT ---
    const [blogDetails, setBlogDetails] = useState({
        title: '',
        author: '',
        category: '',
        content: '',
        status: 'Published'
    });
 
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
 
    // --- UPDATED CONFIRMATION MODAL STATE (ALIGNED WITH EDITVISA) ---
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: '',
        message: '',
        type: 'primary',
        onConfirm: () => {}
    });
 
    const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com';
 
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
                !blogDetails.title &&
                !blogDetails.author &&
                !blogDetails.category &&
                !blogDetails.content &&
                blogDetails.status === 'Published' &&
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
                ...blogDetails,
                image: imageBase64,
                imageMeta: imageMeta
            });
        };
 
        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500);
 
        return () => clearTimeout(timeoutId);
    }, [blogDetails, imageFile]);
 
    const restoreDraftData = async (data) => {
        if (!data) return;
        setBlogDetails({
            title: data.title || '',
            author: data.author || '',
            category: data.category || '',
            content: data.content || '',
            status: data.status || 'Published'
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
        module: 'add-blog',
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview,
        autoRestore: false
    });
 
    const [showRestoreModal, setShowRestoreModal] = useState(false);
 
    useEffect(() => {
        if (hasDraft) {
            setShowRestoreModal(true);
        }
    }, [hasDraft]);
 
    const handleRestoreDraft = () => {
        restoreDraft();
        setShowRestoreModal(false);
        toast.info("Draft restored successfully.");
    };
 
    const handleDiscardDraft = async () => {
        await discardDraft();
        setShowRestoreModal(false);
        toast.warning("Draft discarded.");
    };
 
    // =========================================================
    // CLEANUP IMAGE PREVIEW
    // =========================================================
    useEffect(() => {
        return () => {
            if (imagePreview) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);
 
    const handleChange = (e) => {
        const { name, value } = e.target;
        setBlogDetails(prev => ({
            ...prev,
            [name]: value
        }));
    };
 
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please upload a valid image file (JPG, PNG).');
                return;
            }
            setImageFile(file);
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
        }
    };
 
    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };
 
    // Logic for Final Submission
    const executeSubmit = async () => {
        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('title', blogDetails.title);
            formData.append('author', blogDetails.author);
            formData.append('category', blogDetails.category);
            formData.append('content', blogDetails.content);
            formData.append('status', blogDetails.status);
            formData.append('image', imageFile);
 
            try {
                const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
                const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
                const activeId = adminData.id || adminData._id || "";
                formData.append("userEmail", activeUser);
                formData.append("adminId", activeId);
            } catch (err) {
                console.error("Error parsing admin data:", err);
            }
 
            const response = await fetch(`${API_BASE_URL}/api/blogs/add`, {
                method: 'POST',
                body: formData,
            });
 
            const result = await response.json();
 
            if (response.ok) {
                toast.success('Blog post created successfully!');
                await clearDraft();
                setBlogDetails({
                    title: '', author: '', category: '', content: '', status: 'Published'
                });
                setImageFile(null);
                setImagePreview(null);
            } else {
                toast.error(result.message || 'Failed to create blog');
            }
        } catch (error) {
            console.error('Error submitting blog:', error);
            toast.error('Server error. Please check if backend is running.');
        } finally {
            setIsSubmitting(false);
            setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        }
    };
 
    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        if (!blogDetails.title || !blogDetails.content || !imageFile) {
            toast.error('Please provide a title, content, and cover image.');
            return;
        }
 
        setConfirmConfig({
            isOpen: true,
            title: "Publish Blog?",
            message: "Are you sure you want to publish this blog post now?",
            type: "primary",
            onConfirm: executeSubmit
        });
    };
 
    const handleCancel = () => {
        setConfirmConfig({
            isOpen: true,
            title: "Discard Changes?",
            message: "Are you sure you want to cancel? All unsaved changes in this blog post will be lost.",
            type: "danger",
            onConfirm: async () => {
                await clearDraft();
                setBlogDetails({
                    title: '', author: '', category: '', content: '', status: 'Published'
                });
                setImageFile(null);
                setImagePreview(null);
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
                toast.info("Form has been reset.");
            }
        });
    };
 
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
 
    return (
        <div className="blog-page">
           
            <RestoreDraftModal
                isOpen={showRestoreModal}
                onRestore={handleRestoreDraft}
                onDiscard={handleDiscardDraft}
                draftInfo={draftInfo}
            />
 
            {/* ✅ APPLIED: CUSTOM CONFIRM MODAL DESIGN FROM EDITVISA */}
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
           
            <main className={`blog-main ${isSidebarCollapsed ? "blog-main--collapsed" : ""}`}>
                <div className="blog-container">
                    <header className="blog-header">
                        <div className="blog-header-content">
                            <h1 className="blog-title">NEW BLOG</h1>
                            <p className="blog-subtitle">Share travel tips, news, and stories with your audience</p>
                        </div>
                    </header>
 
                    <form onSubmit={handleSubmit}>
                        <div className="blog-grid">
                            <div className="blog-left">
                                <section className="blog-section">
                                    <h2 className="blog-section-title">BLOG COVER IMAGE</h2>
                                    {!imagePreview ? (
                                        <div className="b-upload-zone-wrapper">
                                            <label className="b-upload-label-poster" style={{ cursor: 'pointer' }}>
                                                <input
                                                    type="file"
                                                    id="blog-upload"
                                                    accept="image/*"
                                                    onChange={handleImageChange}
                                                    hidden
                                                />
                                                <div className="b-upload-icon-box">
                                                    <Upload size={32} />
                                                </div>
                                                <p style={{ fontWeight: '700', color: '#1e293b', margin: '0' }}>Click to upload cover image</p>
                                                <span style={{ fontSize: '12px', color: '#64748b' }}>JPG, PNG or WebP (Max 5MB)</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="b-upload-preview-box">
                                            <img src={imagePreview} alt="Preview" />
                                            <div className="b-upload-actions">
                                                <label className="b-upload-change-btn">
                                                    <input type="file" onChange={handleImageChange} accept="image/*" hidden />
                                                    Change
                                                </label>
                                                <button type="button" className="b-upload-remove-btn" onClick={removeImage}>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </section>
 
                                <section className="blog-section">
                                    <h2 className="blog-section-title">BLOG DETAILS</h2>
                                    <div className="blog-fields">
                                        <div className="blog-field blog-field--full">
                                            <label>Blog Title</label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={blogDetails.title}
                                                onChange={handleChange}
                                                placeholder="e.g., Top 10 Hidden Gems in Palawan"
                                                required
                                            />
                                        </div>
 
                                        <div className="blog-field">
                                            <label>Author</label>
                                            <input
                                                type="text"
                                                name="author"
                                                value={blogDetails.author}
                                                onChange={handleChange}
                                                placeholder="e.g., Admin Team"
                                            />
                                        </div>
 
                                        <div className="blog-field">
                                            <label>Category</label>
                                            <select
                                                name="category"
                                                value={blogDetails.category}
                                                onChange={handleChange}
                                            >
                                                <option value="" disabled>Select Category</option>
                                                <option value="Trending Stories">Trending Stories</option>
                                                <option value="Travel Guide">Travel Guide</option>
                                                <option value="News & Updates">News & Updates</option>
                                                <option value="Promos">Latest Promos</option>
                                                <option value="Tips">Travel Tips</option>
                                            </select>
                                        </div>
 
                                        <div className="blog-field blog-field--full">
                                            <label>Content Body</label>
                                            <textarea
                                                name="content"
                                                value={blogDetails.content}
                                                onChange={handleChange}
                                                placeholder="Write your story here..."
                                                rows="10"
                                                required
                                            ></textarea>
                                        </div>
 
                                        <div className="blog-field">
                                            <label>Status</label>
                                            <select
                                                name="status"
                                                value={blogDetails.status}
                                                onChange={handleChange}
                                            >
                                                <option value="Published">Published</option>
                                                <option value="Draft">Draft</option>
                                            </select>
                                        </div>
                                    </div>
                                </section>
                            </div>
 
                            <aside className="blog-right">
                                <div className="blog-preview-card">
                                    <span className="blog-preview-label">BLOG PREVIEW</span>
                                   
                                    <div className="bp-card">
                                        <div className="bp-image-wrapper">
                                            {imagePreview ? (
                                                <img src={imagePreview} alt="Blog Cover" />
                                            ) : (
                                                <div className="bp-placeholder">
                                                    <FileText size={40} />
                                                </div>
                                            )}
                                            {blogDetails.category && (
                                                <span className="bp-category-tag">{blogDetails.category}</span>
                                            )}
                                        </div>
                                       
                                        <div className="bp-content">
                                            <h3 className="bp-title">
                                                {blogDetails.title || 'Your Blog Title Here'}
                                            </h3>
                                           
                                            <div className="bp-meta">
                                                <div className="bp-meta-item">
                                                    <User size={12} />
                                                    <span>{blogDetails.author || 'Author'}</span>
                                                </div>
                                                <div className="bp-meta-item">
                                                    <span>• {currentDate}</span>
                                                </div>
                                            </div>
 
                                            <p className="bp-excerpt">
                                                {blogDetails.content
                                                    ? blogDetails.content.substring(0, 100) + '...'
                                                    : 'Preview of your blog content will appear here...'}
                                            </p>
 
                                            <div className="bp-readmore">Read Article →</div>
                                        </div>
                                    </div>
                                </div>
 
                                <div className="blog-actions">
                                    <button
                                        type="button"
                                        className="blog-btn blog-btn--cancel"
                                        onClick={handleCancel}
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="blog-btn blog-btn--submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="vb-spinner" size={18} /> Processing...</>
                                        ) : 'Publish'}
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
 
export default AddBlog;