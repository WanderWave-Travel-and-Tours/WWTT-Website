import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../../toast/ToastManager';
import {
  RESTRICTED_DESTINATIONS,
  detectTourTypeInfo,
  isAllowedBookingDay,
  getAllowedDayLabel,
} from '../utils/bookingUtils';

const API_BASE = 'https://wanderwaveph.onrender.com';

const blankPassenger = () => ({
  firstName: '', lastName: '', email: '', phone: '',
  dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
  age: '', gender: '', address: '', nationality: 'Filipino',
});

export const useNtbmBooking = ({ isOpen, onClose, bookingMode = 'assist' }) => {
  const isWalkinBooking = bookingMode === 'walkin';
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

  // Trip config
  const [paxCount, setPaxCount] = useState(1);
  const [departureDate, setDepartureDate] = useState('');

  // Payment
  const [paymentType, setPaymentType] = useState('full');

  // Passengers
  const [passengers, setPassengers] = useState([blankPassenger()]);

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

  // ── Derived: joiners-tour day restriction (mirrors sales package booking) ──
  const { isSoloJoinersPkg } = detectTourTypeInfo(selectedTour);
  const isRestrictedDestination =
    isSoloJoinersPkg &&
    RESTRICTED_DESTINATIONS.some(d =>
      (selectedDestination || '').toLowerCase().replace(/\s+/g, ' ').trim().includes(d)
    );

  // Picking a different tour resets the previously chosen date, since
  // duration/day-restriction rules can change per tour.
  const handleSelectTour = (tour) => {
    setSelectedTour(tour);
    setDepartureDate('');
  };

  // ── Mirror pax count ↔ passengers array ──────────────────────────────────
  useEffect(() => {
    if (paxCount < 1) return;
    setPassengers(prev => {
      let arr = [...prev];
      while (arr.length < paxCount) arr.push(blankPassenger());
      if (arr.length > paxCount) arr = arr.slice(0, paxCount);
      return arr;
    });
  }, [paxCount]);

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

  const isDateTodayOrTomorrow = () => {
    if (!departureDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const selected = new Date(departureDate);
    selected.setHours(0, 0, 0, 0);
    return (
      selected.getTime() === today.getTime() ||
      selected.getTime() === tomorrow.getTime()
    );
  };

  // ── Pricing ───────────────────────────────────────────────────────────────
  const tourPrice = selectedTour?.price || 0;
  const packageTotal = tourPrice * paxCount;
  const initialPaymentAmount = paymentType === 'partial'
    ? Math.round(packageTotal / 2)
    : packageTotal;
  const payableAmount = paymentType === 'partial'
    ? initialPaymentAmount
    : packageTotal;

  // ── Passenger handlers ────────────────────────────────────────────────────
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
    setPassengers(prev =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  // ── Departure date change (auto-reset payment type) ───────────────────────
  const handleDepartureDateChange = (val) => {
    setDepartureDate(val);
    if (val) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      const sel = new Date(val); sel.setHours(0, 0, 0, 0);
      if (
        sel.getTime() === today.getTime() ||
        sel.getTime() === tomorrow.getTime()
      ) {
        setPaymentType('full');
      }
    }
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!selectedDestination) { toast.error('Please select a destination'); return false; }
    if (!selectedTour)        { toast.error('Please select a tour package'); return false; }
    if (!departureDate)       { toast.error('Please pick a departure date'); return false; }
    // Only the primary passenger (index 0) has required fields
    const primary = passengers[0];
    if (!primary.firstName || !primary.lastName) {
      toast.error('Passenger 1: First & Last name required'); return false;
    }
    if (!primary.phone)       { toast.error('Passenger 1: Phone is required'); return false; }
    if (!primary.dateOfBirth) { toast.error('Passenger 1: Date of Birth is required'); return false; }
    if (!primary.age || parseInt(primary.age) < 18) {
      toast.error('Passenger 1 must be at least 18 years old to book.'); return false;
    }
    if (!primary.gender)  { toast.error('Passenger 1: Gender is required'); return false; }
    if (!primary.address) { toast.error('Passenger 1: Address is required'); return false; }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedTour || !departureDate) {
      toast.error('Missing tour or departure date');
      return;
    }
    if (packageTotal <= 0) {
      toast.error('Invalid tour price. Please check the selected tour.');
      return;
    }

    setLoading(true);
    try {
      const primaryPax = passengers[0] || {};
      const endDate = computeEndDate();

      const bookingData = {
        tourId:               selectedTour._id,
        packageName:          selectedTour.title || selectedTour.name || '',
        startDate:            departureDate,
        endDate:              endDate,
        duration:             selectedTour.duration || '',
        pax:                  { adult: paxCount, children: 0, infants: 0 },
        fullName:             `${primaryPax.firstName || ''} ${primaryPax.lastName || ''}`.trim(),
        email:                primaryPax.email?.trim() || 'noemail@wanderwaveph.com',
        message:              '',
        packagePrice:         tourPrice,
        packageTotal:         packageTotal,
        finalPackageTotal:    packageTotal,
        totalAmount:          packageTotal,
        price:                tourPrice,
        sellerPrice:          selectedTour.sellerPrice || 0,
        markup:               0,
        paymentType:          paymentType,
        initialPaymentAmount: initialPaymentAmount,
        remainingBalance:     paymentType === 'partial' ? packageTotal - initialPaymentAmount : 0,
        isWalkin:             isWalkinBooking,
        createdByType:        'sales',
        createdByEmail:       'houston@wanderwaveph.com',
        bookingSource:        isWalkinBooking ? 'walkin' : 'manual',
        passengers: passengers.map((p, idx) => ({
          passengerNumber: idx + 1,
          firstName:       p.firstName,
          lastName:        p.lastName,
          email:           p.email?.trim() || null,
          phone:           p.phone,
          dateOfBirth:     p.dateOfBirth,
          age:             parseInt(p.age) || 0,
          gender:          p.gender || '',
          address:         p.address || '',
          nationality:     p.nationality || 'Filipino',
        })),
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
    setPaxCount(1);
    setPaymentType('full');
    setPassengers([blankPassenger()]);
    onClose();
  };

  return {
    // UI state
    loading,
    currentStep,
    setCurrentStep,

    // Destination / tours
    destinations,
    filteredTours,
    selectedDestination,
    setSelectedDestination,
    selectedTour,
    setSelectedTour: handleSelectTour,
    destDropdownOpen,
    setDestDropdownOpen,
    destRef,

    // Trip config
    paxCount,
    setPaxCount,
    departureDate,
    handleDepartureDateChange,
    isRestrictedDestination,

    // Payment
    paymentType,
    setPaymentType,

    // Passengers
    passengers,
    updatePassenger,
    handleDobPartChange,

    // Pricing
    tourPrice,
    packageTotal,
    initialPaymentAmount,
    payableAmount,

    // Helpers
    getDurationDays,
    computeEndDate,
    isDateTodayOrTomorrow,
    isDateAllowed: (dateStr) => isAllowedBookingDay(dateStr, selectedTour, isRestrictedDestination),
    getAllowedDayLabel: () => getAllowedDayLabel(selectedTour),

    // Actions
    validateStep1,
    handleSubmit,
    handleClose,
  };
};
