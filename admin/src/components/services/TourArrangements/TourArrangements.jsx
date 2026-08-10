import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../../sidebar/sidebar';
import Maintenance from '../../maintenance/Maintenance';
import { Plus, Palmtree, Map, Users, CheckSquare, ChevronLeft, ChevronRight, Search, Eye, UserPlus } from 'lucide-react';
import { TourModal } from './TourModals';
import { TourApplicationModal } from './TourApplicationModal';
import './TourArrangements.css';

// Destination Images for Stats Cards
const TOUR_STAT_IMAGES = {
    ACTIVE_TOURS: 'https://picsum.photos/seed/tour-active/800/600',
    UPCOMING: 'https://picsum.photos/seed/tour-upcoming/800/600',
    COMPLETED: 'https://picsum.photos/seed/tour-completed/800/600',
    INQUIRIES: 'https://picsum.photos/seed/tour-inquiries/800/600'
};

// Pagination Component
const TourPagination = ({ totalItems, itemsPerPage, currentPage, onPageChange }) => {
  const [jumpPageInput, setJumpPageInput] = useState('');
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handleJump = (e) => {
      e.preventDefault();
      const page = parseInt(jumpPageInput, 10);
      if (page >= 1 && page <= totalPages) {
          onPageChange(page);
          setJumpPageInput('');
      } else {
          alert(`Please enter a page number between 1 and ${totalPages}.`);
      }
  };

  return (
    <nav className="tour-pagination-nav">
      <div className="tour-pagination-info">
        <span className="tour-pagination-showing">
          Showing <strong>{totalItems === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1}</strong> to{' '}
          <strong>{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
          <strong>{totalItems}</strong> items
        </span>
      </div>

      <div className="tour-pagination-jump">
        <button
          type="button"
          className="tour-jump-arrow"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft size={18} />
        </button>
        
        <form onSubmit={handleJump} className="tour-pagination-jump-form">
          <span className="tour-pagination-jump-label">Page</span>
          <input 
            type="number" 
            value={jumpPageInput}
            onChange={(e) => setJumpPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            min="1" 
            max={totalPages}
            className="tour-jump-input"
          />
          <span className="tour-pagination-jump-label">of {totalPages}</span>
        </form>
        
        <button
          type="button"
          className="tour-jump-arrow"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
};

// Stats Component
const TourStats = ({ stats }) => {
    const getStatClass = (label) => label.toLowerCase().replace(/ /g, '-');
    return (
        <div className="tour-stats-grid">
            {stats.map((s, i) => (
                <div 
                    className={`tour-stat-card tour-stat-card-${getStatClass(s.label)}`} 
                    key={i}
                    style={{backgroundImage: `url(${s.image})`}}
                >
                    <div className="tour-stat-card-content">
                        <h2>{s.value}</h2>
                        <span>{s.label}</span>
                    </div>
                    <div className="tour-stat-card-icon">{s.icon}</div>
                </div>
            ))}
        </div>
    );
};

// Filters Component
const TourFilters = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, statusOptions, getFilterClassName }) => {
  return (
    <div className="tour-filter-card">
      <div className="tour-filter-wrapper">
        <div className="tour-brand-label">
            TOUR <span>FILTERS</span>
        </div>
        <div className="tour-filter-buttons">
          {statusOptions.map(status => (
            <button
              key={status}
              className={`tour-filter-btn ${getFilterClassName(status)}`} 
              onClick={() => setFilterStatus(status)}
            >
              {status === 'All' ? 'All Tours' : status}
            </button>
          ))}
        </div>
        <div className="tour-search-box">
          <Search size={18} className="tour-search-icon" /> 
          <input
            type="text"
            className="tour-search-input"
            placeholder="Search by ID, Client, Package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

// Table Component
const TourTable = ({ loading, filteredToursCount, currentTours, handleViewTour, startIndex }) => {
    const getStatusBadgeClass = (status) => {
        switch ((status || 'Pending').toLowerCase()) {
            case 'confirmed': return 'tour-badge-confirmed';
            case 'pending':   return 'tour-badge-pending';
            case 'cancelled': return 'tour-badge-cancelled';
            default:          return 'tour-badge-pending';
        }
    };

    if (loading) {
        return (
            <tbody>
                <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        Loading tour packages...
                    </td>
                </tr>
            </tbody>
        );
    }

    if (filteredToursCount === 0) {
        return (
            <tbody>
                <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                        No tour packages found
                    </td>
                </tr>
            </tbody>
        );
    }

    return (
        <tbody>
            {currentTours.map((row, index) => (
                <tr key={row.id}>
                    <td style={{ fontWeight: "700", color: '#0f172a', textAlign: 'center', width: '60px' }}>
                        {startIndex + index + 1}
                    </td>
                    <td className="tour-ref-cell">{row.id}</td>
                    <td>
                        <div className="tour-client-name">{row.client}</div>
                    </td>
                    <td>
                        <div className="tour-package-name">{row.package}</div>
                    </td>
                    <td>{row.pax}</td>
                    <td>{row.travelDate}</td>
                    <td>
                        <span className={`tour-table-badge ${getStatusBadgeClass(row.status)}`}>
                            {row.status || 'Pending'}
                        </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                        <div className="tour-action-group">
                            <button 
                                className="tour-action-btn tour-view-btn" 
                                onClick={() => handleViewTour(row)}
                                title="View Details"
                            >
                                <Eye size={16} /> View
                            </button>
                        </div>
                    </td>
                </tr>
            ))}
        </tbody>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const TourArrangements = () => {
    // Set to true to enable maintenance page
    const MAINTENANCE_MODE = false;

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All"); 
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal States
    const [isTourModalOpen, setIsTourModalOpen] = useState(false);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);

    const [allTours, setAllTours] = useState([]);

    // ================== FETCH REAL TOURS ==================
    const fetchTours = async () => {
        try {
            setIsLoading(true);
            const res = await fetch('/api/tour-bookings');
            if (!res.ok) throw new Error('Failed to fetch tours');

            const data = await res.json();
            const toursArray = data.data || data;

            const formatted = toursArray
                .filter(t => t.isArchive !== 'Yes')
                .map(t => ({
                    id: t._id,
                    mongoId: t._id,
                    client: t.fullName || t.primaryContact?.fullName || 'N/A',
                    email: t.email || t.primaryContact?.email || '',
                    package: t.packageName,
                    pax: `${t.pax?.adult || 0} Adults${t.pax?.children ? `, ${t.pax.children} Kids` : ''}`,
                    travelDate: t.startDate && t.endDate 
                        ? `${t.startDate} - ${t.endDate}` 
                        : t.startDate || 'N/A',
                    startDate: t.startDate || '',
                    endDate: t.endDate || '',
                    duration: t.duration || '',
                    destination: t.destination || '',
                    totalAmount: t.totalAmount || 0,
                    notes: t.message || '',
                    status: t.status ? t.status.charAt(0).toUpperCase() + t.status.slice(1) : 'Pending',
                }));

            setAllTours(formatted);
        } catch (err) {
            console.error('❌ Fetch tours error:', err);
            alert('Failed to load tour bookings');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTours();
    }, []);

    // Refresh after creating new tour
    const refreshData = () => fetchTours();

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus]);

    // ================== FILTERING & PAGINATION ==================
    const filteredTours = useMemo(() => {
        let list = allTours;
        const lowerSearchTerm = searchTerm.toLowerCase();
        if (filterStatus !== "All") {
            list = list.filter(tour => tour.status === filterStatus);
        }
        if (lowerSearchTerm) {
            list = list.filter(tour =>
                tour.id.toLowerCase().includes(lowerSearchTerm) ||
                tour.client.toLowerCase().includes(lowerSearchTerm) ||
                tour.package.toLowerCase().includes(lowerSearchTerm)
            );
        }
        return list;
    }, [allTours, searchTerm, filterStatus]);

    const stats = useMemo(() => [
        { label: "Active Tours", value: allTours.filter(t => t.status === 'Confirmed').length, icon: <Palmtree size={24} />, image: TOUR_STAT_IMAGES.ACTIVE_TOURS },
        { label: "Upcoming",     value: allTours.filter(t => t.status === 'Pending').length,   icon: <Map size={24} />,     image: TOUR_STAT_IMAGES.UPCOMING },
        { label: "Completed",    value: '89',                                                   icon: <CheckSquare size={24} />, image: TOUR_STAT_IMAGES.COMPLETED },
        { label: "Inquiries",    value: '12',                                                   icon: <Users size={24} />,   image: TOUR_STAT_IMAGES.INQUIRIES },
    ], [allTours]);

    const getFilterClassName = (status) => status === filterStatus ? 'tour-active-navy' : '';

    const statusOptions = useMemo(() => {
        const statuses = new Set(allTours.map(t => t.status)); 
        return ['All', ...Array.from(statuses)];
    }, [allTours]);

    const indexOfLastItem  = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTours     = filteredTours.slice(indexOfFirstItem, indexOfLastItem);
    const totalItems       = filteredTours.length;
    const startIndex       = (currentPage - 1) * itemsPerPage;

    const handleViewTour = (tour) => {
        setSelectedTour(tour);
        setIsTourModalOpen(true);
    };

    const handleCloseTourModal = () => {
        setIsTourModalOpen(false);
        setTimeout(() => setSelectedTour(null), 200);
    };

    // ================== CONFIRM / CANCEL (REAL BACKEND) ==================
    const handleConfirmTour = async () => {
        if (!selectedTour) return;
        try {
            const res = await fetch(`/api/tour-bookings/${selectedTour.mongoId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'confirmed' })
            });

            if (!res.ok) throw new Error();

            const updatedStatus = 'Confirmed';
            setAllTours(prev => prev.map(t => 
                t.id === selectedTour.id ? { ...t, status: updatedStatus } : t
            ));
            // Update selectedTour so the modal immediately reflects the new status
            setSelectedTour(prev => prev ? { ...prev, status: updatedStatus } : prev);
        } catch (err) {
            alert("❌ Failed to confirm tour");
        }
    };

    const handleCancelTour = async () => {
        if (!selectedTour) return;
        if (!window.confirm(`Cancel tour for ${selectedTour.client}?`)) return;

        try {
            const res = await fetch(`/api/tour-bookings/${selectedTour.mongoId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled' })
            });

            if (!res.ok) throw new Error();

            const updatedStatus = 'Cancelled';
            setAllTours(prev => prev.map(t => 
                t.id === selectedTour.id ? { ...t, status: updatedStatus } : t
            ));
            // Update selectedTour so the modal immediately reflects cancelled status
            setSelectedTour(prev => prev ? { ...prev, status: updatedStatus } : prev);
        } catch (err) {
            alert("❌ Failed to cancel tour");
        }
    };

    // ================== ARCHIVE (REAL BACKEND) ==================
    const handleArchiveTour = async (id) => {
        if (!window.confirm("Are you sure you want to archive this tour booking?")) return;
        
        try {
            const res = await fetch(`/api/tour-bookings/archive/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (data.success) {
                alert("✅ Tour booking archived successfully!");
                setAllTours(prev => prev.filter(t => t.mongoId !== id));
                if (isTourModalOpen) handleCloseTourModal();
            } else {
                alert("❌ Failed to archive tour booking");
            }
        } catch (err) {
            console.error("Archive error:", err);
            alert("❌ Error archiving tour booking");
        }
    };

    // --- RENDER LOGIC ---
    if (MAINTENANCE_MODE) {
        return (
            <div className="tour-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
                <main className={`tour-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                    <Maintenance />
                </main>
            </div>
        );
    }

    return (
        <div className="tour-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            
            <main className={`tour-main ${isSidebarCollapsed ? "expanded" : ""}`}>
                <div className="tour-container">
                    
                    <div className="tour-header">
                        <div className="tour-title">
                            <h1>Tour Packages</h1>
                            <p>Customized itineraries and travel arrangements</p>
                        </div>
                        <div className="tour-header-actions">
                            <button 
                                className="tour-btn-add tour-btn-dark"
                                onClick={() => setIsApplicationModalOpen(true)}
                            >
                                <UserPlus size={18} /> Add Applicant
                            </button>
                            <button className="tour-btn-add">
                                <Plus size={18} /> Manage Service
                            </button>
                        </div>
                    </div>

                    <TourStats stats={stats} />
                    
                    <TourFilters
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        statusOptions={statusOptions}
                        getFilterClassName={getFilterClassName}
                    />

                    <div className="tour-table-container">
                        <table className="tour-table">
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'center', width: '60px' }}>#</th>
                                    <th>Tour ID</th>
                                    <th>Lead Guest</th>
                                    <th>Package Name</th>
                                    <th>Pax</th>
                                    <th>Travel Dates</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                            </thead>
                            <TourTable 
                                loading={isLoading}
                                filteredToursCount={filteredTours.length}
                                currentTours={currentTours}
                                handleViewTour={handleViewTour}
                                startIndex={startIndex}
                            />
                        </table>
                    </div>

                    {filteredTours.length > 0 && Math.ceil(filteredTours.length / itemsPerPage) > 1 && (
                        <TourPagination
                            totalItems={totalItems}
                            itemsPerPage={itemsPerPage}
                            currentPage={currentPage}
                            onPageChange={(page) => setCurrentPage(page)}
                        />
                    )}
                </div>
            </main>

            {/* MODALS */}
            {isTourModalOpen && selectedTour && (
                <TourModal
                    tour={selectedTour}
                    onClose={handleCloseTourModal}
                    onConfirm={handleConfirmTour}
                    onCancel={handleCancelTour}
                    onArchive={() => handleArchiveTour(selectedTour.mongoId)}
                />
            )}

            <TourApplicationModal
                isOpen={isApplicationModalOpen}
                onClose={() => setIsApplicationModalOpen(false)}
                refreshData={refreshData}
            />
        </div>
    );
};

export default TourArrangements;