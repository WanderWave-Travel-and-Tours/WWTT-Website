import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, CheckCircle, AlertCircle, XCircle,
  User, Mail, Calendar, MapPin, Clock,
  CreditCard, Wallet, Car, PhoneCall, Navigation,
  FileText, Check, Tag, Truck, ArrowLeftRight,
  Receipt, Ticket, Pencil
} from 'lucide-react';
import './TransferBookingDetailModal.css';
import TransferOrderSlipModal from './TransferOrderSlipModal';
import TransferVoucherModal from './TransferVoucherModal';

const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const getStatusConfig = (status) => {
  const configs = {
    PENDING:   { color: 'amber', Icon: AlertCircle, label: 'Pending Review',  description: 'Awaiting confirmation' },
    CONFIRMED: { color: 'green', Icon: CheckCircle, label: 'Confirmed',        description: 'Booking is active'     },
    CANCELLED: { color: 'red',   Icon: XCircle,     label: 'Cancelled',        description: 'Booking was cancelled' },
    COMPLETED: { color: 'blue',  Icon: CheckCircle, label: 'Completed',        description: 'Transfer completed'    },
  };
  return configs[(status || 'PENDING').toUpperCase()] || configs.PENDING;
};

const TransferBookingDetailModal = ({
  showModal,
  selectedBooking,
  setShowModal,
  handleConfirm,
  handleCancel,
  actionLoading,
}) => {
  const navigate = useNavigate();
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [showVoucher,   setShowVoucher]   = useState(false);

  if (!showModal || !selectedBooking) return null;

  const b      = selectedBooking;
  const status = (b.status || 'pending').toUpperCase();
  const statusConfig = getStatusConfig(status);
  const StatusIcon   = statusConfig.Icon;

  // ── Derived payment values from model fields ─────────────────────────────
  const isPartialPayment = b.paymentType === 'partial';
  const totalAmount      = b.totalAmount || 0;
  const remainingBalance = b.remainingBalance || 0;
  const initialPaid      = b.initialPaymentAmount || (totalAmount - remainingBalance);
  const isFullyPaid      = remainingBalance <= 0 && initialPaid > 0;

  // ── Currency symbol from model: currency (default 'PHP') ─────────────────
  const currencySymbol = b.currency === 'PHP' ? '₱' : (b.currency || '₱');

  const canConfirm = status === 'PENDING';
  const canCancel  = status === 'PENDING' || status === 'CONFIRMED';

  // ── Roundtrip flag ───────────────────────────────────────────────────────
  const isRoundtrip = b.transferType === 'roundtrip';

  const colorMap = {
    amber: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', badge: '#f59e0b' },
    green: { bg: '#f0fdf4', border: '#86efac', text: '#14532d', badge: '#22c55e' },
    red:   { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', badge: '#ef4444' },
    blue:  { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a5f', badge: '#3b82f6' },
  };
  const colors = colorMap[statusConfig.color] || colorMap.amber;

  // ── Payment status badge config ───────────────────────────────────────────
  const paymentStatusMap = {
    pending:  { label: 'Pending',  color: '#f59e0b' },
    paid:     { label: 'Paid',     color: '#22c55e' },
    partial:  { label: 'Partial',  color: '#3b82f6' },
    failed:   { label: 'Failed',   color: '#ef4444' },
    refunded: { label: 'Refunded', color: '#8b5cf6' },
  };
  const paymentStatusConfig = paymentStatusMap[(b.paymentStatus || 'pending').toLowerCase()] || paymentStatusMap.pending;

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="trd-info-row">
      {Icon && <Icon size={14} className="trd-info-icon" />}
      <div className="trd-info-content">
        <span className="trd-info-label">{label}</span>
        <span className="trd-info-value">{value || 'N/A'}</span>
      </div>
    </div>
  );

  // ── The booking object passed to child modals ─────────────────────────────
  const modalBooking = {
    id:      b._id || b.id,
    rawData: b.rawData || b,
  };

  // ── Edit handler — close modal then navigate to edit page ─────────────────
  const handleEdit = () => {
    setShowModal(false);
    navigate(`/EditTransferBooking/${b._id || b.id}`);
  };

  return (
    <>
      <div className="trd-overlay" onClick={() => setShowModal(false)}>
        <div className="trd-modal" onClick={e => e.stopPropagation()}>

          {/* ── Header ─────────────────────────────────────────── */}
          <div className="trd-header" style={{ borderBottom: `3px solid ${colors.badge}` }}>
            <div className="trd-header-left">
              <div className="trd-header-icon" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
                <Car size={22} style={{ color: colors.badge }} />
              </div>
              <div>
                <h2 className="trd-title">Transfer Booking Details</h2>
                <p className="trd-subtitle">
                  <span className="trd-booking-id">{b._id || b.id}</span>
                  <span className="trd-dot">•</span>
                  Booked {formatDate(b.createdAt)}
                </p>
              </div>
            </div>
            <div className="trd-header-right">
              <div className="trd-status-pill" style={{ background: colors.bg, border: `1px solid ${colors.border}`, color: colors.text }}>
                <StatusIcon size={14} />
                <span>{statusConfig.label}</span>
              </div>
              <button className="trd-close-btn" onClick={() => setShowModal(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* ── Body ───────────────────────────────────────────── */}
          <div className="trd-body">

            {/* Customer Info */}
            <div className="trd-section">
              <h3 className="trd-section-title">
                <User size={16} /> Customer Information
              </h3>
              <div className="trd-info-grid">
                <InfoRow label="Full Name"   value={b.fullName}       icon={User}      />
                <InfoRow label="Email"       value={b.email}          icon={Mail}      />
                <InfoRow label="Phone"       value={b.phone}          icon={PhoneCall} />
              </div>
            </div>

            {/* Transfer Details */}
            <div className="trd-section">
              <h3 className="trd-section-title">
                <Navigation size={16} /> Transfer Details
              </h3>
              <div className="trd-info-grid">
                <InfoRow label="Activity"         value={b.activityName}                                            icon={FileText}       />
                {b.bookingType && (
                  <InfoRow label="Booking Type"   value={b.bookingType}                                             icon={FileText}       />
                )}
                <InfoRow label="Transfer Type"    value={b.transferType === 'roundtrip' ? 'Round Trip' : 'One Way'} icon={ArrowLeftRight} />
                {b.destination && (
                  <InfoRow label="Destination"    value={b.destination}                                             icon={MapPin}         />
                )}
                {b.category && (
                  <InfoRow label="Category"       value={b.category}                                                icon={FileText}       />
                )}
                {b.supplierName && (
                  <InfoRow label="Supplier"       value={b.supplierName}                                            icon={Truck}          />
                )}
                <InfoRow label="Pickup Location"  value={b.pickupLocation}                                          icon={Navigation}     />
                {isRoundtrip && (
                  <InfoRow label="Dropoff Location" value={b.dropoffLocation}                                       icon={MapPin}         />
                )}
                <InfoRow label="Travel Date"      value={formatDate(b.travelDate)}                                  icon={Calendar}       />
                {isRoundtrip && (
                  <InfoRow label="Return Date"    value={formatDate(b.returnDate)}                                  icon={Calendar}       />
                )}
                <InfoRow label="Arrival Time"     value={b.arrivalTime || 'Not specified'}                          icon={Clock}          />
                {isRoundtrip && (
                  <InfoRow label="Departure Time" value={b.departureTime || 'Not specified'}                        icon={Clock}          />
                )}
              </div>

              {/* Route visual */}
              <div className="trd-route-visual">
                <div className="trd-route-from">
                  <div className="trd-route-dot trd-dot-pickup" />
                  <div>
                    <div className="trd-route-label">Pickup</div>
                    <div className="trd-route-place" title={b.pickupLocation}>
                      {b.pickupLocation || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="trd-route-line">
                  <div className="trd-route-car">
                    <Car size={16} color="#475569" />
                  </div>
                </div>
                <div className="trd-route-to">
                  <div className="trd-route-dot trd-dot-dropoff" />
                  <div>
                    <div className="trd-route-label">
                      {isRoundtrip ? 'Dropoff' : 'Destination'}
                    </div>
                    <div className="trd-route-place" title={isRoundtrip ? b.dropoffLocation : b.destination}>
                      {isRoundtrip ? (b.dropoffLocation || 'N/A') : (b.destination || 'Destination')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {(b.specialRequests || b.message) && (
              <div className="trd-section">
                <h3 className="trd-section-title">
                  <FileText size={16} /> Additional Notes
                </h3>
                <div className="trd-info-grid">
                  {b.specialRequests && (
                    <InfoRow label="Special Requests" value={b.specialRequests} icon={FileText} />
                  )}
                  {b.message && (
                    <InfoRow label="Message"          value={b.message}         icon={FileText} />
                  )}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="trd-section">
              <h3 className="trd-section-title">
                <Wallet size={16} /> Payment Summary
              </h3>
              <div className="trd-payment-box">
                <div className="trd-payment-row">
                  <span>Payment Type</span>
                  <span className="trd-payment-type">{isPartialPayment ? 'Partial Payment' : 'Full Payment'}</span>
                </div>
                <div className="trd-payment-row">
                  <span>Payment Status</span>
                  <span style={{ fontWeight: 600, color: paymentStatusConfig.color }}>
                    {paymentStatusConfig.label}
                  </span>
                </div>
                <div className="trd-payment-row">
                  <span>Currency</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{b.currency || 'PHP'}</span>
                </div>
                {b.oneWayPrice > 0 && (
                  <div className="trd-payment-row">
                    <span>One Way Price</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{currencySymbol}{b.oneWayPrice.toLocaleString()}</span>
                  </div>
                )}
                {b.roundtripPrice > 0 && (
                  <div className="trd-payment-row">
                    <span>Roundtrip Price</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{currencySymbol}{b.roundtripPrice.toLocaleString()}</span>
                  </div>
                )}
                {b.sellingPrice > 0 && (
                  <div className="trd-payment-row">
                    <span>Selling Price</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{currencySymbol}{b.sellingPrice.toLocaleString()}</span>
                  </div>
                )}
                {isPartialPayment && (
                  <>
                    <div className="trd-payment-row">
                      <span>Amount Paid</span>
                      <span className="trd-paid-amount">{currencySymbol}{initialPaid.toLocaleString()}</span>
                    </div>
                    <div className="trd-payment-row">
                      <span>Remaining Balance</span>
                      <span className={remainingBalance > 0 ? 'trd-balance-due' : 'trd-balance-clear'}>
                        {currencySymbol}{remainingBalance.toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                <div className="trd-payment-row trd-payment-total">
                  <span>Total Amount</span>
                  <span>{currencySymbol}{totalAmount.toLocaleString()}</span>
                </div>
                {b.promoCode && (
                  <div className="trd-payment-row">
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Tag size={13} /> Promo Code
                    </span>
                    <span style={{ fontWeight: 600, color: '#7c3aed' }}>{b.promoCode}</span>
                  </div>
                )}
                <div className="trd-payment-status">
                  {isFullyPaid
                    ? <span className="trd-fully-paid"><Check size={14} /> Fully Paid</span>
                    : remainingBalance > 0
                      ? <span className="trd-balance-label">Balance Due: {currencySymbol}{remainingBalance.toLocaleString()}</span>
                      : <span className="trd-pending-payment">Pending Payment</span>
                  }
                </div>
              </div>
            </div>

          </div>

          {/* ── Footer Actions ──────────────────────────────────── */}
          <div className="trd-footer">
            <button
              className="trd-btn trd-btn-close"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>

            <div className="trd-footer-actions">

              {/* ── Edit button ── */}
              <button
                className="trd-btn trd-btn-edit"
                onClick={handleEdit}
                title="Edit this booking"
              >
                <Pencil size={15} /> Edit
              </button>

              {/* ── Document buttons ── */}
              <button
                className="trd-btn"
                style={{
                  background: '#fff7ed',
                  color: '#ea580c',
                  border: '1px solid #fed7aa',
                }}
                onClick={() => setShowOrderSlip(true)}
                title="View Order Slip"
              >
                <Receipt size={15} /> Order Slip
              </button>

              <button
                className="trd-btn"
                style={{
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                }}
                onClick={() => setShowVoucher(true)}
                title="View Travel Voucher"
              >
                <Ticket size={15} /> Voucher
              </button>

              {/* ── Booking action buttons ── */}
              {canCancel && (
                <button
                  className="trd-btn trd-btn-cancel"
                  onClick={() => { setShowModal(false); handleCancel(b); }}
                  disabled={actionLoading}
                >
                  <XCircle size={16} /> Cancel Booking
                </button>
              )}
              {canConfirm && (
                <button
                  className="trd-btn trd-btn-confirm"
                  onClick={() => { setShowModal(false); handleConfirm(b); }}
                  disabled={actionLoading}
                >
                  <CheckCircle size={16} /> Confirm Booking
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Child document modals ─────────────────────────── */}
      {showOrderSlip && (
        <TransferOrderSlipModal
          booking={modalBooking}
          onClose={() => setShowOrderSlip(false)}
        />
      )}

      {showVoucher && (
        <TransferVoucherModal
          booking={modalBooking}
          onClose={() => setShowVoucher(false)}
        />
      )}
    </>
  );
};

export default TransferBookingDetailModal;