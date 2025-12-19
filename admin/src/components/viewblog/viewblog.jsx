import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Calendar, User, FolderOpen, FileText } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import BlogDetailModal from './BlogDetailModal';
import BlogPagination from './BlogPagination';
import BlogFilters from './BlogFilters';
import './viewblog.css';

const ViewBlog = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);
    
    const API_BASE_URL = 'http://localhost:5000';

    // Get unique categories from blogs
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
        } catch (error) {
            console.error('Error fetching blogs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this blog post?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    const updatedBlogs = blogs.filter(blog => blog._id !== id);
                    setBlogs(updatedBlogs);
                    alert('Blog deleted successfully');
                    
                    const maxPage = Math.ceil(updatedBlogs.length / itemsPerPage);
                    if (currentPage > maxPage && maxPage > 0) {
                        setCurrentPage(maxPage);
                    }
                } else {
                    alert('Failed to delete blog');
                }
            } catch (error) {
                console.error('Error deleting blog:', error);
                alert('An error occurred while deleting.');
            }
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

    // Filter and search logic
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
                                Managing {blogs.length} articles • {publishedBlogs} published
                            </p>
                        </div>
                        <button className="vb-btn vb-btn--add" onClick={() => window.location.href='/add-blog'}>
                            + Add New Blog
                        </button>
                    </header>

                    {/* BLOG FILTERS */}
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
                                                        onClick={() => handleDelete(blog._id)}
                                                        title="Delete Blog"
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <BlogPagination
                                totalItems={filteredBlogs.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </main>

            {showDetailModal && selectedBlog && (
                <BlogDetailModal
                    showModal={showDetailModal}
                    selectedBlog={selectedBlog}
                    setShowModal={setShowDetailModal}
                    handleDelete={handleDelete}
                    getImageUrl={getImageUrl}
                />
            )}
        </div>
    );
};

export default ViewBlog;