import React, { useState, useMemo } from 'react';
import Sidebar from '../../sidebar/sidebar';
import Maintenance from '../../maintenance/Maintenance'; // Import Maintenance Component
import { Plus, Shield, Clock, FileText, AlertCircle, ChevronLeft, ChevronRight, Search, Eye, Archive } from 'lucide-react';
import { TravelModal } from './TravelModals';
import { TravelApplicationModal } from './TravelApplicationModal';
import './TravelInsurance.css';

// Generic Images for Stats
const TI_STAT_IMAGES = {
    ACTIVE: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&q=80&w=1000',
    PENDING: 'https://images.unsplash.com/photo-1543731068-c99fb1d8d9b1?auto=format&fit=crop&q=80&w=1000',
    EXPIRED: 'https://images.unsplash.com/photo-1520050735087-1ed65d9dc3de?auto=format&fit=crop&q=80&w=1000',
    CLAIMS: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1000'
};

const ITEMS_PER_PAGE = 10;

// Mock Data
const initialPolicies = [
    { id: 'INS-99', client: 'Anne Curtis', provider: 'Standard Insurance', coverage: 'International Gold', days: '15 Days', amount: 2500, status: 'Active' },
    { id: 'INS-98', client: 'John Lloyd Cruz', provider: 'Pru Life UK', coverage: 'Domestic Silver', days: '7 Days', amount: 1200, status: 'Expired' },
    { id: 'INS-97', client: 'Bea Alonzo', provider: 'AXA Philippines', coverage: 'International Platinum', days: '30 Days', amount: 5000, status: 'Active' },
    { id: 'INS-96', client: 'Dingdong Dantes', provider: 'Standard Insurance', coverage: 'Domestic Gold', days: '10 Days', amount: 1800, status: 'Active' },
    { id: 'INS-95', client: 'Marian Rivera', provider: 'BDO Insure', coverage: 'International Silver', days: '20 Days', amount: 3200, status: 'Pending' },
    { id: 'INS-94', client: 'Coco Martin', provider: 'Standard Insurance', coverage: 'Domestic Platinum', days: '5 Days', amount: 900, status: 'Active' },
    { id: 'INS-93', client: 'Angel Locsin', provider: 'Pru Life UK', coverage: 'International Gold', days: '14 Days', amount: 2400, status: 'Expired' },
    { id: 'INS-92', client: 'Kathryn Bernardo', provider: 'AXA Philippines', coverage: 'Domestic Silver', days: '3 Days', amount: 600, status: 'Active' },
    { id: 'INS-91', client: 'Daniel Padilla', provider: 'Standard Insurance', coverage: 'International Gold', days: '25 Days', amount: 4000, status: 'Active' },
    { id: 'INS-90', client: 'Liza Soberano', provider: 'BDO Insure', coverage: 'Domestic Gold', days: '7 Days', amount: 1100, status: 'Pending' },
    { id: 'INS-89', client: 'Enrique Gil', provider: 'Pru Life UK', coverage: 'International Platinum', days: '45 Days', amount: 7500, status: 'Active' },
];

