import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Calendar, MapPin, CreditCard, Wallet } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import './newTourBookingModal.css';
import './PaymentOption.css';

const API_BASE = 'https://wanderwaveph.onrender.com';

const NewTourBookingModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Tours + destinations
  const [allTours, setAllTours] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [filteredTours, setFilteredTours] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedTour, setSelectedTour] = useState(null);

  // Destination searchable dropdown
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const destRef = useRef(null);

  // Trip config — separate pax type counters
  const [adultCount,  setAdultCount]  = useState(1);
  const [childCount,  setChildCount]  = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  const [departureDate, setDepartureDate] = useState('');

  // Payment
  const [paymentType, setPaymentType] = useState('full');

  // Passengers — forms for adults + children only (infants have no form)
  const [passengers, setPassengers] = useState([
    {
      firstName: '', lastName: '', email: '', phone: '',
      dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
      age: '', gender: '', address: '', nationality: 'Filipino',
      passengerType: 'adult'
    }
  ]);

  // ── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setDestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch tours on open ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const fetchTours = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/tours/all`);
        const data = await res.json();
        const list = data.data || data.tours || (Array.isArray(data) ? data : []);
        const active = list.filter(t => t.isArchive !== 'Yes');
        setAllTours(active);

        const uniqueDests = [...new Set(
          active.map(t => (t.destination || '').split(',')[0].trim())
        )].filter(Boolean).sort();
        setDestinations(uniqueDests);
      } catch (err) {
        console.error('Failed to load tours', err);
        toast.error('Failed to load tour destinations');
      }
    };
    fetchTours();
  }, [isOpen]);

  // ── Filter tours when destination changes ────────────────────────────────
  useEffect(() => {
    if (!selectedDestination) { setFilteredTours([]); return; }
    const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');
    const normDest = norm(selectedDestination);
    const filtered = allTours.filter(t => {
      const normTour = norm((t.destination || '').split(',')[0]);
      return normTour.includes(normDest) || normDest.includes(normTour);
    });
    setFilteredTours(filtered);
    setSelectedTour(null);
  }, [selectedDestination, allTours]);

  // ── Sync passenger forms when adult/child counts change ──────────────────
  useEffect(() => {
    const totalWithForms = adultCount + childCount;
    if (totalWithForms < 1) return;
    setPassengers(prev => {
      let arr = [...prev];
      const blankAdult = () => ({
        firstName: '', lastName: '', email: '', phone: '',
        dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
        age: '', gender: '', address: '', nationality: 'Filipino',
        passengerType: 'adult'
      });
      const blankChild = () => ({
        firstName: '', lastName: '', email: '', phone: '',
        dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
        age: '', gender: '', address: '', nationality: 'Filipino',
        passengerType: 'child'
      });

      // Build expected array: adultCount adults then childCount children
      while (arr.length < adultCount) arr.push(blankAdult());
      if (arr.length > adultCount + childCount) arr = arr.slice(0, adultCount + childCount);
      while (arr.length < adultCount + childCount) arr.push(blankChild());

      // Stamp types correctly
      arr = arr.map((p, i) => ({ ...p, passengerType: i < adultCount ? 'adult' : 'child' }));
      return arr;
    });
  }, [adultCount, childCount]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getDurationDays = (str) => {
    if (!str) return 1;
    const m = str.match(/(\d+)D/i);
    return m ? parseInt(m[1]) : 1;
  };

  const computeEndDate = () => {
    if (!departureDate || !selectedTour) return '';
    const s = new Date(departureDate);
    if (isNaN(s.getTime())) return '';
    const days = getDurationDays(selectedTour.duration);
    s.setDate(s.getDate() + days - 1);
    return s.toISOString().split('T')[0];
  };

  // ── Check if departure date is today or tomorrow ──────────────────────────
  const isDateTodayOrTomorrow = () => {
    if (!departureDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const selected = new Date(departureDate);
    selected.setHours(0, 0, 0, 0);
    return selected.getTime() === today.getTime() || selected.getTime() === tomorrow.getTime();
  };

  // ── Pricing ───────────────────────────────────────────────────────────────
  // Adult (5+ yrs)   → full price
  // Child (3–4 yrs)  → 50% discount
  // Infant (<2 yrs)  → FREE
  const tourPrice     = selectedTour?.price || 0;
  const adultTotal    = tourPrice * adultCount;
  const childTotal    = Math.round(tourPrice * 0.5) * childCount;
  const infantTotal   = 0; // always free
  const packageTotal  = adultTotal + childTotal + infantTotal;
  const totalPaxCount = adultCount + childCount + infantCount;

  const initialPaymentAmount = paymentType === 'partial' ? Math.round(packageTotal / 2) : packageTotal;
  const payableAmount = paymentType === 'partial' ? initialPaymentAmount : packageTotal;

  // ── DOB handler ────────────────────────────────────────────────────────────
  const handleDobPartChange = (index, part, value) => {
    setPassengers(prev =>
      prev.map((p, i) => {
        if (i !== index) return p;
        const updated = { ...p, [part]: value };
        const day   = part === 'dobDay'   ? value : updated.dobDay;
        const month = part === 'dobMonth' ? value : updated.dobMonth;
        const year  = part === 'dobYear'  ? value : updated.dobYear;
        if (day && month && year) {
          const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const birth = new Date(iso);
          if (!isNaN(birth.getTime())) {
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const md = today.getMonth() - birth.getMonth();
            if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
            return { ...updated, dateOfBirth: iso, age: age > 0 ? age.toString() : '' };
          }
        }
        return { ...updated, dateOfBirth: '' };
      })
    );
  };

  const updatePassenger = (index, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!selectedDestination) { toast.error('Please select a destination'); return false; }
    if (!selectedTour)        { toast.error('Please select a tour package'); return false; }
    if (!departureDate)       { toast.error('Please pick a departure date'); return false; }
    if (totalPaxCount < 1)    { toast.error('Please add at least 1 passenger'); return false; }
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.firstName || !p.lastName) { toast.error(`Passenger ${i+1}: First & Last name required`); return false; }
      if (!p.phone)                    { toast.error(`Passenger ${i+1}: Phone is required`); return false; }
      if (!p.dateOfBirth)              { toast.error(`Passenger ${i+1}: Date of Birth is required`); return false; }
      if (!p.gender)                   { toast.error(`Passenger ${i+1}: Gender is required`); return false; }
      if (!p.address)                  { toast.error(`Passenger ${i+1}: Address is required`); return false; }
    }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedTour || !departureDate) {
      toast.error('Missing tour or departure date');
      return;
    }
    if (packageTotal <= 0 && infantCount === 0) {
      toast.error('Invalid tour price. Please check the selected tour.');
      return;
    }

    setLoading(true);
    try {
      const primaryPax = passengers[0] || {};
      const endDate = computeEndDate();

      // Build full passenger array including infants (no form — placeholder entry)
      const allPassengers = [
        ...passengers.map((p, idx) => ({
          passengerNumber: idx + 1,
          firstName:       p.firstName,
          lastName:        p.lastName,
          email:           p.email && p.email.trim() !== '' ? p.email.trim() : null,
          phone:           p.phone,
          dateOfBirth:     p.dateOfBirth,
          age:             parseInt(p.age) || 0,
          gender:          p.gender || '',
          address:         p.address || '',
          nationality:     p.nationality || 'Filipino',
          passengerType:   p.passengerType,
          passengerPrice:  p.passengerType === 'child' ? Math.round(tourPrice * 0.5) : tourPrice,
        })),
        ...Array.from({ length: infantCount }, (_, idx) => ({
          passengerNumber: passengers.length + idx + 1,
          firstName:       '',
          lastName:        '',
          email:           null,
          phone:           '',
          dateOfBirth:     '',
          age:             0,
          gender:          '',
          address:         '',
          nationality:     'Filipino',
          passengerType:   'infant',
          passengerPrice:  0,
        })),
      ];

      const bookingData = {
        tourId:            selectedTour._id,
        packageName:       selectedTour.title || selectedTour.name || '',
        startDate:         departureDate,
        endDate:           endDate,
        duration:          selectedTour.duration || '',
        pax:               { adult: adultCount, children: childCount, infants: infantCount },
        fullName:          `${primaryPax.firstName || ''} ${primaryPax.lastName || ''}`.trim(),
        email:             primaryPax.email && primaryPax.email.trim() !== '' ? primaryPax.email.trim() : 'noemail@wanderwaveph.com',
        message:           '',
        packagePrice:      tourPrice,
        packageTotal:      packageTotal,
        finalPackageTotal: packageTotal,
        totalAmount:       packageTotal,
        price:             tourPrice,
        sellerPrice:       selectedTour.sellerPrice || 0,
        markup:            0,
        paymentType:       paymentType,
        initialPaymentAmount: initialPaymentAmount,
        remainingBalance:  paymentType === 'partial' ? packageTotal - initialPaymentAmount : 0,
        isWalkin:          true,
        createdByType:     'sales',
        createdByEmail:    'houston@wanderwaveph.com',
        bookingSource:     'walkin',
        passengers:        allPassengers,
      };

      const formPayload = new FormData();
      formPayload.append('bookingData', JSON.stringify(bookingData));

      const bookingRes = await fetch(`${API_BASE}/api/tour-bookings`, {
        method: 'POST',
        body: formPayload,
      });
      const bookingResult = await bookingRes.json();

      if (!bookingResult.success) {
        throw new Error(bookingResult.message || 'Failed to create tour booking');
      }

      const bookingId = bookingResult.bookingId || bookingResult.data?._id;
      console.log('✅ Tour walk-in booking created → ID:', bookingId);

      // ── Create PayMongo checkout session ──────────────────────────────────
      const amountToPay = paymentType === 'full' ? packageTotal : initialPaymentAmount;

      const paymentRes = await fetch(`${API_BASE}/api/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:     bookingId,
          paymentType:   paymentType,
          paymentAmount: amountToPay,
        }),
      });

      const paymentData = await paymentRes.json();

      if (paymentData.success && paymentData.checkoutUrl) {
        toast.success('Redirecting to secure payment page...');
        if (paymentData.checkoutSessionId) {
          sessionStorage.setItem('pendingCheckoutSessionId', paymentData.checkoutSessionId);
        }
        window.location.href = paymentData.checkoutUrl;
      } else {
        throw new Error(paymentData.message || 'No checkout URL returned');
      }

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Failed to create tour booking');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset & close ─────────────────────────────────────────────────────────
  const handleClose = () => {
    setCurrentStep(1);
    setSelectedDestination('');
    setSelectedTour(null);
    setDepartureDate('');
    setAdultCount(1);
    setChildCount(0);
    setInfantCount(0);
    setPaymentType('full');
    setPassengers([{
      firstName: '', lastName: '', email: '', phone: '',
      dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
      age: '', gender: '', address: '', nationality: 'Filipino',
      passengerType: 'adult'
    }]);
    onClose();
  };

  if (!isOpen) return null;

  const filteredDests = destinations.filter(d =>
    d.toLowerCase().includes(selectedDestination.toLowerCase())
  );

  // ── Pax counter row component (reusable inline) ───────────────────────────
  const PaxCounter = ({ label, sublabel, badge, badgeColor, count, onDec, onInc, disableDec }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 16px',
      background: '#fff',
      border: '1.5px solid #e2e8f0',
      borderRadius: '12px',
      marginBottom: '10px',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.97rem', color: '#0f172a' }}>
          {label}
          {badge && (
            <span style={{
              fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              background: badgeColor === 'green' ? '#dcfce7' : badgeColor === 'blue' ? '#eff6ff' : '#fef3c7',
              color: badgeColor === 'green' ? '#166534' : badgeColor === 'blue' ? '#1d4ed8' : '#92400e',
              border: `1px solid ${badgeColor === 'green' ? '#bbf7d0' : badgeColor === 'blue' ? '#bfdbfe' : '#fde68a'}`,
              textTransform: 'uppercase', letterSpacing: '0.3px'
            }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>{sublabel}</div>
      </div>
      <div className="ntbm-pax-row">
        <button className="ntbm-pax-btn" onClick={onDec} disabled={disableDec}>−</button>
        <span className="ntbm-pax-count" style={{ fontSize: '1.2rem', minWidth: '40px' }}>{count}</span>
        <button className="ntbm-pax-btn" onClick={onInc}>+</button>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="ntbm-overlay">
      <div className="ntbm-modal">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="ntbm-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="ntbm-header-icon">🗺️</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a', fontFamily: 'Arial Black, sans-serif', textTransform: 'uppercase' }}>
                New Tour Booking
              </h2>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Create a walk-in tour booking for a customer
              </p>
            </div>
          </div>
          <button className="ntbm-close-btn" onClick={handleClose}>×</button>
        </div>

        {/* ── PROGRESS ───────────────────────────────────────────────────── */}
        <div className="ntbm-progress">
          <div className={`ntbm-step ${currentStep === 1 ? 'active' : ''}`}>
            <div className={`ntbm-step-dot ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            Trip Details
          </div>
          <div className="ntbm-progress-line" style={{ background: currentStep >= 2 ? '#f59e0b' : '#e2e8f0' }} />
          <div className={`ntbm-step ${currentStep === 2 ? 'active' : ''}`}>
            <div className={`ntbm-step-dot ${currentStep === 2 ? 'active' : ''}`}>2</div>
            Booking Preview
          </div>
        </div>

        {/* ── BODY ───────────────────────────────────────────────────────── */}
        <div className="ntbm-body">

          {/* ══════════ STEP 1 ══════════ */}
          {currentStep === 1 && (
            <>
              {/* ── SECTION: Trip Details ── */}
              <div className="ntbm-section-label">
                <MapPin size={15} /> Trip Details
              </div>
              <div className="ntbm-card" style={{ marginBottom: '20px' }}>

                {/* Destination */}
                <div className="ntbm-field" ref={destRef}>
                  <label>Destination <span style={{ color: '#ef4444' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="ntbm-input"
                      value={selectedDestination}
                      onChange={e => {
                        setSelectedDestination(e.target.value);
                        setDestDropdownOpen(true);
                        setSelectedTour(null);
                        setDepartureDate('');
                      }}
                      onFocus={() => setDestDropdownOpen(true)}
                      placeholder="Type to search destination..."
                    />
                    {destDropdownOpen && selectedDestination && filteredDests.length > 0 && (
                      <div className="ntbm-dest-dropdown">
                        {filteredDests.map(d => (
                          <div
                            key={d}
                            className="ntbm-dest-option"
                            onMouseDown={() => {
                              setSelectedDestination(d);
                              setSelectedTour(null);
                              setDepartureDate('');
                              setDestDropdownOpen(false);
                            }}
                          >
                            📍 {d}
                          </div>
                        ))}
                      </div>
                    )}
                    {destDropdownOpen && selectedDestination && filteredDests.length === 0 && (
                      <div className="ntbm-dest-dropdown">
                        <div style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.9rem' }}>
                          No destinations found
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tour Package */}
                {selectedDestination && filteredTours.length > 0 && (
                  <div className="ntbm-field" style={{ marginTop: '16px' }}>
                    <label>Tour Package <span style={{ color: '#ef4444' }}>*</span></label>
                    <div className="ntbm-tour-grid">
                      {filteredTours.map(tour => (
                        <div
                          key={tour._id}
                          className={`ntbm-tour-card ${selectedTour?._id === tour._id ? 'selected' : ''}`}
                          onClick={() => setSelectedTour(tour)}
                        >
                          {tour.image && (
                            <div className="ntbm-tour-img-wrap">
                              <img src={tour.image} alt={tour.title} className="ntbm-tour-img" />
                            </div>
                          )}
                          <div className="ntbm-tour-info">
                            <div className="ntbm-tour-title">{tour.title || tour.name}</div>
                            <div className="ntbm-tour-meta">
                              {tour.duration && <span className="ntbm-tour-tag">{tour.duration}</span>}
                              {tour.tourType && (
                                <span className={`ntbm-tour-tag ${tour.tourType.toLowerCase() === 'private' ? 'private' : 'joiners'}`}>
                                  {tour.tourType}
                                </span>
                              )}
                            </div>
                            <div className="ntbm-tour-price">₱{(tour.price || 0).toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>/ pax</span></div>
                          </div>
                          {selectedTour?._id === tour._id && (
                            <div className="ntbm-tour-check">✓</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedDestination && filteredTours.length === 0 && (
                  <div style={{ marginTop: '16px', padding: '20px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center', color: '#94a3b8', border: '1.5px dashed #e2e8f0', fontSize: '0.9rem' }}>
                    No active tours found for <strong>{selectedDestination}</strong>
                  </div>
                )}
              </div>

              {/* ── SECTION: Number of Passengers ── */}
              {selectedTour && (
                <>
                  <div className="ntbm-section-label">
                    <Users size={15} /> Number of Passengers
                  </div>
                  <div className="ntbm-card" style={{ marginBottom: '20px' }}>

                    <PaxCounter
                      label="Adult"
                      sublabel={`5+ years old • Full price — ₱${tourPrice.toLocaleString()}/pax`}
                      badge="Solo / Group"
                      badgeColor="amber"
                      count={adultCount}
                      onDec={() => { if (adultCount > 1) setAdultCount(c => c - 1); }}
                      onInc={() => setAdultCount(c => c + 1)}
                      disableDec={adultCount <= 1}
                    />
                    <PaxCounter
                      label="Child"
                      sublabel={`3–4 years old • 50% off — ₱${Math.round(tourPrice * 0.5).toLocaleString()}/pax`}
                      badge="50% off"
                      badgeColor="blue"
                      count={childCount}
                      onDec={() => { if (childCount > 0) setChildCount(c => c - 1); }}
                      onInc={() => setChildCount(c => c + 1)}
                      disableDec={childCount <= 0}
                    />
                    <PaxCounter
                      label="Infant"
                      sublabel="Below 2 years old • No seat required"
                      badge="FREE"
                      badgeColor="green"
                      count={infantCount}
                      onDec={() => { if (infantCount > 0) setInfantCount(c => c - 1); }}
                      onInc={() => setInfantCount(c => c + 1)}
                      disableDec={infantCount <= 0}
                    />

                    {/* Total pax summary chip */}
                    {totalPaxCount > 0 && (
                      <div style={{ marginTop: '4px', padding: '10px 14px', background: '#fff7ed', border: '1.5px solid #fcd34d', borderRadius: '10px', fontSize: '0.88rem', color: '#92400e', fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                          Total: {totalPaxCount} pax
                          ({adultCount} adult{adultCount !== 1 ? 's' : ''}
                          {childCount > 0 ? `, ${childCount} child${childCount !== 1 ? 'ren' : ''}` : ''}
                          {infantCount > 0 ? `, ${infantCount} infant${infantCount !== 1 ? 's' : ''}` : ''})
                        </span>
                        <span>₱{packageTotal.toLocaleString()}</span>
                      </div>
                    )}

                    {/* Departure Date */}
                    <div style={{ marginTop: '16px' }}>
                      <label className="ntbm-field-label">Departure Date <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        type="date"
                        className="ntbm-input"
                        value={departureDate}
                        onChange={e => {
                          const val = e.target.value;
                          setDepartureDate(val);
                          // Auto-reset to full payment if today or tomorrow
                          if (val) {
                            const today = new Date(); today.setHours(0,0,0,0);
                            const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
                            const sel = new Date(val); sel.setHours(0,0,0,0);
                            if (sel.getTime() === today.getTime() || sel.getTime() === tomorrow.getTime()) {
                              setPaymentType('full');
                            }
                          }
                        }}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {/* Date preview */}
                    {departureDate && selectedTour && (
                      <div className="ntbm-date-preview">
                        <div className="ntbm-date-preview-item">
                          <span className="ntbm-date-preview-emoji">✈️</span>
                          <div>
                            <div className="ntbm-date-preview-lbl">Departure</div>
                            <div className="ntbm-date-preview-val">{departureDate}</div>
                          </div>
                        </div>
                        <div style={{ color: '#f59e0b', fontSize: '1.4rem', fontWeight: 300 }}>→</div>
                        <div className="ntbm-date-preview-item">
                          <span className="ntbm-date-preview-emoji">🏠</span>
                          <div>
                            <div className="ntbm-date-preview-lbl">Return</div>
                            <div className="ntbm-date-preview-val">{computeEndDate()}</div>
                          </div>
                        </div>
                        <div className="ntbm-duration-chip">
                          {selectedTour.duration} • {getDurationDays(selectedTour.duration)} day{getDurationDays(selectedTour.duration) > 1 ? 's' : ''}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── SECTION: Payment Option ── */}
                  <div className="ntbm-section-label">
                    <CreditCard size={15} /> Payment Option
                  </div>

                  <div className="bfm-payment-section">
                    <div className="bfm-payment-header">
                      <Wallet size={20} />
                      <h3>Choose Payment Method</h3>
                    </div>

                    <div className="bfm-payment-options">
                      {/* Full Payment Card */}
                      <div
                        className={`bfm-payment-card ${paymentType === 'full' ? 'active' : ''}`}
                        onClick={() => setPaymentType('full')}
                      >
                        <div className="bfm-payment-card-header">
                          <div className="bfm-payment-radio">
                            <div className={`bfm-radio-dot ${paymentType === 'full' ? 'active' : ''}`} />
                          </div>
                          <div className="bfm-payment-card-title">
                            <CreditCard size={18} />
                            <span>Pay in Full</span>
                            <span className="bfm-recommended-badge">Recommended</span>
                          </div>
                        </div>
                        <div className="bfm-payment-card-body">
                          <div className="bfm-payment-amount">
                            ₱{packageTotal.toLocaleString()}
                            <span className="bfm-payment-percentage">100%</span>
                          </div>
                          <div className="bfm-payment-description">
                            Pay the full amount now and enjoy hassle-free travel.
                          </div>
                          <ul className="bfm-payment-benefits">
                            <li>✅ No balance to settle</li>
                            <li>✅ Guaranteed booking confirmation</li>
                            <li>✅ Peace of mind before your trip</li>
                          </ul>
                        </div>
                      </div>

                      {/* Partial Payment Card */}
                      {!isDateTodayOrTomorrow() && (
                      <div
                        className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
                        onClick={() => setPaymentType('partial')}
                      >
                        <div className="bfm-payment-card-header">
                          <div className="bfm-payment-radio">
                            <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                          </div>
                          <div className="bfm-payment-card-title">
                            <Wallet size={18} />
                            <span>Partial Payment</span>
                            <span className="bfm-flexible-badge">Flexible</span>
                          </div>
                        </div>
                        <div className="bfm-payment-card-body">
                          <div className="bfm-payment-amount">
                            ₱{Math.round(packageTotal / 2).toLocaleString()}
                            <span className="bfm-payment-percentage">50% deposit</span>
                          </div>
                          <div className="bfm-payment-description">
                            Pay a 50% deposit now, settle the rest before departure.
                          </div>
                          {paymentType === 'partial' && (
                            <div className="bfm-payment-breakdown">
                              <div className="bfm-breakdown-row">
                                <span>Due now (50%)</span>
                                <strong>₱{Math.round(packageTotal / 2).toLocaleString()}</strong>
                              </div>
                              <div className="bfm-breakdown-row">
                                <span>Balance before departure</span>
                                <strong>₱{(packageTotal - Math.round(packageTotal / 2)).toLocaleString()}</strong>
                              </div>
                            </div>
                          )}
                          {paymentType !== 'partial' && (
                            <ul className="bfm-payment-benefits">
                              <li>💳 Spread your payment</li>
                              <li>💳 Reserve your slot now</li>
                              <li>💳 Balance due before departure</li>
                            </ul>
                          )}
                        </div>
                      </div>
                      )} {/* end !isDateTodayOrTomorrow */}
                    </div>

                    {/* Notice: partial payment not available for today/tomorrow */}
                    {isDateTodayOrTomorrow() && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px 14px',
                        background: '#fefce8',
                        border: '1.5px solid #fcd34d',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        color: '#92400e',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        ⚠️ Partial payment is not available for bookings departing today or tomorrow. Full payment is required.
                      </div>
                    )}

                    <div className="bfm-payment-summary">
                      {adultCount > 0 && (
                        <div className="bfm-summary-row">
                          <span>Adult ×{adultCount} (₱{tourPrice.toLocaleString()}/pax)</span>
                          <span style={{ color: '#374151', fontWeight: 700 }}>₱{adultTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {childCount > 0 && (
                        <div className="bfm-summary-row">
                          <span>Child ×{childCount} (₱{Math.round(tourPrice * 0.5).toLocaleString()}/pax · 50% off)</span>
                          <span style={{ color: '#374151', fontWeight: 700 }}>₱{childTotal.toLocaleString()}</span>
                        </div>
                      )}
                      {infantCount > 0 && (
                        <div className="bfm-summary-row">
                          <span>Infant ×{infantCount} (FREE)</span>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>₱0</span>
                        </div>
                      )}
                      <div className="bfm-summary-row">
                        <span>{paymentType === 'partial' ? 'Initial Payment Due Now' : 'Total Amount Due'}</span>
                        <span className="bfm-amount-highlight">₱{payableAmount.toLocaleString()}</span>
                      </div>
                      {paymentType === 'partial' && (
                        <div className="bfm-summary-row bfm-remaining">
                          <span>Remaining Balance</span>
                          <span>₱{(packageTotal - initialPaymentAmount).toLocaleString()} due before departure</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── SECTION: Passenger Details (Adults + Children only) ── */}
                  {passengers.length > 0 && (
                    <>
                      <div className="ntbm-section-label" style={{ marginTop: '20px' }}>
                        <Users size={15} /> Passenger Details
                      </div>

                      {/* Infant notice */}
                      {infantCount > 0 && (
                        <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '10px', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                          🎁 {infantCount} infant{infantCount > 1 ? 's' : ''} will travel FREE — no form required for infants.
                        </div>
                      )}

                      {passengers.map((p, i) => (
                        <div key={i} className="ntbm-passenger-card">
                          <div className="ntbm-passenger-heading">
                            <div className="ntbm-passenger-num">{i + 1}</div>
                            <span className="ntbm-passenger-label">
                              {p.passengerType === 'child'
                                ? `Child ${i - adultCount + 1}`
                                : `Adult ${i + 1}`}
                              {p.passengerType === 'child' && (
                                <span style={{ marginLeft: 8, fontSize: '0.72rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '2px 9px', border: '1px solid #bfdbfe', verticalAlign: 'middle' }}>
                                  🏷️ 50% OFF
                                </span>
                              )}
                            </span>
                          </div>

                          {/* First + Last Name */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="ntbm-pfield">
                              <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                              <input className="ntbm-input" value={p.firstName} onChange={e => updatePassenger(i, 'firstName', e.target.value)} placeholder="Juan" />
                            </div>
                            <div className="ntbm-pfield">
                              <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                              <input className="ntbm-input" value={p.lastName} onChange={e => updatePassenger(i, 'lastName', e.target.value)} placeholder="Dela Cruz" />
                            </div>
                          </div>

                          {/* Email + Phone */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                            <div className="ntbm-pfield">
                              <label>Email <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', fontSize: '0.78rem' }}>(optional)</span></label>
                              <input className="ntbm-input" value={p.email} onChange={e => updatePassenger(i, 'email', e.target.value)} placeholder="juan@email.com" />
                            </div>
                            <div className="ntbm-pfield">
                              <label>Phone <span style={{ color: '#ef4444' }}>*</span></label>
                              <input className="ntbm-input" value={p.phone} onChange={e => updatePassenger(i, 'phone', e.target.value)} placeholder="09171234567" />
                            </div>
                          </div>

                          {/* Date of Birth */}
                          <div style={{ marginTop: '12px' }}>
                            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', marginBottom: '6px', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                              Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <select className="ntbm-dob-select" value={p.dobDay} onChange={e => handleDobPartChange(i, 'dobDay', e.target.value)} style={{ width: '72px' }}>
                                <option value="">DD</option>
                                {Array.from({ length: 31 }, (_, n) => n + 1).map(d => (
                                  <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                                ))}
                              </select>
                              <select className="ntbm-dob-select" value={p.dobMonth} onChange={e => handleDobPartChange(i, 'dobMonth', e.target.value)} style={{ width: '92px' }}>
                                <option value="">Month</option>
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => (
                                  <option key={idx + 1} value={idx + 1}>{m}</option>
                                ))}
                              </select>
                              <select className="ntbm-dob-select" value={p.dobYear} onChange={e => handleDobPartChange(i, 'dobYear', e.target.value)} style={{ width: '82px' }}>
                                <option value="">Year</option>
                                {Array.from({ length: new Date().getFullYear() - 1939 }, (_, n) => new Date().getFullYear() - n).map(y => (
                                  <option key={y} value={y}>{y}</option>
                                ))}
                              </select>
                              <div className={`ntbm-age-badge${p.age ? '' : ' empty'}`}>
                                {p.age ? <>{p.age}<span style={{ fontSize: '0.73rem', opacity: 0.85, marginLeft: 2 }}>yrs</span></> : '—'}
                              </div>
                            </div>
                          </div>

                          {/* Gender + Nationality */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                            <div className="ntbm-pfield">
                              <label>Gender <span style={{ color: '#ef4444' }}>*</span></label>
                              <select className="ntbm-input" value={p.gender} onChange={e => updatePassenger(i, 'gender', e.target.value)}>
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="ntbm-pfield">
                              <label>Nationality <span style={{ color: '#ef4444' }}>*</span></label>
                              <input className="ntbm-input" value={p.nationality} onChange={e => updatePassenger(i, 'nationality', e.target.value)} placeholder="Filipino" />
                            </div>
                          </div>

                          {/* Address */}
                          <div className="ntbm-pfield" style={{ marginTop: '12px' }}>
                            <label>Complete Address <span style={{ color: '#ef4444' }}>*</span></label>
                            <input className="ntbm-input" value={p.address} onChange={e => updatePassenger(i, 'address', e.target.value)} placeholder="123 Main St, Quezon City" />
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </>
          )}

          {/* ══════════ STEP 2 — PREVIEW ══════════ */}
          {currentStep === 2 && (
            <>
              <h3 className="ntbm-step-title">Tour Booking Preview</h3>
              <p className="ntbm-step-subtitle">Please review all details before confirming.</p>

              {/* Customer */}
              <div className="ntbm-preview-section">
                <div className="ntbm-preview-section-title">👤 Customer Information</div>
                <div className="ntbm-preview-row">
                  <span>Full Name</span>
                  <strong>{`${passengers[0]?.firstName || ''} ${passengers[0]?.lastName || ''}`.trim() || '—'}</strong>
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
                  <span><Calendar size={14} style={{ display: 'inline', marginRight: 4 }} /> Departure</span>
                  <strong>{departureDate}</strong>
                </div>
                <div className="ntbm-preview-row">
                  <span>Return Date</span>
                  <strong>{computeEndDate()}</strong>
                </div>
                <div className="ntbm-preview-row">
                  <span>Number of Pax</span>
                  <strong>
                    {totalPaxCount} total
                    ({adultCount} adult{adultCount !== 1 ? 's' : ''}
                    {childCount > 0 ? `, ${childCount} child${childCount !== 1 ? 'ren' : ''}` : ''}
                    {infantCount > 0 ? `, ${infantCount} infant${infantCount !== 1 ? 's' : ''}` : ''})
                  </strong>
                </div>
              </div>

              {/* Passengers */}
              <div className="ntbm-preview-section">
                <div className="ntbm-preview-section-title">
                  <Users size={16} /> Passengers ({totalPaxCount})
                </div>
                {passengers.map((p, i) => (
                  <div key={i} className="ntbm-preview-passenger">
                    <strong>{p.passengerType === 'child' ? 'Child' : 'Adult'} {i + 1}:</strong> {p.firstName} {p.lastName}
                    {p.phone && <span style={{ marginLeft: 12, color: '#64748b' }}>• {p.phone}</span>}
                    {p.age && <span style={{ marginLeft: 12, color: '#94a3b8', fontSize: '0.85rem' }}>• {p.age} yrs</span>}
                    {p.passengerType === 'child' && (
                      <span style={{ marginLeft: 10, fontSize: '0.78rem', fontWeight: 700, background: '#eff6ff', color: '#1d4ed8', borderRadius: 20, padding: '1px 8px', border: '1px solid #bfdbfe' }}>
                        🏷️ 50% OFF
                      </span>
                    )}
                  </div>
                ))}
                {infantCount > 0 && (
                  <div className="ntbm-preview-passenger" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <strong style={{ color: '#166534' }}>🎁 {infantCount} Infant{infantCount > 1 ? 's' : ''} — FREE</strong>
                    <span style={{ marginLeft: 12, color: '#94a3b8', fontSize: '0.85rem' }}>• Below 2 years old</span>
                  </div>
                )}
              </div>

              {/* Payment Summary */}
              <div className="ntbm-preview-section">
                <div className="ntbm-preview-section-title">
                  <CreditCard size={16} /> Payment Summary
                </div>
                <div className="ntbm-preview-row">
                  <span>Tour Price (base)</span>
                  <span>₱{tourPrice.toLocaleString()} / pax</span>
                </div>
                {adultCount > 0 && (
                  <div className="ntbm-preview-row">
                    <span>Adult ×{adultCount}</span>
                    <span>₱{adultTotal.toLocaleString()}</span>
                  </div>
                )}
                {childCount > 0 && (
                  <div className="ntbm-preview-row" style={{ color: '#1d4ed8' }}>
                    <span>Child ×{childCount} (50% off)</span>
                    <span>₱{childTotal.toLocaleString()}</span>
                  </div>
                )}
                {infantCount > 0 && (
                  <div className="ntbm-preview-row" style={{ color: '#166534' }}>
                    <span>Infant ×{infantCount} (FREE)</span>
                    <span>₱0</span>
                  </div>
                )}
                <div className="ntbm-preview-row">
                  <span>Payment Type</span>
                  <span style={{ textTransform: 'capitalize' }}>
                    {paymentType === 'full' ? 'Pay in Full' : 'Partial (50% deposit)'}
                  </span>
                </div>

                {/* Total Box */}
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
          )}

        </div>{/* end ntbm-body */}

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <div className="ntbm-footer">
          {currentStep === 1 ? (
            <>
              <button className="ntbm-btn ntbm-btn-back" onClick={handleClose}>
                Cancel
              </button>
              <button
                className="ntbm-btn ntbm-btn-next"
                onClick={() => { if (validateStep1()) setCurrentStep(2); }}
                disabled={!selectedTour || !departureDate}
              >
                Preview Booking →
              </button>
            </>
          ) : (
            <>
              <button
                className="ntbm-btn ntbm-btn-back"
                onClick={() => setCurrentStep(1)}
              >
                ← Back to Edit
              </button>
              <button
                className="ntbm-btn ntbm-btn-next"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Creating Booking...' : '✅ Confirm & Proceed to Payment'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
};

export default NewTourBookingModal;