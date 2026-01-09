import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Search, Eye, CheckCircle, XCircle, AlertCircle, Mail, Check, X,
  ChevronLeft, ChevronRight, FileText, CreditCard, FolderOpen, Archive, RotateCcw, Wallet
} from 'lucide-react';
import './booking.css';
import Sidebar from '../sidebar/sidebar';
import BookingStats from './BookingStats';
import BookingFilters from './BookingFilters';
import BookingTable from './BookingTable';
import BookingDetailModal from './BookingDetailModal';
import PaginationControls from './PaginationControls';
import { useToast } from '../toast/ToastManager'; // ADD THIS LINE

const DESTINATION_IMAGES = {
    TOTAL_BOOKINGS: 'https://picsum.photos/seed/beach/800/600',
    PENDING: 'https://picsum.photos/seed/mountain/800/600',
    CONFIRMED: 'https://picsum.photos/seed/city/800/600',
    TOTAL_REVENUE: 'https://picsum.photos/seed/forest/800/600',
    PENDING_BALANCE: 'https://picsum.photos/seed/sunset/800/600' // NEW
};

const Booking = () => {
  const toast = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // NEW: Payment filter
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
    let res = await fetch('https://wanderwaveph-backend.onrender.com/api/bookings/active');
    if (!res.ok) {
      console.warn('Active endpoint failed, falling back to all bookings');
      res = await fetch('https://wanderwaveph-backend.onrender.com/api/bookings');
    }

    if (!res.ok) throw new Error('Failed to fetch bookings');

    const data = await res.json();

    const bookingsArray = data.bookings || data;
    const count = data.count || bookingsArray.length;

    const formatted = bookingsArray
      .filter(b => (b.isArchive || 'No') === 'No')
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
        
        paymentType: b.paymentType || 'full',
        initialPaymentAmount: b.initialPaymentAmount || 0,
        remainingBalance: b.remainingBalance || 0,
        balancePaidAmount: b.balancePaidAmount || 0,
        balancePaidAt: b.balancePaidAt,
        
        rawData: b,
        isArchive: b.isArchive || 'No'
      }));

    setBookings(formatted);
    
  } catch (err) {
    console.error('Fetch error:', err);
    
    // ✅ ADD TOAST - ERROR
    toast.error(
      'Failed to load bookings. Please check if the server is running.',
      "❌ Load Failed",
      5000
    );
  } finally {
    setLoading(false);
  }
};

  // ✅ Enhanced filtering with payment status
  useEffect(() => {
    let filtered = bookings;

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase());
    }

    // ✅ NEW: Payment filter
    if (paymentFilter !== 'ALL') {
      if (paymentFilter === 'PENDING_BALANCE') {
        filtered = filtered.filter(b => {
          return b.paymentType === 'partial' && 
                 b.remainingBalance > 0 && 
                 b.balancePaidAmount === 0;
        });
      } else if (paymentFilter === 'FULLY_PAID') {
        filtered = filtered.filter(b => {
          if (b.paymentType === 'full') {
            return b.status === 'confirmed' || b.status === 'fully_paid';
          }
          return b.balancePaidAmount > 0 && (b.totalAmount - b.initialPaymentAmount - b.balancePaidAmount) <= 0;
        });
      } else if (paymentFilter === 'PARTIAL_ONLY') {
        filtered = filtered.filter(b => b.paymentType === 'partial');
      }
    }

    // Search filter
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

    if (searchTerm || filterStatus !== 'ALL' || paymentFilter !== 'ALL') {
    toast.info(
      `Found ${filtered.length} matching bookings`,
      "🔍 Filter Applied",
      2000
    );
  }

  }, [searchTerm, filterStatus, paymentFilter, bookings]);

