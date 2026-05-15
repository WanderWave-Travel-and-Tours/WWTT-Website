import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, AlertCircle, Check,
  DollarSign, Calendar, User, Mail,
  CreditCard, FileText, Archive, RotateCcw,
  File, Phone, MapPin, Tag, Hash,
  Users, MessageSquare, Info,
  ArrowRight, Clock, Navigation, Repeat,
  Pencil,
} from 'lucide-react';
import './CustomBookingDetailModal.css';
import CustomizedBookingOrderSlipModal from './CustomizedBookingOrderSlipModal';
import CustomizedBookingVoucherModal   from './CustomizedBookingVoucherModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const InfoRow = ({ icon, label, value, valueStyle = {} }) => (
  <div className="cbk-info-row">
    <div className="cbk-info-icon">{icon}</div>
    <div style={{ minWidth: 0 }}>
      <label className="cbk-info-label">{label}</label>
      <div className="cbk-info-value" style={valueStyle}>{value || 'N/A'}</div>
    </div>
  </div>
);

const DetailPair = ({ label, value }) => value ? (
  <>
    <div className="cbk-addon-detail-label">{label}</div>
    <div className="cbk-addon-detail-value">{value}</div>
  </>
) : null;

// ── Component ─────────────────────────────────────────────────────────────────
const CustomBookingDetailModal = ({
  showModal,
  selectedBooking,
  setShowModal,
  handleConfirm,
  handleCancel,
  handleArchive,
  handleEdit,
  actionLoading,
}) => {
  const [submittedDocs, setSubmittedDocs]   = useState([]);
  const [isLoadingDocs, setIsLoadingDocs]   = useState(false);
  const [showOrderSlip, setShowOrderSlip]   = useState(false);
  const [showVoucher,   setShowVoucher]     = useState(false);

  useEffect(() => {
    if (!showModal || !selectedBooking?.mongoId) { setSubmittedDocs([]); return; }
    setIsLoadingDocs(true);
    fetch(`https://wanderwaveph.onrender.com/api/documents/inquiry/${selectedBooking.mongoId}`)
      .then(r => r.json())
      .then(data => { setSubmittedDocs(data.success ? (data.documents || []) : []); })
      .catch(() => setSubmittedDocs([]))
      .finally(() => setIsLoadingDocs(false));
  }, [showModal, selectedBooking?.mongoId]);

  if (!showModal || !selectedBooking) return null;

  const close = () => setShowModal(false);

  // ── Status ────────────────────────────────────────────────────────────────
  const status = (selectedBooking.status || 'pending').toUpperCase();
  const statusChip = ({
    PENDING:   { cls: 'amber', icon: <AlertCircle size={13} />, label: 'Pending Review' },
    CONFIRMED: { cls: 'green', icon: <CheckCircle size={13} />, label: 'Confirmed' },
    CANCELLED: { cls: 'red',   icon: <X size={13} />,           label: 'Cancelled' },
    COMPLETED: { cls: 'green', icon: <CheckCircle size={13} />, label: 'Completed' },
  })[status] || { cls: 'amber', icon: <AlertCircle size={13} />, label: 'Pending' };

  // ── Raw document — the full CustomizedBooking MongoDB record ──────────────
  const raw = selectedBooking.rawData || {};

  // ── Basic Info ────────────────────────────────────────────────────────────
  const fullName    = raw.fullName    || selectedBooking.customerName || '';
  const email       = raw.email       || selectedBooking.email        || '';
  const phone       = raw.phone       || '';
  const destination = raw.destination || selectedBooking.destination  || '';
  const travelDate  = raw.travelDate  || selectedBooking.travelDate   || '';
  const returnDate  = raw.returnDate  || selectedBooking.returnDate   || '';
  const paxCount    = raw.paxCount    || selectedBooking.guests        || 1;
  const message     = raw.message     || selectedBooking.message       || '';
  const notes       = raw.notes       || '';
  const promoCode   = raw.promoCode   || '';
  const bookingType = raw.bookingType || 'customized';
  const currency    = raw.currency    || 'PHP';
  const refNum      = raw.referenceNumber || selectedBooking.referenceNumber || '';
  const createdAt   = raw.createdAt   || selectedBooking.bookingDate   || '';
  const updatedAt   = raw.updatedAt   || '';

  // ── Services ──────────────────────────────────────────────────────────────
  const tours     = Array.isArray(raw.tours)     ? raw.tours     : [];
  const transfers = Array.isArray(raw.transfers) ? raw.transfers : [];
  const hasTours     = tours.length > 0;
  const hasTransfers = transfers.length > 0;

  // ── Pricing ───────────────────────────────────────────────────────────────
  const toursTotal     = raw.toursTotal     || selectedBooking.toursTotal     || 0;
  const transfersTotal = raw.transfersTotal || selectedBooking.transfersTotal || 0;
  const totalAmount    = raw.totalAmount    || selectedBooking.totalAmount    || 0;

  // ── Payment ───────────────────────────────────────────────────────────────
  const isWalkin             = selectedBooking.isWalkin || false;
  const paymentType          = raw.paymentType          || selectedBooking.paymentType || 'full';
  const isPartial            = !isWalkin && paymentType === 'partial';
  const initialPaymentAmount = raw.initialPaymentAmount || selectedBooking.initialPaymentAmount || 0;
  const remainingBalance     = raw.remainingBalance     ?? selectedBooking.remainingBalance ?? 0;
  const paymentStatus        = raw.paymentStatus        || 'pending';
  const payMethod            = isWalkin ? 'Pay Over the Counter' : 'Online Payment';
  const isPendingPay         = !isWalkin && !isPartial && status === 'PENDING';

  const payStatusColor = ({ paid: '#059669', partial: '#f59e0b', pending: '#ef4444', failed: '#ef4444', refunded: '#6366f1' })[paymentStatus] || '#64748b';

  return (
    <>
      <style>{`@keyframes cbk-spin { to { transform: rotate(360deg); } }`}</style>
      <div className="cbk-modal-overlay" onClick={close}>
        <div className="cbk-modal-box" onClick={e => e.stopPropagation()}>

          {/* ── HEADER ── */}
          <div className="cbk-modal-header">
            <div className="cbk-modal-header-left">
              <div className="cbk-modal-title-group">
                <h2 className="cbk-modal-title">Booking Details</h2>
                <div className="cbk-modal-meta">
                  <span className="cbk-modal-meta-ref">ID: #{selectedBooking.id}</span>
                  <span className="cbk-modal-meta-divider">•</span>
                  <span>Booked: {fmt(createdAt)}</span>
                  {updatedAt && (
                    <>
                      <span className="cbk-modal-meta-divider">•</span>
                      <span>Updated: {fmt(updatedAt)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`cbk-modal-status-chip ${statusChip.cls}`}>
                <div className="cbk-modal-status-chip-icon">{statusChip.icon}</div>
                <div className="cbk-modal-status-chip-content">
                  <span className="cbk-modal-status-chip-label">{statusChip.label}</span>
                  <span className="cbk-modal-status-chip-desc">
                    {status === 'PENDING' ? 'Awaiting confirmation' : status === 'CONFIRMED' ? 'Booking is active' : status === 'COMPLETED' ? 'Trip completed' : 'Request was cancelled'}
                  </span>
                </div>
              </div>
            </div>
            <button className="cbk-modal-close" onClick={close} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* ── BODY ── */}
          <div className="cbk-modal-body">

            {/* ══ 1. BOOKING INFORMATION ══ */}
            <div className="cbk-info-card">
              <div className="cbk-info-card-header">
                <h3 className="cbk-info-card-title">Booking Information</h3>
                {refNum && (
                  <span className="cbk-info-card-badge" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                    {refNum}
                  </span>
                )}
              </div>
              <div className="cbk-info-card-body">
                <div className="cbk-info-grid">
                  <InfoRow icon={<User size={16} />}     label="Client Name"   value={fullName} />
                  <InfoRow icon={<Mail size={16} />}     label="Email Address" value={email}  valueStyle={{ fontSize: 13, wordBreak: 'break-all' }} />
                  <InfoRow icon={<Phone size={16} />}    label="Phone"         value={phone || '—'} />
                  <InfoRow icon={<MapPin size={16} />}   label="Destination"   value={destination} />
                  <InfoRow icon={<Calendar size={16} />} label="Travel Date"   value={fmt(travelDate)} />
                  <InfoRow icon={<Calendar size={16} />} label="Return Date"   value={returnDate ? fmt(returnDate) : '—'} />
                  <InfoRow icon={<Users size={16} />}    label="Pax Count"     value={`${paxCount} pax`} />
                  <InfoRow icon={<Info size={16} />}     label="Booking Type"  value={bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} />
                  <InfoRow icon={<Hash size={16} />}     label="Currency"      value={currency} />
                  {promoCode && (
                    <InfoRow icon={<Tag size={16} />} label="Promo Code" value={promoCode} valueStyle={{ color: '#7c3aed', fontWeight: 700 }} />
                  )}
                </div>

                {/* Message / Special Request */}
                {message && (
                  <div style={{ marginTop: 14 }}>
                    <label className="cbk-info-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <MessageSquare size={12} /> Special Request / Message
                    </label>
                    <div className="cbk-message-box">{message}</div>
                  </div>
                )}

                {/* Internal Notes */}
                {notes && (
                  <div style={{ marginTop: 10 }}>
                    <label className="cbk-info-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                      <FileText size={12} /> Internal Notes
                    </label>
                    <div className="cbk-message-box" style={{ background: '#fefce8', borderColor: '#fde68a', color: '#713f12' }}>
                      {notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ══ 2. PAYMENT DETAILS ══ */}
            <div className="cbk-pay-card">
              <div className="cbk-pay-header">
                <div className="cbk-pay-title"><CreditCard size={14} /> Payment Details</div>
                <div className={`cbk-pay-type-tag ${isPartial ? 'partial' : 'full'}`}>
                  {isWalkin ? 'Over the Counter' : isPartial ? 'Partial Payment' : 'Full Payment'}
                </div>
              </div>
              <div className="cbk-pay-body">
                <div className="cbk-pay-row">
                  <span className="cbk-pay-row-label">Payment Method</span>
                  <span className="cbk-pay-row-value" style={{ color: isWalkin ? '#f97316' : '#0284c7' }}>{payMethod}</span>
                </div>
                <div className="cbk-pay-row">
                  <span className="cbk-pay-row-label">Payment Type</span>
                  <span className="cbk-pay-row-value">{isWalkin ? 'Paid in Full (Walk-in)' : isPartial ? 'Pay in Partial' : 'Pay in Full'}</span>
                </div>
                <div className="cbk-pay-row">
                  <span className="cbk-pay-row-label">Payment Status</span>
                  <span className="cbk-pay-row-value" style={{ color: payStatusColor, textTransform: 'capitalize' }}>{paymentStatus}</span>
                </div>

                <div className="cbk-pay-divider" />

                {toursTotal > 0 && (
                  <div className="cbk-pay-row">
                    <span className="cbk-pay-row-label">Tours Subtotal</span>
                    <span className="cbk-pay-row-value">₱{toursTotal.toLocaleString()}</span>
                  </div>
                )}
                {transfersTotal > 0 && (
                  <div className="cbk-pay-row">
                    <span className="cbk-pay-row-label">Transfers Subtotal</span>
                    <span className="cbk-pay-row-value">₱{transfersTotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="cbk-pay-row">
                  <span className="cbk-pay-row-label" style={{ fontWeight: 700, color: '#0f172a' }}>Total Booking Amount</span>
                  <span className="cbk-pay-row-value" style={{ fontSize: 15 }}>₱{totalAmount.toLocaleString()}</span>
                </div>

                <div className="cbk-pay-divider" />

                {/* Walk-in */}
                {isWalkin && (
                  <div className="cbk-pay-status-box paid">
                    <div className="cbk-pay-status-left">
                      <div className="cbk-pay-status-label"><CheckCircle size={12} /> Fully Paid (Walk-in)</div>
                      <div className="cbk-pay-status-amount">₱{totalAmount.toLocaleString()}</div>
                    </div>
                    <div className="cbk-pay-status-icon"><CheckCircle size={22} /></div>
                  </div>
                )}

                {/* Partial */}
                {!isWalkin && isPartial && (
                  <>
                    <div className="cbk-pay-row">
                      <span className="cbk-pay-row-label">Initial Payment</span>
                      <span className="cbk-pay-row-value green">₱{initialPaymentAmount.toLocaleString()}</span>
                    </div>
                    {remainingBalance > 0 ? (
                      <div className="cbk-pay-status-box pending">
                        <div className="cbk-pay-status-left">
                          <div className="cbk-pay-status-label"><AlertCircle size={12} /> Pending Balance</div>
                          <div className="cbk-pay-status-amount">₱{remainingBalance.toLocaleString()}</div>
                        </div>
                        <div className="cbk-pay-status-icon"><AlertCircle size={22} /></div>
                      </div>
                    ) : (
                      <div className="cbk-pay-status-box paid">
                        <div className="cbk-pay-status-left">
                          <div className="cbk-pay-status-label"><CheckCircle size={12} /> Fully Paid</div>
                          <div className="cbk-pay-status-amount">₱{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="cbk-pay-status-icon"><CheckCircle size={22} /></div>
                      </div>
                    )}
                  </>
                )}

                {/* Full */}
                {!isWalkin && !isPartial && (
                  isPendingPay ? (
                    <div className="cbk-pay-status-box pending">
                      <div className="cbk-pay-status-left">
                        <div className="cbk-pay-status-label"><AlertCircle size={12} /> Pending Payment</div>
                        <div className="cbk-pay-status-amount">₱{totalAmount.toLocaleString()}</div>
                      </div>
                      <div className="cbk-pay-status-icon"><AlertCircle size={22} /></div>
                    </div>
                  ) : (
                    <div className="cbk-pay-status-box paid">
                      <div className="cbk-pay-status-left">
                        <div className="cbk-pay-status-label"><CheckCircle size={12} /> Fully Paid</div>
                        <div className="cbk-pay-status-amount">₱{totalAmount.toLocaleString()}</div>
                      </div>
                      <div className="cbk-pay-status-icon"><CheckCircle size={22} /></div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ══ 3. TRIP SUMMARY ══ */}
            <div className="cbk-info-card">
              <div className="cbk-info-card-header">
                <h3 className="cbk-info-card-title">Trip Summary</h3>
                <span className="cbk-info-card-badge">{paxCount} PAX</span>
              </div>
              <div className="cbk-info-card-body">
                <div style={{ fontWeight: 800, fontSize: 15, color: '#0f172a', marginBottom: 12 }}>
                  {destination || 'Customized Trip'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px 18px' }}>
                  <div>
                    <label className="cbk-info-label">Travel Date</label>
                    <div className="cbk-info-value" style={{ fontSize: 13 }}>{fmt(travelDate)}</div>
                  </div>
                  <div>
                    <label className="cbk-info-label">Return Date</label>
                    <div className="cbk-info-value" style={{ fontSize: 13 }}>{returnDate ? fmt(returnDate) : '—'}</div>
                  </div>
                  <div>
                    <label className="cbk-info-label">Total Pax</label>
                    <div className="cbk-info-value" style={{ fontSize: 13 }}>{paxCount}</div>
                  </div>
                  <div>
                    <label className="cbk-info-label">Total Services</label>
                    <div className="cbk-info-value" style={{ fontSize: 13 }}>
                      {tours.length + transfers.length} item{(tours.length + transfers.length) !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div>
                    <label className="cbk-info-label">Reference No.</label>
                    <div className="cbk-info-value" style={{ fontSize: 12, fontFamily: 'monospace' }}>{refNum || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="cbk-info-label">Booked On</label>
                    <div className="cbk-info-value" style={{ fontSize: 13 }}>{fmt(createdAt)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ 4. TOURS ══ */}
            {hasTours && (
              <div className="cbk-info-card">
                <div className="cbk-info-card-header">
                  <h3 className="cbk-info-card-title">🗺️ Tours</h3>
                  <span className="cbk-info-card-badge">{tours.length} item{tours.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="cbk-info-card-body">
                  {tours.map((t, i) => (
                    <div className="cbk-addon-item" key={i}>
                      {/* Header bar */}
                      <div className="cbk-addon-item-row">
                        <div className="cbk-addon-icon tour">🗺️</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="cbk-addon-name">{t.title || 'Tour'}</div>
                          <div className="cbk-addon-meta">
                            {t.destination && <span>📍 {t.destination}</span>}
                            {t.duration    && <span>⏱ {t.duration}</span>}
                            {t.category    && <span>🏷 {t.category}</span>}
                          </div>
                        </div>
                        <div className="cbk-addon-price-col">
                          <span className="cbk-addon-price">₱{(t.subtotal || 0).toLocaleString()}</span>
                          {t.paxCount > 0 && (
                            <span className="cbk-addon-price-sub">{t.paxCount} pax × ₱{(t.price || 0).toLocaleString()}</span>
                          )}
                        </div>
                      </div>

                      {/* Detail table */}
                      <div className="cbk-addon-detail-grid">
                        {t.paxCount    && <><div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Pax Count</span><span className="cbk-addon-detail-value">{t.paxCount} pax</span></div></>}
                        {t.price       && <><div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Price / Pax</span><span className="cbk-addon-detail-value">₱{Number(t.price).toLocaleString()}</span></div></>}
                        {t.subtotal    && <><div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Subtotal</span><span className="cbk-addon-detail-value">₱{Number(t.subtotal).toLocaleString()}</span></div></>}
                        {t.sellerPrice && <><div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Seller Price</span><span className="cbk-addon-detail-value">₱{Number(t.sellerPrice).toLocaleString()}</span></div></>}
                        {t.destination && <><div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Destination</span><span className="cbk-addon-detail-value">{t.destination}</span></div></>}
                        {t.duration    && <><div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Duration</span><span className="cbk-addon-detail-value">{t.duration}</span></div></>}
                        {t.category    && <><div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Category</span><span className="cbk-addon-detail-value">{t.category}</span></div></>}
                      </div>
                    </div>
                  ))}
                  {toursTotal > 0 && (
                    <div className="cbk-addon-total">
                      <span>Tours Total</span>
                      <strong>₱{toursTotal.toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══ 5. TRANSFERS ══ */}
            {hasTransfers && (
              <div className="cbk-info-card">
                <div className="cbk-info-card-header">
                  <h3 className="cbk-info-card-title">🚐 Transfers</h3>
                  <span className="cbk-info-card-badge">{transfers.length} item{transfers.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="cbk-info-card-body">
                  {transfers.map((t, i) => {
                    const isRoundtrip = t.transferType === 'roundtrip';
                    const hasSchedule = t.travelDate || t.arrivalTime || t.pickupLocation || t.dropoffLocation || t.returnDate || t.departureTime;
                    return (
                      <div className="cbk-addon-item" key={i}>
                        {/* Header bar */}
                        <div className="cbk-addon-item-row">
                          <div className="cbk-addon-icon transfer">🚐</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="cbk-addon-name">{t.title || 'Transfer'}</div>
                          <div className="cbk-addon-meta">
                            {isRoundtrip
                              ? <span><Repeat size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />Roundtrip</span>
                              : <span><ArrowRight size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />One Way</span>}
                            {t.category       && <span>🏷 {t.category}</span>}
                            {t.passengerCount && <span>👥 {t.passengerCount} pax</span>}
                          </div>
                          </div>
                          <div className="cbk-addon-price-col">
                            <span className="cbk-addon-price">₱{(t.subtotal || t.selectedPrice || 0).toLocaleString()}</span>
                            <span className="cbk-addon-price-sub">{isRoundtrip ? 'Roundtrip rate' : 'One-way rate'}</span>
                          </div>
                        </div>

                        {/* Pricing detail table */}
                        <div className="cbk-addon-detail-grid">
                          <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Transfer Type</span><span className="cbk-addon-detail-value">{isRoundtrip ? 'Roundtrip' : 'One Way'}</span></div>
                          {t.passengerCount && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Passengers</span><span className="cbk-addon-detail-value">{t.passengerCount} pax</span></div>}
                          {t.oneWayPrice    && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">One-Way Price</span><span className="cbk-addon-detail-value">₱{Number(t.oneWayPrice).toLocaleString()}</span></div>}
                          {t.roundtripPrice && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Roundtrip Price</span><span className="cbk-addon-detail-value">₱{Number(t.roundtripPrice).toLocaleString()}</span></div>}
                          {t.selectedPrice  && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Selected Price</span><span className="cbk-addon-detail-value">₱{Number(t.selectedPrice).toLocaleString()}</span></div>}
                          {t.subtotal       && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Subtotal</span><span className="cbk-addon-detail-value">₱{Number(t.subtotal).toLocaleString()}</span></div>}
                          {t.category       && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Category</span><span className="cbk-addon-detail-value">{t.category}</span></div>}

                          {/* Schedule sub-section */}
                          {hasSchedule && (
                            <>
                              <div className="cbk-addon-schedule-header"><Clock size={10} /> Schedule</div>
                              {t.travelDate     && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Travel Date</span><span className="cbk-addon-detail-value">{fmt(t.travelDate)}</span></div>}
                              {t.arrivalTime    && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Arrival Time</span><span className="cbk-addon-detail-value">{t.arrivalTime}</span></div>}
                              {t.pickupLocation && <div className="cbk-addon-detail-cell" style={{ gridColumn: '1 / -1' }}><span className="cbk-addon-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Navigation size={9} /> Pickup Location</span><span className="cbk-addon-detail-value">{t.pickupLocation}</span></div>}
                              {isRoundtrip && t.returnDate    && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Return Date</span><span className="cbk-addon-detail-value">{fmt(t.returnDate)}</span></div>}
                              {isRoundtrip && t.departureTime && <div className="cbk-addon-detail-cell"><span className="cbk-addon-detail-label">Departure Time</span><span className="cbk-addon-detail-value">{t.departureTime}</span></div>}
                              {isRoundtrip && t.dropoffLocation && <div className="cbk-addon-detail-cell" style={{ gridColumn: '1 / -1' }}><span className="cbk-addon-detail-label" style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Navigation size={9} /> Dropoff Location</span><span className="cbk-addon-detail-value">{t.dropoffLocation}</span></div>}
                            </>
                          )}

                          {/* Transfer message */}
                          {t.message && (
                            <div className="cbk-addon-message">💬 {t.message}</div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {transfersTotal > 0 && (
                    <div className="cbk-addon-total">
                      <span>Transfers Total</span>
                      <strong>₱{transfersTotal.toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Services Grand Total — only when BOTH tours + transfers exist */}
            {hasTours && hasTransfers && (
              <div className="cbk-addon-total" style={{ borderRadius: 10 }}>
                <span>Services Grand Total</span>
                <strong>₱{(toursTotal + transfersTotal).toLocaleString()}</strong>
              </div>
            )}

            {/* ══ 6. SUBMITTED DOCUMENTS ══ */}
            <div className="cbk-info-card">
              <div className="cbk-info-card-header">
                <h3 className="cbk-info-card-title">Submitted Documents</h3>
                {!isLoadingDocs && (
                  <span className="cbk-info-card-badge">
                    {submittedDocs.length} file{submittedDocs.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="cbk-info-card-body">
                {isLoadingDocs ? (
                  <div style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>
                    <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTopColor: '#059669', borderRadius: '50%', animation: 'cbk-spin 0.75s linear infinite', margin: '0 auto 8px' }} />
                    <p style={{ margin: 0, fontSize: 13 }}>Loading documents...</p>
                  </div>
                ) : submittedDocs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8' }}>
                    <FileText size={28} style={{ marginBottom: 8, opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: 13 }}>No documents submitted yet</p>
                  </div>
                ) : (
                  <div className="cbk-docs-grid">
                    {submittedDocs.map((doc, idx) => {
                      const url   = doc.fileUrl || '#';
                      const isImg = doc.fileType?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.originalName || doc.fileName || '');
                      return (
                        <a key={doc._id || idx} href={url} target="_blank" rel="noopener noreferrer" className="cbk-doc-item">
                          {isImg ? (
                            <img
                              src={url}
                              alt={doc.originalName || `Doc ${idx + 1}`}
                              className="cbk-doc-preview"
                              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : null}
                          <div className="cbk-doc-preview-placeholder" style={{ display: isImg ? 'none' : 'flex' }}>
                            <File size={24} />
                          </div>
                          <div className="cbk-doc-name">{doc.originalName || doc.fileName || `Document ${idx + 1}`}</div>
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>{/* end cbk-modal-body */}

          {/* ── FOOTER ── */}
          <div className="cbk-modal-footer">
            <button
              className="cbk-modal-btn cbk-modal-btn-archive"
              onClick={() => { close(); handleArchive(selectedBooking); }}
              disabled={actionLoading}
            >
              {selectedBooking.isArchive === 'Yes'
                ? <><RotateCcw size={14} /> Unarchive</>
                : <><Archive size={14} /> Archive</>}
            </button>

            {handleEdit && (
              <button
                className="cbk-modal-btn cbk-modal-btn-neutral"
                onClick={() => { close(); handleEdit(selectedBooking); }}
                disabled={actionLoading}
              >
                <Pencil size={14} /> Edit
              </button>
            )}

            <button
              className="cbk-modal-btn cbk-modal-btn-neutral"
              onClick={() => setShowOrderSlip(true)}
            >
              <FileText size={14} /> Order Slip
            </button>

            {status === 'CONFIRMED' && (
              <button
                className="cbk-modal-btn cbk-modal-btn-primary"
                onClick={() => setShowVoucher(true)}
              >
                <FileText size={14} /> Voucher
              </button>
            )}

            {status === 'PENDING' && (
              <>
                <button
                  className="cbk-modal-btn cbk-modal-btn-confirm"
                  onClick={() => { handleConfirm(selectedBooking); }}
                  disabled={actionLoading}
                >
                  <Check size={14} /> Confirm Booking
                </button>
                <button
                  className="cbk-modal-btn cbk-modal-btn-cancel"
                  onClick={() => { handleCancel(selectedBooking); }}
                  disabled={actionLoading}
                >
                  <X size={14} /> Cancel Booking
                </button>
              </>
            )}

            {status === 'CONFIRMED' && (
              <button
                className="cbk-modal-btn cbk-modal-btn-cancel"
                onClick={() => { handleCancel(selectedBooking); }}
                disabled={actionLoading}
              >
                <X size={14} /> Cancel Booking
              </button>
            )}
          </div>

        </div>
      </div>

      {/* ── Order Slip Modal ── */}
      {showOrderSlip && (
        <CustomizedBookingOrderSlipModal
          booking={selectedBooking}
          onClose={() => setShowOrderSlip(false)}
        />
      )}

      {/* ── Voucher Modal ── */}
      {showVoucher && (
        <CustomizedBookingVoucherModal
          booking={selectedBooking}
          onClose={() => setShowVoucher(false)}
        />
      )}
    </>
  );
};

export default CustomBookingDetailModal;