import React, { useState, useMemo } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Hotel, CalendarCheck, XCircle, Bed, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import './HotelBooking.css';

const HotelBooking = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; 

    // --- NEW STATE FOR SEARCH AND FILTER ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All'); // 'All', 'Confirmed', 'Pending', 'Cancelled'

    const stats = [
        { label: 'Room Reservations', value: '342', icon: <Hotel size={24}/> },
        { label: 'Check-ins Today', value: '8', icon: <Bed size={24}/> },
        { label: 'Confirmed', value: '310', icon: <CalendarCheck size={24}/> },
        { label: 'Cancelled', value: '24', icon: <XCircle size={24}/> },
    ];

    const allReservations = [
        { id: 'HTL-55', client: 'Coco Martin', hotel: 'Henann Resort', location: 'Boracay', dates: 'Dec 20 - Dec 25', status: 'Confirmed' },
        { id: 'HTL-56', client: 'Vice Ganda', hotel: 'Okada Manila', location: 'Manila', dates: 'Dec 31 - Jan 02', status: 'Pending' },
        { id: 'HTL-57', client: 'Kathryn Bernardo', hotel: 'Plantation Bay', location: 'Cebu', dates: 'Jan 05 - Jan 10', status: 'Confirmed' },
        { id: 'HTL-58', client: 'Daniel Padilla', hotel: 'Shangri-La Boracay', location: 'Boracay', dates: 'Feb 14 - Feb 18', status: 'Confirmed' },
        { id: 'HTL-59', client: 'Maine Mendoza', hotel: 'El Nido Resorts', location: 'Palawan', dates: 'Mar 01 - Mar 07', status: 'Pending' },
        { id: 'HTL-60', client: 'Alden Richards', hotel: 'Discovery Shores', location: 'Boracay', dates: 'Apr 10 - Apr 15', status: 'Confirmed' },
        { id: 'HTL-61', client: 'Angel Locsin', hotel: 'Crimson Resort', location: 'Mactan', dates: 'May 01 - May 05', status: 'Confirmed' },
        { id: 'HTL-62', client: 'Jericho Rosales', hotel: 'The Peninsula Manila', location: 'Manila', dates: 'Jun 22 - Jun 25', status: 'Cancelled' },
        { id: 'HTL-63', client: 'Bea Alonzo', hotel: 'Amanpulo', location: 'Palawan', dates: 'Jul 04 - Jul 10', status: 'Confirmed' },
        { id: 'HTL-64', client: 'John Lloyd Cruz', hotel: 'Seda Vertis North', location: 'Quezon City', dates: 'Aug 01 - Aug 03', status: 'Confirmed' },
        { id: 'HTL-65', client: 'Sarah Geronimo', hotel: 'Taal Vista Hotel', location: 'Tagaytay', dates: 'Sep 15 - Sep 17', status: 'Confirmed' },
        { id: 'HTL-66', client: 'Matteo Guidicelli', hotel: 'The Manor', location: 'Baguio', dates: 'Oct 20 - Oct 25', status: 'Pending' },
    ];
    
    // Function to handle filtering and searching
    const getFilteredReservations = useMemo(() => {
        let filtered = allReservations;
        
        // 1. Filter by Status
        if (filterStatus !== 'All') {
            filtered = filtered.filter(res => res.status === filterStatus);
        }

        // 2. Filter by Search Term
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(res => 
                res.id.toLowerCase().includes(lowerCaseSearchTerm) ||
                res.client.toLowerCase().includes(lowerCaseSearchTerm) ||
                res.hotel.toLowerCase().includes(lowerCaseSearchTerm) ||
                res.location.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        // Reset page to 1 after filtering/searching
        if (currentPage !== 1 && filtered.length > 0) {
            setCurrentPage(1);
        }

        return filtered;
    }, [filterStatus, searchTerm, allReservations, currentPage]); // Include currentPage in dependency array to prevent infinite loop

    // Logic for pagination
    const totalItems = getFilteredReservations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const reservationsToShow = getFilteredReservations.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    const handleFilterChange = (status) => {
        setFilterStatus(status);
        setCurrentPage(1); // Reset page to 1 on filter change
    };

    const renderPageNumbers = () => {
        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(
                <li key={i}>
                    <button 
                        className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
                        onClick={() => handlePageChange(i)}
                    >
                        {i}
                    </button>
                </li>
            );
        }
        return pageNumbers;
    };
    
    // Helper to get dynamic class for filter button
    const getFilterClass = (status) => {
        if (filterStatus === status) {
            return status === 'All' ? 'active' : status.toLowerCase() + '-active';
        }
        return '';
    };

    return (
        <div className="hotel-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`hotel-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="hotel-container">
                    <div className="hotel-header">
                        <div className="hotel-title">
                            <h1>Hotel Reservations</h1>
                            <p>Manage hotel inventory and guest bookings</p>
                        </div>
                        <button className="hotel-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> New Reservation</button>
                    </div>

                    <div className="hotel-stats-grid">
                        {stats.map((s, i) => (
                            <div className="hotel-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="hotel-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>
                    
                    {/* --- NEW SEARCH AND FILTER CARD --- */}
                    <div className="search-filter-card">
                        <div className="search-filter-wrapper">
                            <div className="search-box">
                                <Search size={20} className="search-icon" />
                                <input 
                                    type="text"
                                    placeholder="Search by ID, Guest Name, Hotel, or Location..."
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            
                            <div className="filter-buttons">
                                <button 
                                    className={`filter-btn ${getFilterClass('All')}`}
                                    onClick={() => handleFilterChange('All')}
                                >
                                    All Bookings
                                </button>
                                <button 
                                    className={`filter-btn ${getFilterClass('Confirmed')}`}
                                    onClick={() => handleFilterChange('Confirmed')}
                                >
                                    Confirmed
                                </button>
                                <button 
                                    className={`filter-btn ${getFilterClass('Pending')}`}
                                    onClick={() => handleFilterChange('Pending')}
                                >
                                    Pending
                                </button>
                                <button 
                                    className={`filter-btn ${getFilterClass('Cancelled')}`}
                                    onClick={() => handleFilterChange('Cancelled')}
                                >
                                    Cancelled
                                </button>
                            </div>
                        </div>
                    </div>
                    {/* --- END NEW SEARCH AND FILTER CARD --- */}


                    <div className="hotel-table-container">
                        <table className="hotel-table">
                            <thead>
                                <tr>
                                    <th>Resv ID</th>
                                    <th>Guest Name</th>
                                    <th>Hotel / Resort</th>
                                    <th>Travel Dates</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reservationsToShow.map((res) => (
                                    <tr key={res.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{res.id}</td>
                                        <td>{res.client}</td>
                                        <td>{res.hotel} <span style={{color:'#64748b', fontSize:'12px'}}>({res.location})</span></td>
                                        <td>{res.dates}</td>
                                        <td>
                                            <span className={`hotel-badge status-${res.status === 'Confirmed' ? 'active' : res.status === 'Pending' ? 'pending' : 'cancelled'}`}>
                                                {res.status}
                                            </span>
                                        </td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="hotel-action-btn">View Details</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination Navigation */}
                        {totalPages > 1 && (
                            <nav className="pagination-nav">
                                <ul className="pagination-list">
                                    <li>
                                        <button 
                                            className="pagination-btn" 
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft size={16}/> Prev
                                        </button>
                                    </li>
                                    
                                    {renderPageNumbers()}
                                    
                                    <li>
                                        <button 
                                            className="pagination-btn" 
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            Next <ChevronRight size={16}/>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        )}

                    </div>
                </div>
            </main>
        </div>
    );
};
export default HotelBooking;