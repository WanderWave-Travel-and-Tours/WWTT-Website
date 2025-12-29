import React, { useState, useMemo } from 'react';
import Sidebar from '../../sidebar/sidebar';
import Maintenance from '../../maintenance/Maintenance'; // Import Maintenance Component
import { Plus, Receipt, Clock, CheckCircle, AlertTriangle, ChevronLeft, ChevronRight, Search, Eye, Archive } from 'lucide-react';
import { BillsModal } from './BillsModals';
import { BillsApplicationModal } from './BillsApplicationModal';
import './BillsPayment.css';

// Generic Images for Stats
const BP_STAT_IMAGES = {
    TOTAL: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=1000',
    PENDING: 'https://images.unsplash.com/photo-1554224154-26032ffc0d07?auto=format&fit=crop&q=80&w=1000',
    PAID: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000',
    FAILED: 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&q=80&w=1000'
};

const ITEMS_PER_PAGE = 10;

// Mock Data
const initialBills = [
    { id: 'BP-1001', client: 'Wanderwave Office', biller: 'Meralco', acctNo: '1234567890', amount: 15000, dueDate: 'Nov 30, 2025', status: 'Paid' },
    { id: 'BP-1002', client: 'Client: Juan', biller: 'PLDT', acctNo: '0288881234', amount: 1699, dueDate: 'Dec 05, 2025', status: 'Unpaid' },
    { id: 'BP-1003', client: 'Client: Maria', biller: 'Globe', acctNo: '09175551234', amount: 2100, dueDate: 'Dec 15, 2025', status: 'Pending' },
    { id: 'BP-1004', client: 'Client: Pedro', biller: 'Maynilad', acctNo: '00112233', amount: 450, dueDate: 'Dec 18, 2025', status: 'Paid' },
    { id: 'BP-1005', client: 'Client: Ana', biller: 'Converge', acctNo: '11223344', amount: 1500, dueDate: 'Dec 20, 2025', status: 'Failed' },
    { id: 'BP-1006', client: 'Client: Jose', biller: 'Meralco', acctNo: '55667788', amount: 3200, dueDate: 'Dec 25, 2025', status: 'Pending' },
    { id: 'BP-1007', client: 'Client: Clara', biller: 'SkyCable', acctNo: '99887766', amount: 999, dueDate: 'Dec 28, 2025', status: 'Paid' },
    { id: 'BP-1008', client: 'Client: Mario', biller: 'SSS', acctNo: '33445566', amount: 2400, dueDate: 'Dec 30, 2025', status: 'Pending' },
    { id: 'BP-1009', client: 'Client: Luigi', biller: 'PhilHealth', acctNo: '77889900', amount: 500, dueDate: 'Jan 05, 2026', status: 'Paid' },
    { id: 'BP-1010', client: 'Client: Peach', biller: 'Pag-IBIG', acctNo: '11221122', amount: 200, dueDate: 'Jan 10, 2026', status: 'Unpaid' },
    { id: 'BP-1011', client: 'Client: Bowser', biller: 'Meralco', acctNo: '66666666', amount: 12000, dueDate: 'Jan 15, 2026', status: 'Pending' },
];

