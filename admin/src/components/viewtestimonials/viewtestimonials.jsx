import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus } from 'lucide-react'; // ✅ Using Plus Icon
import Sidebar from '../sidebar/sidebar';
import TestimonialDetailModal from './TestimonialDetailModal';
import TestimonialPagination from './TestimonialPagination';
import TestimonialFilters from './TestimonialFilters';
import TestimonialsTable from './TestimonialsTable';
import { useToast } from '../toast/ToastManager';
import './viewtestimonials.css'; // ✅ Imported updated CSS

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
    
    // ✅ STATE: Matches Standard Logic
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // ✅ Toggle Function
    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // FILTERS
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSource, setFilterSource] = useState('ALL');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTestimonial, setSelectedTestimonial] = useState(null);

    // Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });
    
    const API_BASE_URL = '';

    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true, title, message,
            onConfirm: () => { onConfirm(); setConfirmConfig(prev => ({ ...prev, isOpen: false })); },
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
            if (!response.ok) throw new Error('Failed to fetch testimonials');
            const data = await response.json();
            
            const processedData = (Array.isArray(data) ? data : []).map(testimonial => {
                const dateObj = testimonial.createdAt ? new Date(testimonial.createdAt) : null;
                const isValidDate = dateObj && !isNaN(dateObj);

                return {
                    ...testimonial,
                    filterDate: isValidDate ? dateObj.toLocaleDateString('en-CA') : '',
                    displayDateAdded: isValidDate ? dateObj.toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric'
                    }) : 'N/A'
                };
            });
            
            setTestimonials(processedData);
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

    // FILTER LOGIC
    const filteredTestimonials = testimonials.filter(testimonial => {
        const isNotArchived = testimonial.isArchive === "No" || testimonial.isArchive === "0" || !testimonial.isArchive || testimonial.isArchive === false;
        const matchesSearch = (testimonial.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (testimonial.feedback || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSource = filterSource === 'ALL' || testimonial.source === filterSource;
        let matchesDate = true;
        if (dateStart) matchesDate = matchesDate && testimonial.filterDate >= dateStart;
        if (dateEnd) matchesDate = matchesDate && testimonial.filterDate <= dateEnd;
        return isNotArchived && matchesSearch && matchesSource && matchesDate;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTestimonials = filteredTestimonials.slice(indexOfFirstItem, indexOfLastItem);
    const activeTestimonialsCount = testimonials.filter(t => t.isArchive === "No" || t.isArchive === "0" || !t.isArchive).length;

    return (
        <div className="vt-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* ✅ LAYOUT FIX: Uses 'expanded' class logic */}
            <main className={`vt-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vt-container">
                    
                    {/* ✅ HEADER UI: Matches Standard Design */}
                    <header className="vt-header">
                        <div className="vt-header-content">
                            <h1 className="vt-title">TESTIMONIALS</h1>
                            <div className="vt-subtitle">
                                Managing {testimonials.length} testimonials • {activeTestimonialsCount} active
                            </div>
                        </div>
                        
                        <button className="vt-btn-add" onClick={() => window.location.href='/add-testimonial'}>
                            <Plus size={18} strokeWidth={3} />
                            ADD NEW TESTIMONIAL
                        </button>
                    </header>

                    <TestimonialFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterSource={filterSource} setFilterSource={setFilterSource}
                        sourceOptions={sourceOptions} getFilterClassName={getFilterClassName}
                        dateStart={dateStart} setDateStart={setDateStart}
                        dateEnd={dateEnd} setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vt-loading"><div className="vt-spinner"></div><p>Loading testimonials...</p></div>
                    ) : filteredTestimonials.length === 0 ? (
                        <div className="vt-empty"><h3>No testimonials found</h3></div>
                    ) : (
                        <>
                            <TestimonialsTable 
                                testimonials={currentTestimonials}
                                handleViewDetails={handleViewDetails}
                                handleArchive={handleArchive}
                                getImageUrl={getImageUrl}
                            />
                            
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

            {showDetailModal && selectedTestimonial && (
                <TestimonialDetailModal
                    showModal={showDetailModal} selectedTestimonial={selectedTestimonial}
                    setShowModal={setShowDetailModal} handleArchive={handleArchive}
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

export default ViewTestimonials;