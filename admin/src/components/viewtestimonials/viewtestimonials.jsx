import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Calendar, User, Star, MessageSquare } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import TestimonialDetailModal from './TestimonialDetailModal';
import TestimonialPagination from './TestimonialPagination';
import TestimonialFilters from './TestimonialFilters';
import './viewtestimonials.css';

const ViewTestimonials = () => {
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
    
    const API_BASE_URL = 'http://localhost:5000';

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
            // Siguraduhing array ang data bago i-set
            setTestimonials(Array.isArray(data) ? data : []);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching testimonials:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTestimonials();
    }, []);

    const handleArchive = async (id, name) => {
        if (window.confirm(`Are you sure you want to archive ${name}'s testimonial?`)) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/testimonials/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isArchive: "Yes" }),
                });

                if (response.ok) {
                    // I-update ang local state para mawala agad sa listahan pagka-archive
                    setTestimonials(prev => prev.map(t => t._id === id ? { ...t, isArchive: "Yes" } : t));
                    alert('Testimonial archived successfully');
                } else {
                    alert('Failed to archive testimonial');
                }
            } catch (error) {
                console.error('Error archiving testimonial:', error);
            }
        }
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

    // FIX: Mas malawak na filtering para tanggapin ang "0" o "No"
    const filteredTestimonials = testimonials.filter(testimonial => {
        // Ituturing na Active kung ang isArchive ay "No", "0", false, o wala pang value
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
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTestimonials = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);

    // Counter para sa header
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
                            <span className="vt-empty-icon">{testimonials.length === 0 ? '💬' : '🔍'}</span>
                            <h3>{testimonials.length === 0 ? 'No testimonials yet' : 'No testimonials found'}</h3>
                            <p>{testimonials.length === 0 ? 'Start by adding your first customer testimonial' : 'Try adjusting your search or filter criteria'}</p>
                        </div>
                    ) : (
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
                                            <td>
                                                <span className="vt-rating">
                                                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                                                    5.0 Stars
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
                            
                            <TestimonialPagination
                                totalItems={filteredTestimonials.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </main>

            {showDetailModal && selectedTestimonial && (
                <TestimonialDetailModal
                    showModal={showDetailModal}
                    selectedTestimonial={selectedTestimonial}
                    setShowModal={setShowDetailModal}
                    handleArchive={handleArchive}
                    getImageUrl={getImageUrl}
                />
            )}
        </div>
    );
};

export default ViewTestimonials;