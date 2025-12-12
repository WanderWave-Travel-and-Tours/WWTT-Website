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
    
    // --- STATE FOR FILTERING ---
    const [activeFilter, setActiveFilter] = useState('ALL'); // 'ALL', 'SERVICES', 'BOOKINGS'

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

        // --- FILTERING STEP ---
        const filteredInquiries = inquiries.filter(inq => {
            const isBooking = inq.inquiryType === 'FLIGHT_BOOKING' || inq.inquiryType === 'BOOKING';
            
            if (activeFilter === 'BOOKINGS') return isBooking;
            if (activeFilter === 'SERVICES') return !isBooking; // Visa, PSA, etc.
            return true; // ALL
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
            // 1. Not seen yet
            // 2. Status changed (Admin update)
            // 3. Completed but NOT downloaded (Documents Ready!)
            const hasNewUpdate = savedStatus !== inquiry.status;

            if (!hasSeen || hasNewUpdate || (isCompleted && !isDownloaded)) {
                needsAttention.push({ ...inquiry, uiState: state });
                return;
            }

            // CASE C: ON PROCESS
            // Everything else (Waiting)
            onProcess.push({ ...inquiry, uiState: state });
        });

        // Sort Newest First
        const sortFn = (a, b) => new Date(b.createdAt) - new Date(a.createdAt);
        needsAttention.sort(sortFn);
        onProcess.sort(sortFn);
        history.sort(sortFn);

        return { needsAttention, onProcess, history };
    }, [inquiries, userInteractions, activeFilter]);

    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const renderCard = (inquiry, category) => {
        const { type, msg } = inquiry.uiState;
        const isActive = selectedInquiry?._id === inquiry._id;
        
        // Styles
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
                
                {/* --- NEW FILTER TABS --- */}
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
                                <p>No {activeFilter.toLowerCase()} found.</p>
                            </div>
                        )}

                        {/* Needs Attention */}
                        {needsAttention.length > 0 && (
                            <div className="ud-sidebar-section">
                                <h4 className="ud-section-title">
                                    Needs Attention <span className="ud-count-badge">{needsAttention.length}</span>
                                </h4>
                                {needsAttention.map(i => renderCard(i, 'attention'))}
                            </div>
                        )}

                        {/* On Process */}
                        {onProcess.length > 0 && (
                            <div className="ud-sidebar-section">
                                <h4 className="ud-section-title">On Process</h4>
                                {onProcess.map(i => renderCard(i, 'process'))}
                            </div>
                        )}

                        {/* History */}
                        {history.length > 0 && (
                            <div className="ud-sidebar-section">
                                <h4 className="ud-section-title">History</h4>
                                {history.map(i => renderCard(i, 'history'))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;