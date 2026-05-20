import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar, Users, Search, Eye, CheckCircle, XCircle, AlertCircle, Mail, Check, X,
  ChevronLeft, ChevronRight, FileText, CreditCard, FolderOpen, Archive, RotateCcw, Wallet, 
} from 'lucide-react';
import './booking.css';
import Sidebar from '../sidebar/sidebar';
import BookingStats from './BookingStats';
import BookingFilters from './BookingFilters';
import BookingTable from './BookingTable';
import BookingDetailModal from './BookingDetailModal';
import PaginationControls from './PaginationControls';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import NewBookingModal from './salesbooking/NewBookingModal';

const DESTINATION_IMAGES = {
    TOTAL_BOOKINGS: 'https://picsum.photos/seed/beach/800/600',
    PENDING: 'https://picsum.photos/seed/mountain/800/600',
    CONFIRMED: 'https://picsum.photos/seed/city/800/600',
    TOTAL_REVENUE: 'https://picsum.photos/seed/forest/800/600',
    PENDING_BALANCE: 'https://picsum.photos/seed/sunset/800/600'
};

const Booking = () => {
  const toast = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [selectedBookings, setSelectedBookings] = useState([]);
const [createdByFilter, setCreatedByFilter] = useState('ALL');
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "primary"
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      let res = await fetch('https://wanderwaveph.onrender.com/api/bookings/active');
      if (!res.ok) {
        res = await fetch('https://wanderwaveph.onrender.com/api/bookings');
      }

      if (!res.ok) throw new Error('Failed to fetch bookings');

      const data = await res.json();
      const bookingsArray = data.bookings || data;
      const count = data.count || bookingsArray.length;

      const formatted = bookingsArray
        .filter(b => (b.isArchive || 'No') === 'No')
        .map((b, index) => {
          const isWalkin = b.isWalkin || false;
const actualStatus = b.status || 'pending';   // ← Tinanggal na ang forced 'confirmed'
          
          return {
  id: `BK${String(count - index).padStart(4, '0')}`,
  mongoId: b._id,
  customerName: b.fullName || 'N/A',
  email: b.email || 'N/A',
  packageName: b.packageName || 'Unknown Package',
  destination: b.destination || b.packageId?.destination || 'N/A',
  travelDate: b.startDate || 'Not specified',
  startDate: b.startDate,
  endDate: b.endDate,
  duration: b.duration,
  totalAmount: b.totalAmount || 0,
  guests: b.pax?.adult || 1,
  status: actualStatus,
  bookingDate: new Date(b.createdAt).toLocaleDateString('en-CA'),
  message: b.message || '',
  referenceNumber: b.referenceNumber || 'N/A',
  paymentLinkId: b.paymentLinkId,
  paymentType: b.paymentType || 'full',
  initialPaymentAmount: b.initialPaymentAmount || 0,
  remainingBalance: isWalkin ? 0 : (b.remainingBalance || 0),
  balancePaidAmount: isWalkin ? b.totalAmount : (b.balancePaidAmount || 0),
  balancePaidAt: b.balancePaidAt,
  isWalkin: isWalkin,
  
  // ✅ FORCE SALES FOR ALL WALK-IN
  createdByType: isWalkin ? 'sales' : (b.createdByType || 'user'),
  
  passengers: b.passengers || [],
  rawData: b,
  isArchive: b.isArchive || 'No'
};
        });

      setBookings(formatted);
      
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error(
        'Failed to load bookings. Please check if the server is running.',
        "Load Failed",
        5000
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = bookings;

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase());
    }

    if (paymentFilter !== 'ALL') {
      if (paymentFilter === 'PENDING_BALANCE') {
        filtered = filtered.filter(b => {
          if (b.isWalkin) return false;
          return b.paymentType === 'partial' && 
                 b.remainingBalance > 0 && 
                 b.balancePaidAmount === 0;
        });
      } else if (paymentFilter === 'FULLY_PAID') {
        filtered = filtered.filter(b => {
          if (b.isWalkin) return true;
          if (b.paymentType === 'full') {
            return b.status === 'confirmed' || b.status === 'fully_paid';
          }
          return b.balancePaidAmount > 0 && (b.totalAmount - b.initialPaymentAmount - b.balancePaidAmount) <= 0;
        });
      } else if (paymentFilter === 'PARTIAL_ONLY') {
        filtered = filtered.filter(b => !b.isWalkin && b.paymentType === 'partial');
      }
    }

    if (typeFilter !== 'ALL') {
      if (typeFilter === 'ONLINE') {
        filtered = filtered.filter(b => b.isWalkin === false);
      } else if (typeFilter === 'WALK_IN') {
        filtered = filtered.filter(b => b.isWalkin === true);
      }
    }
