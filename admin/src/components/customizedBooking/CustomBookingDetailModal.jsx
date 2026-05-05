import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, AlertCircle, Check,
  DollarSign, Calendar, User, Mail,
  CreditCard, FileText, Archive, RotateCcw,
  Image, File, Store, Smartphone,
} from 'lucide-react';
import './CustomBookingDetailModal.css';

const fmt = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
};

const CustomBookingDetailModal = ({
  showModal,
  selectedBooking,
  setShowModal,
  handleConfirm,
  handleCancel,
  handleArchive,
  actionLoading,
}) => {
  const [submittedDocs, setSubmittedDocs] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  useEffect(() => {
    if (!showModal || !selectedBooking?.mongoId) {
      setSubmittedDocs([]);
      return;
    }
    setIsLoadingDocs(true);
    fetch(`https://wanderwaveph.onrender.com/api/documents/inquiry/${selectedBooking.mongoId}`)
      .then(r => r.json())
      .then(data => { setSubmittedDocs(data.success ? (data.documents || []) : []); })
      .catch(() => setSubmittedDocs([]))
      .finally(() => setIsLoadingDocs(false));
  }, [showModal, selectedBooking?.mongoId]);

  if (!showModal || !selectedBooking) return null;

  const close = () => setShowModal(false);

  const status = (selectedBooking.status || 'pending').toUpperCase();

  const statusChip = {
    PENDING:   { cls: 'amber', icon: <AlertCircle size={13} />, label: 'Pending Review' },
    CONFIRMED: { cls: 'green', icon: <CheckCircle size={13} />, label: 'Confirmed' },
    CANCELLED: { cls: 'red',   icon: <X size={13} />,           label: 'Cancelled' },
  }[status] || { cls: 'amber', icon: <AlertCircle size={13} />, label: 'Pending' };

  // Payment logic
  const isWalkin        = selectedBooking.isWalkin || false;
  const isPartial       = !isWalkin && selectedBooking.paymentType === 'partial';
  const totalAmount     = selectedBooking.totalAmount || 0;
  const remaining       = isWalkin ? 0 : (selectedBooking.remainingBalance || 0);
  const balancePaid     = isWalkin ? totalAmount : (selectedBooking.balancePaidAmount || 0);
  const initialPaid     = totalAmount - remaining;
  const isFullyPaid     = isWalkin || (balancePaid > 0 && remaining <= 0);
  const isPendingPay    = !isWalkin && !isPartial && status === 'PENDING';
  const payMethod       = isWalkin ? 'Pay Over the Counter' : 'Online Payment';

  // Add-ons
  const addOns      = selectedBooking.rawData?.addOns;
  const hasTours    = Array.isArray(addOns?.tours)     && addOns.tours.length > 0;
  const hasTransfers= Array.isArray(addOns?.transfers) && addOns.transfers.length > 0;

  return (
    <>
      <style>{`@keyframes cbk-spin { to { transform: rotate(360deg); } }`}</style>
      <div className="cbk-modal-overlay" onClick={close}>
        <div className="cbk-modal-box" onClick={e => e.stopPropagation()}>

          {/* ── HEADER ── */}
          <div className="cbk-modal-header">
            <div className="cbk-modal-header-left">
              <h2 className="cbk-modal-title">Booking Details</h2>
              <div className="cbk-modal-meta">
                <span style={{ color: '#94a3b8' }}>ID: {selectedBooking.id}</span>
                <span className="cbk-modal-meta-divider">•</span>
                <span style={{ color: '#64748b' }}>Booked: {fmt(selectedBooking.bookingDate)}</span>
              </div>
            </div>
            <div className={`cbk-modal-status-chip ${statusChip.cls}`}>
              {statusChip.icon} {statusChip.label}
            </div>
            <button className="cbk-modal-close" onClick={close} aria-label="Close">
              <X size={16} />
            </button>
          </div>

          {/* ── BODY ── */}
          <div className="cbk-modal-body">

            {/* Booking Info */}
            <div className="cbk-info-card">
              <div className="cbk-info-card-header">
                <h3 className="cbk-info-card-title">Booking Information</h3>
              </div>
              <div className="cbk-info-card-body">
                <div className="cbk-info-grid">
                  <div className="cbk-info-row">
                    <div className="cbk-info-icon"><User size={16} /></div>
                    <div>
                      <label className="cbk-info-label">Client Name</label>
                      <div className="cbk-info-value">{selectedBooking.customerName}</div>
                    </div>
                  </div>
                  <div className="cbk-info-row">
                    <div className="cbk-info-icon"><Mail size={16} /></div>
                    <div>
                      <label className="cbk-info-label">Email Address</label>
                      <div className="cbk-info-value" style={{ fontSize: 13 }}>{selectedBooking.email}</div>
                    </div>
                  </div>
                  <div className="cbk-info-row">
                    <div className="cbk-info-icon"><DollarSign size={16} /></div>
                    <div>
                      <label className="cbk-info-label">Total Amount</label>
                      <div className="cbk-info-value amount">₱{totalAmount.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="cbk-info-row">
                    <div className="cbk-info-icon"><Calendar size={16} /></div>
                    <div>
                      <label className="cbk-info-label">Travel Date</label>
                      <div className="cbk-info-value">{selectedBooking.travelDate}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Passengers */}
            {selectedBooking.passengers?.length > 0 && (
              <div className="cbk-info-card">
                <div className="cbk-info-card-header">
                  <h3 className="cbk-info-card-title">Passengers</h3>
                  <span className="cbk-info-card-badge">{selectedBooking.passengers.length} PAX</span>
                </div>
                <div className="cbk-info-card-body" style={{ paddingBottom: 8 }}>
                  {selectedBooking.passengers.map((p, i) => (
                    <div className="cbk-passenger-item" key={i}>
                      <div className="cbk-passenger-avatar"><User size={16} /></div>
                      <div style={{ flex: 1 }}>
                        <div className="cbk-passenger-name">{p.firstName} {p.lastName}</div>
                        <div className="cbk-passenger-meta">
                          <span>✉ {p.email}</span>
                          <span>📞 {p.phone}</span>
                          <span>🎂 {fmt(p.dateOfBirth)}</span>
                          <span>🌏 {p.nationality}</span>
                        </div>
                      </div>
                      <span className="cbk-passenger-pax-badge">
                        #{p.passengerNumber || i + 1} · {p.gender} · {p.age}y
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="cbk-pay-card">
              <div className="cbk-pay-header">
                <div className="cbk-pay-title">
                  <CreditCard size={14} /> Payment Details
                </div>
                <div className={`cbk-pay-type-tag ${isPartial ? 'partial' : 'full'}`}>
                  {isWalkin ? 'Over the Counter' : isPartial ? 'Partial Payment' : 'Full Payment'}
                </div>
              </div>
              <div className="cbk-pay-body">
                <div className="cbk-pay-row">
                  <span className="cbk-pay-row-label">Payment Method</span>
                  <span className="cbk-pay-row-value" style={{ color: isWalkin ? '#f97316' : '#0284c7' }}>
                    {payMethod}
                  </span>
                </div>
                <div className="cbk-pay-row">
                  <span className="cbk-pay-row-label">Payment Type</span>
                  <span className="cbk-pay-row-value">
                    {isWalkin ? 'Paid in Full' : isPartial ? 'Pay in Partial' : 'Pay in Full'}
                  </span>
                </div>
                <div className="cbk-pay-row">
                  <span className="cbk-pay-row-label">Total Booking Amount</span>
                  <span className="cbk-pay-row-value">₱{totalAmount.toLocaleString()}</span>
                </div>

                <div className="cbk-pay-divider" />

                {isWalkin && (
                  <div className="cbk-pay-status-box paid">
                    <div>
                      <div className="cbk-pay-status-label"><CheckCircle size={12} /> Fully Paid (Walk-in)</div>
                      <div className="cbk-pay-status-amount">₱{totalAmount.toLocaleString()}</div>
                    </div>
                    <div className="cbk-pay-status-icon"><CheckCircle size={22} /></div>
                  </div>
                )}

                {!isWalkin && isPartial && (
                  <>
                    <div className="cbk-pay-row">
                      <span className="cbk-pay-row-label">Initial Payment</span>
                      <span className="cbk-pay-row-value green">₱{initialPaid.toLocaleString()}</span>
                    </div>
                    {balancePaid > 0 && (
                      <div className="cbk-pay-row">
                        <span className="cbk-pay-row-label">Balance Paid</span>
                        <span className="cbk-pay-row-value green">₱{balancePaid.toLocaleString()}</span>
                      </div>
                    )}
                    {remaining > 0 ? (
                      <div className="cbk-pay-status-box pending">
                        <div>
                          <div className="cbk-pay-status-label"><AlertCircle size={12} /> Pending Balance</div>
                          <div className="cbk-pay-status-amount">₱{remaining.toLocaleString()}</div>
                        </div>
                        <div className="cbk-pay-status-icon"><AlertCircle size={22} /></div>
                      </div>
                    ) : (
                      <div className="cbk-pay-status-box paid">
                        <div>
                          <div className="cbk-pay-status-label"><CheckCircle size={12} /> Fully Paid</div>
                          <div className="cbk-pay-status-amount">₱{totalAmount.toLocaleString()}</div>
                        </div>
                        <div className="cbk-pay-status-icon"><CheckCircle size={22} /></div>
                      </div>
                    )}
                  </>
                )}

                {!isWalkin && !isPartial && (
                  isPendingPay ? (
                    <div className="cbk-pay-status-box pending">
                      <div>
                        <div className="cbk-pay-status-label"><AlertCircle size={12} /> Pending Payment</div>
                        <div className="cbk-pay-status-amount">₱{totalAmount.toLocaleString()}</div>
                      </div>
                      <div className="cbk-pay-status-icon"><AlertCircle size={22} /></div>
                    </div>
                  ) : (
                    <div className="cbk-pay-status-box paid">
                      <div>
                        <div className="cbk-pay-status-label"><CheckCircle size={12} /> Fully Paid</div>
                        <div className="cbk-pay-status-amount">₱{totalAmount.toLocaleString()}</div>
                      </div>
                      <div className="cbk-pay-status-icon"><CheckCircle size={22} /></div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Package Details */}
            <div className="cbk-info-card">
              <div className="cbk-info-card-header">
                <h3 className="cbk-info-card-title">Package Details</h3>
                <span className="cbk-info-card-badge">{selectedBooking.guests} PAX</span>
              </div>
              <div className="cbk-info-card-body">
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 12 }}>
                  {selectedBooking.packageName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px 18px' }}>
                  <div>
                    <label className="cbk-info-label">Destination</label>
                    <div className="cbk-info-value" style={{ fontSize: 13 }}>
                      {selectedBooking.destination || 'Philippines'}
                    </div>
                  </div>
                  <div>
                    <label className="cbk-info-label">Duration</label>
                    <div className="cbk-info-value" style={{ fontSize: 13 }}>{selectedBooking.duration || '4D3N'}</div>
                  </div>
                  <div>
                    <label className="cbk-info-label">Reference No.</label>
                    <div className="cbk-info-value" style={{ fontSize: 13, fontFamily: 'monospace' }}>
                      {selectedBooking.referenceNumber || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add-Ons */}
            {(hasTours || hasTransfers) && (() => {
              const count = (addOns.tours?.length || 0) + (addOns.transfers?.length || 0);
              return (
                <div className="cbk-info-card">
                  <div className="cbk-info-card-header">
                    <h3 className="cbk-info-card-title">Add-Ons</h3>
                    <span className="cbk-info-card-badge">{count} item{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="cbk-info-card-body">
                    {hasTours && (
                      <div className="cbk-addon-group">
                        <div className="cbk-addon-group-title">🗺️ Tours</div>
                        {addOns.tours.map((t, i) => (
                          <div className="cbk-addon-item" key={i}>
                            <div className="cbk-addon-item-row">
                              <div className="cbk-addon-icon">🗺️</div>
                              <div style={{ flex: 1 }}>
                                <div className="cbk-addon-name">{t.title || 'Tour'}</div>
                                <div className="cbk-addon-meta">
                                  {t.destination && `📍 ${t.destination}`}
                                  {t.duration && ` · ⏱ ${t.duration}`}
                                </div>
                              </div>
                              <div className="cbk-addon-price">₱{(t.subtotal || 0).toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {hasTransfers && (
                      <div className="cbk-addon-group">
                        <div className="cbk-addon-group-title">🚐 Transfers</div>
                        {addOns.transfers.map((t, i) => (
                          <div className="cbk-addon-item" key={i}>
                            <div className="cbk-addon-item-row">
                              <div className="cbk-addon-icon">🚐</div>
                              <div style={{ flex: 1 }}>
                                <div className="cbk-addon-name">{t.title || 'Transfer'}</div>
                                <div className="cbk-addon-meta">
                                  {t.transferType === 'roundtrip' ? '🔄 Roundtrip' : '➡️ One Way'}
                                  {t.category && ` · 🏷 ${t.category}`}
                                </div>
                              </div>
                              <div className="cbk-addon-price">₱{(t.subtotal || t.selectedPrice || 0).toLocaleString()}</div>
                            </div>
                            {(t.travelDate || t.arrivalTime || t.pickupLocation) && (
                              <div className="cbk-addon-detail-grid" style={{ marginTop: 10 }}>
                                {t.travelDate     && <><div className="cbk-addon-detail-label">Travel Date</div><div className="cbk-addon-detail-value">{fmt(t.travelDate)}</div></>}
                                {t.arrivalTime    && <><div className="cbk-addon-detail-label">Arrival Time</div><div className="cbk-addon-detail-value">{t.arrivalTime}</div></>}
                                {t.pickupLocation && <><div className="cbk-addon-detail-label">Pickup</div><div className="cbk-addon-detail-value">{t.pickupLocation}</div></>}
                                {t.transferType === 'roundtrip' && t.departureTime  && <><div className="cbk-addon-detail-label">Departure Time</div><div className="cbk-addon-detail-value">{t.departureTime}</div></>}
                                {t.transferType === 'roundtrip' && t.returnDate     && <><div className="cbk-addon-detail-label">Return Date</div><div className="cbk-addon-detail-value">{fmt(t.returnDate)}</div></>}
                                {t.transferType === 'roundtrip' && t.dropoffLocation && <><div className="cbk-addon-detail-label">Dropoff</div><div className="cbk-addon-detail-value">{t.dropoffLocation}</div></>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="cbk-addon-total">
                      <span>Add-Ons Total</span>
                      <strong>₱{(addOns.addOnsTotal || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Special Requests */}
            {selectedBooking.message && (
              <div className="cbk-info-card">
                <div className="cbk-info-card-header">
                  <h3 className="cbk-info-card-title">Special Requests</h3>
                </div>
                <div className="cbk-info-card-body">
                  <div className="cbk-message-box">{selectedBooking.message}</div>
                </div>
              </div>
            )}

            {/* Submitted Documents */}
            <div className="cbk-info-card">
              <div className="cbk-info-card-header">
                <h3 className="cbk-info-card-title">Submitted Documents</h3>
                {!isLoadingDocs && (
                  <span className="cbk-info-card-badge">{submittedDocs.length} file{submittedDocs.length !== 1 ? 's' : ''}</span>
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
                      const url = doc.fileUrl || '#';
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

          </div>

          {/* ── FOOTER ── */}
          <div className="cbk-modal-footer">
            {/* Archive / Unarchive */}
            <button
              className="cbk-modal-btn cbk-modal-btn-archive"
              onClick={() => { close(); handleArchive(selectedBooking); }}
              disabled={actionLoading}
            >
              {selectedBooking.isArchive === 'Yes'
                ? <><RotateCcw size={14} /> Unarchive</>
                : <><Archive size={14} /> Archive</>}
            </button>

            {/* Confirm/Cancel for Pending */}
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

            {/* Cancel only for Confirmed */}
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
    </>
  );
};

export default CustomBookingDetailModal;
