import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../../toast/ToastManager';
import { BASE_URL, isLateNightTime, isTodayOrTomorrow, LATE_NIGHT_SURCHARGE } from '../utils/transferHelpers';

const BLANK_PASSENGER = {
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
  age: '', gender: '', address: '', nationality: 'Filipino',
};

export const useTransferBooking = (isOpen, onClose) => {
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
  const [passengers, setPassengers] = useState([{ ...BLANK_PASSENGER }]);

  // ── Payment ─────────────────────────────────────────────────────────────
  const [paymentType, setPaymentType] = useState('full');

  // ── Late Night Surcharge Modal ───────────────────────────────────────────
  const [lateNightModal, setLateNightModal] = useState(null); // 'arrival' | 'departure' | null
  const [pendingTime, setPendingTime] = useState('');

  // ── Partial Payment Restriction ─────────────────────────────────────────
  const isPartialPaymentRestricted = isTodayOrTomorrow(travelDate);

  // Auto-reset to full payment if travel date becomes today/tomorrow
  useEffect(() => {
    if (isPartialPaymentRestricted && paymentType === 'partial') {
      setPaymentType('full');
    }
  }, [isPartialPaymentRestricted]);

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
    if (!destination.trim()) {
      setFilteredTransfers([]);
      setSelectedTransfer(null);
      return;
    }
    const destKey = destination.trim().toLowerCase();
    const filtered = allTransfers.filter(t => {
      if (!t.isActive) return false;
      const maxPax = t.pax || 999;
      if (paxCount > maxPax) return false;
      if (!t.packageDestination) return true;
      const tDest = (t.packageDestination || '').toLowerCase().split(',')[0].trim();
      return tDest.includes(destKey.split(',')[0].trim()) || destKey.split(',')[0].trim().includes(tDest);
    });
    setFilteredTransfers(filtered);
    if (selectedTransfer && !filtered.find(t => t._id === selectedTransfer._id)) {
      setSelectedTransfer(null);
    }
  }, [destination, paxCount, allTransfers]);

  // ── Sync passengers array with paxCount ─────────────────────────────────
  useEffect(() => {
    setPassengers(prev => {
      if (prev.length === paxCount) return prev;
      if (prev.length < paxCount) {
        const extras = Array.from({ length: paxCount - prev.length }, () => ({ ...BLANK_PASSENGER }));
        return [...prev, ...extras];
      }
      return prev.slice(0, paxCount);
    });
  }, [paxCount]);

  // ── Late Night Surcharge calculation ─────────────────────────────────────
  const arrivalSurcharge   = isLateNightTime(arrivalTime)   ? LATE_NIGHT_SURCHARGE : 0;
  const departureSurcharge = (tripType === 'roundtrip' && isLateNightTime(departureTime)) ? LATE_NIGHT_SURCHARGE : 0;
  const totalSurcharge     = arrivalSurcharge + departureSurcharge;

  // ── Computed values ─────────────────────────────────────────────────────
  const sellingPrice = selectedTransfer
    ? (tripType === 'roundtrip' ? (selectedTransfer.roundtripPrice || 0) : (selectedTransfer.oneWayPrice || 0))
    : 0;
  const totalAmount          = sellingPrice + totalSurcharge;
  const initialPaymentAmount = paymentType === 'partial' ? Math.round(totalAmount / 2) : totalAmount;
  const remainingBalance     = paymentType === 'partial' ? totalAmount - initialPaymentAmount : 0;

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
    if (lateNightModal === 'arrival') setArrivalTime(pendingTime);
    else if (lateNightModal === 'departure') setDepartureTime(pendingTime);
    setPendingTime('');
    setLateNightModal(null);
  };

  const handleLateNightClose = () => {
    if (lateNightModal === 'arrival') setArrivalTime('');
    else if (lateNightModal === 'departure') setDepartureTime('');
    setPendingTime('');
    setLateNightModal(null);
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!destination.trim())    { toast.error('Please enter a destination'); return false; }
    if (!selectedTransfer)      { toast.error('Please select a transfer vehicle'); return false; }
    if (!travelDate)            { toast.error('Please select a travel date'); return false; }
    if (!arrivalTime)           { toast.error('Please enter arrival time'); return false; }
    if (!pickupLocation.trim()) { toast.error('Please enter pickup location'); return false; }
    if (tripType === 'roundtrip') {
      if (!returnDate)              { toast.error('Please select return date for roundtrip'); return false; }
      if (!departureTime)           { toast.error('Please enter departure time for roundtrip'); return false; }
      if (!dropoffLocation.trim())  { toast.error('Please enter dropoff location for roundtrip'); return false; }
    }
    const p = passengers[0];
    if (!p.firstName.trim() || !p.lastName.trim()) { toast.error('Passenger 1 full name is required'); return false; }
    if (!p.email.trim())  { toast.error('Passenger 1 email is required'); return false; }
    if (!p.phone.trim())  { toast.error('Passenger 1 phone number is required'); return false; }
    if (!p.age || parseInt(p.age) < 18) { toast.error('Passenger 1 must be at least 18 years old to book.'); return false; }
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

      const bookingRes = await fetch(`${BASE_URL}/api/transfer-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });
      const bookingResult = await bookingRes.json();
      if (!bookingResult.success) throw new Error(bookingResult.message || 'Failed to create transfer booking');

      const bookingId = bookingResult.bookingId || bookingResult.data?._id;
      console.log('✅ Transfer booking created (sales) → ID:', bookingId);


      const amountToPay = paymentType === 'full' ? totalAmount : initialPaymentAmount;
      const paymentRes = await fetch(`${BASE_URL}/api/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, paymentType, paymentAmount: amountToPay }),
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
    setPassengers([{ ...BLANK_PASSENGER }]);
    setPaymentType('full');
    setLateNightModal(null);
    setPendingTime('');
    onClose();
  };

  return {
    // state
    loading, showPreview, setShowPreview,
    currentStep, setCurrentStep,
    destination, setDestination,
    filteredTransfers,
    selectedTransfer, setSelectedTransfer,
    loadingTransfers,
    showDestDropdown, setShowDestDropdown,
    destWrapperRef,
    paxCount, setPaxCount,
    tripType, setTripType,
    travelDate, setTravelDate,
    returnDate, setReturnDate,
    arrivalTime,
    departureTime,
    pickupLocation, setPickupLocation,
    dropoffLocation, setDropoffLocation,
    passengers,
    paymentType, setPaymentType,
    isPartialPaymentRestricted,
    lateNightModal,
    pendingTime,
    // computed
    arrivalSurcharge, departureSurcharge, totalSurcharge,
    sellingPrice, totalAmount, initialPaymentAmount, remainingBalance,
    // suggestions
    destSuggestions,
    // handlers
    handleNext, handleBack, handleClose, handleSubmit,
    handleArrivalTimeChange, handleDepartureTimeChange,
    handleLateNightConfirm, handleLateNightClose,
    updatePassenger, handleDobPartChange,
  };
};
