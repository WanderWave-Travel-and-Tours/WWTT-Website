import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, CheckCircle, AlertCircle, XCircle,
  User, Mail, Calendar, MapPin, Clock,
  CreditCard, Wallet, Car, PhoneCall, Navigation,
  FileText, Check, Tag, Truck, ArrowLeftRight,
  Receipt, Ticket, Pencil, DollarSign
} from 'lucide-react';
import './TransferBookingDetailModal.css';
import TransferOrderSlipModal from './TransferOrderSlipModal';
import TransferVoucherModal from './TransferVoucherModal';

/* ─── Helpers ─────────────────────────────────────────────────── */
const formatDate = (d) => {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
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

/* ─── InfoItem — matches cnm-info-item pattern ────────────────── */
const InfoItem = ({ label, value, icon: Icon }) => (
  <div className="cnm-info-item">
    <div className="cnm-info-icon">
      {Icon && <Icon size={18} />}
    </div>
    <div className="cnm-info-content">
      <label className="cnm-info-label">{label}</label>
      <span className="cnm-info-value">{value || 'N/A'}</span>
    </div>
  </div>
);

/* ─── Component ───────────────────────────────────────────────── */
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
  const { color: statusColor, Icon: StatusIcon, label: statusLabel, description: statusDesc } = getStatusConfig(status);

  /* ── Payment values ─────────────────────────────────────────── */
  const isPartialPayment = b.paymentType === 'partial';
  const totalAmount      = b.totalAmount || 0;
  const remainingBalance = b.remainingBalance || 0;
  const initialPaid      = b.initialPaymentAmount || (totalAmount - remainingBalance);
  const isFullyPaid      = remainingBalance <= 0 && initialPaid > 0;
  const currencySymbol   = b.currency === 'PHP' ? '₱' : (b.currency || '₱');

  const canConfirm = status === 'PENDING';
  const canCancel  = status === 'PENDING' || status === 'CONFIRMED';
  const isRoundtrip = b.transferType === 'roundtrip';

  /* ── Payment status badge ───────────────────────────────────── */
  const paymentStatusMap = {
    pending:  { label: 'Pending',  color: '#f59e0b' },
    paid:     { label: 'Paid',     color: '#22c55e' },
    partial:  { label: 'Partial',  color: '#3b82f6' },
    failed:   { label: 'Failed',   color: '#ef4444' },
    refunded: { label: 'Refunded', color: '#8b5cf6' },
  };
  const paymentStatusConfig = paymentStatusMap[(b.paymentStatus || 'pending').toLowerCase()] || paymentStatusMap.pending;

  /* ── Handlers ───────────────────────────────────────────────── */
  const closeModal = () => setShowModal(false);

  const handleEdit = () => {
    setShowModal(false);
    navigate(`./EditTransferBooking/EditTransferBooking/${b._id || b.id}`);
  };

  const modalBooking = { id: b._id || b.id, rawData: b.rawData || b };

  return (
    <>
      {/* ── Overlay ──────────────────────────────────────────── */}
      <div className="modal-overlay bkm-detail-modal" onClick={closeModal}>
        <div className="modal-content trd-modal-content" onClick={e => e.stopPropagation()}>

          {/* ── Header ─────────────────────────────────────── */}
          <div className={`modal-header trd-header-accent trd-accent-${statusColor}`}>
            <div className="cnm-header-content">
              {/* Title group */}
              <div className="cnm-title-group">
                <div className="trd-title-row">
                  <div className={`trd-header-icon-wrap trd-icon-${statusColor}`}>
                    <Car size={20} />
                  </div>
                  <div>
                    <h2 className="cnm-title">Transfer Booking Details</h2>
                    <div className="cnm-meta">
                      <span className="cnm-ref">ID: #{b._id || b.id}</span>
                      <span className="cnm-divider">•</span>
                      <span className="cnm-date">Booked: {formatDate(b.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rich status badge — matches BookingDetailModal */}
              <div className={`cnm-status-badge cnm-status-${statusColor}`}>
                <div className="cnm-status-icon">
                  <StatusIcon size={16} />
                </div>
                <div className="cnm-status-content">
                  <span className="cnm-status-label">{statusLabel}</span>
                  <span className="cnm-status-desc">{statusDesc}</span>
                </div>
              </div>
            </div>

            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          {/* ── Body ───────────────────────────────────────── */}
          <div className="modal-body">

            {/* ── Customer Information ──────────────────────── */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Customer Information</h3>
              </div>
              <div className="cnm-grid">
                <InfoItem label="Full Name"    value={b.fullName}  icon={User}      />
                <InfoItem label="Email"        value={b.email}     icon={Mail}      />
                <InfoItem label="Phone Number" value={b.phone}     icon={PhoneCall} />
              </div>
            </div>

            {/* ── Transfer Details ─────────────────────────── */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Transfer Details</h3>
                {/* Transfer type badge */}
                <span className={`cnm-badge trd-type-badge ${
                  isRoundtrip ? 'trd-type-roundtrip' : 'trd-type-oneway'
                }`}>
                  <ArrowLeftRight size={11} />
                  {isRoundtrip ? 'Round Trip' : 'One Way'}
                </span>
              </div>

              <div className="cnm-grid">
                <InfoItem label="Activity / Service" value={b.activityName}                                              icon={FileText}       />
                {b.bookingType  && <InfoItem label="Booking Type"    value={b.bookingType}                               icon={FileText}       />}
                {b.destination  && <InfoItem label="Destination"     value={b.destination}                               icon={MapPin}         />}
                {b.category     && <InfoItem label="Category"        value={b.category}                                  icon={FileText}       />}
                {b.supplierName && <InfoItem label="Supplier"        value={b.supplierName}                              icon={Truck}          />}
                <InfoItem label="Pickup Location"   value={b.pickupLocation}                                             icon={Navigation}     />
                {isRoundtrip    && <InfoItem label="Dropoff Location" value={b.dropoffLocation}                          icon={MapPin}         />}
                <InfoItem label="Travel Date"       value={formatDate(b.travelDate)}                                     icon={Calendar}       />
                {isRoundtrip    && <InfoItem label="Return Date"      value={formatDate(b.returnDate)}                   icon={Calendar}       />}
                <InfoItem label="Arrival Time"      value={b.arrivalTime    || 'Not specified'}                          icon={Clock}          />
                {isRoundtrip    && <InfoItem label="Departure Time"   value={b.departureTime  || 'Not specified'}        icon={Clock}          />}
              </div>

              {/* ── Route visual ──────────────────────────── */}
              <div className="trd-route-visual">
                {/* FROM */}
                <div className="trd-route-from">
                  <div className="trd-route-dot trd-dot-pickup" />
                  <div>
                    <div className="trd-route-label">Pickup</div>
                    <div className="trd-route-place">{b.pickupLocation || 'N/A'}</div>
                  </div>
                </div>

                {/* Line + car icon */}
                <div className="trd-route-line">
                  <div className="trd-route-car">
                    <Car size={14} color="#475569" />
                  </div>
                </div>

                {/* TO */}
                <div className="trd-route-to">
                  <div className="trd-route-dot trd-dot-dropoff" />
                  <div>
                    <div className="trd-route-label">Drop-off</div>
                    <div className="trd-route-place">
                      {isRoundtrip ? (b.dropoffLocation || 'N/A') : (b.destination || 'Destination')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Additional Notes ─────────────────────────── */}
            {(b.specialRequests || b.message) && (
              <div className="cnm-card">
                <div className="cnm-card-header">
                  <h3 className="cnm-card-title">Additional Notes</h3>
                </div>
                <div className="cnm-grid">
                  {b.specialRequests && (
                    <InfoItem label="Special Requests" value={b.specialRequests} icon={FileText} />
                  )}
                  {b.message && (
                    <InfoItem label="Message" value={b.message} icon={FileText} />
                  )}
                </div>
              </div>
            )}

            {/* ── Payment Details ──────────────────────────── */}
            <div className="cnm-payment-card">
              <div className="cnm-payment-header">
                <div className="cnm-payment-title">
                  <CreditCard size={16} />
                  Payment Details
                </div>
                <div className={`cnm-payment-badge ${isPartialPayment ? 'partial' : 'full'}`}>
                  {isPartialPayment ? 'Partial Payment' : 'Full Payment'}
                </div>
              </div>

              <div className="cnm-payment-body">
                <div className="cnm-payment-section">

                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label">Payment Status</span>
                    <span className="cnm-payment-value" style={{ color: paymentStatusConfig.color, fontWeight: 800 }}>
                      {paymentStatusConfig.label}
                    </span>
                  </div>

                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label">Payment Type</span>
                    <span className="cnm-payment-value">
                      {isPartialPayment ? 'Pay in Partial' : 'Pay in Full'}
                    </span>
                  </div>

                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label">Currency</span>
                    <span className="cnm-payment-value">{b.currency || 'PHP'}</span>
                  </div>

                  {b.oneWayPrice > 0 && (
                    <div className="cnm-payment-row">
                      <span className="cnm-payment-label">One Way Price</span>
                      <span className="cnm-payment-value">{currencySymbol}{b.oneWayPrice.toLocaleString()}</span>
                    </div>
                  )}

                  {b.roundtripPrice > 0 && (
                    <div className="cnm-payment-row">
                      <span className="cnm-payment-label">Round Trip Price</span>
                      <span className="cnm-payment-value">{currencySymbol}{b.roundtripPrice.toLocaleString()}</span>
                    </div>
                  )}

                  {b.sellingPrice > 0 && (
                    <div className="cnm-payment-row">
                      <span className="cnm-payment-label">Selling Price</span>
                      <span className="cnm-payment-value">{currencySymbol}{b.sellingPrice.toLocaleString()}</span>
                    </div>
                  )}

                  {isPartialPayment && (
                    <>
                      <div className="cnm-payment-row">
                        <span className="cnm-payment-label">Amount Paid</span>
                        <span className="cnm-payment-value" style={{ color: '#059669', fontWeight: 800 }}>
                          {currencySymbol}{initialPaid.toLocaleString()}
                        </span>
                      </div>
                      <div className="cnm-payment-row">
                        <span className="cnm-payment-label">Remaining Balance</span>
                        <span className="cnm-payment-value" style={{
                          color: remainingBalance > 0 ? '#d97706' : '#059669', fontWeight: 800
                        }}>
                          {currencySymbol}{remainingBalance.toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}

                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label" style={{ fontWeight: 800, color: '#0f172a' }}>
                      Total Amount
                    </span>
                    <span className="cnm-payment-value cnm-val-amount">
                      {currencySymbol}{totalAmount.toLocaleString()}
                    </span>
                  </div>

                  {b.promoCode && (
                    <div className="cnm-payment-row">
                      <span className="cnm-payment-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Tag size={13} /> Promo Code
                      </span>
                      <span className="cnm-payment-value" style={{ color: '#7c3aed' }}>{b.promoCode}</span>
                    </div>
                  )}
                </div>

                {/* ── Payment status summary box ──────────── */}
                <div className={`cnm-payment-status-box ${isFullyPaid ? 'paid' : 'pending'}`}>
                  <div className="cnm-payment-status-left">
                    <div className="cnm-payment-status-title">
                      {isFullyPaid
                        ? <><Check size={13} style={{ marginRight: 5 }} /> Fully Paid</>
                        : remainingBalance > 0
                          ? 'Balance Due'
                          : 'Pending Payment'}
                    </div>
                    <div className="cnm-payment-status-amount">
                      {isFullyPaid
                        ? `${currencySymbol}${totalAmount.toLocaleString()}`
                        : remainingBalance > 0
                          ? `${currencySymbol}${remainingBalance.toLocaleString()}`
                          : `${currencySymbol}0`}
                    </div>
                  </div>
                  <div className="cnm-payment-status-icon">
                    {isFullyPaid ? <CheckCircle size={22} /> : <AlertCircle size={22} />}
                  </div>
                </div>
              </div>
            </div>

          </div>{/* /modal-body */}

          {/* ── Footer Actions ──────────────────────────── */}
          <div className="modal-footer">

            {/* Order Slip */}
            <button
              className="cnm-btn cnm-btn-utility"
              style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
              }}
              onClick={() => setShowOrderSlip(true)}
            >
              <Receipt size={14} /> Order Slip
            </button>

            {/* Edit */}
            <button className="cnm-btn trd-btn-edit cnm-btn-utility" onClick={handleEdit} title="Edit booking">
              <Pencil size={14} /> Edit
            </button>

            {/* Voucher */}
            {status === 'CONFIRMED' && (
              <button className="cnm-btn cnm-btn-primary cnm-btn-utility" onClick={() => setShowVoucher(true)}>
                <Ticket size={14} /> View Voucher
              </button>
            )}

            {/* Confirm */}
            {canConfirm && (
              <button
                className="cnm-btn cnm-btn-success cnm-btn-decision"
                onClick={() => { closeModal(); handleConfirm(b); }}
                disabled={actionLoading}
              >
                <CheckCircle size={14} /> Confirm Booking
              </button>
            )}

            {/* Cancel */}
            {canCancel && (
              <button
                className="cnm-btn cnm-btn-danger cnm-btn-outline cnm-btn-decision"
                onClick={() => { closeModal(); handleCancel(b); }}
                disabled={actionLoading}
              >
                <XCircle size={14} /> Cancel Booking
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Child modals ────────────────────────────────── */}
      {showOrderSlip && (
        <TransferOrderSlipModal booking={modalBooking} onClose={() => setShowOrderSlip(false)} />
      )}
      {showVoucher && (
        <TransferVoucherModal booking={modalBooking} onClose={() => setShowVoucher(false)} />
      )}
    </>
  );
};

export default TransferBookingDetailModal;