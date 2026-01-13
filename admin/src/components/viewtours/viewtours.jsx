import React, { useState, useEffect } from 'react';
import { Trash2, Eye, MapPin, Tag, Clock } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import TourDetailModal from './TourDetailModal';
import TourPagination from './TourPagination';
import TourFilters from './TourFilters';
import './viewtours.css';
import { useNavigate } from 'react-router-dom';

// IMPORT ANG MGA KAILANGAN MO PARA SA TOAST AT MODAL
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';

const API_BASE_URL = 'http://localhost:5000/api/tours';

const ViewTours = () => {
    const toast = useToast(); // Gamit ang ToastManager.jsx
    const navigate = useNavigate();
    
    // --- UI STATES ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);

    // --- MODAL STATE PARA SA CUSTOM CONFIRMATION ---
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    // --- HELPER PARA SA CONFIRMATION MODAL ---
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

    // --- FETCH DATA LOGIC ---
    useEffect(() => {
        const fetchTours = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/all`);
                const result = await response.json();
                if (result.status === 'ok') {
                    const activeTours = result.data.filter(tour => tour.isArchive === 'No');
                    setTours(activeTours);
                } else {
                    toast.error(result.message || "Failed to fetch data.");
                }
            } catch (err) {
                console.error('Fetch error:', err);
                toast.error("An error occurred while connecting to the server.");
            } finally {
                setLoading(false);
            }
        };
        fetchTours();
    }, [toast]);

    // --- ARCHIVE LOGIC ---
    const handleArchiveClick = (id) => {
        askConfirmation(
            "Archive Tour Package",
            "Are you sure you want to archive this tour? You can restore it later from the archive list.",
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
                setTours(prevTours => prevTours.filter(t => t._id !== id));
                toast.success("Tour has been moved to archives successfully.");
                if (showDetailModal) setShowDetailModal(false);
            } else {
                toast.error(data.message || "Archive operation failed.");
            }
        } catch (err) {
            toast.error("Server error: Could not complete the request.");
            console.error(err);
        }
    };

    // --- FILTER & PAGINATION LOGIC ---
    const categories = ['ALL', ...new Set(tours.map(t => t.category))];

    const filteredTours = tours.filter(tour => {
        const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             tour.destination.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'ALL' || tour.category === filterCategory;
        return matchesSearch && matchesCategory;
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
                            <p className="vt-subtitle">
                                Managing <strong>{tours.length}</strong> active tours • {filteredTours.length} filtered
                            </p>
                        </div>
                        <button className="vt-btn vt-btn--add" onClick={() => navigate('/add-tour')}>
                            + Add New Tour
                        </button>
                    </header>

                    <TourFilters 
                        searchTerm={searchTerm} 
                        setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory} 
                        setFilterCategory={setFilterCategory}
                        categories={categories}
                    />

                    {loading ? (
                        <div className="vt-loading">
                            <div className="vt-spinner"></div>
                            <p>Loading tour catalogs...</p>
                        </div>
                    ) : filteredTours.length === 0 ? (
                        <div className="vt-empty">
                            <h3>No tours found</h3>
                            <p>Try adjusting your search or category filters.</p>
                        </div>
                    ) : (
                        <>
                            <div className="vt-table-wrapper">
                                <table className="vt-table">
                                    <thead>
                                        <tr>
                                            <th>TOUR PACKAGE</th>
                                            <th>DESTINATION</th>
                                            <th>DURATION/CAT</th>
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
                                                            <img 
                                                                src={`http://localhost:5000/uploads/${tour.image}`} 
                                                                alt={tour.title} 
                                                                onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=No+Image'; }}
                                                            />
                                                        </div>
                                                        <span className="vt-customer-name">{tour.title.toUpperCase()}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="vt-source">
                                                        <MapPin size={14}/> {tour.destination.toUpperCase()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="vt-meta-cell">
                                                        <div className="vt-source"><Clock size={14}/> {tour.duration}</div>
                                                        <div className="vt-date"><Tag size={14}/> {tour.category}</div>
                                                    </div>
                                                </td>
                                                <td><span className="vt-rating">₱{tour.price?.toLocaleString()}</span></td>
                                                <td>
                                                    <div className="vt-actions">
                                                        <button 
                                                            className="vt-action-btn vt-action-btn--view" 
                                                            onClick={() => {setSelectedTour(tour); setShowDetailModal(true)}}
                                                        >
                                                            <Eye size={16}/> <span>View</span>
                                                        </button>
                                                        <button 
                                                            className="vt-action-btn vt-action-btn--delete" 
                                                            onClick={() => handleArchiveClick(tour._id)}
                                                        >
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

            {/* --- MODALS --- */}
            
            {/* Tour Detail Modal */}
            {showDetailModal && (
                <TourDetailModal 
                    tour={selectedTour} 
                    close={() => setShowDetailModal(false)} 
                    onArchive={handleArchiveClick} 
                    navigate={navigate}
                />
            )}

            {/* Global Custom Confirmation Modal gamit ang file mo sa ../toast/CustomConfirmModal */}
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