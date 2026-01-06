import React, { useState, useEffect } from 'react';
import { Trash2, Eye, Calendar, MapPin, Tag, Clock, Search } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import TourDetailModal from './TourDetailModal';
import TourPagination from './TourPagination';
import TourFilters from './TourFilters';
import './viewtours.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com/api/tours';

const ViewTours = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTours = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_BASE_URL}/all`);
                const result = await response.json();
                if (result.status === 'ok') {
                    const activeTours = result.data.filter(tour => tour.isArchive === 'No');
                    setTours(activeTours);
                }
            } catch (err) {
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchTours();
    }, []);

    const handleArchive = async (id) => {
        if (window.confirm('Are you sure you want to archive this tour?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/archive/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });
                if ((await response.json()).status === 'ok') {
                    setTours(tours.filter(t => t._id !== id));
                }
            } catch (err) {
                alert('❌ Error connecting to server');
            }
        }
    };

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
                            <p className="vt-subtitle">Managing {tours.length} active tours • {filteredTours.length} filtered</p>
                        </div>
                        <button className="vt-btn vt-btn--add" onClick={() => navigate('/add-tour')}>+ Add New Tour</button>
                    </header>

                    <TourFilters 
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterCategory={filterCategory} setFilterCategory={setFilterCategory}
                        categories={categories}
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
                                                            <img src={`https://wanderwaveph-backend.onrender.com/uploads/${tour.image}`} alt="" />
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
                                                <td><span className="vt-rating">₱{tour.price?.toLocaleString()}</span></td>
                                                <td>
                                                    <div className="vt-actions">
                                                        <button className="vt-action-btn vt-action-btn--view" onClick={() => {setSelectedTour(tour); setShowDetailModal(true)}}>
                                                            <Eye size={16}/> <span>View</span>
                                                        </button>
                                                        <button className="vt-action-btn vt-action-btn--delete" onClick={() => handleArchive(tour._id)}>
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
            {showDetailModal && (
                <TourDetailModal 
                    tour={selectedTour} 
                    close={() => setShowDetailModal(false)} 
                    onArchive={handleArchive} 
                    navigate={navigate}
                />
            )}
        </div>
    );
};

export default ViewTours;