const TravelInsurance = () => {
    // --- MAINTENANCE MODE TOGGLE ---
    // Change this to 'false' to show the actual system
    const MAINTENANCE_MODE = true; 

    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [policies, setPolicies] = useState(initialPolicies);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('All');

    // Modals
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [isAppModalOpen, setIsAppModalOpen] = useState(false);

    // Filter Logic
    const filteredPolicies = useMemo(() => {
        let list = policies;
        if (filterStatus !== 'All') {
            list = list.filter(p => p.status === filterStatus);
        }
        if (searchTerm.trim()) {
            const search = searchTerm.toLowerCase();
            list = list.filter(p => 
                p.client.toLowerCase().includes(search) ||
                p.provider.toLowerCase().includes(search) ||
                p.id.toLowerCase().includes(search)
            );
        }
        return list;
    }, [policies, filterStatus, searchTerm]);

    // Stats Logic
    const stats = [
        { label: 'Policies Active', value: policies.filter(p => p.status === 'Active').length, icon: <Shield size={24}/>, image: TI_STAT_IMAGES.ACTIVE },
        { label: 'Pending Issuance', value: policies.filter(p => p.status === 'Pending').length, icon: <Clock size={24}/>, image: TI_STAT_IMAGES.PENDING },
        { label: 'Expired', value: policies.filter(p => p.status === 'Expired').length, icon: <FileText size={24}/>, image: TI_STAT_IMAGES.EXPIRED },
        { label: 'Claims', value: '0', icon: <AlertCircle size={24}/>, image: TI_STAT_IMAGES.CLAIMS },
    ];

    // Pagination
    const totalPages = Math.ceil(filteredPolicies.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentPolicies = filteredPolicies.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handleViewPolicy = (policy) => {
        setSelectedPolicy(policy);
        setIsDetailsModalOpen(true);
    };

    const handleArchivePolicy = (id) => {
        if(window.confirm("Are you sure you want to archive this policy?")) {
            setPolicies(policies.filter(p => p.id !== id));
        }
    };

    const handleStatusUpdate = (id, newStatus) => {
        setPolicies(policies.map(p => p.id === id ? {...p, status: newStatus} : p));
        if (selectedPolicy && selectedPolicy.id === id) {
            setSelectedPolicy({...selectedPolicy, status: newStatus});
        }
        alert(`Status updated to ${newStatus}`);
    };

    const handleAddPolicy = (newPolicy) => {
        setPolicies([newPolicy, ...policies]);
    };

    const getStatusBadgeClass = (status) => {
        switch(status.toLowerCase()) {
            case 'active': return 'insurance-badge-active';
            case 'pending': return 'insurance-badge-pending';
            case 'expired': return 'insurance-badge-expired';
            default: return 'insurance-badge-pending';
        }
    };

    const uniqueStatuses = ['All', 'Active', 'Pending', 'Expired'];

    // --- RENDER LOGIC ---

    // 1. KUNG NAKA MAINTENANCE MODE
    if (MAINTENANCE_MODE) {
        return (
            <div className="insurance-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
                <main className={`insurance-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                    <Maintenance />
                </main>
            </div>
        );
    }

    // 2. KUNG LIVE NA ANG SYSTEM (Normal View)
    return (
        <div className="insurance-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            
            <main className={`insurance-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="insurance-container">
                    <div className="insurance-header">
                        <div className="insurance-title">
                            <h1>Travel Insurance</h1>
                            <p>Medical and Trip Cancellation Coverage.</p>
                        </div>
                        <div style={{display:'flex', gap:'12px'}}>
                            <button className="insurance-btn-add insurance-btn-dark" onClick={() => setIsAppModalOpen(true)}>
                                <Plus size={18}/> New Policy
                            </button>
                        </div>
                    </div>

                    <div className="insurance-stats-grid">
                        {stats.map((s, i) => (
                            <div className="insurance-stat-card" key={i} style={{backgroundImage: `url(${s.image})`}}>
                                <div className="insurance-stat-card-content">
                                    <h2>{s.value}</h2>
                                    <span>{s.label}</span>
                                </div>
                                <div className="insurance-stat-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="insurance-filter-card">
                        <div className="insurance-filter-wrapper">
                            <div className="insurance-brand-label">INSURANCE <span>FILTERS</span></div>
                            <div className="insurance-filter-buttons">
                                {uniqueStatuses.map(status => (
                                    <button 
                                        key={status} 
                                        className={`insurance-filter-btn ${filterStatus === status ? 'insurance-active-navy' : ''}`}
                                        onClick={() => setFilterStatus(status)}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                            <div className="insurance-search-box">
                                <Search size={18} className="insurance-search-icon" />
                                <input 
                                    type="text" 
                                    className="insurance-search-input" 
                                    placeholder="Search Client, Policy No, or Provider..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="insurance-table-container">
                        <table className="insurance-table">
                            <thead>
                                <tr>
                                    <th style={{textAlign:'center', width:'60px'}}>#</th>
                                    <th>Policy No.</th>
                                    <th>Insured Name</th>
                                    <th>Provider</th>
                                    <th>Coverage</th>
                                    <th>Premium</th>
                                    <th>Status</th>
                                    <th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentPolicies.length > 0 ? (
                                    currentPolicies.map((row, index) => (
                                        <tr key={row.id}>
                                            <td style={{fontWeight:'700', textAlign:'center'}}>{startIndex + index + 1}</td>
                                            <td className="insurance-ref-cell">{row.id}</td>
                                            <td><div className="insurance-client-name">{row.client}</div></td>
                                            <td>
                                                <div className="insurance-client-name">{row.provider}</div>
                                                <div className="insurance-provider-info">{row.days}</div>
                                            </td>
                                            <td>{row.coverage}</td>
                                            <td style={{fontWeight:'700'}}>₱{row.amount.toLocaleString()}</td>
                                            <td><span className={`insurance-table-badge ${getStatusBadgeClass(row.status)}`}>{row.status}</span></td>
                                            <td style={{textAlign:'right'}}>
                                                <div className="insurance-action-group">
                                                    <button className="insurance-action-btn insurance-view-btn" onClick={() => handleViewPolicy(row)}>
                                                        <Eye size={16}/> View
                                                    </button>
                                                    <button className="insurance-action-btn insurance-archive-btn" onClick={() => handleArchivePolicy(row.id)}>
                                                        <Archive size={16}/> Archive
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" style={{textAlign:'center', padding:'60px', color:'#64748b'}}>No policies found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="insurance-pagination-nav">
                             <div className="insurance-pagination-info">
                                <span className="insurance-pagination-showing">
                                    Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + ITEMS_PER_PAGE, filteredPolicies.length)}</strong> of <strong>{filteredPolicies.length}</strong> items
                                </span>
                             </div>
                             <div className="insurance-pagination-jump">
                                <button className="insurance-jump-arrow" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
                                    <ChevronLeft size={18}/>
                                </button>
                                <span className="insurance-pagination-jump-label">Page {currentPage} of {totalPages}</span>
                                <button className="insurance-jump-arrow" disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)}>
                                    <ChevronRight size={18}/>
                                </button>
                             </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS - Hidden during maintenance */}
            <TravelApplicationModal 
                isOpen={isAppModalOpen} 
                onClose={() => setIsAppModalOpen(false)}
                onAddPolicy={handleAddPolicy}
            />

            {isDetailsModalOpen && selectedPolicy && (
                <TravelModal 
                    policy={selectedPolicy}
                    onClose={() => setIsDetailsModalOpen(false)}
                    onUpdateStatus={handleStatusUpdate}
                />
            )}
        </div>
    );
};

export default TravelInsurance;