import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus } from 'lucide-react'; 
import Sidebar from '../sidebar/sidebar';
import TourDetailModal from './TourDetailModal';
import TourPagination from './TourPagination';
import TourFilters from './TourFilters';
import ToursTable from './ToursTable'; 
import './viewtours.css'; 
import { useNavigate } from 'react-router-dom';
import { useToast } from '../toast/ToastManager';

const API_BASE_URL = 'https://wanderwaveph.onrender.com/api/tours';

// --- CONFIRMATION MODAL ---
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
          <button onClick={onCancel} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '500' }}>Confirm</button>
        </div>
      </div>
    </div>
  );
};

const ViewTours = () => {
    const toast = useToast();
    const navigate = useNavigate();
    
    // ✅ STATE: Matches Booking/Poster Logic
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: "", message: "", onConfirm: () => {}, type: "primary"
    });

    // ✅ Toggle Function
    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmConfig(prev => ({ ...prev, isOpen: false })); }, type });
    };

    useEffect(() => {
        const fetchTours = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/all`);
                const result = await response.json();
                if (result.status === 'ok') {
                    const activeTours = result.data.filter(tour => tour.isArchive === 'No').map(tour => {
                        const dateObj = tour.createdAt ? new Date(tour.createdAt) : null;
                        return {
                            ...tour,
                            filterDate: dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString('en-CA') : '',
                            displayDate: dateObj && !isNaN(dateObj) ? dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'N/A'
                        };
                    });
                    setTours(activeTours);
                }
            } catch (err) {
                toast.error("Failed to load tour packages.");
            } finally {
                setLoading(false);
            }
        };
        fetchTours();
    }, [toast]);

    const handleArchiveClick = (id) => {
        askConfirmation("Archive Tour", "Are you sure you want to archive this tour?", () => performArchive(id), "danger");
    };

    const performArchive = async (id) => {
        try {
            const response = await fetch(`${API_BASE_URL}/archive/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' } });
            const data = await response.json();
            if (data.status === 'ok') {
                setTours(tours.filter(t => t._id !== id));
                toast.success("Tour archived successfully.");
                if (showDetailModal) setShowDetailModal(false);
            } else {
                toast.error(data.message || "Failed to archive tour.");
            }
        } catch (err) {
            toast.error("Error connecting to server.");
        }
    };

    const handleView = (tour) => {
        setSelectedTour(tour);
        setShowDetailModal(true);
    };

    const categories = ['ALL', ...new Set(tours.map(t => t.category))];
    const filteredTours = tours.filter(tour => {
        const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) || tour.destination.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || tour.category === filterCategory;
        let matchesDate = true;
        if (dateStart) matchesDate = matchesDate && tour.filterDate >= dateStart;
        if (dateEnd) matchesDate = matchesDate && tour.filterDate <= dateEnd;
        return matchesSearch && matchesCategory && matchesDate;
    });

    const currentTours = filteredTours.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="vt-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* ✅ RESPONSIVE FIX: Uses 'expanded' class logic (Matches Booking) */}
            <main className={`vt-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vt-container">
                    
                    {/* ✅ HEADER UI: Corrected Text "TOUR PACKAGES" */}
                    <header className="vt-header">
                        <div className="vt-header-content">
                            <h1 className="vt-title">TOUR PACKAGES</h1>
                            <div className="vt-subtitle">
                                Managing {tours.length} active tours • {filteredTours.length} filtered
                            </div>
                        </div>
                        
                        <button className="vt-btn-add" onClick={() => navigate('/add-tour')}>
                            <Plus size={18} strokeWidth={3} />
                            ADD NEW TOUR
                        </button>
                    </header>

                    <TourFilters 
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        categories={categories} dateStart={dateStart} setDateStart={setDateStart}
                        dateEnd={dateEnd} setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vt-loading"><div className="vt-spinner"></div><p>Loading tours...</p></div>
                    ) : filteredTours.length === 0 ? (
                        <div className="vt-empty"><h3>No tours found</h3></div>
                    ) : (
                        <>
                            <ToursTable tours={currentTours} onView={handleView} onArchive={handleArchiveClick} />
                            <TourPagination totalItems={filteredTours.length} itemsPerPage={itemsPerPage} currentPage={currentPage} onPageChange={setCurrentPage} />
                        </>
                    )}
                </div>
            </main>

            {showDetailModal && (
                <TourDetailModal tour={selectedTour} close={() => setShowDetailModal(false)} onArchive={handleArchiveClick} navigate={navigate} />
            )}

            <CustomConfirmModal isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message} type={confirmConfig.type} onConfirm={confirmConfig.onConfirm} onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
};

export default ViewTours;