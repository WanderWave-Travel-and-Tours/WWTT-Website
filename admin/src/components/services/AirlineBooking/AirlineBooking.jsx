import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Sidebar from '../../sidebar/sidebar';
import { 
    Plus, 
    Plane, 
    Calendar, 
    Tag, 
    AlertCircle, 
    X, 
    Eye, 
    CreditCard, 
    ChevronLeft, 
    ChevronRight, 
    Search,
    UserPlus,
    Archive
} from 'lucide-react';
import './AirlineBooking.css';
import AirlineApplicationModal from './AirlineApplicationModal'; 

const ITEMS_PER_PAGE = 10;

const AirlineBooking = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showContactRemarks, setShowContactRemarks] = useState(false);
    const [contactRemarks, setContactRemarks] = useState('');
    const [contactEvidence, setContactEvidence] = useState(null);
    
    // Search and Filter State - NEW
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' for All Items
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
    // Filtering and Searching Logic - NEW
    const filteredBookings = useMemo(() => {
        let filtered = bookings;

        // 1. Status Filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(b => b.status === statusFilter);
        }

        // 2. Search Term Filter
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b._id.toLowerCase().includes(lowerCaseSearchTerm) ||
                (b.fullName && b.fullName.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (b.email && b.email.toLowerCase().includes(lowerCaseSearchTerm)) ||
                (b.message && b.message.toLowerCase().includes(lowerCaseSearchTerm))
            );
        }

        return filtered;
    }, [bookings, statusFilter, searchTerm]);

    // Pagination Logic uses filteredBookings now
    const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
    const indexOfLastBooking = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstBooking = indexOfLastBooking - ITEMS_PER_PAGE;
    const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Fetch flight booking inquiries from database
