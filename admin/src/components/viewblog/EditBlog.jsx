import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; // Ensure correct path
import './EditBlog.css';

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
        category: '', // This will now be controlled by the dropdown
        status: 'Published',
        content: ''
    });

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState("");

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Helper to construct image URL
    const getImageUrl = (imagePath) => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `https://wanderwaveph-backend.onrender.com/${imagePath.replace(/\\/g, '/')}`;
    };

    // Fetch Blog Data
    useEffect(() => {
        const fetchBlogDetails = async () => {
            try {
                const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/blogs/${id}`);
                if (!response.ok) throw new Error('Failed to fetch blog details');
                
                const data = await response.json();
                
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

        try {
            const formDataToSend = new FormData();
            formDataToSend.append("title", formData.title);
            formDataToSend.append("author", formData.author);
            formDataToSend.append("category", formData.category);
            formDataToSend.append("status", formData.status);
            formDataToSend.append("content", formData.content);

            if (imageFile) {
                formDataToSend.append("image", imageFile);
            }

            const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/blogs/${id}`, {
                method: 'PUT',
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error('Failed to update blog');
            }

            alert('✅ Blog post updated successfully!');
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
                                onClick={() => navigate('/view-blogs')}
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