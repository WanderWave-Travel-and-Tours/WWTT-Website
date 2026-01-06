import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, User, Loader2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useNavigate } from 'react-router-dom'; 
import useAutoDraft from '../../hooks/useAutoDraft';
import RestoreDraftModal from '../../components/RestoreDraftModal/RestoreDraftModal';
import './addblog.css';

const AddBlog = () => {
    const navigate = useNavigate();
    
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

    const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com'; 

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
            // 🛑 FIX: Check if form is completely empty/default before saving
            const isFormEmpty = 
                !blogDetails.title &&
                !blogDetails.author &&
                !blogDetails.category &&
                !blogDetails.content &&
                blogDetails.status === 'Published' && // Check default
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
                ...blogDetails,
                image: imageBase64, // Saved as Base64 string
                imageMeta: imageMeta
            });
        };

        const timeoutId = setTimeout(() => {
            updateDraft();
        }, 500); // Debounce

        return () => clearTimeout(timeoutId);
    }, [blogDetails, imageFile]);

    // 4. Restore Function
    const restoreDraftData = async (data) => {
        if (!data) return;

        // Restore Blog Details
        setBlogDetails({
            title: data.title || '',
            author: data.author || '',
            category: data.category || '',
            content: data.content || '',
            status: data.status || 'Published'
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
        module: 'add-blog', // Unique ID
        formData: draftPayload,
        setFormData: restoreDraftData,
        imagePreview: imagePreview, 
        autoRestore: false // Manual via modal
    });

    // 6. Modal State
    const [showRestoreModal, setShowRestoreModal] = useState(false);

    useEffect(() => {
        if (hasDraft) {
            setShowRestoreModal(true);
        }
    }, [hasDraft]);

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
                alert('Please upload a valid image file (JPG, PNG).');
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

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!blogDetails.title || !blogDetails.content || !imageFile) {
            alert('Please provide a title, content, and cover image.');
            return;
        }

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
                
                console.log("Submitting Blog by:", activeUser);
            } catch (err) {
                console.error("Error parsing admin data:", err);
            }

            const response = await fetch(`${API_BASE_URL}/api/blogs/add`, {
                method: 'POST',
                body: formData, 
            });

            const result = await response.json();

            if (response.ok) {
                alert('✅ Blog post created successfully!');
                
                // ✅ CLEAR DRAFT ON SUCCESS
                await clearDraft();
                
                // Manually reset form since handleCancel has confirm logic
                setBlogDetails({
                    title: '',
                    author: '',
                    category: '',
                    content: '',
                    status: 'Published'
                });
                setImageFile(null);
                setImagePreview(null);

            } else {
                alert(`❌ Error: ${result.message || 'Failed to create blog'}`);
            }

        } catch (error) {
            console.error('Error submitting blog:', error);
            alert('❌ Server error. Please check if backend is running.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = async () => {
        if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            // ✅ CLEAR DRAFT ON CANCEL
            await clearDraft();

            setBlogDetails({
                title: '',
                author: '',
                category: '',
                content: '',
                status: 'Published'
            });
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="blog-page">
            
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