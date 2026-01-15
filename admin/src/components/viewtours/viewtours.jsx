import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Calendar, MapPin, Tag, Clock, Search, HelpCircle } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import TourDetailModal from './TourDetailModal';
import TourPagination from './TourPagination';
import TourFilters from './TourFilters';
import './viewtours.css';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../toast/ToastManager';

const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com/api/tours';

// --- CUSTOM CONFIRMATION MODAL COMPONENT ---
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

const ViewTours = () => {
    const toast = useToast();
    const navigate = useNavigate();
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- FILTERS STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    
    // ✅ ADDED: Date Filter State
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);

    // --- MODAL STATE ---
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

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

    useEffect(() => {
        const fetchTours = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/all`);
                const result = await response.json();
                if (result.status === 'ok') {
                    // Filter active tours and format dates
                    const activeTours = result.data
                        .filter(tour => tour.isArchive === 'No')
                        .map(tour => {
                            // ✅ Handle Date Parsing safely
                            const dateObj = tour.createdAt ? new Date(tour.createdAt) : null;
                            const isValidDate = dateObj && !isNaN(dateObj);

                            return {
                                ...tour,
                                // Format for Logic (YYYY-MM-DD)
                                filterDate: isValidDate ? dateObj.toLocaleDateString('en-CA') : '',
                                // Format for Display (Jan 25, 2024)
                                displayDate: isValidDate ? dateObj.toLocaleDateString('en-US', {
                                    year: 'numeric', month: 'short', day: 'numeric'
                                }) : 'N/A'
                            };
                        });
                    setTours(activeTours);
                }
            } catch (err) {
                console.error('Fetch error:', err);
                toast.error("Failed to load tour packages.");
            } finally {
                setLoading(false);
            }
        };
        fetchTours();
    }, [toast]);

    const handleArchiveClick = (id) => {
        askConfirmation(
            "Archive Tour",
            "Are you sure you want to archive this tour? This will remove it from the active list.",
            () => performArchive(id),
            "danger"
        );
    };

    const performArchive = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/archive/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            if (data.status === 'ok') {
                setTours(tours.filter(t => t._id !== id));
                toast.success("Tour has been archived successfully.");
                if (showDetailModal) setShowDetailModal(false);
            } else {
                toast.error(data.message || "Failed to archive tour.");
            }
        } catch (err) {
            toast.error("Error connecting to server.");
            console.error(err);
        }
    };

    const categories = ['ALL', ...new Set(tours.map(t => t.category))];

    // ✅ ENHANCED FILTER LOGIC
    const filteredTours = tours.filter(tour => {
        // 1. Search Filter
        const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             tour.destination.toLowerCase().includes(searchTerm.toLowerCase());
        
        // 2. Category Filter
        const matchesCategory = filterCategory === 'ALL' || tour.category === filterCategory;
        
        // 3. ✅ Date Range Filter
        let matchesDate = true;
        if (dateStart) {
            matchesDate = matchesDate && tour.filterDate >= dateStart;
        }
        if (dateEnd) {
            matchesDate = matchesDate && tour.filterDate <= dateEnd;
        }

        return matchesSearch && matchesCategory && matchesDate;
    });

    const currentTours = filteredTours.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="vt-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`vt-main ${isSidebarCollapsed ? 'vt-main--collapsed' : ''}`}>
                <div className="vt-container">
                    <header className="vt-header">
                        <div className="vt-header-content">
                            <h1 className="vt-title">TOUR PACKAGES</h1>
                            <p className="vt-subtitle">Managing {tours.length} active tours • {filteredTours.length} filtered</p>
                        </div>
                        <button className="vt-btn vt-btn--add" onClick={() => navigate('/add-tour')}>+ Add New Tour</button>
                    </header>

                    {/* ✅ FILTERS (Dropdowns & Dates) */}
                    <TourFilters 
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        categories={categories}
                        dateStart={dateStart}
                        setDateStart={setDateStart}
                        dateEnd={dateEnd}
                        setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vt-loading"><div className="vt-spinner"></div><p>Loading tours...</p></div>
                    ) : filteredTours.length === 0 ? (
                        <div className="vt-empty"><h3>No tours found</h3></div>
                    ) : (
                        <>
                            <div className="vt-table-wrapper">
                                <table className="vt-table">
                                    <thead>
                                        <tr>
                                            <th>TOUR PACKAGE</th>
                                            <th>DESTINATION</th>
                                            <th>DURATION/CAT</th>
                                            {/* ✅ NEW COLUMN */}
                                            <th>DATE ADDED</th>
                                            <th>PRICE</th>
                                            <th>ACTIONS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentTours.map((tour) => (
                                            <tr key={tour._id}>
                                                <td>
                                                    <div className="vt-customer-cell">
                                                        <div className="vt-image-preview">
                                                            <img src={tour.image} alt={tour.title} onError={(e) => e.target.src="https://via.placeholder.com/150"} />
                                                        </div>
                                                        <span className="vt-customer-name">{tour.title.toUpperCase()}</span>
                                                    </div>
                                                </td>
                                                <td><div className="vt-source"><MapPin size={14}/> {tour.destination.toUpperCase()}</div></td>
                                                <td>
                                                    <div className="vt-meta-cell">
                                                        <div className="vt-source"><Clock size={14}/> {tour.duration}</div>
                                                        <div className="vt-date"><Tag size={14}/> {tour.category}</div>
                                                    </div>
                                                </td>
                                                {/* ✅ DATE ADDED DATA */}
                                                <td>
                                                    <div className="vt-date-added">
                                                        <Calendar size={14} />
                                                        <span>{tour.displayDate}</span>
                                                    </div>
                                                </td>
                                                <td><span className="vt-rating">₱{tour.price?.toLocaleString()}</span></td>
                                                <td>
                                                    <div className="vt-actions">
                                                        <button className="vt-action-btn vt-action-btn--view" onClick={() => {setSelectedTour(tour); setShowDetailModal(true)}}>
                                                            <Eye size={16}/> <span>View</span>
                                                        </button>
                                                        <button className="vt-action-btn vt-action-btn--delete" onClick={() => handleArchiveClick(tour._id)}>
                                                            <Trash2 size={16}/> <span>Archive</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <TourPagination 
                                totalItems={filteredTours.length} 
                                itemsPerPage={itemsPerPage} 
                                currentPage={currentPage} 
                                onPageChange={setCurrentPage} 
                            />
                        </>
                    )}
                </div>
            </main>

            {/* Tour Detail Modal */}
            {showDetailModal && (
                <TourDetailModal 
                    tour={selectedTour} 
                    close={() => setShowDetailModal(false)} 
                    onArchive={handleArchiveClick} 
                    navigate={navigate}
                />
            )}

            {/* Global Custom Confirmation Modal */}
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

export default ViewTours;