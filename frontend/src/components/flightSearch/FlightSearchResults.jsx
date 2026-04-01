import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import FlightBookingModal from './flightBookingModal';
import RoundTripPriceBreakdown from './RoundTripPriceBreakdown';
import './FlightSearchResults.css';

// ─── Individual Flight Card ───────────────────────────────────────────────────

const FlightCard = ({ flight, searchParams, onFlightSelect, roundTripStep, onOutboundSelect, onReturnSelect }) => {
  const [showBookingModal, setShowBookingModal] = useState(false);

  const isRoundTrip = searchParams?.journeyType === 'round-trip';

  const handleBookClick = () => {
    if (isRoundTrip) {
      if (roundTripStep === 1) {
        onOutboundSelect(flight);
      } else if (roundTripStep === 2) {
        onReturnSelect(flight);
      }
    } else {
      setShowBookingModal(true);
    }
  };

  const getBookBtnLabel = () => {
    if (isRoundTrip && roundTripStep === 1) return 'Select as Departure ✈';
    if (isRoundTrip && roundTripStep === 2) return 'Select as Return ✈';
    return 'Book Now';
  };

  return (
    <div className="flight-card">

      {/* ── TOP MAIN SECTION ── */}
      <div className="flight-main">

        {/* LEFT — Airline */}
        <div className="airline-section">
          <div className="airline-logo-wrapper">
            {flight.airline?.logo
              ? <img
                  src={flight.airline.logo}
                  alt={flight.airline.name}
                  className="airline-logo-img"
                  onError={e => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              : null
            }
            <div
              className="airline-logo-placeholder"
              style={{ display: flight.airline?.logo ? 'none' : 'flex' }}
            >
              ✈️
            </div>
          </div>
          <span className="airline-name">{flight.airline?.name || 'Unknown Airline'}</span>
        </div>

        {/* CENTER — Route */}
        <div className="flight-details">

          {/* Departure */}
          <div className="flight-time-info">
            <div className="time-large">
              {flight.departure?.time || flight.departure?.displayTime || '—'}
            </div>
            <div className="airport-code">{flight.departure?.iataCode}</div>
          </div>

          {/* Duration line */}
          <div className="flight-duration-info">
            <span className="duration-text">{flight.duration}</span>
            <div className="flight-line">
              <div className="dot-start"></div>
              <div className="line-bar"></div>
              <span className="plane-icon-center">✈</span>
              <div className="dot-end"></div>
            </div>
            <span className={`stops-text ${flight.stops === 0 ? 'nonstop' : ''}`}>
              {flight.stops === 0 ? 'Nonstop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Arrival */}
          <div className="flight-time-info">
            <div className="time-large">
              {flight.arrival?.time || flight.arrival?.displayTime || '—'}
            </div>
            <div className="airport-code">{flight.arrival?.iataCode}</div>
          </div>
        </div>

        {/* RIGHT — Pricing */}
        <div className="flight-pricing">
          <div className="price-amount">
            {flight.price?.formatted || `₱${(flight.price?.amount || 0).toLocaleString()}`}
          </div>
          <div className="price-label">
            ₱{(flight.price?.perPerson || 0).toLocaleString()} / person
            {(flight.price?.totalPassengers || 1) > 1 && (
              <> · {flight.price.totalPassengers} pax</>
            )}
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="flight-footer">
        <div className="quality-badge">
          <span className="star">★</span>
          {flight.cabinClass || 'Economy'}
          &nbsp;·&nbsp;
          {flight.type || 'One-Way'}
        </div>

        <button
          className="book-btn"
          onClick={handleBookClick}
        >
          {getBookBtnLabel()}
        </button>
      </div>

      {/* ── Booking Modal (only for non-round-trip) ── */}
      {showBookingModal && (
        <FlightBookingModal
          flight={flight}
          searchParams={searchParams}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};

// ─── Results Container ────────────────────────────────────────────────────────

const FlightSearchResults = ({
  searchInfo,
  flights,
  error,
  loading,
  searchParams,
  onFlightSelect,
  roundTripStep,
  selectedOutbound,
  onOutboundSelect,
  onReturnSelect,
}) => {

  if (loading) {
    return (
      <div className="results-section">
        <div className="results-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Searching for the best flights…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="results-section">
        <div className="results-content">
          <div className="error-banner">
            <div className="error-icon">!</div>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

    if (!flights || flights.length === 0) {
    return (
      <div className="results-section">
        <div className="results-content">
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '60px 40px',
            maxWidth: '560px',
            margin: '80px auto 0',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ fontSize: '78px', marginBottom: '20px' }}>🌍</div>
            <h3 style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: '8px'
            }}>
              Start searching for flights
            </h3>
            <p style={{
              color: '#64748b',
              fontSize: '1.05rem',
              lineHeight: 1.5
            }}>
              Search airports worldwide — Philippines, USA, Europe, Asia, and more!
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isRoundTrip = searchParams?.journeyType === 'round-trip';

  return (
    <div className="results-section">
      <div className="results-content">

        {/* ── Search Summary Banner ── */}
        {searchInfo && (
          <div className="search-success-banner">
            <div className="banner-left">
              <div className="route-header">
                <div className="plane-icon-box">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                  </svg>
                </div>
                <h2 className="route-text">
                  {searchInfo.routeInfo?.origin}
                  <span className="arrow">→</span>
                  {searchInfo.routeInfo?.destination}
                </h2>
              </div>
              <div className="route-subtext">
                <span className="check-icon">✓</span>
                {(searchInfo.disclaimer || `${searchInfo.count} flights found`).replace(/^[\u2713\u2714\u2611\u2705✓✔☑✅]\s*/, '')}
              </div>
            </div>

            <div className="banner-right">
              <div className="stat-box">
                <span className="stat-label">Flights</span>
                <span className="stat-value">{searchInfo.count}</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-box">
                <span className="stat-label">From</span>
                <span className="stat-value highlight-price">
                  ₱{(searchInfo.pricingInfo?.pricePerAdult || 0).toLocaleString()}
                </span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-box">
                <span className="stat-label">Pax</span>
                <span className="stat-value">{searchInfo.pricingInfo?.passengers || 1}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Round-Trip Step Banner ── */}
        {isRoundTrip && roundTripStep === 1 && (
          <div className="round-trip-notice">
            <div className="rt-steps-header">
              <div className="rt-step-pill active">
                <span className="rt-step-num">1</span>
                <span className="rt-step-label">Departure</span>
              </div>
              <div className="rt-step-connector"></div>
              <div className="rt-step-pill">
                <span className="rt-step-num">2</span>
                <span className="rt-step-label">Return</span>
              </div>
            </div>
            <p className="rt-step-desc">
              Select your <strong>departure flight</strong> below. Your return options will appear next.
            </p>
          </div>
        )}

        {isRoundTrip && roundTripStep === 2 && (
          <div className="round-trip-notice">
            <div className="rt-steps-header">
              <div className="rt-step-pill done">
                <span className="rt-step-num">✓</span>
                <span className="rt-step-label">Departure</span>
              </div>
              <div className="rt-step-connector filled"></div>
              <div className="rt-step-pill active">
                <span className="rt-step-num">2</span>
                <span className="rt-step-label">Return</span>
              </div>
            </div>
            <p className="rt-step-desc">
              Now select your <strong>return flight</strong>.
              {selectedOutbound && (
                <span className="rt-outbound-info">
                  Departure: {selectedOutbound.departure?.iataCode} → {selectedOutbound.arrival?.iataCode}
                  {' '}(₱{(selectedOutbound.price?.amount || 0).toLocaleString()})
                </span>
              )}
            </p>
          </div>
        )}

        {/* ── Flight Cards ── */}
        <div className="flight-results">
          {flights.map((flight, index) => (
            <FlightCard
              key={flight.id || `flight-${index}`}
              flight={flight}
              searchParams={searchParams}
              onFlightSelect={onFlightSelect}
              roundTripStep={roundTripStep}
              onOutboundSelect={onOutboundSelect}
              onReturnSelect={onReturnSelect}
            />
          ))}
        </div>

      </div>
    </div>
  );
};

export default FlightSearchResults;