import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus } from 'lucide-react'; // ✅ Using Plus Icon
import axios from 'axios';
import Sidebar from '../sidebar/sidebar';
import PosterDetailModal from './PosterDetailModal';
import PosterPagination from './PosterPagination';
import PosterFilters from './PosterFilters';
import PostersTable from './PosterTable'; 
import { useToast } from '../toast/ToastManager';
import './viewposter.css'; // ✅ Imported updated CSS

// 🔥 HELPER FUNCTION - GET ADMIN DATA
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

// 🔥 Custom Confirm Modal Component
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
    
    // ✅ STATE: Matches Tours Logic
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // ✅ Toggle Function
    const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

    const [posters, setPosters] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // FILTERS
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [dateStart, setDateStart] = useState('');
    const [dateEnd, setDateEnd] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedPoster, setSelectedPoster] = useState(null);

    // Modal State
    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false, title: "", message: "", onConfirm: () => {}, type: "primary"
    });

    const statusOptions = ['ALL', 'Active', 'Inactive'];

    const getFilterClassName = (status) => {
        return filterStatus === status ? 'pf-active-navy' : '';
    };

    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({ isOpen: true, title, message, onConfirm: () => { onConfirm(); setConfirmConfig(prev => ({ ...prev, isOpen: false })); }, type });
    };

    useEffect(() => {
        fetchPosters();
    }, []);

    const fetchPosters = async () => {
        setLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/api/posters');
            
            const processedPosters = response.data
                .filter(poster => poster.isArchive === "No")
                .map(poster => {
                    const dateObj = poster.createdAt ? new Date(poster.createdAt) : null;
                    const isValidDate = dateObj && !isNaN(dateObj);
                    return {
                        ...poster,
                        filterDate: isValidDate ? dateObj.toLocaleDateString('en-CA') : '',
                        displayDateAdded: isValidDate ? dateObj.toLocaleDateString('en-US', {
                            year: 'numeric', month: 'short', day: 'numeric'
                        }) : 'N/A'
                    };
                });
            
            setPosters(processedPosters);
            setCurrentPage(1);
        } catch (error) {
            console.error('Error fetching posters:', error);
            toast.error("Failed to load posters from server.");
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (id, title) => {
        askConfirmation("Archive Poster?", `Are you sure you want to archive "${title}"?`, async () => {
            const { userEmail, adminId } = getAdminData();
            try {
                const response = await axios.put(`http://localhost:5000/api/posters/${id}/status`, { 
                    isArchive: 'Yes', userEmail, adminId
                });
                if (response.data) {
                    setPosters(posters.filter(poster => poster._id !== id));
                    toast.success('Poster archived successfully!');
                }
            } catch (error) {
                toast.error('Failed to archive poster.');
            }
        }, "danger");
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
        askConfirmation("Change Status?", `Change poster status to ${newStatus}?`, async () => {
            const { userEmail, adminId } = getAdminData();
            try {
                const response = await axios.put(`http://localhost:5000/api/posters/${id}/status`, { 
                    status: newStatus, userEmail, adminId
                });
                if (response.data) {
                    setPosters(posters.map(poster => poster._id === id ? { ...poster, status: newStatus } : poster));
                    toast.success(`Status changed to ${newStatus}!`);
                }
            } catch (error) {
                toast.error('Failed to update status.');
            }
        }, "primary");
    };

    const handleViewDetails = (poster) => {
        setSelectedPoster(poster);
        setShowDetailModal(true);
    };

    const filteredPosters = posters.filter(poster => {
        const matchesSearch = poster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (poster.description && poster.description.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatus = filterStatus === 'ALL' || poster.status === filterStatus;
        let matchesDate = true;
        if (dateStart) matchesDate = matchesDate && poster.filterDate >= dateStart;
        if (dateEnd) matchesDate = matchesDate && poster.filterDate <= dateEnd;
        return matchesSearch && matchesStatus && matchesDate;
    });

    const indexOfLastPoster = currentPage * itemsPerPage;
    const indexOfFirstPoster = indexOfLastPoster - itemsPerPage;
    const currentPosters = filteredPosters.slice(indexOfFirstPoster, indexOfLastPoster);

    return (
        <div className="vp-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* ✅ LAYOUT FIX: Uses 'expanded' class logic */}
            <main className={`vp-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="vp-container">
                    
                    {/* ✅ HEADER UI: Matches Tours Design */}
                    <header className="vp-header">
                        <div className="vp-header-content">
                            <h1 className="vp-title">POSTER LIST</h1>
                            <div className="vp-subtitle">
                                Managing {posters.length} posters • {filteredPosters.length} active
                            </div>
                        </div>
                        
                        <button className="vp-btn-add" onClick={() => window.location.href='/add-poster'}>
                            <Plus size={18} strokeWidth={3} />
                            ADD NEW POSTER
                        </button>
                    </header>

                    <PosterFilters
                        searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
                        statusOptions={statusOptions} getFilterClassName={getFilterClassName}
                        dateStart={dateStart} setDateStart={setDateStart}
                        dateEnd={dateEnd} setDateEnd={setDateEnd}
                    />

                    {loading ? (
                        <div className="vp-loading"><div className="vp-spinner"></div><p>Loading posters...</p></div>
                    ) : posters.length === 0 ? (
                        <div className="vp-empty"><h3>No posters yet</h3></div>
                    ) : filteredPosters.length === 0 ? (
                        <div className="vp-empty"><h3>No posters found</h3></div>
                    ) : (
                        <>
                            <PostersTable 
                                posters={currentPosters}
                                toggleStatus={toggleStatus}
                                handleViewDetails={handleViewDetails}
                                handleArchive={handleArchive}
                            />
                            
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
                    showModal={showDetailModal} selectedPoster={selectedPoster}
                    setShowModal={setShowDetailModal} toggleStatus={toggleStatus}
                    handleArchive={handleArchive}
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

export default ViewPoster;