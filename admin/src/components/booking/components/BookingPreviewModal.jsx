import React, { useState, useEffect, useMemo } from 'react';
import {
  Users, Calendar, MapPin, Bed, CreditCard, FileText,
  Eye, X, Download, Mail, Phone, Sparkles, Tag, Wallet,
} from 'lucide-react';
import CustomConfirmModal from '../../confirmationModal/CustomConfirmModal';

const BookingPreviewModal = ({
  onClose,
  handleSubmit,
  loading,

  // Booking data
  selectedDestination,
  selectedPackage,
  departureDate,
  paxCount,
  isSoloPkg,
  isMinTwoPkg,
  formData,
  selectedRoomType,
  appliedPromo,

  // Add-ons
  selectedTourAddOns,
  selectedTransferAddOns,
  transferTypes,

  // Calculations
  calculateBasePackageTotal,
  calculateDiscount,
  calculateHotelTotal,
  calculateAddOnsTotal,
  computeFinalTotal,
  payableAmount,

  // Utils
  getDurationDays,
}) => {
  const [previewDoc, setPreviewDoc] = useState(null); // { fileUrl, name, section } | null
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const returnDate = useMemo(() => {
    if (!departureDate || !selectedPackage) return '—';
    const s = new Date(departureDate);
    const days = getDurationDays(selectedPackage?.duration || '1D');
    s.setDate(s.getDate() + days - 1);
    return s.toISOString().split('T')[0];
  }, [departureDate, selectedPackage, getDurationDays]);

  // Build the doc list (ID / Passport) for a single passenger's locally-selected files
  const getPassengerDocs = (p, i) => {
    const docs = [];
    if (p.idFile instanceof File) {
      docs.push({
        _id: `id-${i}`,
        file: p.idFile,
        name: p.idFileName || p.idFile.name,
        section: 'Valid ID',
      });
    }
    if (p.passportFile instanceof File) {
      docs.push({
        _id: `passport-${i}`,
        file: p.passportFile,
        name: p.passportFileName || p.passportFile.name,
        section: 'Passport',
      });
    }
    return docs;
  };

  // Revoke object URLs on unmount to avoid leaking memory
  useEffect(() => {
    return () => {
      if (previewDoc?.fileUrl) URL.revokeObjectURL(previewDoc.fileUrl);
    };
  }, [previewDoc]);

  const openDocPreview = (doc) => {
    const isImage = doc.file.type.startsWith('image/');
    const fileUrl = URL.createObjectURL(doc.file);
    if (isImage) {
      setPreviewDoc({ fileUrl, name: doc.name, section: doc.section });
    } else {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const closeDocPreview = () => {
    if (previewDoc?.fileUrl) URL.revokeObjectURL(previewDoc.fileUrl);
    setPreviewDoc(null);
  };

  return (
  <div
    className="nbm-preview-overlay"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="nbm-preview-modal" onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div className="nbm-preview-header">
        <div className="nbm-preview-header-inner">
          <div className="nbm-preview-header-icon">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="nbm-preview-header-title">Booking Preview</h2>
            <p className="nbm-preview-header-subtitle">Please review before creating</p>
          </div>
        </div>
        <button onClick={onClose} className="nbm-preview-header-close" aria-label="Close">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="nbm-preview-body">

        {/* Trip Details */}
        <div className="nbm-preview-section">
          <div className="nbm-preview-section-title">
            <MapPin size={16} /> Trip Details
          </div>
          <div className="nbm-preview-card">
            <div className="nbm-preview-row">
              <span>Destination</span>
              <strong>{selectedDestination}</strong>
            </div>
            <div className="nbm-preview-row">
              <span>Package</span>
              <strong className="nbm-preview-row-emphasis">{selectedPackage?.title || '—'}</strong>
            </div>
            <div className="nbm-preview-row">
              <span><Calendar size={14} className="nbm-row-icon" /> Departure</span>
              <strong>{departureDate}</strong>
            </div>
            <div className="nbm-preview-row">
              <span><Calendar size={14} className="nbm-row-icon" /> Return Date</span>
              <strong>{returnDate}</strong>
            </div>
            <div className="nbm-preview-row">
              <span>Number of Pax</span>
              <strong>
                {paxCount}
                {isSoloPkg && <span className="nbm-preview-pill">Solo</span>}
                {isMinTwoPkg && <span className="nbm-preview-pill">Min 2</span>}
              </strong>
            </div>
          </div>
        </div>

        {/* Passenger Details — each with their own submitted documents */}
        <div className="nbm-preview-section">
          <div className="nbm-preview-section-title">
            <Users size={16} /> Passenger Details ({formData.passengers.length})
          </div>
          <div className="nbm-preview-passenger-list">
            {formData.passengers.map((p, i) => {
              const docs = getPassengerDocs(p, i);
              return (
                <div key={i} className="nbm-preview-passenger-card">
                  <div className="nbm-preview-passenger-card-head">
                    <div className="nbm-preview-passenger-num">{i + 1}</div>
                    <div className="nbm-preview-passenger-info">
                      <strong>{p.firstName} {p.lastName}</strong>
                      {i === 0 && <span className="nbm-preview-pill">Primary</span>}
                    </div>
                  </div>

                  <div className="nbm-preview-passenger-details">
                    {p.phone && (
                      <span><Phone size={13} className="nbm-row-icon" /> {p.phone}</span>
                    )}
                    {p.email && (
                      <span><Mail size={13} className="nbm-row-icon" /> {p.email}</span>
                    )}
                    {p.age && (
                      <span>{p.age} yrs old</span>
                    )}
                    {p.gender && (
                      <span>{p.gender}</span>
                    )}
                    {p.nationality && (
                      <span>{p.nationality}</span>
                    )}
                  </div>

                  {docs.length > 0 && (
                    <div className="nbm-doc-list nbm-doc-list-nested">
                      {docs.map(doc => (
                        <div key={doc._id} className="nbm-doc-item">
                          <div className="nbm-doc-icon"><FileText size={18} /></div>
                          <div className="nbm-doc-info">
                            <span className="nbm-doc-name">{doc.name}</span>
                            <span className={`nbm-doc-tag ${doc.section === 'Valid ID' ? 'id' : 'passport'}`}>
                              {doc.section}
                            </span>
                          </div>
                          <button
                            type="button"
                            className="nbm-doc-view-btn"
                            onClick={() => openDocPreview(doc)}
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Accommodation */}
        {selectedRoomType && (
          <div className="nbm-preview-section">
            <div className="nbm-preview-section-title">
              <Bed size={16} /> Accommodation
            </div>
            <div className="nbm-preview-card">
              <div className="nbm-preview-row">
                <span>Room Type</span>
                <strong>{selectedRoomType.type}</strong>
              </div>
            </div>
          </div>
        )}

        {/* Add-Ons */}
        {(selectedTourAddOns.length > 0 || selectedTransferAddOns.length > 0) && (
          <div className="nbm-preview-section">
            <div className="nbm-preview-section-title">
              <Sparkles size={16} /> Add-Ons
            </div>
            <div className="nbm-preview-card">
              {selectedTourAddOns.map(t => (
                <div key={t._id} className="nbm-preview-row">
                  <span><MapPin size={14} className="nbm-row-icon" /> {t.title} × {paxCount} pax</span>
                  <strong>₱{((t.price || 0) * paxCount).toLocaleString()}</strong>
                </div>
              ))}

              {selectedTransferAddOns.map(t => {
                const type  = transferTypes[t._id] || 'oneway';
                const price = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
                return (
                  <div key={t._id} className="nbm-preview-row">
                    <span><Tag size={14} className="nbm-row-icon" /> {t.title} ({type === 'roundtrip' ? 'Roundtrip' : 'One Way'})</span>
                    <strong>₱{price.toLocaleString()}</strong>
                  </div>
                );
              })}

              <div className="nbm-preview-row nbm-preview-row-subtotal">
                <span>Add-Ons Subtotal</span>
                <span>₱{calculateAddOnsTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Payment Option */}
        <div className="nbm-preview-section">
          <div className="nbm-preview-section-title">
            <CreditCard size={16} /> Payment Option
          </div>
          <div className="nbm-preview-card">
            <div className="nbm-preview-row">
              <span>Payment Type</span>
              <strong className="nbm-preview-row-emphasis">
                {formData.paymentType === 'partial' ? 'Partial (50% Down Payment)' : 'Pay in Full'}
              </strong>
            </div>
            <div className="nbm-preview-row">
              <span>Package Total</span>
              <span>₱{calculateBasePackageTotal().toLocaleString()}</span>
            </div>

            {appliedPromo && (
              <div className="nbm-preview-row nbm-preview-row-positive">
                <span>Promo ({appliedPromo.code})</span>
                <span>-₱{calculateDiscount().toLocaleString()}</span>
              </div>
            )}

            {selectedRoomType && (
              <div className="nbm-preview-row">
                <span>Hotel Accommodation</span>
                <span>₱{calculateHotelTotal().toLocaleString()}</span>
              </div>
            )}

            {calculateAddOnsTotal() > 0 && (
              <div className="nbm-preview-row">
                <span>Add-Ons</span>
                <span>₱{calculateAddOnsTotal().toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Big Total */}
          <div className="nbm-preview-total">
            <div className="nbm-preview-total-icon">
              <Wallet size={20} />
            </div>
            <div className="nbm-preview-total-label">
              {formData.paymentType === 'partial' ? 'Initial Payment Due Now' : 'Total Amount'}
            </div>
            <div className="nbm-due-now">
              ₱{payableAmount.toLocaleString()}
            </div>
            {formData.paymentType === 'partial' && (
              <p className="nbm-preview-total-note">
                50% deposit &bull; Balance ₱{(computeFinalTotal() - payableAmount).toLocaleString()} due before departure
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Footer Buttons */}
      <div className="nbm-preview-footer">
        <button
          onClick={onClose}
          className="nbm-btn nbm-btn-back"
        >
          ← Back to Edit
        </button>
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={loading}
          className="nbm-btn nbm-btn-next"
        >
          {loading ? 'Creating Booking...' : 'Confirm & Create Booking'}
        </button>
      </div>

    </div>

    {/* ── FINAL CONFIRMATION MODAL ── */}
    <CustomConfirmModal
      isOpen={showConfirmModal}
      title="Create This Booking?"
      message={`You're about to create a walk-in booking for ${selectedPackage?.title || 'this package'}. Please make sure all passenger details and documents are correct before proceeding.`}
      onConfirm={() => { setShowConfirmModal(false); handleSubmit(); }}
      onCancel={() => setShowConfirmModal(false)}
      type="primary"
    />

    {/* ── IMAGE PREVIEW MODAL ── */}
    {previewDoc && (
      <div
        onClick={closeDocPreview}
        className="nbm-docpreview-overlay"
      >
        <div onClick={e => e.stopPropagation()} className="nbm-docpreview-modal">
          <div className="nbm-docpreview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div className="nbm-docpreview-icon"><FileText size={16} /></div>
              <div style={{ minWidth: 0 }}>
                <p className="nbm-docpreview-name">{previewDoc.name || 'Document Preview'}</p>
                {previewDoc.section && (
                  <span className={`nbm-doc-tag ${previewDoc.section === 'Valid ID' ? 'id' : 'passport'}`}>
                    {previewDoc.section}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
              <a
                href={previewDoc.fileUrl}
                download={previewDoc.name}
                className="nbm-docpreview-download-btn"
              >
                <Download size={14} /> Download
              </a>
              <button onClick={closeDocPreview} className="nbm-docpreview-close-btn">
                <X size={16} />
              </button>
            </div>
          </div>
          <div style={{ padding: '20px' }}>
            <img src={previewDoc.fileUrl} alt={previewDoc.name} className="nbm-docpreview-image" />
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default BookingPreviewModal;
