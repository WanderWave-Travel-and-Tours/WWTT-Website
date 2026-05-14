import React, { useState, useEffect, useRef } from 'react';
import { X, Users, Calendar, MapPin, Bed, CreditCard } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import HotelRoomSelector from './hotelRoomSelector';
import './newBookingModal.css';

const NewBookingModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // States para sa packages at destinations
  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Destination search dropdown state
  const [destDropdownOpen, setDestDropdownOpen] = useState(false);
  const destRef = useRef(null);

  // Departure date state
  const [departureDate, setDepartureDate] = useState('');

  // Step 1: Pax + package type states
  const [paxCount, setPaxCount] = useState(1);
  const [isSoloPkg, setIsSoloPkg] = useState(false);
  const [isMinTwoPkg, setIsMinTwoPkg] = useState(false);
  const [isSoloJoinersPkg, setIsSoloJoinersPkg] = useState(false);

  // Hotel states
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [hotelData, setHotelData] = useState(null);
  const [loadingHotelData, setLoadingHotelData] = useState(false);

  // 2-step form state → now 3-step
  const [currentStep, setCurrentStep] = useState(1);

  // Promo & Total computation states
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [finalPackageTotal, setFinalPackageTotal] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  // ── STEP 3: Add-Ons states ──────────────────────────────────────────────
  const [availableTours, setAvailableTours] = useState([]);
  const [availableTransfers, setAvailableTransfers] = useState([]);
  const [selectedTourAddOns, setSelectedTourAddOns] = useState([]);
  const [selectedTransferAddOns, setSelectedTransferAddOns] = useState([]);
  // transferTypes: { [transferId]: 'oneway' | 'roundtrip' }
  const [transferTypes, setTransferTypes] = useState({});
  const [loadingAddOns, setLoadingAddOns] = useState(false);

  // ── Transfer Details Modal states ────────────────────────────────────────
  // showTransferDetailsModal: null | <transfer object> — which transfer is being detailed
  const [showTransferDetailsModal, setShowTransferDetailsModal] = useState(null);
  // transferDetailsMap: { [transferId]: { arrivalTime, departureTime, pickupLocation, dropoffLocation, message } }
  const [transferDetailsMap, setTransferDetailsMap] = useState({});
  // local form state while the modal is open
  const [transferDetailsForm, setTransferDetailsForm] = useState({
    arrivalTime: '', departureTime: '', pickupLocation: '', dropoffLocation: '', message: ''
  });
  // ───────────────────────────────────────────────────────────────────────

  // FORM STATE
  const [formData, setFormData] = useState({
    packageName: '',
    startDate: '',
    endDate: '',
    duration: '',
    pax: { adult: 1, children: 0, infants: 0 },
    totalAmount: 0,
    paymentType: 'full',
    initialPaymentAmount: 0,
    isWalkin: true,
    message: '',
    passengers: [{
      firstName: '', lastName: '', email: '', phone: '',
      dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
      age: '', gender: '', address: '', nationality: 'Filipino'
    }]
  });

  // Close destination dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setDestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch packages + destinations kapag bumukas ang modal
  useEffect(() => {
    if (!isOpen) return;

    const fetchPackages = async () => {
      try {
        const res = await fetch('https://wanderwaveph.onrender.com/api/packages/all');
        const data = await res.json();

        if (data.status === 'ok' || data.success) {
          const pkgList = data.data || data;
          setPackages(pkgList);

          const uniqueDests = [...new Set(pkgList.map(p => p.destination))]
            .filter(Boolean)
            .sort();
          setDestinations(uniqueDests);
        }
      } catch (err) {
        console.error('Failed to load packages', err);
        toast.error('Failed to load destinations and packages');
      }
    };

    fetchPackages();
  }, [isOpen]);

  // Cascading logic — Destination → Packages
  useEffect(() => {
    if (!selectedDestination) {
      setFilteredPackages([]);
      return;
    }
    const filtered = packages.filter(p => p.destination === selectedDestination);
    setFilteredPackages(filtered);
  }, [selectedDestination, packages]);

  // Mirror logic — paxCount ↔ passengers array
  useEffect(() => {
    if (paxCount < 1) return;

    setFormData(prev => {
      let currentPassengers = [...prev.passengers];

      if (currentPassengers.length < paxCount) {
        while (currentPassengers.length < paxCount) {
          currentPassengers.push({
            firstName: '', lastName: '', email: '', phone: '',
            dateOfBirth: '', dobDay: '', dobMonth: '', dobYear: '',
            age: '', gender: '', address: '', nationality: 'Filipino'
          });
        }
      } else if (currentPassengers.length > paxCount) {
        currentPassengers = currentPassengers.slice(0, paxCount);
      }

      return { ...prev, passengers: currentPassengers };
    });
  }, [paxCount]);

  // ✅ FIX: Sync startDate + endDate into formData so they are NEVER empty on submit
  useEffect(() => {
    if (!departureDate || !selectedPackage) return;

    const start = new Date(departureDate);
    if (isNaN(start.getTime())) return;

    const days = getDurationDays(selectedPackage.duration);
    const end = new Date(start);
    end.setDate(end.getDate() + days - 1);
    const computedEndDate = end.toISOString().split('T')[0];

    updateField('startDate', departureDate);
    updateField('endDate', computedEndDate);
  }, [departureDate, selectedPackage]);

  // Fetch Hotel Data when destination + modal is open
  useEffect(() => {
    if (!selectedDestination || !isOpen) return;

    const fetchHotelData = async () => {
      setLoadingHotelData(true);
      try {
        const city = selectedDestination.split(',')[0].trim();
        const res = await fetch(`https://wanderwaveph.onrender.com/api/hotels/location/${encodeURIComponent(city)}/rooms`);
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

  // ── Fetch add-ons (tours + transfers) whenever destination changes ───────
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

        // Fetch Tours — correct endpoint is /api/tours/all per tourRoutes.js
        const toursRes = await fetch('https://wanderwaveph.onrender.com/api/tours/all');
        const toursData = await toursRes.json();
        const allTours =
          toursData.data ||
          toursData.tours ||
          (Array.isArray(toursData) ? toursData : []);

        // ✅ FIX: Improved destination matching — normalise both sides so casing/
        //   comma/spacing differences don't break the filter
        const normalise = (str) =>
          (str || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').trim().replace(/\s+/g, ' ');

        const normDest = normalise(selectedDestination.split(',')[0]);

        const filteredTours = allTours.filter(t => {
          if (t.isArchive === 'Yes') return false;
          const normTourDest = normalise((t.destination || '').split(',')[0]);
          return normTourDest.includes(normDest) || normDest.includes(normTourDest);
        });
        setAvailableTours(filteredTours);

        // Fetch Transfers
        const transfersRes = await fetch('https://wanderwaveph.onrender.com/api/transfers?all=true');
        const transfersData = await transfersRes.json();
        const allTransfers = transfersData.data || [];

        const filteredTransfers = allTransfers.filter(t => {
          if (!t.isActive) return false;
          if (!t.packageDestination) return true; // no destination = available for all
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
  // ─────────────────────────────────────────────────────────────────────────

  // ✅ NEW: STRICT 4 PAX REQUIREMENT FOR PROMO
  useEffect(() => {
    if (appliedPromo && paxCount < 4) {
      handleRemovePromo();
      toast.error('Promo removed: This promo code requires a minimum of 4 pax');
    }
  }, [paxCount, appliedPromo]);

  // Update total kapag nagbago ang pax o room o package
  useEffect(() => {
    if (selectedPackage) {
      setFinalPackageTotal(computeFinalTotal());
    }
  }, [selectedPackage, paxCount, selectedRoomType, appliedPromo, selectedTourAddOns, selectedTransferAddOns, transferTypes]);

  // AUTO HALF PAYMENT LOGIC — kapag partial payment
  useEffect(() => {
    if (formData.paymentType === 'partial') {
      const total = computeFinalTotal();
      const halfAmount = Math.round(total / 2);
      updateField('initialPaymentAmount', halfAmount);
    } else {
      updateField('initialPaymentAmount', 0);
    }
  }, [formData.paymentType, selectedPackage, paxCount, selectedRoomType, appliedPromo, selectedTourAddOns, selectedTransferAddOns, transferTypes]);

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ FIXED: Immutable update para siguradong pumapasok ang data
  const updatePassenger = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      passengers: prev.passengers.map((passenger, i) =>
        i === index
          ? { ...passenger, [field]: value }
          : passenger
      )
    }));
  };

  // Auto calculate age kapag nagbago ang dateOfBirth
  const handleDateOfBirthChange = (index, dateValue) => {
    updatePassenger(index, 'dateOfBirth', dateValue);

    if (dateValue) {
      const birthDate = new Date(dateValue);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
      if (age > 0) updatePassenger(index, 'age', age.toString());
    }
  };

  // DD / MM / YY dropdown handler — composes full ISO date when all parts are set
  const handleDobPartChange = (index, part, value) => {
    setFormData(prev => {
      const updatedPassengers = prev.passengers.map((p, i) => {
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
      });
      return { ...prev, passengers: updatedPassengers };
    });
  };

  const getDurationDays = (durationStr) => {
    if (!durationStr) return 1;
    const match = durationStr.match(/(\d+)D/i);
    return match ? parseInt(match[1]) : 1;
  };

  const calculateBasePackageTotal = () => {
    if (!selectedPackage) return 0;
    const basePrice = selectedPackage.price || 0;

    if (isSoloPkg) {
      return basePrice * 1;
    }

    if (isMinTwoPkg) {
      const baseFor2 = basePrice * 2;
      const additional = Math.max(0, paxCount - 2);
      let additionalCost = 0;
      if (additional > 0) {
        additionalCost = additional * (basePrice * 0.5);
      }
      return baseFor2 + additionalCost;
    }

    return basePrice * paxCount;
  };

  const calculateHotelTotal = () => {
    if (!selectedRoomType) return 0;
    const nights = getDurationDays(selectedPackage?.duration || '1D') - 1;
    const roomsNeeded = Math.ceil(paxCount / (selectedRoomType.capacity || 4));
    const rate = selectedRoomType.type?.toUpperCase().includes('4') ? 1660 :
                 selectedRoomType.type?.toUpperCase().includes('5') ? 2500 : 0;
    return rate * nights * roomsNeeded;
  };

  // ── Add-Ons total ─────────────────────────────────────────────────────────
  const calculateAddOnsTotal = () => {
    // Tours: per-person pricing × paxCount
    const tourTotal = selectedTourAddOns.reduce(
      (sum, t) => sum + (t.price || 0) * paxCount,
      0
    );
    // Transfers: flat rate (per vehicle/booking)
    const transferTotal = selectedTransferAddOns.reduce((sum, t) => {
      const type = transferTypes[t._id] || 'oneway';
      const price = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
      return sum + price;
    }, 0);
    return tourTotal + transferTotal;
  };
  // ─────────────────────────────────────────────────────────────────────────

  const computeFinalTotal = () => {
    const base     = calculateBasePackageTotal();
    const hotel    = calculateHotelTotal();
    const discount = calculateDiscount();
    const addOns   = calculateAddOnsTotal();
    return Math.max(0, base + hotel - discount + addOns);
  };

  const calculateDiscount = () => {
    if (!appliedPromo || !selectedPackage) return 0;

    let maxPaxCovered = paxCount;

    if (appliedPromo.remainingUses != null && appliedPromo.remainingUses !== undefined) {
      maxPaxCovered = Math.min(maxPaxCovered, appliedPromo.remainingUses);
    }
    if (appliedPromo.maxUsesPerBooking) {
      maxPaxCovered = Math.min(maxPaxCovered, appliedPromo.maxUsesPerBooking);
    }

    const promoValue = (() => {
      const p = appliedPromo.pricing;
      if (p) {
        return p.local > 0 ? p.local : (p.international ?? 0);
      }
      return appliedPromo.discountValue ?? 0;
    })();

    const effectivePerPaxPrice = isMinTwoPkg
      ? (selectedPackage.price || 0) / 2
      : (selectedPackage.price || 0);

    if (appliedPromo.discountType === 'Percentage') {
      return (effectivePerPaxPrice * (promoValue / 100)) * maxPaxCovered;
    } else {
      return promoValue * maxPaxCovered;
    }
  };

  // ── Amount payable now ────────────────────────────────────────────────────
  const payableAmount = formData.paymentType === 'partial'
    ? (formData.initialPaymentAmount || 0)
    : computeFinalTotal();

  // ✅ RESTRICTED BOOKING DAYS — Solo/Joiners packages to specific destinations
  const RESTRICTED_DESTINATIONS = ['sagada', 'baguio', 'la union', 'launion', 'bolinao', 'ilocos'];

  const isRestrictedDestination = isSoloJoinersPkg &&
    RESTRICTED_DESTINATIONS.some(dest => (selectedDestination || '').toLowerCase().replace(/\s+/g, ' ').trim().includes(dest));

  const getDurationNights = (durationStr) => {
    if (!durationStr) return 0;
    const match = durationStr.match(/(\d+)N/i);
    if (match) return parseInt(match[1]);
    return getDurationDays(durationStr) - 1;
  };

  const isAllowedBookingDay = (dateStr) => {
    if (!isRestrictedDestination || !dateStr) return true;
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();
    const nights = getDurationNights(selectedPackage?.duration || '');
    const days = getDurationDays(selectedPackage?.duration || '');
    if (days === 3 && nights === 2) return dayOfWeek === 5;
    if (days === 2 && nights === 1) return dayOfWeek === 6;
    return true;
  };

  const getAllowedDayLabel = () => {
    if (!isRestrictedDestination || !selectedPackage) return null;
    const nights = getDurationNights(selectedPackage.duration);
    const days = getDurationDays(selectedPackage.duration);
    if (days === 3 && nights === 2) return 'Fridays only (3D2N)';
    if (days === 2 && nights === 1) return 'Saturdays only (2D1N)';
    return null;
  };

  const detectPackageType = (pkg) => {
    if (!pkg) return;

    const nameLower = (pkg.title || '').toLowerCase();

    const titleIsSoloJoiners =
      /solo\s*\/\s*joiners?\b/i.test(nameLower) ||
      /\bsolo\s+joiners?\b/i.test(nameLower)      ||
      /\bjoiners?\b/i.test(nameLower);

    const titleIsSolo = !titleIsSoloJoiners && /\bsolo\b/i.test(nameLower);
    const titleIsMinTwo = /min\s*of\s*2|min\.?\s*2|minimum\s*2|min 2 pax/i.test(nameLower);

    const solo = !titleIsSoloJoiners && (titleIsSolo || pkg.pax === 1);
    const soloJoiners = titleIsSoloJoiners || pkg.tourType === 'joiners' || pkg.tourType === 'Solo/Joiners';
    const minTwo = titleIsMinTwo || (pkg.tourType === 'private' && pkg.pax === 2);

    setIsSoloPkg(solo);
    setIsMinTwoPkg(minTwo);
    setIsSoloJoinersPkg(soloJoiners);

    let initialPax = 1;
    if (solo) initialPax = 1;
    else if (minTwo) initialPax = 2;
    else if (soloJoiners) initialPax = 1;
    else initialPax = 2;

    setPaxCount(initialPax);
  };

  const addPassenger = () => {
    setPaxCount(prev => prev + 1);
  };

  const removePassenger = (index) => {
    if (formData.passengers.length === 1) return;

    const min = isMinTwoPkg ? 2 : 1;
    if (paxCount <= min) return;

    setPaxCount(prev => prev - 1);
  };

  const handleApplyPromo = async () => {
    if (paxCount < 4) {
      toast.error('This promo code requires a minimum of 4 pax');
      return;
    }

    if (!promoCode.trim() || !selectedPackage) {
      toast.error('Please select a package first and enter a promo code');
      return;
    }

    setIsCheckingPromo(true);
    setPromoError('');

    try {
      const res = await fetch(
        `https://wanderwaveph.onrender.com/api/promos/validate/${encodeURIComponent(promoCode)}?packageId=${selectedPackage._id}&pax=${paxCount}`
      );

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

  const handleSubmit = async () => {
    if (!selectedPackage || !departureDate) {
      toast.error('Please select a package and departure date');
      return;
    }

    if (computeFinalTotal() <= 0) {
      toast.error('Invalid package price. Please check the selected package.');
      return;
    }

    setShowConfirm(false);
    setLoading(true);

    try {
      // === 1. CREATE BOOKING AS PENDING (walk-in) ===
      const start = new Date(departureDate);
      const days = getDurationDays(selectedPackage.duration);
      const end = new Date(start);
      end.setDate(end.getDate() + days - 1);
      const computedEndDate = end.toISOString().split('T')[0];

      // ── Build add-ons payload ───────────────────────────────────────────
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
          paxCount:    paxCount,
          subtotal:    (t.price || 0) * paxCount,
        })),
        transfers: selectedTransferAddOns.map(t => {
          const type          = transferTypes[t._id] || 'oneway';
          const selectedPrice = type === 'roundtrip'
            ? (t.roundtripPrice || 0)
            : (t.oneWayPrice   || 0);
          const details       = transferDetailsMap[t._id] || {};
          const primaryPax    = formData.passengers[0] || {};
          const computedReturnDate = (() => {
            const s = new Date(departureDate);
            const days = getDurationDays(selectedPackage.duration);
            s.setDate(s.getDate() + days - 1);
            return s.toISOString().split('T')[0];
          })();
          return {
            transferId:     t._id,
            title:          t.title         || '',
            category:       t.category      || '',
            imageUrl:       t.imageUrl      || null,
            transferType:   type,
            oneWayPrice:    t.oneWayPrice   || 0,
            roundtripPrice: t.roundtripPrice|| 0,
            selectedPrice,
            subtotal:       selectedPrice,
            // ── Transfer details from modal form ──
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
      // ───────────────────────────────────────────────────────────────────

      const bookingData = {
        ...formData,
        packageId:      selectedPackage?._id,
        price:          selectedPackage.price,
        finalPackageTotal: computeFinalTotal(),
        totalAmount:    payableAmount,
        pax:            { adult: paxCount, children: 0, infants: 0 },
        selectedRoomType: selectedRoomType?.type || null,
        hotelName:      selectedRoomType?.hotelName || null,
        numberOfRooms:  Math.ceil(paxCount / (selectedRoomType?.capacity || 4)),
        isWalkin:       true,
        createdByType:  'sales',
        createdByEmail: 'houston@wanderwaveph.com',
        status:         'pending',
        promoCode:      appliedPromo ? appliedPromo.code : null,
        discountAmount: calculateDiscount(),
        appliedPromoId: appliedPromo ? appliedPromo._id : null,
        addOns:         addOnsPayload,   // ← NEW

        passengers: formData.passengers.map((p, i) => ({
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

      const API_BASE = 'https://wanderwaveph.onrender.com';

      const bookingRes = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        body: formPayload,
      });

      const bookingResult = await bookingRes.json();

      if (!bookingResult.success) {
        throw new Error(bookingResult.message || 'Failed to create booking');
      }

      const bookingId = bookingResult.bookingId || bookingResult.data?._id;

      console.log('✅ Walk-in booking created (PENDING) → ID:', bookingId);

      // Transfer and tour add-ons are already embedded in the booking document
      // under addOns.transfers and addOns.tours — no separate records needed.

      // === 2. CREATE PAYMONGO CHECKOUT SESSION ===
      const amountToPay = formData.paymentType === 'full'
        ? payableAmount
        : formData.initialPaymentAmount;

      const paymentRes = await fetch(`${API_BASE}/api/payment/create-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId:     bookingId,
          paymentType:   formData.paymentType,
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
      toast.error(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // Cleanup kapag isasara ang modal
  const handleClose = () => {
    updateField('initialPaymentAmount', 0);
    onClose();
  };

  if (!isOpen) return null;

  // Filtered destinations for searchable dropdown
  const filteredDestinations = destinations.filter(dest =>
    dest.toLowerCase().includes(selectedDestination.toLowerCase())
  );

  return (
    <div className="nbm-overlay">
      <div className="nbm-modal">

        {/* ── HEADER ── */}
        <div className="nbm-header">
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            Create New Booking
          </h2>
          <button
            onClick={handleClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '28px',
              cursor: 'pointer',
              color: '#64748b',
              lineHeight: 1,
              padding: '0 4px',
              borderRadius: '6px',
              transition: 'color 0.2s'
            }}
          >
            ×
          </button>
        </div>

        {/* ── PROGRESS BAR — 2 steps ── */}
        <div className="nbm-progress">
          {/* Step 1 */}
          <div className={`nbm-step ${currentStep === 1 ? 'active' : ''}`}>
            <div className={`nbm-step-dot ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
              {currentStep > 1 ? '✓' : '1'}
            </div>
            <span className="nbm-step-label">Trip Details</span>
          </div>
          <div className="nbm-progress-line" style={{ background: currentStep >= 2 ? '#f59e0b' : '#e2e8f0' }} />
          {/* Step 2 */}
          <div className={`nbm-step ${currentStep === 2 ? 'active' : ''}`}>
            <div className={`nbm-step-dot ${currentStep === 2 ? 'active' : ''}`}>2</div>
            <span className="nbm-step-label">Hotel & Payment</span>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="nbm-body">

          {/* ════════════════ STEP 1 ════════════════ */}
          {currentStep === 1 && (
            <div className="nbm-step-panel">
              <h3 className="nbm-step-title">Trip Details</h3>
              <p className="nbm-step-subtitle">Fill in customer info, destination, package, and passengers.</p>

              {/* CARD WRAPPER — Basic Info + Destination + Package */}
              <div className="nbm-card">

                {/* ── DESTINATION — Searchable ── */}
                <div className="nbm-field" style={{ marginTop: '16px' }} ref={destRef}>
                  <label>Destination <span style={{ color: 'red' }}>*</span></label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={selectedDestination}
                      onChange={e => {
                        const val = e.target.value;
                        setSelectedDestination(val);
                        setDestDropdownOpen(true);
                        if (val !== selectedDestination) {
                          setSelectedPackage(null);
                          setDepartureDate('');
                          setPaxCount(1);
                          setIsSoloPkg(false);
                          setIsMinTwoPkg(false);
                          setIsSoloJoinersPkg(false);
                          updateField('packageName', '');
                          setHotelData(null);
                          setSelectedRoomType(null);
                          // Reset add-ons
                          setSelectedTourAddOns([]);
                          setSelectedTransferAddOns([]);
                          setTransferTypes({});
                        }
                      }}
                      onFocus={() => setDestDropdownOpen(true)}
                      placeholder="Type to search destination..."
                    />

                    {/* Filtered dropdown list */}
                    {destDropdownOpen && selectedDestination && filteredDestinations.length > 0 && (
                      <div className="nbm-dest-dropdown">
                        {filteredDestinations.map(dest => (
                          <div
                            key={dest}
                            className="nbm-dest-option"
                            onMouseDown={() => {
                              setSelectedDestination(dest);
                              setSelectedPackage(null);
                              setDepartureDate('');
                              setPaxCount(1);
                              setIsSoloPkg(false);
                              setIsMinTwoPkg(false);
                              setIsSoloJoinersPkg(false);
                              updateField('packageName', '');
                              setHotelData(null);
                              setSelectedRoomType(null);
                              // Reset add-ons
                              setSelectedTourAddOns([]);
                              setSelectedTransferAddOns([]);
                              setTransferTypes({});
                              setDestDropdownOpen(false);
                            }}
                          >
                            <span className="nbm-dest-pin">📍</span> {dest}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No results state */}
                    {destDropdownOpen && selectedDestination && filteredDestinations.length === 0 && (
                      <div className="nbm-dest-dropdown">
                        <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                          No destinations found
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PACKAGE DROPDOWN — only shown when a valid destination is selected */}
                {selectedDestination && destinations.includes(selectedDestination) && (
                  <div className="nbm-field" style={{ marginTop: '16px' }}>
                    <label>Package <span style={{ color: 'red' }}>*</span></label>
                    <select
                      value={selectedPackage?._id || ''}
                      onChange={e => {
                        const pkg = filteredPackages.find(p => p._id === e.target.value);
                        if (pkg) {
                          setSelectedPackage(pkg);
                          setDepartureDate('');
                          const displayName = `${pkg.duration} ${pkg.destination} ${pkg.title}`;
                          updateField('packageName', displayName);
                          updateField('duration', pkg.duration);
                          detectPackageType(pkg);
                          setSelectedDestination(pkg.destination);
                        }
                      }}
                    >
                      <option value="">Select Package</option>
                      {filteredPackages.map(pkg => {
                        const display = `${pkg.duration} ${pkg.destination} ${pkg.title}`;
                        return (
                          <option key={pkg._id} value={pkg._id}>{display}</option>
                        );
                      })}
                    </select>
                  </div>
                )}

              </div>{/* end nbm-card */}

              {/* ── PAX + DEPARTURE DATE — Trip Configuration Card ── */}
              {selectedPackage && (
                <div className="nbm-tripconfig-card">

                  {/* Card Header */}
                  <div className="nbm-tripconfig-header">
                    <div className="nbm-tripconfig-icon">🗓️</div>
                    <div>
                      <div className="nbm-tripconfig-title">Trip Configuration</div>
                      <div className="nbm-tripconfig-sub">Set number of travellers and preferred departure</div>
                    </div>
                  </div>

                  {/* Two columns: Pax | Date */}
                  <div className="nbm-tripconfig-grid">

                    {/* LEFT — Number of Pax */}
                    <div className="nbm-tripconfig-col">
                      <div className="nbm-tripconfig-label-row">
                        <span className="nbm-tripconfig-label">Number of Pax</span>
                        {isSoloPkg && <span className="nbm-badge nbm-badge-green">Solo</span>}
                        {isMinTwoPkg && <span className="nbm-badge nbm-badge-blue">Min. 2</span>}
                        {isSoloJoinersPkg && <span className="nbm-badge nbm-badge-amber">Joiners</span>}
                      </div>

                      {isSoloPkg ? (
                        <div className="nbm-pax-solo">1 Pax (Solo — Fixed)</div>
                      ) : (
                        <div className="nbm-pax-stepper">
                          <button
                            className="nbm-pax-stepper-btn"
                            onClick={() => {
                              const min = isMinTwoPkg ? 2 : 1;
                              if (paxCount > min) setPaxCount(paxCount - 1);
                            }}
                            disabled={paxCount <= (isMinTwoPkg ? 2 : 1)}
                          >−</button>
                          <div className="nbm-pax-stepper-val">
                            <span className="nbm-pax-stepper-num">{paxCount}</span>
                            <span className="nbm-pax-stepper-unit">pax</span>
                          </div>
                          <button
                            className="nbm-pax-stepper-btn"
                            onClick={() => setPaxCount(paxCount + 1)}
                          >+</button>
                        </div>
                      )}

                      <div className="nbm-tripconfig-hint">
                        {isSoloPkg ? 'Fixed at 1 traveller' : isMinTwoPkg ? 'Minimum 2 travellers' : 'Add or remove travellers'}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="nbm-tripconfig-divider" />

                    {/* RIGHT — Departure Date */}
                    <div className="nbm-tripconfig-col">
                      <div className="nbm-tripconfig-label-row">
                        <span className="nbm-tripconfig-label">Departure Date <span style={{ color: '#ef4444' }}>*</span></span>
                      </div>

                      <div className="nbm-tripconfig-date-wrap">
                        <span className="nbm-tripconfig-date-icon">📅</span>
                        <input
                          type="date"
                          className="nbm-tripconfig-date-input"
                          value={departureDate}
                          onChange={e => {
                            const val = e.target.value;
                            if (isRestrictedDestination && !isAllowedBookingDay(val)) {
                              const label = getAllowedDayLabel();
                              toast.error(`This package departs on ${label} only.`);
                              return;
                            }
                            setDepartureDate(val);
                          }}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>

                      {isRestrictedDestination && getAllowedDayLabel() && (
                        <div className="nbm-tripconfig-restrict">
                          📅 {getAllowedDayLabel()}
                        </div>
                      )}

                      <div className="nbm-tripconfig-hint">Select your travel start date</div>
                    </div>
                  </div>

                  {/* Date preview strip — shown only when date is picked */}
                  {departureDate && (
                    <div className="nbm-tripconfig-datestrip">
                      <div className="nbm-tripconfig-datestrip-item">
                        <span className="nbm-tripconfig-datestrip-emoji">✈️</span>
                        <div>
                          <div className="nbm-tripconfig-datestrip-label">Departure</div>
                          <div className="nbm-tripconfig-datestrip-val">{departureDate}</div>
                        </div>
                      </div>
                      <div className="nbm-tripconfig-datestrip-arrow">→</div>
                      <div className="nbm-tripconfig-datestrip-item">
                        <span className="nbm-tripconfig-datestrip-emoji">🏠</span>
                        <div>
                          <div className="nbm-tripconfig-datestrip-label">Return</div>
                          <div className="nbm-tripconfig-datestrip-val">
                            {(() => {
                              const s = new Date(departureDate);
                              const days = getDurationDays(selectedPackage.duration);
                              s.setDate(s.getDate() + days - 1);
                              return s.toISOString().split('T')[0];
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="nbm-tripconfig-datestrip-pill">
                        {selectedPackage.duration} · {getDurationDays(selectedPackage.duration)} days
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* PASSENGERS SECTION */}
              <div style={{ marginTop: '16px', borderTop: '2px solid #e2e8f0', paddingTop: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}>
                    <Users size={18} /> Passengers
                  </h3>
                  {!isSoloPkg && (
                    <button className="nbm-btn-add-passenger" onClick={addPassenger}>
                      + Add Passenger
                    </button>
                  )}
                </div>

                {formData.passengers.map((p, i) => (
                  <div key={i} className="nbm-passenger-card">

                    {/* Heading */}
                    <div className="nbm-passenger-heading">
                      <div className="nbm-passenger-num">{i + 1}</div>
                      <span className="nbm-passenger-label">Passenger {i + 1}</span>
                    </div>

                    {/* Row 1: First Name + Last Name */}
                    <div className="nbm-grid-2">
                      <div className="nbm-pfield">
                        <label>First Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          value={p.firstName}
                          onChange={e => updatePassenger(i, 'firstName', e.target.value)}
                          placeholder="Juan"
                        />
                      </div>
                      <div className="nbm-pfield">
                        <label>Last Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          value={p.lastName}
                          onChange={e => updatePassenger(i, 'lastName', e.target.value)}
                          placeholder="Dela Cruz"
                        />
                      </div>
                    </div>

                    {/* Row 2: Email + Phone */}
                    <div className="nbm-grid-2" style={{ marginTop: '12px' }}>
                      <div className="nbm-pfield">
                        <label>Email <span style={{ color: '#94a3b8', fontWeight: 400, textTransform: 'none', fontSize: '0.78rem' }}>(optional)</span></label>
                        <input
                          value={p.email}
                          onChange={e => updatePassenger(i, 'email', e.target.value)}
                          placeholder="juan@email.com"
                        />
                      </div>
                      <div className="nbm-pfield">
                        <label>Phone <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          value={p.phone}
                          onChange={e => updatePassenger(i, 'phone', e.target.value)}
                          placeholder="09171234567"
                        />
                      </div>
                    </div>

                    {/* Date of Birth */}
                    <div style={{ marginTop: '12px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#64748b',
                        marginBottom: '6px',
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase'
                      }}>
                        Date of Birth <span style={{ color: '#ef4444' }}>*</span>
                      </label>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {/* Day */}
                        <select
                          className="nbm-dob-select"
                          value={p.dobDay}
                          onChange={e => handleDobPartChange(i, 'dobDay', e.target.value)}
                          style={{ width: '72px', textAlign: 'left' }}
                        >
                          <option value="">DD</option>
                          {Array.from({ length: 31 }, (_, n) => n + 1).map(d => (
                            <option key={d} value={d}>{String(d).padStart(2, '0')}</option>
                          ))}
                        </select>

                        {/* Month */}
                        <select
                          className="nbm-dob-select"
                          value={p.dobMonth}
                          onChange={e => handleDobPartChange(i, 'dobMonth', e.target.value)}
                          style={{ width: '92px', textAlign: 'left' }}
                        >
                          <option value="">Month</option>
                          <option value="1">January</option>
                          <option value="2">February</option>
                          <option value="3">March</option>
                          <option value="4">April</option>
                          <option value="5">May</option>
                          <option value="6">June</option>
                          <option value="7">July</option>
                          <option value="8">August</option>
                          <option value="9">September</option>
                          <option value="10">October</option>
                          <option value="11">November</option>
                          <option value="12">December</option>
                        </select>

                        {/* Year */}
                        <select
                          className="nbm-dob-select"
                          value={p.dobYear}
                          onChange={e => handleDobPartChange(i, 'dobYear', e.target.value)}
                          style={{ width: '82px', textAlign: 'left' }}
                        >
                          <option value="">Year</option>
                          {Array.from(
                            { length: new Date().getFullYear() - 1939 },
                            (_, n) => new Date().getFullYear() - n
                          ).map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>

                        {/* Age Badge */}
                        <div className={`nbm-age-badge${p.age ? '' : ' nbm-age-badge-empty'}`}
                             style={{ minWidth: '68px', textAlign: 'center' }}>
                          {p.age ? (
                            <>{p.age} <span style={{ fontSize: '0.73rem', opacity: 0.85 }}>yrs</span></>
                          ) : '—'}
                        </div>
                      </div>
                    </div>

                    {/* Row 4: Gender + Nationality */}
                    <div className="nbm-grid-2" style={{ marginTop: '12px' }}>
                      <div className="nbm-pfield">
                        <label>Gender <span style={{ color: '#ef4444' }}>*</span></label>
                        <select value={p.gender} onChange={e => updatePassenger(i, 'gender', e.target.value)}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="nbm-pfield">
                        <label>Nationality <span style={{ color: '#ef4444' }}>*</span></label>
                        <input
                          value={p.nationality}
                          onChange={e => updatePassenger(i, 'nationality', e.target.value)}
                          placeholder="Filipino"
                        />
                      </div>
                    </div>

                    {/* Row 5: Complete Address */}
                    <div className="nbm-pfield" style={{ marginTop: '12px' }}>
                      <label>Complete Address <span style={{ color: '#ef4444' }}>*</span></label>
                      <input
                        value={p.address}
                        onChange={e => updatePassenger(i, 'address', e.target.value)}
                        placeholder="123 Main St, Angeles City"
                      />
                    </div>

                    {formData.passengers.length > 1 && (
                      <button
                        onClick={() => removePassenger(i)}
                        style={{
                          marginTop: '14px',
                          color: '#ef4444',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          background: '#fef2f2',
                          border: '1px solid #fecaca',
                          borderRadius: '8px',
                          padding: '6px 14px',
                          cursor: 'pointer',
                          fontFamily: 'Plus Jakarta Sans, sans-serif'
                        }}
                      >
                        ✕ Remove Passenger {i + 1}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════════════════ STEP 2 ════════════════ */}
          {currentStep === 2 && (
            <div className="nbm-step-panel">
              <h3 className="nbm-step-title">Accommodation & Payment</h3>
              <p className="nbm-step-subtitle">Choose hotel tier, apply promo, and review total.</p>

              {/* CARD WRAPPER */}
              <div className="nbm-card">

                {/* ── Hotel Room Selector ── */}
                <div style={{ marginBottom: '28px' }}>
                  <h4 style={{ marginBottom: '12px', fontWeight: 700, color: '#0f172a', fontSize: '1rem', margin: '0 0 12px' }}>
                    Choose Accommodation Tier
                  </h4>

                  {hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0 ? (
                    <HotelRoomSelector
                      roomTypes={hotelData.roomTypes}
                      selectedRoomType={selectedRoomType}
                      onRoomTypeChange={setSelectedRoomType}
                      numberOfPax={paxCount}
                      durationDays={getDurationDays(selectedPackage?.duration || '1D')}
                      durationNights={getDurationDays(selectedPackage?.duration || '1D') - 1}
                    />
                  ) : (
                    <div style={{ padding: '20px', background: '#fefce8', borderRadius: '10px', color: '#854d0e', textAlign: 'center', fontWeight: 600 }}>
                      No hotels available for this destination yet.
                    </div>
                  )}
                </div>

                {/* ── Promo Field (with 4 pax requirement) ── */}
                <div className="nbm-field">
                  <label>
                    Promo Code{' '}
                    <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.85rem' }}>(optional)</span>
                  </label>

                  {!appliedPromo ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        style={{ flex: 1 }}
                        value={promoCode}
                        onChange={e => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        onKeyPress={e => { if (e.key === 'Enter') handleApplyPromo(); }}
                      />
                      <button
                        onClick={handleApplyPromo}
                        disabled={isCheckingPromo || !selectedPackage || paxCount < 4}
                        style={{
                          padding: '14px 24px',
                          background: 'linear-gradient(135deg, #f59e0b, #fc9c1b)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          cursor: (isCheckingPromo || !selectedPackage || paxCount < 4) ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                          opacity: (isCheckingPromo || !selectedPackage || paxCount < 4) ? 0.6 : 1
                        }}
                      >
                        {isCheckingPromo ? 'Checking...' : 'Apply'}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      background: '#f0fdf4',
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#166534', fontSize: '1.1rem' }}>
                          {appliedPromo.code}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                          {appliedPromo.discountType === 'Percentage'
                            ? `${appliedPromo.pricing?.local || appliedPromo.discountValue}% off per pax`
                            : `₱${(appliedPromo.pricing?.local || appliedPromo.discountValue).toLocaleString()} off per pax`}
                        </div>
                      </div>
                      <button
                        onClick={handleRemovePromo}
                        style={{
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          padding: '8px 20px',
                          borderRadius: '8px',
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {/* 4 PAX REQUIREMENT WARNING */}
                  {selectedPackage && paxCount < 4 && !appliedPromo && (
                    <div style={{
                      color: '#f59e0b',
                      fontSize: '0.82rem',
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#fffbeb',
                      borderRadius: '8px',
                      border: '1px solid #fde047'
                    }}>
                      ⚠️ This promo code requires a minimum of <strong>4 pax</strong>
                    </div>
                  )}

                  {promoError && (
                    <div style={{
                      color: '#ef4444',
                      fontSize: '0.85rem',
                      marginTop: '8px',
                      padding: '10px',
                      background: '#fee2e2',
                      borderRadius: '8px'
                    }}>
                      ❌ {promoError}
                    </div>
                  )}
                </div>

                {/* ── Payment Type ── */}
                <div className="nbm-field" style={{ marginTop: '20px' }}>
                  <label>Payment Type</label>
                  <select
                    value={formData.paymentType}
                    onChange={e => updateField('paymentType', e.target.value)}
                  >
                    <option value="full">Pay in Full</option>
                    <option value="partial">Partial Payment</option>
                  </select>
                </div>

                {formData.paymentType === 'partial' && (
                  <div className="nbm-field" style={{ marginTop: '12px' }}>
                    <label>
                      Initial Payment Amount (₱)
                      <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
                        {' '}— 50% of Total (auto)
                      </span>
                    </label>
                    <input
                      type="number"
                      value={formData.initialPaymentAmount}
                      readOnly
                      style={{
                        backgroundColor: '#f8fafc',
                        color: '#0f172a',
                        cursor: 'not-allowed'
                      }}
                    />
                  </div>
                )}

              </div>{/* end nbm-card */}

              {/* ── Total Summary (Step 2) ── */}
              <div className="nbm-total-box">
                <div className="nbm-total-row">
                  <span>Package Total</span>
                  <span>₱{calculateBasePackageTotal().toLocaleString()}</span>
                </div>

                {appliedPromo && (
                  <div className="nbm-total-row" style={{ color: '#10b981', fontSize: '0.95rem' }}>
                    <span>- Promo Discount ({appliedPromo.code})</span>
                    <span>-₱{calculateDiscount().toLocaleString()}</span>
                  </div>
                )}

                {selectedRoomType && (
                  <div className="nbm-total-row" style={{ fontSize: '0.95rem', color: '#64748b' }}>
                    <span>Hotel Accommodation</span>
                    <span>₱{calculateHotelTotal().toLocaleString()}</span>
                  </div>
                )}

                <div className="nbm-total-row nbm-total-final">
                  <strong>
                    {formData.paymentType === 'partial'
                      ? 'INITIAL PAYMENT DUE NOW (50%)'
                      : 'FINAL TOTAL'}
                  </strong>
                  <strong>₱{payableAmount.toLocaleString()}</strong>
                </div>

                {formData.paymentType === 'partial' && (
                  <p style={{
                    textAlign: 'right',
                    fontSize: '0.85rem',
                    color: '#64748b',
                    marginTop: '8px',
                    fontWeight: 600
                  }}>
                    (50% deposit • Balance ₱{(computeFinalTotal() - payableAmount).toLocaleString()} due before departure)
                  </p>
                )}
              </div>
            </div>
          )}

        </div>{/* end nbm-body */}

        {/* ── FOOTER BUTTONS — 2-step navigation ── */}
        <div className="nbm-footer">
          {currentStep > 1 && (
            <button
              className="nbm-btn nbm-btn-back"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              ← Back
            </button>
          )}

          {currentStep === 1 && (
            <button
              className="nbm-btn nbm-btn-next"
              onClick={() => setCurrentStep(2)}
              disabled={!selectedPackage || !departureDate}
            >
              Continue to Hotel & Payment →
            </button>
          )}

          {currentStep === 2 && (
            <button
              className="nbm-btn nbm-btn-next"
              onClick={() => setShowConfirm(true)}
              disabled={!selectedRoomType || loading}
            >
              {loading ? 'Creating Booking...' : 'Review & Create Booking ✓'}
            </button>
          )}
        </div>

      </div>

      {/* ════════════════════════════════════════════════════════════════
          TRANSFER DETAILS MODAL — collects per-transfer scheduling info
          ════════════════════════════════════════════════════════════════ */}
      {showTransferDetailsModal && (() => {
        const t          = showTransferDetailsModal;
        const type       = transferTypes[t._id] || 'oneway';
        const isRoundtrip = type === 'roundtrip';
        const primaryPax = formData.passengers[0] || {};
        const fullName   = `${primaryPax.firstName || ''} ${primaryPax.lastName || ''}`.trim() || '—';
        const email      = primaryPax.email || '—';
        const returnDate = (() => {
          if (!departureDate || !selectedPackage) return '—';
          const s = new Date(departureDate);
          const days = getDurationDays(selectedPackage.duration);
          s.setDate(s.getDate() + days - 1);
          return s.toISOString().split('T')[0];
        })();

        return (
          <div
            className="nbm-tdm-overlay"
            onClick={e => { if (e.target === e.currentTarget) setShowTransferDetailsModal(null); }}
          >
            <div className="nbm-tdm-modal">

              {/* Header */}
              <div className="nbm-tdm-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="nbm-tdm-header-icon">🚐</div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>{t.title}</h3>
                    <div style={{ fontSize: '0.82rem', opacity: 0.85, marginTop: '2px' }}>
                      Fill in scheduling details for this transfer
                    </div>
                  </div>
                </div>
                <button
                  className="nbm-tdm-close"
                  onClick={() => setShowTransferDetailsModal(null)}
                >×</button>
              </div>

              {/* Body */}
              <div className="nbm-tdm-body">

                {/* Pre-filled summary (read-only) */}
                <div className="nbm-tdm-prefill">
                  <div className="nbm-tdm-prefill-title">📋 Pre-filled from Booking</div>
                  <div className="nbm-tdm-prefill-grid">
                    <div className="nbm-tdm-prefill-item">
                      <span className="nbm-tdm-prefill-label">Travel Date</span>
                      <span className="nbm-tdm-prefill-val">{departureDate || '—'}</span>
                    </div>
                    {isRoundtrip && (
                      <div className="nbm-tdm-prefill-item">
                        <span className="nbm-tdm-prefill-label">Return Date</span>
                        <span className="nbm-tdm-prefill-val">{returnDate}</span>
                      </div>
                    )}
                    <div className="nbm-tdm-prefill-item">
                      <span className="nbm-tdm-prefill-label">Destination</span>
                      <span className="nbm-tdm-prefill-val">{selectedDestination || '—'}</span>
                    </div>
                    <div className="nbm-tdm-prefill-item">
                      <span className="nbm-tdm-prefill-label">Transfer Type</span>
                      <span className={`nbm-tdm-type-badge${isRoundtrip ? ' roundtrip' : ''}`}>
                        {isRoundtrip ? '🔄 Roundtrip' : '➡️ One Way'}
                      </span>
                    </div>
                    <div className="nbm-tdm-prefill-item">
                      <span className="nbm-tdm-prefill-label">Full Name</span>
                      <span className="nbm-tdm-prefill-val">{fullName}</span>
                    </div>
                    <div className="nbm-tdm-prefill-item">
                      <span className="nbm-tdm-prefill-label">Email</span>
                      <span className="nbm-tdm-prefill-val">{email}</span>
                    </div>
                    <div className="nbm-tdm-prefill-item">
                      <span className="nbm-tdm-prefill-label">Passengers</span>
                      <span className="nbm-tdm-prefill-val">{paxCount} pax</span>
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="nbm-tdm-fields">

                  {/* Arrival Time */}
                  <div className="nbm-tdm-field">
                    <label>
                      Arrival Time <span style={{ color: '#ef4444' }}>*</span>
                      <span className="nbm-tdm-field-hint">When the customer arrives at the destination</span>
                    </label>
                    <input
                      type="time"
                      value={transferDetailsForm.arrivalTime}
                      onChange={e => setTransferDetailsForm(prev => ({ ...prev, arrivalTime: e.target.value }))}
                    />
                  </div>

                  {/* Departure Time — roundtrip only */}
                  {isRoundtrip && (
                    <div className="nbm-tdm-field">
                      <label>
                        Departure Time <span style={{ color: '#ef4444' }}>*</span>
                        <span className="nbm-tdm-field-hint">Return departure time on {returnDate}</span>
                      </label>
                      <input
                        type="time"
                        value={transferDetailsForm.departureTime}
                        onChange={e => setTransferDetailsForm(prev => ({ ...prev, departureTime: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Pickup Location */}
                  <div className="nbm-tdm-field">
                    <label>
                      Pickup Location <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Manila Airport Terminal 3"
                      value={transferDetailsForm.pickupLocation}
                      onChange={e => setTransferDetailsForm(prev => ({ ...prev, pickupLocation: e.target.value }))}
                    />
                  </div>

                  {/* Drop-off Location — roundtrip only */}
                  {isRoundtrip && (
                    <div className="nbm-tdm-field">
                      <label>
                        Drop-off Location <span style={{ color: '#ef4444' }}>*</span>
                        <span className="nbm-tdm-field-hint">Where the customer returns to</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Manila Airport Terminal 3"
                        value={transferDetailsForm.dropoffLocation}
                        onChange={e => setTransferDetailsForm(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                      />
                    </div>
                  )}

                  {/* Message / Special Requests */}
                  <div className="nbm-tdm-field">
                    <label>
                      Message / Special Requests
                      <span className="nbm-tdm-field-hint">(optional)</span>
                    </label>
                    <textarea
                      className="nbm-tdm-textarea"
                      placeholder="Any special instructions or requests..."
                      value={transferDetailsForm.message}
                      onChange={e => setTransferDetailsForm(prev => ({ ...prev, message: e.target.value }))}
                      rows={3}
                    />
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="nbm-tdm-footer">
                <button
                  className="nbm-btn nbm-btn-back"
                  onClick={() => setShowTransferDetailsModal(null)}
                  style={{ flex: '0 0 auto', padding: '14px 28px' }}
                >
                  Cancel
                </button>
                <button
                  className="nbm-btn nbm-btn-next"
                  disabled={
                    !transferDetailsForm.arrivalTime ||
                    !transferDetailsForm.pickupLocation ||
                    (isRoundtrip && (!transferDetailsForm.departureTime || !transferDetailsForm.dropoffLocation))
                  }
                  onClick={() => {
                    // Save details and add transfer to selected list
                    setTransferDetailsMap(prev => ({ ...prev, [t._id]: { ...transferDetailsForm } }));
                    setSelectedTransferAddOns(prev =>
                      prev.some(x => x._id === t._id) ? prev : [...prev, t]
                    );
                    setShowTransferDetailsModal(null);
                  }}
                >
                  ✓ Confirm & Add Transfer
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* BEAUTIFUL BOOKING PREVIEW MODAL */}
      {showConfirm && (
        <div
          className="nbm-preview-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirm(false);
          }}
        >
          <div className="nbm-preview-modal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="nbm-preview-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📋</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Booking Preview</h2>
                  <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>Please review before creating</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ background: 'none', border: 'none', fontSize: '32px', color: 'white', cursor: 'pointer', lineHeight: 1 }}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="nbm-preview-body">

              {/* Customer */}
              <div className="nbm-preview-section">
                <div className="nbm-preview-section-title">👤 Customer Information</div>
                ...
              </div>

              {/* Trip Details */}
              <div className="nbm-preview-section">
                <div className="nbm-preview-section-title">
                  <MapPin size={18} /> Trip Details
                </div>
                <div className="nbm-preview-row">
                  <span>Destination</span>
                  <strong>{selectedDestination}</strong>
                </div>
                <div className="nbm-preview-row">
                  <span>Package</span>
                  <strong>{selectedPackage?.title || '—'}</strong>
                </div>
                <div className="nbm-preview-row">
                  <span><Calendar size={16} style={{ display: 'inline', marginRight: 4 }} /> Departure</span>
                  <strong>{departureDate}</strong>
                </div>
                <div className="nbm-preview-row">
                  <span>Return Date</span>
                  <strong>
                    {(() => {
                      const s = new Date(departureDate);
                      const days = getDurationDays(selectedPackage?.duration || '1D');
                      s.setDate(s.getDate() + days - 1);
                      return s.toISOString().split('T')[0];
                    })()}
                  </strong>
                </div>
                <div className="nbm-preview-row">
                  <span>Number of Pax</span>
                  <strong>{paxCount} {isSoloPkg ? '(Solo)' : isMinTwoPkg ? '(Min 2)' : ''}</strong>
                </div>
              </div>

              {/* Passengers */}
              <div className="nbm-preview-section">
                <div className="nbm-preview-section-title">
                  <Users size={18} /> Passengers ({formData.passengers.length})
                </div>
                {formData.passengers.map((p, i) => (
                  <div key={i} className="nbm-preview-passenger">
                    <strong>Passenger {i + 1}:</strong> {p.firstName} {p.lastName}
                    {p.phone && <span style={{ marginLeft: 12, color: '#64748b' }}>• {p.phone}</span>}
                  </div>
                ))}
              </div>

              {/* Accommodation */}
              {selectedRoomType && (
                <div className="nbm-preview-section">
                  <div className="nbm-preview-section-title">
                    <Bed size={18} /> Accommodation
                  </div>
                  <div className="nbm-preview-row">
                    <span>Room Type</span>
                    <strong>{selectedRoomType.type}</strong>
                  </div>
                </div>
              )}

              {/* Add-Ons — only shown when customer selected some */}
              {(selectedTourAddOns.length > 0 || selectedTransferAddOns.length > 0) && (
                <div className="nbm-preview-section">
                  <div className="nbm-preview-section-title">🎭 Add-Ons</div>

                  {selectedTourAddOns.map(t => (
                    <div key={t._id} className="nbm-preview-row">
                      <span>🗺️ {t.title} × {paxCount} pax</span>
                      <strong>₱{((t.price || 0) * paxCount).toLocaleString()}</strong>
                    </div>
                  ))}

                  {selectedTransferAddOns.map(t => {
                    const type  = transferTypes[t._id] || 'oneway';
                    const price = type === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
                    return (
                      <div key={t._id} className="nbm-preview-row">
                        <span>🚐 {t.title} ({type === 'roundtrip' ? 'Roundtrip' : 'One Way'})</span>
                        <strong>₱{price.toLocaleString()}</strong>
                      </div>
                    );
                  })}

                  <div className="nbm-preview-row" style={{ fontWeight: 700, color: '#f59e0b' }}>
                    <span>Add-Ons Subtotal</span>
                    <span>₱{calculateAddOnsTotal().toLocaleString()}</span>
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="nbm-preview-section">
                <div className="nbm-preview-section-title">
                  <CreditCard size={18} /> Payment Summary
                </div>
                <div className="nbm-preview-row">
                  <span>Package Total</span>
                  <span>₱{calculateBasePackageTotal().toLocaleString()}</span>
                </div>

                {appliedPromo && (
                  <div className="nbm-preview-row" style={{ color: '#10b981' }}>
                    <span>- Promo ({appliedPromo.code})</span>
                    <span>-₱{calculateDiscount().toLocaleString()}</span>
                  </div>
                )}

                {selectedRoomType && (
                  <div className="nbm-preview-row">
                    <span>Hotel Accommodation</span>
                    <span>₱{calculateHotelTotal().toLocaleString()}</span>
                  </div>
                )}

                {calculateAddOnsTotal() > 0 && (
                  <div className="nbm-preview-row">
                    <span>Add-Ons</span>
                    <span>₱{calculateAddOnsTotal().toLocaleString()}</span>
                  </div>
                )}

                {/* BIG TOTAL */}
                <div className="nbm-preview-total">
                  <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>
                    {formData.paymentType === 'partial' ? 'INITIAL PAYMENT DUE NOW' : 'TOTAL AMOUNT'}
                  </div>
                  <div className="nbm-due-now">
                    ₱{payableAmount.toLocaleString()}
                  </div>
                  {formData.paymentType === 'partial' && (
                    <p style={{ marginTop: 8, color: '#166534', fontSize: '0.9rem', fontWeight: 600 }}>
                      50% deposit • Balance ₱{(computeFinalTotal() - payableAmount).toLocaleString()} due before departure
                    </p>
                  )}
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <div style={{
              padding: '24px 32px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              gap: '12px',
              background: '#fff'
            }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="nbm-btn nbm-btn-back"
                style={{ flex: 1 }}
              >
                ← Back to Edit
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="nbm-btn nbm-btn-next"
                style={{ flex: 1 }}
              >
                {loading ? 'Creating Booking...' : '✅ Confirm & Create Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NewBookingModal;