import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar, Users, Eye, CheckCircle, AlertCircle, Mail,
  ChevronLeft, ChevronRight, FileText, CreditCard,
  Wallet, Archive, Car, MapPin, Clock, Navigation
} from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import BookingStats from '../booking/BookingStats';
import BookingFilters from '../booking/BookingFilters';
import PaginationControls from '../booking/PaginationControls';
import TransferBookingDetailModal from './TransferBookingDetailModal';
import NewTransferBookingModal from './NewTransferBookingModal';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';

import '../booking/booking.css';
import '../booking/BookingTable.css';
import './transferBooking.css';

const BASE_URL = 'https://wanderwaveph.onrender.com';

const STAT_IMAGES = {
  TOTAL:   'https://picsum.photos/seed/transfer1/800/600',
  PENDING: 'https://picsum.photos/seed/transfer2/800/600',
  CONFIRM: 'https://picsum.photos/seed/transfer3/800/600',
  REVENUE: 'https://picsum.photos/seed/transfer4/800/600',
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
      ? { text: 'Paid in Full',    cls: 'payment-badge-full'    }
      : { text: 'Pending Payment', cls: 'payment-badge-pending' };
  }
  const initialPaid = totalAmount - remainingBalance;
  if (remainingBalance <= 0 && initialPaid > 0)
    return { text: 'Fully Paid',                                         cls: 'payment-badge-full'    };
  if (initialPaid > 0 && remainingBalance > 0)
    return { text: `Partial (₱${remainingBalance.toLocaleString()} due)`, cls: 'payment-badge-partial' };
  return { text: 'Pending Payment', cls: 'payment-badge-pending' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const TransferBookingDashboard = () => {
  const toast = useToast();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [bookings,       setBookings]      = useState([]);
  const [loading,        setLoading]       = useState(true);
  const [actionLoading,  setActionLoading] = useState(false);
  const [showModal,      setShowModal]     = useState(false);
  const [selected,       setSelected]      = useState(null);
  const [showNewBooking, setShowNewBooking] = useState(false);

  // Filters
  const [searchTerm,    setSearchTerm]    = useState('');
  const [filterStatus,  setFilterStatus]  = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [typeFilter,    setTypeFilter]    = useState('ALL');
  const [createdByFilter, setCreatedByFilter] = useState('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Confirm modal
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, type: 'primary'
  });

  const toggleSidebar = () => setIsSidebarCollapsed(p => !p);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BASE_URL}/api/transfer-bookings?limit=200`);
      if (!res.ok) throw new Error('Failed to fetch transfer bookings');
      const json = await res.json();

      const raw = json.data || json.bookings || [];
      const total = json.total || raw.length;

      const activeRaw = raw.filter(b => b.isArchive !== 'Yes');

      const formatted = activeRaw.map((b, i) => ({
        id:               `TR${String(total - i).padStart(4, '0')}`,
        mongoId:          b._id,
        customerName:     b.fullName      || 'N/A',
        email:            b.email         || 'N/A',
        phone:            b.phone         || b.contactNumber || 'N/A',
        vehicleType:      b.vehicleType   || b.vehicle       || 'N/A',
        transferType:     b.transferType  || 'airport',   // airport | point-to-point | hotel
        pickupLocation:   b.pickupLocation  || b.pickup  || 'N/A',
        dropoffLocation:  b.dropoffLocation || b.dropoff || 'N/A',
        pickupDate:       b.pickupDate    || b.travelDate || 'Not specified',
        pickupTime:       b.pickupTime    || b.departureTime || '',
        passengers:       b.passengers   || b.pax?.adult || 1,
        totalAmount:      b.totalAmount   || 0,
        status:           b.status        || 'pending',
        paymentType:      b.paymentType   || 'full',
        remainingBalance: b.remainingBalance || 0,
        bookingDate:      new Date(b.createdAt).toLocaleDateString('en-CA'),
        rawData:          b,
      }));

      setBookings(formatted);
    } catch (err) {
      console.error('Transfer bookings fetch error:', err);
      toast.error('Failed to load transfer bookings. Check if the server is running.', 'Load Failed', 5000);
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

    if (typeFilter === 'AIRPORT') {
      list = list.filter(b => (b.transferType || '').toLowerCase().includes('airport'));
    } else if (typeFilter === 'POINT_TO_POINT') {
      list = list.filter(b => (b.transferType || '').toLowerCase().includes('point'));
    } else if (typeFilter === 'HOTEL') {
      list = list.filter(b => (b.transferType || '').toLowerCase().includes('hotel'));
    }

    if (createdByFilter !== 'ALL') {
      list = list.filter(b => {
        const type = (b.rawData?.createdByType || '').toLowerCase();
        if (createdByFilter === 'sales')  return type === 'sales';
        if (createdByFilter === 'admin')  return type === 'admin';
        if (createdByFilter === 'manual') return type === 'manual';
        if (createdByFilter === 'user')   return type !== 'sales' && type !== 'admin' && type !== 'manual';
        return true;
      });
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(b =>
        b.customerName.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.pickupLocation.toLowerCase().includes(q) ||
        b.dropoffLocation.toLowerCase().includes(q) ||
        b.vehicleType.toLowerCase().includes(q)
      );
    }

    return list;
  }, [bookings, filterStatus, paymentFilter, typeFilter, createdByFilter, searchTerm]);

  useEffect(() => { setCurrentPage(1); }, [filteredBookings]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const confirmed  = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
    const revenue    = confirmed.reduce((s, b) => s + b.totalAmount, 0);
    const pendingBal = bookings.filter(b => b.paymentType === 'partial' && b.remainingBalance > 0);
    const totalBal   = pendingBal.reduce((s, b) => s + b.remainingBalance, 0);

    return [
      { label: 'Total Transfers',       value: bookings.length,                  icon: <Car         size={24} />, image: STAT_IMAGES.TOTAL   },
      { label: 'Pending Balance',       value: pendingBal.length,                icon: <Wallet      size={24} />, image: STAT_IMAGES.PENDING, subtext: `₱${totalBal.toLocaleString()} total` },
      { label: 'Confirmed',             value: confirmed.length,                 icon: <CheckCircle size={24} />, image: STAT_IMAGES.CONFIRM  },
      { label: 'Revenue (Confirmed)',   value: `₱${revenue.toLocaleString()}`,   icon: <CreditCard  size={24} />, image: STAT_IMAGES.REVENUE  },
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
      const res = await fetch(`${BASE_URL}/api/transfer-bookings/${booking.mongoId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || `Server returned ${res.status}`);
      await fetchBookings();
      toast.success(
        `Transfer booking ${booking.id} for ${booking.customerName} ${status}!`,
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
      'Confirm Transfer Booking',
      `Confirm transfer booking ${booking.id} for ${booking.customerName}?`,
      () => updateStatus(booking, 'confirmed'),
      'primary'
    );

  const handleCancel = (booking) =>
    askConfirmation(
      'Cancel Transfer Booking',
      `Cancel transfer booking ${booking.id} for ${booking.customerName}? This cannot be undone.`,
      () => updateStatus(booking, 'cancelled'),
      'danger'
    );

  const handleViewDetails = (booking) => { setSelected(booking.rawData || booking); setShowModal(true); };

  const handleArchive = (booking) => {
    askConfirmation(
      'Archive Transfer Booking',
      `Archive booking ${booking.id} for ${booking.customerName}? It will be moved to the Archive section.`,
      async () => {
        setActionLoading(true);
        try {
          const res = await fetch(`${BASE_URL}/api/transfer-bookings/archive/${booking.mongoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.message || `Server returned ${res.status}`);
          await fetchBookings();
          toast.success(
            `Transfer booking ${booking.id} for ${booking.customerName} has been archived.`,
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

  // ── Filters config ────────────────────────────────────────────────────────
  const statusOptions = useMemo(() => {
    const opts = ['ALL'];
    const unique = new Set(bookings.map(b => b.status));
    ['pending', 'confirmed', 'cancelled', 'completed'].forEach(s => unique.has(s) && opts.push(s));
    return opts;
  }, [bookings]);

  const paymentOptions = [
    { value: 'ALL',             label: 'All Payments'    },
    { value: 'PENDING_BALANCE', label: 'Pending Balance' },
    { value: 'FULLY_PAID',      label: 'Fully Paid'      },
    { value: 'PARTIAL_ONLY',    label: 'Partial Payment' },
  ];

  const typeOptions = [
    { value: 'ALL',            label: 'All Types'       },
    { value: 'AIRPORT',        label: 'Airport Transfer'},
    { value: 'POINT_TO_POINT', label: 'Point to Point'  },
    { value: 'HOTEL',          label: 'Hotel Transfer'  },
  ];

  // ── Pagination ─────────────────────────────────────────────────────────────
  const startIndex      = (currentPage - 1) * itemsPerPage;
  const currentBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // ── Transfer type badge helper ─────────────────────────────────────────────
  const getTransferTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('airport'))  return { cls: 'trk-type-airport',  label: '✈ Airport'       };
    if (t.includes('point'))    return { cls: 'trk-type-p2p',      label: '📍 Point to Point' };
    if (t.includes('hotel'))    return { cls: 'trk-type-hotel',    label: '🏨 Hotel'          };
    return                             { cls: 'trk-type-default',  label: type || 'Transfer'  };
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bkm-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`bkm-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        <div className="bkm-container">

          {/* ── Header ───────────────────────────────────────────── */}
          <div className="bkm-header">
            <div className="bkm-title">
              <h1>Transfer Booking Management</h1>
              <p>View and manage all vehicle transfer bookings</p>
            </div>
            <button
              className="bkm-btn-add"
              onClick={() => setShowNewBooking(true)}
            >
              <Car size={16} /> + New Booking
            </button>
          </div>

          {/* ── Stats ────────────────────────────────────────────── */}
          <BookingStats stats={stats} />

          {/* ── Filters ──────────────────────────────────────────── */}
          <BookingFilters
            searchTerm={searchTerm}       setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}   setFilterStatus={setFilterStatus}
            statusOptions={statusOptions}
            paymentFilter={paymentFilter} setPaymentFilter={setPaymentFilter}
            paymentOptions={paymentOptions}
            typeFilter={typeFilter}       setTypeFilter={setTypeFilter}
            typeOptions={typeOptions}
            createdByFilter={createdByFilter} setCreatedByFilter={setCreatedByFilter}
          />

          {/* ── Table ────────────────────────────────────────────── */}
          <div className="bkm-table-container">
            <table className="bkm-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>No.</th>
                  <th>Booking ID</th>
                  <th>Customer</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Pickup Schedule</th>
                  <th>Pax</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                      Loading transfer bookings...
                    </td>
                  </tr>
                ) : currentBookings.length === 0 ? (
                  <tr>
                    <td colSpan="12" style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontSize: '16px' }}>
                      No transfer bookings found
                    </td>
                  </tr>
                ) : (
                  currentBookings.map((booking, i) => {
                    const payBadge      = getPaymentBadge(booking);
                    const typeBadge     = getTransferTypeBadge(booking.transferType);

                    return (
                      <tr key={booking.mongoId || booking.id}>
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

                        {/* Route */}
                        <td>
                          <div className="trk-route-inline" title={`${booking.pickupLocation} → ${booking.dropoffLocation}`}>
                            <span className={`trk-type-badge ${typeBadge.cls}`}>{typeBadge.label}</span>
                            <span className="trk-route-sep">—</span>
                            <Navigation size={11} className="trk-icon-pickup" />
                            <span className="trk-route-text">{booking.pickupLocation}</span>
                            <span className="trk-route-sep">→</span>
                            <MapPin size={11} className="trk-icon-dropoff" />
                            <span className="trk-route-text">{booking.dropoffLocation}</span>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td>
                          <div className="trk-vehicle-cell">
                            <Car size={14} style={{ color: '#0284c7', flexShrink: 0 }} />
                            <span className="trk-vehicle-name">{booking.vehicleType}</span>
                          </div>
                        </td>

                        {/* Pickup Schedule */}
                        <td>
                          {booking.pickupDate}
                          {booking.pickupTime && (
                            <div className="booking-date-small">
                              <Clock size={11} style={{ display: 'inline', marginRight: 3 }} />
                              {booking.pickupTime}
                            </div>
                          )}
                        </td>

                        {/* Passengers */}
                        <td>
                          <div className="guests-cell">
                            <Users size={15} />
                            {booking.passengers}
                          </div>
                        </td>

                        {/* Amount */}
                        <td>
                          {booking.paymentType === 'partial' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              <span className="tbk-amount-paid">
                                ₱{(booking.totalAmount - booking.remainingBalance).toLocaleString()}
                              </span>
                              <span className="tbk-amount-total">of ₱{booking.totalAmount.toLocaleString()}</span>
                              {booking.remainingBalance > 0 && (
                                <span className="tbk-balance-due">
                                  <Wallet size={10} /> ₱{booking.remainingBalance.toLocaleString()} due
                                </span>
                              )}
                            </div>
                          ) : (
                            <strong>₱{booking.totalAmount.toLocaleString()}</strong>
                          )}
                        </td>

                        {/* Payment Status */}
                        <td>
                          <div className={`payment-status-badge ${payBadge.cls}`}>
                            <Wallet size={13} />
                            <span>{payBadge.text}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td>
                          <span className={`bkm-badge ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status || 'pending'}
                          </span>
                        </td>

                        {/* Created By */}
                        <td>
                          <span className={`trk-created-by-badge trk-created-by-${(booking.rawData?.createdByType || 'user').toLowerCase()}`}>
                            {(booking.rawData?.createdByType || 'user').toUpperCase()}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div className="bkm-action-group">
                            <button
                              className="bkm-action-btn bkm-view-btn"
                              onClick={() => handleViewDetails(booking)}
                              title="View Details"
                            >
                              <Eye size={16} /> View
                            </button>
                            <button
                              className="bkm-action-btn bkm-archive-btn"
                              onClick={() => handleArchive(booking)}
                              disabled={actionLoading}
                              title="Archive Booking"
                            >
                              <Archive size={16} /> Archive
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

          {/* ── Pagination ───────────────────────────────────────── */}
          {filteredBookings.length > itemsPerPage && (
            <PaginationControls
              totalItems={filteredBookings.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={p => setCurrentPage(p)}
              ChevronLeftIcon={ChevronLeft}
              ChevronRightIcon={ChevronRight}
            />
          )}

        </div>
      </main>

      {/* ── New Transfer Booking Modal ───────────────────────── */}
      <NewTransferBookingModal
        isOpen={showNewBooking}
        onClose={() => setShowNewBooking(false)}
      />

      {/* ── Detail Modal ─────────────────────────────────────────── */}
      <TransferBookingDetailModal
        showModal={showModal}
        selectedBooking={selected}
        setShowModal={setShowModal}
        handleConfirm={handleConfirm}
        handleCancel={handleCancel}
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

export default TransferBookingDashboard;