const fetchFlightBookings = async () => {
    setIsLoading(true);
    try {
        const response = await axios.get('https://wanderwaveph-backend.onrender.com0/api/inquiries?isArchive=No');
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

    useEffect(() => {
        fetchFlightBookings();
    }, []);

    // Recalculate pagination after data change (filter/search) - UPDATED
    useEffect(() => {
        // Reset page to 1 if the filter/search result set is now smaller than the current page
        if (totalPages > 0 && currentPage > totalPages) {
            setCurrentPage(totalPages);
        } else if (filteredBookings.length === 0) {
            setCurrentPage(1);
        }
    }, [filteredBookings.length, totalPages, currentPage]);


    // Calculate stats from actual data (non-filtered)
    const stats = [
        { 
            label: 'Total Inquiries', 
            value: bookings.length.toString(), 
            icon: <Plane size={24}/> 
        },
        { 
            label: 'Pending', 
            value: bookings.filter(b => b.status === 'PENDING').length.toString(), 
            icon: <Calendar size={24}/> 
        },
        { 
            label: 'Contacted', 
            value: bookings.filter(b => b.status === 'CONTACTED').length.toString(), 
            icon: <Tag size={24}/> 
        },
        { 
            label: 'Processing', 
            value: bookings.filter(b => b.status === 'PROCESSING').length.toString(), 
            icon: <AlertCircle size={24}/> 
        },
    ];
    
    // Define all available statuses for the filter UI - NEW
    const statusOptions = useMemo(() => ([
        { label: 'All Items', value: 'ALL', count: bookings.length, activeClass: 'active' },
        { label: 'Pending', value: 'PENDING', count: bookings.filter(b => b.status === 'PENDING').length, activeClass: 'pending-active' },
        { label: 'Contacted', value: 'CONTACTED', count: bookings.filter(b => b.status === 'CONTACTED').length, activeClass: 'confirmed-active' }, // Green-like color
        { label: 'Processing', value: 'PROCESSING', count: bookings.filter(b => b.status === 'PROCESSING').length, activeClass: 'pending-active' }, // Yellow-like color
        { label: 'Completed', value: 'COMPLETED', count: bookings.filter(b => b.status === 'COMPLETED').length, activeClass: 'confirmed-active' }, // Green-like color
        { label: 'Cancelled', value: 'CANCELLED', count: bookings.filter(b => b.status === 'CANCELLED').length, activeClass: 'cancelled-active' }, // Red-like color
        { label: 'Payment Pending', value: 'PAYMENT_PENDING', count: bookings.filter(b => b.status === 'PAYMENT_PENDING').length, activeClass: 'pending-active' }, // Yellow-like color
        { label: 'Paid', value: 'PAID', count: bookings.filter(b => b.status === 'PAID').length, activeClass: 'confirmed-active' }, // Green-like color
    ]), [bookings]);


    const handleViewBooking = (booking) => {
        setSelectedBooking(booking);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setSelectedBooking(null);
        setIsModalOpen(false);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getStatusClass = (status) => {
        const statusMap = {
            'PENDING': 'status-pending',
            'CONTACTED': 'status-issued', 
            'PROCESSING': 'status-processing',
            'COMPLETED': 'status-issued',
            'CANCELLED': 'status-cancelled',
            'PAYMENT_PENDING': 'status-processing',
            'PAID': 'status-issued'
        };
        return statusMap[status] || 'status-pending';
    };

    // Handle status update
    const handleUpdateBookingStatus = async (bookingId, newStatus) => {
        try {
            const response = await axios.put(
                `https://wanderwaveph-backend.onrender.com0/api/inquiries/${bookingId}/status`,
                { status: newStatus }
            );

            if (response.data.success) {
                alert('Status updated successfully!');
                fetchFlightBookings();
                if (selectedBooking && selectedBooking._id === bookingId) {
                    setSelectedBooking({ ...selectedBooking, status: newStatus });
                }
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    // Initiate contact with remarks
    const initiateContactStatus = () => {
        setShowContactRemarks(true);
    };

const handleArchiveBooking = async (id) => {
    if (window.confirm('Are you sure you want to archive this inquiry?')) {
        try {
            const response = await axios.put(`https://wanderwaveph-backend.onrender.com0/api/inquiries/${id}/archive`, {
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
        if (!selectedBooking) return;

        try {
            const formData = new FormData();
            formData.append('status', 'CONTACTED');
            formData.append('remarks', contactRemarks);
            
            if (contactEvidence) {
                formData.append('evidence', contactEvidence);
            }

            const response = await axios.put(
                `https://wanderwaveph-backend.onrender.com0/api/inquiries/${selectedBooking._id}/status`,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' }
                }
            );

            if (response.data.success) {
                alert('Status updated to CONTACTED with remarks!');
                fetchFlightBookings();
                setSelectedBooking({ 
                    ...selectedBooking, 
                    status: 'CONTACTED',
                    remarks: contactRemarks,
                    evidenceUrl: response.data.data.evidenceUrl 
                });
                setShowContactRemarks(false);
                setContactRemarks('');
                setContactEvidence(null);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    // Handle request payment
    const handleRequestPayment = async () => {
        if (!selectedBooking) return;
        
        if (window.confirm('Send payment request to client?')) {
            try {
                const response = await axios.post(
                    `https://wanderwaveph-backend.onrender.com0/api/inquiries/${selectedBooking._id}/request-payment`
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
    
    // Pagination Component
    const Pagination = ({ totalPages, currentPage, paginate }) => {
        if (totalPages <= 1) return null;

        const pageNumbers = [];
        // Only show a subset of page numbers for cleaner display
        const maxPageButtons = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
        let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

        if (endPage - startPage + 1 < maxPageButtons) {
            startPage = Math.max(1, endPage - maxPageButtons + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <nav className="pagination-nav">
                <ul className="pagination-list">
                    <li>
                        <button
                            className="pagination-btn"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                        >
                            <ChevronLeft size={16} />
                        </button>
                    </li>
                    {pageNumbers.map(number => (
                        <li key={number}>
                            <button
                                onClick={() => paginate(number)}
                                className={`pagination-btn ${number === currentPage ? 'active' : ''}`}
                            >
                                {number}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            className="pagination-btn"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                        >
                            <ChevronRight size={16} />
                        </button>
                    </li>
                </ul>
            </nav>
        );
    };

    return (
        <div className="airline-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`airline-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="airline-container">
                    <div className="airline-header">
                        <div className="airline-title">
                            <h1>Airline Booking</h1>
                            <p>Domestic and international flight booking inquiries.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {/* NEW WALK-IN BUTTON */}
                            <button 
                                className="airline-btn-primary" 
                                style={{ backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onClick={() => setIsApplicationModalOpen(true)}
                            >
                                <UserPlus size={18} /> Add Walk-in
                            </button>
                        </div>
                    </div>

                    <div className="airline-stats-grid">
                        {stats.map((s, i) => (
                            <div className="airline-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="airline-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>
                    
                    {/* --- Search and Filter Card --- NEW COMPONENT */}
                    <div className="search-filter-card">
                        <div className="search-filter-wrapper">
                            {/* Search Box */}
                            <div className="search-box">
                                <Search size={20} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search by ID, Name, or Email..."
                                    className="search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {/* Filter Buttons */}
                            <div className="filter-buttons">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        className={`filter-btn ${statusFilter === option.value ? option.activeClass : ''}`}
                                        onClick={() => setStatusFilter(option.value)}
                                        // Disable if no items in that status (optional)
                                        disabled={option.count === 0 && option.value !== 'ALL'}
                                    >
                                        {option.label} ({option.count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* --- End Search and Filter Card --- */}


                    <div className="airline-table-container">
                        {isLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                Loading flight bookings...
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                No flight booking inquiries found with the current filters.
                            </div>
                        ) : (
                            <>
                                <table className="airline-table">
                                    <thead>
                                        <tr>
                                            <th>#</th> {/* ADDED INDEX COLUMN */}
                                            <th>Reference</th>
                                            <th>Client Name</th>
                                            <th>Email</th>
                                            <th>Message</th>
                                            <th>Date Submitted</th>
                                            <th>Status</th>
                                            <th style={{textAlign:'right'}}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentBookings.map((booking, index) => ( // ADDED index
                                            <tr key={booking._id}>
                                                {/* ADDED ROW NUMBER */}
                                                <td style={{ fontWeight: '700', color: '#0f172a' }}>
                                                    {indexOfFirstBooking + index + 1} 
                                                </td>
                                                {/* REFERENCE ID */}
                                                <td style={{ fontWeight: '700', color: '#0f172a' }}>
                                                    {booking._id.slice(-6).toUpperCase()}
                                                </td>
                                                <td>{booking.fullName || 'N/A'}</td>
                                                <td>{booking.email || 'N/A'}</td>
                                                <td style={{ 
                                                    maxWidth: '300px', 
                                                    overflow: 'hidden', 
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap' 
                                                }}>
                                                    {booking.message || 'No message'}
                                                </td>
                                                <td>{formatDate(booking.createdAt)}</td>
                                                <td>
                                                    <span className={`status-pill ${getStatusClass(booking.status)}`}>
                                                        {booking.status || 'PENDING'}
                                                    </span>
                                                </td>
                                                <td style={{textAlign:'right'}}>
                                                    <button 
                                                        className="airline-action-btn"
                                                        onClick={() => handleViewBooking(booking)}
                                                    >
                                                        <Eye size={14} style={{marginRight:'4px'}}/> View Details
                                                    </button>

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
                                            href={`https://wanderwaveph-backend.onrender.com0${selectedBooking.evidenceUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="airline-evidence-link"
                                        >
                                            View Attachment
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* Update Status Section */}
                            <div style={{ marginTop: '32px' }}>
                                <h3 style={{ 
                                    fontSize: '16px', 
                                    fontWeight: 700, 
                                    marginBottom: '12px',
                                    color: '#0f172a'
                                }}>
                                    Update Status
                                </h3>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                        className="airline-action-btn"
                                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'PENDING')}
                                        disabled={selectedBooking.status === 'PENDING'}
                                        style={{ 
                                            opacity: selectedBooking.status === 'PENDING' ? 0.5 : 1,
                                            cursor: selectedBooking.status === 'PENDING' ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Set Pending
                                    </button>
                                    <button
                                        className="airline-action-btn"
                                        onClick={initiateContactStatus}
                                        disabled={selectedBooking.status === 'CONTACTED'}
                                        style={{ 
                                            opacity: selectedBooking.status === 'CONTACTED' ? 0.5 : 1,
                                            cursor: selectedBooking.status === 'CONTACTED' ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Set Contacted (With Remarks)
                                    </button>
                                    <button
                                        className="airline-action-btn"
                                        onClick={handleRequestPayment}
                                        disabled={selectedBooking.status === 'PAYMENT_PENDING' || selectedBooking.status === 'PAID'}
                                        style={{ 
                                            background: '#059669',
                                            color: 'white',
                                            borderColor: '#059669',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            opacity: (selectedBooking.status === 'PAYMENT_PENDING' || selectedBooking.status === 'PAID') ? 0.5 : 1,
                                            cursor: (selectedBooking.status === 'PAYMENT_PENDING' || selectedBooking.status === 'PAID') ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        <CreditCard size={16} />
                                        Approve & Request Payment
                                    </button>
                                    <button
                                        className="airline-action-btn"
                                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'COMPLETED')}
                                        disabled={selectedBooking.status === 'COMPLETED'}
                                        style={{ 
                                            opacity: selectedBooking.status === 'COMPLETED' ? 0.5 : 1,
                                            cursor: selectedBooking.status === 'COMPLETED' ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        Set Completed
                                    </button>
                                    <button
                                        className="airline-action-btn"
                                        onClick={() => handleUpdateBookingStatus(selectedBooking._id, 'CANCELLED')}
                                        disabled={selectedBooking.status === 'CANCELLED'}
                                        style={{ 
                                            opacity: selectedBooking.status === 'CANCELLED' ? 0.5 : 1,
                                            cursor: selectedBooking.status === 'CANCELLED' ? 'not-allowed' : 'pointer',
                                            background: '#ef4444',
                                            color: 'white',
                                            borderColor: '#ef4444'
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="airline-modal-footer">
                            <button className="airline-btn-secondary" onClick={handleCloseModal}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact with Remarks Modal */}
            {showContactRemarks && (
                <div className="airline-modal-overlay" style={{ zIndex: 1100 }}>
                    <div className="airline-modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="airline-modal-header">
                            <h3>Add Remarks & Evidence</h3>
                            <button className="airline-modal-close" onClick={() => setShowContactRemarks(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="airline-modal-body">
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase'
                                }}>
                                    Remarks / Issues Found *
                                </label>
                                <textarea 
                                    rows="4"
                                    style={{ 
                                        width: '100%', 
                                        resize: 'none',
                                        padding: '12px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontFamily: 'Plus Jakarta Sans, sans-serif'
                                    }}
                                    value={contactRemarks}
                                    onChange={(e) => setContactRemarks(e.target.value)}
                                    placeholder="Explain issues or notes about this booking..."
                                />
                            </div>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#64748b',
                                    marginBottom: '8px',
                                    textTransform: 'uppercase'
                                }}>
                                    Upload Evidence (Screenshot/Doc)
                                </label>
                                <input 
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setContactEvidence(e.target.files[0])}
                                    style={{ 
                                        display: 'block',
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>
                        </div>
                        <div className="airline-modal-footer">
                            <button className="airline-btn-secondary" onClick={() => setShowContactRemarks(false)}>
                                Cancel
                            </button>
                            <button className="airline-btn-primary" onClick={submitContactWithRemarks}>
                                Proceed & Set Contacted
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AirlineBooking;