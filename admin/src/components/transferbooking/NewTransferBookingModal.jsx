import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { X, Users, Calendar, MapPin, CreditCard, Car, Clock, ArrowRightLeft, Navigation } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import LocationSelect from '../location/LocationSelect';
import CustomTimePicker from '../timePicker/Clock';
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
                flexShrink: 0,
              }}><Clock size={22} color="#fbbf24" /></div>
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
              <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}><Clock size={18} color="#f59e0b" /></span>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div className="nbm-preview-header-icon">
                <Car size={18} color="#f59e0b" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, letterSpacing: '-0.01em' }}>Transfer Booking Preview</h2>
                <p style={{ margin: 0, opacity: 0.65, fontSize: '0.82rem', marginTop: 2 }}>Please review all details before confirming</p>
              </div>
            </div>
            <button
              onClick={() => setShowPreview(false)}
              className="nbm-preview-close-btn"
            >
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
                      {p.phone && <span className="nbm-preview-pax-phone">{p.phone}</span>}
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
                  <span className="nbm-preview-label">Transfer Price ({tripType === 'roundtrip' ? 'Roundtrip' : 'One Way'})</span>
                  <strong className="nbm-preview-value">₱{sellingPrice.toLocaleString()}</strong>
                </div>
                {arrivalSurcharge > 0 && (
                  <div className="nbm-preview-row">
                    <span className="nbm-preview-label">Late Night Surcharge (Arrival)</span>
                    <strong className="nbm-preview-value" style={{ color: '#dc2626' }}>+₱{arrivalSurcharge.toLocaleString()}</strong>
                  </div>
                )}
                {departureSurcharge > 0 && (
                  <div className="nbm-preview-row">
                    <span className="nbm-preview-label">Late Night Surcharge (Departure)</span>
                    <strong className="nbm-preview-value" style={{ color: '#dc2626' }}>+₱{departureSurcharge.toLocaleString()}</strong>
                  </div>
                )}
                <div className="nbm-preview-row nbm-preview-row-last">
                  <span className="nbm-preview-label">Payment Type</span>
                  <span className="nbm-preview-value">{paymentType === 'partial' ? 'Partial (50% Deposit)' : 'Full Payment'}</span>
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
            <button onClick={() => setShowPreview(false)} className="nbm-btn nbm-btn-back">
              Back to Edit
            </button>
            <button onClick={handleSubmit} disabled={loading} className="nbm-btn nbm-btn-next nbm-preview-confirm-btn">
              {loading ? 'Creating Booking...' : 'Confirm & Create Booking'}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: 'linear-gradient(135deg, #f59e0b, #fc9c1b)', borderRadius: 9, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Car size={18} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>New Transfer Booking</h2>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>Create a sales transfer booking</p>
              </div>
            </div>
            <button onClick={handleClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', fontSize: '20px', cursor: 'pointer', color: 'rgba(255,255,255,0.8)', lineHeight: 1, padding: '4px 8px', borderRadius: '6px' }}>×</button>
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
                {/* ── Trip Details Card ── */}
                <div className="nbm-section-card">

                  {/* Section Header */}
                  <div className="nbm-section-header">
                    <div className="nbm-section-header-icon">
                      <Navigation size={14} color="#fff" />
                    </div>
                    <div>
                      <div className="nbm-section-header-title">Trip Details</div>
                      <div className="nbm-section-header-sub">Destination, vehicle, and trip type</div>
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="nbm-section-body">
                    <div className="nbm-field">
                      <label>Destination <span className="nbm-required">*</span></label>
                      <div ref={destWrapperRef} style={{ position: 'relative' }}>
                        <div className="nbm-input-icon-wrap">
                          <MapPin size={15} className="nbm-input-icon" />
                          <input
                            type="text"
                            className="nbm-input-with-icon"
                            value={destination}
                            onChange={e => { setDestination(e.target.value); setShowDestDropdown(true); }}
                            onFocus={() => destination.trim() && setShowDestDropdown(true)}
                            placeholder="e.g. Baguio, Boracay, Puerto Princesa..."
                            autoComplete="off"
                          />
                        </div>
                        {showDestDropdown && destSuggestions.length > 0 && (
                          <div className="nbm-dest-dropdown">
                            {destSuggestions.map((suggestion, idx) => (
                              <div
                                key={idx}
                                className="nbm-dest-option"
                                onMouseDown={e => {
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

                    {/* Pax + Trip Type */}
                    <div className="nbm-row-2col">
                      <div className="nbm-field">
                        <label>Passengers <span className="nbm-required">*</span></label>
                        <div className="nbm-pax-stepper">
                          <button className="nbm-pax-step-btn" onClick={() => setPaxCount(p => Math.max(1, p - 1))} disabled={paxCount <= 1}>−</button>
                          <span className="nbm-pax-step-val">{paxCount} <span className="nbm-pax-step-unit">pax</span></span>
                          <button className="nbm-pax-step-btn" onClick={() => setPaxCount(p => p + 1)}>+</button>
                        </div>
                      </div>

                      <div className="nbm-field">
                        <label>Trip Type <span className="nbm-required">*</span></label>
                        <div className="nbm-segment-control">
                          <button
                            className={`nbm-segment-btn${tripType === 'oneway' ? ' active' : ''}`}
                            onClick={() => setTripType('oneway')}
                          >
                            One Way
                          </button>
                          <button
                            className={`nbm-segment-btn nbm-segment-btn-rt${tripType === 'roundtrip' ? ' active-rt' : ''}`}
                            onClick={() => setTripType('roundtrip')}
                          >
                            Roundtrip
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transfer Selection */}
                    <div className="nbm-field">
                      <div className="nbm-field-label-row">
                        <label>Select Transfer <span className="nbm-required">*</span></label>
                        {destination && (
                          <span className="nbm-field-hint">vehicles for {paxCount} pax</span>
                        )}
                      </div>
                      {!destination.trim() ? (
                        <div className="nbm-transfer-empty">
                          <Navigation size={16} color="#cbd5e1" />
                          <span>Enter a destination first to see available transfers</span>
                        </div>
                      ) : loadingTransfers ? (
                        <div className="nbm-transfer-loading">Loading transfers...</div>
                      ) : filteredTransfers.length === 0 ? (
                        <div className="nbm-transfer-none">No transfers available for this destination / pax count</div>
                      ) : (
                        <div className="nbm-transfer-list">
                          {filteredTransfers.map(t => {
                            const price = tripType === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
                            const isSelected = selectedTransfer?._id === t._id;
                            const hasRoundtrip = (t.roundtripPrice || 0) > 0;
                            if (tripType === 'roundtrip' && !hasRoundtrip) return null;
                            return (
                              <div
                                key={t._id}
                                onClick={() => setSelectedTransfer(t)}
                                className={`nbm-transfer-item${isSelected ? ' selected' : ''}`}
                              >
                                <div className={`nbm-transfer-radio${isSelected ? ' selected' : ''}`} />
                                <div className={`nbm-transfer-icon${isSelected ? ' selected' : ''}`}>
                                  <Car size={15} color={isSelected ? '#fff' : '#94a3b8'} />
                                </div>
                                <div className="nbm-transfer-info">
                                  <div className="nbm-transfer-name">{t.title}</div>
                                  <div className="nbm-transfer-meta">
                                    {t.category && <span className="nbm-transfer-tag">{t.category}</span>}
                                    {t.pax && <span className="nbm-transfer-tag">Up to {t.pax} pax</span>}
                                  </div>
                                </div>
                                <div className="nbm-transfer-price-col">
                                  <div className={`nbm-transfer-price${isSelected ? ' selected' : ''}`}>₱{price.toLocaleString()}</div>
                                  <div className="nbm-transfer-price-label">{tripType === 'roundtrip' ? 'roundtrip' : 'one way'}</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Trip Configuration Card ── */}
                <div className="nbm-section-card" style={{ marginTop: 12 }}>
                  <div className="nbm-section-header nbm-section-header-blue">
                    <div className="nbm-section-header-icon nbm-section-header-icon-blue">
                      <Calendar size={14} color="#fff" />
                    </div>
                    <div>
                      <div className="nbm-section-header-title">Trip Configuration</div>
                      <div className="nbm-section-header-sub">Schedule and pickup details</div>
                    </div>
                  </div>

                  <div className="nbm-section-body">
                    {/* Travel Date + Arrival Time */}
                    <div className="nbm-row-2col">
                      <div className="nbm-field">
                        <label>Travel Date <span className="nbm-required">*</span></label>
                        <input type="date" value={travelDate} onChange={e => setTravelDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="nbm-field">
                        <label>
                          Arrival Time <span className="nbm-required">*</span>
                          {isLateNightTime(arrivalTime) && (
                            <span className="nbm-surcharge-badge">+₱500</span>
                          )}
                        </label>
                        <CustomTimePicker
                          value={arrivalTime}
                          onChange={e => handleArrivalTimeChange(e.target.value)}
                          placeholder="Select arrival time"
                          required
                        />
                      </div>
                    </div>

                    {/* Pickup Location */}
                    <div className="nbm-field">
                      <label>Pickup Location <span className="nbm-required">*</span></label>
                      <LocationSelect
                        value={pickupLocation}
                        onChange={val => setPickupLocation(val)}
                        placeholder="e.g. NAIA Terminal 3, Hotel Name..."
                        source="transfer"
                      />
                    </div>

                    {/* Roundtrip: Return Date + Departure Time */}
                    {tripType === 'roundtrip' && (
                      <>
                        <div className="nbm-roundtrip-divider">
                          <ArrowRightLeft size={12} />
                          <span>Return Trip</span>
                        </div>
                        <div className="nbm-row-2col">
                          <div className="nbm-field">
                            <label>Return Date <span className="nbm-required">*</span></label>
                            <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} min={travelDate || new Date().toISOString().split('T')[0]} />
                          </div>
                          <div className="nbm-field">
                            <label>
                              Departure Time <span className="nbm-required">*</span>
                              {isLateNightTime(departureTime) && (
                                <span className="nbm-surcharge-badge">+₱500</span>
                              )}
                            </label>
                            <CustomTimePicker
                              value={departureTime}
                              onChange={e => handleDepartureTimeChange(e.target.value)}
                              placeholder="Select departure time"
                              required
                            />
                          </div>
                        </div>
                        <div className="nbm-field">
                          <label>Dropoff Location <span className="nbm-required">*</span></label>
                          <LocationSelect
                            value={dropoffLocation}
                            onChange={val => setDropoffLocation(val)}
                            placeholder="e.g. Return dropoff point..."
                            source="transfer"
                          />
                        </div>
                      </>
                    )}

                    {/* Late night surcharge notice */}
                    {totalSurcharge > 0 && (
                      <div className="nbm-surcharge-notice">
                        <Clock size={13} color="#dc2626" />
                        <span>
                          Late night surcharge applied
                          {arrivalSurcharge > 0 && departureSurcharge > 0
                            ? ' (arrival + departure)'
                            : arrivalSurcharge > 0 ? ' (arrival)' : ' (departure)'}
                        </span>
                        <span className="nbm-surcharge-notice-amount">+₱{totalSurcharge.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Passengers Card ── */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <h3 className="nbm-step-title" style={{ marginBottom: 2 }}>Passenger Details</h3>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
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
                      <div className="nbm-pfield" style={{ marginTop: 10 }}>
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
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
                      <div className="nbm-pfield" style={{ marginTop: 10 }}>
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
                  <div style={{ background: 'linear-gradient(135deg, #fff9f0, #fefce8)', border: '2px solid #fcd34d', borderRadius: 12, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Car size={17} color="#f59e0b" />
                      <div>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{selectedTransfer.title}</div>
                        <div style={{ fontSize: '0.73rem', color: '#92400e' }}>
                          {tripType === 'roundtrip' ? 'Roundtrip' : 'One Way'} · {paxCount} pax · {travelDate}
                          {totalSurcharge > 0 && <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 700 }}>· +₱{totalSurcharge.toLocaleString()} surcharge</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#f59e0b' }}>₱{totalAmount.toLocaleString()}</div>
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
                          <li>Instant booking confirmation</li>
                          <li>No balance to follow up</li>
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
                      <span style={{ fontSize: 18, flexShrink: 0 }}><Clock size={16} color="#f59e0b" /></span>
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
                        <span>Late Night Surcharge (Arrival)</span>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>+₱{arrivalSurcharge.toLocaleString()}</span>
                      </div>
                    )}
                    {departureSurcharge > 0 && (
                      <div className="bfm-summary-row">
                        <span>Late Night Surcharge (Departure)</span>
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
          <div style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, background: '#fff' }}>
            {currentStep === 1 ? (
              <>
                <button onClick={handleClose} className="nbm-btn nbm-btn-back" style={{ flex: 1 }}>Cancel</button>
                <button onClick={handleNext} className="nbm-btn nbm-btn-next" style={{ flex: 2 }}>Next: Payment Option</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentStep(1)} className="nbm-btn nbm-btn-back" style={{ flex: 1 }}>Back</button>
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={loading}
                  className="nbm-btn nbm-btn-next"
                  style={{ flex: 2 }}
                >
                  {loading ? 'Processing...' : 'Review Booking'}
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