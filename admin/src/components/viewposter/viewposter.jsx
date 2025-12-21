import React, { useState, useEffect } from 'react';
import { Archive, Calendar, Eye, EyeOff, Search } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import PosterDetailModal from './PosterDetailModal';
import PosterPagination from './PosterPagination';
import PosterFilters from './PosterFilters';
import './viewposter.css';

const ViewPoster = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [posters, setPosters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPoster, setSelectedPoster] = useState(null);

    const statusOptions = ['ALL', 'Active', 'Inactive'];

    const getFilterClassName = (status) => {
        return filterStatus === status ? 'pf-active-navy' : '';
    };

    useEffect(() => {
        fetchPosters();
    }, []);

    const fetchPosters = async () => {
        setLoading(true);
        try {
            // Kinukuha ang lahat ng posters mula sa backend
            const response = await fetch('https://wanderwaveph-backend.onrender.com0/api/posters');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            
            // FILTER: I-set lamang ang mga posters na ang isArchive ay "No"
            const nonArchivedPosters = data.filter(poster => poster.isArchive === "No");
            setPosters(nonArchivedPosters);
            
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching posters:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (id, title) => {
        if (window.confirm(`Are you sure you want to archive "${title}"?`)) {
            try {
                // UPDATE: Binago ang endpoint patungong /status at method patungong PUT
                // Pinapasa natin ang { isArchive: 'Yes' } para i-update ang field sa database
                const response = await fetch(`https://wanderwaveph-backend.onrender.com0/api/posters/${id}/status`, { 
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ isArchive: 'Yes' }) 
                });

                if (response.ok) {
                    // Alisin sa UI ang poster na na-archive na para mawala sa table
                    const updatedPosters = posters.filter(poster => poster._id !== id);
                    setPosters(updatedPosters);
                    alert('Poster archived successfully');
                    
                    const maxPage = Math.ceil(updatedPosters.length / itemsPerPage);
                    if (currentPage > maxPage && maxPage > 0) {
                        setCurrentPage(maxPage);
                    }
                    
                    // Isara ang modal kung ito ay nakabukas
                    if (showDetailModal) setShowDetailModal(false);
                } else {
                    alert('Failed to archive poster');
                }
            } catch (error) {
                console.error('Error archiving:', error);
                alert('Server error while archiving');
            }
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        
        try {
            const response = await fetch(`https://wanderwaveph-backend.onrender.com0/api/posters/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok) {
                setPosters(posters.map(p => 
                    p._id === id ? { ...p, status: newStatus } : p
                ));
                if (selectedPoster && selectedPoster._id === id) {
                    setSelectedPoster({ ...selectedPoster, status: newStatus });
                }
            } else {
                alert('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleViewDetails = (poster) => {
        setSelectedPoster(poster);
        setShowDetailModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Filter at search logic para sa table
    const filteredPosters = posters.filter(poster => {
        const matchesSearch = poster.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'ALL' || poster.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPosters = filteredPosters.slice(indexOfFirstItem, indexOfLastItem);

    const activePosters = posters.filter(p => p.status === 'Active').length;

    return (
        <div className="vp-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={`vp-main ${isSidebarCollapsed ? 'vp-main--collapsed' : ''}`}>
                <div className="vp-container">
                    <header className="vp-header">
                        <div className="vp-header-content">
                            <h1 className="vp-title">POSTER LIST</h1>
                            <p className="vp-subtitle">
                                Managing {posters.length} posters • {activePosters} currently active
                            </p>
                        </div>
                        <button className="vp-btn vp-btn--add" onClick={() => window.location.href='/add-poster'}>
                            + Add New Poster
                        </button>
                    </header>

                    <PosterFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        statusOptions={statusOptions}
                        getFilterClassName={getFilterClassName}
                    />

                    {loading ? (
                        <div className="vp-loading">
                            <div className="vp-spinner"></div>
                            <p>Loading posters from database...</p>
                        </div>
                    ) : posters.length === 0 ? (
                        <div className="vp-empty">
                            <span className="vp-empty-icon">🖼️</span>
                            <h3>No posters yet</h3>
                            <p>Start by adding your first promotional poster</p>
                        </div>
                    ) : filteredPosters.length === 0 ? (
                        <div className="vp-empty">
                            <span className="vp-empty-icon">🔍</span>
                            <h3>No posters found</h3>
                            <p>Try adjusting your search or filter criteria</p>
                        </div>
                    ) : (
                        <div className="vp-table-wrapper">
                            <table className="vp-table">
                                <thead>
                                    <tr>
                                        <th>PREVIEW</th>
                                        <th>TITLE</th>
                                        <th>DESCRIPTION</th>
                                        <th>START DATE</th>
                                        <th>END DATE</th>
                                        <th>STATUS</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentPosters.map((poster) => (
                                        <tr key={poster._id}>
                                            <td>
                                                <div className="vp-image-preview">
                                                    <img 
                                                        src={`https://wanderwaveph-backend.onrender.com0/${poster.imageUrl}`} 
                                                        alt={poster.title}
                                                    />
                                                </div>
                                            </td>
                                            <td>
                                                <span className="vp-poster-title">{poster.title}</span>
                                            </td>
                                            <td>
                                                <span className="vp-desc">
                                                    {poster.description || 'No description provided'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="vp-date">
                                                    <Calendar size={14} />
                                                    <span>
                                                        {poster.startDate ? formatDate(poster.startDate) : '--'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="vp-date">
                                                    <Calendar size={14} />
                                                    <span>
                                                        {poster.endDate ? formatDate(poster.endDate) : '--'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`vp-status vp-status--${poster.status.toLowerCase()}`}>
                                                    {poster.status === 'Active' ? <Eye size={12} /> : <EyeOff size={12} />}
                                                    {poster.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="vp-actions">
                                                    <button 
                                                        className="vp-action-btn vp-action-btn--view"
                                                        onClick={() => handleViewDetails(poster)}
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                        <span>View</span>
                                                    </button>
                                                    <button 
                                                        className="vp-action-btn vp-action-btn--archive"
                                                        onClick={() => handleArchive(poster._id, poster.title)}
                                                        title="Archive Poster"
                                                    >
                                                        <Archive size={16} />
                                                        <span>Archive</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <PosterPagination
                                totalItems={filteredPosters.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>
            </main>

            {showDetailModal && selectedPoster && (
                <PosterDetailModal
                    showModal={showDetailModal}
                    selectedPoster={selectedPoster}
                    setShowModal={setShowDetailModal}
                    toggleStatus={toggleStatus}
                    handleArchive={handleArchive}
                />
            )}
        </div>
    );
};

export default ViewPoster;