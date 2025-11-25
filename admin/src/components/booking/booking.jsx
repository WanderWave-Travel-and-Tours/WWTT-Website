import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  Search, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
  Phone
} from 'lucide-react';
import './booking.css';
import Sidebar from '../sidebar/sidebar';

const Booking = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/admin/bookings'); 

        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();

        const formatted = data.map((b, index) => ({
          id: `BK${String(data.length - index).padStart(4, '0')}`,
          customerName: b.fullName,
          email: b.email,
          phone: b.phone || 'Not provided',
          packageName: b.packageName,
          // ✅ FIX: Use startDate and endDate from database
          travelDate: b.startDate || 'Not specified',
          startDate: b.startDate,
          endDate: b.endDate,
          duration: b.duration,
          totalAmount: b.totalAmount,
          guests: b.pax?.adult || 1,
          status: b.status || 'pending',
          bookingDate: new Date(b.createdAt).toLocaleDateString('en-CA'),
          message: b.message || '',
          // Additional fields
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

    fetchBookings();
  }, []);

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
      <Sidebar/>
      <div className="booking-container">
        <div className="booking-header">
          <h1>Booking Management</h1>
          <p>View and manage all customer bookings</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Total Bookings</h3>
                <p>{stats.total}</p>
              </div>
              <div className="stat-icon">
                <Calendar size={28} color="#667eea" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Confirmed</h3>
                <p style={{ color: '#48bb78' }}>{stats.confirmed}</p>
              </div>
              <div className="stat-icon">
                <CheckCircle size={28} color="#48bb78" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Pending</h3>
                <p style={{ color: '#ecc94b' }}>{stats.pending}</p>
              </div>
              <div className="stat-icon">
                <AlertCircle size={28} color="#ecc94b" />
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Cancelled</h3>
                <p style={{ color: '#f56565' }}>{stats.cancelled}</p>
              </div>
              <div className="stat-icon">
                <XCircle size={28} color="#f56565" />
              </div>
            </div>
          </div>

          <div className="stat-card revenue-card">
            <div className="stat-card-content">
              <div className="stat-info">
                <h3>Revenue</h3>
                <p>₱{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="stat-icon">
                <Download size={28} color="white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="search-filter-card">
          <div className="search-filter-wrapper">
            <div className="search-box">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by name, booking ID, reference number, or package..."
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
                All
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

        {/* Bookings Table */}
        <div className="table-card">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading bookings...</p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="empty-state">
              <Calendar size={56} className="empty-icon" />
              <h3>No bookings found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="bookings-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
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
                      <td>
                        <div className="booking-id">{booking.id}</div>
                        <div className="booking-date-small">{booking.bookingDate}</div>
                        {booking.referenceNumber !== 'N/A' && (
                          <div className="reference-number" style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            fontFamily: 'monospace',
                            marginTop: '4px'
                          }}>
                            Ref: {booking.referenceNumber}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="customer-name">{booking.customerName}</div>
                        <div className="customer-contact">
                          <Mail size={12} />
                          <span>{booking.email}</span>
                        </div>
                        <div className="customer-contact">
                          <Phone size={12} />
                          <span>{booking.phone}</span>
                        </div>
                      </td>
                      <td>
                        <div className="package-name">{booking.packageName}</div>
                        {booking.duration && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '4px'
                          }}>
                            {booking.duration}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={16} />
                          <span>{booking.travelDate}</span>
                        </div>
                        {booking.endDate && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            marginTop: '4px'
                          }}>
                            to {booking.endDate}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="guests-cell">
                          <Users size={16} />
                          <span>{booking.guests}</span>
                        </div>
                      </td>
                      <td>
                        <div className="amount-cell">
                          ₱{booking.totalAmount.toLocaleString()}
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status === 'confirmed' && <CheckCircle size={14} />}
                          {booking.status === 'pending' && <AlertCircle size={14} />}
                          {booking.status === 'cancelled' && <XCircle size={14} />}
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="action-btn"
                          onClick={() => {
                            // TODO: Open modal with full booking details
                            console.log('View booking:', booking);
                          }}
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Booking;