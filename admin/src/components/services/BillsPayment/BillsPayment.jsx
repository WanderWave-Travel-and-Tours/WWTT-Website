import React, { useState, useMemo } from 'react';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Receipt, Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
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

// Main data: initial two items + 8 dummy items to reach 10 total
const initialData = [
    { id: 'BP-1001', client: 'Wanderwave Office', biller: 'Meralco', acctNo: '1234567890', amount: '₱15,000.00', dueDate: 'Nov 30, 2025', status: 'Paid' },
    { id: 'BP-1002', client: 'Client: Juan', biller: 'PLDT', acctNo: '0288881234', amount: '₱1,699.00', dueDate: 'Dec 05, 2025', status: 'Unpaid' },
    { id: 'BP-1002', client: 'Client: Juan', biller: 'PLDT', acctNo: '0288881234', amount: '₱1,699.00', dueDate: 'Dec 05, 2025', status: 'Unpaid' },
];

const allData = [...initialData, ...generateDummyData(8)]; // 10 items total

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
    const itemsPerPage = 10; // Set to 10 as requested

    const stats = [
        { label: 'Total Transactions', value: allData.length.toLocaleString(), icon: <Receipt size={24}/> },
        { label: 'Pending Process', value: allData.filter(d => d.status === 'Pending').length, icon: <Clock size={24}/> },
        { label: 'Successful', value: allData.filter(d => d.status === 'Paid').length, icon: <CheckCircle size={24}/> },
        { label: 'Failed', value: allData.filter(d => d.status === 'Failed' || d.status === 'Unpaid').length, icon: <AlertTriangle size={24}/> },
    ];

    // Pagination logic
    const totalPages = Math.ceil(allData.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = allData.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber < 1 || pageNumber > totalPages) return;
        setCurrentPage(pageNumber);
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

                    <div className="bills-table-container">
                        <table className="bills-table">
                            <thead>
                                <tr>
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
                                {currentItems.map((item) => (
                                    <tr key={item.id}>
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
                                        <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                                            No bills transactions found.
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
                    </div>
                </div>
            </main>
        </div>
    );
};
export default BillsPayment;