const BillsPayment = () => {
    // --- MAINTENANCE MODE TOGGLE ---
    // Change this to 'false' to show the actual system
    const MAINTENANCE_MODE = true; 

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [bills, setBills] = useState(initialBills);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modals
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);

    // Filter Logic
    const filteredBills = useMemo(() => {
        let list = bills;
        if (filterStatus !== 'All') {
            list = list.filter(b => b.status === filterStatus);
        }
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            list = list.filter(b => 
                b.client.toLowerCase().includes(search) ||
                b.biller.toLowerCase().includes(search) ||
                b.id.toLowerCase().includes(search) ||
                b.acctNo.includes(search)
            );
        }
        return list;
    }, [bills, filterStatus, searchTerm]);

    // Stats Logic
    const stats = [
        { label: 'Total Transactions', value: bills.length, icon: <Receipt size={24}/>, image: BP_STAT_IMAGES.TOTAL },
        { label: 'Pending Process', value: bills.filter(b => b.status === 'Pending').length, icon: <Clock size={24}/>, image: BP_STAT_IMAGES.PENDING },
        { label: 'Successful', value: bills.filter(b => b.status === 'Paid').length, icon: <CheckCircle size={24}/>, image: BP_STAT_IMAGES.PAID },
        { label: 'Failed/Unpaid', value: bills.filter(b => b.status === 'Failed' || b.status === 'Unpaid').length, icon: <AlertTriangle size={24}/>, image: BP_STAT_IMAGES.FAILED },
    ];

    // Pagination
    const totalPages = Math.ceil(filteredBills.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentBills = filteredBills.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleViewBill = (bill) => {
        setSelectedBill(bill);
        setIsDetailsModalOpen(true);
    };

    const handleArchiveBill = (id) => {
        if(window.confirm("Are you sure you want to archive this transaction?")) {
            setBills(bills.filter(b => b.id !== id));
        }
    };

    const handleStatusUpdate = (id, newStatus) => {
        setBills(bills.map(b => b.id === id ? {...b, status: newStatus} : b));
        if (selectedBill && selectedBill.id === id) {
            setSelectedBill({...selectedBill, status: newStatus});
        }
        alert(`Transaction updated to ${newStatus}`);
    };

    const handleAddBill = (newBill) => {
        setBills([newBill, ...bills]);
    };

    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'paid': return 'bills-badge-paid';
            case 'pending': return 'bills-badge-pending';
            case 'failed': return 'bills-badge-failed';
            case 'unpaid': return 'bills-badge-unpaid';
            default: return 'bills-badge-pending';
        }
    };

    const uniqueStatuses = ['All', 'Paid', 'Pending', 'Unpaid', 'Failed'];

    // --- RENDER LOGIC ---

    // 1. KUNG NAKA MAINTENANCE MODE
    if (MAINTENANCE_MODE) {
        return (
            <div className="bills-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
                <main className={`bills-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                    <Maintenance />
                </main>
            </div>
        );
    }

    // 2. KUNG LIVE NA ANG SYSTEM (Normal View)
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
                        <div style={{display:'flex', gap:'12px'}}>
                            <button className="bills-btn-add bills-btn-dark" onClick={() => setIsAppModalOpen(true)}>
                                <Plus size={18}/> Pay Bill
                            </button>
                        </div>
                    </div>

                    <div className="bills-stats-grid">
                        {stats.map((s, i) => (
                            <div className="bills-stat-card" key={i} style={{backgroundImage: `url(${s.image})`}}>
                                <div className="bills-stat-card-content">
                                    <h2>{s.value}</h2>
                                    <span>{s.label}</span>
                                </div>
                                <div className="bills-stat-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="bills-filter-card">
                        <div className="bills-filter-wrapper">
                            <div className="bills-brand-label">BILLS <span>FILTERS</span></div>
                            <div className="bills-filter-buttons">
                                {uniqueStatuses.map(status => (
                                    <button 
                                        key={status} 
                                        className={`bills-filter-btn ${filterStatus === status ? 'bills-active-navy' : ''}`}
                                        onClick={() => setFilterStatus(status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <div className="bills-search-box">
                                <Search size={18} className="bills-search-icon" />
                                <input 
                                    type="text" 
                                    className="bills-search-input" 
                                    placeholder="Search Biller, Client, or Ref No..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bills-table-container">
                        <table className="bills-table">
                            <thead>
                                <tr>
                                    <th style={{textAlign:'center', width:'60px'}}>#</th>
                                    <th>Trans ID</th>
                                    <th>Client/Ref</th>
                                    <th>Biller / Account</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentBills.length > 0 ? (
                                    currentBills.map((row, index) => (
                                        <tr key={row.id}>
                                            <td style={{fontWeight:'700', textAlign:'center'}}>{startIndex + index + 1}</td>
                                            <td className="bills-ref-cell">{row.id}</td>
                                            <td><div className="bills-client-name">{row.client}</div></td>
                                            <td>
                                                <div className="bills-client-name">{row.biller}</div>
                                                <div className="bills-biller-info">{row.acctNo}</div>
                                            </td>
                                            <td style={{fontWeight:'700', color: '#10b981'}}>₱{row.amount.toLocaleString()}</td>
                                            <td>{row.dueDate}</td>
                                            <td><span className={`bills-table-badge ${getStatusBadgeClass(row.status)}`}>{row.status}</span></td>
                                            <td style={{textAlign:'right'}}>
                                                <div className="bills-action-group">
                                                    <button className="bills-action-btn bills-view-btn" onClick={() => handleViewBill(row)}>
                                                        <Eye size={16}/> View
                                                    </button>
                                                    <button className="bills-action-btn bills-archive-btn" onClick={() => handleArchiveBill(row.id)}>
                                                        <Archive size={16}/> Archive
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{textAlign:'center', padding:'60px', color:'#64748b'}}>No transactions found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="bills-pagination-nav">
                             <div className="bills-pagination-info">
                                <span className="bills-pagination-showing">
                                    Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredBills.length)}</strong> of <strong>{filteredBills.length}</strong> items
                                </span>
                             </div>
                             <div className="bills-pagination-jump">
                                <button className="bills-jump-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                                    <ChevronLeft size={18}/>
                                </button>
                                <span className="bills-pagination-jump-label">Page {currentPage} of {totalPages}</span>
                                <button className="bills-jump-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                                    <ChevronRight size={18}/>
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS - Hidden during maintenance */}
            <BillsApplicationModal 
                isOpen={isAppModalOpen} 
                onClose={() => setIsAppModalOpen(false)}
                onAddBill={handleAddBill}
            />

            {isDetailsModalOpen && selectedBill && (
                <BillsModal 
                    bill={selectedBill}
                    onClose={() => setIsDetailsModalOpen(false)}
                    onUpdateStatus={handleStatusUpdate}
                />
            )}
        </div>
    );
};

export default BillsPayment;