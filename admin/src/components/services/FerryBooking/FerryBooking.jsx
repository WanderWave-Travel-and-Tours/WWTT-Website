import React, { useState, useMemo } from 'react';
import Sidebar from '../../sidebar/sidebar';
import Maintenance from '../../maintenance/Maintenance'; // Import ng Maintenance Component
import { Ship, Calendar, Ticket, Anchor, Plus, Search, ChevronLeft, ChevronRight, Eye, Archive } from 'lucide-react';
import { BookingModal, RouteListModal } from './FerryModals';
import { FerryApplicationModal } from './FerryApplicationModal';
import './FerryBooking.css';

// Destination Images for Stats Cards
const FERRY_STAT_IMAGES = {
    TOTAL: 'https://images.unsplash.com/photo-1549563311-66258f9df0b9?auto=format&fit=crop&q=80&w=1000',
    DEPARTING: 'https://images.unsplash.com/photo-1569263979104-865ab7dd8d36?auto=format&fit=crop&q=80&w=1000',
    ISSUED: 'https://images.unsplash.com/photo-1518228394602-5a987d602330?auto=format&fit=crop&q=80&w=1000',
    CANCELLED: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=1000'
};

// Mock Data
const initialBookings = [
    { id: 'FRY-21', client: 'Pedro Penduko', vessel: '2GO Travel', route: 'MNL - CEB', class: 'Tourist', date: 'Dec 18, 2025', status: 'Issued', price: 2500 },
    { id: 'FRY-22', client: 'Juan Tamad', vessel: 'OceanJet', route: 'CEB - TAG', class: 'Open Air', date: 'Dec 19, 2025', status: 'Pending', price: 800 },
    { id: 'FRY-23', client: 'Maria Clara', vessel: 'FastCat', route: 'BAT - CAL', class: 'Business', date: 'Dec 20, 2025', status: 'Issued', price: 1200 },
    { id: 'FRY-24', client: 'Elias Noli', vessel: 'SuperFerry', route: 'CEB - CGY', class: 'Economy', date: 'Dec 21, 2025', status: 'Issued', price: 1500 },
    { id: 'FRY-25', client: 'Sisa Madriaga', vessel: 'Montenegro', route: 'ILO - BAC', class: 'Tourist', date: 'Dec 22, 2025', status: 'Pending', price: 550 },
    { id: 'FRY-26', client: 'Basilio Crisostomo', vessel: 'Lite Ferry', route: 'TAG - CEB', class: 'Open Air', date: 'Dec 23, 2025', status: 'Issued', price: 700 },
    { id: 'FRY-27', client: 'Crispin Basilio', vessel: 'Aleson Shipping', route: 'ZAM - JOL', class: 'Tourist', date: 'Dec 24, 2025', status: 'Issued', price: 1800 },
    { id: 'FRY-28', client: 'Don Santiago', vessel: 'Trans-Asia', route: 'MNL - TAC', class: 'Business', date: 'Dec 25, 2025', status: 'Issued', price: 3000 },
];

const ITEMS_PER_PAGE = 8;

