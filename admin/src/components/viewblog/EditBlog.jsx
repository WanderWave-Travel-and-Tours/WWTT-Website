import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Upload, HelpCircle, Calendar } from 'lucide-react';
import Sidebar from '../sidebar/sidebar'; 
import './EditBlog.css';
import { useToast } from '../toast/ToastManager';

const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('Error getting admin data:', error);
        return { userEmail: 'Unknown Admin', adminId: null };
    }
};

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

    // ✅ Reference for contentEditable (same as AddBlog)
    const editorRef = useRef(null);

    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    const [formData, setFormData] = useState({
        title: '',
        author: '',
        category: '',
        status: 'Published',
        content: '',
        scheduledAt: ''
    });

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
        return `/${imagePath.replace(/\\/g, '/')}`;
    };

    const formatDateForInput = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
        return localISOTime;
    };

    // ✅ Update editor when content changes (same as AddBlog)
    useEffect(() => {
        if (editorRef.current && formData.content !== editorRef.current.innerHTML) {
            if (Math.abs(formData.content.length - editorRef.current.innerHTML.length) > 5) {
                editorRef.current.innerHTML = formData.content;
            }
        }
    }, [formData.content]);

    // ✅ Handle contentEditable input (same as AddBlog)
    const handleContentChange = (e) => {
        const htmlContent = e.currentTarget.innerHTML;
        setFormData(prev => ({ ...prev, content: htmlContent }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'status' && value !== 'Scheduled') {
            setFormData(prev => ({ ...prev, scheduledAt: '' }));
        }
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

    // Fetch Blog Data
    useEffect(() => {
        const fetchBlog = async () => {
            try {
                const response = await fetch(`/api/blogs/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch blog');
                }
                const data = await response.json();
                
                const formatted = {
                    title: data.title || '',
                    author: data.author || '',
                    category: data.category || '',
                    status: data.status || 'Published',
                    content: data.content || '',
                    scheduledAt: data.status === 'Scheduled' && data.scheduledAt 
                        ? formatDateForInput(data.scheduledAt) 
                        : ''
                };

                setFormData(formatted);
                setOriginalData(formatted);

                if (data.imageUrl) {
                    setImagePreview(getImageUrl(data.imageUrl));
                }
            } catch (err) {
                console.error('Error fetching blog:', err);
                toast.showToast('Failed to load blog', 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBlog();
    }, [id]);

    const getChangedFields = () => {
        if (!originalData) return [];
        
        const changes = [];
        const fieldLabels = {
            title: 'Title',
            author: 'Author',
            category: 'Category',
            status: 'Status',
            content: 'Content',
            scheduledAt: 'Schedule Date'
        };

        Object.keys(fieldLabels).forEach(key => {
            if (formData[key] !== originalData[key]) {
                changes.push(fieldLabels[key]);
            }
        });

        if (imageFile) {
            changes.push('Cover Image');
        }

        return changes;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const changedFields = getChangedFields();
        if (changedFields.length === 0) {
            toast.showToast('No changes detected', 'info');
            return;
        }

        setSubmitting(true);

        try {
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('author', formData.author);
            submitData.append('category', formData.category);
            submitData.append('status', formData.status);
            submitData.append('content', formData.content);

            if (formData.status === 'Scheduled' && formData.scheduledAt) {
                submitData.append('scheduledAt', new Date(formData.scheduledAt).toISOString());
            }

            if (imageFile) {
                submitData.append('image', imageFile);
            }

            const adminData = getAdminData();
            const activityLog = {
                action: 'UPDATE',
                userEmail: adminData.userEmail,
                adminId: adminData.adminId,
                details: `Updated blog "${formData.title}". Modified fields: ${changedFields.join(', ')}`
            };
            submitData.append('activityLog', JSON.stringify(activityLog));

            const response = await fetch(
                `/api/blogs/${id}`,
                {
                    method: 'PUT',
                    body: submitData
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update blog');
            }

            toast.showToast('Blog updated successfully!', 'success');
            navigate('/view-blogs');
        } catch (err) {
            console.error('Error updating blog:', err);
            toast.showToast(err.message || 'Failed to update blog', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="ebl-loading">
                <div className="ebl-spinner"></div>
                <p>Loading blog...</p>
            </div>
        );
    }

    return (
        <div className="ebl-page">
            <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />

            <main className={`ebl-main ${isSidebarCollapsed ? 'ebl-main--collapsed' : ''}`}>
                <div className="ebl-container">
                    <div className="ebl-header">
                        <div className="ebl-header-content">
                            <button className="ebl-back-btn" onClick={() => navigate('/view-blogs')}>
                                <ArrowLeft size={20} />
                                <span>Back to Blogs</span>
                            </button>
                            <h1 className="ebl-title">Edit Blog Post</h1>
                            <p className="ebl-subtitle">Update your travel story</p>
                        </div>
                    </div>

                    <form className="ebl-form" onSubmit={handleSubmit}>
                        {/* Cover Image */}
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

                        {/* Blog Details */}
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
                                        <option value="Scheduled">Scheduled</option>
                                    </select>
                                </div>

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

                        {/* Content Editor - ✅ CONTENTEDITABLE (Same as AddBlog) */}
                        <div className="ebl-section">
                            <h2 className="ebl-section-title">Article Content</h2>
                            <div className="ebl-form-group">
                                <div
                                    ref={editorRef}
                                    contentEditable
                                    suppressContentEditableWarning={true}
                                    onInput={handleContentChange}
                                    className="ebl-textarea"
                                />
                                <p style={{ fontSize: "11px", color: "#888", marginTop: "5px" }}>
                                    * This is a visual editor. HTML tags are supported.
                                </p>
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
                                        "Are you sure you want to cancel? Any unsaved changes will be lost.",
                                        () => {
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