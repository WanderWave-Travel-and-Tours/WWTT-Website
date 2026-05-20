import React from 'react';
import { MapPin, Calendar, Users, CreditCard } from 'lucide-react';

const NtbmStep2 = ({
  passengers,
  selectedDestination,
  selectedTour,
  departureDate,
  paxCount,
  paymentType,
  tourPrice,
  packageTotal,
  initialPaymentAmount,
  payableAmount,
  computeEndDate,
}) => (
  <>
    <h3 className="ntbm-step-title">Tour Booking Preview</h3>
    <p className="ntbm-step-subtitle">Please review all details before confirming.</p>

    {/* Customer Information */}
    <div className="ntbm-preview-section">
      <div className="ntbm-preview-section-title">👤 Customer Information</div>
      <div className="ntbm-preview-row">
        <span>Full Name</span>
        <strong>
          {`${passengers[0]?.firstName || ''} ${passengers[0]?.lastName || ''}`.trim() || '—'}
        </strong>
      </div>
      {passengers[0]?.email && (
        <div className="ntbm-preview-row">
          <span>Email</span>
          <strong>{passengers[0].email}</strong>
        </div>
      )}
      <div className="ntbm-preview-row">
        <span>Phone</span>
        <strong>{passengers[0]?.phone || '—'}</strong>
      </div>
    </div>

    {/* Trip Details */}
    <div className="ntbm-preview-section">
      <div className="ntbm-preview-section-title">
        <MapPin size={16} /> Trip Details
      </div>
      <div className="ntbm-preview-row">
        <span>Destination</span>
        <strong>{selectedDestination}</strong>
      </div>
      <div className="ntbm-preview-row">
        <span>Tour Package</span>
        <strong>{selectedTour?.title || selectedTour?.name || '—'}</strong>
      </div>
      {selectedTour?.tourType && (
        <div className="ntbm-preview-row">
          <span>Tour Type</span>
          <strong style={{ textTransform: 'capitalize' }}>{selectedTour.tourType}</strong>
        </div>
      )}
      {selectedTour?.duration && (
        <div className="ntbm-preview-row">
          <span>Duration</span>
          <strong>{selectedTour.duration}</strong>
        </div>
      )}
      <div className="ntbm-preview-row">
        <span>
          <Calendar size={14} style={{ display: 'inline', marginRight: 4 }} />
          Departure
        </span>
        <strong>{departureDate}</strong>
      </div>
      <div className="ntbm-preview-row">
        <span>Return Date</span>
        <strong>{computeEndDate()}</strong>
      </div>
      <div className="ntbm-preview-row">
        <span>Number of Pax</span>
        <strong>{paxCount}</strong>
      </div>
    </div>

    {/* Passengers */}
    <div className="ntbm-preview-section">
      <div className="ntbm-preview-section-title">
        <Users size={16} /> Passengers ({passengers.length})
      </div>
      {passengers.map((p, i) => (
        <div key={i} className="ntbm-preview-passenger">
          <strong>Passenger {i + 1}:</strong> {p.firstName} {p.lastName}
          {p.phone && (
            <span style={{ marginLeft: 12, color: '#64748b' }}>• {p.phone}</span>
          )}
          {p.age && (
            <span style={{ marginLeft: 12, color: '#94a3b8', fontSize: '0.85rem' }}>
              • {p.age} yrs
            </span>
          )}
        </div>
      ))}
    </div>

    {/* Payment Summary */}
    <div className="ntbm-preview-section">
      <div className="ntbm-preview-section-title">
        <CreditCard size={16} /> Payment Summary
      </div>
      <div className="ntbm-preview-row">
        <span>Tour Price per Pax</span>
        <span>₱{tourPrice.toLocaleString()}</span>
      </div>
      <div className="ntbm-preview-row">
        <span>Total ({paxCount} pax)</span>
        <span>₱{packageTotal.toLocaleString()}</span>
      </div>
      <div className="ntbm-preview-row">
        <span>Payment Type</span>
        <span style={{ textTransform: 'capitalize' }}>
          {paymentType === 'full' ? 'Pay in Full' : 'Partial (50% deposit)'}
        </span>
      </div>

      {/* Total box */}
      <div className="ntbm-preview-total-box">
        <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
          {paymentType === 'partial' ? 'INITIAL PAYMENT DUE NOW' : 'TOTAL AMOUNT'}
        </div>
        <div className="ntbm-preview-due-now">
          ₱{payableAmount.toLocaleString()}
        </div>
        {paymentType === 'partial' && (
          <p style={{ marginTop: 8, color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>
            50% deposit • Balance ₱{(packageTotal - initialPaymentAmount).toLocaleString()} due before departure
          </p>
        )}
      </div>
    </div>
  </>
);

export default NtbmStep2;
