import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Anchor, Ship, Calendar, Ticket, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import './FerryBooking.css';

// Mock data increased to test pagination
const allBookings = [
    { id: 'FRY-21', client: 'Pedro Penduko', vessel: '2GO Travel', route: 'MNL - CEB', class: 'Tourist', date: 'Dec 18, 2025', status: 'Issued' },
    { id: 'FRY-22', client: 'Juan Tamad', vessel: 'OceanJet', route: 'CEB - TAG', class: 'Open Air', date: 'Dec 19, 2025', status: 'Pending' },
    { id: 'FRY-23', client: 'Maria Clara', vessel: 'FastCat', route: 'BAT - CAL', class: 'Business', date: 'Dec 20, 2025', status: 'Issued' },
    { id: 'FRY-24', client: 'Elias Noli', vessel: 'SuperFerry', route: 'CEB - CGY', class: 'Economy', date: 'Dec 21, 2025', status: 'Issued' },
    { id: 'FRY-25', client: 'Sisa Madriaga', vessel: 'Montenegro', route: 'ILO - BAC', class: 'Tourist', date: 'Dec 22, 2025', status: 'Pending' },
    { id: 'FRY-26', client: 'Basilio Crisostomo', vessel: 'Lite Ferry', route: 'TAG - CEB', class: 'Open Air', date: 'Dec 23, 2025', status: 'Issued' },
    { id: 'FRY-27', client: 'Crispin Basilio', vessel: 'Aleson Shipping', route: 'ZAM - JOL', class: 'Tourist', date: 'Dec 24, 2025', status: 'Issued' },
    { id: 'FRY-28', client: 'Don Santiago', vessel: 'Trans-Asia', route: 'MNL - TAC', class: 'Business', date: 'Dec 25, 2025', status: 'Issued' },
    { id: 'FRY-29', client: 'Kapitan Tiago', vessel: 'Medallion', route: 'CEB - MAS', class: 'Economy', date: 'Dec 26, 2025', status: 'Pending' },
    { id: 'FRY-30', client: 'Padre Damaso', vessel: 'Starlite Ferries', route: 'BAT - PUE', class: 'Tourist', date: 'Dec 27, 2025', status: 'Issued' },
    // Page 2
    { id: 'FRY-31', client: 'Tiya Isabel', vessel: '2GO Travel', route: 'MNL - CEB', class: 'Tourist', date: 'Dec 28, 2025', status: 'Issued' },
    { id: 'FRY-32', client: 'Ibarra Crisostomo', vessel: 'OceanJet', route: 'CEB - TAG', class: 'Open Air', date: 'Dec 29, 2025', status: 'Issued' },
    { id: 'FRY-33', client: 'Victorina Pelaez', vessel: 'FastCat', route: 'BAT - CAL', class: 'Business', date: 'Dec 30, 2025', status: 'Pending' },
    { id: 'FRY-34', client: 'Doña Consolacion', vessel: 'SuperFerry', route: 'CEB - CGY', class: 'Economy', date: 'Dec 31, 2025', status: 'Issued' },
    { id: 'FRY-35', client: 'Fray Salvi', vessel: 'Montenegro', route: 'ILO - BAC', class: 'Tourist', date: 'Jan 01, 2026', status: 'Issued' },
    // Page 3
    { id: 'FRY-36', client: 'Pilosopo Tasio', vessel: 'Lite Ferry', route: 'TAG - CEB', class: 'Open Air', date: 'Jan 02, 2026', status: 'Issued' },
    { id: 'FRY-37', client: 'Señor Pasta', vessel: 'Aleson Shipping', route: 'ZAM - JOL', class: 'Tourist', date: 'Jan 03, 2026', status: 'Pending' },
    { id: 'FRY-38', client: 'Simoun', vessel: 'Trans-Asia', route: 'MNL - TAC', class: 'Business', date: 'Jan 04, 2026', status: 'Issued' },
    { id: 'FRY-39', client: 'Juli Elman', vessel: 'Medallion', route: 'CEB - MAS', class: 'Economy', date: 'Jan 05, 2026', status: 'Issued' },
    { id: 'FRY-40', client: 'Kabesang Tales', vessel: 'Starlite Ferries', route: 'BAT - PUE', class: 'Tourist', date: 'Jan 06, 2026', status: 'Issued' },
    // Page 4 (Partial)
    { id: 'FRY-41', client: 'Isagani', vessel: '2GO Travel', route: 'MNL - CEB', class: 'Tourist', date: 'Jan 07, 2026', status: 'Pending' },
    { id: 'FRY-42', client: 'Paulita Gomez', vessel: 'OceanJet', route: 'CEB - TAG', class: 'Open Air', date: 'Jan 08, 2026', status: 'Issued' },
    { id: 'FRY-43', client: 'Don Custodio', vessel: 'FastCat', route: 'BAT - CAL', class: 'Business', date: 'Jan 09, 2026', status: 'Issued' },
    { id: 'FRY-44', client: 'Pepay The Dancer', vessel: 'SuperFerry', route: 'CEB - CGY', class: 'Economy', date: 'Jan 10, 2026', status: 'Issued' },
    { id: 'FRY-45', client: 'Mr. Leeds', vessel: 'Montenegro', route: 'ILO - BAC', class: 'Tourist', date: 'Jan 11, 2026', status: 'Pending' },
];

