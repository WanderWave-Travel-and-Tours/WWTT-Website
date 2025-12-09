import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Sidebar from '../../sidebar/sidebar';
import { Plus, Plane, Calendar, Tag, AlertCircle, X, Eye } from 'lucide-react';
import './AirlineBooking.css';

const AirlineBooking = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [bookings, setBookings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch flight booking inquiries from database
    const fetchFlightBookings = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/inquiries');
            if (response.data.success) {
                const flightRequests = response.data.data.filter(inq => 
                    inq.inquiryType === 'FLIGHT_BOOKING'
                );
                
                setBookings(flightRequests);
                console.log('✅ Flight Bookings loaded:', flightRequests.length);
            }
        } catch (error) {
            console.error('Error fetching flight bookings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFlightBookings();
    }, []);

    // Calculate stats from actual data
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
            'CANCELLED': 'status-cancelled'
        };
        return statusMap[status] || 'status-pending';
    };

    return (
        <div className="airline-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)} />
            <main className={`airline-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
                <div className="airline-container">
                    <div className="airline-header">
                        <div className="airline-title">
                            <h1>Airline Ticketing</h1>
                            <p>Domestic and international flight booking inquiries.</p>
                        </div>
                        <button className="airline-btn-add">
                            <Plus size={18} style={{marginRight:'8px'}}/> New Inquiry
                        </button>
                    </div>

                    <div className="airline-stats-grid">
                        {stats.map((s, i) => (
                            <div className="airline-card" key={i}>
                                <div><h2>{s.value}</h2><span>{s.label}</span></div>
                                <div className="airline-card-icon">{s.icon}</div>
                            </div>
                        ))}
                    </div>

                    <div className="airline-table-container">
                        {isLoading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                Loading flight bookings...
                            </div>
                        ) : bookings.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                No flight booking inquiries yet.
                            </div>
                        ) : (
                            <table className="airline-table">
                                <thead>
                                    <tr>
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
                                    {bookings.map((booking) => (
                                        <tr key={booking._id}>
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </main>

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
                                            href={`http://localhost:5000${selectedBooking.evidenceUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="airline-evidence-link"
                                        >
                                            View Attachment
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="airline-modal-footer">
                            <button className="airline-btn-secondary" onClick={handleCloseModal}>
                                Close
                            </button>
                            <button className="airline-btn-primary">
                                Update Status
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AirlineBooking;