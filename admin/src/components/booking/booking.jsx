import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Search, TrendingUp, Eye, CheckCircle, XCircle, AlertCircle, Mail, Check, X,
  ChevronLeft, ChevronRight, FileText, CreditCard, FolderOpen
} from 'lucide-react';
import './Booking.css';
import Sidebar from '../sidebar/sidebar'; // Assume Sidebar is a separate component
import BookingStats from './BookingStats';
import BookingFilters from './BookingFilters';
import BookingTable from './BookingTable';
import BookingDetailModal from './BookingDetailModal';
import PaginationControls from './PaginationControls';

// NEW: Iba't Ibang Destination Image URLs (Placeholder - Palitan ng real URLs)
const DESTINATION_IMAGES = {
    TOTAL_BOOKINGS: 'https://picsum.photos/seed/beach/800/600', // Beach theme
    PENDING: 'https://picsum.photos/seed/mountain/800/600',    // Mountain theme
    CONFIRMED: 'https://picsum.photos/seed/city/800/600',      // City/Urban theme
    TOTAL_REVENUE: 'https://picsum.photos/seed/forest/800/600' // Forest/Nature theme
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

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

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
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = bookings;

    const normalizedStatus = filterStatus === 'ALL' ? 'ALL' : filterStatus;
    const lowerSearchTerm = searchTerm.toLowerCase();

    if (normalizedStatus !== 'ALL') {
      filtered = filtered.filter(booking => (booking.status || 'pending') === normalizedStatus);
    }

    if (lowerSearchTerm) {
      filtered = filtered.filter(booking => 
        booking.customerName.toLowerCase().includes(lowerSearchTerm) ||
        booking.id.toLowerCase().includes(lowerSearchTerm) ||
        booking.packageName.toLowerCase().includes(lowerSearchTerm) ||
        booking.referenceNumber.toLowerCase().includes(lowerSearchTerm)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1); 
  }, [searchTerm, filterStatus, bookings]);

  // --- Core Business Logic: CONFIRM & CANCEL (Preserved Original) ---
  const handleAction = async (booking, actionType) => {
    const actionText = actionType === 'confirm' ? 'Confirm' : 'Cancel';
    if (!window.confirm(`${actionText} booking ${booking.id} for ${booking.customerName}? ${actionType === 'cancel' ? 'This action cannot be undone.' : ''}`)) {
      return;
    }

    setActionLoading(true);
    try {
      const endpoint = `http://localhost:5000/api/admin/bookings/${booking.mongoId}/${actionType}`;
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error(`Failed to ${actionType} booking`);

      await fetchBookings();
      if (selectedBooking && selectedBooking.mongoId === booking.mongoId) {
          setShowModal(false);
      }
      
      alert(`✅ Booking ${actionType}ed successfully!`);
    } catch (error) {
      console.error(`${actionType} error:`, error);
      alert(`❌ Failed to ${actionType} booking. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = (booking) => handleAction(booking, 'confirm');
  const handleCancel = (booking) => handleAction(booking, 'cancel');

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const stats = useMemo(() => {
    const confirmedRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    return [
      { label: "Total Bookings", value: bookings.length, icon: <FileText size={24} />, image: DESTINATION_IMAGES.TOTAL_BOOKINGS },
      { label: "Pending", value: bookings.filter(i => (i.status || 'pending') === 'pending').length, icon: <AlertCircle size={24} />, image: DESTINATION_IMAGES.PENDING },
      { label: "Confirmed", value: bookings.filter(i => i.status === 'confirmed').length, icon: <CheckCircle size={24} />, image: DESTINATION_IMAGES.CONFIRMED },
      { label: "Total Revenue", value: confirmedRevenue.toLocaleString(), icon: <CreditCard size={24} />, image: DESTINATION_IMAGES.TOTAL_REVENUE },
    ];
  }, [bookings]);

  /* * * * F I N A L   C O L O R   L O G I C * * *
     All active buttons return 'active-navy'
  */
  const getFilterClassName = (status) => {
    // Check if the passed status matches the currently selected filter status
    if (status.toLowerCase() === filterStatus.toLowerCase()) {
      return 'active-navy'; // Universal Navy Blue class
    }
    return ''; // Inactive
  }

  const statusOptions = useMemo(() => {
    const uniqueStatuses = new Set(bookings.map(i => i.status || 'pending')); 
    const options = ['ALL'];
    if (uniqueStatuses.has('pending')) options.push('pending');
    if (uniqueStatuses.has('confirmed')) options.push('confirmed');
    if (uniqueStatuses.has('cancelled')) options.push('cancelled');
    return options;
  }, [bookings]);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  
  const currentBookings = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredBookings.slice(startIndex, endIndex);
  }, [currentPage, filteredBookings, itemsPerPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Calculate the starting index for the current page
  const startIndex = (currentPage - 1) * itemsPerPage;

  return (
    <div className="bkm-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <main className={`bkm-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="bkm-container">
          
          {/* HEADER (Unique Class Names) */}
          <div className="bkm-header">
            <div className="bkm-title"><h1>Booking Management</h1><p>View and manage all customer bookings</p></div>
            <button className="bkm-btn-add" onClick={() => alert('Service Management is currently not available for Booking.')}><FolderOpen size={18} /> Manage Service</button>
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
          
          {/* Main Table Container (Unique Class Names) */}
          <div className="bkm-table-container">
            <BookingTable
              loading={loading}
              filteredBookingsCount={filteredBookings.length}
              currentBookings={currentBookings}
              handleViewDetails={handleViewDetails}
              handleConfirm={handleConfirm}
              handleCancel={handleCancel}
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
              startIndex={startIndex} 
            />
          </div>
          
          {/* PAGINATION CONTROLS - MOVED OUTSIDE THE TABLE CONTAINER */}
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
        actionLoading={actionLoading}
        CheckCircleIcon={CheckCircle}
        AlertCircleIcon={AlertCircle}
        XCircleIcon={XCircle}
        CheckIcon={Check}
        XIcon={X}
      />
    </div>
  );
};

export default Booking;