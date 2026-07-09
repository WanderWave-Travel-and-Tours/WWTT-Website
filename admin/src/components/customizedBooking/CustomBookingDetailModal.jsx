import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, AlertCircle, Check,
  Calendar, User, Mail,
  CreditCard, FileText, Archive, RotateCcw,
  File, Phone, MapPin, Tag, Hash,
  Users, MessageSquare, Info,
  ArrowRight, Clock, Navigation, Repeat,
  Pencil, ReceiptText,
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
  <div className="cnm-info-item">
    <div className="cnm-info-icon">{icon}</div>
    <div className="cnm-info-content">
      <label className="cnm-info-label">{label}</label>
      <span className="cnm-info-value" style={valueStyle}>{value || 'N/A'}</span>
    </div>
  </div>
);

const getStatusConfig = (status) => {
  const configs = {
    PENDING:   { color: 'amber', Icon: AlertCircle, label: 'Pending Review', description: 'Awaiting confirmation' },
    CONFIRMED: { color: 'green', Icon: CheckCircle, label: 'Confirmed',       description: 'Booking is active' },
    CANCELLED: { color: 'red',   Icon: X,           label: 'Cancelled',      description: 'Request was cancelled' },
    COMPLETED: { color: 'blue',  Icon: CheckCircle, label: 'Completed',      description: 'Trip completed' },
  };
  return configs[(status || 'PENDING').toUpperCase()] || configs.PENDING;
};

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
  const statusConfig = getStatusConfig(status);
  const StatusIcon = statusConfig.Icon;

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
  const isPartialPayment     = !isWalkin && paymentType === 'partial';
  const initialPaymentAmount = raw.initialPaymentAmount || selectedBooking.initialPaymentAmount || 0;
  const remainingBalance     = raw.remainingBalance     ?? selectedBooking.remainingBalance ?? 0;
  const payMethod            = isWalkin ? 'Pay Over the Counter' : 'Online Payment';
  const isPendingPayment     = !isWalkin && !isPartialPayment && status === 'PENDING';

  const closeModal = close;

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="modal-overlay bkm-detail-modal" onClick={closeModal}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>

          {/* ── HEADER ──────────────────────────────────────────── */}
          <div className="modal-header">
            <div className="cnm-header-content">
              <div className="cnm-title-group">
                <h2>Booking Details</h2>
                <div className="cnm-meta">
                  <span className="cnm-ref">ID: #{selectedBooking.id}</span>
                  <span className="cnm-divider">•</span>
                  <span className="cnm-date">Booked: {fmt(createdAt)}</span>
                </div>
              </div>
              <div className={`cnm-status-badge cnm-status-${statusConfig.color}`}>
                <div className="cnm-status-icon"><StatusIcon size={16} /></div>
                <div className="cnm-status-content">
                  <span className="cnm-status-label">{statusConfig.label}</span>
                  <span className="cnm-status-desc">{statusConfig.description}</span>
                </div>
              </div>
            </div>
            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          {/* ── BODY ────────────────────────────────────────────── */}
          <div className="modal-body">

            {/* BOOKING INFORMATION */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Booking Information</h3>
                {refNum && (
                  <span className="cnm-badge cnm-badge-amber" style={{ fontFamily: 'monospace', fontSize: 10 }}>
                    {refNum}
                  </span>
                )}
              </div>
              <div className="cnm-grid">
                <InfoRow icon={<User size={18} />}     label="Client Name"   value={fullName} />
                <InfoRow icon={<Mail size={18} />}     label="Email Address" value={email} valueStyle={{ fontSize: 13, wordBreak: 'break-all' }} />
                <InfoRow icon={<Phone size={18} />}    label="Phone"         value={phone || '—'} />
                <InfoRow icon={<MapPin size={18} />}   label="Destination"   value={destination} />
                <InfoRow icon={<Calendar size={18} />} label="Travel Date"   value={fmt(travelDate)} />
                <InfoRow icon={<Calendar size={18} />} label="Return Date"   value={returnDate ? fmt(returnDate) : '—'} />
                <InfoRow icon={<Users size={18} />}    label="Pax Count"     value={`${paxCount} pax`} />
                <InfoRow icon={<Info size={18} />}     label="Booking Type"  value={bookingType.charAt(0).toUpperCase() + bookingType.slice(1)} />
                <InfoRow icon={<Hash size={18} />}     label="Currency"      value={currency} />
                {promoCode && (
                  <InfoRow icon={<Tag size={18} />} label="Promo Code" value={promoCode} valueStyle={{ color: '#7c3aed', fontWeight: 700 }} />
                )}
              </div>

              {message && (
                <div style={{ marginTop: 14 }}>
                  <label className="cnm-info-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <MessageSquare size={12} /> Special Request / Message
                  </label>
                  <div className="cnm-message-box">{message}</div>
                </div>
              )}

              {notes && (
                <div style={{ marginTop: 10 }}>
                  <label className="cnm-info-label" style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <FileText size={12} /> Internal Notes
                  </label>
                  <div className="cnm-message-box" style={{ background: '#fefce8', borderColor: '#fde68a', color: '#713f12' }}>
                    {notes}
                  </div>
                </div>
              )}
            </div>

            {/* PAYMENT DETAILS */}
            <div className="cnm-payment-card">
              <div className="cnm-payment-header">
                <div className="cnm-payment-title">
                  <CreditCard size={18} />
                  PAYMENT DETAILS
                </div>
                <div className={`cnm-payment-badge ${isPartialPayment ? 'partial' : 'full'}`}>
                  {isWalkin ? 'OVER THE COUNTER' : isPartialPayment ? 'PARTIAL PAYMENT' : 'FULL PAYMENT'}
                </div>
              </div>

              <div className="cnm-payment-body">
                <div className="cnm-payment-section">
                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label">Payment Method:</span>
                    <span className="cnm-payment-value" style={{ color: isWalkin ? '#ea580c' : '#0284c7' }}>
                      {payMethod}
                    </span>
                  </div>
                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label">Payment Type:</span>
                    <span className="cnm-payment-value">
                      {isWalkin ? 'Paid in Full (Walk-in)' : isPartialPayment ? 'Pay in Partial' : 'Pay in Full'}
                    </span>
                  </div>
                  {toursTotal > 0 && (
                    <div className="cnm-payment-row">
                      <span className="cnm-payment-label">Tours Subtotal:</span>
                      <span className="cnm-payment-value">₱{toursTotal.toLocaleString()}</span>
                    </div>
                  )}
                  {transfersTotal > 0 && (
                    <div className="cnm-payment-row">
                      <span className="cnm-payment-label">Transfers Subtotal:</span>
                      <span className="cnm-payment-value">₱{transfersTotal.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="cnm-payment-row">
                    <span className="cnm-payment-label">Total Booking Amount:</span>
                    <span className="cnm-payment-value">₱{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Walk-in */}
                {isWalkin && (
                  <>
                    <div className="cnm-payment-divider"></div>
                    <div className="cnm-payment-status-box paid">
                      <div className="cnm-payment-status-left">
                        <div className="cnm-payment-status-title">
                          <CheckCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                          FULLY PAID (WALK-IN)
                        </div>
                        <div className="cnm-payment-status-amount">₱{totalAmount.toLocaleString()}</div>
                      </div>
                      <div className="cnm-payment-status-icon">
                        <CheckCircle size={24} />
                      </div>
                    </div>
                  </>
                )}

                {/* Partial Payment Breakdown */}
                {!isWalkin && isPartialPayment && (
                  <>
                    <div className="cnm-payment-divider"></div>
                    <div className="cnm-payment-section">
                      <div className="cnm-payment-row">
                        <span className="cnm-payment-label">
                          <CheckCircle size={16} style={{ color: '#16a34a' }} />
                          Initial Payment:
                        </span>
                        <span className="cnm-payment-value" style={{ color: '#16a34a' }}>
                          ₱{initialPaymentAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {remainingBalance > 0 ? (
                      <div className="cnm-payment-status-box pending">
                        <div className="cnm-payment-status-left">
                          <div className="cnm-payment-status-title">
                            <AlertCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                            PENDING PAYMENT
                          </div>
                          <div className="cnm-payment-status-amount">₱{remainingBalance.toLocaleString()}</div>
                        </div>
                        <div className="cnm-payment-status-icon">
                          <AlertCircle size={24} />
                        </div>
                      </div>
                    ) : (
                      <div className="cnm-payment-status-box paid">
                        <div className="cnm-payment-status-left">
                          <div className="cnm-payment-status-title">
                            <CheckCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                            FULLY PAID
                          </div>
                          <div className="cnm-payment-status-amount">₱{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="cnm-payment-status-icon">
                          <CheckCircle size={24} />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Full Payment Status */}
                {!isWalkin && !isPartialPayment && (
                  <>
                    <div className="cnm-payment-divider"></div>
                    {isPendingPayment ? (
                      <div className="cnm-payment-status-box pending">
                        <div className="cnm-payment-status-left">
                          <div className="cnm-payment-status-title">
                            <AlertCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                            PENDING PAYMENT
                          </div>
                          <div className="cnm-payment-status-amount">₱{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="cnm-payment-status-icon">
                          <AlertCircle size={24} />
                        </div>
                      </div>
                    ) : (
                      <div className="cnm-payment-status-box paid">
                        <div className="cnm-payment-status-left">
                          <div className="cnm-payment-status-title">
                            <CheckCircle size={14} style={{ marginRight: '4px', display: 'inline' }} />
                            FULLY PAID
                          </div>
                          <div className="cnm-payment-status-amount">₱{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="cnm-payment-status-icon">
                          <CheckCircle size={24} />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* TRIP SUMMARY */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Trip Summary</h3>
                <span className="cnm-badge cnm-badge-amber">{paxCount} PAX</span>
              </div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '17px', fontWeight: '700' }}>
                {destination || 'Customized Trip'}
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px 20px' }}>
                <div>
                  <label className="cnm-info-label">Travel Date</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a' }}>{fmt(travelDate)}</p>
                </div>
                <div>
                  <label className="cnm-info-label">Return Date</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a' }}>{returnDate ? fmt(returnDate) : '—'}</p>
                </div>
                <div>
                  <label className="cnm-info-label">Total Services</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '700', color: '#0f172a' }}>
                    {tours.length + transfers.length} item{(tours.length + transfers.length) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div>
                  <label className="cnm-info-label">Reference No.</label>
                  <p style={{ margin: '4px 0 0 0', fontWeight: '600', color: '#475569', fontFamily: 'monospace' }}>
                    {refNum || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* TOURS */}
            {hasTours && (
              <div className="cnm-card">
                <div className="cnm-card-header">
                  <h3 className="cnm-card-title">Add-Ons — Tours</h3>
                  <span className="cnm-badge cnm-badge-amber">{tours.length} item{tours.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="cnm-addons-group">
                  <div className="cnm-addons-group-title">🗺️ Tours</div>
                  {tours.map((t, i) => (
                    <div key={i} className="cnm-addon-item">
                      <div className="cnm-addon-item-header">
                        <div className="cnm-addon-item-icon tour">🗺️</div>
                        <div className="cnm-addon-item-info" style={{ flex: 1, minWidth: 0 }}>
                          <span className="cnm-addon-item-name">{t.title || 'Tour'}</span>
                          <div className="cnm-addon-item-meta">
                            {t.destination && <span>📍 {t.destination}</span>}
                            {t.duration    && <span>⏱ {t.duration}</span>}
                            {t.category    && <span>🏷 {t.category}</span>}
                          </div>
                        </div>
                        <div className="cnm-addon-item-price">
                          <div className="cnm-addon-item-subtotal">₱{(t.subtotal || 0).toLocaleString()}</div>
                          {t.paxCount > 0 && (
                            <div className="cnm-addon-item-per">{t.paxCount} pax × ₱{(t.price || 0).toLocaleString()}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {toursTotal > 0 && (
                    <div className="cnm-addons-total">
                      <span>Tours Total</span>
                      <strong>₱{toursTotal.toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TRANSFERS */}
            {hasTransfers && (
              <div className="cnm-card">
                <div className="cnm-card-header">
                  <h3 className="cnm-card-title">Add-Ons — Transfers</h3>
                  <span className="cnm-badge cnm-badge-amber">{transfers.length} item{transfers.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="cnm-addons-group">
                  <div className="cnm-addons-group-title">🚐 Transfers</div>
                  {transfers.map((t, i) => {
                    const isRoundtrip = t.transferType === 'roundtrip';
                    return (
                      <div key={i} className="cnm-addon-item">
                        <div className="cnm-addon-item-header">
                          <div className="cnm-addon-item-icon transfer">🚐</div>
                          <div className="cnm-addon-item-info" style={{ flex: 1, minWidth: 0 }}>
                            <span className="cnm-addon-item-name">{t.title || 'Transfer'}</span>
                            <div className="cnm-addon-item-meta">
                              {t.category && <span>🏷 {t.category}</span>}
                              <span className={`cnm-addon-type-badge ${isRoundtrip ? 'roundtrip' : 'oneway'}`} style={{
                                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                                background: isRoundtrip ? '#dcfce7' : '#dbeafe',
                                color: isRoundtrip ? '#15803d' : '#1e40af',
                              }}>
                                {isRoundtrip
                                  ? <><Repeat size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />Roundtrip</>
                                  : <><ArrowRight size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />One Way</>}
                              </span>
                            </div>
                          </div>
                          <div className="cnm-addon-item-price">
                            <div className="cnm-addon-item-subtotal">₱{(t.subtotal || t.selectedPrice || 0).toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Transfer scheduling details */}
                        <div className="cnm-addon-transfer-details">
                          {t.travelDate && (
                            <div className="cnm-addon-detail-row">
                              <span className="cnm-addon-detail-label">Travel Date</span>
                              <span className="cnm-addon-detail-value">{fmt(t.travelDate)}</span>
                            </div>
                          )}
                          {isRoundtrip && t.returnDate && (
                            <div className="cnm-addon-detail-row">
                              <span className="cnm-addon-detail-label">Return Date</span>
                              <span className="cnm-addon-detail-value">{fmt(t.returnDate)}</span>
                            </div>
                          )}
                          {t.arrivalTime && (
                            <div className="cnm-addon-detail-row">
                              <span className="cnm-addon-detail-label">Arrival Time</span>
                              <span className="cnm-addon-detail-value">{t.arrivalTime}</span>
                            </div>
                          )}
                          {isRoundtrip && t.departureTime && (
                            <div className="cnm-addon-detail-row">
                              <span className="cnm-addon-detail-label">Departure Time</span>
                              <span className="cnm-addon-detail-value">{t.departureTime}</span>
                            </div>
                          )}
                          {t.pickupLocation && (
                            <div className="cnm-addon-detail-row">
                              <span className="cnm-addon-detail-label">Pickup Location</span>
                              <span className="cnm-addon-detail-value">{t.pickupLocation}</span>
                            </div>
                          )}
                          {isRoundtrip && t.dropoffLocation && (
                            <div className="cnm-addon-detail-row">
                              <span className="cnm-addon-detail-label">Dropoff Location</span>
                              <span className="cnm-addon-detail-value">{t.dropoffLocation}</span>
                            </div>
                          )}
                          {t.message && (
                            <div className="cnm-addon-detail-row">
                              <span className="cnm-addon-detail-label">Special Requests</span>
                              <span className="cnm-addon-detail-value">{t.message}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {transfersTotal > 0 && (
                    <div className="cnm-addons-total">
                      <span>Transfers Total</span>
                      <strong>₱{transfersTotal.toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBMITTED DOCUMENTS */}
            <div className="cnm-card">
              <div className="cnm-card-header">
                <h3 className="cnm-card-title">Submitted Documents</h3>
                {!isLoadingDocs && (
                  <span className="cnm-badge cnm-badge-amber">
                    {submittedDocs.length} file{submittedDocs.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {isLoadingDocs ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                  <div style={{
                    width: '32px', height: '32px', border: '3px solid #e2e8f0',
                    borderTop: '3px solid #f97316', borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite', margin: '0 auto 8px'
                  }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>Loading documents...</p>
                </div>
              ) : submittedDocs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  <FileText size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                  <p style={{ margin: 0, fontSize: '14px' }}>No documents submitted yet.</p>
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

          {/* ── FOOTER ──────────────────────────────────────────── */}
          <div className="modal-footer">
            <button
              className="cnm-btn cnm-btn-utility"
              style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                color: 'white',
                boxShadow: '0 4px 12px rgba(15,23,42,0.25)',
              }}
              onClick={() => setShowOrderSlip(true)}
            >
              <ReceiptText size={14} />
              Order Slip
            </button>

            {handleEdit && (
              <button
                className="cnm-btn cnm-btn-utility"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: 'white',
                  boxShadow: '0 4px 12px rgba(245,158,11,0.25)',
                }}
                onClick={() => { close(); handleEdit(selectedBooking); }}
                disabled={actionLoading}
              >
                <Pencil size={14} />
                Edit
              </button>
            )}

            {selectedBooking && (
              <button
                className="cnm-btn cnm-btn-outline cnm-btn-utility"
                onClick={() => { closeModal(); handleArchive(selectedBooking); }}
                disabled={actionLoading}
              >
                {selectedBooking.isArchive === 'Yes' ? (
                  <><RotateCcw size={14} /> Unarchive</>
                ) : (
                  <><Archive size={14} /> Archive</>
                )}
              </button>
            )}

            {status === 'CONFIRMED' && (
              <button
                className="cnm-btn cnm-btn-voucher cnm-btn-utility"
                onClick={() => setShowVoucher(true)}
              >
                <FileText size={14} />
                Voucher
              </button>
            )}

            {status === 'PENDING' && (
              <button
                className="cnm-btn cnm-btn-success cnm-btn-decision"
                onClick={() => handleConfirm(selectedBooking)}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <><span className="cnm-spinner" /> Processing...</>
                  : <><Check size={14} /> Confirm</>
                }
              </button>
            )}

            {(status === 'PENDING' || status === 'CONFIRMED') && (
              <button
                className="cnm-btn cnm-btn-danger cnm-btn-outline cnm-btn-decision"
                onClick={() => handleCancel(selectedBooking)}
                disabled={actionLoading}
              >
                <X size={14} /> Cancel
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Order Slip Modal */}
      {showOrderSlip && (
        <CustomizedBookingOrderSlipModal
          booking={selectedBooking}
          onClose={() => setShowOrderSlip(false)}
        />
      )}

      {/* Voucher Modal */}
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
