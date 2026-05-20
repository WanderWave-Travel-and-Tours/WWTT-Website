import React from 'react';
import { Users, Calendar, MapPin, Bed, CreditCard } from 'lucide-react';

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
}) => (
  <div
    className="nbm-preview-overlay"
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div className="nbm-preview-modal" onClick={e => e.stopPropagation()}>

      {/* Header */}
      <div className="nbm-preview-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(255,255,255,0.25)', borderRadius: '50%',
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px',
          }}>📋</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Booking Preview</h2>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>Please review before creating</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', fontSize: '32px',
            color: 'white', cursor: 'pointer', lineHeight: 1,
          }}
        >×</button>
      </div>

      {/* Body */}
      <div className="nbm-preview-body">

        {/* Customer */}
        <div className="nbm-preview-section">
          <div className="nbm-preview-section-title">👤 Customer Information</div>
          ...
        </div>

        {/* Trip Details */}
        <div className="nbm-preview-section">
          <div className="nbm-preview-section-title">
            <MapPin size={18} /> Trip Details
          </div>
          <div className="nbm-preview-row">
            <span>Destination</span>
            <strong>{selectedDestination}</strong>
          </div>
          <div className="nbm-preview-row">
            <span>Package</span>
            <strong>{selectedPackage?.title || '—'}</strong>
          </div>
          <div className="nbm-preview-row">
            <span><Calendar size={16} style={{ display: 'inline', marginRight: 4 }} /> Departure</span>
            <strong>{departureDate}</strong>
          </div>
          <div className="nbm-preview-row">
            <span>Return Date</span>
            <strong>
              {(() => {
                const s    = new Date(departureDate);
                const days = getDurationDays(selectedPackage?.duration || '1D');
                s.setDate(s.getDate() + days - 1);
                return s.toISOString().split('T')[0];
              })()}
            </strong>
          </div>
          <div className="nbm-preview-row">
            <span>Number of Pax</span>
            <strong>
              {paxCount}{isSoloPkg ? ' (Solo)' : isMinTwoPkg ? ' (Min 2)' : ''}
            </strong>
          </div>
        </div>

        {/* Passengers */}
        <div className="nbm-preview-section">
          <div className="nbm-preview-section-title">
            <Users size={18} /> Passengers ({formData.passengers.length})
          </div>
          {formData.passengers.map((p, i) => (
            <div key={i} className="nbm-preview-passenger">
              <strong>Passenger {i + 1}:</strong> {p.firstName} {p.lastName}
              {p.phone && <span style={{ marginLeft: 12, color: '#64748b' }}>• {p.phone}</span>}
            </div>
          ))}
        </div>

        {/* Accommodation */}
        {selectedRoomType && (
          <div className="nbm-preview-section">
            <div className="nbm-preview-section-title">
              <Bed size={18} /> Accommodation
            </div>
            <div className="nbm-preview-row">
              <span>Room Type</span>
              <strong>{selectedRoomType.type}</strong>
            </div>
          </div>
        )}

        {/* Add-Ons */}
        {(selectedTourAddOns.length > 0 || selectedTransferAddOns.length > 0) && (
          <div className="nbm-preview-section">
            <div className="nbm-preview-section-title">🎭 Add-Ons</div>

            {selectedTourAddOns.map(t => (
              <div key={t._id} className="nbm-preview-row">
                <span>🗺️ {t.title} × {paxCount} pax</span>
                <strong>₱{((t.price || 0) * paxCount).toLocaleString()}</strong>
              </div>
            ))}

            {selectedTransferAddOns.map(t => {
              const type  = transferTypes[t._id] || 'oneway';
              const price = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
              return (
                <div key={t._id} className="nbm-preview-row">
                  <span>🚐 {t.title} ({type === 'roundtrip' ? 'Roundtrip' : 'One Way'})</span>
                  <strong>₱{price.toLocaleString()}</strong>
                </div>
              );
            })}

            <div className="nbm-preview-row" style={{ fontWeight: 700, color: '#f59e0b' }}>
              <span>Add-Ons Subtotal</span>
              <span>₱{calculateAddOnsTotal().toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="nbm-preview-section">
          <div className="nbm-preview-section-title">
            <CreditCard size={18} /> Payment Summary
          </div>
          <div className="nbm-preview-row">
            <span>Package Total</span>
            <span>₱{calculateBasePackageTotal().toLocaleString()}</span>
          </div>

          {appliedPromo && (
            <div className="nbm-preview-row" style={{ color: '#10b981' }}>
              <span>- Promo ({appliedPromo.code})</span>
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

          {/* Big Total */}
          <div className="nbm-preview-total">
            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
              {formData.paymentType === 'partial' ? 'INITIAL PAYMENT DUE NOW' : 'TOTAL AMOUNT'}
            </div>
            <div className="nbm-due-now">
              ₱{payableAmount.toLocaleString()}
            </div>
            {formData.paymentType === 'partial' && (
              <p style={{ marginTop: 8, color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>
                50% deposit • Balance ₱{(computeFinalTotal() - payableAmount).toLocaleString()} due before departure
              </p>
            )}
          </div>
        </div>

      </div>

      {/* Footer Buttons */}
      <div style={{
        padding: '24px 32px', borderTop: '1px solid #e2e8f0',
        display: 'flex', gap: '12px', background: '#fff',
      }}>
        <button
          onClick={onClose}
          className="nbm-btn nbm-btn-back"
          style={{ flex: 1 }}
        >
          ← Back to Edit
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="nbm-btn nbm-btn-next"
          style={{ flex: 1 }}
        >
          {loading ? 'Creating Booking...' : '✅ Confirm & Create Booking'}
        </button>
      </div>

    </div>
  </div>
);

export default BookingPreviewModal;
