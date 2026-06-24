import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Plane, CheckCircle, Upload, Wallet, CreditCard, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
// Import the new CSS file
import './BookingFormModal.css';

// ✅ CUSTOM DATE PICKER COMPONENT - WORKS ON ALL PLATFORMS
const CustomDatePicker = ({ value, onChange, maxDate, required, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const calendarRef = useRef(null);

  // Parse the date string (YYYY-MM-DD format)
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month: month - 1, day };
  };

  const currentDate = parseDate(selectedDate);

  // Generate year options (100 years back from maxDate)
  const maxYear = maxDate ? new Date(maxDate).getFullYear() : new Date().getFullYear();
  const minYear = maxYear - 100;
  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December'];
  
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Get days in month
  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0-6)
  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  // Format date to YYYY-MM-DD
  const formatDate = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Format display date
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  // Handle date selection
  const handleDateClick = (day) => {
    const newDate = formatDate(viewYear, viewMonth, day);
    setSelectedDate(newDate);
    onChange({ target: { value: newDate } });
    setIsOpen(false);
  };

  // Navigate months
  const previousMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Handle month/year change
  const handleMonthChange = (e) => {
    setViewMonth(parseInt(e.target.value));
  };

  const handleYearChange = (e) => {
    setViewYear(parseInt(e.target.value));
  };

  // Generate calendar days
  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="bfm-cal-day empty"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(viewYear, viewMonth, day);
      const isSelected = currentDate && 
                        currentDate.year === viewYear && 
                        currentDate.month === viewMonth && 
                        currentDate.day === day;
      
      // Check if date is in the future (past maxDate)
      const isDisabled = maxDate && new Date(dateStr) > new Date(maxDate);
      
      days.push(
        <div
          key={day}
          className={`bfm-cal-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
          onClick={() => !isDisabled && handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update view when value changes externally
  useEffect(() => {
    if (value && value !== selectedDate) {
      setSelectedDate(value);
      const parsed = parseDate(value);
      if (parsed) {
        setViewMonth(parsed.month);
        setViewYear(parsed.year);
      }
    }
  }, [value]);

  return (
    <div className="bfm-date-picker-wrapper" ref={calendarRef}>
      <div 
        className="bfm-calendar-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedDate ? 'bfm-date-value' : 'bfm-date-placeholder'}>
          {selectedDate ? formatDisplayDate(selectedDate) : (placeholder || 'Select date')}
        </span>
        <CalendarIcon size={16} className="bfm-trigger-icon" />
      </div>

      {isOpen && (
        <div className="bfm-custom-calendar">
          <div className="bfm-calendar-header">
            <button 
              type="button"
              className="bfm-cal-nav-btn" 
              onClick={previousMonth}
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="bfm-calendar-selectors">
              <select 
                className="bfm-month-select"
                value={viewMonth}
                onChange={handleMonthChange}
              >
                {monthNames.map((month, idx) => (
                  <option key={idx} value={idx}>{month}</option>
                ))}
              </select>

              <select 
                className="bfm-year-select"
                value={viewYear}
                onChange={handleYearChange}
              >
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button 
              type="button"
              className="bfm-cal-nav-btn" 
              onClick={nextMonth}
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="bfm-calendar-weekdays">
            {weekDays.map(day => (
              <div key={day} className="bfm-cal-weekday">{day}</div>
            ))}
          </div>

          <div className="bfm-calendar-days">
            {generateCalendar()}
          </div>
        </div>
      )}
    </div>
  );
};

// ✅ BOOKING COMPLETED NOTIFICATION MODAL (NO BUTTONS - AUTO CLOSE)
const BookingCompletedModal = ({ isOpen, onClose, packageName }) => {
  useEffect(() => {
    if (isOpen) {
      // Auto close and redirect after 3 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="bfm-overlay" style={{ zIndex: 10001 }}>
      <div className="bfm-modal-card" style={{ maxWidth: '400px', padding: '2rem', textAlign: 'center' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <CheckCircle size={64} color="#22c55e" strokeWidth={2} />
        </div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.5rem' }}>
          Booking Completed
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '1rem' }}>
          Your booking has been successfully confirmed!
        </p>
      </div>
    </div>
  );
};

const BookingFormModal = ({ 
  isOpen, 
  onClose, 
  pkg, 
  currentMonth, 
  selectedDate, 
  getCalculatedDates, 
  monthNames, 
  packageTotal,
  appliedPromo,
  discountAmount,
  finalPackageTotal,
  selectedFlight, 
  airfareTotal, 
  totalAmount, 
  bookingWithAirfare, 
  isInternationalFlight, 
  requiresID,
  requiresPassport,
  passengerStep, 
  totalPassengers, 
  progressPercent, 
  currentPassenger, 
  passengers, 
  handlePassengerChange, 
  handleFileUpload, 
  removeFile, 
  handleNextPassenger, 
  handleBackPassenger,
  // NEW: Payment option props
  paymentType,
  setPaymentType,
  partialAmount,
  loading,
  // ✅ NEW: Currency props
  currency = 'PHP',
  exchangeRate = 58,
  currencySymbol = '₱',
  // ✅ FIX: Added missing props referenced in handleConfirmBooking
  selectedRoomType = null,
  customizationData = null,
}) => {
  const toast = useToast();
  const [localLoading, setLocalLoading] = useState(false);
  const overlayRef = useRef(null);
  const formWrapperRef = useRef(null);

  // ✅ FIX: Forward wheel events from anywhere inside the modal card to the
  // bfm-form-wrapper scroll container. This ensures mouse wheel scrolling works
  // regardless of where inside the modal the cursor is — not just on the overlay edges.
  const handleModalWheel = (e) => {
    if (formWrapperRef.current) {
      // Only hijack if the form-wrapper itself isn't the scroll target
      // (prevents double-scroll when cursor is already over the scrollbar)
      const el = formWrapperRef.current;
      const atTop = el.scrollTop === 0 && e.deltaY < 0;
      const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight && e.deltaY > 0;
      if (!atTop && !atBottom) {
        e.preventDefault();
      }
      el.scrollTop += e.deltaY;
    }
  };

  // ============================================
  // CONFIRMATION MODAL STATE
  // ============================================
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  
  // ============================================
  // BOOKING COMPLETED NOTIFICATION MODAL STATE
  // ============================================
  const [showBookingCompletedModal, setShowBookingCompletedModal] = useState(false);

  // ✅ FORCE paymentType to 'full' when departure is today or 1 day away
  // Must be before the early return so hooks are always called consistently
  useEffect(() => {
    if (!isOpen) return;
    if (!selectedDate || !currentMonth) return;
    const departureDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      typeof selectedDate === 'number' ? selectedDate : parseInt(selectedDate, 10)
    );
    departureDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((departureDate - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 1) {
      setPaymentType('full');
    }
  }, [isOpen, selectedDate, currentMonth]);

  if (!isOpen) return null;

  // ✅ Helper function for consistent number formatting
  const formatCurrency = (amount) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0
    });
  };

  // ✅ Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if birthday hasn't occurred this year yet
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age >= 0 ? age : '';
  };

  // ✅ Handle date of birth change with auto age calculation
  const handleDateOfBirthChange = (passengerIndex, dateValue) => {
    // Update date of birth
    handlePassengerChange(passengerIndex, 'dateOfBirth', dateValue);
    
    // Auto calculate and update age
    const calculatedAge = calculateAge(dateValue);
    if (calculatedAge !== '') {
      handlePassengerChange(passengerIndex, 'age', calculatedAge.toString());
    }
  };

  // Check if this is the last passenger (payment options should show)
  const isLastPassenger = passengerStep === totalPassengers;
  const isPrimaryPassenger = passengerStep === 1;
  const finalAmount = selectedFlight ? totalAmount : finalPackageTotal;
  
  // Dynamic percentage based on airfare
  const partialPercentage = selectedFlight ? 85 : 50;
  const partialPercentageText = selectedFlight ? '85%' : '50%';

  // ✅ CHECK IF DEPARTURE IS TODAY OR TOMORROW — restrict to full payment only
  const isDepartureSoon = (() => {
    if (!selectedDate) return false;
    // selectedDate is a day number (1-31) from the current month/year context
    // Build the full departure date using currentMonth's year and month
    const departureDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      typeof selectedDate === 'number' ? selectedDate : parseInt(selectedDate, 10)
    );
    departureDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((departureDate - today) / (1000 * 60 * 60 * 24));
    // 0 = today, 1 = tomorrow → restrict to full payment
    return diffDays <= 1;
  })();

  // ============================================
  // HANDLE FORM SUBMISSION WITH CONFIRMATION
  // ============================================
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleNextPassenger(e);
  };

  // ============================================
  // CONFIRM BOOKING ACTION - NEW FLOW
  // 1. Create booking as PENDING (with files)
  // 2. Create PayMongo checkout session
  // 3. Redirect to payment
  // ============================================
  const handleConfirmBooking = async () => {
    setShowConfirmModal(false);
    setPendingSubmit(false);

    setLocalLoading(true);

    try {
      // ✅ FULL BOOKING DATA WITH ALL REQUIRED FIELDS
      // ✅ FIX: Mongoose ObjectId may be an object — always convert to string
      const resolvedPackageId =
        (pkg._id ? pkg._id.toString() : null) ||
        (pkg.id  ? pkg.id.toString()  : null) ||
        null;

      const fullBookingData = {
        packageName: pkg.name || pkg.title || pkg.packageName,
        packageId: resolvedPackageId,

        fullName: passengers[0]?.firstName + " " + (passengers[0]?.lastName || ''),
        email: passengers[0]?.email,

        totalAmount: finalAmount,
        finalPackageTotal: finalPackageTotal,
        packageTotal: finalPackageTotal,

        initialPaymentAmount: paymentType === 'full' ? finalAmount : partialAmount,
        paymentType: paymentType,

        startDate: selectedDate,
        endDate: getCalculatedDates().end.toISOString().split('T')[0],
        duration: pkg.duration,

        pax: { adult: totalPassengers, children: 0, infants: 0 },

        passengers: passengers.map((p, i) => ({
          passengerNumber: p.passengerNumber || i + 1,
          firstName: p.firstName,
          lastName: p.lastName,
          email: p.email,
          phone: p.phone,
          dateOfBirth: p.dateOfBirth,
          age: parseInt(p.age) || 0,
          gender: p.gender || '',
          address: p.address || '',
          nationality: p.nationality || 'Filipino',
          // DO NOT send File objects in JSON
        })),

        // ✅ Flight / airfare fields
        selectedFlight: selectedFlight || null,
        includesAirfare: bookingWithAirfare || false,
        airfareTotal: airfareTotal || 0,
        flightDetails: selectedFlight ? {
          airline: selectedFlight.airline?.name || selectedFlight.airline || '',
          flightNumber: selectedFlight.flightNumber || '',
          route: `${selectedFlight.departure?.iataCode || ''} → ${selectedFlight.arrival?.iataCode || ''}`,
          departureTime: selectedFlight.departure?.at || selectedFlight.departureTime || '',
          arrivalTime: selectedFlight.arrival?.at || selectedFlight.arrivalTime || '',
          isInternational: isInternationalFlight || false,
        } : null,

        // ✅ Room / hotel fields
        selectedRoomType: selectedRoomType?.type || selectedRoomType || null,
        hotelName: selectedRoomType?.hotelName || null,

        // ✅ Customization fields — mapped correctly from customizationData prop
        isCustomized: !!customizationData,
        customizedInclusions: customizationData
          ? (customizationData.inclusions || []).map(inc => ({
              id: inc.id,
              name: inc.name,
              price: inc.price || 0,
              supplierRate: inc.supplierRate || null,
              markup: inc.markup || null,
              markupType: inc.markupType || null,
              supplier: inc.supplier || null,
              destination: inc.destination || null,
              pax: inc.pax || null,
              notes: inc.notes || null,
              isOriginal: inc.isOriginal !== undefined ? inc.isOriginal : false,
              isChecked: inc.isChecked !== undefined ? inc.isChecked : true,
              source: inc.source || (inc.sellerRateId ? 'seller-rate' : 'package'),
              sellerRateId: inc.sellerRateId || null,
            }))
          : [],
        customizationAdditionalPrice: customizationData?.additionalPrice || customizationData?.customizationAdditionalPrice || 0,

        // ✅ Promo fields — extracted from appliedPromo object
        promoCode: appliedPromo?.code || null,
        promoId: appliedPromo?._id || appliedPromo?.id || null,
        discountAmount: discountAmount || 0,

        // ✅ Inclusions snapshot — carried from the package into the booking record
        // This ensures inclusions are always saved even if packageId is null
        originalInclusions: (pkg.inclusions && Array.isArray(pkg.inclusions))
          ? pkg.inclusions
          : [],

        // ✅ Itinerary snapshot — carried from the package into the booking record
        itinerary: (pkg.itinerary && Array.isArray(pkg.itinerary))
          ? pkg.itinerary.map(item => ({
              day: item.day,
              title: item.title,
              activities: item.activities || [],
            }))
          : [],

        currency: currency,
        timerExpiredAtBooking: false,
        priceType: 'discounted',
        appliedMarkup: 0,
      };

      // ✅ FormData for files + JSON
      const formData = new FormData();
      formData.append('bookingData', JSON.stringify(fullBookingData));

      passengers.forEach((passenger, index) => {
        if (passenger.idFile instanceof File) {
          formData.append(`idFile_${index}`, passenger.idFile);
        }
        if (passenger.passportFile instanceof File) {
          formData.append(`passportFile_${index}`, passenger.passportFile);
        }
      });

      const API_BASE = import.meta.env.VITE_API_URL ||
        (import.meta.env.DEV ? 'https://wanderwaveph.onrender.com' : 'https://wanderwaveph.onrender.com');
      const baseUrl = API_BASE.replace(/\/+$/, '');

      const bookingUrl = baseUrl.endsWith("/api") ? `${baseUrl}/bookings` : `${baseUrl}/api/bookings`;
      const paymentUrl = baseUrl.endsWith("/api") ? `${baseUrl}/payment/create-intent` : `${baseUrl}/api/payment/create-intent`;
      const pingUrl = baseUrl.endsWith("/api") ? baseUrl.replace(/\/api$/, '') : baseUrl;

      // ✅ STEP 1: Wake up Render server (free tier sleeps after inactivity)
      // Ping first so server is warm before the actual booking request
      toast.info('Connecting to server, please wait...');
      try {
        await axios.get(pingUrl, { timeout: 25000 });
      } catch (_) {
        // Ignore — server may still be starting up, we proceed anyway
      }

      // ✅ STEP 2: CREATE BOOKING with long timeout + 1 retry on network/timeout errors

      const postBooking = () => axios.post(bookingUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000, // 90s — enough for Render cold start
      });

      let bookingRes;
      try {
        bookingRes = await postBooking();
      } catch (firstErr) {
        const isRetryable =
          firstErr.code === 'ECONNABORTED' ||
          firstErr.message?.includes('timeout') ||
          firstErr.message?.includes('Network Error');
        if (isRetryable) {
          toast.info('Server is starting up, retrying...');
          await new Promise(r => setTimeout(r, 4000));
          bookingRes = await postBooking();
        } else {
          throw firstErr;
        }
      }

      if (!bookingRes.data?.success) {
        throw new Error(bookingRes.data?.message || 'Failed to create booking');
      }

      const bookingId = bookingRes.data.bookingId || bookingRes.data.data?._id;

      if (!bookingId) {
        throw new Error('Booking was created but no booking ID was returned. Please contact support.');
      }


      // ✅ STEP 3: CREATE PAYMENT CHECKOUT SESSION
      const amountToPay = paymentType === 'full' ? finalAmount : partialAmount;
      const paymentRes = await axios.post(paymentUrl, {
        bookingId: bookingId,
        paymentType: paymentType,
        paymentAmount: amountToPay,
      }, { timeout: 60000 });

      if (paymentRes.data.success && paymentRes.data.checkoutUrl) {
        toast.success('Redirecting to secure payment page...');
        if (paymentRes.data.checkoutSessionId) {
          sessionStorage.setItem('pendingCheckoutSessionId', paymentRes.data.checkoutSessionId);
        }
        onClose();
        window.location.href = paymentRes.data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create booking');
    } finally {
      setLocalLoading(false);
    }
  };

  // ============================================
  // CANCEL CONFIRMATION
  // ============================================
  const handleCancelConfirmation = () => {
    setShowConfirmModal(false);
    setPendingSubmit(false);
  };

  // ============================================
  // CLOSE BOOKING COMPLETED MODAL & REDIRECT
  // ============================================
  const handleCloseBookingCompleted = () => {
    setShowBookingCompletedModal(false);
    // This is where the redirect or page change happens
    onClose(); // Close the booking form modal
  };

  return (
    <div className="bfm-overlay" ref={overlayRef}>
      <div className="bfm-modal-card" onWheel={handleModalWheel}>
        
        {/* Updated Close Button with X Icon */}
        <button 
          className="bfm-close-btn" 
          onClick={onClose}
          aria-label="Close Modal"
        >
          <X size={20} strokeWidth={2.5} />
        </button>
        
        {/* PREMIUM HEADER SECTION */}
        <div className="bfm-modal-header">
          <img 
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
            alt="Wanderwave Logo" 
            className="bfm-modal-logo"
          />
          
          <h2 className="bfm-modal-title">Your Adventure Awaits!</h2>
          <p className="bfm-modal-subtitle">
            Please complete your details below. We'll secure your spot for <strong>{pkg.name}</strong> instantly.
          </p>
           
          {/* TRIP SUMMARY CARDS */}
          <div className="bfm-trip-summary">
            <div className="bfm-summary-item">
              <span className="bfm-summary-label">Travel Dates</span>
              <strong className="bfm-summary-value">
                {monthNames[currentMonth.getMonth()]} {selectedDate} - {getCalculatedDates().end.getDate()}, {currentMonth.getFullYear()}
              </strong>
              <span className="bfm-summary-subtext">
                ({parseInt(pkg.duration?.match(/(\d+)D/)?.[1] || 1)} days trip)
              </span>
            </div>
            
            <div className="bfm-summary-item">
              <span className="bfm-summary-label">Package Price</span>
              <strong className="bfm-summary-value bfm-price">
                {appliedPromo ? (
                  <>
                    <span style={{textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.85rem', marginRight: '8px'}}>
                      {currencySymbol}{formatCurrency(packageTotal)}
                    </span>
                    {currencySymbol}{formatCurrency(finalPackageTotal)}
                  </>
                ) : (
                  `${currencySymbol}${formatCurrency(packageTotal)}`
                )}
              </strong>
              {appliedPromo && (
                <span className="bfm-summary-subtext" style={{color: '#10b981', fontWeight: '600'}}>
                  {appliedPromo.code} applied (-{currencySymbol}{formatCurrency(discountAmount)})
                </span>
              )}
            </div>
            
            {selectedFlight && (
              <>
                <div className="bfm-summary-item">
                  <span className="bfm-summary-label">
                    <Plane size={12} style={{display:'inline', marginRight:'4px'}}/>
                    Airfare ({selectedFlight.airline.name})
                  </span>
                  <strong className="bfm-summary-value bfm-accent-color">
                    {currencySymbol}{formatCurrency(airfareTotal)}
                  </strong>
                  <span className="bfm-summary-subtext">
                    {selectedFlight.departure.iataCode} → {selectedFlight.arrival.iataCode}
                  </span>
                </div>
                
                <div className="bfm-summary-item bfm-grand-total">
                  <span className="bfm-summary-label">Grand Total</span>
                  <strong className="bfm-summary-value bfm-grand-total-value">
                    {currencySymbol}{formatCurrency(totalAmount)}
                  </strong>
                </div>
              </>
            )}
          </div>

          {/* DOCUMENT REQUIREMENTS */}
          {bookingWithAirfare && (
            <div className={`bfm-doc-req-box ${isInternationalFlight ? '' : 'bfm-domestic'}`}>
              <strong>Required Documents:</strong>
              {isInternationalFlight ? ' Valid Passport for all passengers' : ' Valid ID for all passengers'}
            </div>
          )}
        </div>

        {/* SCROLLABLE FORM CONTENT */}
        <div className="bfm-form-wrapper" ref={formWrapperRef}>
          
          {/* PROGRESS SECTION */}
          <div className="bfm-progress-section">
            <div className="bfm-progress-header">
              <span className="bfm-progress-label">
                Passenger {passengerStep} of {totalPassengers}
                {passengerStep === 1 && <span className="bfm-primary-badge">Primary</span>}
              </span>
              <span className="bfm-progress-percent">{progressPercent}% Complete</span>
            </div>
            <div className="bfm-progress-bar-container">
              <div className="bfm-progress-bar-fill" style={{width: `${progressPercent}%`}} />
            </div>
          </div>

          <form className="bfm-form" onSubmit={handleFormSubmit}>
            <div className="bfm-form-section-header">
              <span className="bfm-passenger-badge">Passenger {passengerStep}</span>
              {isPrimaryPassenger
                ? <span className="bfm-primary-contact-label">Primary Contact</span>
                : <span className="bfm-optional-badge">Details Optional</span>
              }
            </div>

            {!isPrimaryPassenger && (
              <p className="bfm-optional-note">
                Additional passenger details are optional. You may fill them in now or skip to continue.
              </p>
            )}

            {/* FORM GRID - Responsive via CSS */}
            <div className="bfm-form-grid">

              <div className="bfm-form-group">
                <label>First Name {isPrimaryPassenger && <span className="bfm-required">*</span>}</label>
                <input
                  required={isPrimaryPassenger}
                  type="text"
                  value={currentPassenger.firstName}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'firstName', e.target.value)}
                  placeholder="Juan"
                />
              </div>

              <div className="bfm-form-group">
                <label>Last Name {isPrimaryPassenger && <span className="bfm-required">*</span>}</label>
                <input
                  required={isPrimaryPassenger}
                  type="text"
                  value={currentPassenger.lastName}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'lastName', e.target.value)}
                  placeholder="Dela Cruz"
                />
              </div>

              <div className="bfm-form-group">
                <label>Email Address {isPrimaryPassenger && <span className="bfm-required">*</span>}</label>
                <input
                  required={isPrimaryPassenger}
                  type="email"
                  value={currentPassenger.email}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'email', e.target.value)}
                  placeholder="juan@example.com"
                />
              </div>

              <div className="bfm-form-group">
                <label>Phone Number {isPrimaryPassenger && <span className="bfm-required">*</span>}</label>
                <input
                  required={isPrimaryPassenger}
                  type="tel"
                  value={currentPassenger.phone}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'phone', e.target.value)}
                  placeholder="0917 123 4567"
                />
              </div>

              {/* ✅ CUSTOM DATE PICKER - WITH AUTO AGE CALCULATION */}
              <div className="bfm-form-group">
                <label>
                  Date of Birth {isPrimaryPassenger && <span className="bfm-required">*</span>}
                  {isPrimaryPassenger && <span className="bfm-age-hint">(Must be 18+)</span>}
                </label>
                <CustomDatePicker
                  value={currentPassenger.dateOfBirth}
                  onChange={(e) => handleDateOfBirthChange(passengerStep - 1, e.target.value)}
                  maxDate={new Date().toISOString().split('T')[0]}
                  required={isPrimaryPassenger}
                  placeholder="Select birth date"
                />
              </div>

              <div className="bfm-form-group">
                <label>Age {isPrimaryPassenger && <span className="bfm-required">*</span>}</label>
                <input
                  required={isPrimaryPassenger}
                  type="number"
                  value={currentPassenger.age}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'age', e.target.value)}
                  placeholder="Auto-calculated"
                  min="0"
                  max="120"
                  readOnly
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
              </div>

              <div className="bfm-form-group">
                <label>Gender {isPrimaryPassenger && <span className="bfm-required">*</span>}</label>
                <select
                  required={isPrimaryPassenger}
                  value={currentPassenger.gender}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'gender', e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="bfm-form-group">
                <label>Nationality {isPrimaryPassenger && <span className="bfm-required">*</span>}</label>
                <input
                  required={isPrimaryPassenger}
                  type="text"
                  value={currentPassenger.nationality}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'nationality', e.target.value)}
                  placeholder="Filipino"
                />
              </div>

              <div className="bfm-form-group bfm-full-width">
                <label>Complete Address {isPrimaryPassenger && <span className="bfm-required">*</span>}</label>
                <input
                  required={isPrimaryPassenger}
                  type="text"
                  value={currentPassenger.address}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'address', e.target.value)}
                  placeholder="123 Main St, Makati City, Metro Manila"
                />
              </div>

              {/* ID UPLOAD */}
              {bookingWithAirfare && requiresID && (
                <div className="bfm-form-group bfm-full-width">
                  <label>
                    Upload Valid ID {isPrimaryPassenger && <span className="bfm-required">*</span>}
                    <span className="bfm-upload-hint">
                      (Driver's License, UMID, SSS, Postal ID, etc.)
                    </span>
                  </label>
                  
                  {currentPassenger.idFileName ? (
                    <div className="bfm-file-uploaded">
                      <div className="bfm-file-info">
                        <CheckCircle size={18} color="#22c55e"/>
                        <span className="bfm-file-name">{currentPassenger.idFileName}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(passengerStep - 1, 'id')}
                        className="bfm-remove-file-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="bfm-file-upload-box">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(passengerStep - 1, 'id', e)}
                        id={`id-upload-${passengerStep}`}
                        style={{display: 'none'}}
                      />
                      <label htmlFor={`id-upload-${passengerStep}`} className="bfm-file-upload-label">
                        <Upload size={28} color="#94a3b8"/>
                        <span className="bfm-upload-text">Click to upload ID</span>
                        <span className="bfm-upload-subtext">PNG, JPG or PDF (Max 5MB)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

              {/* PASSPORT UPLOAD */}
              {bookingWithAirfare && requiresPassport && (
                <div className="bfm-form-group bfm-full-width">
                  <label>
                    Upload Passport {isPrimaryPassenger && <span className="bfm-required">*</span>}
                    <span className="bfm-upload-hint">
                      (Bio-data page with photo)
                    </span>
                  </label>
                  
                  {currentPassenger.passportFileName ? (
                    <div className="bfm-file-uploaded">
                      <div className="bfm-file-info">
                        <CheckCircle size={18} color="#22c55e"/>
                        <span className="bfm-file-name">{currentPassenger.passportFileName}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => removeFile(passengerStep - 1, 'passport')}
                        className="bfm-remove-file-btn"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="bfm-file-upload-box">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(passengerStep - 1, 'passport', e)}
                        id={`passport-upload-${passengerStep}`}
                        style={{display: 'none'}}
                      />
                      <label htmlFor={`passport-upload-${passengerStep}`} className="bfm-file-upload-label">
                        <Upload size={28} color="#94a3b8"/>
                        <span className="bfm-upload-text">Click to upload Passport</span>
                        <span className="bfm-upload-subtext">PNG, JPG or PDF (Max 5MB)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* ✅ PAYMENT OPTIONS - Show only on last passenger */}
            {isLastPassenger && (
              <div className="tbfm-payment-section-wrapper" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #e2e8f0' }}>

                <div className="tbfm-section-header" style={{ marginTop: '8px' }}>
                  <CreditCard size={16} className="tbfm-section-icon" />
                  <span>Payment Option</span>
                </div>
                <div className="tbfm-section-divider" />

                {isDepartureSoon ? (
                  /* ── Restricted: only full payment ── */
                  <div className="tbfm-restricted-payment-section">
                    <div className="tbfm-restricted-banner">
                      <span className="tbfm-restricted-banner-icon">⚡</span>
                      <div className="tbfm-restricted-banner-text">
                        <strong>Full Payment Required</strong>
                        <span>Partial payment is unavailable for departure dates of <strong>today</strong> or <strong>tomorrow</strong>.</span>
                      </div>
                    </div>
                    <div className="tbfm-payment-card active tbfm-payment-card-solo" onClick={() => setPaymentType('full')}>
                      <div className="tbfm-solo-card-inner">
                        <div className="tbfm-solo-card-left">
                          <div className="tbfm-payment-card-header">
                            <div className="tbfm-payment-radio">
                              <div className="tbfm-radio-dot active" />
                            </div>
                            <div className="tbfm-payment-card-title">
                              <CreditCard size={15} className="tbfm-card-icon" />
                              <span>Pay in Full</span>
                              <span className="tbfm-badge tbfm-badge-popular">Most Popular</span>
                            </div>
                          </div>
                          <div className="tbfm-payment-card-body">
                            <p className="tbfm-payment-description">Complete payment now and secure your booking instantly.</p>
                            <ul className="tbfm-payment-benefits">
                              <li>✓ Instant confirmation</li>
                              <li>✓ No further payments needed</li>
                              <li>✓ Priority processing</li>
                            </ul>
                          </div>
                        </div>
                        <div className="tbfm-solo-card-right">
                          <div className="tbfm-payment-amount tbfm-solo-amount">
                            {currencySymbol}{formatCurrency(finalAmount)}
                          </div>
                          <span className="tbfm-solo-total-label">Total Amount</span>
                        </div>
                      </div>
                    </div>
                  </div>

                ) : (
                  /* ── Normal: full + partial side by side ── */
                  <div className="tbfm-payment-options">
                    {/* Full Payment */}
                    <div
                      className={`tbfm-payment-card ${paymentType === 'full' ? 'active' : ''}`}
                      onClick={() => setPaymentType('full')}
                    >
                      <div className="tbfm-payment-card-header">
                        <div className="tbfm-payment-radio">
                          <div className={`tbfm-radio-dot ${paymentType === 'full' ? 'active' : ''}`} />
                        </div>
                        <div className="tbfm-payment-card-title">
                          <CreditCard size={15} className="tbfm-card-icon" />
                          <span>Pay in Full</span>
                          <span className="tbfm-badge tbfm-badge-popular">Most Popular</span>
                        </div>
                      </div>
                      <div className="tbfm-payment-card-body">
                        <div className="tbfm-payment-amount">
                          {currencySymbol}{formatCurrency(finalAmount)}
                        </div>
                        <p className="tbfm-payment-description">Complete payment now and secure your booking</p>
                        <ul className="tbfm-payment-benefits">
                          <li>Instant confirmation</li>
                          <li>No further payments needed</li>
                          <li>Priority processing</li>
                        </ul>
                      </div>
                    </div>

                    {/* Partial Payment */}
                    <div
                      className={`tbfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
                      onClick={() => setPaymentType('partial')}
                    >
                      <div className="tbfm-payment-card-header">
                        <div className="tbfm-payment-radio">
                          <div className={`tbfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                        </div>
                        <div className="tbfm-payment-card-title">
                          <Wallet size={15} className="tbfm-card-icon" />
                          <span>Partial Payment</span>
                          <span className="tbfm-badge tbfm-badge-flexible">Flexible</span>
                        </div>
                      </div>
                      <div className="tbfm-payment-card-body">
                        <div className="tbfm-payment-amount">
                          {currencySymbol}{formatCurrency(partialAmount)}
                          <span className="tbfm-payment-percentage">{partialPercentageText} Down Payment</span>
                        </div>
                        <p className="tbfm-payment-description">Pay {partialPercentageText} now, remaining balance before departure</p>
                        <div className="tbfm-payment-breakdown">
                          <div className="tbfm-breakdown-row">
                            <span>Now ({partialPercentageText}):</span>
                            <strong>{currencySymbol}{formatCurrency(partialAmount)}</strong>
                          </div>
                          <div className="tbfm-breakdown-row">
                            <span>Later ({100 - partialPercentage}%):</span>
                            <strong>{currencySymbol}{formatCurrency(finalAmount - partialAmount)}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="tbfm-payment-summary">
                  <div className="tbfm-summary-row">
                    <span>Amount to pay now:</span>
                    <strong className="tbfm-amount-highlight">
                      {currencySymbol}{formatCurrency(paymentType === 'full' ? finalAmount : partialAmount)}
                    </strong>
                  </div>
                  {paymentType === 'partial' && !isDepartureSoon && (
                    <div className="tbfm-summary-row tbfm-remaining">
                      <span>Remaining balance:</span>
                      <span>{currencySymbol}{formatCurrency(finalAmount - partialAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="bfm-actions">
              {passengerStep > 1 && (
                <button 
                  type="button" 
                  onClick={handleBackPassenger}
                  className="bfm-back-btn"
                >
                  Back
                </button>
              )}
              
              <button 
                type="submit" 
                disabled={localLoading || loading}
                className="bfm-submit-btn"
                style={{ flex: passengerStep === 1 ? '1' : '2' }}
              >
                {localLoading || loading ? 'PROCESSING...' : 
                 passengerStep === totalPassengers ? 'CONFIRM BOOKING' : 
                 `NEXT: PASSENGER ${passengerStep + 1}`}
              </button>
            </div>

          </form>
        </div>

      </div>

      {/* ============================================
          CONFIRMATION MODAL FOR BOOKING
          ============================================ */}
      <CustomConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Your Booking"
        message={`Are you sure you want to confirm this booking for ${pkg.name}? You will be redirected to the payment page.`}
        onConfirm={handleConfirmBooking}
        onCancel={handleCancelConfirmation}
        type="primary"
      />

      {/* ============================================
          BOOKING COMPLETED NOTIFICATION MODAL (NO BUTTONS)
          ============================================ */}
      <BookingCompletedModal
        isOpen={showBookingCompletedModal}
        onClose={handleCloseBookingCompleted}
        packageName={pkg.name}
      />
    </div>
  );
};

export default BookingFormModal;