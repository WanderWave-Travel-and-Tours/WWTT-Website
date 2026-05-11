import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Plane, CheckCircle, Upload, Wallet, CreditCard, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
// Import the same CSS files as BookingFormModal
import '../packageDeals/BookingFormModal.css';
import '../packageDeals/PaymentOption.css';
import './TourBookingFormModal.css';

// ✅ CUSTOM DATE PICKER COMPONENT - MODAL STYLE (matches Wanderwave UI)
const CustomDatePicker = ({ value, onChange, maxDate, required, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split('-').map(Number);
    return { year, month: month - 1, day };
  };

  const currentDate = parseDate(selectedDate);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

  const weekDays = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const formatDate = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${monthNames[month - 1]} ${day}, ${year}`;
  };

  const today = new Date();
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());

  const handleDateClick = (day) => {
    const newDate = formatDate(viewYear, viewMonth, day);
    setSelectedDate(newDate);
    onChange({ target: { value: newDate } });
    setIsOpen(false);
  };

  const previousMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const generateCalendar = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="cdp-cal-day empty"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(viewYear, viewMonth, day);
      const isSelected = currentDate &&
                        currentDate.year === viewYear &&
                        currentDate.month === viewMonth &&
                        currentDate.day === day;
      const isToday = dateStr === todayStr;
      const isDisabled = maxDate && new Date(dateStr) > new Date(maxDate);

      days.push(
        <div
          key={day}
          className={`cdp-cal-day ${isSelected ? 'selected' : ''} ${isToday && !isSelected ? 'today' : ''} ${isDisabled ? 'disabled' : ''}`}
          onClick={() => !isDisabled && handleDateClick(day)}
        >
          {day}
        </div>
      );
    }

    return days;
  };

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (value && value !== selectedDate) {
      setSelectedDate(value);
      const parsed = parseDate(value);
      if (parsed) { setViewMonth(parsed.month); setViewYear(parsed.year); }
    }
  }, [value]);

  return (
    <div className="cdp-wrapper">
      {/* Trigger */}
      <div className="cdp-trigger" onClick={() => setIsOpen(true)}>
        <span className={selectedDate ? 'cdp-date-value' : 'cdp-date-placeholder'}>
          {selectedDate ? formatDisplayDate(selectedDate) : (placeholder || 'Select date')}
        </span>
        <CalendarIcon size={16} className="cdp-trigger-icon" />
      </div>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="cdp-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setIsOpen(false); }}>
          <div className="cdp-modal">
            {/* Modal Header */}
            <div className="cdp-modal-header">
              <div className="cdp-modal-title-row">
                <CalendarIcon size={17} className="cdp-header-icon" />
                <span className="cdp-modal-title">Select Date</span>
              </div>
              <button type="button" className="cdp-close-btn" onClick={() => setIsOpen(false)} aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {/* Month/Year Navigation */}
            <div className="cdp-nav-row">
              <button type="button" className="cdp-nav-btn" onClick={previousMonth} aria-label="Previous month">
                <ChevronLeft size={16} />
              </button>
              <span className="cdp-month-year-label">{monthNames[viewMonth]} {viewYear}</span>
              <button type="button" className="cdp-nav-btn" onClick={nextMonth} aria-label="Next month">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="cdp-weekdays">
              {weekDays.map(day => <div key={day} className="cdp-weekday">{day}</div>)}
            </div>

            {/* Calendar Days */}
            <div className="cdp-days-grid">{generateCalendar()}</div>

            {/* Footer */}
            <div className="cdp-footer">
              <button type="button" className="cdp-cancel-btn" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
            </div>
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
      const timer = setTimeout(() => onClose(), 3000);
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

const TourBookingFormModal = ({
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
  // Payment option props
  paymentType,
  setPaymentType,
  partialAmount,
  loading,
  // ✅ Currency props
  currency = 'PHP',
  exchangeRate = 58,
  currencySymbol = '₱',
  // ✅ Additional props
  selectedRoomType = null,
  customizationData = null,
}) => {
  const toast = useToast();
  const [localLoading, setLocalLoading] = useState(false);
  const overlayRef = useRef(null);
  const formWrapperRef = useRef(null);

  const handleOverlayWheel = (e) => {
    if (formWrapperRef.current) {
      formWrapperRef.current.scrollTop += e.deltaY;
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

  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 0 ? age : '';
  };

  const handleDateOfBirthChange = (passengerIndex, dateValue) => {
    handlePassengerChange(passengerIndex, 'dateOfBirth', dateValue);
    const calculatedAge = calculateAge(dateValue);
    if (calculatedAge !== '') {
      handlePassengerChange(passengerIndex, 'age', calculatedAge.toString());
    }
  };

  const handleNameChange = (passengerIndex, field, value) => {
    // Allow only letters, spaces, hyphens, and apostrophes (no numbers or signs)
    const filtered = value.replace(/[^a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]/g, '');
    handlePassengerChange(passengerIndex, field, filtered);
  };

  const handlePhoneChange = (passengerIndex, value) => {
    // Allow only digits, no letters, signs, or negatives
    const filtered = value.replace(/[^0-9]/g, '');
    // Enforce max 20 digits
    if (filtered.length <= 20) {
      handlePassengerChange(passengerIndex, 'phone', filtered);
    }
  };

  const isLastPassenger = passengerStep === totalPassengers;
  const finalAmount = selectedFlight ? totalAmount : finalPackageTotal;

  const partialPercentage = selectedFlight ? 85 : 50;
  const partialPercentageText = selectedFlight ? '85%' : '50%';

  // ── Hide partial payment for today/tomorrow travel dates ─────────────────
  const isPartialPaymentAllowed = (() => {
    if (!selectedDate || !currentMonth) return true;
    const travelDate = new Date(
      currentMonth.getFullYear
        ? currentMonth.getFullYear()
        : new Date(currentMonth).getFullYear(),
      currentMonth.getFullYear
        ? currentMonth.getMonth()
        : new Date(currentMonth).getMonth(),
      typeof selectedDate === 'number' ? selectedDate : new Date(selectedDate).getDate()
    );
    travelDate.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    return travelDate > tomorrow;
  })();

  // ============================================
  // HANDLE FORM SUBMISSION WITH CONFIRMATION
  // ============================================
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleNextPassenger(e);
  };

  // ============================================
  // CONFIRM TOUR BOOKING ACTION (UPDATED - GAYAHIN SA BOOKINGFORMMODAL)
  // 1. Create tour booking as PENDING
  // 2. Create PayMongo checkout session
  // 3. Fire abandoned booking GHL webhook
  // 4. Redirect to payment
  // ============================================
  const handleConfirmBooking = async () => {
    setShowConfirmModal(false);
    setPendingSubmit(false);
    setLocalLoading(true);

    try {
      // ✅ FULL TOUR BOOKING DATA (ginaya ang structure ng BookingFormModal)
      const fullBookingData = {
        packageName: pkg.name || pkg.title || pkg.packageName,
        tourId: pkg._id || pkg.id,
        packageId: pkg._id || pkg.id,

        sellerPrice: pkg.sellerPrice || 0,
        markup: pkg.markup || 0,
        price: finalPackageTotal,

        fullName: passengers[0]?.firstName + ' ' + (passengers[0]?.lastName || ''),
        email: passengers[0]?.email,

        totalAmount: finalAmount,
        finalPackageTotal: finalPackageTotal,
        packageTotal: finalPackageTotal,
        packagePrice: finalPackageTotal,

        initialPaymentAmount: paymentType === 'full' ? finalAmount : partialAmount,
        remainingBalance: paymentType === 'partial' ? finalAmount - partialAmount : 0,
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
        })),

        // Flight / airfare fields (ginaya ang style ng BookingFormModal)
        includesAirfare: bookingWithAirfare || false,
        airfareTotal: airfareTotal || 0,
        flightDetails: selectedFlight ? {
          airline: selectedFlight.airline?.name || selectedFlight.airline || '',
          flightNumber: selectedFlight.flightNumber || 'N/A',
          departure: selectedFlight.departure || null,
          arrival: selectedFlight.arrival || null,
          duration: selectedFlight.duration || null,
          stops: selectedFlight.stops || 0,
          price: airfareTotal || 0,
          isInternational: isInternationalFlight || false,
        } : null,

        // Promo fields
        promoCode: appliedPromo?.code || null,
        promoId: appliedPromo?._id || appliedPromo?.id || null,
        discountAmount: discountAmount || 0,

        bookingSource: 'online',
        timerExpiredAtBooking: false,
        priceType: 'discounted',
        appliedMarkup: 0,
        originalPackagePrice: pkg.sellerPrice || finalPackageTotal,
        isCustomized: false,
        customizedInclusions: [],
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

      // ✅ Tour-specific endpoints
      const bookingUrl  = baseUrl.endsWith('/api') ? `${baseUrl}/tour-bookings`           : `${baseUrl}/api/tour-bookings`;
      const paymentUrl  = baseUrl.endsWith('/api') ? `${baseUrl}/payment/create-intent`    : `${baseUrl}/api/payment/create-intent`;
      const abandonedUrl = baseUrl.endsWith('/api') ? `${baseUrl}/tour-bookings/abandoned` : `${baseUrl}/api/tour-bookings/abandoned`;
      const pingUrl     = baseUrl.endsWith('/api') ? baseUrl.replace(/\/api$/, '')         : baseUrl;

      // ✅ STEP 1: Wake up Render server (same as BookingFormModal)
      console.log('Waking up server...');
      toast.info('Connecting to server, please wait...');
      try {
        await axios.get(pingUrl, { timeout: 25000 });
      } catch (_) {}

      // ✅ STEP 2: CREATE TOUR BOOKING (PENDING) with retry (same as BookingFormModal)
      console.log('Creating tour booking as PENDING...');

      const postBooking = () => axios.post(bookingUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000,
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
          console.warn('First attempt failed, retrying once...');
          toast.info('Server is starting up, retrying...');
          await new Promise(r => setTimeout(r, 4000));
          bookingRes = await postBooking();
        } else {
          throw firstErr;
        }
      }

      if (!bookingRes.data?.success) {
        throw new Error(bookingRes.data?.message || 'Failed to create tour booking');
      }

      const bookingId = bookingRes.data.bookingId || bookingRes.data.data?._id;

      if (!bookingId) {
        throw new Error('Tour booking was created but no booking ID was returned. Please contact support.');
      }

      console.log('✅ Tour booking created (pending) → ID:', bookingId);

      // ✅ STEP 3: CREATE PAYMENT CHECKOUT SESSION
      const amountToPay = paymentType === 'full' ? finalAmount : partialAmount;
      const paymentRes = await axios.post(paymentUrl, {
        bookingId: bookingId,
        bookingType: 'tour',
        paymentType: paymentType,
        paymentAmount: amountToPay,
      }, { timeout: 60000 });

      if (!paymentRes.data.success || !paymentRes.data.checkoutUrl) {
        throw new Error('No checkout URL returned');
      }

      const { checkoutUrl, checkoutSessionId } = paymentRes.data;

      // ✅ STEP 4: FIRE ABANDONED BOOKING GHL WEBHOOK (ITO YUNG NAWAWALA KANINA)
      // Gayahin ang pattern ng BookingFormModal + extra safety
      try {
        await axios.post(abandonedUrl, {
          existingBookingId: bookingId,
          checkoutUrl: checkoutUrl,
          email: fullBookingData.email,
          fullName: fullBookingData.fullName,
          packageName: fullBookingData.packageName,
          totalAmount: fullBookingData.totalAmount,
          startDate: fullBookingData.startDate,
          endDate: fullBookingData.endDate,
          pax: fullBookingData.pax?.adult || totalPassengers,
          paymentType: paymentType === 'full' ? 'Full Payment' : 'Partial Payment',
        }, { timeout: 10000 });
        console.log('✅ Abandoned tour booking tracking fired for ID:', bookingId);
      } catch (abandonedErr) {
        console.warn('⚠️ Abandoned tour booking tracking failed (non-fatal):', abandonedErr.message);
      }

      // ✅ STEP 5: REDIRECT TO PAYMENT
      toast.success('Redirecting to secure payment page...');
      if (checkoutSessionId) {
        sessionStorage.setItem('pendingCheckoutSessionId', checkoutSessionId);
      }
      onClose();
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Tour Booking/Payment creation error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create tour booking');
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
    onClose();
  };

  return (
    <div className="bfm-overlay" ref={overlayRef} onWheel={handleOverlayWheel}>
      <div className="bfm-modal-card">

        {/* Close Button */}
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
                    <span style={{ textDecoration: 'line-through', color: '#9ca3af', fontSize: '0.85rem', marginRight: '8px' }}>
                      {currencySymbol}{formatCurrency(packageTotal)}
                    </span>
                    {currencySymbol}{formatCurrency(finalPackageTotal)}
                  </>
                ) : (
                  `${currencySymbol}${formatCurrency(packageTotal)}`
                )}
              </strong>
              {appliedPromo && (
                <span className="bfm-summary-subtext" style={{ color: '#10b981', fontWeight: '600' }}>
                  {appliedPromo.code} applied (-{currencySymbol}{formatCurrency(discountAmount)})
                </span>
              )}
            </div>

            {selectedFlight && (
              <>
                <div className="bfm-summary-item">
                  <span className="bfm-summary-label">
                    <Plane size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Airfare ({selectedFlight.airline.name})
                  </span>
                  <strong className="bfm-summary-value bfm-accent-color">
                    {currencySymbol}{formatCurrency(airfareTotal)}
                  </strong>
                  <span className="bfm-summary-subtext">
                    {selectedFlight.departure?.iataCode} → {selectedFlight.arrival?.iataCode}
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
              <div className="bfm-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <form className="bfm-form" onSubmit={handleFormSubmit}>
            <div className="bfm-form-section-header">
              <span className="bfm-passenger-badge">Passenger {passengerStep}</span>
              {passengerStep === 1 && <span className="bfm-primary-contact-label">Primary Contact</span>}
            </div>

            {/* FORM GRID */}
            <div className="bfm-form-grid">

              <div className="bfm-form-group">
                <label>First Name <span className="bfm-required">*</span></label>
                <input
                  required
                  type="text"
                  value={currentPassenger.firstName}
                  onChange={(e) => handleNameChange(passengerStep - 1, 'firstName', e.target.value)}
                  placeholder="Juan"
                  pattern="[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]+"
                  title="First name should only contain letters"
                />
              </div>

              <div className="bfm-form-group">
                <label>Last Name <span className="bfm-required">*</span></label>
                <input
                  required
                  type="text"
                  value={currentPassenger.lastName}
                  onChange={(e) => handleNameChange(passengerStep - 1, 'lastName', e.target.value)}
                  placeholder="Dela Cruz"
                  pattern="[a-zA-ZÀ-ÖØ-öø-ÿ\s'\-]+"
                  title="Last name should only contain letters"
                />
              </div>

              <div className="bfm-form-group">
                <label>Email Address <span className="bfm-required">*</span></label>
                <input
                  required
                  type="email"
                  value={currentPassenger.email}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'email', e.target.value)}
                  placeholder="juan@example.com"
                />
              </div>

              <div className="bfm-form-group">
                <label>Phone Number <span className="bfm-required">*</span></label>
                <input
                  required
                  type="tel"
                  value={currentPassenger.phone}
                  onChange={(e) => handlePhoneChange(passengerStep - 1, e.target.value)}
                  placeholder="0917 123 4567"
                  pattern="[0-9]{8,20}"
                  minLength={8}
                  maxLength={20}
                  title="Phone number must be 8–20 digits, numbers only"
                />
              </div>

              {/* CUSTOM DATE PICKER */}
              <div className="bfm-form-group">
                <label>Date of Birth <span className="bfm-required">*</span></label>
                <CustomDatePicker
                  value={currentPassenger.dateOfBirth}
                  onChange={(e) => handleDateOfBirthChange(passengerStep - 1, e.target.value)}
                  maxDate={new Date().toISOString().split('T')[0]}
                  required
                  placeholder="Select birth date"
                />
              </div>

              <div className="bfm-form-group">
                <label>Age <span className="bfm-required">*</span></label>
                <input
                  required
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
                <label>Gender <span className="bfm-required">*</span></label>
                <select
                  required
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
                <label>Nationality <span className="bfm-required">*</span></label>
                <input
                  required
                  type="text"
                  value={currentPassenger.nationality}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'nationality', e.target.value)}
                  placeholder="Filipino"
                />
              </div>

              <div className="bfm-form-group bfm-full-width">
                <label>Complete Address <span className="bfm-required">*</span></label>
                <input
                  required
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
                    Upload Valid ID <span className="bfm-required">*</span>
                    <span className="bfm-upload-hint">
                      (Driver's License, UMID, SSS, Postal ID, etc.)
                    </span>
                  </label>

                  {currentPassenger.idFileName ? (
                    <div className="bfm-file-uploaded">
                      <div className="bfm-file-info">
                        <CheckCircle size={18} color="#22c55e" />
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
                        style={{ display: 'none' }}
                      />
                      <label htmlFor={`id-upload-${passengerStep}`} className="bfm-file-upload-label">
                        <Upload size={28} color="#94a3b8" />
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
                    Upload Passport <span className="bfm-required">*</span>
                    <span className="bfm-upload-hint">
                      (Bio-data page with photo)
                    </span>
                  </label>

                  {currentPassenger.passportFileName ? (
                    <div className="bfm-file-uploaded">
                      <div className="bfm-file-info">
                        <CheckCircle size={18} color="#22c55e" />
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
                        style={{ display: 'none' }}
                      />
                      <label htmlFor={`passport-upload-${passengerStep}`} className="bfm-file-upload-label">
                        <Upload size={28} color="#94a3b8" />
                        <span className="bfm-upload-text">Click to upload Passport</span>
                        <span className="bfm-upload-subtext">PNG, JPG or PDF (Max 5MB)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* PAYMENT OPTIONS */}
            {isLastPassenger && (
              <div className="bfm-payment-section">
                <div className="bfm-payment-header">
                  <Wallet size={18} />
                  <h3>Select Payment Option</h3>
                </div>

                {/* ── Full Payment Required Notice (shown only when partial is not allowed) ── */}
                {!isPartialPaymentAllowed && (
                  <div className="bfm-full-payment-notice">
                    <div className="bfm-full-payment-notice-title">
                      <span className="bfm-lightning-icon">⚡</span> Full Payment Required
                    </div>
                    <div className="bfm-full-payment-notice-text">
                      Partial payment is unavailable for travel dates of{' '}
                      <strong>today</strong> or <strong>tomorrow</strong>.
                    </div>
                  </div>
                )}

                <div className={`bfm-payment-options${!isPartialPaymentAllowed ? ' bfm-payment-options-single' : ''}`}>

                  {/* ── Pay in Full card ── */}
                  <div
                    className={`bfm-payment-card ${paymentType === 'full' ? 'active' : ''}${!isPartialPaymentAllowed ? ' bfm-payment-card-full-only' : ''}`}
                    onClick={() => setPaymentType('full')}
                  >
                    {!isPartialPaymentAllowed ? (
                      /* New split-header layout when only full payment is available */
                      <>
                        <div className="bfm-payment-card-header-split">
                          <div className="bfm-payment-card-header-left">
                            <div className="bfm-payment-radio">
                              <div className={`bfm-radio-dot ${paymentType === 'full' ? 'active' : ''}`} />
                            </div>
                            <div className="bfm-payment-card-title">
                              <CreditCard size={16} />
                              <span>Pay in Full</span>
                              <span className="bfm-recommended-badge">Most Popular</span>
                            </div>
                          </div>
                          <div className="bfm-payment-card-amount-right">
                            <span className="bfm-payment-amount-right-value">{currencySymbol}{formatCurrency(finalAmount)}</span>
                            <span className="bfm-payment-amount-right-label">TOTAL AMOUNT</span>
                          </div>
                        </div>
                        <div className="bfm-payment-card-body bfm-payment-card-body-full">
                          <div className="bfm-payment-description">
                            Complete payment now and secure your booking instantly.
                          </div>
                          <ul className="bfm-payment-benefits bfm-payment-benefits-check">
                            <li>Instant confirmation</li>
                            <li>No further payments needed</li>
                            <li>Priority processing</li>
                          </ul>
                        </div>
                      </>
                    ) : (
                      /* Original layout when both options are available */
                      <>
                        <div className="bfm-payment-card-header">
                          <div className="bfm-payment-radio">
                            <div className={`bfm-radio-dot ${paymentType === 'full' ? 'active' : ''}`} />
                          </div>
                          <div className="bfm-payment-card-title">
                            <CreditCard size={16} />
                            <span>Pay in Full</span>
                            <span className="bfm-recommended-badge">Most Popular</span>
                          </div>
                        </div>
                        <div className="bfm-payment-card-body">
                          <div className="bfm-payment-amount">
                            {currencySymbol}{formatCurrency(finalAmount)}
                          </div>
                          <div className="bfm-payment-description">
                            Complete payment now and secure your booking
                          </div>
                          <ul className="bfm-payment-benefits">
                            <li>Instant confirmation</li>
                            <li>No further payments needed</li>
                            <li>Priority processing</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>

                  {/* ── Partial Payment card (only shown when allowed) ── */}
                  {isPartialPaymentAllowed && (
                  <div
                    className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
                    onClick={() => setPaymentType('partial')}
                  >
                    <div className="bfm-payment-card-header">
                      <div className="bfm-payment-radio">
                        <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                      </div>
                      <div className="bfm-payment-card-title">
                        <Wallet size={16} />
                        <span>Partial Payment</span>
                        <span className="bfm-flexible-badge">Flexible</span>
                      </div>
                    </div>
                    <div className="bfm-payment-card-body">
                      <div className="bfm-payment-amount">
                        {currencySymbol}{formatCurrency(partialAmount)}
                        <span className="bfm-payment-percentage">{partialPercentageText} Down Payment</span>
                      </div>
                      <div className="bfm-payment-description">
                        Pay {partialPercentageText} now, remaining balance before departure
                      </div>
                      <div className="bfm-payment-breakdown">
                        <div className="bfm-breakdown-row">
                          <span>Now ({partialPercentageText}):</span>
                          <strong>{currencySymbol}{formatCurrency(partialAmount)}</strong>
                        </div>
                        <div className="bfm-breakdown-row">
                          <span>Later ({100 - partialPercentage}%):</span>
                          <strong>{currencySymbol}{formatCurrency(finalAmount - partialAmount)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                  )}
                </div>

                <div className="bfm-payment-summary">
                  <div className="bfm-summary-row">
                    <span>Amount to pay now:</span>
                    <strong className="bfm-amount-highlight">
                      {currencySymbol}{formatCurrency(!isPartialPaymentAllowed && paymentType === 'partial' ? finalAmount : paymentType === 'full' ? finalAmount : partialAmount)}
                    </strong>
                  </div>
                  {paymentType === 'partial' && isPartialPaymentAllowed && (
                    <div className="bfm-summary-row bfm-remaining">
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

      {/* CONFIRMATION MODAL */}
      <CustomConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Your Tour Booking"
        message={`Are you sure you want to confirm this booking for ${pkg.name}? You will be redirected to the payment page.`}
        onConfirm={handleConfirmBooking}
        onCancel={handleCancelConfirmation}
        type="primary"
      />

      {/* BOOKING COMPLETED MODAL */}
      <BookingCompletedModal
        isOpen={showBookingCompletedModal}
        onClose={handleCloseBookingCompleted}
        packageName={pkg.name}
      />
    </div>
  );
};

export default TourBookingFormModal;