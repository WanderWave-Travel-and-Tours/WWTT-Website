import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Users, Eye, CheckCircle, AlertCircle, Mail,
  ChevronLeft, ChevronRight, FileText, CreditCard,
  Wallet, Map, Plane, Archive, RotateCcw, X, Plus
} from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import BookingStats from '../booking/BookingStats';
import BookingFilters from '../booking/BookingFilters';
import PaginationControls from '../booking/PaginationControls';
import BookingCards from '../booking/BookingCards';
import TourBookingDetailModal from './TourBookingDetailModal';
import NewTourBookingModal from './NewTourBookingModal/NewTourBookingModal';
import BookingChoiceModal from '../booking/BookingChoiceModal';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';

// Reuse the same base CSS as booking (bkm- classes) + tour additions
import '../booking/booking.css';
import '../booking/BookingTable.css';
import '../booking/BookingCards.css';
import './tourBooking.css';

const BASE_URL = 'https://wanderwaveph.onrender.com';

const STAT_IMAGES = {
  TOTAL:    'https://picsum.photos/seed/tourbeach/800/600',
  PENDING:  'https://picsum.photos/seed/tourmtn/800/600',
  CONFIRM:  'https://picsum.photos/seed/tourcity/800/600',
  REVENUE:  'https://picsum.photos/seed/tourforest/800/600',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const getStatusBadgeClass = (s) => {
  switch ((s || '').toLowerCase()) {
    case 'confirmed': return 'badge-confirmed';
    case 'pending':   return 'badge-pending';
    case 'cancelled': return 'badge-cancelled';
    case 'completed': return 'badge-confirmed';
    default:          return 'badge-pending';
  }
};

const getPaymentBadge = (booking) => {
  const { paymentType, status, totalAmount = 0, remainingBalance = 0 } = booking;
  if (paymentType === 'full') {
    return status === 'confirmed' || status === 'completed'
      ? { text: 'Paid in Full', cls: 'payment-badge-full' }
      : { text: 'Pending',     cls: 'payment-badge-pending', title: 'Pending Payment' };
  }
  // partial
  const initialPaid = totalAmount - remainingBalance;
  if (remainingBalance <= 0 && initialPaid > 0)
    return { text: 'Fully Paid', cls: 'payment-badge-full' };
  if (initialPaid > 0 && remainingBalance > 0)
    return { text: 'Partial', cls: 'payment-badge-partial', title: `₱${remainingBalance.toLocaleString()} balance due` };
  return { text: 'Pending', cls: 'payment-badge-pending', title: 'Pending Payment' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const TourBookingDashboard = () => {
  const toast = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [bookings,      setBookings]     = useState([]);
  const [loading,       setLoading]      = useState(true);
  const [actionLoading, setActionLoading]= useState(false);
  const [showModal,     setShowModal]    = useState(false);
  const [selected,      setSelected]     = useState(null);

  // Filters
  const [searchTerm,    setSearchTerm]   = useState('');
  const [filterStatus,  setFilterStatus] = useState('ALL');
  const [paymentFilter, setPaymentFilter]= useState('ALL');
  const [typeFilter,    setTypeFilter]   = useState('ALL');
  const [createdByFilter, setCreatedByFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  // Confirm modal
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const [showBookingChoiceModal, setShowBookingChoiceModal] = useState(false);
  const [newBookingMode, setNewBookingMode] = useState('assist'); // 'walkin' | 'assist'

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary'
  });

  // Bulk selection
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [bulkBarClosing, setBulkBarClosing] = useState(false);

  const toggleSidebar = () => setIsSidebarCollapsed(p => !p);

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

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${BASE_URL}/api/tour-bookings?limit=200`);
      if (!res.ok) throw new Error('Failed to fetch tour bookings');
      const json = await res.json();

      const raw = json.data || json.bookings || [];
      const total = json.total || raw.length;

      // ── Only display bookings where isArchive !== 'Yes' ──
      const activeRaw = raw.filter(b => b.isArchive !== 'Yes');

      const formatted = activeRaw.map((b, i) => ({
        id:              `TB${String(total - i).padStart(4, '0')}`,
        mongoId:         b._id,
        customerName:    b.fullName || 'N/A',
        email:           b.email    || 'N/A',
        packageName:     b.packageName || 'Unknown Tour',
        destination:     b.rawDestination || '',
        travelDate:      b.startDate  || 'Not specified',
        endDate:         b.endDate,
        duration:        b.duration,
        guests:          b.pax?.adult || 1,
        totalAmount:     b.totalAmount || 0,
        status:          b.status || 'pending',
        paymentType:     b.paymentType || 'full',
        initialPaymentAmount: b.initialPaymentAmount || 0,
        remainingBalance:     b.remainingBalance || 0,
        discountAmount:  b.discountAmount || 0,
        promoCode:       b.promoCode || null,
        airfareTotal:    b.airfareTotal || 0,
        bookingDate:     new Date(b.createdAt).toLocaleDateString('en-CA'),
        rawData:         b,
      }));

      setBookings(formatted);
    } catch (err) {
      console.error('Tour bookings fetch error:', err);
      toast.error('Failed to load tour bookings. Check if the server is running.', 'Load Failed', 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // ── Filtering ────────────────────────────────────────────────────────────
  const filteredBookings = useMemo(() => {
    let list = [...bookings];

    if (filterStatus !== 'ALL') {
      list = list.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase());
    }

    if (paymentFilter === 'PENDING_BALANCE') {
      list = list.filter(b => b.paymentType === 'partial' && b.remainingBalance > 0);
    } else if (paymentFilter === 'FULLY_PAID') {
      list = list.filter(b => {
        if (b.paymentType === 'full') return b.status === 'confirmed' || b.status === 'completed';
        return b.remainingBalance <= 0 && (b.totalAmount - b.remainingBalance) > 0;
      });
    } else if (paymentFilter === 'PARTIAL_ONLY') {
      list = list.filter(b => b.paymentType === 'partial');
    }

    if (typeFilter === 'PRIVATE') {
      list = list.filter(b => (b.rawData?.tourType || '').toLowerCase() === 'private');
    } else if (typeFilter === 'JOINERS') {
      list = list.filter(b => (b.rawData?.tourType || '').toLowerCase() === 'joiners');
    } else if (typeFilter === 'WITH_AIRFARE') {
      list = list.filter(b => b.rawData?.includesAirfare);
    }

    if (createdByFilter !== 'ALL') {
      list = list.filter(b => {
        const type   = (b.rawData?.createdByType  || '').toLowerCase();
        const source = (b.rawData?.bookingSource  || '').toLowerCase();
        if (createdByFilter === 'sales')  return type === 'sales';
        if (createdByFilter === 'user')   return type === 'user' || source === 'online';
        if (createdByFilter === 'admin')  return type === 'admin';
        if (createdByFilter === 'walkin') return source === 'walkin';
        if (createdByFilter === 'manual') return type === 'manual' || source === 'manual';
        return true;
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(b =>
        b.customerName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.packageName.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [bookings, filterStatus, paymentFilter, typeFilter, createdByFilter, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [filteredBookings]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const revenue   = confirmed.reduce((s, b) => s + b.totalAmount, 0);
    const pendingBal = bookings.filter(b => b.paymentType === 'partial' && b.remainingBalance > 0);
    const totalBal   = pendingBal.reduce((s, b) => s + b.remainingBalance, 0);

    return [
      { label: 'Total Tour Bookings',   value: bookings.length,                                    icon: <FileText size={24} />,   image: STAT_IMAGES.TOTAL   },
      { label: 'Pending Balance',       value: pendingBal.length,                                  icon: <Wallet   size={24} />,   image: STAT_IMAGES.PENDING, subtext: `₱${totalBal.toLocaleString()} total` },
      { label: 'Confirmed',             value: confirmed.length,                                    icon: <CheckCircle size={24} />,image: STAT_IMAGES.CONFIRM  },
      { label: 'Revenue (Confirmed)',   value: `₱${revenue.toLocaleString()}`,                     icon: <CreditCard  size={24} />,image: STAT_IMAGES.REVENUE  },
    ];
  }, [bookings]);

  // ── Action helpers ────────────────────────────────────────────────────────
  const askConfirmation = (title, message, onConfirm, type = 'primary') => {
    setConfirmConfig({
      isOpen: true, title, message, type,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        await onConfirm();
      },
    });
  };

  const updateStatus = async (booking, status) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/tour-bookings/${booking.mongoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Server returned ${res.status}`);
      await fetchBookings();
      toast.success(
        `Tour booking ${booking.id} for ${booking.customerName} ${status}!`,
        `Booking ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        4000
      );
    } catch (err) {
      toast.error(err.message || 'Action failed', 'Error', 5000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirm = (booking) =>
    askConfirmation(
      'Confirm Tour Booking',
      `Confirm booking ${booking.id} for ${booking.customerName}?`,
      () => updateStatus(booking, 'confirmed'),
      'primary'
    );

  const handleCancel = (booking) =>
    askConfirmation(
      'Cancel Tour Booking',
      `Cancel booking ${booking.id} for ${booking.customerName}? This cannot be undone.`,
      () => updateStatus(booking, 'cancelled'),
      'danger'
    );

  const handleViewDetails = (booking) => { setSelected(booking); setShowModal(true); };

  // ── Archive handler ───────────────────────────────────────────────────────
  const handleArchive = (booking) => {
    askConfirmation(
      'Archive Tour Booking',
      `Archive booking ${booking.id} for ${booking.customerName}? It will be moved to the Archive section.`,
      async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`${BASE_URL}/api/tour-bookings/archive/${booking.mongoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.message || `Server returned ${res.status}`);
          await fetchBookings();
          toast.success(
            `Tour booking ${booking.id} for ${booking.customerName} has been archived.`,
            'Booking Archived',
            4000
          );
        } catch (err) {
          toast.error(err.message || 'Archive failed', 'Error', 5000);
        } finally {
          setActionLoading(false);
        }
      },
      'danger'
    );
  };

  // ── Bulk selection ────────────────────────────────────────────────────────
  const toggleSelect = (booking) => {
    setSelectedBookings(prev =>
      prev.some(b => b.mongoId === booking.mongoId)
        ? prev.filter(b => b.mongoId !== booking.mongoId)
        : [...prev, booking]
    );
  };

  const selectAll = () => {
    setSelectedBookings(prev =>
      prev.length === currentBookings.length ? [] : [...currentBookings]
    );
  };

  const clearSelection = () => setSelectedBookings([]);

  const handleBulkArchiveClick = () => {
    if (selectedBookings.length === 0) return;
    const count = selectedBookings.length;

    askConfirmation(
      'Archive Selected Bookings',
      `Are you sure you want to archive ${count} booking${count > 1 ? 's' : ''}? This action cannot be undone.`,
      async () => {
        setActionLoading(true);
        try {
          await Promise.all(
            selectedBookings.map(async (booking) => {
              const res = await fetch(`${BASE_URL}/api/tour-bookings/archive/${booking.mongoId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
              });
              if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Failed to archive booking ${booking.id}`);
              }
            })
          );
          await fetchBookings();
          clearSelection();
          toast.success(
            `${count} booking${count > 1 ? 's' : ''} archived successfully.`,
            'Bulk Archive Completed',
            4000
          );
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

  // ── Filters config ────────────────────────────────────────────────────────
  const statusOptions = useMemo(() => {
    const opts = ['ALL'];
    const unique = new Set(bookings.map(b => b.status));
    ['pending', 'confirmed', 'cancelled', 'completed'].forEach(s => unique.has(s) && opts.push(s));
    return opts;
  }, [bookings]);

  const paymentOptions = [
    { value: 'ALL',             label: 'All Payments'     },
    { value: 'PENDING_BALANCE', label: 'Pending Balance'  },
    { value: 'FULLY_PAID',      label: 'Fully Paid'       },
    { value: 'PARTIAL_ONLY',    label: 'Partial Payment'  },
  ];

  const typeOptions = [
    { value: 'ALL',          label: 'All Types'     },
    { value: 'PRIVATE',      label: 'Private Tour'  },
    { value: 'JOINERS',      label: 'Joiners Tour'  },
    { value: 'WITH_AIRFARE', label: 'With Airfare'  },
  ];

  const createdByOptions = [
    { value: 'ALL',    label: 'All Sources' },
    { value: 'sales',  label: 'Sales'       },
    { value: 'user',   label: 'User'        },
    { value: 'admin',  label: 'Admin'       },
    { value: 'walkin', label: 'Walk-in'     },
    { value: 'manual', label: 'Manual'      },
  ];

  // ── Pagination ─────────────────────────────────────────────────────────────
  const totalPages      = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex      = (currentPage - 1) * itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const isAnyModalOpen = showModal || showBookingChoiceModal || showNewBookingModal || confirmConfig.isOpen;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`bkm-page ${isAnyModalOpen ? 'bkm-modal-open' : ''}`}>
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`bkm-main ${isSidebarCollapsed ? 'expanded' : ''} ${showBulkBar ? 'has-bulk-bar' : ''}`}>
        <div className="bkm-container">

          {/* ── Header ───────────────────────────────────────────── */}
          <div className="bkm-header">
            <div className="bkm-title">
              <h1>Tour Booking Management</h1>
              <p>View and manage all tour package bookings</p>
            </div>
            <button
              className="bkm-btn-add"
              onClick={() => setShowBookingChoiceModal(true)}
            >
              + New Booking
            </button>
          </div>

          {/* MOBILE ONLY: Floating "New Booking" button */}
          <button
            type="button"
            className="bkm-fab-add"
            onClick={() => setShowBookingChoiceModal(true)}
            aria-label="New booking"
          >
            <Plus size={22} strokeWidth={2.5} />
          </button>

          {/* ── Stats ────────────────────────────────────────────── */}
          <BookingStats stats={stats} />

          {/* ── Filters ──────────────────────────────────────────── */}
          <BookingFilters
            searchTerm={searchTerm}         setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}     setFilterStatus={setFilterStatus}
            statusOptions={statusOptions}
            paymentFilter={paymentFilter}   setPaymentFilter={setPaymentFilter}
            paymentOptions={paymentOptions}
            createdByFilter={createdByFilter} setCreatedByFilter={setCreatedByFilter}
          />

          {/* ── Table ────────────────────────────────────────────── */}
          <div className="bkm-table-container bkm-desktop-table">
            <table className="bkm-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={currentBookings.length > 0 && selectedBookings.length === currentBookings.length}
                      onChange={selectAll}
                    />
                  </th>
                  <th style={{ width: '36px' }}>No.</th>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Tour Package</th>
                  <th>Travel Date</th>
                  <th style={{ textAlign: 'center' }}>Guests</th>
                  <th>Amount</th>
                  <th style={{ textAlign: 'center' }}>Payment</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                  <th style={{ textAlign: 'center' }}>Created By</th>
                  <th className="bkm-actions-header"></th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                      Loading tour bookings...
                    </td>
                  </tr>
                ) : currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                      No tour bookings found
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((booking, i) => {
                    const raw        = booking.rawData || {};
                    const tourType   = (raw.tourType || '').toLowerCase();
                    const payBadge   = getPaymentBadge(booking);
                    const hasAirfare = raw.includesAirfare;
                    const isSelected = selectedBookings.some(b => b.mongoId === booking.mongoId);

                    return (
                      <tr key={booking.mongoId || booking.id} className={isSelected ? 'selected-row' : ''}>
                        {/* Checkbox */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(booking)}
                          />
                        </td>

                        {/* No. */}
                        <td style={{ fontWeight: 700, color: '#0f172a', textAlign: 'center' }}>
                          {startIndex + i + 1}
                        </td>

                        {/* Booking ID */}
                        <td style={{ fontWeight: 700 }}>
                          {booking.id}
                          <div className="booking-date-small">Booked: {booking.bookingDate}</div>
                        </td>

                        {/* Customer */}
                        <td>
                          <div className="customer-name">{booking.customerName}</div>
                          <div className="customer-contact">
                            <Mail size={13} />
                            <span>{booking.email}</span>
                          </div>
                        </td>

                        {/* Tour Package */}
                        <td>
                          <div className="tbk-package-cell">
                            <div className="package-name-cell">
                              <div className="package-initials-badge" style={{ background: '#e0f2fe', color: '#0284c7' }}>TB</div>
                              <span className="tbk-package-name">{booking.packageName}</span>
                            </div>
                            <div className="tbk-package-meta">
                              {tourType && (
                                <span className={`tbk-type-badge tbk-type-${tourType}`}>
                                  {tourType === 'private' ? '🔒' : '👥'} {tourType}
                                </span>
                              )}
                              {booking.duration && (
                                <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                                  {booking.duration}
                                </span>
                              )}
                              {hasAirfare && (
                                <span className="tbk-airfare-chip">
                                  <Plane size={10} /> Airfare
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Travel Date */}
                        <td>
                          {booking.travelDate}
                          {booking.endDate && (
                            <div className="booking-date-small">
                              End: {booking.endDate}
                            </div>
                          )}
                        </td>

                        {/* Guests */}
                        <td style={{ textAlign: 'center' }}>
                          <div className="guests-cell">
                            <Users size={15} />
                            {booking.guests}
                          </div>
                        </td>

                        {/* Amount */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {booking.paymentType === 'partial' ? (
                              <>
                                <strong style={{ color: '#059669' }}>
                                  ₱{(booking.totalAmount - booking.remainingBalance).toLocaleString()}
                                </strong>
                                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                  of ₱{booking.totalAmount.toLocaleString()}
                                </span>
                              </>
                            ) : (
                              <strong>₱{booking.totalAmount.toLocaleString()}</strong>
                            )}
                          </div>
                        </td>

                        {/* Payment Status */}
                        <td style={{ textAlign: 'center' }}>
                          <div className={`payment-status-badge ${payBadge.cls}`} title={payBadge.title}>
                            <Wallet size={13} />
                            <span>{payBadge.text}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`bkm-badge ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status || 'pending'}
                          </span>
                        </td>

                        {/* Created By */}
                        <td style={{ textAlign: 'center' }}>
                          <span className={`bkm-badge ${raw.isWalkin ? 'badge-walkin' : raw.createdByType === 'sales' ? 'badge-sales' : 'badge-user'}`}>
                            {raw.isWalkin ? 'Walk-in Application' : raw.createdByType === 'sales' ? 'Sales' : 'User'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="bkm-actions-cell" style={{ textAlign: 'right' }}>
                          <div className="bkm-action-group">
                            <button
                              className="bkm-action-btn bkm-view-btn"
                              onClick={() => handleViewDetails(booking)}
                              title="View Details"
                            >
                              <Eye size={16} /> View
                            </button>
                            <button
                              className="bkm-action-btn bkm-archive-icon-btn"
                              onClick={() => handleArchive(booking)}
                              disabled={actionLoading}
                              title="Archive booking"
                            >
                              <Archive size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ─────────────────────────────────────── */}
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

          {/* ── Pagination ───────────────────────────────────────── */}
          {filteredBookings.length > 0 && (
            <PaginationControls
              totalItems={filteredBookings.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={p => setCurrentPage(p)}
              onItemsPerPageChange={handleItemsPerPageChange}
              ChevronLeftIcon={ChevronLeft}
              ChevronRightIcon={ChevronRight}
            />
          )}

        </div>
      </main>

      {showBulkBar && (
        <div className={`bulk-action-bar ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${bulkBarClosing ? 'bulk-action-bar-closing' : ''}`}>
          <div className="bulk-action-info">
            <span className="bulk-action-count">
              <span className="bulk-btn-label-full">{selectedBookings.length} SELECTED</span>
              <span className="bulk-btn-label-short">{selectedBookings.length}</span>
            </span>
          </div>

          <div className="bulk-action-buttons">
            <button
              className="bulk-action-btn bulk-action-btn-archive"
              onClick={handleBulkArchiveClick}
              disabled={actionLoading}
            >
              <Archive size={15} />
              <span className="bulk-btn-label-full">Archive Selected</span>
              <span className="bulk-btn-label-short">Archive</span>
            </button>

            <button
              className="bulk-action-btn bulk-action-btn-clear"
              onClick={clearSelection}
              disabled={actionLoading}
            >
              <X size={15} />
              <span className="bulk-btn-label-full">Clear Selection</span>
              <span className="bulk-btn-label-short">Clear</span>
            </button>
          </div>
        </div>
      )}

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

      {/* ── New Tour Booking Modal ───────────────────────────── */}
      <NewTourBookingModal
        isOpen={showNewBookingModal}
        onClose={() => setShowNewBookingModal(false)}
        bookingMode={newBookingMode}
      />

      {/* ── Detail Modal ─────────────────────────────────────────── */}
      <TourBookingDetailModal
        showModal={showModal}
        selectedBooking={selected}
        setShowModal={setShowModal}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
        handleArchive={handleArchive}
        actionLoading={actionLoading}
      />

      {/* ── Confirm Dialog ───────────────────────────────────────── */}
      <CustomConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default TourBookingDashboard;