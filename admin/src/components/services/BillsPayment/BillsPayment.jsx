import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Receipt, Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import './BillsPayment.css';

// Dummy data generator for testing pagination
const generateDummyData = (count) => {
    const billers = ['Meralco', 'PLDT', 'Globe', 'Maynilad', 'BIR', 'SSS'];
    const statuses = ['Paid', 'Unpaid', 'Pending'];
    const data = [];
    for (let i = 1; i <= count; i++) {
        const status = statuses[i % 3];
        const amount = (Math.random() * 5000 + 500).toFixed(2);
        const dueDate = `Dec ${String(i).padStart(2, '0')}, 2025`;

        data.push({
            id: `BP-${String(1000 + i).padStart(4, '0')}`,
            client: `Client: User ${i}`,
            biller: billers[i % billers.length],
            acctNo: String(Math.floor(Math.random() * 9000000000) + 1000000000),
            amount: `₱${amount}`,
            dueDate: dueDate,
            status: status,
        });
    }
    return data;
};

// Main data: initial two items + 8 dummy items to reach 11 total
const initialData = [
    { id: 'BP-1001', client: 'Wanderwave Office', biller: 'Meralco', acctNo: '1234567890', amount: '₱15,000.00', dueDate: 'Nov 30, 2025', status: 'Paid' },
    { id: 'BP-1002', client: 'Client: Juan', biller: 'PLDT', acctNo: '0288881234', amount: '₱1,699.00', dueDate: 'Dec 05, 2025', status: 'Unpaid' },
    { id: 'BP-1003', client: 'Client: Maria', biller: 'Globe', acctNo: '09175551234', amount: '₱2,100.00', dueDate: 'Dec 15, 2025', status: 'Pending' },
];

const allData = [...initialData, ...generateDummyData(8)]; // 11 items total

// --- Pagination Component ---
const Pagination = ({ totalPages, currentPage, onPageChange }) => {
    const pageNumbers = useMemo(() => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(i);
        }
        return pages;
    }, [totalPages]);

    return (
        <nav className="pagination-nav">
            <ul className="pagination-list">
                <li>
                    <button
                        className="pagination-btn"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft size={16} /> Prev
                    </button>
                </li>
                {pageNumbers.map(number => (
                    <li key={number}>
                        <button
                            onClick={() => onPageChange(number)}
                            className={`pagination-btn ${number === currentPage ? 'active' : ''}`}
                        >
                            {number}
                        </button>
                    </li>
                ))}
                <li>
                    <button
                        className="pagination-btn"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Next <ChevronRight size={16} />
                    </button>
                </li>
            </ul>
        </nav>
    );
};
// --- End Pagination Component ---


