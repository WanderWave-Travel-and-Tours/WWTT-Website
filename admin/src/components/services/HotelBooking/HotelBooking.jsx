import React, { useState, useMemo } from 'react';
import Sidebar from '../../sidebar/sidebar';
import Maintenance from '../../maintenance/Maintenance'; // [IMPORTANT] Import Maintenance Component
import { Plus, Hotel, CalendarCheck, XCircle, Bed, ChevronLeft, ChevronRight, Search, Eye, UserPlus, Archive } from 'lucide-react';
import { ReservationModal } from './HotelModals';
import { HotelApplicationModal } from './HotelApplicationModal';
import './HotelBooking.css';

// Destination Images for Stats Cards
const HOTEL_STAT_IMAGES = {
    TOTAL: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1000',
    CHECKINS: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&q=80&w=1000',
    CONFIRMED: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&q=80&w=1000',
    CANCELLED: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1000'
};

const ITEMS_PER_PAGE = 8;

// Mock Data
const initialReservations = [
    { id: 'RES-301', guest: 'John Smith', hotel: 'Grand Hyatt Manila', room: 'Deluxe King', checkIn: 'Jan 15, 2026', status: 'Confirmed', price: 12000 },
    { id: 'RES-302', guest: 'Alice Johnson', hotel: 'Shangri-La Boracay', room: 'Premier Seaview', checkIn: 'Feb 02, 2026', status: 'Pending', price: 25000 },
    { id: 'RES-303', guest: 'Robert Doe', hotel: 'Okada Manila', room: 'Executive Suite', checkIn: 'Jan 20, 2026', status: 'Confirmed', price: 18500 },
    { id: 'RES-304', guest: 'Emily White', hotel: 'Crimson Resort Cebu', room: 'Garden Villa', checkIn: 'Mar 10, 2026', status: 'Pending', price: 15000 },
    { id: 'RES-305', guest: 'Michael Brown', hotel: 'The Peninsula', room: 'Grand Deluxe', checkIn: 'Dec 25, 2025', status: 'Checked-in', price: 14000 },
    { id: 'RES-306', guest: 'Sarah Davis', hotel: 'Discovery Shores', room: 'Junior Suite', checkIn: 'Apr 05, 2026', status: 'Cancelled', price: 22000 },
    { id: 'RES-307', guest: 'David Wilson', hotel: 'Henann Resort', room: 'Pool Access', checkIn: 'Jan 28, 2026', status: 'Confirmed', price: 9500 },
];

