import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { 
  ChevronLeft, ChevronRight, Minus, Plus, MessageCircle, Plane, Ticket, UserCheck, Clock  
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import HotelRoomSelector from './hotelRoomSelector';
import BookingFormModal from './BookingFormModal';
import AppointmentModal from './AppointmentModal';
import './BookingRightForm.css';
import { BookingStateManager } from '../../utils/bookingStateManager';

const BookingRightForm = ({ 
  pkg,
  customizationData: initialCustomizationData = null,
  effectivePackagePrice = null,
  effectivePackageTotal = null,
  currency = 'PHP',
  exchangeRate = 58,
  timerExpired: timerExpiredFromParent = false
}) => {
  const navigate = useNavigate();
  const { code } = useParams();
  const [selectedDate, setSelectedDate] = useState(null);
  const [quantities, setQuantities] = useState({ adult: 1 });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [bookingWithAirfare, setBookingWithAirfare] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [hotelData, setHotelData] = useState(null);
  const [loadingHotelData, setLoadingHotelData] = useState(false);
  const [passengerStep, setPassengerStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoWarning, setPromoWarning] = useState(''); // ✅ For partial usage warnings
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);
  const [paymentType, setPaymentType] = useState('full');
  const [customizationData, setCustomizationData] = useState(initialCustomizationData);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerExpired, setTimerExpired] = useState(timerExpiredFromParent);
  const [userIpAddress, setUserIpAddress] = useState(null);
  
  // ✅ NEW: IP-based OTC button access control
  const [hasOTCAccess, setHasOTCAccess] = useState(false);
  const [checkingOTCAccess, setCheckingOTCAccess] = useState(true);
  const durationDays = parseInt(pkg.duration?.match(/(\d+)D/)?.[1] || 1);
  const durationNights = parseInt(pkg.duration?.match(/(\d+)N/)?.[1] || durationDays - 1); 
  const totalPassengers = quantities.adult || 1;
  const basePax = totalPassengers; // ✅ Component-level pax count for promo calculations

  // ✅ Component-level effective per-pax price (mirrors calculateBasePackageTotal logic)
  const effectivePerPaxPrice = (() => {
    if (customizationData && customizationData.totalPrice !== undefined) {
      return customizationData.totalPrice;
    }
    const bp = pkg.price || 0;
    return timerExpired ? Math.round(bp * 1.10) : bp;
  })();

  const isInternationalFlight = selectedFlight && 
    selectedFlight.departure.iataCode.substring(0, 2) !== selectedFlight.arrival.iataCode.substring(0, 2);
  const requiresPassport = isInternationalFlight;
  const requiresID = selectedFlight && !isInternationalFlight;

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

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice = (phpPrice) => {
    if (currency === 'PHP') return phpPrice;
    return (phpPrice / exchangeRate) * 1.30; 
  };

  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIpAddress(data.ip);
      } catch (error) {
        console.error('❌ Error fetching IP:', error);
        setUserIpAddress('unknown');
      }
    };
    fetchIpAddress();
  }, []);

  useEffect(() => {
    const checkOTCAccess = async () => {
      try {
        const response = await axios.get('https://wanderwaveph.onrender.com/api/ip/check-otc-access');
        
        
        setHasOTCAccess(response.data.hasOTCAccess);
        setCheckingOTCAccess(false);

        if (response.data.hasOTCAccess) {
        } else {
        }
      } catch (error) {
        console.error('❌ Failed to check OTC access:', error);
        setHasOTCAccess(false);
        setCheckingOTCAccess(false);
      }
    };

    checkOTCAccess();
  }, []);

  useEffect(() => {
    const savedState = BookingStateManager.getBookingState(code);
    if (savedState && savedState.formData) {
      if (savedState.formData.selectedDate) {
        setSelectedDate(savedState.formData.selectedDate);
      }
      
      if (savedState.formData.quantities) {
        setQuantities(savedState.formData.quantities);
      }
      
      if (savedState.formData.currentMonth) {
        setCurrentMonth(new Date(savedState.formData.currentMonth));
      }
      
      if (savedState.formData.selectedFlight) {
        setSelectedFlight(savedState.formData.selectedFlight);
        setBookingWithAirfare(true);
      }
      
      if (savedState.formData.selectedRoomType) {
        // ✅ FIXED: Only restore if it's a Budget room, otherwise let auto-select handle it
        const savedRoomType = savedState.formData.selectedRoomType;
        const isBudget = savedRoomType.type?.toUpperCase().includes('BUDGET');
        
        if (isBudget) {
          setSelectedRoomType(savedRoomType);
        } else {
        }
      }
      
      if (savedState.formData.passengers && savedState.formData.passengers.length > 0) {
        setPassengers(savedState.formData.passengers);
      }
      
if (savedState.formData.appliedPromo) {
  // ✅ VALIDATE: Only restore promo if it was applied to THIS package
  const savedPromo = savedState.formData.appliedPromo;
  const currentPackageId = (pkg._id || pkg.id).toString();
  const savedPackageId = savedPromo.packageId ? savedPromo.packageId.toString() : null;
  
  
  if (savedPackageId && savedPackageId === currentPackageId) {
    // Same package - restore the promo
    setAppliedPromo(savedPromo);
    setPromoCode(savedPromo.code || '');
  } else {
    // Different package - clear the promo
    setAppliedPromo(null);
    setPromoCode('');
  }
}
      
      if (savedState.formData.paymentType) {
        setPaymentType(savedState.formData.paymentType);
      }
      
    }
  }, [code]);
  // ✅ Sync timerExpired state with parent
  useEffect(() => {
    setTimerExpired(timerExpiredFromParent);
  }, [timerExpiredFromParent]);


  useEffect(() => {
    if (selectedDate || quantities.adult > 1 || selectedFlight || appliedPromo) {
      const stateToSave = {
        selectedDate,
        quantities,
        currentMonth: currentMonth.toISOString(),
        selectedFlight,
        selectedRoomType,
        passengers,
        appliedPromo,
        paymentType
      };
      
      BookingStateManager.saveBookingState(code, stateToSave, customizationData);
    }
  }, [selectedDate, quantities, selectedFlight, selectedRoomType, passengers, appliedPromo, paymentType, customizationData, code, currentMonth]);

  useEffect(() => {
    if (!userIpAddress || !pkg._id) return;

    const timerKey = `timer_${pkg._id}_${userIpAddress}`;
    const storedTimer = localStorage.getItem(timerKey);

    if (storedTimer) {
      const timerData = JSON.parse(storedTimer);
      const now = Date.now();
      const elapsed = now - timerData.startTime;
      const remaining = Math.max(0, 900000 - elapsed);

      if (remaining > 0) {
        setTimeRemaining(remaining);
        setTimerExpired(false);
      } else {
        setTimeRemaining(0);
        setTimerExpired(true);
      }
    } else {
      const startTime = Date.now();
      localStorage.setItem(timerKey, JSON.stringify({ startTime }));
      setTimeRemaining(900000);
      setTimerExpired(false);
    }
  }, [userIpAddress, pkg._id]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          setTimerExpired(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  useEffect(() => {
    if (!userIpAddress || !pkg._id) return;

    const checkDailyReset = () => {
      const timerKey = `timer_${pkg._id}_${userIpAddress}`;
      const lastResetKey = `lastReset_${pkg._id}_${userIpAddress}`;
      const lastReset = localStorage.getItem(lastResetKey);
      const today = new Date().toDateString();

      if (lastReset !== today) {
        localStorage.removeItem(timerKey);
        localStorage.setItem(lastResetKey, today);
        
        const startTime = Date.now();
        localStorage.setItem(timerKey, JSON.stringify({ startTime }));
        setTimeRemaining(900000);
        setTimerExpired(false);
      }
    };

    checkDailyReset();
    const dailyCheck = setInterval(checkDailyReset, 60000);

    return () => clearInterval(dailyCheck);
  }, [userIpAddress, pkg._id]);

  useEffect(() => {
    const bookingData = sessionStorage.getItem('pendingBookingData');
    
    if (bookingData) {
      const data = JSON.parse(bookingData);
      
      if (data.selectedFlight && data.packageId === pkg._id) {
        setSelectedFlight(data.selectedFlight);
        setBookingWithAirfare(true);
        setSelectedDate(data.selectedDate);
        setQuantities(data.quantities);
        setCurrentMonth(new Date(data.currentMonth));
        sessionStorage.removeItem('pendingBookingData');
        
        toast.success(`✈️ Flight Added! ${data.selectedFlight.airline.name}`, { duration: 3000 });
        
        setTimeout(() => {
          setPassengerStep(1);
          setShowModal(true);
        }, 500);
      }
    }
  }, [pkg._id]);

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
          
          setHotelData({
            name: `${city} Hotels`,
            location: city,
            roomTypes: roomTypes
          });
          
          const budgetRoom = roomTypes.find(room => 
            room.type?.toUpperCase().includes('BUDGET')
          );
          
          if (budgetRoom) {
            setSelectedRoomType(budgetRoom);
          } else {
            const sortedRooms = [...roomTypes].sort((a, b) => a.price - b.price);
            setSelectedRoomType(sortedRooms[0]);
          }
        }
      } catch (error) {
        console.error('❌ Error:', error);
      } finally {
        setLoadingHotelData(false);
      }
    };

    fetchHotelData();
  }, [pkg.destination, pkg.location]);

  useEffect(() => {
    if (initialCustomizationData) {
      setCustomizationData(initialCustomizationData);
    }
  }, [initialCustomizationData]);

  useEffect(() => {
    const newTotal = quantities.adult || 1;
    setPassengers(prevPassengers => {
        if (newTotal === prevPassengers.length) return prevPassengers; 
        
        return Array.from({ length: newTotal }, (_, idx) => 
          prevPassengers[idx] || {
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

  const calculateBasePackageTotal = () => {
  const basePax = quantities.adult || 1;
  
  // ✅ FIXED: Use customizationData.totalPrice which includes timer-aware pricing
  let effectivePrice;
  
  if (customizationData && customizationData.totalPrice !== undefined) {
    // Use the totalPrice from PackageCustomizer (already includes timer-aware base + adjustments)
    effectivePrice = customizationData.totalPrice;
    
  } else {
    // Fallback: Calculate based on timer status
    const basePrice = pkg.price || 0;
    const originalPriceWithMarkup = Math.round(basePrice * 1.10);
    effectivePrice = timerExpired ? originalPriceWithMarkup : basePrice;
    
  }
  
  let basePackagePrice = effectivePrice * basePax;
  
  // ✅ FIX: If package price is 0 or negative (all priced inclusions removed), return 0
  // Don't add room upgrade price to an empty package
  if (basePackagePrice <= 0) {
    return 0;
  }
  
  if (!selectedRoomType) return basePackagePrice;

  const roomType = selectedRoomType.type?.toUpperCase() || '';
  
  let upgradePrice = 0;
  
  if (roomType.includes('STANDARD')) {
    upgradePrice = 900;
  } else if (roomType.includes('4 STAR')) {
    upgradePrice = 1150;
  } else if (roomType.includes('5 STAR')) {
    upgradePrice = 1400;
  }
  
  const baseRoomCapacity = 4;
  const pricePerPerson = upgradePrice / baseRoomCapacity;
  const upgradeTotal = pricePerPerson * basePax;

  return basePackagePrice + upgradeTotal;
};

  const calculateDiscount = () => {
    if (!appliedPromo) return 0;

    // ✅ PRIORITY ORDER for determining pax coverage:
    // 1. remainingUses (global usage limit remaining) — most restrictive
    // 2. maxUsesPerBooking (per-booking pax cap)
    // 3. Full pax count (no restrictions)
    let maxPaxCovered = basePax;

    if (appliedPromo.remainingUses !== null && appliedPromo.remainingUses !== undefined) {
      maxPaxCovered = Math.min(maxPaxCovered, appliedPromo.remainingUses);
    }

    if (appliedPromo.maxUsesPerBooking) {
      maxPaxCovered = Math.min(maxPaxCovered, appliedPromo.maxUsesPerBooking);
    }

    if (appliedPromo.discountType === 'Percentage') {
      return (effectivePerPaxPrice * appliedPromo.discountValue / 100) * maxPaxCovered;
    } else {
      return appliedPromo.discountValue * maxPaxCovered;
    }
  };

  const calculateRoomsNeeded = () => {
    if (!selectedRoomType) return 1;
    return Math.ceil(totalPassengers / (selectedRoomType.capacity || 4));
  };

  const calculatePartialAmount = () => {
    const finalAmount = selectedFlight ? finalTotalAmount : finalPackageTotal;
    const percentage = selectedFlight ? 0.85 : 0.50;
    return Math.round(finalAmount * percentage);
  };

  const getCalculatedDates = () => {
    if (!selectedDate) return { start: null, end: null };
    const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);

    return { start, end };
  };

  const formatDateRangeDisplay = () => {
    const { start, end } = getCalculatedDates();
    if (!start || !end) return '';

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const startMonth = monthNames[start.getMonth()];
    const endMonth = monthNames[end.getMonth()];
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const startDay = start.getDate();
    const endDay = end.getDate();

    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
    }

    if (startMonth !== endMonth && startYear === endYear) {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
    }

    return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
  };

  const isInSelectedRange = (day) => {
    if (!selectedDate) return false;
    
    const { start, end } = getCalculatedDates();
    const currentCheckDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    currentCheckDate.setHours(0,0,0,0);
    if(start) start.setHours(0,0,0,0);
    if(end) end.setHours(0,0,0,0);

    return currentCheckDate >= start && currentCheckDate <= end;
  };

  const basePackageTotal = calculateBasePackageTotal();
  const originalPriceWithMarkup = Math.round(basePackageTotal * 1.10);
  const packageTotal = basePackageTotal; // ✅ FIXED: Always use basePackageTotal (already timer-aware)
  const discountAmount = calculateDiscount();
  const finalPackageTotal = Math.max(0, packageTotal - discountAmount);
  const airfareTotal = selectedFlight ? selectedFlight.price.amount : 0;
  const finalTotalAmount = finalPackageTotal + airfareTotal;
  const totalAmount = packageTotal + airfareTotal;
  const partialAmount = calculatePartialAmount();
  const numberOfRooms = calculateRoomsNeeded();
  
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const convertedPackageTotal = convertPrice(packageTotal);
  const convertedOriginalPriceWithMarkup = convertPrice(originalPriceWithMarkup);
  const convertedFinalPackageTotal = convertPrice(finalPackageTotal);
  
  // ✅ VALIDATION: Check if package total is zero (all inclusions removed)
  const hasValidPackageTotal = finalPackageTotal > 0;
  const convertedAirfareTotal = convertPrice(airfareTotal);
  const convertedFinalTotalAmount = convertPrice(finalTotalAmount);
  const convertedDiscountAmount = convertPrice(discountAmount);
  const convertedPartialAmount = convertPrice(partialAmount);

const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsCheckingPromo(true);
    setPromoError('');

    try {
      const packageId = pkg._id || pkg.id;
      
      const url = `https://wanderwaveph.onrender.com/api/promos/validate/${promoCode.toUpperCase()}?packageId=${packageId}`;
      
      const response = await fetch(url);
      
      const data = await response.json();

      if (response.ok && data.valid) {
        const promo = data.promo;
        const currentPax = quantities.adult || 1;

        // ✅ USAGE LIMIT VALIDATION
        const hasUsageLimit = promo.usageLimit && promo.usageLimit > 0;
        const usedCount = promo.usedCount || 0;
        const remainingUses = hasUsageLimit ? (promo.usageLimit - usedCount) : Infinity;

        // ❌ CASE 1: Fully exhausted — block completely
        if (hasUsageLimit && remainingUses <= 0) {
          setPromoError(
            `This promo code has reached its usage limit (${promo.usageLimit}/${promo.usageLimit} uses). ` +
            `Please try a different promo code.`
          );
          setPromoWarning('');
          setAppliedPromo(null);
          setIsCheckingPromo(false);
          return;
        }

        // ⚠️ CASE 2: Partial — remaining uses < pax count, can still apply but limited
        let effectivePaxCovered = currentPax;
        if (hasUsageLimit && remainingUses < currentPax) {
          effectivePaxCovered = remainingUses;
          setPromoWarning(
            `Only ${remainingUses} use${remainingUses > 1 ? 's' : ''} remaining out of ${promo.usageLimit} total limit. ` +
            `Discount will apply to ${remainingUses} of ${currentPax} pax only.`
          );
        } else {
          setPromoWarning('');
        }

        const appliedPromoData = {
          code: promo.code,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          promoId: promo._id,
          packageId: packageId,
          maxUsesPerBooking: promo.maxUsesPerBooking || null,
          // ✅ Store remaining uses info for discount calculation
          remainingUses: hasUsageLimit ? remainingUses : null,
          usageLimit: promo.usageLimit || null,
          usedCount: usedCount,
        };

        setAppliedPromo(appliedPromoData);

        if (hasUsageLimit && remainingUses < currentPax) {
          toast(
            `⚠️ Promo "${promo.code}" applied with limited coverage: ${remainingUses} of ${currentPax} pax.`,
            { duration: 5000, icon: '⚠️' }
          );
        } else {
          toast.success(
            `✅ Promo "${promo.code}" applied to ${currentPax} pax.`,
            { duration: 3000 }
          );
        }
      } else {
        
        const errorMsg = data.message || 'Invalid or expired promo code';
        setPromoError(errorMsg);
        setAppliedPromo(null);
        toast.error(errorMsg, { duration: 3000 });
      }
    } catch (error) {
      console.error('❌ ============ ERROR CAUGHT ============');
      console.error('Error details:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      setPromoError('Failed to validate promo code');
      setAppliedPromo(null);
      toast.error('Failed to validate promo code', { duration: 3000 });
    } finally {
      setIsCheckingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
    setPromoWarning('');
    toast.success('Promo code removed', { duration: 2000 });
  };

  const handleQuantity = (type, delta) => {
    setQuantities(prev => ({
      ...prev,
      [type]: Math.max(1, Math.min(20, (prev[type] || 1) + delta))
    }));
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth.setMonth(currentMonth.getMonth() + offset));
    setCurrentMonth(new Date(newDate));
  };

  const handleRoomTypeChange = (roomType) => {
    setSelectedRoomType(roomType);
    toast.success(`Selected: ${roomType.type} at ${roomType.hotelName}`, { duration: 2000 });
  };

  const handleBookClick = () => {
    if (!selectedDate) {
      toast.error("Please select a travel date first!", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
      return;
    }
    setBookingWithAirfare(false);
    setPassengerStep(1);
    setShowModal(true);
  };

  const handleWalkInClick = () => {
    if (!selectedDate) {
      toast.error("Please select a travel date first!", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
      return;
    }
    setShowAppointmentModal(true);
  };

  const handleBookWithAirfare = () => {
    if (!selectedDate) {
      toast.error("Please select a travel date first!", {
        style: { border: '1px solid #ef4444', color: '#ef4444' },
        iconTheme: { primary: '#ef4444', secondary: '#fff' },
      });
      return;
    }

    const { start, end } = getCalculatedDates();

    const formatDate = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const departureDateStr = formatDate(start);
    const returnDateStr = formatDate(end);    

    const completeState = {
      selectedDate,
      quantities,
      currentMonth: currentMonth.toISOString(),
      selectedFlight,
      selectedRoomType,
      passengers,
      appliedPromo,
      paymentType
    };
    
    BookingStateManager.saveBookingState(code, completeState, customizationData);

    const bookingData = {
      packageId: pkg._id || pkg.id,
      packageName: pkg.name,
      packageData: pkg, 
      sellerPrice: pkg.sellerPrice || 0,
      markup: pkg.markup || 0,
      price: pkg.price,
      selectedDate: selectedDate,
      quantities: quantities,
      currentMonth: currentMonth.toISOString(),
      destination: pkg.location || pkg.destination,
      departureDate: departureDateStr, 
      returnToBooking: true,
      returnPath: `/packages/${code}`
    };

    sessionStorage.setItem('pendingBookingData', JSON.stringify(bookingData));
    BookingStateManager.setFlightSearchContext(code, pkg);
    
    navigate('/flights', {
      state: {
        fromBooking: true,
        packageData: {
          packageId: pkg._id || pkg.id,
          packageName: pkg.name,
          departureDate: departureDateStr, 
          returnDate: returnDateStr,
          destination: pkg.location || pkg.destination,
          passengers: {
            adults: quantities.adult || 1,
            children: 0,
            infants: 0
          }
        }
      }
    });
  };

  const handleRemoveFlight = () => {
    setSelectedFlight(null);
    setBookingWithAirfare(false);
    toast.success('Flight removed from package', { duration: 2000 });
  };

  const handleContactSales = () => {
    window.open('https://www.facebook.com/wanderwaveph', '_blank');
  };

  const handlePassengerChange = (index, field, value) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleFileUpload = (index, type, event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      event.target.value = null;
      return;
    }

    setPassengers(prev => {
      const updated = [...prev];
      if (type === 'id') {
        updated[index].idFile = file;
        updated[index].idFileName = file.name;
      } else if (type === 'passport') {
        updated[index].passportFile = file;
        updated[index].passportFileName = file.name;
      }
      return updated;
    });
  };

  const removeFile = (index, type) => {
    setPassengers(prev => {
      const updated = [...prev];
      if (type === 'id') {
        updated[index].idFile = null;
        updated[index].idFileName = '';
      } else if (type === 'passport') {
        updated[index].passportFile = null;
        updated[index].passportFileName = '';
      }
      return updated;
    });
  };

  // ✅ ADD THIS NEW HELPER FUNCTION RIGHT BEFORE handleNextPassenger (around line 725)
const getTimerAwarePrice = () => {
  const basePrice = pkg.price || 0;
  
  // Check if customization is active
  if (customizationData && customizationData.totalPrice !== undefined) {
    // Use customization total (already includes timer-aware base + adjustments)
    return customizationData.totalPrice;
  }
  
  // No customization - apply timer logic to base price
  if (timerExpired) {
    return Math.round(basePrice * 1.10); // 10% markup
  }
  
  return basePrice; // Discounted price
};

const handleNextPassenger = async (e) => {
  e.preventDefault();
  
  const currentPassengerData = passengers[passengerStep - 1];
  
  if (bookingWithAirfare && requiresID && !currentPassengerData.idFile) {
    toast.error('Please upload a valid ID for this passenger');
    return;
  }
  
  if (bookingWithAirfare && requiresPassport && !currentPassengerData.passportFile) {
    toast.error('Please upload a valid passport for this passenger');
    return;
  }

  if (passengerStep < totalPassengers) {
    setPassengerStep(prev => prev + 1);
    return;
  }

  setLoading(true);
  
  try {
    const formData = new FormData();
    const { start, end } = getCalculatedDates(); 

    const formatDate = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const startDateFormatted = formatDate(start);
    const endDateFormatted = formatDate(end);

    // ✅ CALCULATE THE CORRECT PRICE BASED ON TIMER STATUS
    const correctPrice = getTimerAwarePrice();
    const basePriceForComparison = pkg.price || 0;
    
    console.log('🔍 ===== PRICE DEBUG =====');
    console.log('Timer Expired:', timerExpired);
    console.log('Base Package Price:', basePriceForComparison);
    console.log('Correct Price to Save:', correctPrice);
    console.log('Package Total:', packageTotal);
    console.log('Final Package Total:', finalPackageTotal);
    console.log('========================');

    const baseBookingData = {
      packageId: pkg._id,
      packageName: pkg.name,
      packagePrice: correctPrice, // ✅ FIXED - Uses timer-aware price
      startDate: startDateFormatted,
      endDate: endDateFormatted,
      duration: pkg.duration,
      pax: {
        adult: quantities.adult,
        children: quantities.children || 0,
        infants: quantities.infants || 0,
      },
      packageTotal: packageTotal,
      promoCode: appliedPromo ? appliedPromo.code : null,
      promoId: appliedPromo ? appliedPromo.promoId : null,
      discountAmount: discountAmount,
      finalPackageTotal: finalPackageTotal,
      
      // ✅ ADD NEW FIELDS FOR PRICE TRACKING
      timerExpiredAtBooking: timerExpired,
      priceType: timerExpired ? 'markup' : 'discounted',
      originalPackagePrice: basePriceForComparison,
      appliedMarkup: timerExpired ? Math.round(basePriceForComparison * 0.10) : 0,
      
      includesAirfare: !!selectedFlight,
      flightDetails: selectedFlight ? ({
        airline: selectedFlight.airline.name,
        flightNumber: selectedFlight.airline.flightNumber || 'N/A',
        departure: selectedFlight.departure,
        arrival: selectedFlight.arrival,
        duration: selectedFlight.duration,
        stops: selectedFlight.stops,
        price: selectedFlight.price, 
        isInternational: isInternationalFlight
      }) : null,
      
      airfareTotal: airfareTotal,
      totalAmount: finalTotalAmount,
      paymentType: paymentType || 'full',
      initialPaymentAmount: paymentType === 'partial' ? partialAmount : finalTotalAmount,
      remainingBalance: paymentType === 'partial' ? (finalTotalAmount - partialAmount) : 0,
      
      fullName: `${passengers[0].firstName} ${passengers[0].lastName}`,
      email: passengers[0].email,
      message: '',
      
      primaryContact: {
        fullName: `${passengers[0].firstName} ${passengers[0].lastName}`,
        email: passengers[0].email,
      },
      
      selectedRoomType: selectedRoomType ? selectedRoomType.type : null,
      hotelName: selectedRoomType ? selectedRoomType.hotelName : null,
      numberOfRooms: numberOfRooms,
      
      // ✅ FIXED - All price fields use correct timer-aware price
      sellerPrice: correctPrice, 
      markup: timerExpired ? Math.round(basePriceForComparison * 0.10) : 0, 
      price: correctPrice, // ✅ CRITICAL FIX - This is what gets saved to DB
      
      isCustomized: customizationData ? true : false,
      customizedInclusions: customizationData ? customizationData.inclusions.map(inc => ({
        id: inc.id,
        name: inc.name,
        price: inc.price || 0,
        supplierRate: inc.supplierRate,
        markup: inc.markup,
        markupType: inc.markupType,
        supplier: inc.supplier,
        destination: inc.destination,
        pax: inc.pax,
        notes: inc.notes,
        isOriginal: inc.isOriginal,
        isChecked: inc.isChecked,
        source: inc.source,
        sellerRateId: inc.sellerRateId
      })) : [],
      customizationAdditionalPrice: customizationData ? customizationData.additionalPrice : 0,
      customizationDeductions: customizationData ? customizationData.deductions : 0,
      customizationAdditions: customizationData ? customizationData.additions : 0,
      originalInclusions: customizationData ? (pkg.inclusions || []) : [],
      
      passengers: passengers.map(p => ({
        passengerNumber: p.passengerNumber || 1,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        email: p.email || '',
        phone: p.phone || '',
        dateOfBirth: p.dateOfBirth || '',
        age: p.age || 0,
        gender: p.gender || '',
        address: p.address || '',
        nationality: p.nationality || 'Filipino',
      }))
    };
    
    formData.append('bookingData', JSON.stringify(baseBookingData));

    passengers.forEach((passenger, idx) => {
      if (passenger.idFile) {
        formData.append(`idFile_${idx}`, passenger.idFile);
      }
      if (passenger.passportFile) {
        formData.append(`passportFile_${idx}`, passenger.passportFile);
      }
    });
    
    const bookingResponse = await axios.post('https://wanderwaveph.onrender.com/api/bookings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (bookingResponse.data.success) {
      const bookingId = bookingResponse.data.bookingId;
      
      toast.success('Booking saved! Preparing payment link...', { duration: 3000 });
      
      const paymentResponse = await axios.post('https://wanderwaveph.onrender.com/api/payment/create-intent', {
        bookingId: bookingId,
        paymentType: paymentType || 'full',
        paymentAmount: paymentType === 'partial' ? partialAmount : finalTotalAmount
      });
      
      if (paymentResponse.data.success && paymentResponse.data.checkoutUrl) {
        const checkoutUrl = paymentResponse.data.checkoutUrl;
        toast.success('💰 Redirecting to PayMongo...', { duration: 1500 });
        setShowModal(false);
        
        window.location.href = checkoutUrl; 
        return;
        
      } else {
        toast.error('Payment link failed. Please pay manually on your dashboard.', { duration: 4000 });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      }
    } else {
      throw new Error(bookingResponse.data.message || 'Booking submission failed on server.');
    }
  } catch (error) {
    console.error('Booking/Payment Error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to submit booking. Please try again.';
    
    if (error.response?.data?.error) {
      console.error("Payment API Error Details:", error.response.data.error);
    }
    
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};

  const handleBackPassenger = () => {
    if (passengerStep > 1) {
      setPassengerStep(prev => prev - 1);
    }
  };

  return (
    <div className="brf-container">
      <Toaster position="top-center" />
      
      <div className="brf-header">
        <h2>Book Your Journey</h2>
        <p className="brf-subtitle">Select your preferred dates and customize your trip</p>
        <br></br>
      </div>

      {!timerExpired && timeRemaining !== null && (
        <div style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            textAlign: 'center',
            fontSize: '0.95rem',
            fontWeight: '700',
            marginBottom: '12px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase'
          }}>
            ⚡ HURRY - Limited Time Offer!
          </div>

          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '12px 16px',
              minWidth: '70px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800',
                color: '#ef4444',
                lineHeight: '1',
                fontFamily: 'monospace'
              }}>
                {Math.floor(timeRemaining / 60000).toString().padStart(2, '0')}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: '#6b7280',
                marginTop: '4px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                MINUTES
              </div>
            </div>

            <div style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: 'white',
              lineHeight: '1'
            }}>
              :
            </div>

            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '12px 16px',
              minWidth: '70px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
            }}>
              <div style={{ 
                fontSize: '1.8rem', 
                fontWeight: '800',
                color: '#ef4444',
                lineHeight: '1',
                fontFamily: 'monospace'
              }}>
                {Math.floor((timeRemaining % 60000) / 1000).toString().padStart(2, '0')}
              </div>
              <div style={{
                fontSize: '0.65rem',
                color: '#6b7280',
                marginTop: '4px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                SECONDS
              </div>
            </div>
          </div>

          <div style={{ 
            textAlign: 'center',
            fontSize: '0.85rem',
            opacity: 0.9,
            color: '#fbbf24',
            fontWeight: '600'
          }}>
            💰 Save ₱{(originalPriceWithMarkup - basePackageTotal).toLocaleString()}!
          </div>
        </div>
      )}

      <div className="brf-calendar-wrapper">
        <div className="brf-calendar-box">
          <div className="brf-calendar-header">
            <button onClick={() => changeMonth(-1)} className="brf-month-nav">
              <ChevronLeft size={20} />
            </button>
            <h3 className="brf-month-year">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={() => changeMonth(1)} className="brf-month-nav">
              <ChevronRight size={20} />
            </button>
          </div>

          {selectedDate && (
            <div className="brf-selected-date-display">
              <div className="brf-date-icon">📅</div>
              <div>
                <div style={{fontWeight:'600', color:'#1f2937'}}>
                  {formatDateRangeDisplay()}
                </div>
                <div style={{fontSize:'0.85rem', color:'#6b7280', marginTop:'4px'}}>
                  {durationDays} days • {durationNights} {durationNights === 1 ? 'night' : 'nights'}
                </div>
              </div>
            </div>
          )}

          <div className="brf-calendar-grid">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="brf-calendar-day-label">{d}</div>
            ))}
            {[...Array(firstDay)].map((_, i) => <div key={`empty-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              dateToCheck.setHours(0, 0, 0, 0);
              
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isPastDate = dateToCheck < today;

              const isStartDate = selectedDate === day;
              const isInRange = isInSelectedRange(day);
              
              return (
                <button
                  key={day}
                  disabled={isPastDate} 
                  onClick={() => !isPastDate && setSelectedDate(day)}
                  className={`brf-calendar-day 
                    ${isStartDate ? 'brf-selected' : ''} 
                    ${isInRange && !isStartDate ? 'brf-in-range' : ''} 
                    ${isPastDate ? 'brf-disabled-date' : ''} 
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="brf-quantity-section">
        <div className="brf-quantity-item">
          <div>
            <div style={{display:'flex', alignItems:'center'}}>
              <span className="brf-quantity-label">Standard Pax</span>
            </div>
            <div style={{fontSize:'0.8rem', color:'#6b7280', marginTop:'4px'}}>3+ years old</div>
          </div>
          
          <div className="brf-quantity-controls">
            <button 
              onClick={() => handleQuantity('adult', -1)} 
              className="brf-quantity-btn"
              type="button"
            >
              <Minus 
                size={18} 
                color="#000000" 
                strokeWidth={3}
                style={{minWidth: '18px', minHeight: '18px', stroke: '#000000'}}
              />
            </button>
            <span className="brf-quantity-value">{quantities.adult}</span>
            <button 
              onClick={() => handleQuantity('adult', 1)} 
              className="brf-quantity-btn"
              type="button"
            >
              <Plus 
                size={18} 
                color="#000000" 
                strokeWidth={3}
                style={{minWidth: '18px', minHeight: '18px', stroke: '#000000'}}
              />
            </button>
          </div>
        </div>
      </div>

      {loadingHotelData && (
        <div style={{padding:'1rem', background:'#fef3c7', borderRadius:'8px', marginBottom:'1rem'}}>
          Loading hotel data...
        </div>
      )}

      {!loadingHotelData && (!hotelData || !hotelData.roomTypes || hotelData.roomTypes.length === 0) && (
        <div style={{padding:'1rem', background:'#fee2e2', borderRadius:'8px', marginBottom:'1rem', fontSize:'0.85rem'}}>
          ⚠️ No room types available for {pkg.destination || pkg.location || 'this destination'}
        </div>
      )}

      {hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0 && (
        <HotelRoomSelector
          roomTypes={hotelData.roomTypes}
          selectedRoomType={selectedRoomType}
          onRoomTypeChange={handleRoomTypeChange}
          numberOfRooms={numberOfRooms}
          numberOfPax={quantities.adult || 1}
          durationDays={durationDays}
          durationNights={durationNights}
        />
      )}

      {selectedFlight && (
        <div style={{
          background: '#fff7ed', border: '2px solid #fc9c1b', borderRadius: '12px',
          padding: '16px', marginBottom: '20px'
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
              <Plane size={20} color="#fc9c1b"/>
              <strong style={{color:'#1f2937', fontSize:'0.95rem'}}>Flight Added to Package</strong>
            </div>
            <button 
              onClick={handleRemoveFlight}
              style={{
                background:'none', border:'none', color:'#ef4444', 
                cursor:'pointer', fontSize:'0.85rem', textDecoration:'underline'
              }}
            >
              Remove
            </button>
          </div>
          <div style={{fontSize:'0.9rem', color:'#374151', lineHeight:'1.6'}}>
            <div><strong>{selectedFlight.airline.name}</strong> • {selectedFlight.airline.flightNumber || 'Flight'}</div>
            <div>{selectedFlight.departure.iataCode} → {selectedFlight.arrival.iataCode}</div>
            <div style={{color:'#6b7280', fontSize:'0.85rem'}}>{selectedFlight.departure.displayTime} - {selectedFlight.arrival.displayTime}</div>
            <div style={{marginTop:'8px', fontWeight:'700', color:'#fc9c1b', fontSize:'1rem'}}>
              +{selectedFlight.price.formatted}
            </div>
          </div>
        </div>
      )}

      <div className="brf-promo-section">
        <div className="brf-promo-header">
          <Ticket size={20} color="#fc9c1b"/>
          <span className="brf-promo-header-text">Have a Promo Code?</span>
        </div>

        {!appliedPromo ? (
          <>
            <div className="brf-promo-input-group">
              <input
                type="text"
                className={`brf-promo-input ${promoError ? 'error' : ''}`}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleApplyPromo();
                }}
              />
              <button
                className="brf-promo-apply-btn"
                onClick={handleApplyPromo}
                disabled={isCheckingPromo}
              >
                {isCheckingPromo ? 'Checking...' : 'Apply'}
              </button>
            </div>
            
            {promoError && (
              <div style={{
                color: '#ef4444',
                fontSize: '0.85rem',
                marginTop: '8px',
                padding: '10px 12px',
                backgroundColor: '#fee2e2',
                borderRadius: '8px',
                border: '1px solid #fecaca',
                lineHeight: '1.5'
              }}>
                ❌ {promoError}
              </div>
            )}
          </>
        ) : (
          <div className="brf-promo-success-box">
            <div style={{ flex: 1 }}>
              <div className="brf-promo-code-text">
                {appliedPromo.code}
              </div>
              {/* ✅ Per-pax discount breakdown with usage limit awareness */}
              {(() => {
                // Compute effective pax covered (same logic as calculateDiscount)
                let coveredPax = basePax;
                if (appliedPromo.remainingUses !== null && appliedPromo.remainingUses !== undefined) {
                  coveredPax = Math.min(coveredPax, appliedPromo.remainingUses);
                }
                if (appliedPromo.maxUsesPerBooking) {
                  coveredPax = Math.min(coveredPax, appliedPromo.maxUsesPerBooking);
                }

                const isLimitedByUsage = appliedPromo.remainingUses !== null &&
                  appliedPromo.remainingUses !== undefined &&
                  appliedPromo.remainingUses < basePax;

                const isLimitedByBooking = appliedPromo.maxUsesPerBooking &&
                  appliedPromo.maxUsesPerBooking < basePax;

                const perPaxDiscount = appliedPromo.discountType === 'Percentage'
                  ? `${appliedPromo.discountValue}% per pax`
                  : `${currencySymbol}${convertPrice(appliedPromo.discountValue).toLocaleString(undefined, {
                      minimumFractionDigits: currency === 'USD' ? 2 : 0,
                      maximumFractionDigits: currency === 'USD' ? 2 : 0
                    })} per pax`;

                return (
                  <>
                    <div className="brf-promo-desc-text">
                      {perPaxDiscount} × {coveredPax} pax
                      {(isLimitedByUsage || isLimitedByBooking) && (
                        <span style={{ color: '#d97706', marginLeft: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                          ({coveredPax} of {basePax} pax covered)
                        </span>
                      )}
                    </div>

                    {/* Usage limit warning */}
                    {isLimitedByUsage && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        marginTop: '6px',
                        fontSize: '0.8rem',
                        color: '#92400e',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        lineHeight: '1.4'
                      }}>
                        <span style={{ marginTop: '1px' }}>⚠️</span>
                        <span>
                          Only <strong>{appliedPromo.remainingUses}</strong> use{appliedPromo.remainingUses > 1 ? 's' : ''} remaining
                          (used {appliedPromo.usedCount}/{appliedPromo.usageLimit}).
                          Discount applies to <strong>{coveredPax}</strong> of <strong>{basePax}</strong> pax.
                          The remaining {basePax - coveredPax} pax will be charged at full price.
                        </span>
                      </div>
                    )}

                    {/* Per-booking pax cap warning (not usage-limited) */}
                    {!isLimitedByUsage && isLimitedByBooking && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '6px',
                        marginTop: '6px',
                        fontSize: '0.8rem',
                        color: '#92400e',
                        background: '#fef3c7',
                        border: '1px solid #fde68a',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        lineHeight: '1.4'
                      }}>
                        <span>⚠️</span>
                        <span>
                          This promo is limited to <strong>{appliedPromo.maxUsesPerBooking}</strong> pax per booking.
                          Remaining {basePax - coveredPax} pax will be at full price.
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <button
              className="brf-promo-remove-btn"
              onClick={handleRemovePromo}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="brf-booking-footer">
        <div className="brf-total-row">
          <span className="brf-total-label">Package Total</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {!timerExpired && (
              <span style={{
                textDecoration: 'line-through',
                color: '#9ca3af',
                fontSize: '0.9rem'
              }}>
                {currencySymbol}{convertedOriginalPriceWithMarkup.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0
                })}
              </span>
            )}
            <span className="brf-total-amount" style={{
              color: !timerExpired ? '#10b981' : '#1f2937'
            }}>
              {currencySymbol}{convertedPackageTotal.toLocaleString(undefined, {
                minimumFractionDigits: currency === 'USD' ? 2 : 0,
                maximumFractionDigits: currency === 'USD' ? 2 : 0
              })}
            </span>
          </div>
        </div>

        {appliedPromo && (() => {
          // Mirror same coverage logic as calculateDiscount
          let coveredPax = basePax;
          if (appliedPromo.remainingUses !== null && appliedPromo.remainingUses !== undefined) {
            coveredPax = Math.min(coveredPax, appliedPromo.remainingUses);
          }
          if (appliedPromo.maxUsesPerBooking) {
            coveredPax = Math.min(coveredPax, appliedPromo.maxUsesPerBooking);
          }
          const isPartial = coveredPax < basePax;

          return (
            <div className="brf-total-row" style={{color: '#10b981', fontSize: '0.9rem'}}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span>- Promo Discount ({appliedPromo.code})</span>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                  {appliedPromo.discountType === 'Percentage'
                    ? `${appliedPromo.discountValue}% × ${coveredPax} pax`
                    : `${currencySymbol}${convertPrice(appliedPromo.discountValue).toLocaleString(undefined, {
                        minimumFractionDigits: currency === 'USD' ? 2 : 0,
                        maximumFractionDigits: currency === 'USD' ? 2 : 0
                      })} × ${coveredPax} pax`
                  }
                  {isPartial && (
                    <span style={{ color: '#d97706', marginLeft: '4px' }}>
                      ({coveredPax}/{basePax} pax)
                    </span>
                  )}
                </span>
                {appliedPromo.usageLimit && (
                  <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                    Usage: {appliedPromo.usedCount}/{appliedPromo.usageLimit} uses
                  </span>
                )}
              </span>
              <span style={{fontWeight: '700'}}>
                -{currencySymbol}{convertedDiscountAmount.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0
                })}
              </span>
            </div>
          );
        })()}

        {appliedPromo && (
          <div className="brf-total-row" style={{fontSize: '0.95rem', color: '#374151'}}>
            <span>Discounted Package Total</span>
            <span style={{fontWeight: '700', color: '#fc9c1b'}}>
              {currencySymbol}{convertedFinalPackageTotal.toLocaleString(undefined, {
                minimumFractionDigits: currency === 'USD' ? 2 : 0,
                maximumFractionDigits: currency === 'USD' ? 2 : 0
              })}
            </span>
          </div>
        )}
        
        {selectedFlight && (
          <>
            <div className="brf-total-row" style={{fontSize: '0.9rem', color: '#6b7280'}}>
              <span>+ Airfare</span>
              <span>{currencySymbol}{convertedAirfareTotal.toLocaleString(undefined, {
                minimumFractionDigits: currency === 'USD' ? 2 : 0,
                maximumFractionDigits: currency === 'USD' ? 2 : 0
              })}</span>
            </div>
            <div className="brf-total-row" style={{
              borderTop: '2px solid #fc9c1b',
              paddingTop: '12px',
              marginTop: '8px',
              fontSize: '1.1rem',
              fontWeight: '800',
              color: '#1f2937'
            }}>
              <span style={{color: '#fc9c1b'}}>
                {currencySymbol}{convertedFinalTotalAmount.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0
                })}
              </span>
            </div>
          </>
        )}
        
        {!selectedFlight && (
          <div className="brf-total-row" style={{
            borderTop: '2px solid #fc9c1b',
            paddingTop: '12px',
            marginTop: '8px',
            fontSize: '1.1rem',
            fontWeight: '800',
            color: '#1f2937'
          }}>
            <span>TOTAL AMOUNT</span>
            <span style={{color: '#fc9c1b'}}>
              {currencySymbol}{convertedFinalPackageTotal.toLocaleString(undefined, {
                minimumFractionDigits: currency === 'USD' ? 2 : 0,
                maximumFractionDigits: currency === 'USD' ? 2 : 0
              })}
            </span>
          </div>
        )}
        
        <button 
          className="brf-book-now-btn" 
          onClick={handleBookClick}
          disabled={!selectedRoomType || !hasValidPackageTotal}
        >
          {selectedFlight ? '🎫 Book Package + Flight' : 'Book This Trip'}
        </button>
        
        {!hasValidPackageTotal && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: '#fef3c7',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#92400e'
          }}>
            <div style={{fontSize: '24px'}}>⚠️</div>
            <div>
              <strong style={{display: 'block', marginBottom: '4px'}}>Cannot proceed with booking</strong>
              <span style={{fontSize: '0.9rem'}}>You must have at least one inclusion selected. Please add inclusions to your package or reset customization.</span>
            </div>
          </div>
        )}

        {hasOTCAccess && (
          <button 
          className="brf-walk-in-btn" 
          onClick={handleWalkInClick}
          disabled={!selectedRoomType}
          style={{
          width: '100%',
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '18px',
          border: 'none',
          borderRadius: '12px',
          fontWeight: '700',
          fontSize: '1.1rem',
          cursor: 'pointer',
          transition: 'background 0.2s',
          boxShadow: '0 4px 6px rgba(59, 130, 246, 0.2)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
          }}
          >
          <UserCheck size={20} />
          Pay Over the Counter
          </button>
        )}

        <button className="brf-book-with-airfare-btn" onClick={handleBookWithAirfare}>
          <Plane size={20} />
          {selectedFlight ? 'Change Flight' : 'Add Airfare'}
        </button>

        <button className="brf-contact-sales-btn" onClick={handleContactSales}>
            <MessageCircle size={20} />
            Contact Sales
        </button>

        <p style={{textAlign:'center', fontSize:'0.8rem', color:'#9ca3af', marginTop:'12px'}}>
          No payment required today.
        </p>
      </div>

      <BookingFormModal 
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
        requiresID={requiresID}
        requiresPassport={requiresPassport}
        passengerStep={passengerStep}
        totalPassengers={totalPassengers}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        partialAmount={convertedPartialAmount}       
        progressPercent={Math.round((passengerStep / totalPassengers) * 100)}
        currentPassenger={passengers[passengerStep - 1]}
        passengers={passengers}
        handlePassengerChange={handlePassengerChange}
        handleFileUpload={handleFileUpload}
        removeFile={removeFile}
        handleNextPassenger={handleNextPassenger}
        handleBackPassenger={handleBackPassenger}
        loading={loading}
        currency={currency}                          
        exchangeRate={exchangeRate}                   
        currencySymbol={currencySymbol}              
          convertPrice={convertPrice}

      />

      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
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
        requiresID={requiresID}
        requiresPassport={requiresPassport}
        totalPassengers={totalPassengers}
        quantities={quantities}
        selectedRoomType={selectedRoomType}
        numberOfRooms={numberOfRooms}
        customizationData={customizationData}
        currency={currency}                          
        exchangeRate={exchangeRate}                   
        currencySymbol={currencySymbol}              
        convertPrice={convertPrice}
      />
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};

export default BookingRightForm;