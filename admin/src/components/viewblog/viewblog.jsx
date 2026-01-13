import React, { useState, useEffect } from 'react';
import { Archive, Eye, Calendar, User, FolderOpen, FileText } from 'lucide-react'; 
import Sidebar from '../sidebar/sidebar';
import BlogDetailModal from './BlogDetailModal';
import BlogPagination from './BlogPagination';
import BlogFilters from './BlogFilters';
import { useToast } from '../toast/ToastManager'; 
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal'; // Updated directory
import './viewblog.css';

const ViewBlog = () => {
    const toast = useToast(); 
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);

    // State para sa Confirmation Modal configuration
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });
    
    const API_BASE_URL = 'http://localhost:5000';

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Helper function para sa custom confirmation logic
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

    const getCategories = () => {
        const categories = ['ALL'];
        const uniqueCategories = [...new Set(blogs.map(blog => blog.category))];
        return [...categories, ...uniqueCategories];
    };

    const categoryOptions = getCategories();

    const getFilterClassName = (category) => {
        return filterCategory === category ? 'bf-active-navy' : '';
    };

    const fetchBlogs = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs`);
            if (!response.ok) {
                throw new Error('Failed to fetch blogs');
            }
            const data = await response.json();
            setBlogs(data);
            setCurrentPage(1);
            // Optional: Success toast on initial load if needed
            // toast.info("Blog list updated", "System");
        } catch (error) {
            console.error('Error fetching blogs:', error);
            toast.error("Could not load blog posts from the server.", "Connection Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    // Function handle para sa Archive button
    const handleArchive = (id) => {
        askConfirmation(
            "Archive Blog Post",
            "Are you sure you want to archive this blog post? This action will remove it from the active list.",
            () => performArchive(id),
            "danger"
        );
    };

    // Actual Archive Logic with Toast Notifications
    const performArchive = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                const updatedBlogs = blogs.filter(blog => blog._id !== id);
                setBlogs(updatedBlogs);
                
                // Pinalitang Toast notification
                toast.success('The article has been moved to archives.', 'Success');
                
                const maxPage = Math.ceil(updatedBlogs.length / itemsPerPage);
                if (currentPage > maxPage && maxPage > 0) {
                    setCurrentPage(maxPage);
                }
            } else {
                toast.error('The server refused the archive request.', 'Archive Failed');
            }
        } catch (error) {
            console.error('Error archiving blog:', error);
            toast.error('A network error occurred while trying to archive.', 'System Error');
        }
    };

    const handleViewDetails = (blog) => {
        setSelectedBlog(blog);
        setShowDetailModal(true);
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/400x250';
        if (!imagePath.startsWith('http')) {
            return `${API_BASE_URL}/${imagePath.replace(/\\/g, '/')}`;
        }
        return imagePath;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            blog.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || blog.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBlogs = filteredBlogs.slice(indexOfFirstItem, indexOfLastItem);

    const publishedBlogs = blogs.filter(b => (b.status || 'Published').toLowerCase() === 'published').length;

    const mainClass = `vb-main ${isSidebarCollapsed ? 'vb-main--collapsed' : ''}`;

    return (
        <div className="vb-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={mainClass}>
                <div className="vb-container">
                    <header className="vb-header">
                        <div className="vb-header-content">
                            <h1 className="vb-title">BLOG LIST</h1>
                            <p className="vb-subtitle">
                                Managing {blogs.length} active articles • {publishedBlogs} published
                            </p>
                        </div>
                        <button className="vb-btn vb-btn--add" onClick={() => window.location.href='/add-blog'}>
                            + Add New Blog
                        </button>
                    </header>

                    <BlogFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        categoryOptions={categoryOptions}
                        getFilterClassName={getFilterClassName}
                    />

                    {loading ? (
                        <div className="vb-loading">
                            <div className="vb-spinner"></div>
                            <p>Loading articles from database...</p>
                        </div>
                    ) : blogs.length === 0 ? (
                        <div className="vb-empty">
                            <span className="vb-empty-icon">📝</span>
                            <h3>No blogs yet</h3>
                            <p>Start by adding your first blog article</p>
                        </div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="vb-empty">
                            <span className="vb-empty-icon">🔍</span>
                            <h3>No blogs found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    ) : (
                        <>
                            <div className="vb-table-wrapper">
                                <table className="vb-table">
                                    <thead>
                                        <tr>
                                            <th>PREVIEW</th>
                                            <th>TITLE</th>
                                            <th>EXCERPT</th>
                                            <th>AUTHOR & DATE</th>
                                            <th>CATEGORY</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentBlogs.map((blog) => (
                                            <tr key={blog._id}>
                                                <td>
                                                    <div className="vb-image-preview">
                                                        <img 
                                                            src={getImageUrl(blog.imageUrl)} 
                                                            alt={blog.title}
                                                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x250'; }}
                                                        />
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="vb-blog-title">{blog.title}</span>
                                                </td>
                                                <td>
                                                    <span className="vb-excerpt">
                                                        {blog.content.substring(0, 100)}...
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="vb-meta-cell">
                                                        <div className="vb-author">
                                                            <User size={14} />
                                                            <span>{blog.author}</span>
                                                        </div>
                                                        <div className="vb-date">
                                                            <Calendar size={14} />
                                                            <span>{formatDate(blog.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="vb-category">
                                                        <FolderOpen size={12} />
                                                        {blog.category}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`vb-status vb-status--${(blog.status || 'Published').toLowerCase()}`}>
                                                        <FileText size={12} />
                                                        {blog.status || 'Published'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="vb-actions">
                                                        <button 
                                                            className="vb-action-btn vb-action-btn--view"
                                                            onClick={() => handleViewDetails(blog)}
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                            <span>View</span>
                                                        </button>
                                                        <button 
                                                            className="vb-action-btn vb-action-btn--delete"
                                                            onClick={() => handleArchive(blog._id)}
                                                            title="Archive Blog"
                                                        >
                                                            <Archive size={16} />
                                                            <span>Archive</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <BlogPagination
                                totalItems={filteredBlogs.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </main>

            {showDetailModal && selectedBlog && (
                <BlogDetailModal
                    showModal={showDetailModal}
                    selectedBlog={selectedBlog}
                    setShowModal={setShowDetailModal}
                    handleDelete={handleArchive} 
                    getImageUrl={getImageUrl}
                />
            )}

            {/* Global Custom Confirmation Modal Implementation */}
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

export default ViewBlog;