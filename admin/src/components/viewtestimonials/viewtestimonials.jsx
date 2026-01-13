import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, Eye, Calendar, User, Star, StarHalf, MessageSquare, HelpCircle } from 'lucide-react'; // ✅ Added StarHalf
import Sidebar from '../sidebar/sidebar';
import TestimonialDetailModal from './TestimonialDetailModal';
import TestimonialPagination from './TestimonialPagination';
import TestimonialFilters from './TestimonialFilters';
import { useToast } from '../toast/ToastManager'; 
import './viewtestimonials.css';

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

const ViewTestimonials = () => {
    const toast = useToast(); 
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTestimonial, setSelectedTestimonial] = useState(null);

    // Modal State for Confirmation
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });
    
    const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com';

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

    const getSources = () => {
        const sources = ['ALL'];
        const uniqueSources = [...new Set(testimonials.map(t => t.source).filter(Boolean))];
        return [...sources, ...uniqueSources];
    };

    const sourceOptions = getSources();

    const getFilterClassName = (source) => {
        return filterSource === source ? 'tf-active-navy' : '';
    };

    const fetchTestimonials = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/testimonials`);
            if (!response.ok) {
                throw new Error('Failed to fetch testimonials');
            }
            const data = await response.json();
            setTestimonials(Array.isArray(data) ? data : []);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
            toast.error("Failed to load testimonials from database.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const performArchive = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/testimonials/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isArchive: "Yes" }),
            });

            if (response.ok) {
                setTestimonials(prev => prev.map(t => t._id === id ? { ...t, isArchive: "Yes" } : t));
                toast.success('Testimonial archived successfully');
                setShowDetailModal(false); 
            } else {
                toast.error('Failed to archive testimonial');
            }
        } catch (error) {
            console.error('Error archiving testimonial:', error);
            toast.error('An error occurred while archiving.');
        }
    };

    const handleArchive = (id, name) => {
        askConfirmation(
            "Archive Testimonial",
            `Are you sure you want to archive ${name}'s testimonial? This will remove it from the active list.`,
            () => performArchive(id),
            "danger"
        );
    };

    const handleViewDetails = (testimonial) => {
        setSelectedTestimonial(testimonial);
        setShowDetailModal(true);
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return 'https://via.placeholder.com/150';
        return imagePath.startsWith('http') ? imagePath : `${API_BASE_URL}/uploads/${imagePath}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    // ✅ HELPER: Format Rating (e.g., 4 => "4.0", 4.5 => "4.5")
    const formatRating = (rating) => {
        if (rating === undefined || rating === null) return '5.0'; // Default fallback
        return Number(rating).toFixed(1);
    };

    // FILTERING AND SORTING LOGIC
    const filteredTestimonials = testimonials
        .filter(testimonial => {
            const isNotArchived = 
                testimonial.isArchive === "No" || 
                testimonial.isArchive === "0" || 
                !testimonial.isArchive || 
                testimonial.isArchive === false;

            const matchesSearch = 
                (testimonial.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (testimonial.feedback || "").toLowerCase().includes(searchTerm.toLowerCase());
                
            const matchesSource = filterSource === 'ALL' || testimonial.source === filterSource;
            
            return isNotArchived && matchesSearch && matchesSource;
        })
        .sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTestimonials = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);

    const activeTestimonialsCount = testimonials.filter(t => t.isArchive === "No" || t.isArchive === "0" || !t.isArchive).length;

    return (
        <div className="vt-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`vt-main ${isSidebarCollapsed ? 'vt-main--collapsed' : ''}`}>
                <div className="vt-container">
                    <header className="vt-header">
                        <div className="vt-header-content">
                            <h1 className="vt-title">TESTIMONIALS</h1>
                            <p className="vt-subtitle">
                                Managing {testimonials.length} testimonials • {activeTestimonialsCount} active
                            </p>
                        </div>
                        <button className="vt-btn vt-btn--add" onClick={() => window.location.href='/add-testimonial'}>
                            + Add New Testimonial
                        </button>
                    </header>

                    <TestimonialFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterSource={filterSource} setFilterSource={setFilterSource}
                        sourceOptions={sourceOptions} getFilterClassName={getFilterClassName}
                    />

                    {loading ? (
                        <div className="vt-loading">
                            <div className="vt-spinner"></div>
                            <p>Loading testimonials from database...</p>
                        </div>
                    ) : filteredTestimonials.length === 0 ? (
                        <div className="vt-empty">
                            <span className="vt-empty-icon">{testimonials.length === 0 ? '📪' : '🔍'}</span>
                            <h3>{testimonials.length === 0 ? 'No testimonials yet' : 'No testimonials found'}</h3>
                            <p>{testimonials.length === 0 ? 'Start by adding your first customer testimonial' : 'Try adjusting your search or filter criteria'}</p>
                        </div>
                    ) : (
                        <>
                            <div className="vt-table-wrapper">
                                <table className="vt-table">
                                    <thead>
                                        <tr>
                                            <th>CUSTOMER</th>
                                            <th>FEEDBACK</th>
                                            <th>SOURCE & DATE</th>
                                            <th>RATING</th>
                                            <th>STATUS</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTestimonials.map((testimonial) => (
                                            <tr key={testimonial._id}>
                                                <td>
                                                    <div className="vt-customer-cell">
                                                        <div className="vt-image-preview">
                                                            <img 
                                                                src={getImageUrl(testimonial.customerImage)} 
                                                                alt=""
                                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
                                                            />
                                                        </div>
                                                        <span className="vt-customer-name">{testimonial.customerName}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="vt-excerpt">
                                                        {testimonial.feedback?.substring(0, 80)}...
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="vt-meta-cell">
                                                        <div className="vt-source">
                                                            <MessageSquare size={14} />
                                                            <span>{testimonial.source}</span>
                                                        </div>
                                                        <div className="vt-date">
                                                            <Calendar size={14} />
                                                            <span>{formatDate(testimonial.createdAt)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                {/* ✅ UPDATED RATING CELL */}
                                                <td>
                                                    <span className="vt-rating">
                                                        {/* We use the Star icon as a badge symbol */}
                                                        <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                                        {formatRating(testimonial.rating)} Stars
                                                    </span>
                                                </td>

                                                <td>
                                                    <span className="vt-status vt-status--active">
                                                        <MessageSquare size={12} />
                                                        Active
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="vt-actions">
                                                        <button className="vt-action-btn vt-action-btn--view" onClick={() => handleViewDetails(testimonial)}>
                                                            <Eye size={16} /> <span>View</span>
                                                        </button>
                                                        <button className="vt-action-btn vt-action-btn--delete" onClick={() => handleArchive(testimonial._id, testimonial.customerName)}>
                                                            <Trash2 size={16} /> <span>Archive</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <TestimonialPagination
                                totalItems={filteredTestimonials.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    )}
                </div>
            </main>

            {/* Testimonial Detail Modal */}
            {showDetailModal && selectedTestimonial && (
                <TestimonialDetailModal
                    showModal={showDetailModal}
                    selectedTestimonial={selectedTestimonial}
                    setShowModal={setShowDetailModal}
                    handleArchive={handleArchive}
                    getImageUrl={getImageUrl}
                />
            )}

            {/* Custom Confirmation Modal */}
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

export default ViewTestimonials;