const FerryBooking = () => {
    // --- MAINTENANCE MODE TOGGLE ---
    // Palitan mo ito ng 'false' kapag tapos na ang maintenance para lumabas ulit ang system
    const MAINTENANCE_MODE = true; 

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [bookings, setBookings] = useState(initialBookings);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');
    
    // Modals State
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
    const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);

    // Filtering Logic
    const filteredBookings = useMemo(() => {
        let list = bookings;
        if (filterStatus !== 'All') {
            list = list.filter(b => b.status === filterStatus);
        }
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            list = list.filter(b => 
                b.client.toLowerCase().includes(search) ||
                b.id.toLowerCase().includes(search) ||
                b.vessel.toLowerCase().includes(search)
            );
        }
        return list;
    }, [bookings, filterStatus, searchTerm]);

    // Stats Logic
    const stats = [
        { label: 'Total Bookings', value: bookings.length, icon: <Ship size={24}/>, image: FERRY_STAT_IMAGES.TOTAL },
        { label: 'Departing Today', value: '2', icon: <Calendar size={24}/>, image: FERRY_STAT_IMAGES.DEPARTING },
        { label: 'Tickets Issued', value: bookings.filter(b => b.status === 'Issued').length, icon: <Ticket size={24}/>, image: FERRY_STAT_IMAGES.ISSUED },
        { label: 'Cancellations', value: '0', icon: <Anchor size={24}/>, image: FERRY_STAT_IMAGES.CANCELLED },
    ];

    // Pagination Logic
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentBookings = filteredBookings.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Handlers
    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setIsBookingModalOpen(true);
    };

    const handleArchiveBooking = (id) => {
        if(window.confirm("Are you sure you want to archive this booking?")) {
            setBookings(bookings.filter(b => b.id !== id));
        }
    };

    const handleStatusUpdate = (id, newStatus) => {
        setBookings(bookings.map(b => b.id === id ? {...b, status: newStatus} : b));
        if (selectedBooking && selectedBooking.id === id) {
            setSelectedBooking({...selectedBooking, status: newStatus});
        }
        alert(`Booking status updated to ${newStatus}`);
    };

    const handleAddBooking = (newBooking) => {
        setBookings([newBooking, ...bookings]);
    };

    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'issued': return 'ferry-badge-issued';
            case 'pending': return 'ferry-badge-pending';
            case 'cancelled': return 'ferry-badge-cancelled';
            default: return 'ferry-badge-confirmed';
        }
    };

    const uniqueStatuses = ['All', ...new Set(bookings.map(b => b.status))];

    // --- RENDER LOGIC ---

    // 1. KUNG NAKA MAINTENANCE MODE
    if (MAINTENANCE_MODE) {
        return (
            <div className="ferry-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
                <main className={`ferry-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                    <Maintenance />
                </main>
            </div>
        );
    }

    // 2. KUNG LIVE NA ANG SYSTEM (Normal View)
    return (
        <div className="ferry-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            
            <main className={`ferry-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="ferry-container">
                    <div className="ferry-header">
                        <div className="ferry-title">
                            <h1>Ferry Booking</h1>
                            <p>Inter-island vessel schedules and ticketing.</p>
                        </div>
                        <div style={{display:'flex', gap:'12px'}}>
                            <button className="ferry-btn-add ferry-btn-dark" onClick={() => setIsApplicationModalOpen(true)}>
                                <Plus size={18}/> Book Ferry
                            </button>
                            <button className="ferry-btn-add" onClick={() => setIsRouteModalOpen(true)}>
                                <Anchor size={18}/> Manage Routes
                            </button>
                        </div>
                    </div>

                    <div className="ferry-stats-grid">
                        {stats.map((s, i) => (
                            <div className="ferry-stat-card" key={i} style={{backgroundImage: `url(${s.image})`}}>
                                <div className="ferry-stat-card-content">
                                    <h2>{s.value}</h2>
                                    <span>{s.label}</span>
                                </div>
                                <div className="ferry-stat-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="ferry-filter-card">
                        <div className="ferry-filter-wrapper">
                            <div className="ferry-brand-label">FERRY <span>FILTERS</span></div>
                            <div className="ferry-filter-buttons">
                                {uniqueStatuses.map(status => (
                                    <button 
                                        key={status} 
                                        className={`ferry-filter-btn ${filterStatus === status ? 'ferry-active-navy' : ''}`}
                                        onClick={() => setFilterStatus(status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <div className="ferry-search-box">
                                <Search size={18} className="ferry-search-icon" />
                                <input 
                                    type="text" 
                                    className="ferry-search-input" 
                                    placeholder="Search Passenger, Vessel, or Ref No..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="ferry-table-container">
                        <table className="ferry-table">
                            <thead>
                                <tr>
                                    <th style={{textAlign:'center', width:'60px'}}>#</th>
                                    <th>Ref No.</th>
                                    <th>Passenger</th>
                                    <th>Vessel / Route</th>
                                    <th>Class</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentBookings.length > 0 ? (
                                    currentBookings.map((row, index) => (
                                        <tr key={row.id}>
                                            <td style={{fontWeight:'700', textAlign:'center'}}>{startIndex + index + 1}</td>
                                            <td className="ferry-ref-cell">{row.id}</td>
                                            <td>
                                                <div className="ferry-client-name">{row.client}</div>
                                            </td>
                                            <td>
                                                <span className="ferry-vessel-badge">{row.vessel}</span>
                                                <div className="ferry-route-info">{row.route}</div>
                                            </td>
                                            <td>{row.class}</td>
                                            <td>{row.date}</td>
                                            <td><span className={`ferry-table-badge ${getStatusBadgeClass(row.status)}`}>{row.status}</span></td>
                                            <td style={{textAlign:'right'}}>
                                                <div className="ferry-action-group">
                                                    <button className="ferry-action-btn ferry-view-btn" onClick={() => handleViewBooking(row)}>
                                                        <Eye size={16}/> View
                                                    </button>
                                                    <button className="ferry-action-btn ferry-archive-btn" onClick={() => handleArchiveBooking(row.id)}>
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

                    {totalPages > 1 && (
                        <div className="ferry-pagination-nav">
                             <div className="ferry-pagination-info">
                                <span className="ferry-pagination-showing">
                                    Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredBookings.length)}</strong> of <strong>{filteredBookings.length}</strong> items
                                </span>
                             </div>
                             <div className="ferry-pagination-jump">
                                <button className="ferry-jump-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                                    <ChevronLeft size={18}/>
                                </button>
                                <span className="ferry-pagination-jump-label">Page {currentPage} of {totalPages}</span>
                                <button className="ferry-jump-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                                    <ChevronRight size={18}/>
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS - Not visible during maintenance */}
            <FerryApplicationModal 
                isOpen={isApplicationModalOpen} 
                onClose={() => setIsApplicationModalOpen(false)}
                onAddBooking={handleAddBooking}
            />

            {isBookingModalOpen && selectedBooking && (
                <BookingModal 
                    booking={selectedBooking}
                    onClose={() => setIsBookingModalOpen(false)}
                    onUpdateStatus={handleStatusUpdate}
                />
            )}

            {isRouteModalOpen && (
                <RouteListModal onClose={() => setIsRouteModalOpen(false)} />
            )}
        </div>
    );
};

export default FerryBooking;