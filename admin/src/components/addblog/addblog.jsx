import React, { useState, useEffect } from 'react';
import { Upload, Trash2, FileText, User, Tag, Loader2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import { useNavigate } from 'react-router-dom'; 
import './addblog.css';

const AddBlog = () => {
    const navigate = useNavigate();
    
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

    // CHANGE THIS: Match your server port
    const API_BASE_URL = 'http://localhost:5000'; 

    // Cleanup URL object
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

    const handleSubmit = async () => {
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

            const response = await fetch(`${API_BASE_URL}/api/blogs/add`, {
                method: 'POST',
                body: formData, 
            });

            const result = await response.json();

            if (response.ok) {
                alert('Blog post created successfully!');
                handleCancel(); 
            } else {
                alert(`Error: ${result.message || 'Failed to create blog'}`);
            }

        } catch (error) {
            console.error('Error submitting blog:', error);
            alert('Server error. Please check if backend is running.');
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
            <Sidebar />
            
            <main className="blog-main">
                <div className="blog-container">
                    <header className="blog-header">
                        <h1 className="blog-title">CREATE NEW BLOG</h1>
                        <p className="blog-subtitle">Share travel tips, news, and stories</p>
                    </header>

                    <div className="blog-grid">
                        {/* Left: Form */}
                        <div className="blog-left">
                            <section className="blog-section">
                                <h2 className="blog-section-title">BLOG CONTENT</h2>
                                
                                <div className="blog-fields">
                                    {/* Image Upload */}
                                    <div className="blog-field blog-field--full">
                                        <label>Cover Image *</label>
                                        {!imagePreview ? (
                                            <div className="b-upload-zone">
                                                <input 
                                                    type="file" 
                                                    id="blog-upload" 
                                                    accept="image/*" 
                                                    onChange={handleImageChange}
                                                    hidden 
                                                />
                                                <label htmlFor="blog-upload" className="b-upload-label">
                                                    <div className="b-upload-icon">
                                                        <Upload size={32} />
                                                    </div>
                                                    <span className="b-upload-text">Upload Cover Image</span>
                                                    <span className="b-upload-subtext">Required</span>
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="b-image-preview-container">
                                                <img src={imagePreview} alt="Preview" className="b-uploaded-image" />
                                                <button type="button" className="b-remove-image-btn" onClick={removeImage}>
                                                    <Trash2 size={16} /> Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="blog-field blog-field--full">
                                        <label>Blog Title *</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={blogDetails.title}
                                            onChange={handleChange}
                                            placeholder="e.g., Top 10 Hidden Gems in Palawan"
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
                                            {/* Values mapped to match GHL Script expectations */}
                                            <option value="Promos">Latest Promos</option>
                                            <option value="Tips">Travel Tips</option>
                                            <option value="Editor's Pick">Editor's Picks</option>
                                        </select>
                                    </div>

                                    <div className="blog-field blog-field--full">
                                        <label>Content *</label>
                                        <textarea
                                            name="content"
                                            value={blogDetails.content}
                                            onChange={handleChange}
                                            placeholder="Write your story here..."
                                            rows="12"
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
                                    type="button" 
                                    className="blog-btn blog-btn--submit"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <><Loader2 className="vb-spinner" size={18} /> Publishing...</>
                                    ) : 'Publish Blog'}
                                </button>
                            </div>
                        </div>

                        {/* Right: Preview */}
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
                                                ? blogDetails.content.substring(0, 120) + '...' 
                                                : 'This is a preview of how your blog post snippet will appear on the website list...'}
                                        </p>

                                        <div className="bp-readmore">Read Article →</div>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AddBlog;