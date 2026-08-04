import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Minus, Plus, MessageCircle, Plane, Ticket, UserCheck
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import axios from '../../lib/axiosInstance';
import TourBookingFormModal from './TourBookingFormModal';
import TourPreviewModal from './TourPreviewModal';
import './tourBookingRightForm.css'; // ✅ Reuse same styles
import { BookingStateManager } from '../../utils/bookingStateManager';
import HotelRoomSelector from './hotelRoomSelector';   // ← ADD THIS

const TourBookingRightForm = ({
  pkg,
  currency = 'PHP',
  exchangeRate = 58,
  onPaxChange = null,
  onFlightChange = null,
  initialPaxFromFunnel = null,
  currentUser = null,
}) => {
  const navigate   = useNavigate();
  const toast      = useToast();
  // ✅ Use tourId as the "code" key for BookingStateManager (no URL params for inline tour booking)
  const code = pkg._id || pkg.id || 'tour';

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  // ── Pax rules (same logic as bookingRightForm) ────────────────────────────
  const pkgNameLower     = (pkg.title || pkg.name || '').toLowerCase();
  const titleIsSoloJoiners = /solo\s*\/\s*joiners/i.test(pkgNameLower) || /\bsolo\s+joiners\b/i.test(pkgNameLower);
  const titleIsSolo        = !titleIsSoloJoiners && /\bsolo\b/i.test(pkgNameLower);
  const titleIsMinTwo      = pkgNameLower.includes('min of 2') || pkgNameLower.includes('min. of 2') ||
                             pkgNameLower.includes('minimum 2') || pkgNameLower.includes('min 2 pax') ||
                             pkgNameLower.includes('min.of 2');

  const isSoloPkg     = !titleIsSoloJoiners && ((pkg.pax === 1) || titleIsSolo);
  const isSoloJoiners = (!isSoloPkg && pkg.tourType === 'joiners') || titleIsSoloJoiners;
  const isMinTwoPkg   = (!isSoloPkg && (pkg.tourType === 'private' && pkg.pax === 2)) || titleIsMinTwo;

  const defaultPax = isSoloPkg ? 1 : isMinTwoPkg ? 2 : isSoloJoiners ? 1 : 2;
  const funnelPax  = parseInt(initialPaxFromFunnel) ||
                     parseInt(new URLSearchParams(window.location.search).get('initialPax')) || null;
  const startingAdultPax = funnelPax
    ? Math.max(funnelPax, isMinTwoPkg ? 2 : isSoloPkg ? 1 : 1)
    : Math.max(defaultPax, isMinTwoPkg ? 2 : 1);

  const [quantities,            setQuantities]           = useState({ adult: startingAdultPax });
  const [selectedDate,          setSelectedDate]         = useState(null);
  const [currentMonth,          setCurrentMonth]         = useState(new Date());
  const [showModal,             setShowModal]            = useState(false);
  const [showPreviewModal,      setShowPreviewModal]     = useState(false);
  const [selectedFlight,        setSelectedFlight]       = useState(null);
  const [bookingWithAirfare,    setBookingWithAirfare]   = useState(false);
  const [passengerStep,         setPassengerStep]        = useState(1);
  const [loading,               setLoading]              = useState(false);
  const [promoCode,             setPromoCode]            = useState('');
  const [appliedPromo,          setAppliedPromo]         = useState(null);
  const [promoError,            setPromoError]           = useState('');
  const [promoWarning,          setPromoWarning]         = useState('');
  const [isCheckingPromo,       setIsCheckingPromo]      = useState(false);
  const [paymentType,           setPaymentType]          = useState('full');
  const [hasOTCAccess,          setHasOTCAccess]         = useState(false);
  const [checkingOTCAccess,     setCheckingOTCAccess]    = useState(true);
const [selectedRoomType,      setSelectedRoomType]     = useState(null);
  const [hotelData,             setHotelData]            = useState(null);
  const [loadingHotelData,      setLoadingHotelData]     = useState(false);
  const durationDays = (() => {
    const d = pkg.duration || '';
    // Try "3D", "3 Days", "3 Day", "3D2N", "3 days"
    const m = d.match(/(\d+)\s*d/i);
    return m ? parseInt(m[1]) : 1;
  })();
  const durationNights = (() => {
    const d = pkg.duration || '';
    // Try "2N", "2 Nights", "2 Night", "2 nights"
    const m = d.match(/(\d+)\s*n/i);
    if (m) return parseInt(m[1]);
    // Fallback: days - 1 (e.g. 3D = 2 nights)
    return Math.max(0, durationDays - 1);
  })();
  const totalPassengers = quantities.adult || 1;
  const basePax         = totalPassengers;

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice   = (phpPrice) => currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;

  // ── Effective per-pax price ──────────────────────────────────────────────
  const effectivePerPaxPrice = (() => {
    const bp = pkg.price || 0;
    return isMinTwoPkg ? bp / 2 : bp;
  })();

  const isInternationalFlight = selectedFlight &&
    selectedFlight.departure.iataCode.substring(0, 2) !== selectedFlight.arrival.iataCode.substring(0, 2);

  const [passengers, setPassengers] = useState(
    Array.from({ length: totalPassengers }, (_, idx) => ({
      passengerNumber: idx + 1,
      firstName: '', lastName: '', email: '', phone: '',
      dateOfBirth: '', age: '', gender: '', address: '',
      nationality: 'Filipino',
      idFile: null, idFileName: '',
      passportFile: null, passportFileName: ''
    }))
  );

  // ── OTC access check ─────────────────────────────────────────────────────
  useEffect(() => {
    axios.get('https://wanderwaveph.onrender.com/api/ip/check-otc-access')
      .then(r => { setHasOTCAccess(r.data.hasOTCAccess || false); setCheckingOTCAccess(false); })
      .catch(() => { setHasOTCAccess(false); setCheckingOTCAccess(false); });
  }, []);

  // ── Restore saved state (LIGHT VERSION) ─────────────────────────────────
  useEffect(() => {
    const savedState = BookingStateManager.getBookingState(code);
    if (savedState?.formData) {
      if (savedState.formData.selectedDate) setSelectedDate(savedState.formData.selectedDate);
      if (savedState.formData.quantities) setQuantities(savedState.formData.quantities);
      if (savedState.formData.currentMonth) setCurrentMonth(new Date(savedState.formData.currentMonth));
      if (savedState.formData.selectedFlight) {
        setSelectedFlight(savedState.formData.selectedFlight);
        if (onFlightChange) onFlightChange(savedState.formData.selectedFlight);
        setBookingWithAirfare(true);
      }
      if (savedState.formData.appliedPromo) setAppliedPromo(savedState.formData.appliedPromo);
      if (savedState.formData.paymentType) setPaymentType(savedState.formData.paymentType);
      if (savedState.formData.passengers?.length > 0) setPassengers(savedState.formData.passengers);
            if (savedState.formData.selectedRoomType) {
        setSelectedRoomType(savedState.formData.selectedRoomType);
      }
    }
  }, [code]); // ← only depends on code

  // ── Fetch Hotel Data for this tour destination (same as BookingRightForm) ──
  useEffect(() => {
    const fetchHotelData = async () => {
      const destination = pkg.destination || pkg.location;
      if (!destination) return;

      try {
        setLoadingHotelData(true);
        const city = destination.split(',')[0].trim();
        const response = await fetch(`https://wanderwaveph.onrender.com/api/hotels/location/${encodeURIComponent(city)}/rooms`);
        const data = await response.json();

        if (data.success && data.data && data.data.length > 0) {
          const roomTypes = data.data;
          setHotelData({ name: `${city} Hotels`, location: city, roomTypes });

          // Auto-select Budget (or cheapest)
          const budgetRoom = roomTypes.find(r => r.type?.toUpperCase().includes('BUDGET'));
          if (budgetRoom) {
            setSelectedRoomType(budgetRoom);
          } else {
            const sorted = [...roomTypes].sort((a, b) => a.price - b.price);
            setSelectedRoomType(sorted[0]);
          }
        }
      } catch (err) {
      } finally {
        setLoadingHotelData(false);
      }
    };

    fetchHotelData();
  }, [pkg.destination, pkg.location]);

  // ── Save state on changes ─────────────────────────────────────────────────
   // ── Save state on changes ─────────────────────────────────────────────────
  useEffect(() => {
    const stateToSave = {
      selectedDate,
      quantities: isSoloJoiners ? { adult: 1 } : quantities,
      currentMonth: currentMonth.toISOString(),
      selectedFlight: selectedFlight
        ? { ...selectedFlight, _savedForPackage: (pkg._id || pkg.id || '').toString() }
        : null,
      selectedRoomType,                    // ← ADD THIS
      passengers: passengers.map(({ idFile, passportFile, ...rest }) => rest),
      appliedPromo,
      paymentType
    };
    BookingStateManager.saveBookingState(code, stateToSave, null);
  }, [selectedDate, quantities, selectedFlight, selectedRoomType, passengers, appliedPromo, paymentType, currentMonth]); // ← added selectedRoomType
  // ── Restore flight from sessionStorage (after flight search) ────────────
  useEffect(() => {
    const bookingData = sessionStorage.getItem('pendingBookingData');
    if (!bookingData) return;
    const data = JSON.parse(bookingData);
    if (data.selectedFlight && data.packageId === (pkg._id || pkg.id)) {
      setSelectedFlight(data.selectedFlight);
      if (onFlightChange) onFlightChange(data.selectedFlight);
      setBookingWithAirfare(true);
      setSelectedDate(data.selectedDate);
      setQuantities(data.quantities);
      setCurrentMonth(new Date(data.currentMonth));
      sessionStorage.removeItem('pendingBookingData');
      toast.success(`Flight Added! ${data.selectedFlight.airline.name}`);
      setTimeout(() => { setPassengerStep(1); setShowModal(true); }, 500);
    } else if (!data.selectedFlight && data.packageId === (pkg._id || pkg.id)) {
      if (data.selectedDate) setSelectedDate(data.selectedDate);
      if (data.quantities)   setQuantities(data.quantities);
      if (data.currentMonth) setCurrentMonth(new Date(data.currentMonth));
      sessionStorage.removeItem('pendingBookingData');
    }
  }, [pkg._id, pkg.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-reset paymentType to 'full' when today/tomorrow is selected ────
  useEffect(() => {
    if (!selectedDate) return;
    const travelDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      selectedDate
    );
    travelDate.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    if (travelDate <= tomorrow && paymentType === 'partial') {
      setPaymentType('full');
    }
  }, [selectedDate, currentMonth]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Funnel pax ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (onPaxChange) onPaxChange(isSoloPkg ? 1 : quantities.adult);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialPaxFromFunnel) return;
    const fp = parseInt(initialPaxFromFunnel);
    if (!fp || isNaN(fp) || fp <= 0) return;
    const minPax = isSoloPkg ? 1 : isMinTwoPkg ? 2 : 1;
    const newPax = Math.max(fp, minPax);
    setQuantities({ adult: newPax });
    if (onPaxChange) onPaxChange(isSoloPkg ? 1 : newPax);
  }, [initialPaxFromFunnel]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync passengers array with pax count ─────────────────────────────────
  useEffect(() => {
    const newTotal = quantities.adult || 1;
    setPassengers(prev => {
      if (newTotal === prev.length) return prev;
      return Array.from({ length: newTotal }, (_, idx) =>
        prev[idx] || {
          passengerNumber: idx + 1,
          firstName: '', lastName: '', email: '', phone: '',
          dateOfBirth: '', age: '', gender: '', address: '',
          nationality: 'Filipino',
          idFile: null, idFileName: '',
          passportFile: null, passportFileName: ''
        }
      );
    });
  }, [quantities.adult]);

  // ── Price calculations ────────────────────────────────────────────────
  // ✅ calculateBasePackageTotal returns PURE package price only (no hotel cost embedded).
  //    Hotel cost is calculated separately via calculateHotelTotal() and added to the
  //    final total explicitly — so the breakdown is clear to the user.
  const calculateBasePackageTotal = () => {
    const basePax = isSoloPkg ? 1 : (quantities.adult || 1);
    const basePrice = pkg.price || 0;
    const basePackagePrice = basePrice * basePax;
    if (basePackagePrice <= 0) return 0;
    return basePackagePrice;
  };

  // ✅ Separate helper for hotel display line item
  // Rates: Budget/Standard = ₱0 (included), 4-Star = ₱1,660/night, 5-Star = ₱2,500/night
  // Room allocation: Math.ceil(totalPax / selectedRoomType.capacity) — same as packages
  const getHotelPricePerNight = (roomTypeStr) => {
    const t = (roomTypeStr || '').toUpperCase();
    // Match 5-star tier: "5-STAR", "5 STAR", "5STAR", "PREMIUM", "LUXURY", "DELUXE"
    if (t.includes('5') || t.includes('PREMIUM') || t.includes('LUXURY') || t.includes('DELUXE')) return 2500;
    // Match 4-star tier: "4-STAR", "4 STAR", "4STAR", "MID", "MIDRANGE", "MID-RANGE", "SUPERIOR"
    if (t.includes('4') || t.includes('MID') || t.includes('SUPERIOR')) return 1660;
    // Standard / Budget / 3-Star & below = ₱0 (included in base package price)
    return 0;
  };

  const calculateHotelTotal = () => {
    if (!selectedRoomType) return 0;
    const roomCapacity = selectedRoomType.capacity || 4;
    const rooms = Math.ceil(basePax / roomCapacity);
    const pricePerNight = getHotelPricePerNight(selectedRoomType.type);
    return pricePerNight * durationNights * rooms;
  };

  const calculateRoomsNeeded = () => {
    if (!selectedRoomType) return 1;
    return Math.ceil(totalPassengers / (selectedRoomType.capacity || 4));
  };
  const calculateDiscount = () => {
    if (!appliedPromo) return 0;
    let maxPaxCovered = basePax;
    if (appliedPromo.remainingUses !== null && appliedPromo.remainingUses !== undefined)
      maxPaxCovered = Math.min(maxPaxCovered, appliedPromo.remainingUses);
    if (appliedPromo.maxUsesPerBooking)
      maxPaxCovered = Math.min(maxPaxCovered, appliedPromo.maxUsesPerBooking);
    const resolvePromoValue = () => {
      const p = appliedPromo.pricing;
      if (p) return currency === 'PHP' ? (p.local > 0 ? p.local : (p.international ?? 0)) : (p.international > 0 ? p.international : (p.local ?? 0));
      return appliedPromo.discountValue ?? 0;
    };
    const val = resolvePromoValue();
    return appliedPromo.discountType === 'Percentage'
      ? (effectivePerPaxPrice * val / 100) * maxPaxCovered
      : val * maxPaxCovered;
  };

  const calculatePartialAmount = () => {
    const finalAmount = selectedFlight ? finalTotalAmount : finalPackageTotal;
    return Math.round(finalAmount * (selectedFlight ? 0.85 : 0.50));
  };

  const getCalculatedDates = () => {
    if (!selectedDate) return { start: null, end: null };
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    const end   = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);
    return { start, end };
  };

  const formatDateRangeDisplay = () => {
    const { start, end } = getCalculatedDates();
    if (!start || !end) return '';
    const mn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const sM = mn[start.getMonth()], eM = mn[end.getMonth()];
    const sY = start.getFullYear(), eY = end.getFullYear();
    if (sM === eM && sY === eY) return `${sM} ${start.getDate()} - ${end.getDate()}, ${sY}`;
    if (sM !== eM && sY === eY) return `${sM} ${start.getDate()} - ${eM} ${end.getDate()}, ${sY}`;
    return `${sM} ${start.getDate()}, ${sY} - ${eM} ${end.getDate()}, ${eY}`;
  };

  const isInSelectedRange = (day) => {
    if (!selectedDate) return false;
    const { start, end } = getCalculatedDates();
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    d.setHours(0,0,0,0);
    if (start) start.setHours(0,0,0,0);
    if (end)   end.setHours(0,0,0,0);
    return d >= start && d <= end;
  };

  const basePackageTotal        = calculateBasePackageTotal(); // pure package price (no hotel embedded)
  const hotelAccommodationTotal = calculateHotelTotal();       // 0 for Budget/Standard, >0 for 4/5-star
  const packageTotal            = basePackageTotal;
  const discountAmount          = calculateDiscount();
  const finalPackageTotal       = Math.max(0, packageTotal - discountAmount);
  const airfareTotal            = selectedFlight ? selectedFlight.price.amount : 0;
  // ✅ TOTAL = package (after discount) + hotel upgrade cost + airfare
  const finalTotalAmount        = finalPackageTotal + hotelAccommodationTotal + airfareTotal;
  const partialAmount           = calculatePartialAmount();
  const hasValidPackageTotal    = finalPackageTotal > 0;
  const numberOfRooms           = calculateRoomsNeeded();

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay    = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const convertedPackageTotal          = convertPrice(packageTotal);
  const convertedHotelTotal            = convertPrice(hotelAccommodationTotal);
  const convertedFinalPackageTotal     = convertPrice(finalPackageTotal);
  const convertedDiscountAmount        = convertPrice(discountAmount);
  const convertedAirfareTotal          = convertPrice(airfareTotal);
  const convertedFinalTotalAmount      = convertPrice(finalTotalAmount);
  const convertedPartialAmount         = convertPrice(partialAmount);

  const changeMonth = (offset) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + offset);
    setCurrentMonth(d);
  };

  // ── Promo handlers ────────────────────────────────────────────────────────
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) { setPromoError('Please enter a promo code'); return; }
    if ((quantities.adult || 1) < 4) {
      setPromoError('Promo codes are only valid for bookings with a minimum of 4 passengers.');
      return;
    }
    setIsCheckingPromo(true); setPromoError('');
    try {
      const packageId = pkg._id || pkg.id;
      let loggedInUserEmail = '';
      if (currentUser?.email) { loggedInUserEmail = currentUser.email.trim().toLowerCase(); }
      else {
        try { const u = localStorage.getItem('wanderwave_user'); if (u) loggedInUserEmail = (JSON.parse(u)?.email || '').trim().toLowerCase(); } catch (_) {}
      }
      if (loggedInUserEmail) {
        try {
          const k = `usedVouchers_${loggedInUserEmail}`;
          if (JSON.parse(localStorage.getItem(k) || '[]').includes(promoCode.trim().toUpperCase())) {
            setPromoError('You have already used this voucher.'); setAppliedPromo(null); toast.error('You have already used this voucher.'); setIsCheckingPromo(false); return;
          }
        } catch (_) {}
        try {
          const r = await fetch(`https://wanderwaveph.onrender.com/api/bookings/check-voucher-usage?email=${encodeURIComponent(loggedInUserEmail)}&promoCode=${encodeURIComponent(promoCode.trim().toUpperCase())}`);
          const d = await r.json();
          if (d.success && d.hasUsed) { setPromoError('You have already used this voucher.'); setAppliedPromo(null); toast.error('You have already used this voucher.'); setIsCheckingPromo(false); return; }
        } catch (_) {}
      }
      const url = `https://wanderwaveph.onrender.com/api/promos/validate/${promoCode.trim().toUpperCase()}?packageId=${packageId}${loggedInUserEmail ? `&userEmail=${encodeURIComponent(loggedInUserEmail)}` : ''}`;
      const response = await fetch(url);
      const data     = await response.json();
      if (response.ok && data.valid) {
        const promo = data.promo;
        const currentPax = quantities.adult || 1;
        const pkgCategory = (pkg.category || '').toLowerCase();
        const isIntlPkg = pkgCategory === 'international';
        if (isIntlPkg && promo.pricing?.local > 0 && !promo.pricing?.international) {
          setPromoError('This promo is for local packages only.'); setAppliedPromo(null); toast.error('Local promo only.'); setIsCheckingPromo(false); return;
        }
        if (!isIntlPkg && promo.pricing?.international > 0 && !promo.pricing?.local) {
          setPromoError('This promo is for international packages only.'); setAppliedPromo(null); toast.error('International promo only.'); setIsCheckingPromo(false); return;
        }
        const hasUsageLimit = promo.usageLimit && promo.usageLimit > 0;
        const usedCount     = promo.usedCount || 0;
        const remainingUses = hasUsageLimit ? (promo.usageLimit - usedCount) : Infinity;
        if (hasUsageLimit && remainingUses <= 0) {
          setPromoError(`This promo code has reached its usage limit.`); setAppliedPromo(null); setIsCheckingPromo(false); return;
        }
        let effectivePaxCovered = currentPax;
        if (hasUsageLimit && remainingUses < currentPax) {
          effectivePaxCovered = remainingUses;
          setPromoWarning(`Only ${remainingUses} use${remainingUses > 1 ? 's' : ''} remaining. Discount applies to ${remainingUses} of ${currentPax} pax.`);
        } else { setPromoWarning(''); }
        setAppliedPromo({
          code: promo.code, discountType: promo.discountType, pricing: promo.pricing,
          promoId: promo._id, promoType: promo.promoType || 'promo', packageId,
          maxUsesPerBooking: promo.maxUsesPerBooking || null,
          remainingUses: hasUsageLimit ? remainingUses : null,
          usageLimit: promo.usageLimit || null, usedCount,
        });
        if (promo.promoType === 'voucher' && loggedInUserEmail) {
          try {
            const k = `usedVouchers_${loggedInUserEmail}`;
            const arr = JSON.parse(localStorage.getItem(k) || '[]');
            if (!arr.includes(promo.code.toUpperCase())) { arr.push(promo.code.toUpperCase()); localStorage.setItem(k, JSON.stringify(arr)); }
          } catch (_) {}
        }
        toast.success(`Promo "${promo.code}" applied to ${currentPax} pax.`);
      } else {
        setPromoError(data.message || 'Invalid or expired promo code'); setAppliedPromo(null); toast.error(data.message || 'Invalid or expired promo code');
      }
    } catch {
      setPromoError('Failed to validate promo code'); setAppliedPromo(null); toast.error('Failed to validate promo code');
    } finally { setIsCheckingPromo(false); }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null); setPromoCode(''); setPromoError(''); setPromoWarning('');
    toast.success('Promo code removed');
  };

  const handleQuantity = (type, delta) => {
    const minPaxCount = appliedPromo ? Math.max(4, isMinTwoPkg ? 2 : 1) : (isMinTwoPkg ? 2 : 1);
    setQuantities(prev => {
      const newVal = Math.max(minPaxCount, Math.min(20, (prev[type] || minPaxCount) + delta));
      const updated = { ...prev, [type]: newVal };
      if (type === 'adult' && onPaxChange) onPaxChange(newVal);
      if (type === 'adult' && appliedPromo && newVal < 4) {
        setAppliedPromo(null); setPromoCode(''); setPromoError(''); setPromoWarning('');
        toast.warning('Promo removed — minimum 4 passengers required.');
      }
      return updated;
    });
  };

  // ✅ Same as bookingRightForm — shows user-friendly category name in toast
  const handleRoomTypeChange = (roomType) => {
    // 🔍 DEBUG — log exact type string from API so we can confirm matching
    setSelectedRoomType(roomType);
    const rawType = roomType.type || '';
    const displayName =
      rawType.toLowerCase().includes('budget') || rawType.toLowerCase().includes('standard')
        ? 'Budget Accommodations'
        : rawType.toLowerCase().includes('4') || rawType.toLowerCase().includes('mid')
        ? 'Mid Range Hotels'
        : rawType.toLowerCase().includes('5') || rawType.toLowerCase().includes('premium') || rawType.toLowerCase().includes('luxury')
        ? 'Premium Hotels'
        : rawType;
    toast.success(`${displayName} selected!`);
  };

  const handleBookClick = () => {
    if (!selectedDate) { toast.error('Please select a travel date first!'); return; }
    setShowPreviewModal(true);
  };

  const handleProceedFromPreview = () => {
    setShowPreviewModal(false); setBookingWithAirfare(false); setPassengerStep(1); setShowModal(true);
  };

  // ─────────────────────────────────────────────────────────────
