import React, { useState, useEffect } from 'react';
import { Trash2, Edit, Search, Calendar, User, FileText, Loader2 } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './viewblog.css';

const ViewBlog = () => {

    // --- SIDEBAR TOGGLE LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR TOGGLE LOGIC END ---

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    const API_BASE_URL = 'http://localhost:5000'; 

    const fetchBlogs = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs`);
            if (!response.ok) {
                throw new Error('Failed to fetch blogs');
            }
            const data = await response.json();
            setBlogs(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching blogs:', error);
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
                    setBlogs(blogs.filter(blog => blog._id !== id));
                    alert('Blog deleted successfully');
                } else {
                    alert('Failed to delete blog');
                }
            } catch (error) {
                console.error('Error deleting blog:', error);
                alert('An error occurred while deleting.');
            }
        }
    };

    const filteredBlogs = blogs.filter(blog => 
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/400x250';
        if (!imagePath.startsWith('http')) {
            return `${API_BASE_URL}/${imagePath.replace(/\\/g, '/')}`;
        }
        return imagePath;
    };

    // Construct the class name for the main content
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
                        <div>
                            <h1 className="vb-title">BLOG LIST</h1>
                            <p className="vb-subtitle">Manage and edit your articles</p>
                        </div>
                        <div className="vb-search-box">
                            <Search size={18} className="vb-search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search title or category..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </header>

                    {loading ? (
                        <div className="vb-loading">
                            <Loader2 className="vb-spinner" size={48} />
                            <p>Loading articles...</p>
                        </div>
                    ) : (
                        <div className="vb-grid">
                            {filteredBlogs.length > 0 ? (
                                filteredBlogs.map((blog) => (
                                    <div key={blog._id} className="vb-card">
                                        <div className={`vb-status ${blog.status ? blog.status.toLowerCase() : 'published'}`}>
                                            {blog.status || 'Published'}
                                        </div>

                                        <div className="vb-image-wrapper">
                                            <img 
                                                src={getImageUrl(blog.imageUrl)} 
                                                alt={blog.title} 
                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/400x250'; }} // Fallback
                                            />
                                            <div className="vb-category">{blog.category}</div>
                                        </div>

                                        <div className="vb-content">
                                            <h3 className="vb-card-title">{blog.title}</h3>
                                            
                                            <div className="vb-meta">
                                                <div className="vb-meta-item">
                                                    <User size={14} /> <span>{blog.author}</span>
                                                </div>
                                                <div className="vb-meta-item">
                                                    <Calendar size={14} /> <span>{formatDate(blog.createdAt)}</span>
                                                </div>
                                            </div>

                                            <p className="vb-excerpt">
                                                {blog.content.substring(0, 100)}...
                                            </p>
                                        </div>

                                        <div className="vb-actions">
                                            <button className="vb-btn-edit" title="Edit Blog">
                                                <Edit size={16} /> Edit
                                            </button>
                                            <button 
                                                className="vb-btn-delete" 
                                                onClick={() => handleDelete(blog._id)}
                                                title="Delete Blog"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="vb-empty">
                                    <FileText size={48} />
                                    <p>No blog posts found.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ViewBlog;