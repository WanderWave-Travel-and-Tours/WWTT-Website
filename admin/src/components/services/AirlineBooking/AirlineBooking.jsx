import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Sidebar from '../../sidebar/sidebar';
import { 
    Plus, Plane, Calendar, Tag, AlertCircle, X, Eye, 
    CreditCard, ChevronLeft, ChevronRight, Search,
    UserPlus, Mail, Clock, CheckCircle, Archive, Filter, ChevronDown 
} from 'lucide-react';

import './AirlineBooking.css'; 
import AirlineApplicationModal from './AirlineApplicationModal'; 
import { AirlineInquiryModal, AirlineContactRemarksModal } from './AirlineModals'; 

const AirlineBooking = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth <= 1024);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Contact/Report Modal States
    const [showContactRemarks, setShowContactRemarks] = useState(false);
    const [contactRemarks, setContactRemarks] = useState("");
    const [contactEvidence, setContactEvidence] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const handleResize = () => setSidebarCollapsed(window.innerWidth <= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch flight booking inquiries from database
const fetchFlightBookings = async () => {
    setIsLoading(true);
    try {
        const response = await axios.get('https://wanderwaveph-backend.onrender.com/api/inquiries?isArchive=No');
        if (response.data.success) {
            // Filter: Flight Booking lang at hindi naka-archive
            const filtered = response.data.data.filter(inq => 
                inq.inquiryType === 'FLIGHT_BOOKING' && inq.isArchive === 'No'
            );
            setBookings(filtered);
        }
    } catch (error) {
        console.error('Error fetching:', error);
    } finally {
        setIsLoading(false);
    }
};

    useEffect(() => { fetchBookings(); }, []);

    // Filter Logic
    const filteredData = useMemo(() => {
        let data = bookings;
        
        // AUTOMATICALLY HIDE ARCHIVED ITEMS (Since they go to another page)
        data = data.filter(b => b.status !== 'ARCHIVED');

        if(statusFilter !== 'ALL') data = data.filter(b => b.status === statusFilter);
        
        if(searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(b => 
                b._id.toLowerCase().includes(lower) || 
                b.fullName?.toLowerCase().includes(lower) || 
                b.email?.toLowerCase().includes(lower)
            );
        }
        
        if (currentPage > Math.ceil(data.length / itemsPerPage) && data.length > 0) {
            setCurrentPage(1);
        }

        return data;
    }, [bookings, statusFilter, searchTerm, currentPage]);

    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const getStatusBadgeClass = (status) => {
        const map = {
            'PENDING': 'badge-slate', 'CONTACTED': 'badge-amber',
            'PAYMENT_PENDING': 'badge-amber', 'PAID': 'badge-blue',
            'CONFIRMED': 'badge-blue', 'COMPLETED': 'badge-success', 
            'CANCELLED': 'badge-red'
        };
        return map[status] || 'badge-slate';
    };

    // Handler for Archive and Status Updates
    const handleUpdateStatus = async (id, status) => {
        const action = status === 'ARCHIVED' ? 'Archive this request' : `Update status to ${status}`;
        if(!window.confirm(`Are you sure you want to ${action}?`)) return;
        try {
            const response = await axios.put(
                `https://wanderwaveph-backend.onrender.com/api/inquiries/${bookingId}/status`,
                { status: newStatus }
            );

            if (response.data.success) {
                alert('Status updated successfully!');
                fetchFlightBookings();
                if (selectedBooking && selectedBooking._id === bookingId) {
                    setSelectedBooking({ ...selectedBooking, status: newStatus });
                }
            }
        } catch(e) { alert("Error updating status"); }
    };

    const handleRequestPayment = async () => {
        if(!selectedBooking) return;
        handleUpdateStatus(selectedBooking._id, 'PAYMENT_PENDING');
    };

const handleArchiveBooking = async (id) => {
    if (window.confirm('Are you sure you want to archive this inquiry?')) {
        try {
            const response = await axios.put(`https://wanderwaveph-backend.onrender.com/api/inquiries/${id}/archive`, {
                isArchive: 'Yes'
            });

            if (response.data.success) {
                alert('Inquiry archived successfully!');
                fetchFlightBookings(); // I-refresh ang listahan
            }
        } catch (error) {
            console.error('Error archiving:', error);
            alert('Failed to archive inquiry.');
        }
    }
};

    // Submit contact with remarks
    const submitContactWithRemarks = async () => {
        if (!selectedBooking || !contactRemarks.trim()) return alert('Please enter remarks');
        try {
            const formData = new FormData();
            formData.append('status', 'CONTACTED');
            formData.append('remarks', contactRemarks);
            if (contactEvidence) formData.append('evidence', contactEvidence);

            const response = await axios.put(
                `https://wanderwaveph-backend.onrender.com/api/inquiries/${selectedBooking._id}/status`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            if (response.data.success) {
                alert('Issue reported successfully!'); 
                fetchBookings();
                setSelectedBooking({ ...selectedBooking, status: 'CONTACTED' });
                setShowContactRemarks(false); setContactRemarks(""); setContactEvidence(null);
            }
        } catch (error) { console.error(error); alert('Failed to report issue'); }
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setTimeout(() => {
            setSelectedBooking(null);
            setShowContactRemarks(false); setContactRemarks(""); setContactEvidence(null);
        }, 200);
    // Handle request payment
    const handleRequestPayment = async () => {
        if (!selectedBooking) return;
        
        if (window.confirm('Send payment request to client?')) {
            try {
                const response = await axios.post(
                    `https://wanderwaveph-backend.onrender.com/api/inquiries/${selectedBooking._id}/request-payment`
                );
                
                if (response.data.success) {
                    alert('Payment request sent successfully!');
                    fetchFlightBookings();
                    setSelectedBooking({ ...selectedBooking, status: 'PAYMENT_PENDING' });
                }
            } catch (error) {
                console.error('Error requesting payment:', error);
                alert('Failed to send payment request');
            }
        }
    };

    const stats = [
        { label: 'Total Flights', value: bookings.filter(b => b.status !== 'ARCHIVED').length, icon: <Plane size={24}/>, img: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80' },
        { label: 'Pending Review', value: bookings.filter(b => b.status === 'PENDING').length, icon: <Clock size={24}/>, img: 'https://images.unsplash.com/photo-1559297434-fae8a1916a79?auto=format&fit=crop&w=800&q=80' },
        { label: 'Pending Payment', value: bookings.filter(b => b.status === 'PAYMENT_PENDING').length, icon: <CreditCard size={24}/>, img: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&w=800&q=80' },
        { label: 'Completed', value: bookings.filter(b => b.status === 'COMPLETED').length, icon: <CheckCircle size={24}/>, img: 'https://images.unsplash.com/photo-1520689916669-e93e23292419?auto=format&fit=crop&w=800&q=80' }
    ];

    return (
        <div className="airline-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            
            <main className={`airline-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="airline-container">
                    
                    {/* Header */}
                    <div className="airline-header">
                        <div className="airline-title">
                            <h1>Airline Booking</h1>
                            <p>Manage domestic and international flight booking inquiries.</p>
                        </div>
                        <button className="airline-btn-add" onClick={() => setIsAddModalOpen(true)}>
                            <UserPlus size={18}/> Add Walk-in
                        </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="airline-stats-grid">
                        {stats.map((s, i) => (
                            <div className="airline-stat-card" key={i} style={{backgroundImage: `url(${s.img})`}}>
                                <div className="airline-stat-content">
                                    <h2>{s.value}</h2>
                                    <span>{s.label}</span>
                                </div>
                                <div className="airline-stat-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>
                    
                    {/* FILTER CARD (UPDATED DROPDOWN) */}
                    <div className="airline-filter-card">
                        <div className="airline-filter-wrapper">
                            
                            {/* Brand Label */}
                            <div className="airline-brand-label">
                                <Filter size={20} className="air-filter-icon"/>
                                AIRLINE <span>FILTERS</span>
                            </div>

                            {/* Dropdown Group - NO ALL CAPS, NO ARCHIVED */}
                            <div className="airline-filter-group">
                                <span className="airline-filter-label">Status Type:</span>
                                <div className="airline-dropdown-container">
                                    <select 
                                        className="airline-dropdown" 
                                        value={statusFilter} 
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                    >
                                        <option value="ALL">All Requests</option>
                                        <option value="PENDING">Pending Review</option>
                                        <option value="CONTACTED">Contacted</option>
                                        <option value="PAYMENT_PENDING">Payment Pending</option>
                                        <option value="PAID">Paid</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                    <ChevronDown size={16} className="airline-dropdown-arrow"/>
                                </div>
                            </div>

                            {/* Search Box */}
                            <div className="airline-search-box">
                                <Search size={18} className="airline-search-icon" />
                                <input type="text" className="airline-search-input" 
                                    placeholder="Search Client, Ref ID, Email..." 
                                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="airline-table-container">
                        <table className="airline-table">
                            <thead>
                                <tr>
                                    <th>Ref No.</th><th>Client</th><th>Flight Route</th><th>Date</th><th>Status</th><th style={{textAlign:'right'}}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'50px'}}>Loading records...</td></tr>
                                ) : paginatedData.length === 0 ? (
                                    <tr><td colSpan="6" style={{textAlign:'center', padding:'50px'}}>No flight bookings found.</td></tr>
                                ) : (
                                    paginatedData.map((b) => (
                                        <tr key={b._id}>
                                            <td><span className="airline-ref">#{b._id.slice(-6).toUpperCase()}</span></td>
                                            <td>
                                                <div className="airline-client-name">{b.fullName}</div>
                                                <div className="airline-client-email"><Mail size={12}/> {b.email}</div>
                                            </td>
                                            <td>
                                                <div className="airline-route">
                                                    {b.flightDetails?.origin} → {b.flightDetails?.destination}
                                                </div>
                                                <div className="airline-truncate">{b.flightDetails?.airline || 'Any Airline'}</div>
                                            </td>
                                            <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                                            <td><span className={`airline-badge ${getStatusBadgeClass(b.status)}`}>{b.status}</span></td>
                                            <td style={{textAlign: 'right'}}>
                                                <div className="airline-action-group">
                                                    <button className="airline-action-btn airline-view-btn" onClick={() => { setSelectedBooking(b); setIsViewModalOpen(true); }}>
                                                        <Eye size={14}/> View
                                                    </button>
                                                    {/* ARCHIVE BUTTON - Remains here to send items to the "other page" */}
                                                    <button className="airline-action-btn airline-archive-btn" onClick={() => handleUpdateStatus(b._id, 'ARCHIVED')}>
                                                        <Archive size={14}/> Archive
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))

<button 
    className="airline-action-btn" 
    style={{ color: '#ef4444', borderColor: '#ef4444' }}
    onClick={() => handleArchiveBooking(booking._id)}
>
    <Archive size={14}/> Archive
</button>

                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Pagination totalPages={totalPages} currentPage={currentPage} paginate={paginate} />
                            </>
                        )}
                    </div>
                </div>
            </main>

            <AirlineApplicationModal 
                        isOpen={isApplicationModalOpen}
                        onClose={() => setIsApplicationModalOpen(false)}
                        refreshData={fetchFlightBookings}
                    />

            {/* View Booking Details Modal */}
            {isModalOpen && selectedBooking && (
                <div className="airline-modal-overlay" onClick={handleCloseModal}>
                    <div className="airline-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="airline-modal-header">
                            <h2>Flight Booking Details</h2>
                            <button className="airline-modal-close" onClick={handleCloseModal}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="airline-modal-body">
                            <div className="airline-detail-grid">
                                <div className="airline-detail-item">
                                    <label>Reference ID</label>
                                    <p>{selectedBooking._id.slice(-8).toUpperCase()}</p>
                                </div>
                                <div className="airline-detail-item">
                                    <label>Status</label>
                                    <span className={`status-pill ${getStatusClass(selectedBooking.status)}`}>
                                        {selectedBooking.status || 'PENDING'}
                                    </span>
                                </div>
                                <div className="airline-detail-item">
                                    <label>Full Name</label>
                                    <p>{selectedBooking.fullName || 'N/A'}</p>
                                </div>
                                <div className="airline-detail-item">
                                    <label>Email Address</label>
                                    <p>{selectedBooking.email || 'N/A'}</p>
                                </div>
                                <div className="airline-detail-item full-width">
                                    <label>Message</label>
                                    <p style={{whiteSpace: 'pre-wrap'}}>{selectedBooking.message || 'No message provided'}</p>
                                </div>
                                <div className="airline-detail-item">
                                    <label>Date Submitted</label>
                                    <p>{formatDate(selectedBooking.createdAt)}</p>
                                </div>
                                <div className="airline-detail-item">
                                    <label>Last Updated</label>
                                    <p>{formatDate(selectedBooking.updatedAt)}</p>
                                </div>
                                {selectedBooking.remarks && (
                                    <div className="airline-detail-item full-width">
                                        <label>Remarks</label>
                                        <p style={{whiteSpace: 'pre-wrap'}}>{selectedBooking.remarks}</p>
                                    </div>
                                )}
                                {selectedBooking.evidenceUrl && (
                                    <div className="airline-detail-item full-width">
                                        <label>Evidence/Attachment</label>
                                        <a 
                                            href={`https://wanderwaveph-backend.onrender.com${selectedBooking.evidenceUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="airline-evidence-link"
                                        >
                                            View Attachment
                                        </a>
                                    </div>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="airline-pagination">
                            <span className="airline-page-info">Page {currentPage} of {totalPages}</span>
                            <div className="airline-page-controls">
                                <button className="airline-page-btn" onClick={() => setCurrentPage(c => Math.max(1, c-1))} disabled={currentPage === 1}><ChevronLeft size={16}/></button>
                                <button className="airline-page-btn" onClick={() => setCurrentPage(c => Math.min(totalPages, c+1))} disabled={currentPage === totalPages}><ChevronRight size={16}/></button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS */}
            {isViewModalOpen && selectedBooking && (
                <AirlineInquiryModal 
                    inquiry={selectedBooking} 
                    onClose={handleCloseViewModal}
                    onUpdateStatus={handleUpdateStatus}
                    onRequestPayment={handleRequestPayment}
                    setShowContactRemarks={setShowContactRemarks}
                />
            )}

            {showContactRemarks && (
                <AirlineContactRemarksModal
                    remarks={contactRemarks}
                    setRemarks={setContactRemarks}
                    setEvidence={setContactEvidence}
                    onSubmit={submitContactWithRemarks}
                    onClose={() => {
                        setShowContactRemarks(false);
                        setContactRemarks("");
                        setContactEvidence(null);
                    }}
                />
            )}

            <AirlineApplicationModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                refreshData={fetchBookings} 
            />
        </div>
    );
};

export default AirlineBooking;