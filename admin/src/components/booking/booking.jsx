import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Search, Eye, CheckCircle, XCircle, AlertCircle, Mail, Check, X,
  ChevronLeft, ChevronRight, FileText, CreditCard, FolderOpen, Archive, RotateCcw
} from 'lucide-react';
import './Booking.css';
import Sidebar from '../sidebar/sidebar';
import BookingStats from './BookingStats';
import BookingFilters from './BookingFilters';
import BookingTable from './BookingTable';
import BookingDetailModal from './BookingDetailModal';
import PaginationControls from './PaginationControls';

const DESTINATION_IMAGES = {
    TOTAL_BOOKINGS: 'https://picsum.photos/seed/beach/800/600',
    PENDING: 'https://picsum.photos/seed/mountain/800/600',
    CONFIRMED: 'https://picsum.photos/seed/city/800/600',
    TOTAL_REVENUE: 'https://picsum.photos/seed/forest/800/600'
};

const Booking = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Prioritize /active, fallback to / if 404 (temporary fix)
      let res = await fetch('https://wanderwaveph-backend.onrender.com0/api/bookings/active');
      if (!res.ok) {
        console.warn('Active endpoint failed, falling back to all bookings');
        res = await fetch('https://wanderwaveph-backend.onrender.com0/api/bookings');
      }

      if (!res.ok) throw new Error('Failed to fetch bookings');

      const data = await res.json();

      // Normalize data structure
      const bookingsArray = data.bookings || data; // /active returns {bookings, count}, / returns array
      const count = data.count || bookingsArray.length;

      const formatted = bookingsArray
        .filter(b => (b.isArchive || 'No') === 'No') // Client-side filter if backend fallback
        .map((b, index) => ({
          id: `BK${String(count - index).padStart(4, '0')}`,
          mongoId: b._id,
          customerName: b.fullName || 'N/A',
          email: b.email || 'N/A',
          packageName: b.packageName || 'Unknown Package',
          travelDate: b.startDate || 'Not specified',
          startDate: b.startDate,
          endDate: b.endDate,
          duration: b.duration,
          totalAmount: b.totalAmount || 0,
          guests: b.pax?.adult || 1,
          status: b.status || 'pending',
          bookingDate: new Date(b.createdAt).toLocaleDateString('en-CA'),
          message: b.message || '',
          referenceNumber: b.referenceNumber || 'N/A',
          paymentLinkId: b.paymentLinkId,
          rawData: b,
          isArchive: b.isArchive || 'No'
        }));

      setBookings(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to load bookings. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  useEffect(() => {
    let filtered = bookings;

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase());
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.customerName.toLowerCase().includes(term) ||
        b.id.toLowerCase().includes(term) ||
        b.packageName.toLowerCase().includes(term) ||
        b.email.toLowerCase().includes(term) ||
        b.referenceNumber.toLowerCase().includes(term)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, bookings]);

  const handleConfirm = async (booking) => {
    if (!window.confirm(`Confirm booking ${booking.id} for ${booking.customerName}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`https://wanderwaveph-backend.onrender.com0/api/bookings/${booking.mongoId}/confirm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error();
      await fetchBookings();
      alert('Booking confirmed successfully!');
    } catch (err) {
      alert('Failed to confirm booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (booking) => {
    if (!window.confirm(`Cancel booking ${booking.id}? This cannot be undone.`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`https://wanderwaveph-backend.onrender.com0/api/bookings/${booking.mongoId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) throw new Error();
      await fetchBookings();
      alert('Booking cancelled successfully!');
    } catch (err) {
      alert('Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (booking) => {
    const isCurrentlyArchived = booking.isArchive === 'Yes';
    const action = isCurrentlyArchived ? 'unarchive' : 'archive';
    const message = isCurrentlyArchived
      ? `Unarchive booking ${booking.id}? It will reappear in the active list.`
      : `Archive booking ${booking.id}? It will be hidden from the active list.`;

    if (!window.confirm(message)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`https://wanderwaveph-backend.onrender.com0/api/bookings/${booking.mongoId}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await res.json();

      if (result.status === 'ok') {
        alert(`Booking ${action}d successfully!`);
        await fetchBookings(); // Always refresh — simpler and consistent
      } else {
        alert('Failed to update archive status.');
      }
    } catch (err) {
      console.error('Archive error:', err);
      alert('An error occurred while archiving.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const stats = useMemo(() => {
    const confirmedRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return [
      { label: "Total Active Bookings", value: bookings.length, icon: <FileText size={24} />, image: DESTINATION_IMAGES.TOTAL_BOOKINGS },
      { label: "Pending", value: bookings.filter(b => b.status === 'pending').length, icon: <AlertCircle size={24} />, image: DESTINATION_IMAGES.PENDING },
      { label: "Confirmed", value: bookings.filter(b => b.status === 'confirmed').length, icon: <CheckCircle size={24} />, image: DESTINATION_IMAGES.CONFIRMED },
      { label: "Revenue (Confirmed)", value: `₱${confirmedRevenue.toLocaleString()}`, icon: <CreditCard size={24} />, image: DESTINATION_IMAGES.TOTAL_REVENUE },
    ];
  }, [bookings]);

  const getFilterClassName = (status) => 
    status.toLowerCase() === filterStatus.toLowerCase() ? 'active-navy' : '';

  const statusOptions = useMemo(() => {
    const opts = ['ALL'];
    const unique = new Set(bookings.map(b => b.status));
    ['pending', 'confirmed', 'cancelled'].forEach(s => unique.has(s) && opts.push(s));
    return opts;
  }, [bookings]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [currentPage, filteredBookings]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="bkm-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <main className={`bkm-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="bkm-container">
          <div className="bkm-header">
            <div className="bkm-title">
              <h1>Booking Management</h1>
              <p>View and manage all active customer bookings</p>
            </div>
          </div>

          <BookingStats stats={stats} />
          
          <BookingFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            statusOptions={statusOptions}
            getFilterClassName={getFilterClassName}
          />
          
          <div className="bkm-table-container">
            <table className="bkm-table">
              <thead>
                <tr>
                  <th style={{ width: '50px' }}>No.</th>
                  <th>Booking ID</th>
                  <th>Customer Details</th>
                  <th>Package</th>
                  <th>Travel Date</th>
                  <th>Guests</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              
              <BookingTable
                loading={loading}
                filteredBookingsCount={filteredBookings.length}
                currentBookings={currentBookings}
                handleViewDetails={handleViewDetails}
                handleConfirm={handleConfirm}
                handleCancel={handleCancel}
                handleArchive={handleArchive}
                actionLoading={actionLoading}
                MailIcon={Mail}
                CheckCircleIcon={CheckCircle}
                AlertCircleIcon={AlertCircle}
                XCircleIcon={XCircle}
                EyeIcon={Eye}
                CheckIcon={Check}
                XIcon={X}
                CalendarIcon={Calendar}
                UsersIcon={Users}
                ArchiveIcon={Archive}
                RotateCcwIcon={RotateCcw}
                startIndex={startIndex}
              />
            </table>
          </div>

          {filteredBookings.length > 0 && totalPages > 1 && (
            <PaginationControls 
              totalItems={filteredBookings.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              ChevronLeftIcon={ChevronLeft}
              ChevronRightIcon={ChevronRight}
            />
          )}
        </div>
      </main>

      <BookingDetailModal
        showModal={showModal}
        selectedBooking={selectedBooking}
        setShowModal={setShowModal}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
        handleArchive={handleArchive}
        actionLoading={actionLoading}
        CheckCircleIcon={CheckCircle}
        AlertCircleIcon={AlertCircle}
        XCircleIcon={XCircle}
        CheckIcon={Check}
        XIcon={X}
        ArchiveIcon={Archive}
        RotateCcwIcon={RotateCcw}
      />
    </div>
  );
};

export default Booking;