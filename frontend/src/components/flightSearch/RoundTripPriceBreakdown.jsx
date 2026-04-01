// src/components/flightSearch/RoundTripPriceBreakdown.jsx
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import FlightBookingModal from './flightBookingModal';
import './RoundTripPriceBreakdown.css';

const RoundTripPriceBreakdown = ({ outbound, returnFlight, searchParams, onClose, onContinue }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const outboundAmount = outbound?.price?.amount || 0;
  const returnAmount = returnFlight?.price?.amount || 0;
  const total = outboundAmount + returnAmount;

  const combinedFlight = {
    ...outbound,
    price: {
      ...outbound?.price,
      amount: total,
      formatted: `₱${total.toLocaleString()}`,
      outboundPrice: outboundAmount,
      returnPrice: returnAmount,
    },
    roundTripOutbound: outbound,
    roundTripReturn: returnFlight,
    type: 'Round-Trip',
  };

  const handleContinueToBooking = (e) => {
    // Stop click from bubbling up to the overlay's onClose
    e.stopPropagation();
    if (onContinue) onContinue();
    setShowBookingModal(true);
  };

  // Once booking modal is open, render ONLY the booking modal (breakdown unmounts cleanly)
  if (showBookingModal) {
    return ReactDOM.createPortal(
      <FlightBookingModal
        flight={combinedFlight}
        searchParams={searchParams}
        onClose={() => {
          setShowBookingModal(false);
          onClose();
        }}
      />,
      document.body
    );
  }

  return ReactDOM.createPortal(
    <div className="price-breakdown-overlay" onClick={onClose}>
      <div className="price-breakdown-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Round-Trip Price Breakdown</h3>
          <button className="rt-close-btn" onClick={onClose} aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="breakdown-content">
          {/* Departure leg */}
          <div className="leg-row">
            <div className="leg-info">
              <span className="leg-type">Departure</span>
              <span className="leg-route">
                {outbound?.departure?.iataCode} → {outbound?.arrival?.iataCode}
              </span>
              <small className="cheapest-note">
                {outbound?.airline?.name} · {outbound?.departure?.time || outbound?.departure?.displayTime || '—'}
              </small>
            </div>
            <div className="leg-price">₱{outboundAmount.toLocaleString()}</div>
          </div>

          {/* Return leg */}
          <div className="leg-row">
            <div className="leg-info">
              <span className="leg-type">Return</span>
              <span className="leg-route">
                {returnFlight?.departure?.iataCode} → {returnFlight?.arrival?.iataCode}
              </span>
              <small className="cheapest-note">
                {returnFlight?.airline?.name} · {returnFlight?.departure?.time || returnFlight?.departure?.displayTime || '—'}
              </small>
            </div>
            <div className="leg-price">₱{returnAmount.toLocaleString()}</div>
          </div>

          <div className="divider"></div>

          <div className="total-row">
            <div className="total-label">Total Round-Trip Price</div>
            <div className="total-price">₱{total.toLocaleString()}</div>
          </div>

          <button className="book-now-btn" onClick={handleContinueToBooking}>
            Continue to Booking
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RoundTripPriceBreakdown;