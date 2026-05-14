import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Users, Calendar, MapPin, CreditCard, Car, Clock, ArrowRightLeft, Navigation } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import './newBookingModal.css';
import './PaymentOption.css';

const BASE_URL = 'https://wanderwaveph.onrender.com';

// ── Late Night Surcharge Helper ──────────────────────────────────────────────
// Returns true if time string (HH:MM) is between 12:00 AM and 5:00 AM (exclusive)
const isLateNightTime = (timeStr) => {
  if (!timeStr) return false;
  const [hourStr, minStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const min  = parseInt(minStr, 10);
  // 00:00 → 04:59 inclusive = late night (12AM to before 5AM)
  return hour >= 0 && hour < 5;
};

const LATE_NIGHT_SURCHARGE = 500;

// ── Travel Date Restriction Helper ──────────────────────────────────────────
// Returns true if the given date string (YYYY-MM-DD) is today or tomorrow
const isTodayOrTomorrow = (dateStr) => {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const selected = new Date(dateStr + 'T00:00:00');
  return selected.getTime() === today.getTime() || selected.getTime() === tomorrow.getTime();
};

const NewTransferBookingModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // ── Destination & Transfers ─────────────────────────────────────────────
  const [destination, setDestination] = useState('');
  const [allTransfers, setAllTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [loadingTransfers, setLoadingTransfers] = useState(false);

  // ── Destination autocomplete ─────────────────────────────────────────────
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const destWrapperRef = useRef(null);

  // ── Trip config ─────────────────────────────────────────────────────────
  const [paxCount, setPaxCount] = useState(1);
  const [tripType, setTripType] = useState('oneway'); // 'oneway' | 'roundtrip'

  // ── Trip details ────────────────────────────────────────────────────────
  const [travelDate, setTravelDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');

  // ── Passenger details ───────────────────────────────────────────────────
  const [passengers, setPassengers] = useState([{
    firstName: '', lastName: '', email: '', phone: '',
    dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
    age: '', gender: '', address: '', nationality: 'Filipino'
  }]);

  // ── Payment ─────────────────────────────────────────────────────────────
  const [paymentType, setPaymentType] = useState('full');

  // ── Partial Payment Restriction ─────────────────────────────────────────
  // Partial payment is not allowed when travel date is today or tomorrow
  const isPartialPaymentRestricted = isTodayOrTomorrow(travelDate);

  // Auto-reset to full payment if travel date becomes today/tomorrow
  useEffect(() => {
    if (isPartialPaymentRestricted && paymentType === 'partial') {
      setPaymentType('full');
    }
  }, [isPartialPaymentRestricted]);

  // ── Late Night Surcharge Modal ───────────────────────────────────────────
  // 'arrival' | 'departure' | null
  const [lateNightModal, setLateNightModal] = useState(null);
  // Temporary time value while user sees the warning
  const [pendingTime, setPendingTime] = useState('');

  // ── Fetch all transfers once on open ────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const fetchTransfers = async () => {
      setLoadingTransfers(true);
      try {
        const res = await fetch(`${BASE_URL}/api/transfers?all=true`);
        const data = await res.json();
        setAllTransfers(data.data || []);
      } catch (err) {
        console.error('Failed to fetch transfers', err);
        toast.error('Failed to load transfers');
      } finally {
        setLoadingTransfers(false);
      }
    };
    fetchTransfers();
  }, [isOpen]);

  // ── Close destination dropdown on outside click ──────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (destWrapperRef.current && !destWrapperRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Destination suggestions derived from allTransfers ───────────────────
  const destSuggestions = (() => {
    if (!destination.trim()) return [];
    const query = destination.trim().toLowerCase();
    const seen = new Set();
    return allTransfers
      .filter(t => t.isActive && t.packageDestination)
      .map(t => t.packageDestination.trim())
      .filter(d => {
        const key = d.toLowerCase();
        if (seen.has(key)) return false;
        if (!key.includes(query)) return false;
        seen.add(key);
        return true;
      })
      .sort();
  })();

  // ── Filter transfers by destination + pax ───────────────────────────────
  useEffect(() => {
    if (!destination.trim()) { setFilteredTransfers([]); setSelectedTransfer(null); return; }
    const destKey = destination.trim().toLowerCase();
    const filtered = allTransfers.filter(t => {
      if (!t.isActive) return false;
      // FIX: use t.pax (the actual field on the Transfer model)
      const maxPax = t.pax || 999;
      if (paxCount > maxPax) return false;
      // destination match (loose)
      if (!t.packageDestination) return true;
      const tDest = (t.packageDestination || '').toLowerCase().split(',')[0].trim();
      return tDest.includes(destKey.split(',')[0].trim()) || destKey.split(',')[0].trim().includes(tDest);
    });
    setFilteredTransfers(filtered);
    // if current selected no longer in filtered, reset
    if (selectedTransfer && !filtered.find(t => t._id === selectedTransfer._id)) {
      setSelectedTransfer(null);
    }
  }, [destination, paxCount, allTransfers]);

  // ── Sync passengers array with paxCount ─────────────────────────────────
  useEffect(() => {
    setPassengers(prev => {
      if (prev.length === paxCount) return prev;
      if (prev.length < paxCount) {
        const extras = Array.from({ length: paxCount - prev.length }, () => ({
          firstName: '', lastName: '', email: '', phone: '',
          dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
          age: '', gender: '', address: '', nationality: 'Filipino'
        }));
        return [...prev, ...extras];
      }
      return prev.slice(0, paxCount);
    });
  }, [paxCount]);

  // ── Late Night Surcharge calculation ─────────────────────────────────────
  // Count how many selected times fall within 12AM-5AM
  const arrivalSurcharge   = isLateNightTime(arrivalTime)   ? LATE_NIGHT_SURCHARGE : 0;
  const departureSurcharge = (tripType === 'roundtrip' && isLateNightTime(departureTime)) ? LATE_NIGHT_SURCHARGE : 0;
  const totalSurcharge     = arrivalSurcharge + departureSurcharge;

  // ── Computed values ─────────────────────────────────────────────────────
  const sellingPrice = selectedTransfer
    ? (tripType === 'roundtrip' ? (selectedTransfer.roundtripPrice || 0) : (selectedTransfer.oneWayPrice || 0))
    : 0;
  const totalAmount = sellingPrice + totalSurcharge;
  const initialPaymentAmount = paymentType === 'partial' ? Math.round(totalAmount / 2) : totalAmount;
  const remainingBalance = paymentType === 'partial' ? totalAmount - initialPaymentAmount : 0;

  // ── Passenger helpers ────────────────────────────────────────────────────
  const updatePassenger = (index, field, value) => {
    setPassengers(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const handleDobPartChange = (index, part, value) => {
    setPassengers(prev => prev.map((p, i) => {
      if (i !== index) return p;
      const updated = { ...p, [part]: value };
      const day   = part === 'dobDay'   ? value : updated.dobDay;
      const month = part === 'dobMonth' ? value : updated.dobMonth;
      const year  = part === 'dobYear'  ? value : updated.dobYear;
      if (day && month && year) {
        const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const birthDate = new Date(iso);
        if (!isNaN(birthDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const md = today.getMonth() - birthDate.getMonth();
          if (md < 0 || (md === 0 && today.getDate() < birthDate.getDate())) age--;
          return { ...updated, dateOfBirth: iso, age: age > 0 ? age.toString() : '' };
        }
      }
      return { ...updated, dateOfBirth: '' };
    }));
  };

  // ── Time change handlers with late-night check ───────────────────────────
  const handleArrivalTimeChange = (value) => {
    if (isLateNightTime(value)) {
      setPendingTime(value);
      setLateNightModal('arrival');
    } else {
      setArrivalTime(value);
    }
  };

  const handleDepartureTimeChange = (value) => {
    if (isLateNightTime(value)) {
      setPendingTime(value);
      setLateNightModal('departure');
    } else {
      setDepartureTime(value);
    }
  };

  const handleLateNightConfirm = () => {
    if (lateNightModal === 'arrival') {
      setArrivalTime(pendingTime);
    } else if (lateNightModal === 'departure') {
      setDepartureTime(pendingTime);
    }
    setPendingTime('');
    setLateNightModal(null);
  };

  const handleLateNightClose = () => {
    // Clear the field — do NOT apply the pending time
    if (lateNightModal === 'arrival') {
      setArrivalTime('');
    } else if (lateNightModal === 'departure') {
      setDepartureTime('');
    }
    setPendingTime('');
    setLateNightModal(null);
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!destination.trim())   { toast.error('Please enter a destination'); return false; }
    if (!selectedTransfer)     { toast.error('Please select a transfer vehicle'); return false; }
    if (!travelDate)           { toast.error('Please select a travel date'); return false; }
    if (!arrivalTime)          { toast.error('Please enter arrival time'); return false; }
    if (!pickupLocation.trim()){ toast.error('Please enter pickup location'); return false; }
    if (tripType === 'roundtrip') {
      if (!returnDate)           { toast.error('Please select return date for roundtrip'); return false; }
      if (!departureTime)        { toast.error('Please enter departure time for roundtrip'); return false; }
      if (!dropoffLocation.trim()){ toast.error('Please enter dropoff location for roundtrip'); return false; }
    }
    // Passenger 1 required fields
    const p = passengers[0];
    if (!p.firstName.trim() || !p.lastName.trim()) { toast.error('Passenger 1 full name is required'); return false; }
    if (!p.email.trim())   { toast.error('Passenger 1 email is required'); return false; }
    if (!p.phone.trim())   { toast.error('Passenger 1 phone number is required'); return false; }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
  };

  const handleBack = () => {
    if (currentStep === 2) setCurrentStep(1);
    else if (showPreview) setShowPreview(false);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setShowPreview(false);
    setLoading(true);
    try {
      const primaryPax = passengers[0];
      const bookingPayload = {
        transferId:           selectedTransfer._id,
        activityName:         selectedTransfer.title || '',
        bookingType:          'transfer',
        destination,
        category:             selectedTransfer.category || '',
        transferType:         tripType,
        travelDate,
        returnDate:           tripType === 'roundtrip' ? returnDate : '',
        arrivalTime,
        departureTime:        tripType === 'roundtrip' ? departureTime : '',
        pickupLocation,
        dropoffLocation:      tripType === 'roundtrip' ? dropoffLocation : '',
        fullName:             `${primaryPax.firstName} ${primaryPax.lastName}`.trim(),
        email:                primaryPax.email,
        phone:                primaryPax.phone,
        message:              '',
        specialRequests:      totalSurcharge > 0
          ? `Late night surcharge applied: ₱${totalSurcharge.toLocaleString()} (${[arrivalSurcharge > 0 ? 'arrival' : '', departureSurcharge > 0 ? 'departure' : ''].filter(Boolean).join(' + ')} late night schedule)`
          : '',
        passengerCount:       paxCount,
        oneWayPrice:          selectedTransfer.oneWayPrice || 0,
        roundtripPrice:       selectedTransfer.roundtripPrice || 0,
        sellingPrice,
        totalAmount,
        currency:             'PHP',
        paymentType,
        initialPaymentAmount,
        remainingBalance,
        supplierName:         selectedTransfer.supplierName || '',
        pax:                  String(paxCount),
        createdByType:        'sales',
      };

      // 1. Create the booking
      const bookingRes = await fetch(`${BASE_URL}/api/transfer-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      const bookingResult = await bookingRes.json();
      if (!bookingResult.success) throw new Error(bookingResult.message || 'Failed to create transfer booking');

      const bookingId = bookingResult.bookingId || bookingResult.data?._id;
      console.log('✅ Transfer booking created (sales) → ID:', bookingId);

      // 2. Create PayMongo checkout session
      const amountToPay = paymentType === 'full' ? totalAmount : initialPaymentAmount;
      const paymentRes = await fetch(`${BASE_URL}/api/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          paymentType,
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
      toast.error(err.message || 'Failed to create transfer booking');
    } finally {
      setLoading(false);
    }
  };

  // ── Reset on close ───────────────────────────────────────────────────────
  const handleClose = () => {
    setCurrentStep(1);
    setShowPreview(false);
    setDestination('');
    setSelectedTransfer(null);
    setFilteredTransfers([]);
    setPaxCount(1);
    setTripType('oneway');
    setTravelDate('');
    setReturnDate('');
    setArrivalTime('');
    setDepartureTime('');
    setPickupLocation('');
    setDropoffLocation('');
    setPassengers([{
      firstName: '', lastName: '', email: '', phone: '',
      dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
      age: '', gender: '', address: '', nationality: 'Filipino'
    }]);
    setPaymentType('full');
    setLateNightModal(null);
    setPendingTime('');
    onClose();
  };

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────────────────────────
  // LATE NIGHT SURCHARGE WARNING MODAL
  // ─────────────────────────────────────────────────────────────────────────
  const LateNightSurchargeModal = () => {
    if (!lateNightModal) return null;
    const isArrival = lateNightModal === 'arrival';
    return ReactDOM.createPortal(
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.18s ease',
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 20,
          width: '100%',
          maxWidth: 420,
          margin: '0 16px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          animation: 'slideUp 0.22s cubic-bezier(.22,1,.36,1)',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #0f172a)',
            padding: '24px 28px 20px',
            position: 'relative',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: 'rgba(251,191,36,0.15)',
                border: '1.5px solid rgba(251,191,36,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, flexShrink: 0,
              }}>🌙</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>Late Night Schedule</div>
                <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: 2 }}>
                  {isArrival ? 'Arrival' : 'Departure'} time: {pendingTime}
                </div>
              </div>
            </div>
            <button
              onClick={handleLateNightClose}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'rgba(255,255,255,0.1)', border: 'none',
                borderRadius: 8, width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#94a3b8', fontSize: 18, lineHeight: 1,
              }}
            >×</button>
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px' }}>
            {/* Info Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #fff9f0, #fefce8)',
              border: '1.5px solid #fcd34d',
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', gap: 12, alignItems: 'flex-start',
              marginBottom: 18,
            }}>
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>⚠️</span>
              <div>
                <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.9rem', marginBottom: 4 }}>
                  Extra Charge Notice
                </div>
                <div style={{ color: '#78350f', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  Schedules between <strong>12:00 AM – 5:00 AM</strong> incur an additional late night surcharge due to off-peak hours.
                </div>
              </div>
            </div>

            {/* Surcharge pill */}
            <div style={{
              background: '#fef2f2', border: '1.5px solid #fca5a5',
              borderRadius: 12, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#7f1d1d', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Late Night Surcharge</div>
                <div style={{ fontSize: '0.82rem', color: '#b91c1c', marginTop: 2 }}>
                  Applied to {isArrival ? 'arrival' : 'departure'} time
                </div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.5rem', color: '#dc2626' }}>
                +₱500
              </div>
            </div>

            <p style={{ fontSize: '0.83rem', color: '#64748b', marginTop: 14, lineHeight: 1.55, marginBottom: 0 }}>
              If you proceed, <strong style={{ color: '#0f172a' }}>₱500</strong> will be added to the total amount. You can also close this and choose a different time to avoid the extra charge.
            </p>
          </div>

          {/* Footer */}
          <div style={{
            padding: '0 28px 24px',
            display: 'flex', gap: 10,
          }}>
            <button
              onClick={handleLateNightClose}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12,
                background: '#f1f5f9', color: '#475569',
                border: '1.5px solid #e2e8f0', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseOut={e => e.currentTarget.style.background = '#f1f5f9'}
            >
              Close
            </button>
            <button
              onClick={handleLateNightConfirm}
              style={{
                flex: 1.4, padding: '12px 0', borderRadius: 12,
                background: 'linear-gradient(135deg, #f59e0b, #fc9c1b)',
                color: '#fff', border: 'none', fontWeight: 700,
                fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(245,158,11,0.35)',
                transition: 'all 0.2s',
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              ✓ Continue with +₱500
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        `}</style>
      </div>,
      document.body
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PREVIEW MODAL
  // ─────────────────────────────────────────────────────────────────────────
  if (showPreview) {
    const primaryPax = passengers[0];
    return (
      <div className="nbm-preview-overlay">
        <div className="nbm-preview-modal">
          {/* Header */}
          <div className="nbm-preview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🚐</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Transfer Booking Preview</h2>
                <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>Please review before confirming</p>
              </div>
            </div>
            <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', fontSize: '32px', color: 'white', cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>

          {/* Body */}
          <div className="nbm-preview-body">

            {/* Customer */}
            <div className="nbm-preview-section">
              <div className="nbm-preview-section-title">👤 Customer Information</div>
              <div className="nbm-preview-row">
                <span>Name</span>
                <strong>{primaryPax.firstName} {primaryPax.lastName}</strong>
              </div>
              <div className="nbm-preview-row">
                <span>Email</span>
                <strong>{primaryPax.email}</strong>
              </div>
              <div className="nbm-preview-row">
                <span>Phone</span>
                <strong>{primaryPax.phone}</strong>
              </div>
            </div>

            {/* Trip Details */}
            <div className="nbm-preview-section">
              <div className="nbm-preview-section-title"><MapPin size={18} /> Trip Details</div>
              <div className="nbm-preview-row">
                <span>Destination</span>
                <strong>{destination}</strong>
              </div>
              <div className="nbm-preview-row">
                <span>Transfer</span>
                <strong>{selectedTransfer?.title || '—'}</strong>
              </div>
              <div className="nbm-preview-row">
                <span>Trip Type</span>
                <strong style={{ textTransform: 'capitalize' }}>{tripType === 'roundtrip' ? '↔ Roundtrip' : '→ One Way'}</strong>
              </div>
              <div className="nbm-preview-row">
                <span>Passengers</span>
                <strong>{paxCount} pax</strong>
              </div>
              <div className="nbm-preview-row">
                <span>Travel Date</span>
                <strong>{travelDate}</strong>
              </div>
              <div className="nbm-preview-row">
                <span>Arrival Time</span>
                <strong>
                  {arrivalTime}
                  {isLateNightTime(arrivalTime) && (
                    <span style={{ marginLeft: 8, background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>🌙 Late Night</span>
                  )}
                </strong>
              </div>
              <div className="nbm-preview-row">
                <span>Pickup Location</span>
                <strong>{pickupLocation}</strong>
              </div>
              {tripType === 'roundtrip' && (
                <>
                  <div className="nbm-preview-row">
                    <span>Return Date</span>
                    <strong>{returnDate}</strong>
                  </div>
                  <div className="nbm-preview-row">
                    <span>Departure Time</span>
                    <strong>
                      {departureTime}
                      {isLateNightTime(departureTime) && (
                        <span style={{ marginLeft: 8, background: '#fef2f2', color: '#dc2626', fontSize: '0.75rem', fontWeight: 700, padding: '2px 7px', borderRadius: 6 }}>🌙 Late Night</span>
                      )}
                    </strong>
                  </div>
                  <div className="nbm-preview-row">
                    <span>Dropoff Location</span>
                    <strong>{dropoffLocation}</strong>
                  </div>
                </>
              )}
            </div>

            {/* Passengers */}
            <div className="nbm-preview-section">
              <div className="nbm-preview-section-title"><Users size={18} /> Passengers ({passengers.length})</div>
              {passengers.map((p, i) => (
                <div key={i} className="nbm-preview-passenger">
                  <strong>Passenger {i + 1}:</strong> {p.firstName} {p.lastName}
                  {p.phone && <span style={{ marginLeft: 12, color: '#64748b' }}>• {p.phone}</span>}
                  {p.gender && <span style={{ marginLeft: 12, color: '#94a3b8', fontSize: '0.88rem' }}>• {p.gender}</span>}
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            <div className="nbm-preview-section">
              <div className="nbm-preview-section-title"><CreditCard size={18} /> Payment Summary</div>
              <div className="nbm-preview-row">
                <span>Transfer Price ({tripType === 'roundtrip' ? 'Roundtrip' : 'One Way'})</span>
                <span>₱{sellingPrice.toLocaleString()}</span>
              </div>
              {arrivalSurcharge > 0 && (
                <div className="nbm-preview-row">
                  <span>🌙 Late Night Surcharge (Arrival)</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>+₱{arrivalSurcharge.toLocaleString()}</span>
                </div>
              )}
              {departureSurcharge > 0 && (
                <div className="nbm-preview-row">
                  <span>🌙 Late Night Surcharge (Departure)</span>
                  <span style={{ color: '#dc2626', fontWeight: 700 }}>+₱{departureSurcharge.toLocaleString()}</span>
                </div>
              )}
              <div className="nbm-preview-row">
                <span>Payment Type</span>
                <span style={{ textTransform: 'capitalize' }}>{paymentType === 'partial' ? 'Partial (50% deposit)' : 'Full Payment'}</span>
              </div>
              <div className="nbm-preview-total">
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                  {paymentType === 'partial' ? 'INITIAL PAYMENT DUE NOW' : 'TOTAL AMOUNT'}
                </div>
                <div className="nbm-due-now">₱{initialPaymentAmount.toLocaleString()}</div>
                {paymentType === 'partial' && (
                  <p style={{ marginTop: 8, color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>
                    50% deposit • Balance ₱{remainingBalance.toLocaleString()} due before travel
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', background: '#fff' }}>
            <button onClick={() => setShowPreview(false)} className="nbm-btn nbm-btn-back" style={{ flex: 1 }}>
              ← Back to Edit
            </button>
            <button onClick={handleSubmit} disabled={loading} className="nbm-btn nbm-btn-next" style={{ flex: 1 }}>
              {loading ? 'Creating Booking...' : '✅ Confirm & Create Booking'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN MODAL
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Late Night Warning floating above everything */}
      <LateNightSurchargeModal />

      <div className="nbm-overlay">
        <div className="nbm-modal">

          {/* ── Header ── */}
          <div className="nbm-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #fc9c1b)', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                🚐
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>New Transfer Booking</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Create a sales transfer booking</p>
              </div>
            </div>
            <button onClick={handleClose} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b', lineHeight: 1, padding: '0 4px', borderRadius: '6px' }}>×</button>
          </div>

          {/* ── Progress ── */}
          <div className="nbm-progress">
            <div className={`nbm-step ${currentStep === 1 ? 'active' : ''}`}>
              <div className={`nbm-step-dot ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
                {currentStep > 1 ? '✓' : '1'}
              </div>
              Trip & Passengers
            </div>
            <div className="nbm-progress-line" style={{ background: currentStep >= 2 ? '#f59e0b' : '#e2e8f0' }} />
            <div className={`nbm-step ${currentStep === 2 ? 'active' : ''}`}>
              <div className={`nbm-step-dot ${currentStep === 2 ? 'active' : ''}`}>2</div>
              Payment Option
            </div>
          </div>

          {/* ── Body ── */}
          <div className="nbm-body">

            {/* ════════════════ STEP 1 ════════════════ */}
            {currentStep === 1 && (
              <>
                <h3 className="nbm-step-title">Trip Details</h3>
                <p className="nbm-step-subtitle">Set destination, select a transfer, then fill in trip configuration.</p>

                {/* ── Trip Details Card ── */}
                <div className="nbm-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #fc9c1b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🗺️</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Trip Details</div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Destination, vehicle, and trip type</div>
                    </div>
                  </div>

                  {/* ── Destination with autocomplete ── */}
                  <div className="nbm-field">
                    <label>Destination <span style={{ color: 'red' }}>*</span></label>
                    <div ref={destWrapperRef} style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={destination}
                        onChange={e => {
                          setDestination(e.target.value);
                          setShowDestDropdown(true);
                        }}
                        onFocus={() => destination.trim() && setShowDestDropdown(true)}
                        placeholder="e.g. Baguio, Boracay, Puerto Princesa..."
                        autoComplete="off"
                      />
                      {showDestDropdown && destSuggestions.length > 0 && (
                        <div className="nbm-dest-dropdown">
                          {destSuggestions.map((suggestion, idx) => (
                            <div
                              key={idx}
                              className="nbm-dest-option"
                              onMouseDown={e => {
                                // use mouseDown so blur doesn't fire before click
                                e.preventDefault();
                                setDestination(suggestion);
                                setShowDestDropdown(false);
                              }}
                            >
                              <MapPin size={14} style={{ flexShrink: 0, color: '#f59e0b' }} />
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pax + Trip Type in 2 columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                    {/* Pax */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                        Number of Pax <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', width: 'fit-content' }}>
                        <button className="nbm-pax-btn" onClick={() => setPaxCount(p => Math.max(1, p - 1))} disabled={paxCount <= 1} style={{ borderRadius: 0, border: 'none', borderRight: '1.5px solid #e2e8f0', background: '#fff' }}>−</button>
                        <span className="nbm-pax-count" style={{ padding: '0 20px', fontSize: '1.4rem' }}>{paxCount}</span>
                        <button className="nbm-pax-btn" onClick={() => setPaxCount(p => p + 1)} style={{ borderRadius: 0, border: 'none', borderLeft: '1.5px solid #e2e8f0', background: '#fff' }}>+</button>
                      </div>
                    </div>

                    {/* Trip Type */}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                        Trip Type <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setTripType('oneway')}
                          style={{
                            flex: 1, padding: '12px 10px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                            background: tripType === 'oneway' ? 'linear-gradient(135deg, #f59e0b, #fc9c1b)' : '#fff',
                            color: tripType === 'oneway' ? '#fff' : '#64748b',
                            border: tripType === 'oneway' ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                          }}
                        >
                          → One Way
                        </button>
                        <button
                          onClick={() => setTripType('roundtrip')}
                          style={{
                            flex: 1, padding: '12px 10px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                            background: tripType === 'roundtrip' ? 'linear-gradient(135deg, #0284c7, #0369a1)' : '#fff',
                            color: tripType === 'roundtrip' ? '#fff' : '#64748b',
                            border: tripType === 'roundtrip' ? '2px solid #0284c7' : '2px solid #e2e8f0',
                          }}
                        >
                          ↔ Roundtrip
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Transfer selection */}
                  <div className="nbm-field" style={{ marginTop: 20 }}>
                    <label>Select Transfer <span style={{ color: 'red' }}>*</span>
                      {destination && <span style={{ fontSize: '0.78rem', fontWeight: 400, color: '#94a3b8', marginLeft: 6 }}>— showing vehicles for {paxCount} pax</span>}
                    </label>
                    {!destination.trim() ? (
                      <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1.5px dashed #e2e8f0', borderRadius: 10, color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                        Enter a destination first to see available transfers
                      </div>
                    ) : loadingTransfers ? (
                      <div style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, color: '#94a3b8', textAlign: 'center' }}>Loading transfers...</div>
                    ) : filteredTransfers.length === 0 ? (
                      <div style={{ padding: '14px 16px', background: '#fefce8', border: '1.5px solid #fde047', borderRadius: 10, color: '#854d0e', fontSize: '0.9rem', textAlign: 'center' }}>
                        No transfers available for this destination / pax count
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {filteredTransfers.map(t => {
                          const price = tripType === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
                          const isSelected = selectedTransfer?._id === t._id;
                          const hasRoundtrip = (t.roundtripPrice || 0) > 0;
                          if (tripType === 'roundtrip' && !hasRoundtrip) return null;
                          return (
                            <div
                              key={t._id}
                              onClick={() => setSelectedTransfer(t)}
                              style={{
                                padding: '16px 18px', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                                border: isSelected ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                                background: isSelected ? 'linear-gradient(135deg, #fff9f0, #fff)' : '#fff',
                                boxShadow: isSelected ? '0 4px 12px rgba(245,158,11,0.15)' : 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ width: 36, height: 36, borderRadius: 8, background: isSelected ? '#f59e0b' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <Car size={18} color={isSelected ? '#fff' : '#64748b'} />
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{t.title}</div>
                                  {t.category && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>🏷 {t.category}</div>}
                                  {t.pax && <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>👥 Up to {t.pax} pax</div>}
                                </div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isSelected ? '#f59e0b' : '#0f172a' }}>
                                  ₱{price.toLocaleString()}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{tripType === 'roundtrip' ? 'roundtrip' : 'one way'}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Trip Configuration Card ── */}
                <div className="nbm-card" style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #0284c7, #0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📅</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>Trip Configuration</div>
                      <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Schedule and locations</div>
                    </div>
                  </div>

                  {/* Travel Date + Arrival Time */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div className="nbm-field">
                      <label>Travel Date <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div className="nbm-field">
                      <label>
                        Arrival Time <span style={{ color: '#ef4444' }}>*</span>
                        {isLateNightTime(arrivalTime) && (
                          <span style={{ marginLeft: 6, background: '#fef2f2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>🌙 +₱500</span>
                        )}
                      </label>
                      <input
                        type="time"
                        value={arrivalTime}
                        onChange={e => handleArrivalTimeChange(e.target.value)}
                        style={isLateNightTime(arrivalTime) ? { borderColor: '#fca5a5', background: '#fff5f5' } : {}}
                      />
                    </div>
                  </div>

                  {/* Roundtrip: Return Date + Departure Time */}
                  {tripType === 'roundtrip' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                      <div className="nbm-field">
                        <label>Return Date <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={travelDate || new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="nbm-field">
                        <label>
                          Departure Time <span style={{ color: '#ef4444' }}>*</span>
                          {isLateNightTime(departureTime) && (
                            <span style={{ marginLeft: 6, background: '#fef2f2', color: '#dc2626', fontSize: '0.72rem', fontWeight: 700, padding: '2px 6px', borderRadius: 5 }}>🌙 +₱500</span>
                          )}
                        </label>
                        <input
                          type="time"
                          value={departureTime}
                          onChange={e => handleDepartureTimeChange(e.target.value)}
                          style={isLateNightTime(departureTime) ? { borderColor: '#fca5a5', background: '#fff5f5' } : {}}
                        />
                      </div>
                    </div>
                  )}

                  {/* Late night surcharge notice strip */}
                  {totalSurcharge > 0 && (
                    <div style={{
                      marginTop: 14,
                      background: 'linear-gradient(135deg, #fff5f5, #fef2f2)',
                      border: '1.5px solid #fca5a5',
                      borderRadius: 10, padding: '10px 14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 10,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16 }}>🌙</span>
                        <span style={{ fontSize: '0.83rem', color: '#7f1d1d', fontWeight: 600 }}>
                          Late night surcharge applied
                          {arrivalSurcharge > 0 && departureSurcharge > 0
                            ? ' (arrival + departure)'
                            : arrivalSurcharge > 0 ? ' (arrival)' : ' (departure)'}
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                        +₱{totalSurcharge.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Pickup Location */}
                  <div className="nbm-field" style={{ marginTop: 16 }}>
                    <label>Pickup Location <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" value={pickupLocation} onChange={e => setPickupLocation(e.target.value)} placeholder="e.g. NAIA Terminal 3, Hotel Name..." />
                  </div>

                  {/* Dropoff — roundtrip only */}
                  {tripType === 'roundtrip' && (
                    <div className="nbm-field" style={{ marginTop: 16 }}>
                      <label>Dropoff Location <span style={{ color: '#ef4444' }}>*</span></label>
                      <input type="text" value={dropoffLocation} onChange={e => setDropoffLocation(e.target.value)} placeholder="e.g. Return dropoff point..." />
                    </div>
                  )}
                </div>

                {/* ── Passengers Card ── */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h3 className="nbm-step-title" style={{ marginBottom: 4 }}>Passenger Details</h3>
                      <p className="nbm-step-subtitle" style={{ margin: 0 }}>Fill in info for all {paxCount} passenger{paxCount > 1 ? 's' : ''}.</p>
                    </div>
                  </div>

                  {passengers.map((p, i) => (
                    <div key={i} className="nbm-passenger-card">
                      <div className="nbm-passenger-heading">
                        <div className="nbm-passenger-num">{i + 1}</div>
                        <div className="nbm-passenger-label">Passenger {i + 1}{i === 0 ? ' (Primary Contact)' : ''}</div>
                      </div>

                      {/* Row 1: First + Last Name */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div className="nbm-pfield">
                          <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                          <input value={p.firstName} onChange={e => updatePassenger(i, 'firstName', e.target.value)} placeholder="Juan" />
                        </div>
                        <div className="nbm-pfield">
                          <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                          <input value={p.lastName} onChange={e => updatePassenger(i, 'lastName', e.target.value)} placeholder="Dela Cruz" />
                        </div>
                      </div>

                      {/* Row 2: Email + Phone */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <div className="nbm-pfield">
                          <label>Email {i === 0 && <span style={{ color: '#ef4444' }}>*</span>}</label>
                          <input type="email" value={p.email} onChange={e => updatePassenger(i, 'email', e.target.value)} placeholder="juan@email.com" />
                        </div>
                        <div className="nbm-pfield">
                          <label>Phone {i === 0 && <span style={{ color: '#ef4444' }}>*</span>}</label>
                          <input type="tel" value={p.phone} onChange={e => updatePassenger(i, 'phone', e.target.value)} placeholder="+63 912 345 6789" />
                        </div>
                      </div>

                      {/* Row 3: DOB */}
                      <div className="nbm-pfield" style={{ marginTop: 12 }}>
                        <label>Date of Birth</label>
                        <div className="nbm-dob-row">
                          <select className="nbm-dob-select dob-day" value={p.dobDay} onChange={e => handleDobPartChange(i, 'dobDay', e.target.value)} style={{ width: '72px' }}>
                            <option value="">DD</option>
                            {Array.from({ length: 31 }, (_, n) => n + 1).map(d => (
                              <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                            ))}
                          </select>
                          <select className="nbm-dob-select" value={p.dobMonth} onChange={e => handleDobPartChange(i, 'dobMonth', e.target.value)} style={{ width: '92px' }}>
                            <option value="">Month</option>
                            {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, idx) => (
                              <option key={idx+1} value={idx+1}>{m}</option>
                            ))}
                          </select>
                          <select className="nbm-dob-select dob-year" value={p.dobYear} onChange={e => handleDobPartChange(i, 'dobYear', e.target.value)} style={{ width: '82px' }}>
                            <option value="">Year</option>
                            {Array.from({ length: new Date().getFullYear() - 1939 }, (_, n) => new Date().getFullYear() - n).map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                          <div className={`nbm-age-badge${p.age ? '' : ' nbm-age-badge-empty'}`} style={{ minWidth: '68px', textAlign: 'center' }}>
                            {p.age ? <>{p.age} <span style={{ fontSize: '0.73rem', opacity: 0.85 }}>yrs</span></> : '—'}
                          </div>
                        </div>
                      </div>

                      {/* Row 4: Gender + Nationality */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                        <div className="nbm-pfield">
                          <label>Gender</label>
                          <select value={p.gender} onChange={e => updatePassenger(i, 'gender', e.target.value)}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="nbm-pfield">
                          <label>Nationality</label>
                          <input value={p.nationality} onChange={e => updatePassenger(i, 'nationality', e.target.value)} placeholder="Filipino" />
                        </div>
                      </div>

                      {/* Row 5: Address */}
                      <div className="nbm-pfield" style={{ marginTop: 12 }}>
                        <label>Complete Address</label>
                        <input value={p.address} onChange={e => updatePassenger(i, 'address', e.target.value)} placeholder="123 Main St, City" />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ════════════════ STEP 2 — PAYMENT ════════════════ */}
            {currentStep === 2 && (
              <>
                <h3 className="nbm-step-title">Payment Option</h3>
                <p className="nbm-step-subtitle">Choose how the customer will pay for this transfer booking.</p>

                {/* Price summary pill */}
                {selectedTransfer && (
                  <div style={{ background: 'linear-gradient(135deg, #fff9f0, #fefce8)', border: '2px solid #fcd34d', borderRadius: 14, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Car size={20} color="#f59e0b" />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>{selectedTransfer.title}</div>
                        <div style={{ fontSize: '0.78rem', color: '#92400e' }}>
                          {tripType === 'roundtrip' ? '↔ Roundtrip' : '→ One Way'} · {paxCount} pax · {travelDate}
                          {totalSurcharge > 0 && <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 700 }}>· 🌙 +₱{totalSurcharge.toLocaleString()} surcharge</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#f59e0b' }}>₱{totalAmount.toLocaleString()}</div>
                  </div>
                )}

                {/* Payment cards */}
                <div className="bfm-payment-section" style={{ marginTop: 0 }}>
                  <div className="bfm-payment-header">
                    <CreditCard size={22} />
                    <h3>Select Payment Method</h3>
                  </div>

                  <div className="bfm-payment-options">
                    {/* Full Payment */}
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
                          <span>Full Payment</span>
                          <span className="bfm-recommended-badge">✓ Recommended</span>
                        </div>
                      </div>
                      <div className="bfm-payment-card-body">
                        <div className="bfm-payment-amount">
                          ₱{totalAmount.toLocaleString()}
                          <span className="bfm-payment-percentage">100%</span>
                        </div>
                        <div className="bfm-payment-description">Pay the full amount now and you're all set.</div>
                        <ul className="bfm-payment-benefits">
                          <li>✅ Instant booking confirmation</li>
                          <li>✅ No balance to follow up</li>
                        </ul>
                      </div>
                    </div>

                    {/* Partial Payment */}
                    {!isPartialPaymentRestricted && (
                    <div
                      className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
                      onClick={() => setPaymentType('partial')}
                    >
                      <div className="bfm-payment-card-header">
                        <div className="bfm-payment-radio">
                          <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                        </div>
                        <div className="bfm-payment-card-title">
                          <CreditCard size={18} />
                          <span>Partial Payment</span>
                          <span className="bfm-flexible-badge">Flexible</span>
                        </div>
                      </div>
                      <div className="bfm-payment-card-body">
                        <div className="bfm-payment-amount">
                          ₱{Math.round(totalAmount / 2).toLocaleString()}
                          <span className="bfm-payment-percentage">50%</span>
                        </div>
                        <div className="bfm-payment-description">Pay 50% now, settle balance before travel date.</div>
                        {paymentType === 'partial' && (
                          <div className="bfm-payment-breakdown">
                            <div className="bfm-breakdown-row">
                              <span>Due Now (50%)</span>
                              <strong>₱{initialPaymentAmount.toLocaleString()}</strong>
                            </div>
                            <div className="bfm-breakdown-row">
                              <span>Balance Due</span>
                              <strong>₱{remainingBalance.toLocaleString()}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Partial payment restriction notice */}
                  {isPartialPaymentRestricted && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: 10,
                      background: '#fefce8', border: '1.5px solid #fde68a',
                      borderRadius: 12, padding: '12px 16px', marginTop: 12,
                    }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
                      <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
                        <strong>Partial payment is not available</strong> for bookings with a travel date of <strong>today or tomorrow</strong>. Full payment is required.
                      </div>
                    </div>
                  )}
                  <div className="bfm-payment-summary">
                    <div className="bfm-summary-row">
                      <span>Base Transfer Price</span>
                      <span>₱{sellingPrice.toLocaleString()}</span>
                    </div>
                    {arrivalSurcharge > 0 && (
                      <div className="bfm-summary-row">
                        <span>🌙 Late Night Surcharge (Arrival)</span>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>+₱{arrivalSurcharge.toLocaleString()}</span>
                      </div>
                    )}
                    {departureSurcharge > 0 && (
                      <div className="bfm-summary-row">
                        <span>🌙 Late Night Surcharge (Departure)</span>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>+₱{departureSurcharge.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="bfm-summary-row">
                      <span>Amount Due Now</span>
                      <span className="bfm-amount-highlight">₱{initialPaymentAmount.toLocaleString()}</span>
                    </div>
                    {paymentType === 'partial' && (
                      <div className="bfm-summary-row bfm-remaining">
                        <span>Remaining Balance</span>
                        <span>₱{remainingBalance.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '20px 32px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, background: '#fff' }}>
            {currentStep === 1 ? (
              <>
                <button onClick={handleClose} className="nbm-btn nbm-btn-back" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleNext} className="nbm-btn nbm-btn-next" style={{ flex: 2 }}>Next: Payment Option →</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentStep(1)} className="nbm-btn nbm-btn-back" style={{ flex: 1 }}>← Back</button>
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={loading}
                  className="nbm-btn nbm-btn-next"
                  style={{ flex: 2 }}
                >
                  {loading ? 'Processing...' : '📋 Review Booking'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default NewTransferBookingModal;