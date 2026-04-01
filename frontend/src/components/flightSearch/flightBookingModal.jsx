import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import axios from 'axios';
import { useToast } from '../toast/ToastManager';
import './flightBookingModal.css';

const FlightBookingModal = ({ flight, searchParams, onClose }) => {
  const toast = useToast();

  // ── Detect round-trip combined booking ──
  const isRoundTrip = flight?.type === 'Round-Trip' && flight?.roundTripOutbound && flight?.roundTripReturn;
  const outboundFlight = isRoundTrip ? flight.roundTripOutbound : flight;
  const returnFlight   = isRoundTrip ? flight.roundTripReturn   : null;
  const totalPrice     = isRoundTrip
    ? (outboundFlight?.price?.amount || 0) + (returnFlight?.price?.amount || 0)
    : (flight?.price?.amount || 0);

  const totalPax = parseInt(searchParams.adults) + parseInt(searchParams.children) + parseInt(searchParams.infants);
  const [loading, setLoading]                 = useState(false);
  const [formUnlocked, setFormUnlocked]       = useState(!isRoundTrip);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [currentSlide, setCurrentSlide]       = useState(0);
  // ── Mobile: track which panel is visible ──
  const [mobilePanel, setMobilePanel]         = useState('left'); // 'left' | 'right'
  const totalSlides = totalPax;

  const [contactInfo, setContactInfo] = useState({
    fullName: '', email: '', phone: '', address: '', nationality: 'Filipino', age: ''
  });

  const getAdditionalPassengerTypes = () => {
    let types = [];
    for (let i = 0; i < parseInt(searchParams.adults); i++) types.push('Adult');
    for (let i = 0; i < parseInt(searchParams.children); i++) types.push('Child');
    for (let i = 0; i < parseInt(searchParams.infants); i++) types.push('Infant');
    const bookerIndex = types.indexOf('Adult');
    if (bookerIndex > -1) types.splice(bookerIndex, 1);
    return types;
  };

  const [additionalPassengers, setAdditionalPassengers] = useState(
    getAdditionalPassengerTypes().map((type) => ({
      firstName: '', lastName: '', nationality: 'Filipino', age: '', email: '', contactNumber: '', type
    }))
  );

  const handleContactChange = (e) => setContactInfo({ ...contactInfo, [e.target.name]: e.target.value });

  const handlePassengerChange = (index, field, value) => {
    const updated = [...additionalPassengers];
    updated[index][field] = value;
    setAdditionalPassengers(updated);
  };

  // ── Fade-out locked → fade-in form ──
  const handleContinueToBooking = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setFormUnlocked(true);
      setIsTransitioning(false);
      setMobilePanel('right');
    }, 340);
  };

  const validateCurrentSlide = () => {
    if (currentSlide === 0) {
      if (!contactInfo.fullName.trim() || !contactInfo.email.trim() || !contactInfo.phone.trim() || !contactInfo.address.trim() || !contactInfo.age) {
        toast.error('Please fill in all required fields before proceeding.', 'Missing Fields');
        return false;
      }
    } else {
      const p = additionalPassengers[currentSlide - 1];
      if (!p.firstName.trim() || !p.lastName.trim() || !p.nationality.trim() || !p.age) {
        toast.error('Please fill in all required fields before proceeding.', 'Missing Fields');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateCurrentSlide() && currentSlide < totalSlides - 1) setCurrentSlide(currentSlide + 1);
  };

  const handleBack = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentSlide()) return;
    setLoading(true);

    const nameParts = contactInfo.fullName.trim().split(' ');
    const lastName  = nameParts.length > 1 ? nameParts.pop() : '.';
    const firstName = nameParts.join(' ');

    const primaryPassenger = {
      firstName: firstName || contactInfo.fullName, lastName,
      nationality: contactInfo.nationality, age: parseInt(contactInfo.age) || 0,
      email: contactInfo.email, contactNumber: contactInfo.phone, type: 'Adult (Primary)'
    };

    const allPassengers = [primaryPassenger, ...additionalPassengers];

    let flightDetails;
    if (isRoundTrip) {
      flightDetails = {
        type: 'round-trip',
        outbound: {
          origin: outboundFlight.departure.iataCode, destination: outboundFlight.arrival.iataCode,
          departureDate: outboundFlight.departure.time, arrivalDate: outboundFlight.arrival.time,
          airline: outboundFlight.airline.name, flightNumber: outboundFlight.airline.flightNumber || 'N/A',
          duration: outboundFlight.duration, stops: outboundFlight.stops, price: outboundFlight.price.amount,
        },
        return: {
          origin: returnFlight.departure.iataCode, destination: returnFlight.arrival.iataCode,
          departureDate: returnFlight.departure.time, arrivalDate: returnFlight.arrival.time,
          airline: returnFlight.airline.name, flightNumber: returnFlight.airline.flightNumber || 'N/A',
          duration: returnFlight.duration, stops: returnFlight.stops, price: returnFlight.price.amount,
        },
        totalAmount: totalPrice, cabinClass: searchParams.cabinType,
      };
    } else {
      flightDetails = {
        origin: flight.departure.iataCode, destination: flight.arrival.iataCode,
        departureDate: flight.departure.time, arrivalDate: flight.arrival.time,
        airline: flight.airline.name, flightNumber: flight.airline.flightNumber || 'N/A',
        cabinClass: searchParams.cabinType, duration: flight.duration, stops: flight.stops,
      };
    }

    const bookingData = {
      serviceName: 'Airline Booking', inquiryType: 'FLIGHT_BOOKING',
      fullName: contactInfo.fullName, email: contactInfo.email,
      contactNumber: contactInfo.phone, address: contactInfo.address,
      message: isRoundTrip
        ? `Round-Trip Booking: ${outboundFlight.departure.iataCode} ↔ ${outboundFlight.arrival.iataCode}`
        : `Flight Booking Request: ${flight.departure.iataCode} to ${flight.arrival.iataCode} on ${flight.departure.time}`,
      estimatedPrice: totalPrice, flightDetails, passengers: allPassengers,
    };

    console.log("Submitting Booking Data:", JSON.stringify(bookingData, null, 2));

    try {
      const res = await axios.post('https://wanderwaveph.onrender.com/api/inquiries', bookingData, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.data.success) {
        toast.success('Your booking request has been submitted successfully. Please check your email for confirmation.', 'Booking Confirmed', 5000);
        setTimeout(() => onClose(), 1500);
      } else {
        toast.error(res.data.message || 'Unable to process your booking request. Please try again.', 'Booking Failed');
      }
    } catch (error) {
      console.error("Booking Error:", error);
      const msg = error.response?.data?.message || error.message || "Unknown error";
      toast.error(`Failed to submit booking request. ${msg}`, 'Error Occurred', 6000);
    } finally {
      setLoading(false);
    }
  };

  const priceLabel = `₱${totalPrice.toLocaleString()}`;
  const summaryLabel = isRoundTrip ? 'Total Round-Trip' : 'Total Price';

  // ── Inline SVG icons ──
  const IcUser    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  const IcMail    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>;
  const IcPhone   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.29 6.29l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
  const IcPin     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>;
  const IcGlobe   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
  const IcCalendar= () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;

  // ── Reusable field ──
  const BmField = ({ label, optional, icon, children }) => (
    <div className="bm-form-group">
      <label className="bm-label">
        {label}{optional && <span className="bm-optional"> (Optional)</span>}
      </label>
      <div className="bm-input-wrap">
        {icon && <span className="bm-field-icon">{icon}</span>}
        {children}
      </div>
    </div>
  );

  // ── Left panel leg card ──
  const formatLegDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const LegCard = ({ badge, badgeClass, depCode, arrCode, airline, time, date, price, planeColor }) => {
    const formattedDate = formatLegDate(date);
    const dateTime = [formattedDate, time].filter(Boolean).join(' · ');
    return (
      <div className="bm-leg-card">
        <div className="bm-leg-card-header-row">
          <span className={`bm-leg-badge ${badgeClass}`}>{badge}</span>
        </div>
        <div className="bm-leg-route-strip">
          <span className="bm-leg-iata">{depCode}</span>
          <div className="bm-route-visual">
            <div className="bm-route-dot" />
            <div className="bm-route-dashes" />
            <svg width="13" height="13" viewBox="0 0 24 24" fill={planeColor || '#fc9c1b'}>
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
            </svg>
            <div className="bm-route-dashes" />
            <div className="bm-route-dot" />
          </div>
          <span className="bm-leg-iata">{arrCode}</span>
        </div>
        <div className="bm-leg-footer">
          <div className="bm-leg-meta-group">
            <span className="bm-leg-meta">{airline}</span>
            {dateTime && <span className="bm-leg-datetime">{dateTime}</span>}
          </div>
          <span className="bm-leg-price-tag">₱{price.toLocaleString()}</span>
        </div>
      </div>
    );
  };


  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className={`booking-modal bm-two-panel bm-mobile-${mobilePanel}`}>

        {/* ══════════════════════════════════════
            CLOSE BUTTON — top-right of the whole modal
        ══════════════════════════════════════ */}
        <button className="bm-close-btn" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* ══════════════════════════════════════
            LEFT PANEL — Breakdown
        ══════════════════════════════════════ */}
        <div className="bm-left">

          <div className="bm-left-header">
            {/* Plane icon — always shown, no airline logo */}
            <div className="bm-left-plane-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
            </div>
            <h2 className="bm-left-title">
              {isRoundTrip ? 'Round-Trip Summary' : 'Flight Summary'}
            </h2>
            <div className="bm-left-route">
              <span className="bm-route-iata">{outboundFlight?.departure?.iataCode}</span>
              <span className="bm-route-arrow">{isRoundTrip ? '↔' : '→'}</span>
              <span className="bm-route-iata">{outboundFlight?.arrival?.iataCode}</span>
            </div>
          </div>

          <div className="bm-left-body">
            {isRoundTrip ? (
              <>
                {/* ── Top group: leg cards + pax pills ── */}
                <div className="bm-left-top-group">
                  <LegCard
                    badge="Departure"
                    badgeClass="bm-badge-outbound"
                    depCode={outboundFlight.departure.iataCode}
                    arrCode={outboundFlight.arrival.iataCode}
                    airline={outboundFlight.airline.name}
                    time={outboundFlight.departure.time}
                    date={searchParams?.departureDate || outboundFlight?.departure?.date || null}
                    price={outboundFlight.price.amount || 0}
                    planeColor="#fc9c1b"
                  />
                  <LegCard
                    badge="Return"
                    badgeClass="bm-badge-return"
                    depCode={returnFlight.departure.iataCode}
                    arrCode={returnFlight.arrival.iataCode}
                    airline={returnFlight.airline.name}
                    time={returnFlight.departure.time}
                    date={searchParams?.returnDate || returnFlight?.departure?.date || null}
                    price={returnFlight.price.amount || 0}
                    planeColor="rgba(255,255,255,0.5)"
                  />

                  {/* ── Pax + Cabin highlighted pills ── */}
                  <div className="bm-pax-highlight-row">
                    <div className="bm-pax-pill">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      <span>{totalPax} Passenger{totalPax > 1 ? 's' : ''}</span>
                    </div>
                    <div className="bm-pax-pill">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                      </svg>
                      <span>{searchParams.cabinType || 'Economy'}</span>
                    </div>
                  </div>
                </div>

                {/* ── Total pinned to bottom ── */}
                <div className="bm-total-block">
                  <span className="bm-total-label">Total Round-Trip</span>
                  <span className="bm-total-price">{priceLabel}</span>
                </div>

                {/* ── Mobile-only Continue button ── */}
                <button
                  type="button"
                  className="bm-mobile-continue-btn"
                  onClick={handleContinueToBooking}
                >
                  Continue to Booking
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </>
            ) : (
              <>
                <LegCard
                  badge="One Way"
                  badgeClass="bm-badge-outbound"
                  depCode={flight.departure.iataCode}
                  arrCode={flight.arrival.iataCode}
                  airline={flight.airline.name}
                  time={flight.departure.time}
                  date={searchParams?.departureDate || flight?.departure?.date || null}
                  price={totalPrice}
                  planeColor="#fc9c1b"
                />
                <div className="bm-total-block">
                  <span className="bm-total-label">Total Price</span>
                  <span className="bm-total-price">{priceLabel}</span>
                </div>

                {/* ── Mobile-only Continue button ── */}
                <button
                  type="button"
                  className="bm-mobile-continue-btn"
                  onClick={() => setMobilePanel('right')}
                >
                  Continue to Booking
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════
            RIGHT PANEL — fixed size, no resize
        ══════════════════════════════════════ */}
        <div className="bm-right">

          {/* ── Mobile back button ── */}
          <button
            type="button"
            className="bm-mobile-back-btn"
            onClick={() => setMobilePanel('left')}
            aria-label="Back to summary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Back to Summary
          </button>

          {!formUnlocked && (
            <div className={`bm-locked-container${isTransitioning ? ' bm-fading-out' : ''}`}>
              {/* Skeleton preview */}
              <div className="bm-ghost-preview" aria-hidden="true">
                <div className="bm-ghost-title" />
                <div className="bm-ghost-field lg" />
                <div className="bm-ghost-row">
                  <div className="bm-ghost-field" />
                  <div className="bm-ghost-field sm" />
                </div>
                <div className="bm-ghost-field" />
                <div className="bm-ghost-field" />
                <div className="bm-ghost-field" />
              </div>

              {/* Lock overlay */}
              <div className="bm-lock-overlay">
                <div className="bm-lock-icon-wrap">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fc9c1b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
                <h3 className="bm-lock-title">Review Your Trip</h3>
                <p className="bm-lock-desc">
                  Check the price breakdown on the left, then proceed to fill in your passenger details.
                </p>
                <button type="button" className="bm-continue-btn" onClick={handleContinueToBooking}>
                  Continue to Booking
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                  </svg>
                </button>
              </div>
            </div>
          )}

          {formUnlocked && (
            <div className="bm-form-container bm-fading-in">

              <div className="bm-form-header">
                <h3 className="bm-form-title">Passenger Details</h3>
                {totalSlides > 1 && (
                  <p className="bm-form-subtitle">Fill in details for each passenger</p>
                )}
              </div>

              {/* Progress dots + counter on same row */}
              {totalSlides > 1 && (
                <div className="bm-progress-row">
                  <div className="bm-progress-dots">
                    {Array.from({ length: totalSlides }).map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={`bm-dot${i === currentSlide ? ' active' : ''}${i < currentSlide ? ' done' : ''}`}
                        onClick={() => i < currentSlide && setCurrentSlide(i)}
                        aria-label={`Passenger ${i + 1}`}
                      />
                    ))}
                  </div>
                  <span className="bm-slide-counter">{currentSlide + 1} / {totalSlides}</span>
                </div>
              )}

              {/* Sliding track */}
              <div className="bm-slides-wrapper">
                <div className="bm-slides-track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>

                  {/* Slide 0 — Primary */}
                  <div className="bm-slide">
                    <div className="bm-pax-label-row">
                      <span className="bm-pax-type-badge primary-badge">✈ Adult · Primary</span>
                    </div>
                    <BmField label="Full Name" icon={<IcUser />}>
                      <input type="text" name="fullName" className="bm-input" value={contactInfo.fullName}
                        onChange={handleContactChange} placeholder="e.g. Juan Dela Cruz" autoComplete="name" required />
                    </BmField>
                    <div className="bm-form-row">
                      <BmField label="Nationality" icon={<IcGlobe />}>
                        <input type="text" name="nationality" className="bm-input" value={contactInfo.nationality}
                          onChange={handleContactChange} placeholder="Filipino" required />
                      </BmField>
                      <div className="bm-form-group bm-narrow">
                        <label className="bm-label">Age</label>
                        <div className="bm-input-wrap">
                          <span className="bm-field-icon"><IcCalendar /></span>
                          <input type="number" name="age" className="bm-input bm-input-age" value={contactInfo.age}
                            onChange={handleContactChange} placeholder="—" min="1" required />
                        </div>
                      </div>
                    </div>
                    <BmField label="Email Address" icon={<IcMail />}>
                      <input type="email" name="email" className="bm-input" value={contactInfo.email}
                        onChange={handleContactChange} placeholder="juan@example.com" autoComplete="email" required />
                    </BmField>
                    <BmField label="Phone Number" icon={<IcPhone />}>
                      <input type="tel" name="phone" className="bm-input" value={contactInfo.phone}
                        onChange={handleContactChange} placeholder="0917 123 4567" autoComplete="tel" required />
                    </BmField>
                    <BmField label="Address" icon={<IcPin />}>
                      <input type="text" name="address" className="bm-input" value={contactInfo.address}
                        onChange={handleContactChange} placeholder="City, Province" required />
                    </BmField>
                  </div>

                  {/* Additional passenger slides */}
                  {additionalPassengers.map((p, i) => (
                    <div key={i} className="bm-slide">
                      <div className="bm-pax-label-row">
                        <span className="bm-pax-type-badge companion-badge">✈ Passenger {i + 2} · {p.type}</span>
                      </div>
                      <div className="bm-form-row">
                        <BmField label="First Name" icon={<IcUser />}>
                          <input className="bm-input" placeholder="First Name" value={p.firstName}
                            onChange={(e) => handlePassengerChange(i, 'firstName', e.target.value)} required />
                        </BmField>
                        <BmField label="Last Name" icon={<IcUser />}>
                          <input className="bm-input" placeholder="Last Name" value={p.lastName}
                            onChange={(e) => handlePassengerChange(i, 'lastName', e.target.value)} required />
                        </BmField>
                      </div>
                      <div className="bm-form-row">
                        <BmField label="Nationality" icon={<IcGlobe />}>
                          <input className="bm-input" placeholder="Nationality" value={p.nationality}
                            onChange={(e) => handlePassengerChange(i, 'nationality', e.target.value)} required />
                        </BmField>
                        <div className="bm-form-group bm-narrow">
                          <label className="bm-label">Age</label>
                          <div className="bm-input-wrap">
                            <span className="bm-field-icon"><IcCalendar /></span>
                            <input type="number" className="bm-input bm-input-age" placeholder="—" value={p.age} min="1"
                              onChange={(e) => handlePassengerChange(i, 'age', e.target.value)} required />
                          </div>
                        </div>
                      </div>
                      <BmField label="Email" optional icon={<IcMail />}>
                        <input type="email" className="bm-input" placeholder="Email Address" value={p.email}
                          onChange={(e) => handlePassengerChange(i, 'email', e.target.value)} />
                      </BmField>
                      <BmField label="Phone" optional icon={<IcPhone />}>
                        <input type="tel" className="bm-input" placeholder="Phone Number" value={p.contactNumber}
                          onChange={(e) => handlePassengerChange(i, 'contactNumber', e.target.value)} />
                      </BmField>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="bm-form-nav">
                {currentSlide > 0 && (
                  <button type="button" className="bm-nav-back" onClick={handleBack}>
                    ← Back
                  </button>
                )}
                {currentSlide < totalSlides - 1 ? (
                  <button type="button" className="bm-nav-next" onClick={handleNext}>Next →</button>
                ) : (
                  <button type="button" className="bm-nav-submit" onClick={handleSubmit} disabled={loading}>
                    {loading ? 'Processing…' : `Submit Booking · ${priceLabel}`}
                  </button>
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
};

export default FlightBookingModal;