// ADD AIRFARE → FLIGHT SEARCH (same pattern as BookingRightForm)
// ─────────────────────────────────────────────────────────────
// ==================== ADD AIRFARE HANDLER (TOUR VERSION) ====================
// ==================== ADD AIRFARE HANDLER (TOUR VERSION) ====================
const handleBookWithAirfare = () => {
  if (!selectedDate) {
    toast.error('Please select a travel date first before adding airfare!');
    return;
  }

  const tourId = pkg._id || pkg.id;

  // 1. I-save ang lahat ng kailangan para bumalik sa EXACT same tour booking
  const pendingData = {
    packageId: tourId,
    returnPath: window.location.pathname,     // ← ito ang magbabalik sa /tour-packages
    selectedDate: selectedDate,
    quantities: quantities,
    currentMonth: currentMonth.toISOString(),
    isTour: true,
  };

  sessionStorage.setItem('pendingBookingData', JSON.stringify(pendingData));

  // 2. Extra safety — markahan natin na itong specific tour ang babalikan
  if (tourId) {
    sessionStorage.setItem('pendingTourBookingId', tourId.toString());
  }

  // 3. Go to flight search
  navigate('/flights', {
    state: {
      fromBooking: true,
      isTour: true,
      packageData: pkg
    }
  });
};