const ITEMS_PER_PAGE = 10;

const FerryBooking = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const stats = [
        { label: 'Total Bookings', value: allBookings.length, icon: <Ship size={24}/> },
        { label: 'Departing Today', value: '4', icon: <Calendar size={24}/> },
        { label: 'Tickets Issued', value: allBookings.filter(b => b.status === 'Issued').length, icon: <Ticket size={24}/> },
        { label: 'Cancellations', value: '1', icon: <Anchor size={24}/> },
    ];

    // Pagination Logic
    const totalPages = Math.ceil(allBookings.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentBookings = allBookings.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const renderPageNumbers = () => {
        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(
                <li key={i}>
                    <button 
                        onClick={() => handlePageChange(i)} 
                        className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
                    >
                        {i}
                    </button>
                </li>
            );
        }
        return pageNumbers;
    };

    return (
        <div className="ferry-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`ferry-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="ferry-header">
                    <div className="ferry-title">
                        <h1>Ferry Booking</h1>
                        <p>Inter-island vessel schedules and ticketing.</p>
                    </div>
                    <button className="ferry-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Book Ferry</button>
                </div>

                <div className="ferry-stats-grid">
                    {stats.map((stat, i) => (
                        <div className="ferry-card" key={i}>
                            <div>
                                <h2>{stat.value}</h2>
                                <span>{stat.label}</span>
                            </div>
                            <div className="ferry-card-icon">{stat.icon}</div>
                        </div>
                    ))}
                </div>

                <div className="ferry-table-container">
                    <table className="ferry-table">
                        <thead>
                            <tr>
                                <th>Ticket ID</th>
                                <th>Passenger</th>
                                <th>Vessel Line</th>
                                <th>Route</th>
                                <th>Class</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentBookings.map((item) => (
                                <tr key={item.id}>
                                    <td style={{fontWeight:'700'}}>{item.id}</td>
                                    <td>{item.client}</td>
                                    <td>{item.vessel}</td>
                                    <td style={{fontFamily:'monospace'}}>{item.route}</td>
                                    <td>{item.class}</td>
                                    <td>{item.date}</td>
                                    <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                                    <td><button className="ferry-action-btn">View</button></td>
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
                                        <ChevronLeft size={16} /> Prev
                                    </button>
                                </li>
                                {renderPageNumbers()}
                                <li>
                                    <button
                                        className="pagination-btn"
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next <ChevronRight size={16} />
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    )}
                </div>
            </main>
        </div>
    );
};

export default FerryBooking;