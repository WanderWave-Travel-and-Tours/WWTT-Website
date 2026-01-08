import React, { useState, useEffect } from 'react';
import { Archive, Calendar, Eye, EyeOff, Search, HelpCircle } from 'lucide-react';
import axios from 'axios';
import Sidebar from '../sidebar/sidebar';
import PosterDetailModal from './PosterDetailModal';
import PosterPagination from './PosterPagination';
import PosterFilters from './PosterFilters';
import { useToast } from '../toast/ToastManager';
import './viewposter.css';

// 🔥🔥🔥 HELPER FUNCTION - GET ADMIN DATA (For Activity Logs) 🔥🔥🔥
const getAdminData = () => {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        return {
            userEmail: adminData.email || adminData.username || 'Unknown Admin',
            adminId: adminData._id || adminData.id || null
        };
    } catch (error) {
        console.error('❌ Error getting admin data:', error);
        return { userEmail: 'Unknown Admin', adminId: null };
    }
};

// 🔥 Custom Confirm Modal Component (Reference from EditVisa.jsx)
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

const ViewPoster = () => {
    const toast = useToast();
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

    // State para sa Confirmation Modal
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    const statusOptions = ['ALL', 'Active', 'Inactive'];

    const getFilterClassName = (status) => {
        return filterStatus === status ? 'pf-active-navy' : '';
    };

    // Helper function para sa confirmation modal
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
        fetchPosters();
    }, []);

    const fetchPosters = async () => {
        setLoading(true);
        try {
            const response = await axios.get('https://wanderwaveph-backend.onrender.com/api/posters');
            
            // FILTER: I-set lamang ang mga posters na ang isArchive ay "No"
            const nonArchivedPosters = response.data.filter(poster => poster.isArchive === "No");
            setPosters(nonArchivedPosters);
            
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching posters:', error);
            toast.error("Failed to load posters from server.");
        } finally {
            setLoading(false);
        }
    };

    // 🔥🔥🔥 UPDATED: ARCHIVE WITH ADMIN DATA 🔥🔥🔥
    const handleArchive = async (id, title) => {
        askConfirmation(
            "Archive Poster?",
            `Are you sure you want to archive "${title}"?`,
            async () => {
                const { userEmail, adminId } = getAdminData();

                try {
                    const response = await axios.put(`https://wanderwaveph-backend.onrender.com/api/posters/${id}/status`, { 
                        isArchive: 'Yes',
                        userEmail,
                        adminId
                    });

                    if (response.data) {
                        const updatedPosters = posters.filter(poster => poster._id !== id);
                        setPosters(updatedPosters);
                        toast.success('Poster archived successfully!');
                    }
                } catch (error) {
                    console.error('Error archiving poster:', error);
                    toast.error('Failed to archive poster.');
                }
            },
            "danger"
        );
    };

    // 🔥🔥🔥 UPDATED: TOGGLE STATUS WITH ADMIN DATA 🔥🔥🔥
    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        
        askConfirmation(
            "Change Status?",
            `Change poster status to ${newStatus}?`,
            async () => {
                const { userEmail, adminId } = getAdminData();

                try {
                    const response = await axios.put(`https://wanderwaveph-backend.onrender.com/api/posters/${id}/status`, { 
                        status: newStatus,
                        userEmail,
                        adminId
                    });

                    if (response.data) {
                        const updatedPosters = posters.map(poster =>
                            poster._id === id ? { ...poster, status: newStatus } : poster
                        );
                        setPosters(updatedPosters);
                        toast.success(`Status changed to ${newStatus}!`);
                    }
                } catch (error) {
                    console.error('Error updating status:', error);
                    toast.error('Failed to update status.');
                }
            },
            "primary"
        );
    };

    const handleViewDetails = (poster) => {
        setSelectedPoster(poster);
        setShowDetailModal(true);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    const filteredPosters = posters.filter(poster => {
        const matchesSearch = poster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (poster.description && poster.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || poster.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const indexOfLastPoster = currentPage * itemsPerPage;
    const indexOfFirstPoster = indexOfLastPoster - itemsPerPage;
    const currentPosters = filteredPosters.slice(indexOfFirstPoster, indexOfLastPoster);

    const activePosters = posters.filter(p => p.status === 'Active').length;

    return (
        <div className="vp-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            
            <main className={`vp-main ${isSidebarCollapsed ? "vp-main--collapsed" : ""}`}>
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
                        <>
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
                                                            src={`https://wanderwaveph-backend.onrender.com/${poster.imageUrl}`} 
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
                                                    <span 
                                                        className={`vp-status vp-status--${poster.status.toLowerCase()}`}
                                                        style={{ cursor: 'pointer' }}
                                                        onClick={() => toggleStatus(poster._id, poster.status)}
                                                        title="Click to toggle status"
                                                    >
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
                            </div>
                            
                            <PosterPagination
                                totalItems={filteredPosters.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={setCurrentPage}
                            />
                        </>
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

            {/* Global Confirmation Modal */}
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

export default ViewPoster;