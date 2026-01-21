import React, { useMemo, useState } from 'react';
import * as Icons from './Icons';
import './Sidebar.css';

const StatusIcons = {
    info: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>),
    success: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>),
    warning: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>),
    error: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>)
};

const Sidebar = ({ inquiries, selectedInquiry, onSelectInquiry, mobileMenuOpen, isLoading, userInteractions }) => {
    
    // --- STATE FOR FILTERING & UI ---
    const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'SERVICES', 'BOOKINGS'
    const [searchQuery, setSearchQuery] = useState('');
    
    // Manage collapsible sections (Attention & Process Open by default, History Closed)
    const [sectionState, setSectionState] = useState({
        attention: true,
        process: true,
        history: false 
    });

    const toggleSection = (section) => {
        setSectionState(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // 1. Define UI State (Message & Icon Color)
    const getInquiryState = (inquiry) => {
        const { status, remarks, deliveredDocuments } = inquiry;
        
        if (status === 'COMPLETED' && deliveredDocuments?.length > 0) return { msg: 'Documents Ready', type: 'success' };
        if (status === 'COMPLETED') return { msg: 'Completed', type: 'success' }; // No docs case
        if (status === 'CONFIRMED') return { msg: 'Payment Success', type: 'success' };
        if (status === 'PAYMENT_PENDING') return { msg: 'Payment Required', type: 'warning' };
        if (remarks && status !== 'COMPLETED') return { msg: 'Admin Remarks', type: 'warning' };
        if (status === 'PAID') return { msg: 'Verifying Payment', type: 'info' };
        if (status === 'PENDING') return { msg: 'Application Sent', type: 'info' };
        if (status === 'CANCELLED') return { msg: 'Cancelled', type: 'error' };
        return { msg: 'Submitted', type: 'info' };
    };

    // 2. Sorting & Filtering Logic
    const { needsAttention, onProcess, history } = useMemo(() => {
        const needsAttention = [];
        const onProcess = [];
        const history = [];

        // --- FILTERING STEP (Type + Search) ---
        const filteredInquiries = inquiries.filter(inq => {
            // A. Type Filter
            const isBooking = inq.inquiryType === 'FLIGHT_BOOKING' || inq.inquiryType === 'BOOKING';
            let typeMatch = true;
            if (activeFilter === 'BOOKINGS') typeMatch = isBooking;
            if (activeFilter === 'SERVICES') typeMatch = !isBooking; 

            // B. Search Filter
            let searchMatch = true;
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const name = inq.serviceName ? inq.serviceName.toLowerCase() : '';
                const id = inq._id ? inq._id.toLowerCase() : '';
                const status = inq.status ? inq.status.toLowerCase() : '';
                // Search by Name, ID, or Status
                searchMatch = name.includes(query) || id.includes(query) || status.includes(query);
            }

            return typeMatch && searchMatch;
        });

        // --- GROUPING STEP ---
        filteredInquiries.forEach(inquiry => {
            const state = getInquiryState(inquiry);
            const interaction = userInteractions ? userInteractions[inquiry._id] : null;
            
            // Flags
            const hasSeen = !!interaction;
            const savedStatus = interaction?.status;
            const isDownloaded = interaction?.downloaded;
            const isCompleted = inquiry.status === 'COMPLETED';
            const hasDocs = inquiry.deliveredDocuments && inquiry.deliveredDocuments.length > 0;

            // CASE A: HISTORY
            // If it is Completed AND (Downloaded OR No Docs to download)
            if (isCompleted && (isDownloaded || !hasDocs)) {
                history.push({ ...inquiry, uiState: state });
                return; 
            }

            // CASE B: NEEDS ATTENTION
            // 1. Not seen yet, 2. Status changed, 3. Completed but NOT downloaded
            const hasNewUpdate = savedStatus !== inquiry.status;

            if (!hasSeen || hasNewUpdate || (isCompleted && !isDownloaded)) {
                needsAttention.push({ ...inquiry, uiState: state });
                return;
            }

            // CASE C: ON PROCESS
            onProcess.push({ ...inquiry, uiState: state });
        });

        // Sort Newest First
        const sortFn = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
        needsAttention.sort(sortFn);
        onProcess.sort(sortFn);
        history.sort(sortFn);

        return { needsAttention, onProcess, history };
    }, [inquiries, userInteractions, activeFilter, searchQuery]);

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Helper for Accordion Chevron
    const ChevronIcon = ({ isOpen }) => (
        <svg 
            className={`ud-section-chevron ${isOpen ? 'open' : 'closed'}`} 
            width="16" height="16" viewBox="0 0 24 24" 
            fill="none" stroke="currentColor" strokeWidth="3" 
            strokeLinecap="round" strokeLinejoin="round"
        >
            <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
    );

    const renderCard = (inquiry, category) => {
        const { type, msg } = inquiry.uiState;
        const isActive = selectedInquiry?._id === inquiry._id;
        
        let cardClass = `ud-notify-card`;
        if (category === 'attention') {
            cardClass += ` type-${type}`; 
        } else {
            cardClass += ` type-history ${isActive ? 'card-active' : ''}`;
        }

        return (
            <div key={inquiry._id} className={cardClass} onClick={() => onSelectInquiry(inquiry)}>
                <div className={`ud-notify-icon-box ${category === 'attention' ? `icon-${type}` : ''}`}>
                    {StatusIcons[type]}
                </div>
                <div className="ud-notify-content">
                    <div className="ud-notify-header">
                        <span className="ud-notify-title">{msg}</span>
                        <span className="ud-notify-time">{formatDate(inquiry.createdAt)}</span>
                    </div>
                    <p className="ud-notify-desc">{inquiry.serviceName}</p>
                </div>
            </div>
        );
    };

    return (
        <aside className={`ud-sidebar ${mobileMenuOpen ? 'ud-sidebar-open' : ''}`}>
            <div className="ud-sidebar-header">
                <div className="ud-header-top">
                    <div className="ud-header-icon-wrap"><Icons.Dashboard /></div>
                    <h2>MY APPLICATIONS</h2>
                </div>
                
                {/* --- SEARCH BAR --- */}
                <div className="ud-search-container">
                    <div className="ud-search-box">
                        <svg className="ud-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input 
                            type="text" 
                            className="ud-search-input"
                            placeholder="Search applications..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* --- FILTER TABS --- */}
                <div className="ud-filter-tabs">
                    <button 
                        className={`ud-filter-btn ${activeFilter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('ALL')}
                    >
                        All
                    </button>
                    <button 
                        className={`ud-filter-btn ${activeFilter === 'SERVICES' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('SERVICES')}
                    >
                        Services
                    </button>
                    <button 
                        className={`ud-filter-btn ${activeFilter === 'BOOKINGS' ? 'active' : ''}`}
                        onClick={() => setActiveFilter('BOOKINGS')}
                    >
                        Bookings
                    </button>
                </div>
            </div>

            <div className="ud-applications-list">
                {isLoading ? (
                    <div className="ud-loading-state"><div className="ud-loader"></div></div>
                ) : inquiries.length === 0 ? (
                    <div className="ud-empty-state"><Icons.Globe /><p>No applications yet</p></div>
                ) : (
                    <>
                        {/* Empty Filter State */}
                        {needsAttention.length === 0 && onProcess.length === 0 && history.length === 0 && (
                            <div className="ud-empty-filter">
                                <p>No results found for "{searchQuery || activeFilter}".</p>
                            </div>
                        )}

                        {/* SECTION 1: Needs Attention */}
                        {needsAttention.length > 0 && (
                            <div className="ud-sidebar-section">
                                <div className="ud-section-header" onClick={() => toggleSection('attention')}>
                                    <div className="ud-section-title-wrap">
                                        <h4 className="ud-section-title">Needs Attention</h4>
                                        <span className="ud-count-badge">{needsAttention.length}</span>
                                    </div>
                                    <ChevronIcon isOpen={sectionState.attention} />
                                </div>
                                
                                <div className={`ud-section-content ${!sectionState.attention ? 'hidden' : ''}`}>
                                    {needsAttention.map(i => renderCard(i, 'attention'))}
                                </div>
                            </div>
                        )}

                        {/* SECTION 2: On Process */}
                        {onProcess.length > 0 && (
                            <div className="ud-sidebar-section">
                                <div className="ud-section-header" onClick={() => toggleSection('process')}>
                                    <h4 className="ud-section-title">On Process</h4>
                                    <ChevronIcon isOpen={sectionState.process} />
                                </div>
                                <div className={`ud-section-content ${!sectionState.process ? 'hidden' : ''}`}>
                                    {onProcess.map(i => renderCard(i, 'process'))}
                                </div>
                            </div>
                        )}

                        {/* SECTION 3: History (Default Closed) */}
                        {history.length > 0 && (
                            <div className="ud-sidebar-section">
                                <div className="ud-section-header" onClick={() => toggleSection('history')}>
                                    <h4 className="ud-section-title">History</h4>
                                    <ChevronIcon isOpen={sectionState.history} />
                                </div>
                                <div className={`ud-section-content ${!sectionState.history ? 'hidden' : ''}`}>
                                    {history.map(i => renderCard(i, 'history'))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;