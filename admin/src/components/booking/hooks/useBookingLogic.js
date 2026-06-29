import { useState, useEffect, useRef } from 'react';
import { useToast } from '../../toast/ToastManager';
import {
  getDurationDays,
  getDurationNights,
  normaliseStr,
  RESTRICTED_DESTINATIONS,
  detectPackageTypeInfo,
  isAllowedBookingDay,
  getAllowedDayLabel,
  EMPTY_PASSENGER,
} from '../utils/bookingUtils';

const API_BASE = 'https://wanderwaveph.onrender.com';
const getAdminHeaders = () => ({});

export const useBookingLogic = (isOpen, onClose) => {
  const toast = useToast();

  const [loading, setLoading]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // ── Package + Destination ─────────────────────────────────────────────────
  const [packages, setPackages]                   = useState([]);
  const [destinations, setDestinations]           = useState([]);
  const [filteredPackages, setFilteredPackages]   = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedPackage, setSelectedPackage]     = useState(null);

  // Destination search dropdown
  const [destDropdownOpen, setDestDropdownOpen]   = useState(false);
  const destRef = useRef(null);

  // Departure date
  const [departureDate, setDepartureDate]         = useState('');

  // ── Package-type flags ────────────────────────────────────────────────────
  const [paxCount, setPaxCount]                   = useState(1);
  const [isSoloPkg, setIsSoloPkg]                 = useState(false);
  const [isMinTwoPkg, setIsMinTwoPkg]             = useState(false);
  const [isSoloJoinersPkg, setIsSoloJoinersPkg]   = useState(false);

  // ── Hotel ─────────────────────────────────────────────────────────────────
  const [selectedRoomType, setSelectedRoomType]   = useState(null);
  const [hotelData, setHotelData]                 = useState(null);
  const [loadingHotelData, setLoadingHotelData]   = useState(false);

  // ── Promo ─────────────────────────────────────────────────────────────────
  const [promoCode, setPromoCode]                 = useState('');
  const [appliedPromo, setAppliedPromo]           = useState(null);
  const [finalPackageTotal, setFinalPackageTotal] = useState(0);
  const [promoError, setPromoError]               = useState('');
  const [isCheckingPromo, setIsCheckingPromo]     = useState(false);

  // ── Add-Ons ───────────────────────────────────────────────────────────────
  const [availableTours, setAvailableTours]               = useState([]);
  const [availableTransfers, setAvailableTransfers]       = useState([]);
  const [selectedTourAddOns, setSelectedTourAddOns]       = useState([]);
  const [selectedTransferAddOns, setSelectedTransferAddOns] = useState([]);
  const [transferTypes, setTransferTypes]                 = useState({});
  const [loadingAddOns, setLoadingAddOns]                 = useState(false);

  // ── Transfer Details Modal ────────────────────────────────────────────────
  const [showTransferDetailsModal, setShowTransferDetailsModal] = useState(null);
  const [transferDetailsMap, setTransferDetailsMap]             = useState({});
  const [transferDetailsForm, setTransferDetailsForm]           = useState({
    arrivalTime: '', departureTime: '', pickupLocation: '', dropoffLocation: '', message: '',
  });

  // ── Form Data ─────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    packageName:          '',
    startDate:            '',
    endDate:              '',
    duration:             '',
    pax:                  { adult: 1, children: 0, infants: 0 },
    totalAmount:          0,
    paymentType:          'full',
    initialPaymentAmount: 0,
    isWalkin:             true,
    message:              '',
    passengers: [{ ...EMPTY_PASSENGER }],
  });

  // ── Derived values ────────────────────────────────────────────────────────
  const isRestrictedDestination =
    isSoloJoinersPkg &&
    RESTRICTED_DESTINATIONS.some(d =>
      (selectedDestination || '').toLowerCase().replace(/\s+/g, ' ').trim().includes(d)
    );

  const filteredDestinations = destinations.filter(dest =>
    dest.toLowerCase().includes(selectedDestination.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  CALCULATION FUNCTIONS
  // ─────────────────────────────────────────────────────────────────────────
  const calculateBasePackageTotal = () => {
    if (!selectedPackage) return 0;
    const basePrice = selectedPackage.price || 0;
    if (isSoloPkg)    return basePrice;
    if (isMinTwoPkg) {
      const baseFor2      = basePrice * 2;
      const additional    = Math.max(0, paxCount - 2);
      const additionalCost = additional > 0 ? additional * (basePrice * 0.5) : 0;
      return baseFor2 + additionalCost;
    }
    return basePrice * paxCount;
  };

  const calculateHotelTotal = () => {
    if (!selectedRoomType) return 0;
    const nights      = getDurationDays(selectedPackage?.duration || '1D') - 1;
    const roomsNeeded = Math.ceil(paxCount / (selectedRoomType.capacity || 4));
    const rate        = selectedRoomType.type?.toUpperCase().includes('4') ? 1660
                      : selectedRoomType.type?.toUpperCase().includes('5') ? 2500
                      : 0;
    return rate * nights * roomsNeeded;
  };

  const calculateAddOnsTotal = () => {
    const tourTotal = selectedTourAddOns.reduce(
      (sum, t) => sum + (t.price || 0) * paxCount,
      0
    );
    const transferTotal = selectedTransferAddOns.reduce((sum, t) => {
      const type  = transferTypes[t._id] || 'oneway';
      const price = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
      return sum + price;
    }, 0);
    return tourTotal + transferTotal;
  };

  const calculateDiscount = () => {
    if (!appliedPromo || !selectedPackage) return 0;
    let maxPaxCovered = paxCount;
    if (appliedPromo.remainingUses != null) maxPaxCovered = Math.min(maxPaxCovered, appliedPromo.remainingUses);
    if (appliedPromo.maxUsesPerBooking)     maxPaxCovered = Math.min(maxPaxCovered, appliedPromo.maxUsesPerBooking);

    const promoValue = (() => {
      const p = appliedPromo.pricing;
      if (p) return p.local > 0 ? p.local : (p.international ?? 0);
      return appliedPromo.discountValue ?? 0;
    })();

    const effectivePerPaxPrice = isMinTwoPkg
      ? (selectedPackage.price || 0) / 2
      : (selectedPackage.price || 0);

    return appliedPromo.discountType === 'Percentage'
      ? (effectivePerPaxPrice * (promoValue / 100)) * maxPaxCovered
      : promoValue * maxPaxCovered;
  };

  const computeFinalTotal = () => {
    const base     = calculateBasePackageTotal();
    const hotel    = calculateHotelTotal();
    const discount = calculateDiscount();
    const addOns   = calculateAddOnsTotal();
    return Math.max(0, base + hotel - discount + addOns);
  };

  const payableAmount = formData.paymentType === 'partial'
    ? (formData.initialPaymentAmount || 0)
    : computeFinalTotal();

  // ─────────────────────────────────────────────────────────────────────────
  //  EFFECTS
  // ─────────────────────────────────────────────────────────────────────────

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setDestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch packages + destinations when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const fetchPackages = async () => {
      try {
        const res  = await fetch(`${API_BASE}/api/packages/admin/all`, { headers: getAdminHeaders() });
        const data = await res.json();
        if (data.status === 'ok' || data.success) {
          const pkgList = data.data || data;
          setPackages(pkgList);
          const uniqueDests = [...new Set(pkgList.map(p => p.destination))].filter(Boolean).sort();
          setDestinations(uniqueDests);
        }
      } catch (err) {
        console.error('Failed to load packages', err);
        toast.error('Failed to load destinations and packages');
      }
    };
    fetchPackages();
  }, [isOpen]);

  // Cascading: Destination → filtered packages
  useEffect(() => {
    if (!selectedDestination) { setFilteredPackages([]); return; }
    setFilteredPackages(packages.filter(p => p.destination === selectedDestination));
  }, [selectedDestination, packages]);

  // Mirror paxCount → passengers array length
  useEffect(() => {
    if (paxCount < 1) return;
    setFormData(prev => {
      let passengers = [...prev.passengers];
      while (passengers.length < paxCount) passengers.push({ ...EMPTY_PASSENGER });
      if (passengers.length > paxCount) passengers = passengers.slice(0, paxCount);
      return { ...prev, passengers };
    });
  }, [paxCount]);

  // Sync startDate + endDate into formData
  useEffect(() => {
    if (!departureDate || !selectedPackage) return;
    const start = new Date(departureDate);
    if (isNaN(start.getTime())) return;
    const days = getDurationDays(selectedPackage.duration);
    const end  = new Date(start);
    end.setDate(end.getDate() + days - 1);
    updateField('startDate', departureDate);
    updateField('endDate', end.toISOString().split('T')[0]);
  }, [departureDate, selectedPackage]);

  // Fetch hotel data when destination changes
  useEffect(() => {
    if (!selectedDestination || !isOpen) return;
    const fetchHotelData = async () => {
      setLoadingHotelData(true);
      try {
        const city = selectedDestination.split(',')[0].trim();
        const res  = await fetch(`${API_BASE}/api/hotels/location/${encodeURIComponent(city)}/rooms`);
        const data = await res.json();
        if (data.success && data.data?.length > 0) {
          setHotelData({ name: `${city} Hotels`, location: city, roomTypes: data.data });
          setSelectedRoomType(data.data[0]);
        }
      } catch (err) {
        console.error('Hotel fetch error', err);
      } finally {
        setLoadingHotelData(false);
      }
    };
    fetchHotelData();
  }, [selectedDestination, isOpen]);

  // Fetch add-ons (tours + transfers) when destination changes
  useEffect(() => {
    if (!selectedDestination || !isOpen) {
      setAvailableTours([]);
      setAvailableTransfers([]);
      return;
    }
    const fetchAddOns = async () => {
      setLoadingAddOns(true);
      try {
        const destKeyword = selectedDestination.split(',')[0].trim().toLowerCase();
        const normDest    = normaliseStr(selectedDestination.split(',')[0]);

        // Tours
        const toursRes  = await fetch(`${API_BASE}/api/tours/all`);
        const toursData = await toursRes.json();
        const allTours  = toursData.data || toursData.tours || (Array.isArray(toursData) ? toursData : []);
        const filteredTours = allTours.filter(t => {
          if (t.isArchive === 'Yes') return false;
          const normTourDest = normaliseStr((t.destination || '').split(',')[0]);
          return normTourDest.includes(normDest) || normDest.includes(normTourDest);
        });
        setAvailableTours(filteredTours);

        // Transfers
        const transfersRes  = await fetch(`${API_BASE}/api/transfers?all=true`);
        const transfersData = await transfersRes.json();
        const allTransfers  = transfersData.data || [];
        const filteredTransfers = allTransfers.filter(t => {
          if (!t.isActive) return false;
          if (!t.packageDestination) return true;
          const tDest = (t.packageDestination || '').toLowerCase().split(',')[0].trim();
          return tDest.includes(destKeyword) || destKeyword.includes(tDest);
        });
        setAvailableTransfers(filteredTransfers);
      } catch (err) {
        console.error('Failed to load add-ons:', err);
      } finally {
        setLoadingAddOns(false);
      }
    };
    fetchAddOns();
  }, [selectedDestination, isOpen]);

  // Remove promo if pax drops below 4
  useEffect(() => {
    if (appliedPromo && paxCount < 4) {
      handleRemovePromo();
      toast.error('Promo removed: This promo code requires a minimum of 4 pax');
    }
  }, [paxCount, appliedPromo]);

  // Recompute final total whenever relevant state changes
  useEffect(() => {
    if (selectedPackage) setFinalPackageTotal(computeFinalTotal());
  }, [selectedPackage, paxCount, selectedRoomType, appliedPromo, selectedTourAddOns, selectedTransferAddOns, transferTypes]);

  // Auto-set 50% for partial payment
  useEffect(() => {
    if (formData.paymentType === 'partial') {
      updateField('initialPaymentAmount', Math.round(computeFinalTotal() / 2));
    } else {
      updateField('initialPaymentAmount', 0);
    }
  }, [formData.paymentType, selectedPackage, paxCount, selectedRoomType, appliedPromo, selectedTourAddOns, selectedTransferAddOns, transferTypes]);

  // ─────────────────────────────────────────────────────────────────────────
  //  FORM HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  const updateField = (field, value) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const updatePassenger = (index, field, value) =>
    setFormData(prev => ({
      ...prev,
      passengers: prev.passengers.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));

  const handleDateOfBirthChange = (index, dateValue) => {
    updatePassenger(index, 'dateOfBirth', dateValue);
    if (dateValue) {
      const birthDate = new Date(dateValue);
      const today     = new Date();
      let age         = today.getFullYear() - birthDate.getFullYear();
      const md        = today.getMonth() - birthDate.getMonth();
      if (md < 0 || (md === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age > 0) updatePassenger(index, 'age', age.toString());
    }
  };

  const handleDobPartChange = (index, part, value) => {
    setFormData(prev => {
      const updatedPassengers = prev.passengers.map((p, i) => {
        if (i !== index) return p;
        const updated = { ...p, [part]: value };
        const day   = part === 'dobDay'   ? value : updated.dobDay;
        const month = part === 'dobMonth' ? value : updated.dobMonth;
        const year  = part === 'dobYear'  ? value : updated.dobYear;
        if (day && month && year) {
          const iso       = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const birthDate = new Date(iso);
          if (!isNaN(birthDate.getTime())) {
            const today = new Date();
            let age     = today.getFullYear() - birthDate.getFullYear();
            const md    = today.getMonth() - birthDate.getMonth();
            if (md < 0 || (md === 0 && today.getDate() < birthDate.getDate())) age--;
            return { ...updated, dateOfBirth: iso, age: age > 0 ? age.toString() : '' };
          }
        }
        return { ...updated, dateOfBirth: '' };
      });
      return { ...prev, passengers: updatedPassengers };
    });
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  PACKAGE HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handlePackageTypeDetect = (pkg) => {
    if (!pkg) return;
    const { isSoloPkg: solo, isMinTwoPkg: minTwo, isSoloJoinersPkg: joiners, initialPax } = detectPackageTypeInfo(pkg);
    setIsSoloPkg(solo);
    setIsMinTwoPkg(minTwo);
    setIsSoloJoinersPkg(joiners);
    setPaxCount(initialPax);
  };

  const resetDestinationRelated = () => {
    setSelectedPackage(null);
    setDepartureDate('');
    setPaxCount(1);
    setIsSoloPkg(false);
    setIsMinTwoPkg(false);
    setIsSoloJoinersPkg(false);
    updateField('packageName', '');
    setHotelData(null);
    setSelectedRoomType(null);
    setSelectedTourAddOns([]);
    setSelectedTransferAddOns([]);
    setTransferTypes({});
  };

  const addPassenger = () => setPaxCount(prev => prev + 1);

  const removePassenger = (index) => {
    if (formData.passengers.length === 1) return;
    const min = isMinTwoPkg ? 2 : 1;
    if (paxCount <= min) return;
    setPaxCount(prev => prev - 1);
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  PROMO HANDLERS
  // ─────────────────────────────────────────────────────────────────────────
  const handleApplyPromo = async () => {
    if (paxCount < 4) { toast.error('This promo code requires a minimum of 4 pax'); return; }
    if (!promoCode.trim() || !selectedPackage) {
      toast.error('Please select a package first and enter a promo code');
      return;
    }
    setIsCheckingPromo(true);
    setPromoError('');
    try {
      const res  = await fetch(`${API_BASE}/api/promos/validate/${encodeURIComponent(promoCode)}?packageId=${selectedPackage._id}&pax=${paxCount}`);
      const data = await res.json();
      if (data.valid && data.promo) {
        setAppliedPromo(data.promo);
        setPromoCode(data.promo.code);
        toast.success('Promo applied successfully!');
      } else {
        setPromoError(data.message || 'Invalid or expired promo code');
      }
    } catch (err) {
      console.error('Promo validation error:', err);
      setPromoError('Server error validating promo. Please try again.');
      toast.error('Promo validation failed');
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  SUBMIT
  // ─────────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedPackage || !departureDate) {
      toast.error('Please select a package and departure date');
      return;
    }
    if (computeFinalTotal() <= 0) {
      toast.error('Invalid package price. Please check the selected package.');
      return;
    }
    const primaryAge = parseInt(formData.passengers?.[0]?.age);
    if (!primaryAge || primaryAge < 18) {
      toast.error('Passenger 1 must be at least 18 years old to book.');
      return;
    }
    setShowConfirm(false);
    setLoading(true);

    try {
      const start = new Date(departureDate);
      const days  = getDurationDays(selectedPackage.duration);
      const end   = new Date(start);
      end.setDate(end.getDate() + days - 1);
      const computedEndDate = end.toISOString().split('T')[0];

      // Build add-ons payload
      const addOnsPayload = {
        tours: selectedTourAddOns.map(t => ({
          tourId:      t._id,
          title:       t.title       || '',
          destination: t.destination || '',
          duration:    t.duration    || '',
          category:    t.category    || '',
          image:       t.image       || null,
          price:       t.price       || 0,
          sellerPrice: t.sellerPrice || 0,
          paxCount,
          subtotal:    (t.price || 0) * paxCount,
        })),
        transfers: selectedTransferAddOns.map(t => {
          const type          = transferTypes[t._id] || 'oneway';
          const selectedPrice = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
          const details       = transferDetailsMap[t._id] || {};
          const primaryPax    = formData.passengers[0] || {};
          const s             = new Date(departureDate);
          s.setDate(s.getDate() + getDurationDays(selectedPackage.duration) - 1);
          const computedReturnDate = s.toISOString().split('T')[0];
          return {
            transferId:      t._id,
            title:           t.title         || '',
            category:        t.category      || '',
            imageUrl:        t.imageUrl      || null,
            transferType:    type,
            oneWayPrice:     t.oneWayPrice   || 0,
            roundtripPrice:  t.roundtripPrice|| 0,
            selectedPrice,
            subtotal:        selectedPrice,
            travelDate:      departureDate,
            returnDate:      type === 'roundtrip' ? computedReturnDate : '',
            destination:     selectedDestination,
            passengerCount:  paxCount,
            fullName:        `${primaryPax.firstName || ''} ${primaryPax.lastName || ''}`.trim(),
            email:           primaryPax.email || '',
            arrivalTime:     details.arrivalTime    || '',
            departureTime:   type === 'roundtrip' ? (details.departureTime  || '') : '',
            pickupLocation:  details.pickupLocation || '',
            dropoffLocation: type === 'roundtrip' ? (details.dropoffLocation || '') : '',
            message:         details.message        || '',
          };
        }),
        addOnsTotal: calculateAddOnsTotal(),
      };

      const bookingData = {
        ...formData,
        packageId:         selectedPackage?._id,
        price:             selectedPackage.price,
        finalPackageTotal: computeFinalTotal(),
        totalAmount:       payableAmount,
        pax:               { adult: paxCount, children: 0, infants: 0 },
        selectedRoomType:  selectedRoomType?.type || null,
        hotelName:         selectedRoomType?.hotelName || null,
        numberOfRooms:     Math.ceil(paxCount / (selectedRoomType?.capacity || 4)),
        isWalkin:          true,
        createdByType:     'sales',
        createdByEmail:    'houston@wanderwaveph.com',
        status:            'pending',
        promoCode:         appliedPromo ? appliedPromo.code : null,
        discountAmount:    calculateDiscount(),
        appliedPromoId:    appliedPromo ? appliedPromo._id : null,
        addOns:            addOnsPayload,
        passengers:        formData.passengers.map((p, i) => ({
          passengerNumber: i + 1,
          firstName:       p.firstName,
          lastName:        p.lastName,
          email:           p.email && p.email.trim() !== '' ? p.email.trim() : null,
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

      const bookingRes    = await fetch(`${API_BASE}/api/bookings`, { method: 'POST', body: formPayload });
      const bookingResult = await bookingRes.json();
      if (!bookingResult.success) throw new Error(bookingResult.message || 'Failed to create booking');

      const bookingId = bookingResult.bookingId || bookingResult.data?._id;
      console.log('✅ Walk-in booking created (PENDING) → ID:', bookingId);

      // Create PayMongo checkout session
      const amountToPay = formData.paymentType === 'full' ? payableAmount : formData.initialPaymentAmount;
      const paymentRes  = await fetch(`${API_BASE}/api/payment/create-intent`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ bookingId, paymentType: formData.paymentType, paymentAmount: amountToPay }),
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
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    updateField('initialPaymentAmount', 0);
    onClose();
  };

  // ─────────────────────────────────────────────────────────────────────────
  //  RETURN
  // ─────────────────────────────────────────────────────────────────────────
  return {
    // State
    loading, setLoading,
    showConfirm, setShowConfirm,
    currentStep, setCurrentStep,
    packages, destinations,
    filteredPackages,
    selectedDestination, setSelectedDestination,
    selectedPackage, setSelectedPackage,
    destDropdownOpen, setDestDropdownOpen,
    destRef,
    departureDate, setDepartureDate,
    paxCount, setPaxCount,
    isSoloPkg, isMinTwoPkg, isSoloJoinersPkg,
    selectedRoomType, setSelectedRoomType,
    hotelData,
    loadingHotelData,
    promoCode, setPromoCode,
    appliedPromo,
    finalPackageTotal,
    promoError,
    isCheckingPromo,
    availableTours, availableTransfers,
    selectedTourAddOns, setSelectedTourAddOns,
    selectedTransferAddOns, setSelectedTransferAddOns,
    transferTypes, setTransferTypes,
    loadingAddOns,
    showTransferDetailsModal, setShowTransferDetailsModal,
    transferDetailsMap, setTransferDetailsMap,
    transferDetailsForm, setTransferDetailsForm,
    formData, setFormData,

    // Derived
    isRestrictedDestination,
    filteredDestinations,
    payableAmount,

    // Calculation fns
    calculateBasePackageTotal,
    calculateHotelTotal,
    calculateAddOnsTotal,
    calculateDiscount,
    computeFinalTotal,

    // Utility fns (convenience re-exports)
    getDurationDays,
    getDurationNights,
    isAllowedBookingDay: (dateStr) => isAllowedBookingDay(dateStr, selectedPackage, isRestrictedDestination),
    getAllowedDayLabel:  ()        => getAllowedDayLabel(selectedPackage),

    // Handlers
    updateField,
    updatePassenger,
    handleDateOfBirthChange,
    handleDobPartChange,
    handlePackageTypeDetect,
    resetDestinationRelated,
    addPassenger,
    removePassenger,
    handleApplyPromo,
    handleRemovePromo,
    handleSubmit,
    handleClose,
  };
};
