import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus } from 'lucide-react'; // ✅ Using Plus Icon
import Sidebar from '../sidebar/sidebar';
import BlogDetailModal from './BlogDetailModal';
import BlogPagination from './BlogPagination';
import BlogFilters from './BlogFilters';
import BlogsTable from './BlogsTable';
import { useToast } from '../toast/ToastManager';
import './viewblog.css'; // ✅ Imported updated CSS

// Custom Confirm Modal Component
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
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
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

const ViewBlog = () => {
    const toast = useToast();
    
    // ✅ STATE: Matches Standard Logic
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // ✅ Toggle Function
    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // FILTERS
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBlog, setSelectedBlog] = useState(null);

    // Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: "", message: "", onConfirm: () => {}, type: "primary"
    });
    
    const API_BASE_URL = 'https://wanderwaveph.onrender.com';

    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true, title, message,
            onConfirm: () => { onConfirm(); setConfirmConfig(prev => ({ ...prev, isOpen: false })); },
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
            if (!response.ok) throw new Error('Failed to fetch blogs');
            const data = await response.json();
            
            const processedBlogs = data.map(blog => {
                const isScheduled = blog.status === 'Scheduled' && blog.scheduledAt;
                const dateToParse = isScheduled ? blog.scheduledAt : blog.createdAt;
                const dateObj = dateToParse ? new Date(dateToParse) : null;
                const isValidDate = dateObj && !isNaN(dateObj);

                return {
                    ...blog,
                    filterDate: isValidDate ? dateObj.toLocaleDateString('en-CA') : '',
                    displayDate: isValidDate ? dateObj.toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: isScheduled ? '2-digit' : undefined,
                        minute: isScheduled ? '2-digit' : undefined
                    }) : 'N/A',
                    isScheduled 
                };
            });
            
            setBlogs(processedBlogs);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching blogs:', error);
            toast.error("Could not load blog posts.", "Connection Error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBlogs();
    }, []);

    const handleArchive = (id) => {
        askConfirmation(
            "Archive Blog Post",
            "Are you sure you want to archive this blog post? This action will remove it from the active list.",
            () => performArchive(id),
            "danger"
        );
    };

    const performArchive = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/blogs/${id}`, { method: 'DELETE' });

            if (response.ok) {
                const updatedBlogs = blogs.filter(blog => blog._id !== id);
                setBlogs(updatedBlogs);
                toast.success('Blog archived successfully', 'Success');
                const maxPage = Math.ceil(updatedBlogs.length / itemsPerPage);
                if (currentPage > maxPage && maxPage > 0) setCurrentPage(maxPage);
            } else {
                toast.error('Failed to archive blog', 'Error');
            }
        } catch (error) {
            console.error('Error archiving blog:', error);
            toast.error('An error occurred while archiving.', 'System Error');
        }
    };

    const handleEdit = (id) => {
        window.location.href = `/edit-blog/${id}`;
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/400x250';
        if (!imagePath.startsWith('http')) {
            return `${API_BASE_URL}/${imagePath.replace(/\\/g, '/')}`;
        }
        return imagePath;
    };

    const filteredBlogs = blogs.filter(blog => {
        const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            blog.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || blog.category === filterCategory;
        let matchesDate = true;
        if (dateStart) matchesDate = matchesDate && blog.filterDate >= dateStart;
        if (dateEnd) matchesDate = matchesDate && blog.filterDate <= dateEnd;
        return matchesSearch && matchesCategory && matchesDate;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentBlogs = filteredBlogs.slice(indexOfFirstItem, indexOfLastItem);
    const publishedBlogs = blogs.filter(b => (b.status || 'Published').toLowerCase() === 'published').length;

    return (
        <div className="vb-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* ✅ LAYOUT FIX: Uses 'expanded' class logic */}
            <main className={`vb-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vb-container">
                    
                    {/* ✅ HEADER UI: Matches Standard Design */}
                    <header className="vb-header">
                        <div className="vb-header-content">
                            <h1 className="vb-title">BLOG LIST</h1>
                            <div className="vb-subtitle">
                                Managing {blogs.length} active articles • {publishedBlogs} published
                            </div>
                        </div>
                        
                        <button className="vb-btn-add" onClick={() => window.location.href='/add-blog'}>
                            <Plus size={18} strokeWidth={3} />
                            ADD NEW BLOG
                        </button>
                    </header>

                    <BlogFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        categoryOptions={categoryOptions} getFilterClassName={getFilterClassName}
                        dateStart={dateStart} setDateStart={setDateStart}
                        dateEnd={dateEnd} setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vb-loading"><div className="vb-spinner"></div><p>Loading articles...</p></div>
                    ) : blogs.length === 0 ? (
                        <div className="vb-empty"><h3>No blogs yet</h3></div>
                    ) : filteredBlogs.length === 0 ? (
                        <div className="vb-empty"><h3>No blogs found</h3></div>
                    ) : (
                        <>
                            <BlogsTable 
                                blogs={currentBlogs}
                                handleEdit={handleEdit}
                                handleArchive={handleArchive}
                                getImageUrl={getImageUrl}
                            />
                            
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
                    showModal={showDetailModal} selectedBlog={selectedBlog}
                    setShowModal={setShowDetailModal} handleDelete={handleArchive} 
                    getImageUrl={getImageUrl}
                />
            )}

            <CustomConfirmModal 
                isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message}
                type={confirmConfig.type} onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
};

export default ViewBlog;