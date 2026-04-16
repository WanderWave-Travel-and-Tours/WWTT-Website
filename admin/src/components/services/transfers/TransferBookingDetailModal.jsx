import React from 'react';
import {
  X, CheckCircle, XCircle, MapPin, Clock, Users,
  Mail, Phone, Calendar, CreditCard, Wallet, Car
} from 'lucide-react';

// Reuse tour booking modal CSS (same design system)
import './TourBookingDetailModal.css';

const fmtCurrency = (n) =>
  n != null ? `₱${Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2 })}` : '₱0.00';

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date) ? d : date.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
};

const StatusBadge = ({ status }) => {
  const map = {
    confirmed:    { bg: '#dcfce7', color: '#16a34a', label: 'Confirmed'    },
    pending:      { bg: '#fef3c7', color: '#d97706', label: 'Pending'      },
    cancelled:    { bg: '#fee2e2', color: '#dc2626', label: 'Cancelled'    },
    completed:    { bg: '#dcfce7', color: '#16a34a', label: 'Completed'    },
    partial_paid: { bg: '#eff6ff', color: '#1d4ed8', label: 'Partial Paid' },
  };
  const s = map[(status || '').toLowerCase()] || map.pending;
  return (
    <span style={{
      background: s.bg, color: s.color,
      padding: '4px 12px', borderRadius: 20,
      fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px'
    }}>
      {s.label}
    </span>
  );
};

const InfoRow = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</span>
    <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700, textAlign: 'right', maxWidth: '60%' }}>{value || '—'}</span>
  </div>
);

const SectionTitle = ({ icon, title }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    marginBottom: 12, paddingBottom: 8,
    borderBottom: '2px solid #f59e0b'
  }}>
    <span style={{ color: '#1e3a8a' }}>{icon}</span>
    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#1e3a8a' }}>{title}</h3>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const TransferBookingDetailModal = ({
  showModal,
  selectedBooking,
  setShowModal,
  handleConfirm,
  handleCancel,
  actionLoading,
}) => {
  if (!showModal || !selectedBooking) return null;

  const b   = selectedBooking;
  const raw = b.rawData || {};

  const isPending   = b.status === 'pending';
  const isCancelled = b.status === 'cancelled';
  const isConfirmed = b.status === 'confirmed' || b.status === 'completed';

  const amountPaid    = b.totalAmount - b.remainingBalance;
  const hasPartial    = b.paymentType === 'partial';

  return (
    <div
      className="tbk-modal-overlay"
      onClick={(e) => { if (e.target.classList.contains('tbk-modal-overlay')) setShowModal(false); }}
    >
      <div className="tbk-modal-container" style={{ maxWidth: 760 }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div className="tbk-modal-header" style={{ background: '#1e3a8a' }}>
          <div className="tbk-modal-header-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Car size={24} color="white" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'white' }}>
                  {b.activityName}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  Booking ID: {b.id} • Booked: {b.bookingDate}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <StatusBadge status={b.status} />
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                  padding: '6px 10px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center'
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ──────────────────────────────────────────── */}
        <div className="tbk-modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28 }}>

            {/* LEFT COLUMN */}
            <div>
              {/* Customer Info */}
              <div style={{ marginBottom: 24 }}>
                <SectionTitle icon={<Mail size={16} />} title="Customer Information" />
                <InfoRow label="Full Name"    value={b.customerName} />
                <InfoRow label="Email"        value={b.email} />
                <InfoRow label="Phone"        value={b.phone || raw.phone} />
                {raw.message && (
                  <div style={{ marginTop: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#475569' }}>
                    <span style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>Special Requests:</span>
                    {raw.specialRequests || raw.message}
                  </div>
                )}
              </div>

              {/* Transfer Details */}
              <div style={{ marginBottom: 24 }}>
                <SectionTitle icon={<Car size={16} />} title="Transfer Details" />
                <InfoRow label="Service"         value={b.activityName} />
                <InfoRow label="Supplier"         value={b.supplierName} />
                <InfoRow label="Destination"      value={b.destination} />
                <InfoRow label="PAX Tier"         value={b.pax} />
                <InfoRow label="Passengers"       value={b.passengerCount} />
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div>
              {/* Schedule */}
              <div style={{ marginBottom: 24 }}>
                <SectionTitle icon={<Calendar size={16} />} title="Schedule" />
                <InfoRow label="Travel Date"     value={b.travelDate} />
                <InfoRow label="Pickup Time"     value={b.pickupTime} />
                <InfoRow label="Pickup Location" value={b.pickupLocation} />
                <InfoRow label="Drop-off"        value={b.dropoffLocation} />
              </div>

              {/* Payment */}
              <div style={{ marginBottom: 24 }}>
                <SectionTitle icon={<Wallet size={16} />} title="Payment Summary" />
                <InfoRow label="Payment Type"   value={b.paymentType === 'partial' ? 'Partial Payment' : 'Full Payment'} />
                <InfoRow label="Total Amount"   value={fmtCurrency(b.totalAmount)} />
                {hasPartial && (
                  <>
                    <InfoRow label="Amount Paid"    value={fmtCurrency(amountPaid)} />
                    <InfoRow label="Remaining"      value={fmtCurrency(b.remainingBalance)} />
                  </>
                )}
                <InfoRow label="Reference No."  value={raw.referenceNumber} />
                {raw.paidAt && (
                  <InfoRow label="Paid At"        value={fmtDate(raw.paidAt)} />
                )}
              </div>
            </div>
          </div>

          {/* Special requests row if not shown above */}
          {raw.specialRequests && !raw.message && (
            <div style={{ marginTop: 4, padding: '12px 16px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 8, fontSize: 13, color: '#92400e' }}>
              <span style={{ fontWeight: 700, display: 'block', marginBottom: 4 }}>⚠️ Special Requests:</span>
              {raw.specialRequests}
            </div>
          )}
        </div>

        {/* ── Footer / Actions ───────────────────────────────── */}
        <div className="tbk-modal-footer" style={{ padding: '16px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {!isCancelled && !isConfirmed && isPending && (
            <>
              <button
                className="tbk-btn tbk-btn-danger"
                onClick={() => handleCancel(b)}
                disabled={actionLoading}
              >
                <XCircle size={16} /> Cancel Booking
              </button>
              <button
                className="tbk-btn tbk-btn-primary"
                onClick={() => handleConfirm(b)}
                disabled={actionLoading}
              >
                <CheckCircle size={16} /> Confirm Booking
              </button>
            </>
          )}
          {isConfirmed && (
            <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle size={16} /> This booking is confirmed.
            </div>
          )}
          {isCancelled && (
            <div style={{ fontSize: 13, color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircle size={16} /> This booking has been cancelled.
            </div>
          )}
          <button
            className="tbk-btn tbk-btn-secondary"
            onClick={() => setShowModal(false)}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default TransferBookingDetailModal;