const BillsPayment = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState(''); 
    const [activeStatusFilter, setActiveStatusFilter] = useState('All'); 
    const itemsPerPage = 10; 

    const stats = [
        { label: 'Total Transactions', value: allData.length.toLocaleString(), icon: <Receipt size={24}/> },
        { label: 'Pending Process', value: allData.filter(d => d.status === 'Pending').length, icon: <Clock size={24}/> },
        { label: 'Successful', value: allData.filter(d => d.status === 'Paid').length, icon: <CheckCircle size={24}/> },
        { label: 'Failed', value: allData.filter(d => d.status === 'Failed' || d.status === 'Unpaid').length, icon: <AlertTriangle size={24}/> },
    ];

    // Determine all unique statuses for filter buttons
    const allStatuses = useMemo(() => {
        const statuses = new Set(allData.map(d => d.status));
        return ['All', ...Array.from(statuses)];
    }, []);

    // Filtering and Searching Logic
    const filteredData = useMemo(() => {
        return allData.filter(item => {
            // 1. Status Filter
            const statusMatch = activeStatusFilter === 'All' || item.status === activeStatusFilter;

            // 2. Search Term Filter (Case-insensitive match on ID, Client, Biller, Account No.)
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const searchMatch = item.id.toLowerCase().includes(lowerCaseSearchTerm) ||
                                item.client.toLowerCase().includes(lowerCaseSearchTerm) ||
                                item.biller.toLowerCase().includes(lowerCaseSearchTerm) ||
                                item.acctNo.includes(lowerCaseSearchTerm);

            return statusMatch && searchMatch;
        });
    }, [activeStatusFilter, searchTerm]);

    // Pagination logic uses filteredData
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
    };

    const handleFilterChange = (status) => {
        setActiveStatusFilter(status);
        setCurrentPage(1); // Reset to first page on filter change
    };
    
    // Reset page to 1 when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Helper to map data status to CSS status class and apply size style
    const getFilterButtonProps = (status) => {
        let statusClass = '';
        if (status === 'All') {
            statusClass = activeStatusFilter === 'All' ? 'active' : '';
        } else {
            // Mapping data status ('Paid', 'Unpaid', 'Pending') to provided CSS class names
            if (status === 'Paid') {
                statusClass = activeStatusFilter === status ? 'confirmed-active' : '';
            } else if (status === 'Pending') {
                statusClass = activeStatusFilter === status ? 'pending-active' : '';
            } else if (status === 'Unpaid' || status === 'Failed') {
                statusClass = activeStatusFilter === status ? 'cancelled-active' : '';
            }
        }
        
        // Custom style to make filter buttons smaller, as requested
        const smallerStyle = { padding: '0.6rem 1.1rem', fontSize: '0.85rem', borderRadius: '8px' };

        return { 
            className: `filter-btn ${statusClass}`,
            style: smallerStyle
        };
    };


    return (
        <div className="bills-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`bills-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="bills-container">
                    <div className="bills-header">
                        <div className="bills-title">
                            <h1>Bills Payment</h1>
                            <p>Utilities, Telecom, and Government Fees</p>
                        </div>
                        <button className="bills-btn-add"><Plus size={18} style={{marginRight:'8px'}}/> Pay Bill</button>
                    </div>

                    <div className="bills-stats-grid">
                        {stats.map((s, i) => (
                            <div className="bills-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="bills-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    {/* Search and Filter Card */}
                    <div className="search-filter-card">
                        <div className="search-filter-wrapper">
                            {/* Search Box */}
                            <div className="search-box">
                                <Search size={20} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Client, or Account No..."
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filter Buttons */}
                            <div className="filter-buttons">
                                {allStatuses.map(status => {
                                    const props = getFilterButtonProps(status);
                                    return (
                                        <button
                                            key={status}
                                            {...props}
                                            onClick={() => handleFilterChange(status)}
                                        >
                                            {/* Display 'Unpaid/Failed' for the Unpaid status button if needed */}
                                            {status === 'Unpaid' ? 'Unpaid/Failed' : status}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    {/* END Search and Filter Card */}

                    <div className="bills-table-container">
                        <table className="bills-table">
                            <thead>
                                <tr>
                                    <th>No.</th> {/* Added for numbering */}
                                    <th>Trans ID</th>
                                    <th>Client/Ref</th>
                                    <th>Biller</th>
                                    <th>Account No.</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Loop over currentItems which are filtered and paginated */}
                                {currentItems.map((item, index) => (
                                    <tr key={item.id + index}>
                                        {/* Serial number calculation */}
                                        <td style={{fontWeight:'400', color:'#6b7280'}}>{indexOfFirstItem + index + 1}</td> 
                                        <td style={{fontWeight:'700', color:'#0f172a'}}>{item.id}</td>
                                        <td>{item.client}</td>
                                        <td style={{fontWeight:'700'}}>{item.biller}</td>
                                        <td style={{fontFamily:'monospace'}}>{item.acctNo}</td>
                                        <td style={{fontWeight:'700', color:'#10b981'}}>{item.amount}</td>
                                        <td>{item.dueDate}</td>
                                        <td><span className={`status-pill status-${item.status.toLowerCase()}`}>{item.status}</span></td>
                                        <td style={{textAlign:'right'}}>
                                            <button className="bills-action-btn">Receipt</button>
                                        </td>
                                    </tr>
                                ))}
                                {/* Display a row if no data is present */}
                                {currentItems.length === 0 && (
                                    <tr>
                                        <td colSpan="9" style={{ textAlign: 'center', padding: '30px' }}> {/* colSpan increased to 9 */}
                                            No bills transactions found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                        
                        {/* Pagination Navigation */}
                        {totalPages > 1 && (
                            <Pagination 
                                totalPages={totalPages} 
                                currentPage={currentPage} 
                                onPageChange={handlePageChange} 
                            />
                        )}
                        {/* Optional message for filtered results when not using pagination */}
                        {totalPages <= 1 && filteredData.length > 0 && filteredData.length < allData.length && (
                            <div style={{textAlign: 'center', marginTop: '1rem', color: '#667eea', fontWeight: '500'}}>
                                Displaying {filteredData.length} results.
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};
export default BillsPayment;