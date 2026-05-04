import React, { useState } from 'react';
import {
  X, CheckCircle, AlertCircle, XCircle,
  User, Mail, Calendar, Users, MapPin, Clock,
  CreditCard, Wallet, Car, PhoneCall, Navigation,
  FileText, Check, Tag, Truck, ArrowLeftRight
} from 'lucide-react';
import './TransferBookingDetailModal.css';

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

  return (
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
                {/* Use _id (MongoDB ObjectId) or id as fallback */}
                <span className="trd-booking-id">{b._id || b.id}</span>
                <span className="trd-dot">•</span>
                {/* createdAt from model timestamps */}
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
              {/* model: fullName */}
              <InfoRow label="Full Name"   value={b.fullName}       icon={User}      />
              {/* model: email */}
              <InfoRow label="Email"       value={b.email}          icon={Mail}      />
              {/* model: phone */}
              <InfoRow label="Phone"       value={b.phone}          icon={PhoneCall} />
              {/* model: passengerCount */}
              <InfoRow label="Passengers"  value={b.passengerCount} icon={Users}     />
              {/* model: pax */}
              {b.pax && (
                <InfoRow label="Pax"       value={b.pax}            icon={Users}     />
              )}
            </div>
          </div>

          {/* Transfer Details */}
          <div className="trd-section">
            <h3 className="trd-section-title">
              <Navigation size={16} /> Transfer Details
            </h3>
            <div className="trd-info-grid">
              {/* model: activityName */}
              <InfoRow label="Activity"         value={b.activityName}                                            icon={FileText}       />
              {/* model: bookingType */}
              {b.bookingType && (
                <InfoRow label="Booking Type"   value={b.bookingType}                                             icon={FileText}       />
              )}
              {/* model: transferType (oneway / roundtrip) */}
              <InfoRow label="Transfer Type"    value={b.transferType === 'roundtrip' ? 'Round Trip' : 'One Way'} icon={ArrowLeftRight} />
              {/* model: destination */}
              {b.destination && (
                <InfoRow label="Destination"    value={b.destination}                                             icon={MapPin}         />
              )}
              {/* model: category */}
              {b.category && (
                <InfoRow label="Category"       value={b.category}                                                icon={FileText}       />
              )}
              {/* model: supplierName */}
              {b.supplierName && (
                <InfoRow label="Supplier"       value={b.supplierName}                                            icon={Truck}          />
              )}
              {/* model: pickupLocation */}
              <InfoRow label="Pickup Location"  value={b.pickupLocation}                                          icon={Navigation}     />
              {/* model: dropoffLocation — only roundtrip has this */}
              {isRoundtrip && (
                <InfoRow label="Dropoff Location" value={b.dropoffLocation}                                       icon={MapPin}         />
              )}
              {/* model: travelDate */}
              <InfoRow label="Travel Date"      value={formatDate(b.travelDate)}                                  icon={Calendar}       />
              {/* model: returnDate — only roundtrip */}
              {isRoundtrip && (
                <InfoRow label="Return Date"    value={formatDate(b.returnDate)}                                  icon={Calendar}       />
              )}
              {/* model: arrivalTime */}
              <InfoRow label="Arrival Time"     value={b.arrivalTime || 'Not specified'}                          icon={Clock}          />
              {/* model: departureTime — only roundtrip */}
              {isRoundtrip && (
                <InfoRow label="Departure Time" value={b.departureTime || 'Not specified'}                        icon={Clock}          />
              )}
            </div>

            {/* Route visual */}
            <div className="trd-route-visual">
              <div className="trd-route-from">
                <div className="trd-route-dot trd-dot-pickup" />
                <div>
                  <div className="trd-route-label">FROM</div>
                  <div className="trd-route-place">{b.pickupLocation || 'N/A'}</div>
                </div>
              </div>
              <div className="trd-route-line">
                <div className="trd-route-car">
                  <Car size={16} style={{ color: '#0284c7' }} />
                </div>
              </div>
              <div className="trd-route-to">
                <div className="trd-route-dot trd-dot-dropoff" />
                <div>
                  <div className="trd-route-label">TO</div>
                  {/* One-way has no dropoff — show destination or N/A */}
                  <div className="trd-route-place">
                    {isRoundtrip ? (b.dropoffLocation || 'N/A') : (b.destination || 'Destination')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes — model: specialRequests, message */}
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
              {/* model: paymentStatus */}
              <div className="trd-payment-row">
                <span>Payment Status</span>
                <span style={{ fontWeight: 600, color: paymentStatusConfig.color }}>
                  {paymentStatusConfig.label}
                </span>
              </div>
              {/* model: currency */}
              <div className="trd-payment-row">
                <span>Currency</span>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{b.currency || 'PHP'}</span>
              </div>
              {/* model: oneWayPrice */}
              {b.oneWayPrice > 0 && (
                <div className="trd-payment-row">
                  <span>One Way Price</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{currencySymbol}{b.oneWayPrice.toLocaleString()}</span>
                </div>
              )}
              {/* model: roundtripPrice */}
              {b.roundtripPrice > 0 && (
                <div className="trd-payment-row">
                  <span>Roundtrip Price</span>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{currencySymbol}{b.roundtripPrice.toLocaleString()}</span>
                </div>
              )}
              {/* model: sellingPrice — base price for chosen trip type */}
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
                    {/* model: initialPaymentAmount */}
                    <span className="trd-paid-amount">{currencySymbol}{initialPaid.toLocaleString()}</span>
                  </div>
                  <div className="trd-payment-row">
                    <span>Remaining Balance</span>
                    {/* model: remainingBalance */}
                    <span className={remainingBalance > 0 ? 'trd-balance-due' : 'trd-balance-clear'}>
                      {currencySymbol}{remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="trd-payment-row trd-payment-total">
                <span>Total Amount</span>
                {/* model: totalAmount */}
                <span>{currencySymbol}{totalAmount.toLocaleString()}</span>
              </div>
              {/* model: promoCode */}
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
  );
};

export default TransferBookingDetailModal;