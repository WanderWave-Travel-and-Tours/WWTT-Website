import React from 'react';
import { X, Users, MapPin, CreditCard, Car } from 'lucide-react';
import { isLateNightTime } from '../utils/transferHelpers';

const BookingPreviewModal = ({
  passengers, destination, selectedTransfer,
  tripType, paxCount, travelDate, arrivalTime,
  pickupLocation, returnDate, departureTime, dropoffLocation,
  sellingPrice, arrivalSurcharge, departureSurcharge,
  paymentType, totalAmount, initialPaymentAmount, remainingBalance,
  loading, onClose, onConfirm,
}) => {
  const primaryPax = passengers[0];

  return (
    <div className="nbm-preview-overlay">
      <div className="nbm-preview-modal">

        {/* Header */}
        <div className="nbm-preview-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="nbm-preview-header-icon">
              <Car size={18} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em' }}>
                Transfer Booking Preview
              </h2>
              <p style={{ margin: 0, opacity: 0.65, fontSize: '0.82rem', marginTop: 2 }}>
                Please review all details before confirming
              </p>
            </div>
          </div>
          <button onClick={onClose} className="nbm-preview-close-btn">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="nbm-preview-body">

          {/* Customer Information */}
          <div className="nbm-preview-section">
            <div className="nbm-preview-section-title">
              <span className="nbm-preview-section-icon"><Users size={14} /></span>
              Customer Information
            </div>
            <div className="nbm-preview-card">
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">Name</span>
                <strong className="nbm-preview-value">{primaryPax.firstName} {primaryPax.lastName}</strong>
              </div>
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">Email</span>
                <strong className="nbm-preview-value">{primaryPax.email}</strong>
              </div>
              <div className="nbm-preview-row nbm-preview-row-last">
                <span className="nbm-preview-label">Phone</span>
                <strong className="nbm-preview-value">{primaryPax.phone}</strong>
              </div>
            </div>
          </div>

          {/* Trip Details */}
          <div className="nbm-preview-section">
            <div className="nbm-preview-section-title">
              <span className="nbm-preview-section-icon"><MapPin size={14} /></span>
              Trip Details
            </div>
            <div className="nbm-preview-card">
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">Destination</span>
                <strong className="nbm-preview-value">{destination}</strong>
              </div>
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">Transfer</span>
                <strong className="nbm-preview-value">{selectedTransfer?.title || '—'}</strong>
              </div>
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">Trip Type</span>
                <span className={`nbm-preview-type-badge ${tripType === 'roundtrip' ? 'roundtrip' : 'oneway'}`}>
                  {tripType === 'roundtrip' ? 'Roundtrip' : 'One Way'}
                </span>
              </div>
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">Passengers</span>
                <strong className="nbm-preview-value">{paxCount} pax</strong>
              </div>
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">Travel Date</span>
                <strong className="nbm-preview-value">{travelDate}</strong>
              </div>
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">Arrival Time</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong className="nbm-preview-value">{arrivalTime}</strong>
                  {isLateNightTime(arrivalTime) && (
                    <span className="nbm-preview-latenight-badge">Late Night</span>
                  )}
                </span>
              </div>
              <div className={`nbm-preview-row${tripType !== 'roundtrip' ? ' nbm-preview-row-last' : ''}`}>
                <span className="nbm-preview-label">Pickup Location</span>
                <strong className="nbm-preview-value nbm-preview-value-location">{pickupLocation}</strong>
              </div>
              {tripType === 'roundtrip' && (
                <>
                  <div className="nbm-preview-row">
                    <span className="nbm-preview-label">Return Date</span>
                    <strong className="nbm-preview-value">{returnDate}</strong>
                  </div>
                  <div className="nbm-preview-row">
                    <span className="nbm-preview-label">Departure Time</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <strong className="nbm-preview-value">{departureTime}</strong>
                      {isLateNightTime(departureTime) && (
                        <span className="nbm-preview-latenight-badge">Late Night</span>
                      )}
                    </span>
                  </div>
                  <div className="nbm-preview-row nbm-preview-row-last">
                    <span className="nbm-preview-label">Dropoff Location</span>
                    <strong className="nbm-preview-value nbm-preview-value-location">{dropoffLocation}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Passengers */}
          <div className="nbm-preview-section">
            <div className="nbm-preview-section-title">
              <span className="nbm-preview-section-icon"><Users size={14} /></span>
              Passengers ({passengers.length})
            </div>
            <div className="nbm-preview-card nbm-preview-card-flush">
              {passengers.map((p, i) => (
                <div key={i} className={`nbm-preview-passenger-row${i === passengers.length - 1 ? ' last' : ''}`}>
                  <div className="nbm-preview-pax-num">{i + 1}</div>
                  <div className="nbm-preview-pax-info">
                    <span className="nbm-preview-pax-name">{p.firstName} {p.lastName}</span>
                    {p.phone  && <span className="nbm-preview-pax-phone">{p.phone}</span>}
                    {p.gender && <span className="nbm-preview-pax-gender">{p.gender}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Summary */}
          <div className="nbm-preview-section">
            <div className="nbm-preview-section-title">
              <span className="nbm-preview-section-icon"><CreditCard size={14} /></span>
              Payment Summary
            </div>
            <div className="nbm-preview-card">
              <div className="nbm-preview-row">
                <span className="nbm-preview-label">
                  Transfer Price ({tripType === 'roundtrip' ? 'Roundtrip' : 'One Way'})
                </span>
                <strong className="nbm-preview-value">₱{sellingPrice.toLocaleString()}</strong>
              </div>
              {arrivalSurcharge > 0 && (
                <div className="nbm-preview-row">
                  <span className="nbm-preview-label">Late Night Surcharge (Arrival)</span>
                  <strong className="nbm-preview-value" style={{ color: '#dc2626' }}>
                    +₱{arrivalSurcharge.toLocaleString()}
                  </strong>
                </div>
              )}
              {departureSurcharge > 0 && (
                <div className="nbm-preview-row">
                  <span className="nbm-preview-label">Late Night Surcharge (Departure)</span>
                  <strong className="nbm-preview-value" style={{ color: '#dc2626' }}>
                    +₱{departureSurcharge.toLocaleString()}
                  </strong>
                </div>
              )}
              <div className="nbm-preview-row nbm-preview-row-last">
                <span className="nbm-preview-label">Payment Type</span>
                <span className="nbm-preview-value">
                  {paymentType === 'partial' ? 'Partial (50% Deposit)' : 'Full Payment'}
                </span>
              </div>
            </div>

            {/* Total Box */}
            <div className="nbm-preview-total">
              <div className="nbm-preview-total-label">
                {paymentType === 'partial' ? 'Initial Payment Due Now' : 'Total Amount'}
              </div>
              <div className="nbm-due-now">₱{initialPaymentAmount.toLocaleString()}</div>
              {paymentType === 'partial' && (
                <div className="nbm-preview-balance-note">
                  50% deposit &mdash; Balance of ₱{remainingBalance.toLocaleString()} due before travel date
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="nbm-preview-footer">
          <button onClick={onClose} className="nbm-btn nbm-btn-back">
            Back to Edit
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="nbm-btn nbm-btn-next nbm-preview-confirm-btn"
          >
            {loading ? 'Creating Booking...' : 'Confirm & Create Booking'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default BookingPreviewModal;