// ─────────────────────────────────────────────────────────────
// REMOVE FLIGHT (already referenced in your JSX)
// ─────────────────────────────────────────────────────────────
const handleRemoveFlight = () => {
  setSelectedFlight(null);
  if (onFlightChange) onFlightChange(null);
  setBookingWithAirfare(false);
  toast.success('Flight removed from booking');
};

  const handleContactSales = () => { if (typeof window.openGHLChat === 'function') window.openGHLChat(); };

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => { const u = [...prev]; u[index] = { ...u[index], [field]: value }; return u; });
  };

  const handleNextPassenger = async (e) => {
    e.preventDefault();
    if (passengerStep === 1) {
      const primaryAge = parseInt(passengers[0]?.age);
      if (!primaryAge || primaryAge < 18) { toast.error('Passenger 1 must be at least 18 years old to book.'); return; }
      if (primaryAge > 100) { toast.error('Passenger 1 age cannot exceed 100 years.'); return; }
    } else {
      const currentAge = parseInt(passengers[passengerStep - 1]?.age);
      if (currentAge && currentAge > 100) { toast.error(`Passenger ${passengerStep} age cannot exceed 100 years.`); return; }
    }
    if (passengerStep < totalPassengers) { setPassengerStep(prev => prev + 1); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      const { start, end } = getCalculatedDates();
      const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const correctPrice = pkg.price || 0;
      const baseBookingData = {
        // ✅ Tour-specific identifiers
        bookingType:   'tour',
        tourId:        pkg._id || pkg.id,
        packageId:     pkg._id || pkg.id,  // kept for backend compatibility
        packageName:   pkg.title || pkg.name,
        packagePrice:  correctPrice,
        startDate:     fmt(start),
        endDate:       fmt(end),
        duration:      pkg.duration,
        pax:           { adult: quantities.adult, children: 0, infants: 0 },
        packageTotal,
        promoCode:     appliedPromo ? appliedPromo.code : null,
        promoId:       appliedPromo ? appliedPromo.promoId : null,
        discountAmount,
        finalPackageTotal,
        timerExpiredAtBooking:   false,
        priceType:               'normal',
        originalPackagePrice:    pkg.price || 0,
        appliedMarkup:           0,
        includesAirfare:         !!selectedFlight,
        flightDetails: selectedFlight ? {
          airline:       selectedFlight.airline.name,
          flightNumber:  selectedFlight.airline.flightNumber || 'N/A',
          departure:     selectedFlight.departure,
          arrival:       selectedFlight.arrival,
          duration:      selectedFlight.duration,
          stops:         selectedFlight.stops,
          price:         selectedFlight.price,
          isInternational: isInternationalFlight
        } : null,
        airfareTotal,
        totalAmount:             finalTotalAmount,
        hotelTotal:              hotelAccommodationTotal,  // ✅ hotel cost for booking record
        hotelRoomType:           selectedRoomType ? selectedRoomType.type : null,
        paymentType:             paymentType || 'full',
        initialPaymentAmount:    paymentType === 'partial' ? partialAmount : finalTotalAmount,
        remainingBalance:        paymentType === 'partial' ? (finalTotalAmount - partialAmount) : 0,
        fullName: `${passengers[0].firstName} ${passengers[0].lastName}`,
        email:    passengers[0].email,
        message:  '',
        primaryContact: { fullName: `${passengers[0].firstName} ${passengers[0].lastName}`, email: passengers[0].email },
        isCustomized: false,
        customizedInclusions: [],
        passengers: passengers.map(p => ({
          passengerNumber: p.passengerNumber || 1,
          firstName: p.firstName || '', lastName: p.lastName || '',
          email: p.email || '', phone: p.phone || '',
          dateOfBirth: p.dateOfBirth || '', age: p.age || 0,
          gender: p.gender || '', address: p.address || '',
          nationality: p.nationality || 'Filipino',
        }))
      };
      formData.append('bookingData', JSON.stringify(baseBookingData));
      passengers.forEach((p, idx) => {
        if (p.idFile)       formData.append(`idFile_${idx}`, p.idFile);
        if (p.passportFile) formData.append(`passportFile_${idx}`, p.passportFile);
      });

      const RENDER_BASE = 'https://wanderwaveph.onrender.com';
      try { await axios.get(RENDER_BASE, { timeout: 25000 }); } catch (_) {}

      const postBooking = () => axios.post(`${RENDER_BASE}/api/tour-bookings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000
      });

      let bookingResponse;
      try { bookingResponse = await postBooking(); }
      catch (firstErr) {
        const isRetryable = firstErr.code === 'ECONNABORTED' || firstErr.message?.includes('timeout') || firstErr.message?.includes('Network Error');
        if (isRetryable) { toast.info('Server is starting up, retrying...'); await new Promise(r => setTimeout(r, 4000)); bookingResponse = await postBooking(); }
        else throw firstErr;
      }

      if (bookingResponse.data.success) {
        const bookingId = bookingResponse.data.bookingId;
        fetch(`${RENDER_BASE}/api/page-views/booking-count`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: bookingId?.toString() || null,
            packageId: (pkg._id || pkg.id || null)?.toString() || null,
            packageName: pkg.title || pkg.name || null,
            paxCount: quantities.adult || 1, paymentType: paymentType || 'full', totalAmount: finalTotalAmount || 0,
          })
        }).catch(() => {});

        toast.success('Booking saved! Preparing payment link...');
        const paymentResponse = await axios.post(`${RENDER_BASE}/api/payment/create-intent`, {
          bookingId, paymentType: paymentType || 'full',
          paymentAmount: paymentType === 'partial' ? partialAmount : finalTotalAmount
        }, { timeout: 60000 });

        if (paymentResponse.data.success && paymentResponse.data.checkoutUrl) {
          const checkoutUrl = paymentResponse.data.checkoutUrl;
          axios.post(`${RENDER_BASE}/api/bookings/abandoned`, {
            existingBookingId: bookingId, checkoutUrl,
            email: passengers[0].email,
            fullName: `${passengers[0].firstName} ${passengers[0].lastName}`,
            packageName: pkg.title || pkg.name, totalAmount: finalTotalAmount,
            startDate: fmt(start), endDate: fmt(end), pax: quantities.adult,
            paymentType: paymentType === 'partial' ? 'Partial Payment' : 'Full Payment',
          }).catch(() => {});
          setShowModal(false);
          setConfirmModal({
            isOpen: true,
            title: 'Proceed to Payment',
            message: 'Your booking has been saved. You will now be redirected to PayMongo to complete your payment. Do you want to continue?',
            onConfirm: () => { closeConfirmModal(); window.location.href = checkoutUrl; },
          });
        } else {
          toast.error('Payment link failed. Please pay manually on your dashboard.');
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      } else {
        throw new Error(bookingResponse.data.message || 'Booking submission failed on server.');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to submit booking. Please try again.';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  const handleBackPassenger = () => { if (passengerStep > 1) setPassengerStep(prev => prev - 1); };

  const handleSkipToPayment = () => { setPassengerStep(totalPassengers); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="brf-container">
      <div className="brf-header">
        <h2>Book Your Journey</h2>
        <p className="brf-subtitle">Select your preferred dates and customize your trip</p>
      </div>

      {/* ── Calendar ────────────────────────────────────────────────────── */}
      <div className="brf-calendar-wrapper">
        <div className="brf-calendar-box">
          <div className="brf-calendar-header">
            <button onClick={() => changeMonth(-1)} className="brf-month-nav"><ChevronLeft size={20} /></button>
            <h3 className="brf-month-year">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
            <button onClick={() => changeMonth(1)} className="brf-month-nav"><ChevronRight size={20} /></button>
          </div>

          {selectedDate && (
            <div className="brf-selected-date-display">
              <div className="brf-date-icon">📅</div>
              <div>
                <div className="tbrf-selected-date-title">{formatDateRangeDisplay()}</div>
                <div className="tbrf-selected-date-subtitle">
                  {durationDays} days · {durationNights} {durationNights === 1 ? 'night' : 'nights'}
                </div>
              </div>
            </div>
          )}

          <div className="brf-calendar-grid">
            {['S','M','T','W','T','F','S'].map((d, i) => <div key={i} className="brf-calendar-day-label">{d}</div>)}
            {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              dateToCheck.setHours(0,0,0,0);
              const today = new Date(); today.setHours(0,0,0,0);
              const isPast = dateToCheck < today;
              const isStart = selectedDate === day;
              const inRange = isInSelectedRange(day);
              return (
                <button
                  key={day}
                  disabled={isPast}
                  onClick={() => !isPast && setSelectedDate(day)}
                  className={`brf-calendar-day ${isStart ? 'brf-selected' : ''} ${inRange && !isStart ? 'brf-in-range' : ''} ${isPast ? 'brf-disabled-date' : ''}`}
                >{day}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Pax Selector ─────────────────────────────────────────────────── */}
      {isSoloPkg ? (
        <div className="brf-quantity-section">
          <div className="brf-quantity-item">
            <div>
              <div className="tbrf-row-flex-8">
                <span className="brf-quantity-label">Standard Pax</span>
                <span className="tbrf-badge-green">Solo Package</span>
              </div>
              <div className="tbrf-pax-note">1 pax only · 3+ years old</div>
            </div>
            <span className="tbrf-pax-solo-count">1</span>
          </div>
        </div>
      ) : (
        <div className="brf-quantity-section">
          <div className="brf-quantity-item">
            <div>
              <div className="tbrf-row-flex-8-wrap">
                <span className="brf-quantity-label">Standard Pax</span>
                {isMinTwoPkg && (
                  <span className="tbrf-badge-blue">min. 2 pax</span>
                )}
                {isSoloJoiners && !isMinTwoPkg && (
                  <span className="tbrf-badge-green">Solo / Group</span>
                )}
              </div>
              <div className="tbrf-pax-note">3+ years old</div>
            </div>
            <div className="brf-quantity-controls">
              <button
                onClick={() => handleQuantity('adult', -1)}
                className={`brf-quantity-btn${(appliedPromo ? quantities.adult <= 4 : isMinTwoPkg ? quantities.adult <= 2 : quantities.adult <= 1) ? ' tbrf-quantity-btn-disabled' : ''}`}
                type="button"
                disabled={appliedPromo ? quantities.adult <= 4 : isMinTwoPkg ? quantities.adult <= 2 : quantities.adult <= 1}
              >
                <Minus size={18} color="#000000" strokeWidth={3} className="tbrf-qty-icon" />
              </button>
              <span className="brf-quantity-value">{quantities.adult}</span>
              <button onClick={() => handleQuantity('adult', 1)} className="brf-quantity-btn" type="button">
                <Plus size={18} color="#000000" strokeWidth={3} className="tbrf-qty-icon" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HOTEL ROOM SELECTOR ── */}
      {hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0 && (
        <HotelRoomSelector
          roomTypes={hotelData.roomTypes}
          selectedRoomType={selectedRoomType}
          onRoomTypeChange={handleRoomTypeChange}
          onHotelTotalChange={(hotelTotal, roomType) => {
            // selectedRoomType state is already updated via onRoomTypeChange;
            // hotelAccommodationTotal is re-derived from calculateHotelTotal() on each render.
            // This callback is a no-op here but kept so HotelRoomSelector's internal
            // getCategoryHotelTotal stays in sync with the parent's displayed total.
          }}
          durationNights={durationNights}
          numberOfPax={totalPassengers}
        />
      )}

      {/* ✅ "Prefer a specific hotel?" notice — same as bookingRightForm */}
      {hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0 && (
        <div className="tbrf-hotel-preference-notice">
          <span className="tbrf-hotel-preference-icon">💬</span>
          <span>
            <strong>Prefer a specific hotel?</strong> The accommodation listed above is our standard inclusion, but you're welcome to request your preferred hotel.{' '}
            Just <strong>contact us</strong> after booking and we'll do our best to arrange it for you.
          </span>
        </div>
      )}

      {/* ── Selected Flight display ───────────────────────────────────────── */}
      {selectedFlight && (
        <div className="tbrf-flight-added-box">
          <div className="tbrf-flight-added-header-row">
            <div className="tbrf-row-flex-8">
              <Plane size={20} color="#fc9c1b" />
              <strong className="tbrf-flight-added-title">Flight Added to Package</strong>
            </div>
            <button onClick={handleRemoveFlight} className="tbrf-flight-remove-btn">Remove</button>
          </div>
          <div className="tbrf-flight-details">
            <div><strong>{selectedFlight.airline.name}</strong> · {selectedFlight.airline.flightNumber || 'Flight'}</div>
            <div>{selectedFlight.departure.iataCode} → {selectedFlight.arrival.iataCode}</div>
            <div className="tbrf-flight-time">{selectedFlight.departure.displayTime} - {selectedFlight.arrival.displayTime}</div>
            <div className="tbrf-flight-price">+{selectedFlight.price.formatted}</div>
          </div>
        </div>
      )}

      {/* ── Promo Code ───────────────────────────────────────────────────── */}
      <div className="brf-promo-section">
        <div className="brf-promo-header">
          <Ticket size={20} color="#fc9c1b" />
          <span className="brf-promo-header-text">Have a Promo Code?</span>
        </div>
        {!appliedPromo ? (
          <>
            <div className="brf-promo-input-group">
              <input
                type="text" className={`brf-promo-input ${promoError ? 'error' : ''}`}
                value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                onKeyPress={(e) => { if (e.key === 'Enter') handleApplyPromo(); }}
              />
              <button className="brf-promo-apply-btn" onClick={handleApplyPromo} disabled={isCheckingPromo}>
                {isCheckingPromo ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {promoError && (
              <div className="tbrf-promo-error-box">
                ❌ {promoError}
              </div>
            )}
          </>
        ) : (
          <div className="brf-promo-success-box">
            <div className="tbrf-promo-flex-1">
              <div className="brf-promo-code-text">{appliedPromo.code}</div>
              <div className="brf-promo-desc-text">
                {appliedPromo.discountType === 'Percentage'
                  ? `${(() => { const p = appliedPromo.pricing; return p ? (currency === 'PHP' ? (p.local > 0 ? p.local : p.international) : (p.international > 0 ? p.international : p.local)) : (appliedPromo.discountValue ?? 0); })()}% per pax`
                  : `${currencySymbol}${convertPrice((() => { const p = appliedPromo.pricing; return p ? (currency === 'PHP' ? (p.local > 0 ? p.local : p.international) : (p.international > 0 ? p.international : p.local)) : (appliedPromo.discountValue ?? 0); })()).toLocaleString()} per pax`
                } × {Math.min(basePax, appliedPromo.remainingUses ?? Infinity, appliedPromo.maxUsesPerBooking ?? Infinity)} pax
              </div>
            </div>
            <button className="brf-promo-remove-btn" onClick={handleRemovePromo}>Remove</button>
          </div>
        )}
        {promoWarning && (
          <div className="tbrf-promo-warning-box">
            ⚠️ {promoWarning}
          </div>
        )}
      </div>

      {/* ── Price Summary + CTA ───────────────────────────────────────────── */}
<div className="brf-booking-footer">
  <div className="brf-total-row">
    <span className="brf-total-label">Package Total</span>
    <span className="brf-total-amount tbrf-total-amount-green">
      {currencySymbol}{convertedPackageTotal.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}
    </span>
  </div>

  {/* ✅ Hotel accommodation line item */}
  {selectedRoomType && hotelAccommodationTotal > 0 && (
    <div className="brf-total-row tbrf-hotel-row">
      <span className="tbrf-hotel-row-label">
        🏨 Hotel
        <span className="tbrf-hotel-room-badge">
          {selectedRoomType.type}
        </span>
        · {durationNights} night{durationNights !== 1 ? 's' : ''} × {numberOfRooms} room{numberOfRooms !== 1 ? 's' : ''}
      </span>
      <span className="tbrf-hotel-row-value">
        +{currencySymbol}{convertedHotelTotal.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}
      </span>
    </div>
  )}
  {selectedRoomType && hotelAccommodationTotal === 0 && (
    <div className="brf-total-row tbrf-hotel-row-included-line">
      <span>🏨 Hotel ({selectedRoomType.type})</span>
      <span className="tbrf-hotel-row-included">Included</span>
    </div>
  )}

  {appliedPromo && (
    <div className="brf-total-row tbrf-discount-row">
      <span>- Promo Discount ({appliedPromo.code})</span>
      <span className="tbrf-discount-amount">
        -{currencySymbol}{convertedDiscountAmount.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}
      </span>
    </div>
  )}

  {selectedFlight && (
    <>
      <div className="brf-total-row tbrf-airfare-row">
        <span>+ Airfare</span>
        <span>{currencySymbol}{convertedAirfareTotal.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}</span>
      </div>
    </>
  )}

  {/* ✅ FIX: Single TOTAL AMOUNT row — no duplicate */}
  <div className="brf-total-row tbrf-grand-total-row">
    <span>TOTAL AMOUNT</span>
    <span className="tbrf-grand-total-value">
      {currencySymbol}{convertedFinalTotalAmount.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}
    </span>
  </div>

  {/* ... rest ng buttons mo (book now, add airfare, etc.) ... */}

        <button className="brf-book-now-btn" onClick={handleBookClick} disabled={!hasValidPackageTotal}>
          {selectedFlight ? '🎫 Book Package + Flight' : 'Book This Tour'}
        </button>

        {!hasValidPackageTotal && (
          <div className="tbrf-invalid-total-notice">
            <div className="tbrf-invalid-total-icon">⚠️</div>
            <div>
              <strong className="tbrf-invalid-total-title">Cannot proceed with booking</strong>
              <span className="tbrf-invalid-total-text">Package total is zero. Please contact support.</span>
            </div>
          </div>
        )}

        {hasOTCAccess && (
          <button
            className="brf-walk-in-btn tbrf-walk-in-btn-styled" type="button"
          >
            <UserCheck size={20} /> Pay Over the Counter
          </button>
        )}

        <button className="brf-book-with-airfare-btn" onClick={handleBookWithAirfare}>
          <Plane size={20} />
          {selectedFlight ? 'Change Flight' : 'Add Airfare'}
        </button>

        <button className="brf-contact-sales-btn" onClick={handleContactSales}>
          <MessageCircle size={20} /> Contact Sales
        </button>

        <p className="tbrf-no-payment-note">
          No payment required today.
        </p>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <TourPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onProceed={handleProceedFromPreview}
        pkg={pkg}
        currency={currency}
        exchangeRate={exchangeRate}
        computedPackageTotal={convertedPackageTotal}
        computedOriginalPrice={convertedPackageTotal}
        computedFinalPackageTotal={convertedFinalPackageTotal}
        computedDiscountAmount={convertedDiscountAmount}
        appliedPromo={appliedPromo}
        paxCount={totalPassengers}
        timerExpired={false}
        selectedFlight={selectedFlight}
        selectedRoomType={selectedRoomType}   // ← ADD THIS
      />

      <TourBookingFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pkg={pkg}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        getCalculatedDates={getCalculatedDates}
        monthNames={monthNames}
        packageTotal={convertedPackageTotal}
        appliedPromo={appliedPromo}
        discountAmount={convertedDiscountAmount}
        finalPackageTotal={convertedFinalPackageTotal}
        selectedFlight={selectedFlight}
        airfareTotal={convertedAirfareTotal}
        totalAmount={convertedFinalTotalAmount}
        bookingWithAirfare={bookingWithAirfare}
        isInternationalFlight={isInternationalFlight}
        passengerStep={passengerStep}
        totalPassengers={totalPassengers}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        partialAmount={convertedPartialAmount}
        progressPercent={Math.round((passengerStep / totalPassengers) * 100)}
        currentPassenger={passengers[passengerStep - 1]}
        passengers={passengers}
        handlePassengerChange={handlePassengerChange}
        handleNextPassenger={handleNextPassenger}
        handleBackPassenger={handleBackPassenger}
        handleSkipToPayment={handleSkipToPayment}
        loading={loading}
        currency={currency}
        exchangeRate={exchangeRate}
        currencySymbol={currencySymbol}
        convertPrice={convertPrice}
      />

      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

export default TourBookingRightForm;