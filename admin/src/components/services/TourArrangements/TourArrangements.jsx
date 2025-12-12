import React, { useState } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Palmtree, Map, Users, CheckSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import './TourArrangements.css';

// Generate dummy data for pagination testing (15 items)
const generateDummyData = () => {
    const baseData = [
        { id: 'TR-55', client: 'Family Cruz', package: 'El Nido Island Hopping', pax: '5 Adults, 2 Kids', travelDate: 'Jan 15-18, 2026', status: 'Confirmed' },
        { id: 'TR-54', client: 'Mr. John Smith', package: 'Bohol Countryside Tour', pax: '2 Adults', travelDate: 'Feb 01-03, 2026', status: 'Pending' },
        { id: 'TR-53', client: 'Ms. Alice Johnson', package: 'Coron Wreck Diving', pax: '1 Adult', travelDate: 'Mar 10-14, 2026', status: 'Confirmed' },
        { id: 'TR-52', client: 'Group Lee', package: 'Siargao Surfing Camp', pax: '10 Adults', travelDate: 'Apr 05-12, 2026', status: 'Cancelled' },
        { id: 'TR-51', client: 'The Kim Family', package: 'Cebu City Heritage', pax: '4 Adults, 1 Kid', travelDate: 'May 20-22, 2026', status: 'Confirmed' },
        { id: 'TR-50', client: 'Mr. David Brown', package: 'Sagada Adventures', pax: '3 Adults', travelDate: 'Jun 1-4, 2026', status: 'Confirmed' },
        { id: 'TR-49', client: 'Mrs. Emily White', package: 'Batanes Scenic Route', pax: '2 Adults', travelDate: 'Jul 15-19, 2026', status: 'Confirmed' },
        { id: 'TR-48', client: 'Student Group Manila', package: 'Vigan Historical Tour', pax: '25 Adults', travelDate: 'Aug 01-02, 2026', status: 'Pending' },
        { id: 'TR-47', client: 'Mr. Michael Green', package: 'Puerto Galera Beach', pax: '4 Adults', travelDate: 'Sep 10-13, 2026', status: 'Confirmed' },
        { id: 'TR-46', client: 'Couple Tan', package: 'Palawan Underground River', pax: '2 Adults', travelDate: 'Oct 25-27, 2026', status: 'Confirmed' },
        { id: 'TR-45', client: 'Family Garcia', package: 'Iloilo Culinary Tour', pax: '6 Adults, 3 Kids', travelDate: 'Nov 05-08, 2026', status: 'Pending' },
        { id: 'TR-44', client: 'Mr. Chris Evans', package: 'Davao Durian Experience', pax: '1 Adult', travelDate: 'Dec 12-14, 2026', status: 'Confirmed' },
        { id: 'TR-43', client: 'Ms. Samantha Fox', package: 'Legazpi Mayon View', pax: '2 Adults', travelDate: 'Jan 05-07, 2027', status: 'Confirmed' },
        { id: 'TR-42', client: 'The Rodriguez Group', package: 'Baguio Transient Stay', pax: '8 Adults', travelDate: 'Feb 14-17, 2027', status: 'Confirmed' },
        { id: 'TR-41', client: 'Mr. Peter Parker', package: 'Tawi-Tawi Expedition', pax: '1 Adult', travelDate: 'Mar 20-25, 2027', status: 'Pending' },
    ];
    return baseData;
};

const TourArrangements = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Set to 10 items per page

    const stats = [
        { label: 'Active Tours', value: '5', icon: <Palmtree size={24}/> },
        { label: 'Upcoming', value: '3', icon: <Map size={24}/> },
        { label: 'Completed', value: '89', icon: <CheckSquare size={24}/> },
        { label: 'Inquiries', value: '12', icon: <Users size={24}/> },
    ];

    const data = generateDummyData();

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const paginate = (pageNumber) => {
        if (pageNumber > 0 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Confirmed':
                return { background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }; // Green
            case 'Pending':
                return { background: '#fef9c3', color: '#854d0e', borderColor: '#fde047' }; // Yellow
            case 'Cancelled':
                return { background: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' }; // Red
            default:
                return { background: '#f3f4f6', color: '#4b5563', borderColor: '#e5e7eb' }; // Gray
        }
    };

    return (
        <div className="tour-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`tour-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="tour-container">
                    <div className="tour-header">
                        <div className="tour-title">
                            <h1>Tour Packages</h1>
                            <p>Customized itineraries and travel arrangements</p>
                        </div>
                        <button className="tour-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Create Package</button>
                    </div>

                    <div className="tour-stats-grid">
                        {stats.map((s, i) => (
                            <div className="tour-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="tour-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="tour-table-container">
                        <table className="tour-table">
                            <thead>
                                <tr>
                                    <th>Tour ID</th>
                                    <th>Lead Guest</th>
                                    <th>Package Name</th>
                                    <th>Pax</th>
                                    <th>Travel Dates</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((row) => {
                                    const statusStyle = getStatusStyle(row.status);
                                    return (
                                    <tr key={row.id}>
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{row.id}</td>
                                        <td>{row.client}</td>
                                        <td>{row.package}</td>
                                        <td>{row.pax}</td>
                                        <td>{row.travelDate}</td>
                                        <td>
                                            <span style={{
                                                background: statusStyle.background,
                                                color: statusStyle.color,
                                                padding: '4px 10px',
                                                borderRadius: '6px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                textTransform: 'uppercase',
                                                border: `1px solid ${statusStyle.borderColor}`
                                            }}>
                                                {row.status}
                                            </span>
                                        </td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="tour-action-btn">View</button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                        
                        {/* Pagination Navigation */}
                        {totalPages > 1 && (
                            <nav className="pagination-nav">
                                <ul className="pagination-list">
                                    <li>
                                        <button 
                                            onClick={() => paginate(currentPage - 1)} 
                                            disabled={currentPage === 1}
                                            className="pagination-btn"
                                        >
                                            <ChevronLeft size={16}/>
                                        </button>
                                    </li>
                                    
                                    {pageNumbers.map(number => (
                                        <li key={number}>
                                            <button
                                                onClick={() => paginate(number)}
                                                className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                                            >
                                                {number}
                                            </button>
                                        </li>
                                    ))}

                                    <li>
                                        <button 
                                            onClick={() => paginate(currentPage + 1)} 
                                            disabled={currentPage === totalPages}
                                            className="pagination-btn"
                                        >
                                            <ChevronRight size={16}/>
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
export default TourArrangements;