// Created By Filter
if (createdByFilter !== 'ALL') {
  filtered = filtered.filter(b => b.createdByType === createdByFilter.toLowerCase());
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

  }, [searchTerm, filterStatus, paymentFilter, typeFilter, createdByFilter, bookings]);

  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
      type
    });
  };

  const executeConfirm = async (booking) => {
    // ===== DEBUG =====
    console.group('%c🔍 [executeConfirm] DEBUG', 'color: #f59e0b; font-weight: bold;');
    console.log('Full booking object:', booking);
    console.log('mongoId value:', booking?.mongoId);
    console.log('mongoId type:', typeof booking?.mongoId);
    const url = `https://wanderwaveph.onrender.com/api/bookings/${booking?.mongoId}/confirm`;
    console.log('Request URL:', url);
    console.log('Method: PUT');
    // =================

    setActionLoading(true);
    try {
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      // ===== DEBUG =====
      console.log('Response status:', res.status, res.statusText);
      console.log('Response headers:', Object.fromEntries(res.headers.entries()));
      // =================

      const responseBody = await res.json().catch(() => ({ _parseError: true }));

      // ===== DEBUG =====
      console.log('Response body:', responseBody);
      console.groupEnd();
      // =================

      if (!res.ok) {
        throw new Error(responseBody?.message || `Server returned ${res.status} - ${res.statusText}`);
      }
      
      await fetchBookings();
      toast.success(
        `Booking ${booking.id} for ${booking.customerName} confirmed!`,
        "Booking Confirmed",
        4000
      );
      
    } catch (err) {
      console.error('Confirm error:', err);
      toast.error(
        err.message || 'Failed to confirm booking.',
        "Confirm Failed",
        5000
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = (booking) => {
    askConfirmation(
      "Confirm Booking",
      `Are you sure you want to confirm booking ${booking.id} for ${booking.customerName}?`,
      () => executeConfirm(booking),
      "primary"
    );
  };

  const executeCancel = async (booking) => {
    setActionLoading(true);
    try {
      const res = await fetch(`https://wanderwaveph.onrender.com/api/bookings/${booking.mongoId}/cancel`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.message || 'Failed to cancel booking');
      }

      await fetchBookings();
      toast.success(
        `Booking ${booking.id} for ${booking.customerName} has been cancelled.`,
        "Booking Cancelled",
        4000
      );
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error(
        err.message || 'Failed to cancel booking.',
        "Cancel Failed",
        5000
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = (booking) => {
    askConfirmation(
      "Cancel Booking",
      `Are you sure you want to cancel booking ${booking.id} for ${booking.customerName}? This action cannot be undone.`,
      () => executeCancel(booking),
      "danger"
    );
  };

  const executeArchive = async (booking, action) => {
    setActionLoading(true);
    try {
        const res = await fetch(`https://wanderwaveph.onrender.com/api/bookings/${booking.mongoId}/archive`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData?.message || `Failed to ${action} booking`);
        }

        await fetchBookings();
        toast.success(
            `Booking ${booking.id} has been ${action}d successfully.`,
            action === 'archive' ? "Booking Archived" : "Booking Restored",
            4000
        );
    } catch (err) {
        console.error('Archive error:', err);
        toast.error(
            err.message || `Failed to ${action} booking.`,
            `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
            5000
        );
    } finally {
        setActionLoading(false);
    }
  };

  const handleArchive = (booking) => {
    const isCurrentlyArchived = booking.isArchive === 'Yes';
    const action = isCurrentlyArchived ? 'unarchive' : 'archive';
    const title = isCurrentlyArchived ? "Unarchive Booking" : "Archive Booking";
    const message = isCurrentlyArchived
      ? `Unarchive booking ${booking.id}? It will reappear in the active list.`
      : `Archive booking ${booking.id}? It will be hidden from the active list.`;

    askConfirmation(
      title,
      message,
      () => executeArchive(booking, action),
      "primary"
    );
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  // ==================== MULTI-SELECT FUNCTIONS ====================

  const toggleSelect = (booking) => {
    setSelectedBookings(prev =>
      prev.some(b => b.mongoId === booking.mongoId)
        ? prev.filter(b => b.mongoId !== booking.mongoId)
        : [...prev, booking]
    );
  };

  const selectAll = () => {
    if (selectedBookings.length === currentBookings.length) {
      setSelectedBookings([]);                     // deselect all
    } else {
      setSelectedBookings([...currentBookings]);   // select all visible
    }
  };

  const clearSelection = () => {
    setSelectedBookings([]);
  };

    const handleBulkArchiveClick = () => {
    if (selectedBookings.length === 0) return;

    const count = selectedBookings.length;
    const title = "Archive Selected Bookings";
    const message = `Are you sure you want to archive ${count} booking${count > 1 ? 's' : ''}? This action cannot be undone.`;

    askConfirmation(
      title,
      message,
      async () => {
        setActionLoading(true);

        try {
          // Process all archives in parallel (mas mabilis)
          await Promise.all(
            selectedBookings.map(async (booking) => {
              const res = await fetch(`https://wanderwaveph.onrender.com/api/bookings/${booking.mongoId}/archive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'archive' })
              });

              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to archive booking ${booking.id}`);
              }
            })
          );

          // Refresh once lang pagkatapos ng lahat
          await fetchBookings();
          
          clearSelection();

          toast.success(
            `${count} booking${count > 1 ? 's' : ''} archived successfully.`,
            "Bulk Archive Completed",
            4000
          );

        } catch (err) {
          console.error('Bulk archive error:', err);
          toast.error(
            err.message || 'Failed to archive some bookings.',
            "Bulk Archive Failed",
            5000
          );
          // Still refresh para makita ang successful ones
          await fetchBookings();
        } finally {
          setActionLoading(false);
        }
      },
      "danger"
    );
  };
  // ================================================================

  const stats = useMemo(() => {
    const confirmedRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const pendingBalanceCount = bookings.filter(b => 
      !b.isWalkin &&
      b.paymentType === 'partial' && 
      b.remainingBalance > 0 && 
      b.balancePaidAmount === 0
    ).length;

    const totalPendingBalance = bookings
      .filter(b => !b.isWalkin && b.paymentType === 'partial' && b.remainingBalance > 0)
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

  const getTypeFilterClassName = (filter) => 
    filter === typeFilter ? 'active-navy' : '';

  const statusOptions = useMemo(() => {
    const opts = ['ALL'];
    const unique = new Set(bookings.map(b => b.status));
    ['pending', 'confirmed', 'cancelled'].forEach(s => unique.has(s) && opts.push(s));
    return opts;
  }, [bookings]);

  const paymentOptions = [
    { value: 'ALL', label: 'All Payments' },
    { value: 'PENDING_BALANCE', label: 'Pending Balance' },
    { value: 'FULLY_PAID', label: 'Fully Paid' },
    { value: 'PARTIAL_ONLY', label: 'Partial Payment' }
  ];

  const typeOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'ONLINE', label: 'Online Payment' },
    { value: 'WALK_IN', label: 'Pay Over the Counter' }
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

            <button 
              className="bkm-btn-add"
              onClick={() => setShowNewBookingModal(true)}
            >
              <span style={{ fontSize: '18px', marginRight: '6px' }}>+</span>
              NEW BOOKING
            </button>
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
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            typeOptions={typeOptions}
            getTypeFilterClassName={getTypeFilterClassName}
            createdByFilter={createdByFilter}
            setCreatedByFilter={setCreatedByFilter}
          />

          {selectedBookings.length > 0 && (
  <div className="bulk-action-bar">
    <span>
      {selectedBookings.length} booking{selectedBookings.length > 1 ? 's' : ''} selected
    </span>
    
    <button 
      onClick={handleBulkArchiveClick}
      disabled={actionLoading}
    >
      <Archive size={16} />
      Archive Selected
    </button>
    
    <button 
      onClick={clearSelection}
      disabled={actionLoading}
    >
      Clear Selection
    </button>
  </div>
)}

          <div className="bkm-table-container">
            <table className="bkm-table">
              <thead>
                <tr>
                  {/* Select All Checkbox */}
                  <th style={{ width: '50px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={currentBookings.length > 0 && selectedBookings.length === currentBookings.length}
                      onChange={selectAll}
                    />
                  </th>
                  <th style={{ width: '50px' }}>No.</th>
                  <th>Booking ID</th>
                  <th>Customer Details</th>
                  <th>Package</th>
                  <th>Travel Date</th>
                  <th>Guests</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Status</th>
                  <th>Created By</th>
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
                selectedBookings={selectedBookings}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
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
 
      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />

      {/* NEW BOOKING MODAL */}
      <NewBookingModal 
        isOpen={showNewBookingModal} 
        onClose={() => setShowNewBookingModal(false)} 
      />
    </div>
  );
};

export default Booking;