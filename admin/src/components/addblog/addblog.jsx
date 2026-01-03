import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, User, Loader2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useNavigate } from 'react-router-dom'; 
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

            // =========================================================
            // 👇 ADDED: KUNIN ANG USER DATA PARA SA ACTIVITY LOGS 👇
            // =========================================================
            try {
                const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
                const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
                const activeId = adminData.id || adminData._id || "";

                formData.append("userEmail", activeUser);
                formData.append("adminId", activeId);
                
                console.log("Submitting Blog by:", activeUser); // Debug log
            } catch (err) {
                console.error("Error parsing admin data:", err);
            }
            // =========================================================

            const response = await fetch(`${API_BASE_URL}/api/blogs/add`, {
                method: 'POST',
                body: formData, 
            });

            const result = await response.json();

            if (response.ok) {
                alert('✅ Blog post created successfully!');
                handleCancel(); 
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

    const handleCancel = () => {
        setBlogDetails({
            title: '',
            author: '',
            category: '',
            content: '',
            status: 'Published'
        });
        setImageFile(null);
        setImagePreview(null);
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className="blog-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            
            <main className={`blog-main ${isSidebarCollapsed ? "blog-main--collapsed" : ""}`}>
                <div className="blog-container">
                    {/* Header Matched to Promo/Poster Style */}
                    <header className="blog-header">
                        <div className="blog-header-content">
                            <h1 className="blog-title">NEW BLOG</h1>
                            <p className="blog-subtitle">Share travel tips, news, and stories with your audience</p>
                        </div>
                    </header>

                    <form onSubmit={handleSubmit}>
                        <div className="blog-grid">
                            <div className="blog-left">
                                {/* Section 1: Image Upload (Poster UI) */}
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

                                {/* Section 2: Blog Details */}
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