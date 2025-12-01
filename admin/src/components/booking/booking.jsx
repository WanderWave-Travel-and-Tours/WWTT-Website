import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Search, 
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Check,
  X,
  ChevronLeft
} from 'lucide-react';
import './Booking.css';
import Sidebar from '../sidebar/sidebar';

const Booking = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/admin/bookings'); 

      if (!res.ok) throw new Error('Failed to fetch');

      const data = await res.json();

      const formatted = data.map((b, index) => ({
        id: `BK${String(data.length - index).padStart(4, '0')}`,
        mongoId: b._id,
        customerName: b.fullName,
        email: b.email,
        packageName: b.packageName,
        travelDate: b.startDate || 'Not specified',
        startDate: b.startDate,
        endDate: b.endDate,
        duration: b.duration,
        totalAmount: b.totalAmount,
        guests: b.pax?.adult || 1,
        status: b.status || 'pending',
        bookingDate: new Date(b.createdAt).toLocaleDateString('en-CA'),
        message: b.message || '',
        referenceNumber: b.referenceNumber || 'N/A',
        paymentLinkId: b.paymentLinkId,
        rawData: b
      }));

      setBookings(formatted);
      setFilteredBookings(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = bookings;

    if (searchTerm) {
      filtered = filtered.filter(booking => 
        booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === filterStatus);
    }

    setFilteredBookings(filtered);
  }, [searchTerm, filterStatus, bookings]);

  const handleConfirm = async (booking) => {
    if (!confirm(`Confirm booking ${booking.id} for ${booking.customerName}?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/bookings/${booking.mongoId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Failed to confirm booking');

      await fetchBookings();
      alert('✅ Booking confirmed successfully!');
    } catch (error) {
      console.error('Confirm error:', error);
      alert('❌ Failed to confirm booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (booking) => {
    if (!confirm(`Cancel booking ${booking.id} for ${booking.customerName}? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/admin/bookings/${booking.mongoId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Failed to cancel booking');

      await fetchBookings();
      alert('✅ Booking cancelled successfully!');
    } catch (error) {
      console.error('Cancel error:', error);
      alert('❌ Failed to cancel booking. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const stats = {
    total: bookings.length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    pending: bookings.filter(b => b.status === 'pending').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    revenue: bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0)
  };

  return (
    <div className="booking-page">
      <Sidebar />
      
      <div className="booking-container">
        {/* Header with Back Button */}
        <div className="booking-header">
          <button className="back-button">
            <ChevronLeft size={18} />
            <span>Back</span>
          </button>
          
          <div className="booking-header-content">
            <h1>Booking Management</h1>
            <p>View and manage all customer bookings</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Total Bookings</h3>
                <p>{stats.total}</p>
              </div>
              <div className="stat-icon">
                <Calendar size={24} color="#3b82f6" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Confirmed</h3>
                <p style={{ color: '#10b981' }}>{stats.confirmed}</p>
              </div>
              <div className="stat-icon">
                <CheckCircle size={24} color="#10b981" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Pending</h3>
                <p style={{ color: '#f59e0b' }}>{stats.pending}</p>
              </div>
              <div className="stat-icon">
                <AlertCircle size={24} color="#f59e0b" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Cancelled</h3>
                <p style={{ color: '#ef4444' }}>{stats.cancelled}</p>
              </div>
              <div className="stat-icon">
                <XCircle size={24} color="#ef4444" />
              </div>
            </div>
          </div>

          <div className="stat-card revenue-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Total Revenue</h3>
                <p>₱{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="stat-icon">
                <TrendingUp size={24} color="white" />
              </div>
            </div>
          </div>
        </div>

        <div className="search-filter-card">
          <div className="search-filter-wrapper">
            <div className="search-box">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search by name, booking ID, reference, or package..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="filter-buttons">
              <button
                onClick={() => setFilterStatus('all')}
                className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
              >
                All Bookings
              </button>
              <button
                onClick={() => setFilterStatus('confirmed')}
                className={`filter-btn ${filterStatus === 'confirmed' ? 'confirmed-active' : ''}`}
              >
                Confirmed
              </button>
              <button
                onClick={() => setFilterStatus('pending')}
                className={`filter-btn ${filterStatus === 'pending' ? 'pending-active' : ''}`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilterStatus('cancelled')}
                className={`filter-btn ${filterStatus === 'cancelled' ? 'cancelled-active' : ''}`}
              >
                Cancelled
              </button>
            </div>
          </div>
        </div>

        <div className="table-card">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-state">
              <Calendar size={64} className="empty-icon" />
              <h3>No bookings found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer Details</th>
                    <th>Package</th>
                    <th>Travel Date</th>
                    <th>Guests</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr key={booking.id}>
                      {/* Booking ID Column */}
                      <td>
                        <div className="booking-id">{booking.id}</div>
                        <div className="booking-date-small">
                          Booked: {booking.bookingDate}
                        </div>
                        {booking.referenceNumber !== 'N/A' && (
                          <div className="reference-number">
                            Ref: {booking.referenceNumber}
                          </div>
                        )}
                      </td>

                      {/* Customer Column */}
                      <td>
                        <div className="customer-name">{booking.customerName}</div>
                        <div className="customer-contact">
                          <Mail size={13} />
                          <span>{booking.email}</span>
                        </div>
                      </td>

                      {/* Package Column */}
                      <td>
                        <div className="package-name">{booking.packageName}</div>
                        {booking.duration && (
                          <div className="booking-date-small">
                            Duration: {booking.duration}
                          </div>
                        )}
                      </td>

                      {/* Travel Date Column */}
                      <td>
                        <div className="date-cell">
                          <Calendar size={15} />
                          <span>{booking.travelDate}</span>
                        </div>
                        {booking.endDate && (
                          <div className="booking-date-small">
                            to {booking.endDate}
                          </div>
                        )}
                      </td>

                      {/* Guests Column */}
                      <td>
                        <div className="guests-cell">
                          <Users size={15} />
                          <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
                        </div>
                      </td>

                      {/* Amount Column */}
                      <td>
                        <div className="amount-cell">
                          ₱{booking.totalAmount.toLocaleString()}
                        </div>
                      </td>

                      {/* Status Column */}
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status === 'confirmed' && <CheckCircle size={13} />}
                          {booking.status === 'pending' && <AlertCircle size={13} />}
                          {booking.status === 'cancelled' && <XCircle size={13} />}
                          {booking.status}
                        </span>
                      </td>

                      {/* Actions Column */}
                      <td>
                        <div className="action-buttons-group">
                          <button 
                            className="action-btn view-btn"
                            onClick={() => handleViewDetails(booking)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                          {booking.status === 'pending' && (
                            <>
                              <button 
                                className="action-btn confirm-btn"
                                onClick={() => handleConfirm(booking)}
                                disabled={actionLoading}
                                title="Confirm Booking"
                              >
                                <Check size={16} />
                              </button>
                              
                              <button 
                                className="action-btn cancel-btn"
                                onClick={() => handleCancel(booking)}
                                disabled={actionLoading}
                                title="Cancel Booking"
                              >
                                <X size={16} />
                              </button>
                            </>
                          )}

                          {booking.status === 'confirmed' && (
                            <button 
                              className="action-btn cancel-btn"
                              onClick={() => handleCancel(booking)}
                              disabled={actionLoading}
                              title="Cancel Booking"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedBooking && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={22} />
              </button>
            </div>
            
            <div className="modal-body">
              {/* Booking Information */}
              <div className="detail-section">
                <h3>Booking Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Booking ID</span>
                  <span className="detail-value">{selectedBooking.id}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Reference Number</span>
                  <span className="detail-value">{selectedBooking.referenceNumber}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Booking Date</span>
                  <span className="detail-value">{selectedBooking.bookingDate}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge ${selectedBooking.status}`}>
                    {selectedBooking.status === 'confirmed' && <CheckCircle size={13} />}
                    {selectedBooking.status === 'pending' && <AlertCircle size={13} />}
                    {selectedBooking.status === 'cancelled' && <XCircle size={13} />}
                    {selectedBooking.status}
                  </span>
                </div>
              </div>

              {/* Customer Information */}
              <div className="detail-section">
                <h3>Customer Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{selectedBooking.customerName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email Address</span>
                  <span className="detail-value">{selectedBooking.email}</span>
                </div>
              </div>

              {/* Package Information */}
              <div className="detail-section">
                <h3>Package Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Package Name</span>
                  <span className="detail-value">{selectedBooking.packageName}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Duration</span>
                  <span className="detail-value">{selectedBooking.duration}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Travel Period</span>
                  <span className="detail-value">
                    {selectedBooking.startDate} - {selectedBooking.endDate}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Number of Guests</span>
                  <span className="detail-value">
                    {selectedBooking.guests} {selectedBooking.guests === 1 ? 'person' : 'persons'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Total Amount</span>
                  <span className="detail-value" style={{ color: '#10b981', fontSize: '1.125rem' }}>
                    ₱{selectedBooking.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.message && (
                <div className="detail-section">
                  <h3>Special Requests / Notes</h3>
                  <p className="detail-message">{selectedBooking.message}</p>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="modal-footer">
              {selectedBooking.status === 'pending' && (
                <>
                  <button 
                    className="modal-btn confirm-modal-btn"
                    onClick={() => {
                      handleConfirm(selectedBooking);
                      setShowModal(false);
                    }}
                    disabled={actionLoading}
                  >
                    <Check size={16} />
                    Confirm Booking
                  </button>
                  <button 
                    className="modal-btn cancel-modal-btn"
                    onClick={() => {
                      handleCancel(selectedBooking);
                      setShowModal(false);
                    }}
                    disabled={actionLoading}
                  >
                    <X size={16} />
                    Cancel Booking
                  </button>
                </>
              )}
              {selectedBooking.status === 'confirmed' && (
                <button 
                  className="modal-btn cancel-modal-btn"
                  onClick={() => {
                    handleCancel(selectedBooking);
                    setShowModal(false);
                  }}
                  disabled={actionLoading}
                >
                  <X size={16} />
                  Cancel Booking
                </button>
              )}
              <button 
                className="modal-btn close-modal-btn"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Booking;