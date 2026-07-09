/**
 * CustomBooking.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Drop-in replacement for booking.jsx.
 * Fetches from /api/customized-bookings (CustomizedBooking model).
 *
 * Usage in App.jsx (replace existing import):
 *   import CustomBooking from './customizedBooking/CustomBooking';
 *   <Route path="/booking" element={<ProtectedRoute><CustomBooking /></ProtectedRoute>} />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText, Wallet, CheckCircle, CreditCard,
  Archive, ChevronLeft, ChevronRight, Plus, X, Mail, Users, Calendar, RotateCcw,
} from 'lucide-react';
import './CustomBooking.css';

// ── Service type → human-readable label map ──────────────────────────────────
const SERVICE_LABELS = {
  visa:             { title: 'VISA Processing',        subtitle: 'Manage all VISA booking requests' },
  psa:              { title: 'PSA Serbilis',           subtitle: 'Manage all PSA document requests' },
  cenomar:          { title: 'CENOMAR Request',        subtitle: 'Manage all CENOMAR requests' },
  passport:         { title: 'Passport Appointment',   subtitle: 'Manage all passport appointment bookings' },
  airlinebooking:   { title: 'Flight Bookings',        subtitle: 'Manage all airline booking requests' },
  hotelbooking:     { title: 'Hotel Bookings',         subtitle: 'Manage all hotel booking requests' },
  tourarrangements: { title: 'Tour Arrangements',      subtitle: 'Manage all tour arrangement bookings' },
  ferrybooking:     { title: 'Ferry Bookings',         subtitle: 'Manage all ferry booking requests' },
  marriagecert:     { title: 'Marriage Certificate',   subtitle: 'Manage all marriage certificate requests' },
  travelinsurance:  { title: 'Travel Insurance',       subtitle: 'Manage all travel insurance requests' },
  billspayment:     { title: 'Bills Payment',          subtitle: 'Manage all bills payment requests' },
  transfers:        { title: 'Transfer Bookings',      subtitle: 'Manage all transfer booking requests' },
};

// Sub-components (new customized versions)
import CustomBookingStats        from './CustomBookingStats';
import CustomBookingTable        from './CustomBookingTable';
import CustomBookingDetailModal  from './CustomBookingDetailModal';

// Filters, mobile card view + pagination — reused from the general Booking
// Management page so all booking dashboards share the same layout,
// including the mobile filter FAB / bottom-sheet panel.
import BookingFilters from '../booking/BookingFilters';
import BookingCards from '../booking/BookingCards';
import '../booking/BookingCards.css';
import PaginationControls from '../booking/PaginationControls';

// ── Sidebar: reuse the project's existing sidebar ────────────────────────────
// If your sidebar lives somewhere else, update this import path.
import Sidebar from '../sidebar/sidebar';

// ── Toast: reuse the project's existing toast system ─────────────────────────
import { useToast } from '../toast/ToastManager';

// ── Confirm Modal: reuse the project's confirmation modal ────────────────────
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';

// ── New Booking Form: lives in the same customizedBookingAdmin folder ─────────
import CustomBookingForm from './CustomizedBookingForm';
import BookingChoiceModal from '../booking/BookingChoiceModal';

// ─────────────────────────────────────────────────────────────────────────────
const API = 'https://wanderwaveph.onrender.com';
const ITEMS_PER_PAGE = 10;

const DESTINATION_IMAGES = {
  TOTAL_BOOKINGS: 'https://picsum.photos/seed/beach/800/600',
  PENDING:        'https://picsum.photos/seed/mountain/800/600',
  CONFIRMED:      'https://picsum.photos/seed/city/800/600',
  TOTAL_REVENUE:  'https://picsum.photos/seed/forest/800/600',
};

const CustomBooking = () => {
  const toast = useToast();
  const { serviceType } = useParams();
  const navigate = useNavigate(); // ✅ NEW: for Edit navigation

  // ── Resolve page title from service type ───────────────────────────────────
  const serviceInfo = SERVICE_LABELS[serviceType] || {
    title: 'Customized Booking Management',
    subtitle: 'View and manage all active customer bookings',
  };

  // ── Sidebar state ──────────────────────────────────────────────────────────
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(p => !p);

  // ── Data ───────────────────────────────────────────────────────────────────
  const [bookings,         setBookings]         = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [actionLoading,    setActionLoading]    = useState(false);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [searchTerm,      setSearchTerm]      = useState('');
  const [filterStatus,    setFilterStatus]    = useState('ALL');
  const [paymentFilter,   setPaymentFilter]   = useState('ALL');
  const [typeFilter,      setTypeFilter]      = useState('ALL');
  const [createdByFilter, setCreatedByFilter] = useState('ALL');

  // ── Pagination ─────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // ── Modals ─────────────────────────────────────────────────────────────────
  const [showDetailModal,     setShowDetailModal]     = useState(false);
  const [selectedBooking,     setSelectedBooking]     = useState(null);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showBookingChoiceModal, setShowBookingChoiceModal] = useState(false);
  const [newBookingMode, setNewBookingMode] = useState('assist'); // 'walkin' | 'assist'

  // ── Bulk selection ─────────────────────────────────────────────────────────
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [bulkBarClosing, setBulkBarClosing] = useState(false);

  // Keep the bulk action bar mounted briefly after the selection empties
  // out so its exit animation can play, instead of popping off instantly.
  useEffect(() => {
    if (selectedBookings.length > 0) {
      setShowBulkBar(true);
      setBulkBarClosing(false);
      return;
    }
    if (showBulkBar) {
      setBulkBarClosing(true);
      const timeout = setTimeout(() => {
        setShowBulkBar(false);
        setBulkBarClosing(false);
      }, 220);
      return () => clearTimeout(timeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBookings.length]);

  // ── Confirm dialog ─────────────────────────────────────────────────────────
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary',
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // FETCH  ← now hits /api/customized-bookings
  // ═══════════════════════════════════════════════════════════════════════════
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/customized-bookings?limit=500`);
      if (!res.ok) throw new Error('Failed to fetch customized bookings');

      const data = await res.json();
      // Route returns: { success, total, page, pages, data: [...] }
      const arr   = Array.isArray(data.data) ? data.data : [];
      const count = data.total || arr.length;

      const formatted = arr
        .filter(b => (b.isArchive || 'No') === 'No')
        .map((b, i) => {
          const tours     = b.tours     || [];
          const transfers = b.transfers || [];

          // Compute balance paid: if remaining is 0 on a partial, the balance
          // portion was paid. This keeps the existing payment badge logic working.
          const balancePaidAmount =
            b.paymentType === 'partial' && (b.remainingBalance || 0) <= 0
              ? (b.totalAmount || 0) - (b.initialPaymentAmount || 0)
              : 0;

          return {
            id:                   `CB${String(count - i).padStart(4, '0')}`,
            mongoId:              b._id,
            customerName:         b.fullName        || 'N/A',
            email:                b.email           || 'N/A',
            // CustomizedBooking has no packageName — use destination as the display label
            packageName:          b.destination     || 'Customized Trip',
            destination:          b.destination     || 'N/A',
            travelDate:           b.travelDate      || 'Not specified',
            returnDate:           b.returnDate      || '',
            totalAmount:          b.totalAmount     || 0,
            guests:               b.paxCount        || 1,
            status:               b.status          || 'pending',
            bookingDate:          new Date(b.createdAt).toLocaleDateString('en-CA'),
            message:              b.message         || b.notes || '',
            referenceNumber:      b.referenceNumber || 'N/A',
            paymentLinkId:        null,
            paymentType:          b.paymentType     || 'full',
            initialPaymentAmount: b.initialPaymentAmount || 0,
            remainingBalance:     b.remainingBalance    || 0,
            balancePaidAmount,
            balancePaidAt:        null,
            // Map DB createdByType: 'customer' → 'user' for display consistency
            isWalkin:             b.isWalkin === true,
            createdByType:        b.createdByType === 'sales' ? 'sales' : 'user',
            passengers:           [],
            // Wrap tours & transfers under rawData.addOns so the detail modal
            // can render them with its existing addOns rendering logic
            rawData: {
              ...b,
              addOns: {
                tours,
                transfers,
                addOnsTotal: (b.toursTotal || 0) + (b.transfersTotal || 0),
              },
            },
            isArchive: b.isArchive || 'No',
          };
        });

      setBookings(formatted);
    } catch (err) {
      console.error('Fetch error:', err);
      toast.error('Failed to load bookings. Check if the server is running.', 'Load Failed', 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTERING
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    let filtered = [...bookings];

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase());
    }

    if (paymentFilter === 'PENDING_BALANCE') {
      filtered = filtered.filter(b =>
        b.paymentType === 'partial' && b.remainingBalance > 0 && b.balancePaidAmount === 0
      );
    } else if (paymentFilter === 'FULLY_PAID') {
      filtered = filtered.filter(b => {
        if (b.paymentType === 'full') return b.status === 'confirmed' || b.status === 'fully_paid';
        return b.balancePaidAmount > 0 && (b.totalAmount - b.initialPaymentAmount - b.balancePaidAmount) <= 0;
      });
    } else if (paymentFilter === 'PARTIAL_ONLY') {
      filtered = filtered.filter(b => b.paymentType === 'partial');
    }

    if (typeFilter === 'ONLINE')  filtered = filtered.filter(b => !b.isWalkin);
    if (typeFilter === 'WALK_IN') filtered = filtered.filter(b => b.isWalkin);

    if (createdByFilter !== 'ALL') {
      filtered = filtered.filter(b => b.createdByType === createdByFilter.toLowerCase());
    }

    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      filtered = filtered.filter(b =>
        b.customerName.toLowerCase().includes(t) ||
        b.id.toLowerCase().includes(t) ||
        b.packageName.toLowerCase().includes(t) ||
        b.email.toLowerCase().includes(t) ||
        b.referenceNumber.toLowerCase().includes(t)
      );
    }

    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [searchTerm, filterStatus, paymentFilter, typeFilter, createdByFilter, bookings]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CONFIRM DIALOG HELPER
  // ═══════════════════════════════════════════════════════════════════════════
  const askConfirm = (title, message, onConfirm, type = 'primary') => {
    setConfirmConfig({
      isOpen: true, title, message, type,
      onConfirm: async () => {
        setConfirmConfig(p => ({ ...p, isOpen: false }));
        await onConfirm();
      },
    });
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS: CONFIRM  ← PATCH /api/customized-bookings/:id/status
  // ═══════════════════════════════════════════════════════════════════════════
  const executeConfirm = async (booking) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/customized-bookings/${booking.mongoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Server error ${res.status}`);
      }
      await fetchBookings();
      toast.success(`Booking ${booking.id} confirmed!`, 'Booking Confirmed', 4000);
    } catch (err) {
      toast.error(err.message || 'Failed to confirm booking.', 'Confirm Failed', 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = (booking) => {
    askConfirm(
      'Confirm Booking',
      `Confirm booking ${booking.id} for ${booking.customerName}?`,
      () => executeConfirm(booking),
      'primary'
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS: CANCEL  ← PATCH /api/customized-bookings/:id/status
  // ═══════════════════════════════════════════════════════════════════════════
  const executeCancel = async (booking) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/customized-bookings/${booking.mongoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to cancel booking');
      }
      await fetchBookings();
      toast.success(`Booking ${booking.id} cancelled.`, 'Booking Cancelled', 4000);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking.', 'Cancel Failed', 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = (booking) => {
    askConfirm(
      'Cancel Booking',
      `Cancel booking ${booking.id} for ${booking.customerName}? This cannot be undone.`,
      () => executeCancel(booking),
      'danger'
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS: ARCHIVE / UNARCHIVE
  // ← PATCH /api/customized-bookings/:id/archive
  // ← PATCH /api/customized-bookings/:id/unarchive
  // ═══════════════════════════════════════════════════════════════════════════
  const executeArchive = async (booking, action) => {
    setActionLoading(true);
    try {
      const endpoint = action === 'unarchive'
        ? `${API}/api/customized-bookings/${booking.mongoId}/unarchive`
        : `${API}/api/customized-bookings/${booking.mongoId}/archive`;

      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Failed to ${action} booking`);
      }
      await fetchBookings();
      toast.success(`Booking ${booking.id} ${action}d.`, action === 'archive' ? 'Archived' : 'Restored', 4000);
    } catch (err) {
      toast.error(err.message || `Failed to ${action} booking.`, `${action} Failed`, 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = (booking) => {
    const archived = booking.isArchive === 'Yes';
    const action   = archived ? 'unarchive' : 'archive';
    askConfirm(
      archived ? 'Unarchive Booking' : 'Archive Booking',
      archived
        ? `Unarchive booking ${booking.id}? It will reappear in the active list.`
        : `Archive booking ${booking.id}? It will be hidden from the active list.`,
      () => executeArchive(booking, action),
      'primary'
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // BULK ARCHIVE  ← PATCH /api/customized-bookings/:id/archive
  // ═══════════════════════════════════════════════════════════════════════════
  const handleBulkArchive = () => {
    if (!selectedBookings.length) return;
    const count = selectedBookings.length;
    askConfirm(
      'Archive Selected Bookings',
      `Archive ${count} booking${count > 1 ? 's' : ''}? This cannot be undone.`,
      async () => {
        setActionLoading(true);
        try {
          await Promise.all(
            selectedBookings.map(b =>
              fetch(`${API}/api/customized-bookings/${b.mongoId}/archive`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
              }).then(async r => {
                if (!r.ok) {
                  const e = await r.json().catch(() => ({}));
                  throw new Error(e.message || `Failed to archive ${b.id}`);
                }
              })
            )
          );
          await fetchBookings();
          setSelectedBookings([]);
          toast.success(`${count} booking${count > 1 ? 's' : ''} archived.`, 'Bulk Archive Done', 4000);
        } catch (err) {
          toast.error(err.message || 'Failed to archive some bookings.', 'Bulk Archive Failed', 5000);
          await fetchBookings();
        } finally {
          setActionLoading(false);
        }
      },
      'danger'
    );
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // SELECTION
  // ═══════════════════════════════════════════════════════════════════════════
  const totalPages     = Math.ceil(filteredBookings.length / itemsPerPage);
  const currentBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage, filteredBookings]);

  const toggleSelect = (booking) => {
    setSelectedBookings(prev =>
      prev.some(b => b.mongoId === booking.mongoId)
        ? prev.filter(b => b.mongoId !== booking.mongoId)
        : [...prev, booking]
    );
  };

  const selectAll = () => {
    setSelectedBookings(
      selectedBookings.length === currentBookings.length ? [] : [...currentBookings]
    );
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
  };

  // ── Edit: navigate to EditCustomBooking page ──────────────────────────────
  // ✅ NEW: Called by the Edit button inside CustomBookingDetailModal
  const handleEdit = (booking) => {
    navigate(`/EditCustomBooking/${booking.mongoId}`);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════════════════
  const stats = useMemo(() => {
    const confirmedRevenue = bookings
      .filter(b => b.status === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    // For customized bookings: partial + remainingBalance > 0 = pending balance
    const pendingBalanceCount = bookings.filter(b =>
      b.paymentType === 'partial' && b.remainingBalance > 0 && b.balancePaidAmount === 0
    ).length;

    const totalPendingBalance = bookings
      .filter(b => b.paymentType === 'partial' && b.remainingBalance > 0)
      .reduce((sum, b) => sum + b.remainingBalance, 0);

    return [
      {
        label: 'Total Active Bookings',
        value: bookings.length,
        icon: <FileText size={24} />,
        variant: 'total',
        image: DESTINATION_IMAGES.TOTAL_BOOKINGS,
      },
      {
        label: 'Pending Balance',
        value: pendingBalanceCount,
        icon: <Wallet size={24} />,
        variant: 'pending',
        subtext: `₱${totalPendingBalance.toLocaleString()} total`,
        image: DESTINATION_IMAGES.PENDING,
      },
      {
        label: 'Confirmed',
        value: bookings.filter(b => b.status === 'confirmed').length,
        icon: <CheckCircle size={24} />,
        variant: 'confirmed',
        image: DESTINATION_IMAGES.CONFIRMED,
      },
      {
        label: 'Revenue (Confirmed)',
        value: `₱${confirmedRevenue.toLocaleString()}`,
        icon: <CreditCard size={24} />,
        variant: 'revenue',
        image: DESTINATION_IMAGES.TOTAL_REVENUE,
      },
    ];
  }, [bookings]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER OPTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const statusOptions = useMemo(() => {
    const opts = ['ALL'];
    const unique = new Set(bookings.map(b => b.status));
    ['pending', 'confirmed', 'cancelled'].forEach(s => unique.has(s) && opts.push(s));
    return opts;
  }, [bookings]);

  const paymentOptions = [
    { value: 'ALL',             label: 'All Payments' },
    { value: 'PENDING_BALANCE', label: 'Pending Balance' },
    { value: 'FULLY_PAID',      label: 'Fully Paid' },
    { value: 'PARTIAL_ONLY',    label: 'Partial Payment' },
  ];

  const typeOptions = [
    { value: 'ALL',     label: 'All' },
    { value: 'ONLINE',  label: 'Online Payment' },
    { value: 'WALK_IN', label: 'Walk-in / Counter' },
  ];

  const startIndex = (currentPage - 1) * itemsPerPage;

  const isAnyModalOpen = showDetailModal || showBookingChoiceModal || showNewBookingModal || confirmConfig.isOpen;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className={`cbk-page ${isAnyModalOpen ? 'cbk-modal-open bkm-modal-open' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`cbk-main ${isSidebarCollapsed ? 'expanded' : ''} ${showBulkBar ? 'has-bulk-bar' : ''}`}>
        <div className="cbk-container">

          {/* ── Header ── */}
          <div className="cbk-header">
            <div className="cbk-title">
              <h1>{serviceInfo.title}</h1>
              <p>{serviceInfo.subtitle}</p>
            </div>
            <button className="cbk-btn-add" onClick={() => setShowBookingChoiceModal(true)}>
              <span style={{ fontSize: 18 }}>+</span> NEW BOOKING
            </button>
          </div>

          {/* MOBILE ONLY: Floating "New Booking" button */}
          <button
            type="button"
            className="cbk-fab-add"
            onClick={() => setShowBookingChoiceModal(true)}
            aria-label="New booking"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>

          {/* ── Stats ── */}
          <CustomBookingStats stats={stats} />

          {/* ── Filters ── */}
          <BookingFilters
            searchTerm={searchTerm}        setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}    setFilterStatus={setFilterStatus}
            statusOptions={statusOptions}
            paymentFilter={paymentFilter}  setPaymentFilter={setPaymentFilter}
            paymentOptions={paymentOptions}
            typeFilter={typeFilter}        setTypeFilter={setTypeFilter}
            typeOptions={typeOptions}
            createdByFilter={createdByFilter} setCreatedByFilter={setCreatedByFilter}
          />

          {/* ── Table ── */}
          <div className="cbk-table-container bkm-desktop-table">
            <table className="cbk-table">
              <thead>
                <tr>
                  <th style={{ width: 48, textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      style={{ accentColor: '#f59e0b', cursor: 'pointer' }}
                      checked={currentBookings.length > 0 && selectedBookings.length === currentBookings.length}
                      onChange={selectAll}
                    />
                  </th>
                  <th style={{ width: 48 }}>No.</th>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Package</th>
                  <th>Travel Date</th>
                  <th>Guests</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <CustomBookingTable
                loading={loading}
                filteredBookingsCount={filteredBookings.length}
                currentBookings={currentBookings}
                handleViewDetails={handleViewDetails}
                handleArchive={handleArchive}
                actionLoading={actionLoading}
                selectedBookings={selectedBookings}
                onToggleSelect={toggleSelect}
                onSelectAll={selectAll}
                startIndex={startIndex}
              />
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <BookingCards
            loading={loading}
            filteredBookingsCount={filteredBookings.length}
            currentBookings={currentBookings}
            handleViewDetails={handleViewDetails}
            handleArchive={handleArchive}
            actionLoading={actionLoading}
            selectedBookings={selectedBookings}
            onToggleSelect={toggleSelect}
            MailIcon={Mail}
            UsersIcon={Users}
            ArchiveIcon={Archive}
            RotateCcwIcon={RotateCcw}
            WalletIcon={Wallet}
            CalendarIcon={Calendar}
          />

          {/* ── Pagination ── */}
          {filteredBookings.length > 0 && (
            <PaginationControls
              totalItems={filteredBookings.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={(p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); }}
              onItemsPerPageChange={handleItemsPerPageChange}
              ChevronLeftIcon={ChevronLeft}
              ChevronRightIcon={ChevronRight}
            />
          )}

        </div>
      </main>

      {showBulkBar && (
        <div className={`cbk-bulk-bar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${bulkBarClosing ? 'bulk-action-bar-closing' : ''}`}>
          <div className="cbk-bulk-bar-info">
            <span className="cbk-bulk-bar-count">
              <span className="bulk-btn-label-full">{selectedBookings.length} SELECTED</span>
              <span className="bulk-btn-label-short">{selectedBookings.length}</span>
            </span>
          </div>

          <div className="cbk-bulk-bar-buttons">
            <button
              className="cbk-bulk-archive-btn"
              onClick={handleBulkArchive}
              disabled={actionLoading}
            >
              <Archive size={15} />
              <span className="bulk-btn-label-full">Archive Selected</span>
              <span className="bulk-btn-label-short">Archive</span>
            </button>

            <button
              className="cbk-bulk-clear-btn"
              onClick={() => setSelectedBookings([])}
              disabled={actionLoading}
            >
              <X size={15} />
              <span className="bulk-btn-label-full">Clear Selection</span>
              <span className="bulk-btn-label-short">Clear</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      <CustomBookingDetailModal
        showModal={showDetailModal}
        selectedBooking={selectedBooking}
        setShowModal={setShowDetailModal}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
        handleArchive={handleArchive}
        handleEdit={handleEdit}
        actionLoading={actionLoading}
      />

      {/* ── Confirm Dialog ── */}
      <CustomConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(p => ({ ...p, isOpen: false }))}
      />

      {/* ── Booking Type Choice Modal ─────────────────────────── */}
      <BookingChoiceModal
        isOpen={showBookingChoiceModal}
        onClose={() => setShowBookingChoiceModal(false)}
        onSelect={(mode) => {
          setNewBookingMode(mode);
          setShowBookingChoiceModal(false);
          setShowNewBookingModal(true);
        }}
      />

      {/* ── New Booking Form (CustomBookingForm — same folder: customizedBookingAdmin) ── */}
      <CustomBookingForm
        isOpen={showNewBookingModal}
        onClose={() => setShowNewBookingModal(false)}
        bookingMode={newBookingMode}
        onSuccess={() => {
          setShowNewBookingModal(false);
          fetchBookings();
        }}
      />
    </div>
  );
};

export default CustomBooking;