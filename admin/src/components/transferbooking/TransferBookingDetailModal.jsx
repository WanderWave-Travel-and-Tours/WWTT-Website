import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, CheckCircle, AlertCircle, XCircle,
  User, Mail, Calendar, MapPin, Clock,
  CreditCard, Wallet, Car, PhoneCall, Navigation,
  FileText, Check, Tag, Truck, ArrowLeftRight,
  Receipt, Ticket, Pencil, DollarSign, Archive, RotateCcw,
  Image as ImageIcon, File, Download,
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
  handleArchive,
  actionLoading,
}) => {
  const navigate = useNavigate();
  const [showOrderSlip, setShowOrderSlip] = useState(false);
  const [showVoucher,   setShowVoucher]   = useState(false);
  const [submittedDocs, setSubmittedDocs] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  // Fetch submitted documents whenever the modal opens for a booking
  useEffect(() => {
    const mongoId = selectedBooking?._id || selectedBooking?.id;
    if (!showModal || !mongoId) {
      setSubmittedDocs([]);
      return;
    }
    const fetchDocs = async () => {
      setIsLoadingDocs(true);
      try {
        const res = await fetch(`/api/documents/inquiry/${mongoId}`);
        const data = await res.json();
        setSubmittedDocs(data.success ? (data.documents || []) : []);
      } catch (err) {
        console.error('Error fetching booking documents:', err);
        setSubmittedDocs([]);
      } finally {
        setIsLoadingDocs(false);
      }
    };
    fetchDocs();
  }, [showModal, selectedBooking?._id, selectedBooking?.id]);

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
  const isArchived  = b.isArchive === 'Yes';

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

  const handleArchiveClick = () => {
    if (!handleArchive) return;
    closeModal();
    handleArchive({
      mongoId: b._id || b.mongoId || b.id,
      id: b.id || b._id,
      customerName: b.fullName || b.customerName || 'Customer',
      isArchive: b.isArchive,
    });
  };

  const downloadViaBlob = async (url, fileName) => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch file');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'document';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  };

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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

            {/* ── Submitted Documents ─────────────────────── */}
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
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '10px'
                }}>
                  {submittedDocs.map((doc, idx) => {
                    const fileUrl = doc.fileUrl || '#';
                    const isImage = doc.fileType?.startsWith('image/') ||
                      /\.(jpg|jpeg|png|webp|gif)$/i.test(doc.originalName || doc.fileName || '');
                    return (
                      <div
                        key={doc._id || idx}
                        onClick={() => isImage
                          ? setPreviewDoc({ fileUrl, name: doc.originalName || doc.fileName, section: doc.section })
                          : window.open(fileUrl, '_blank', 'noopener,noreferrer')
                        }
                        style={{
                          display: 'flex', flexDirection: 'column',
                          border: '1px solid #e2e8f0', borderRadius: '10px',
                          overflow: 'hidden',
                          background: '#fff', transition: 'box-shadow 0.2s', cursor: 'pointer'
                        }}
                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                      >
                        {isImage ? (
                          <div style={{ width: '100%', height: '80px', overflow: 'hidden', background: '#e2e8f0', position: 'relative' }}>
                            <img
                              src={fileUrl}
                              alt={doc.originalName || doc.fileName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                            <div style={{
                              display: 'none', width: '100%', height: '100%',
                              alignItems: 'center', justifyContent: 'center',
                              position: 'absolute', top: 0, left: 0, background: '#f1f5f9'
                            }}>
                              <ImageIcon size={24} color="#94a3b8" />
                            </div>
                          </div>
                        ) : (
                          <div style={{ width: '100%', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' }}>
                            <File size={28} color="#64748b" />
                          </div>
                        )}
                        <div style={{ padding: '8px', width: '100%', boxSizing: 'border-box' }}>
                          <p style={{
                            margin: '0 0 3px 0', fontSize: '11px', fontWeight: '600',
                            color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {doc.originalName || doc.fileName || `Document ${idx + 1}`}
                          </p>
                          {doc.section && (
                            <span style={{
                              fontSize: '10px', fontWeight: '600',
                              color: doc.section === 'Valid ID' ? '#1d4ed8' : '#b45309',
                              background: doc.section === 'Valid ID' ? '#dbeafe' : '#fef3c7',
                              padding: '1px 6px', borderRadius: '4px'
                            }}>
                              {doc.section}
                            </span>
                          )}
                          {doc.fileSize && (
                            <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                              {(doc.fileSize / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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

            {/* Archive / Unarchive */}
            {handleArchive && (
              <button
                className="cnm-btn cnm-btn-outline cnm-btn-utility"
                onClick={handleArchiveClick}
                disabled={actionLoading}
              >
                {isArchived ? (
                  <><RotateCcw size={14} /> Unarchive</>
                ) : (
                  <><Archive size={14} /> Archive</>
                )}
              </button>
            )}

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

      {/* ── IMAGE PREVIEW MODAL ── */}
      {previewDoc && (
        <div
          onClick={() => setPreviewDoc(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.9))',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            animation: 'cnmFadeIn 0.25s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#f1f5f9',
              borderRadius: '20px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
              display: 'inline-flex',
              flexDirection: 'column',
              maxWidth: 'min(90vw, 820px)',
              animation: 'cnmSlideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(to bottom, #ffffff, #fafbfc)',
              borderRadius: '20px 20px 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(245,158,11,0.2)',
                }}>
                  <ImageIcon size={16} color="#f59e0b" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{
                    margin: '0 0 3px', fontSize: '13px', fontWeight: '700', color: '#0f172a',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '420px',
                  }}>
                    {previewDoc.name || 'Document Preview'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                <button
                  onClick={async () => {
                    try {
                      await downloadViaBlob(previewDoc.fileUrl, previewDoc.name);
                    } catch {
                      alert('Failed to download. Please try again.');
                    }
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none', borderRadius: '10px',
                    height: '36px', padding: '0 14px', display: 'flex', alignItems: 'center', gap: '6px',
                    cursor: 'pointer', color: '#fff', fontSize: '12px', fontWeight: '700', transition: 'all 0.2s',
                  }}
                >
                  <Download size={14} />
                  Download
                </button>
                <button
                  onClick={() => setPreviewDoc(null)}
                  style={{
                    background: '#f1f5f9', border: 'none', borderRadius: '10px',
                    width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: '#64748b', flexShrink: 0, transition: 'all 0.2s',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div style={{ padding: '20px' }}>
              <img
                src={previewDoc.fileUrl}
                alt={previewDoc.name}
                style={{
                  display: 'block',
                  maxWidth: 'min(75vw, 780px)',
                  maxHeight: '70vh',
                  width: 'auto',
                  height: 'auto',
                  borderRadius: '12px',
                  objectFit: 'contain',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TransferBookingDetailModal;