const handleConfirm = async (booking) => {
  if (!window.confirm(`Confirm booking ${booking.id} for ${booking.customerName}?`)) return;
  
  setActionLoading(true);
  
  try {
    const res = await fetch(`https://wanderwaveph-backend.onrender.com/api/bookings/${booking.mongoId}/confirm`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error();
    
    await fetchBookings();
    
    // ✅ ADD TOAST - SUCCESS
    toast.success(
      `Booking ${booking.id} for ${booking.customerName} confirmed!`,
      "✅ Booking Confirmed",
      4000
    );
    
  } catch (err) {
    // ✅ ADD TOAST - ERROR
    toast.error(
      'Failed to confirm booking. Please try again.',
      "❌ Confirmation Failed",
      4000
    );
  } finally {
    setActionLoading(false);
  }
};

const handleCancel = async (booking) => {
  if (!window.confirm(`Cancel booking ${booking.id}? This cannot be undone.`)) return;
  
  setActionLoading(true);
  
  try {
    const res = await fetch(`https://wanderwaveph-backend.onrender.com/api/bookings/${booking.mongoId}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!res.ok) throw new Error();
    
    await fetchBookings();
    
    // ✅ ADD TOAST - SUCCESS
    toast.warning(
      `Booking ${booking.id} has been cancelled`,
      "⚠️ Booking Cancelled",
      4000
    );
    
  } catch (err) {
    // ✅ ADD TOAST - ERROR
    toast.error(
      'Failed to cancel booking. Please try again.',
      "❌ Cancellation Failed",
      4000
    );
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
    const res = await fetch(`https://wanderwaveph-backend.onrender.com/api/bookings/${booking.mongoId}/archive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await res.json();

    if (result.status === 'ok') {
      await fetchBookings();
      
      // ✅ ADD TOAST - SUCCESS
      toast.success(
        `Booking ${booking.id} ${action}d successfully`,
        `✅ ${isCurrentlyArchived ? 'Unarchived' : 'Archived'}`,
        3000
      );
      
    } else {
      throw new Error('Failed to update archive status');
    }
  } catch (err) {
    console.error('Archive error:', err);
    
    // ✅ ADD TOAST - ERROR
    toast.error(
      `Failed to ${action} booking. Please try again.`,
      "❌ Archive Failed",
      4000
    );
  } finally {
    setActionLoading(false);
  }
};

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // ✅ Enhanced stats with pending balance
  const stats = useMemo(() => {
    const confirmedRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const pendingBalanceCount = bookings.filter(b => 
      b.paymentType === 'partial' && 
      b.remainingBalance > 0 && 
      b.balancePaidAmount === 0
    ).length;

    const totalPendingBalance = bookings
      .filter(b => b.paymentType === 'partial' && b.remainingBalance > 0)
      .reduce((sum, b) => sum + b.remainingBalance, 0);

    return [
      { 
        label: "Total Active Bookings", 
        value: bookings.length, 
        icon: <FileText size={24} />, 
        image: DESTINATION_IMAGES.TOTAL_BOOKINGS 
      },
      { 
        label: "Pending Balance Payments", 
        value: pendingBalanceCount, 
        icon: <Wallet size={24} />, 
        image: DESTINATION_IMAGES.PENDING_BALANCE,
        subtext: `₱${totalPendingBalance.toLocaleString()} total` 
      },
      { 
        label: "Confirmed", 
        value: bookings.filter(b => b.status === 'confirmed').length, 
        icon: <CheckCircle size={24} />, 
        image: DESTINATION_IMAGES.CONFIRMED 
      },
      { 
        label: "Revenue (Confirmed)", 
        value: `₱${confirmedRevenue.toLocaleString()}`, 
        icon: <CreditCard size={24} />, 
        image: DESTINATION_IMAGES.TOTAL_REVENUE 
      },
    ];
  }, [bookings]);

  const getFilterClassName = (status) => 
    status.toLowerCase() === filterStatus.toLowerCase() ? 'active-navy' : '';

  const getPaymentFilterClassName = (filter) => 
    filter === paymentFilter ? 'active-navy' : '';

  const statusOptions = useMemo(() => {
    const opts = ['ALL'];
    const unique = new Set(bookings.map(b => b.status));
    ['pending', 'confirmed', 'cancelled'].forEach(s => unique.has(s) && opts.push(s));
    return opts;
  }, [bookings]);

  // ✅ NEW: Payment filter options
  const paymentOptions = [
    { value: 'ALL', label: 'All Payments' },
    { value: 'PENDING_BALANCE', label: 'Pending Balance' },
    { value: 'FULLY_PAID', label: 'Fully Paid' },
    { value: 'PARTIAL_ONLY', label: 'Partial Payment' }
  ];

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
            paymentFilter={paymentFilter}
            setPaymentFilter={setPaymentFilter}
            paymentOptions={paymentOptions}
            getPaymentFilterClassName={getPaymentFilterClassName}
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
                  <th>Payment Status</th>
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
                WalletIcon={Wallet}
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