const HotelBooking = () => {
    // [MAINTENANCE MODE TOGGLE]
    // Kapag TRUE, ipapakita ang Maintenance screen at itatago ang dashboard.
    const MAINTENANCE_MODE = true; 

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [reservations, setReservations] = useState(initialReservations);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modals
    const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
    const [selectedReservation, setSelectedReservation] = useState(null);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);

    // Filter Logic
    const filteredReservations = useMemo(() => {
        let list = reservations;
        if (filterStatus !== 'All') {
            list = list.filter(r => r.status === filterStatus);
        }
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            list = list.filter(r => 
                r.guest.toLowerCase().includes(search) ||
                r.hotel.toLowerCase().includes(search) ||
                r.id.toLowerCase().includes(search)
            );
        }
        return list;
    }, [reservations, filterStatus, searchTerm]);

    const stats = [
        { label: 'Total Bookings', value: reservations.length, icon: <Hotel size={24}/>, image: HOTEL_STAT_IMAGES.TOTAL },
        { label: 'Check-ins Today', value: '3', icon: <Bed size={24}/>, image: HOTEL_STAT_IMAGES.CHECKINS },
        { label: 'Confirmed', value: reservations.filter(r => r.status === 'Confirmed').length, icon: <CalendarCheck size={24}/>, image: HOTEL_STAT_IMAGES.CONFIRMED },
        { label: 'Cancelled', value: reservations.filter(r => r.status === 'Cancelled').length, icon: <XCircle size={24}/>, image: HOTEL_STAT_IMAGES.CANCELLED },
    ];

    const totalPages = Math.ceil(filteredReservations.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentReservations = filteredReservations.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // --- HANDLERS ---
    const handleViewReservation = (res) => {
        setSelectedReservation(res);
        setIsReservationModalOpen(true);
    };

    const handleArchiveReservation = (id) => {
        if(window.confirm("Are you sure you want to archive this booking?")) {
            setReservations(reservations.filter(r => r.id !== id));
        }
    };

    const handleAddBooking = (newBooking) => {
        setReservations([newBooking, ...reservations]);
    };

    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'confirmed': return 'hb-badge-confirmed';
            case 'pending': return 'hb-badge-pending';
            case 'cancelled': return 'hb-badge-cancelled';
            case 'checked-in': return 'hb-badge-checked-in';
            default: return 'hb-badge-pending';
        }
    };

    const uniqueStatuses = ['All', ...new Set(reservations.map(r => r.status))];

    // =========================================================
    // [RENDER LOGIC: MAINTENANCE CHECK]
    // Ito ang part na hinahanap mo. Kapag TRUE ang mode,
    // irereturn agad ang Maintenance view at HINDI ang dashboard.
    // =========================================================
    if (MAINTENANCE_MODE) {
        return (
            <div className="hb-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
                <main className={`hb-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                    <Maintenance />
                </main>
            </div>
        );
    }

    // =========================================================
    // [NORMAL RENDER]
    // Ito ang lalabas kapag MAINTENANCE_MODE = false
    // =========================================================
    return (
        <div className="hb-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            
            <main className={`hb-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="hb-container">
                    {/* Header */}
                    <div className="hb-header">
                        <div className="hb-title">
                            <h1>Hotel Booking</h1>
                            <p>Manage hotel reservations and guest lists.</p>
                        </div>
                        <div className="hb-header-actions">
                            <button className="hb-btn-add hb-btn-dark" onClick={() => setIsApplicationModalOpen(true)}>
                                <UserPlus size={18}/> Add Guest
                            </button>
                            <button className="hb-btn-add">
                                <Plus size={18}/> New Booking
                            </button>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="hb-stats-grid">
                        {stats.map((s, i) => (
                            <div className="hb-stat-card" key={i} style={{backgroundImage: `url(${s.image})`}}>
                                <div className="hb-stat-card-content">
                                    <h2>{s.value}</h2>
                                    <span>{s.label}</span>
                                </div>
                                <div className="hb-stat-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    {/* Filters */}
                    <div className="hb-filter-card">
                        <div className="hb-filter-wrapper">
                            <div className="hb-brand-label">HOTEL <span>FILTERS</span></div>
                            <div className="hb-filter-buttons">
                                {uniqueStatuses.map(status => (
                                    <button 
                                        key={status} 
                                        className={`hb-filter-btn ${filterStatus === status ? 'hb-active' : ''}`}
                                        onClick={() => setFilterStatus(status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <div className="hb-search-box">
                                <Search size={18} className="hb-search-icon" />
                                <input 
                                    type="text" 
                                    className="hb-search-input" 
                                    placeholder="Search Guest, Hotel, or Ref No..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="hb-table-container">
                        <table className="hb-table">
                            <thead>
                                <tr>
                                    <th style={{textAlign:'center', width:'60px'}}>#</th>
                                    <th>Ref No.</th>
                                    <th>Guest Name</th>
                                    <th>Hotel / Room</th>
                                    <th>Check-in</th>
                                    <th>Price</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentReservations.length > 0 ? (
                                    currentReservations.map((row, index) => (
                                        <tr key={row.id}>
                                            <td style={{fontWeight:'700', textAlign:'center'}}>{startIndex + index + 1}</td>
                                            <td className="hb-ref-cell">{row.id}</td>
                                            <td><div className="hb-guest-name">{row.guest}</div></td>
                                            <td>
                                                <div className="hb-guest-name">{row.hotel}</div>
                                                <div className="hb-room-info"><Bed size={12}/> {row.room}</div>
                                            </td>
                                            <td>{row.checkIn}</td>
                                            <td style={{fontWeight:'700', color: '#f97316'}}>₱{row.price.toLocaleString()}</td>
                                            <td><span className={`hb-badge ${getStatusBadgeClass(row.status)}`}>{row.status}</span></td>
                                            <td style={{textAlign:'right'}}>
                                                <div className="hb-action-group">
                                                    <button className="hb-action-btn hb-view-btn" onClick={() => handleViewReservation(row)}>
                                                        <Eye size={16}/> View
                                                    </button>
                                                    <button className="hb-action-btn hb-archive-btn" onClick={() => handleArchiveReservation(row.id)}>
                                                        <Archive size={16}/> Archive
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{textAlign:'center', padding:'60px', color:'#64748b'}}>No bookings found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="hb-pagination-nav">
                             <div className="hb-pagination-info">
                                <span className="hb-pagination-showing">
                                    Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredReservations.length)}</strong> of <strong>{filteredReservations.length}</strong> items
                                </span>
                             </div>
                             <div className="hb-pagination-jump">
                                <button className="hb-jump-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                                    <ChevronLeft size={18}/>
                                </button>
                                <form className="hb-pagination-jump-form" onSubmit={(e) => e.preventDefault()}>
                                    <span className="hb-pagination-jump-label">Page</span>
                                    <input 
                                        className="hb-jump-input" 
                                        type="number" 
                                        min="1" 
                                        max={totalPages}
                                        value={currentPage}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            if (!isNaN(val) && val >= 1 && val <= totalPages) setCurrentPage(val);
                                        }}
                                    />
                                    <span className="hb-pagination-jump-label">of {totalPages}</span>
                                </form>
                                <button className="hb-jump-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                                    <ChevronRight size={18}/>
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS - Hidden during maintenance */}
            {isReservationModalOpen && selectedReservation && (
                <ReservationModal
                    reservation={selectedReservation}
                    onClose={() => setIsReservationModalOpen(false)}
                    onConfirm={() => { alert('Confirmed'); setIsReservationModalOpen(false); }}
                    onCancel={() => { alert('Cancelled'); setIsReservationModalOpen(false); }}
                />
            )}

            <HotelApplicationModal
                isOpen={isApplicationModalOpen}
                onClose={() => setIsApplicationModalOpen(false)}
                onAddBooking={handleAddBooking}
            />
        </div>
    );
};

export default HotelBooking;