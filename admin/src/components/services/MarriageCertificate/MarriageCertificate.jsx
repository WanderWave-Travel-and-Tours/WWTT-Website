import React, { useState, useMemo } from 'react';
import Sidebar from '../../sidebar/sidebar';
import Maintenance from '../../maintenance/Maintenance'; // Import Maintenance Component
import { Plus, Heart, Clock, Truck, AlertOctagon, ChevronLeft, ChevronRight, Search, Eye, Archive } from 'lucide-react';
import { MarriageModal } from './MarriageModals';
import { MarriageApplicationModal } from './MarriageApplicationModal';
import './MarriageCertificate.css';

// Generic Images for Stats
const MC_STAT_IMAGES = {
    REQUESTS: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1000',
    PROCESSING: 'https://images.unsplash.com/photo-1629230538186-04285df64947?auto=format&fit=crop&q=80&w=1000',
    DELIVERED: 'https://images.unsplash.com/photo-1621623543949-00f70a531d05?auto=format&fit=crop&q=80&w=1000',
    UNCLAIMED: 'https://images.unsplash.com/photo-1518135714426-c18f5d db6f4d?auto=format&fit=crop&q=80&w=1000'
};

const ITEMS_PER_PAGE = 10;

// Mock Data
const initialRequests = [
    { id: 'MC-101', husband: 'Dingdong Dantes', wife: 'Marian Rivera', dateMarried: 'Dec 30, 2014', copies: 2, status: 'Completed' },
    { id: 'MC-102', husband: 'Richard Gutierrez', wife: 'Sarah Lahbati', dateMarried: 'Mar 14, 2020', copies: 1, status: 'Pending' },
    { id: 'MC-103', husband: 'Drew Arellano', wife: 'Iya Villania', dateMarried: 'Jan 31, 2014', copies: 3, status: 'Completed' },
    { id: 'MC-104', husband: 'Ryan Agoncillo', wife: 'Judy Ann Santos', dateMarried: 'Apr 28, 2009', copies: 1, status: 'Completed' },
    { id: 'MC-105', husband: 'Zoren Legaspi', wife: 'Carmina Villaroel', dateMarried: 'Nov 15, 2012', copies: 2, status: 'Unclaimed' },
    { id: 'MC-106', husband: 'Erwan Heussaff', wife: 'Anne Curtis', dateMarried: 'Nov 12, 2017', copies: 1, status: 'Processing' },
    { id: 'MC-107', husband: 'Ogie Alcasid', wife: 'Regine Velasquez', dateMarried: 'Dec 22, 2010', copies: 2, status: 'Completed' },
    { id: 'MC-108', husband: 'Vhong Navarro', wife: 'Tanya Bautista', dateMarried: 'Nov 28, 2019', copies: 1, status: 'Completed' },
    { id: 'MC-109', husband: 'Robin Padilla', wife: 'Mariel Rodriguez', dateMarried: 'Aug 19, 2010', copies: 3, status: 'Pending' },
    { id: 'MC-110', husband: 'Piolo Pascual', wife: 'Shaina Magdayao', dateMarried: 'Feb 14, 2022', copies: 1, status: 'Processing' },
    { id: 'MC-111', husband: 'John Lloyd Cruz', wife: 'Ellen Adarna', dateMarried: 'Apr 04, 2018', copies: 2, status: 'Completed' },
];

