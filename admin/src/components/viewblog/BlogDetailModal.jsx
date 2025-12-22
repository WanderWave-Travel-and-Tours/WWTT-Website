import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, FileText, User, Calendar, FolderOpen, Edit, Trash2, CheckCircle, ImageIcon } from 'lucide-react';
import './BlogDetailModal.css';

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

const BlogDetailModal = ({ 
    showModal, 
    selectedBlog, 
    setShowModal,
    handleDelete,
    getImageUrl
}) => {
    const navigate = useNavigate();

    if (!showModal || !selectedBlog) return null;

    const closeModal = () => setShowModal(false);

    const getStatusConfig = (status) => {
        const configs = {
            PUBLISHED: { color: "green", label: "PUBLISHED", description: "Live on website" },
            DRAFT: { color: "gray", label: "DRAFT", description: "Not published yet" },
        };
        return configs[status?.toUpperCase()] || configs.PUBLISHED;
    };

    const status = (selectedBlog.status || 'PUBLISHED').toUpperCase();
    const statusConfig = getStatusConfig(status);

    const handleDeleteClick = () => {
        handleDelete(selectedBlog._id);
        closeModal();
    };

    // Navigation to Edit Page
    const handleEditClick = () => {
        navigate(`/edit-blog/${selectedBlog._id}`);
    };

    return (
        <div className="bdm-overlay" onClick={closeModal}>
            <div className="bdm-content" onClick={(e) => e.stopPropagation()}>
                
                {/* HEADER SECTION */}
                <div className="bdm-header">
                    <div className="bdm-header-left">
                        <h2 className="bdm-main-title">Blog Details</h2>
                        <div className="bdm-ref-tag">
                            REF: #{selectedBlog._id.slice(-8).toUpperCase()} <span className="bdm-dot">•</span> {formatDate(selectedBlog.createdAt)}
                        </div>
                    </div>
                    
                    <div className="bdm-header-right">
                        <div className={`bdm-status-pill ${statusConfig.color === 'green' ? 'active' : 'inactive'}`}>
                            <CheckCircle size={16} />
                            <div className="bdm-status-text">
                                <span className="bdm-status-label">{statusConfig.label}</span>
                                <span className="bdm-status-subtext">{statusConfig.description}</span>
                            </div>
                        </div>
                        <button className="bdm-close-x" onClick={closeModal}><X size={18} /></button>
                    </div>
                </div>

                <div className="bdm-body">
                    
                    {/* MEDIA SECTION */}
                    <div className="bdm-section-card dashed-border">
                        <div className="bdm-processing-bar">
                            <CheckCircle size={18} className="bdm-icon-green" />
                            <span>Featured Media & Assets</span>
                        </div>
                        
                        <div className="bdm-image-box">
                            <img 
                                src={getImageUrl(selectedBlog.imageUrl)} 
                                alt={selectedBlog.title}
                                className="bdm-blog-image"
                                onError={(e) => { e.target.src = 'https://via.placeholder.com/800x400'; }}
                            />
                            <div className="bdm-image-info">
                                <div className="bdm-file-pill">
                                    <ImageIcon size={14} className="bdm-icon-green" />
                                    <span>{selectedBlog.imageUrl ? selectedBlog.imageUrl.split(/[/\\]/).pop() : 'blog_image.jpg'}</span>
                                </div>
                                <button className="bdm-view-link" onClick={() => window.open(getImageUrl(selectedBlog.imageUrl), '_blank')}>
                                    Preview Image
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* BLOG INFORMATION GRID */}
                    <div className="bdm-section-card">
                        <h3 className="bdm-section-title">BLOG INFORMATION</h3>
                        <div className="bdm-info-grid">
                            <div className="bdm-info-box">
                                <div className="bdm-box-icon blue"><FileText size={18} /></div>
                                <div className="bdm-box-content">
                                    <label>TITLE</label>
                                    <p>{selectedBlog.title}</p>
                                </div>
                            </div>
                            <div className="bdm-info-box">
                                <div className="bdm-box-icon yellow"><User size={18} /></div>
                                <div className="bdm-box-content">
                                    <label>AUTHOR</label>
                                    <p>{selectedBlog.author}</p>
                                </div>
                            </div>
                            <div className="bdm-info-box">
                                <div className="bdm-box-icon green"><FolderOpen size={18} /></div>
                                <div className="bdm-box-content">
                                    <label>CATEGORY</label>
                                    <p>{selectedBlog.category}</p>
                                </div>
                            </div>
                            <div className="bdm-info-box">
                                <div className="bdm-box-icon orange"><Calendar size={18} /></div>
                                <div className="bdm-box-content">
                                    <label>DATE PUBLISHED</label>
                                    <p>{formatDate(selectedBlog.createdAt)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CONTENT SECTION */}
                    <div className="bdm-section-card">
                        <h3 className="bdm-section-title">BLOG CONTENT</h3>
                        <div className="bdm-message-area">
                            <p>{selectedBlog.content}</p>
                        </div>
                    </div>
                </div>

                {/* FOOTER SECTION */}
                <div className="bdm-footer">
                    <button className="bdm-btn-edit" onClick={handleEditClick}>
                        <Edit size={16} />
                        Edit
                    </button>

                    <button className="bdm-btn-danger" onClick={handleDeleteClick}>
                        <Trash2 size={16} />
                        Archive
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlogDetailModal;