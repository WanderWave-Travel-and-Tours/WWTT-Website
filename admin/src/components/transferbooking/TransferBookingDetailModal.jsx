import React, { useState } from 'react';
import {
  X, CheckCircle, AlertCircle, XCircle,
  User, Mail, Calendar, Users, MapPin, Clock,
  CreditCard, Wallet, Car, PhoneCall, Navigation,
  FileText, Check
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
  const raw    = b.rawData || {};
  const status = (b.status || 'pending').toUpperCase();
  const statusConfig = getStatusConfig(status);
  const StatusIcon   = statusConfig.Icon;

  const isPartialPayment = b.paymentType === 'partial';
  const totalAmount      = b.totalAmount || 0;
  const remainingBalance = b.remainingBalance || 0;
  const initialPaid      = totalAmount - remainingBalance;
  const isFullyPaid      = remainingBalance <= 0 && initialPaid > 0;

  const canConfirm = status === 'PENDING';
  const canCancel  = status === 'PENDING' || status === 'CONFIRMED';

  const colorMap = {
    amber: { bg: '#fffbeb', border: '#fcd34d', text: '#92400e', badge: '#f59e0b' },
    green: { bg: '#f0fdf4', border: '#86efac', text: '#14532d', badge: '#22c55e' },
    red:   { bg: '#fef2f2', border: '#fecaca', text: '#7f1d1d', badge: '#ef4444' },
    blue:  { bg: '#eff6ff', border: '#93c5fd', text: '#1e3a5f', badge: '#3b82f6' },
  };
  const colors = colorMap[statusConfig.color] || colorMap.amber;

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
                <span className="trd-booking-id">{b.id}</span>
                <span className="trd-dot">•</span>
                Booked {b.bookingDate}
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
              <InfoRow label="Full Name"   value={b.customerName}  icon={User}      />
              <InfoRow label="Email"       value={b.email}         icon={Mail}      />
              <InfoRow label="Phone"       value={b.phone}         icon={PhoneCall} />
              <InfoRow label="Passengers"  value={b.passengers}    icon={Users}     />
            </div>
          </div>

          {/* Transfer Details */}
          <div className="trd-section">
            <h3 className="trd-section-title">
              <Navigation size={16} /> Transfer Details
            </h3>
            <div className="trd-info-grid">
              <InfoRow label="Transfer Type"    value={b.transferType}                    icon={Car}        />
              <InfoRow label="Vehicle Type"     value={b.vehicleType}                     icon={Car}        />
              <InfoRow label="Pickup Location"  value={b.pickupLocation}                  icon={Navigation} />
              <InfoRow label="Dropoff Location" value={b.dropoffLocation}                 icon={MapPin}     />
              <InfoRow label="Pickup Date"      value={formatDate(b.pickupDate)}           icon={Calendar}   />
              <InfoRow label="Pickup Time"      value={b.pickupTime || 'Not specified'}    icon={Clock}      />
            </div>

            {/* Route visual */}
            <div className="trd-route-visual">
              <div className="trd-route-from">
                <div className="trd-route-dot trd-dot-pickup" />
                <div>
                  <div className="trd-route-label">FROM</div>
                  <div className="trd-route-place">{b.pickupLocation}</div>
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
                  <div className="trd-route-place">{b.dropoffLocation}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional raw data fields */}
          {(raw.flightNumber || raw.specialInstructions || raw.notes) && (
            <div className="trd-section">
              <h3 className="trd-section-title">
                <FileText size={16} /> Additional Notes
              </h3>
              <div className="trd-info-grid">
                {raw.flightNumber && (
                  <InfoRow label="Flight Number"        value={raw.flightNumber}        icon={FileText} />
                )}
                {raw.specialInstructions && (
                  <InfoRow label="Special Instructions" value={raw.specialInstructions} icon={FileText} />
                )}
                {raw.notes && (
                  <InfoRow label="Notes"                value={raw.notes}               icon={FileText} />
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
              {isPartialPayment && (
                <>
                  <div className="trd-payment-row">
                    <span>Amount Paid</span>
                    <span className="trd-paid-amount">₱{initialPaid.toLocaleString()}</span>
                  </div>
                  <div className="trd-payment-row">
                    <span>Remaining Balance</span>
                    <span className={remainingBalance > 0 ? 'trd-balance-due' : 'trd-balance-clear'}>
                      ₱{remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </>
              )}
              <div className="trd-payment-row trd-payment-total">
                <span>Total Amount</span>
                <span>₱{totalAmount.toLocaleString()}</span>
              </div>
              <div className="trd-payment-status">
                {isFullyPaid
                  ? <span className="trd-fully-paid"><Check size={14} /> Fully Paid</span>
                  : remainingBalance > 0
                    ? <span className="trd-balance-label">Balance Due: ₱{remainingBalance.toLocaleString()}</span>
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