const MarriageCertificate = () => {
    // --- MAINTENANCE MODE TOGGLE ---
    // Change this to 'false' to show the actual system
    const MAINTENANCE_MODE = true; 

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [requests, setRequests] = useState(initialRequests);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modals
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);

    // Filter Logic
    const filteredRequests = useMemo(() => {
        let list = requests;
        if (filterStatus !== 'All') {
            list = list.filter(r => r.status === filterStatus);
        }
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            list = list.filter(r => 
                r.husband.toLowerCase().includes(search) ||
                r.wife.toLowerCase().includes(search) ||
                r.id.toLowerCase().includes(search)
            );
        }
        return list;
    }, [requests, filterStatus, searchTerm]);

    // Stats Logic
    const stats = [
        { label: 'Total Requests', value: requests.length, icon: <Heart size={24}/>, image: MC_STAT_IMAGES.REQUESTS },
        { label: 'Processing', value: requests.filter(r => r.status === 'Processing').length, icon: <Clock size={24}/>, image: MC_STAT_IMAGES.PROCESSING },
        { label: 'Completed', value: requests.filter(r => r.status === 'Completed').length, icon: <Truck size={24}/>, image: MC_STAT_IMAGES.DELIVERED },
        { label: 'Unclaimed', value: requests.filter(r => r.status === 'Unclaimed').length, icon: <AlertOctagon size={24}/>, image: MC_STAT_IMAGES.UNCLAIMED },
    ];

    // Pagination
    const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentRequests = filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleViewRequest = (req) => {
        setSelectedRequest(req);
        setIsDetailsModalOpen(true);
    };

    const handleArchiveRequest = (id) => {
        if(window.confirm("Are you sure you want to archive this request?")) {
            setRequests(requests.filter(r => r.id !== id));
        }
    };

    const handleStatusUpdate = (id, newStatus) => {
        setRequests(requests.map(r => r.id === id ? {...r, status: newStatus} : r));
        if (selectedRequest && selectedRequest.id === id) {
            setSelectedRequest({...selectedRequest, status: newStatus});
        }
        alert(`Status updated to ${newStatus}`);
    };

    const handleAddRequest = (newReq) => {
        setRequests([newReq, ...requests]);
    };

    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'completed': return 'mc-badge-completed';
            case 'pending': return 'mc-badge-pending';
            case 'processing': return 'mc-badge-processing';
            case 'unclaimed': return 'mc-badge-unclaimed';
            default: return 'mc-badge-pending';
        }
    };

    const uniqueStatuses = ['All', ...new Set(requests.map(r => r.status))];

    // --- RENDER LOGIC ---

    // 1. KUNG NAKA MAINTENANCE MODE
    if (MAINTENANCE_MODE) {
        return (
            <div className="mc-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
                <main className={`mc-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                    <Maintenance />
                </main>
            </div>
        );
    }

    // 2. KUNG LIVE NA ANG SYSTEM (Normal View)
    return (
        <div className="mc-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            
            <main className={`mc-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="mc-container">
                    <div className="mc-header">
                        <div className="mc-title">
                            <h1>Marriage Certificate</h1>
                            <p>PSA Authenticated Marriage Certificate Requests</p>
                        </div>
                        <div style={{display:'flex', gap:'12px'}}>
                            <button className="mc-btn-add mc-btn-dark" onClick={() => setIsAppModalOpen(true)}>
                                <Plus size={18}/> New Request
                            </button>
                        </div>
                    </div>

                    <div className="mc-stats-grid">
                        {stats.map((s, i) => (
                            <div className="mc-stat-card" key={i} style={{backgroundImage: `url(${s.image})`}}>
                                <div className="mc-stat-card-content">
                                    <h2>{s.value}</h2>
                                    <span>{s.label}</span>
                                </div>
                                <div className="mc-stat-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="mc-filter-card">
                        <div className="mc-filter-wrapper">
                            <div className="mc-brand-label">MARRIAGE <span>FILTERS</span></div>
                            <div className="mc-filter-buttons">
                                {uniqueStatuses.map(status => (
                                    <button 
                                        key={status} 
                                        className={`mc-filter-btn ${filterStatus === status ? 'mc-active-navy' : ''}`}
                                        onClick={() => setFilterStatus(status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <div className="mc-search-box">
                                <Search size={18} className="mc-search-icon" />
                                <input 
                                    type="text" 
                                    className="mc-search-input" 
                                    placeholder="Search Husband, Wife, or Ref No..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mc-table-container">
                        <table className="mc-table">
                            <thead>
                                <tr>
                                    <th style={{textAlign:'center', width:'60px'}}>#</th>
                                    <th>Ref No.</th>
                                    <th>Husband</th>
                                    <th>Wife</th>
                                    <th>Date Married</th>
                                    <th>Copies</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRequests.length > 0 ? (
                                    currentRequests.map((row, index) => (
                                        <tr key={row.id}>
                                            <td style={{fontWeight:'700', textAlign:'center'}}>{startIndex + index + 1}</td>
                                            <td className="mc-ref-cell">{row.id}</td>
                                            <td><div className="mc-couple-name">{row.husband}</div></td>
                                            <td><div className="mc-couple-name">{row.wife}</div></td>
                                            <td>{row.dateMarried}</td>
                                            <td style={{textAlign: 'center'}}>{row.copies}</td>
                                            <td><span className={`mc-table-badge ${getStatusBadgeClass(row.status)}`}>{row.status}</span></td>
                                            <td style={{textAlign:'right'}}>
                                                <div className="mc-action-group">
                                                    <button className="mc-action-btn mc-view-btn" onClick={() => handleViewRequest(row)}>
                                                        <Eye size={16}/> View
                                                    </button>
                                                    <button className="mc-action-btn mc-archive-btn" onClick={() => handleArchiveRequest(row.id)}>
                                                        <Archive size={16}/> Archive
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{textAlign:'center', padding:'60px', color:'#64748b'}}>No requests found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="mc-pagination-nav">
                             <div className="mc-pagination-info">
                                <span className="mc-pagination-showing">
                                    Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredRequests.length)}</strong> of <strong>{filteredRequests.length}</strong> items
                                </span>
                             </div>
                             <div className="mc-pagination-jump">
                                <button className="mc-jump-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                                    <ChevronLeft size={18}/>
                                </button>
                                <span className="mc-pagination-jump-label">Page {currentPage} of {totalPages}</span>
                                <button className="mc-jump-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                                    <ChevronRight size={18}/>
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS - Hidden during maintenance */}
            <MarriageApplicationModal 
                isOpen={isAppModalOpen} 
                onClose={() => setIsAppModalOpen(false)}
                onAddRequest={handleAddRequest}
            />

            {isDetailsModalOpen && selectedRequest && (
                <MarriageModal 
                    request={selectedRequest}
                    onClose={() => setIsDetailsModalOpen(false)}
                    onUpdateStatus={handleStatusUpdate}
                />
            )}
        </div>
    );
};

export default MarriageCertificate;