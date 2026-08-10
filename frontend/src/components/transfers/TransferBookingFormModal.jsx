// src/components/Transfers/TransferBookingFormModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import axios from '../../lib/axiosInstance';
import {
  X, CheckCircle, Wallet, CreditCard,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Car,
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import CustomTimePicker from '../timePicker/Clock';
import './TransferBookingFormModal.css';
import LocationSelect from '../location/LocationSelect';

// ── Custom Date Picker (Calendar Modal) ──────────────────────────────────────
const CustomDatePicker = ({ value, onChange, minDate, required, placeholder }) => {
  const [isOpen,       setIsOpen]       = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [viewMonth,    setViewMonth]    = useState(new Date().getMonth());
  const [viewYear,     setViewYear]     = useState(new Date().getFullYear());

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays   = ['SU','MO','TU','WE','TH','FR','SA'];

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (m, y) => new Date(y, m, 1).getDay();
  const formatDate     = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const formatDisplay  = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${monthNames[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  };

  const handleDayClick = (day) => {
    const formatted = formatDate(viewYear, viewMonth, day);
    setSelectedDate(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDay    = getFirstDay(viewMonth, viewYear);
  const todayStr    = new Date().toISOString().split('T')[0];

  // Sync external value changes
  useEffect(() => {
    setSelectedDate(value || '');
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="tbfm-date-picker-wrapper">
      {/* Trigger button */}
      <div onClick={() => setIsOpen(true)} className="tbfm-calendar-trigger">
        <span className={selectedDate ? 'tbfm-date-value' : 'tbfm-date-placeholder'}>
          {selectedDate ? formatDisplay(selectedDate) : placeholder || 'Select date'}
        </span>
        <CalendarIcon size={16} className="tbfm-trigger-icon" />
      </div>

      {/* Calendar Modal */}
      {isOpen && (
        <div className="tbfm-cal-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="tbfm-cal-modal-card" onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="tbfm-cal-modal-header">
              <div className="tbfm-cal-modal-title">
                <CalendarIcon size={16} className="tbfm-cal-modal-title-icon" />
                <span>Select Date</span>
              </div>
              <button
                type="button"
                className="tbfm-cal-modal-close"
                onClick={() => setIsOpen(false)}
              >
                <X size={15} />
              </button>
            </div>

            {/* Selected date display */}
            {selectedDate && (
              <div className="tbfm-cal-selected-display">
                {formatDisplay(selectedDate)}
              </div>
            )}

            {/* Month Navigation */}
            <div className="tbfm-calendar-header">
              <button type="button" className="tbfm-cal-nav-btn" onClick={prevMonth}>
                <ChevronLeft size={16} />
              </button>
              <div className="tbfm-calendar-month-label">
                {monthNames[viewMonth]} {viewYear}
              </div>
              <button type="button" className="tbfm-cal-nav-btn" onClick={nextMonth}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="tbfm-calendar-weekdays">
              {weekDays.map(d => (
                <div key={d} className="tbfm-cal-weekday">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="tbfm-calendar-days">
              {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} className="tbfm-cal-day empty" />)}
              {[...Array(daysInMonth)].map((_, i) => {
                const day  = i + 1;
                const dStr = formatDate(viewYear, viewMonth, day);
                const isSelected = dStr === selectedDate;
                const isToday    = dStr === todayStr;
                const isDisabled = minDate ? dStr < minDate : dStr < todayStr;
                return (
                  <div
                    key={day}
                    className={`tbfm-cal-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''} ${isToday && !isSelected ? 'today' : ''}`}
                    onClick={() => !isDisabled && handleDayClick(day)}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="tbfm-cal-modal-footer">
              <button
                type="button"
                className="tbfm-cal-modal-cancel-btn"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

// ── CustomTimePicker is imported from ./timePicker/Clock.jsx ─────────────────

// ── Booking Completed Modal ───────────────────────────────────────────────────
const BookingCompletedModal = ({ isOpen, onClose, activityName }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => { onClose(); }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="tbfm-overlay tbfm-overlay-top">
      <div className="tbfm-modal-card tbfm-booking-completed-card">
        <div className="tbfm-booking-completed-icon-wrap">
          <CheckCircle size={64} color="#22c55e" strokeWidth={2} />
        </div>
        <h2 className="tbfm-booking-completed-title">
          Booking Confirmed!
        </h2>
        <p className="tbfm-booking-completed-text">
          Your transfer booking for <strong>{activityName}</strong> has been submitted successfully.
        </p>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const TransferBookingFormModal = ({
  isOpen, onClose, transfer,
  transferType = 'oneway',
  travelDate, setTravelDate,
  arrivalTime, setArrivalTime,
  departureTime, setDepartureTime,
  pickupLocation, setPickupLocation,
  dropoffLocation, setDropoffLocation,
  specialRequests, setSpecialRequests,
  passengerCount,
  totalAmount, partialAmount,
  paymentType, setPaymentType,
  currency = 'PHP', exchangeRate = 58, currencySymbol = '₱',
}) => {
  const toast = useToast();
  const overlayRef = useRef(null);
  const [localLoading,              setLocalLoading]             = useState(false);
  const [showConfirmModal,          setShowConfirmModal]         = useState(false);
  const [showBookingCompletedModal, setShowBookingCompletedModal] = useState(false);

  // Contact form state
  const [fullName,   setFullName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [birthDate,  setBirthDate]  = useState('');
  const [message,    setMessage]    = useState('');

  // ── Return Date (roundtrip only) ──────────────────────────────────────────
  const [returnDate, setReturnDate] = useState('');

  // ── Night Surcharge Warning Modal ─────────────────────────────────────────
  // 'arrival' | 'departure' | null — which time field triggered the warning
  const [nightSurchargeField,   setNightSurchargeField]   = useState(null);
  const [nightSurchargePending, setNightSurchargePending] = useState('');
  const NIGHT_SURCHARGE = 500;

  // Returns true if time string (HH:MM) falls between 12:00 AM and 5:00 AM (exclusive)
  const isNightTime = (time) => {
    if (!time) return false;
    const [h] = time.split(':').map(Number);
    return h >= 0 && h < 5; // 00:00 – 04:59
  };

  // Night surcharge applies per field: ₱500 each
  // One-way: only arrivalTime checked → max ₱500
  // Roundtrip: both arrivalTime and departureTime checked → max ₱1,000 if both are night
  const nightSurchargeCount =
    (isNightTime(arrivalTime) ? 1 : 0) +
    (transferType === 'roundtrip' && isNightTime(departureTime) ? 1 : 0);
  const hasNightSurcharge      = nightSurchargeCount > 0;
  const effectiveTotalAmount   = totalAmount + nightSurchargeCount * NIGHT_SURCHARGE;
  const effectivePartialAmount = Math.ceil(effectiveTotalAmount / 2);
  const effectiveAmountToPay   = paymentType === 'full' ? effectiveTotalAmount : effectivePartialAmount;

  // ── Lock body scroll while modal is open so the page never shifts under the overlay
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Reset return date when transfer type changes away from roundtrip
  useEffect(() => {
    if (transferType !== 'roundtrip') {
      setReturnDate('');
    }
  }, [transferType]);

  // ── Partial payment restriction: hide if travel date is today or tomorrow ──
  const isPartialPaymentRestricted = (() => {
    if (!travelDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const travel = new Date(travelDate + 'T00:00:00');
    travel.setHours(0, 0, 0, 0);
    return (
      travel.getTime() === today.getTime() ||
      travel.getTime() === tomorrow.getTime()
    );
  })();

  // Auto-switch to full payment when partial is no longer available
  useEffect(() => {
    if (isPartialPaymentRestricted && paymentType === 'partial') {
      setPaymentType('full');
    }
  }, [isPartialPaymentRestricted, paymentType]);

  if (!isOpen) return null;

  const formatCurrency = (amount) => amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });

  const amountToPay = effectiveAmountToPay;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (birthDate) {
      const birth = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const md = today.getMonth() - birth.getMonth();
      if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
      if (age < 18) { toast.error('Lead contact must be at least 18 years old to book.'); return; }
      if (age > 100) { toast.error('Lead contact age cannot exceed 100 years.'); return; }
    }
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    setShowConfirmModal(false);
    setLocalLoading(true);
    try {
      const RENDER_BASE = '';

      const bookingData = {
        bookingType:     'transfer',
        transferId:      transfer._id || null,
        activityName:    transfer.activity || transfer.activityName || transfer.name || transfer.title || '',
        supplierName:    transfer.supplierName || '',
        destination:     transfer.packageDestination || '',
        pax:             transfer.pax          || '',
        transferType,
        travelDate,
        // ── Return Date (roundtrip only) ──────────────────────────────────
        returnDate:      transferType === 'roundtrip' ? (returnDate || '') : '',
        arrivalTime:     arrivalTime || '',
        departureTime:   transferType === 'roundtrip' ? (departureTime || '') : '',
        pickupLocation,
        dropoffLocation: transferType === 'roundtrip' ? dropoffLocation : '',
        specialRequests,
        fullName,
        email,
        phone,
        dateOfBirth:     birthDate || '',
        message,
        passengerCount,
        sellingPrice:    transfer.sellingPrice || 0,
        totalAmount:     effectiveTotalAmount,
        currency,
        paymentType,
        initialPaymentAmount: amountToPay,
        remainingBalance: paymentType === 'full' ? 0 : effectiveTotalAmount - effectivePartialAmount,
      };

      toast.info('Connecting to server, please wait...');

      const postBooking = () => axios.post(`${RENDER_BASE}/api/transfer-bookings`, bookingData, {
        headers: { 'Content-Type': 'application/json' }, timeout: 90000,
      });

      let bookingRes;
      try {
        bookingRes = await postBooking();
      } catch (firstErr) {
        const isRetryable = firstErr.code === 'ECONNABORTED' || firstErr.message?.includes('timeout') || firstErr.message?.includes('Network Error');
        if (isRetryable) {
          toast.info('Server is starting up, retrying...');
          await new Promise(r => setTimeout(r, 4000));
          bookingRes = await postBooking();
        } else {
          throw firstErr;
        }
      }

      if (!bookingRes.data?.success) throw new Error(bookingRes.data?.message || 'Failed to create booking');
      const bookingId = bookingRes.data.bookingId || bookingRes.data.data?._id;
      if (!bookingId) throw new Error('Booking was created but no booking ID was returned. Please contact support.');

      const paymentRes = await axios.post(`${RENDER_BASE}/api/payment/create-intent`, {
        bookingId,
        paymentType,
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

  const handleCloseBookingCompleted = () => { setShowBookingCompletedModal(false); onClose(); };

  // ── Night Surcharge handlers ───────────────────────────────────────────────
  const handleArrivalTimeChange = (e) => {
    const val = e.target.value;
    if (isNightTime(val)) {
      setNightSurchargePending(val);
      setNightSurchargeField('arrival');
    } else {
      setArrivalTime(val);
    }
  };

  const handleDepartureTimeChange = (e) => {
    const val = e.target.value;
    if (isNightTime(val)) {
      setNightSurchargePending(val);
      setNightSurchargeField('departure');
    } else {
      setDepartureTime(val);
    }
  };

  const handleNightSurchargeConfirm = () => {
    if (nightSurchargeField === 'arrival')   setArrivalTime(nightSurchargePending);
    if (nightSurchargeField === 'departure') setDepartureTime(nightSurchargePending);
    setNightSurchargeField(null);
    setNightSurchargePending('');
  };

  const handleNightSurchargeClose = () => {
    // Clear the field value — user did not accept
    if (nightSurchargeField === 'arrival')   setArrivalTime('');
    if (nightSurchargeField === 'departure') setDepartureTime('');
    setNightSurchargeField(null);
    setNightSurchargePending('');
  };

  return (
    <div className="tbfm-overlay" ref={overlayRef}>
      <div className="tbfm-modal-card">

        {/* ── CLOSE BUTTON ── */}
        <button className="tbfm-close-btn" onClick={onClose} aria-label="Close Modal">
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* ── HEADER ── */}
        <div className="tbfm-modal-header">
          <img
            src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png"
            alt="Wanderwave Logo"
            className="tbfm-modal-logo"
          />
          <h2 className="tbfm-modal-title">Your Transfer Awaits!</h2>
          <span className="tbfm-modal-subtitle">
            Complete your details below. We'll secure your transfer for{' '}
            <strong>{transfer.activity}</strong>.
          </span>

          {/* Summary cards — Travel Date / Passengers / Type / Total Amount
              NOTE: Return Date summary card intentionally removed per request */}
          <div className="tbfm-trip-summary">
            <div className="tbfm-summary-card">
              <span className="tbfm-summary-label">Travel Date</span>
              <strong className="tbfm-summary-value">
                {travelDate
                  ? new Date(travelDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '—'}
              </strong>
            </div>

            <div className="tbfm-summary-card">
              <span className="tbfm-summary-label">Passengers</span>
              <strong className="tbfm-summary-value">{passengerCount} pax</strong>
            </div>
            <div className="tbfm-summary-card">
              <span className="tbfm-summary-label">Type</span>
              <strong className="tbfm-summary-value">
                {transferType === 'roundtrip' ? '⇆ Round Trip' : '→ One Way'}
              </strong>
            </div>
            <div className="tbfm-summary-card">
              <span className="tbfm-summary-label">Total Amount</span>
              <strong className="tbfm-summary-value tbfm-price">
                {currencySymbol}{formatCurrency(effectiveTotalAmount)}
              </strong>
            </div>
          </div>
        </div>

        {/* ── SCROLLABLE FORM ── */}
        <form onSubmit={handleFormSubmit} className="tbfm-form">
          <div className="tbfm-form-body">

            {/* ── CONTACT INFORMATION ── */}
            <div className="tbfm-section-header">
              <Car size={16} className="tbfm-section-icon" />
              <span>Contact Information</span>
            </div>
            <div className="tbfm-section-divider" />

            {/* Full Name / Email */}
            <div className="tbfm-form-grid">
              <div className="tbfm-form-group">
                <label className="tbfm-form-label">Full Name <span className="tbfm-required">*</span></label>
                <input type="text" className="tbfm-form-input" required
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)} />
              </div>

              <div className="tbfm-form-group">
                <label className="tbfm-form-label">Email Address <span className="tbfm-required">*</span></label>
                <input type="email" className="tbfm-form-input" required
                  placeholder="juan@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="tbfm-form-group">
                <label className="tbfm-form-label">Phone Number <span className="tbfm-required">*</span></label>
                <input type="tel" className="tbfm-form-input" required
                  placeholder="+63 912 345 6789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="tbfm-form-group">
                <label className="tbfm-form-label">Date of Birth <span className="tbfm-required">*</span></label>
                <input
                  type="date"
                  className="tbfm-form-input"
                  required
                  value={birthDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBirthDate(e.target.value)}
                />
                {birthDate && (() => {
                  const birth = new Date(birthDate);
                  const today = new Date();
                  let age = today.getFullYear() - birth.getFullYear();
                  const md = today.getMonth() - birth.getMonth();
                  if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) age--;
                  if (age < 18) {
                    return (
                      <span className="tbfm-age-warning">
                        ⚠ Lead contact must be at least 18 years old.
                      </span>
                    );
                  }
                  if (age > 100) {
                    return (
                      <span className="tbfm-age-warning">
                        ⚠ Lead contact age cannot exceed 100 years.
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="tbfm-form-group">
                <label className="tbfm-form-label">
                  {transferType === 'roundtrip'
                    ? <>Arrival Time <span className="tbfm-required">*</span></>
                    : 'Pickup Time'}
                </label>
                <CustomTimePicker
                  value={arrivalTime}
                  onChange={handleArrivalTimeChange}
                  required={transferType === 'roundtrip'}
                  placeholder="Select time"
                />
              </div>

              {/* Travel Date — full width */}
              <div className="tbfm-form-group tbfm-full-width">
                <label className="tbfm-form-label">Travel Date <span className="tbfm-required">*</span></label>
                <CustomDatePicker
                  value={travelDate}
                  onChange={setTravelDate}
                  required
                  placeholder="Select travel date"
                />
              </div>

              {/* Return Date — roundtrip only, full width */}
              {transferType === 'roundtrip' && (
                <div className="tbfm-form-group tbfm-full-width">
                  <label className="tbfm-form-label">Return Date <span className="tbfm-required">*</span></label>
                  <CustomDatePicker
                    value={returnDate}
                    onChange={setReturnDate}
                    minDate={travelDate || undefined}
                    required
                    placeholder="Select return date"
                  />
                </div>
              )}

              {/* Departure Time (roundtrip only) */}
              {transferType === 'roundtrip' && (
                <div className="tbfm-form-group">
                  <label className="tbfm-form-label">Departure Time <span className="tbfm-required">*</span></label>
                  <CustomTimePicker
                    value={departureTime}
                    onChange={handleDepartureTimeChange}
                    required
                    placeholder="Select time"
                  />
                </div>
              )}

              {/* ── PICKUP LOCATION ── */}
              <div className="tbfm-form-group">
  <label className="tbfm-form-label">Pick-up Destination</label>
  <LocationSelect
    value={pickupLocation}
    onChange={setPickupLocation}
    placeholder="Search hotel, airport, or address..."
  />
</div>

              {/* ── DROP-OFF LOCATION (roundtrip only) ── */}
              {transferType === 'roundtrip' && (
  <div className="tbfm-form-group">
    <label className="tbfm-form-label">Drop-off Destination</label>
    <LocationSelect
      value={dropoffLocation}
      onChange={setDropoffLocation}
      placeholder="Where should we drop you off?"
    />
  </div>
)}

            </div>

            {/* ── PAYMENT OPTION ── */}
            <div className="tbfm-section-header tbfm-section-header-spaced">
              <CreditCard size={16} className="tbfm-section-icon" />
              <span>Payment Option</span>
            </div>
            <div className="tbfm-section-divider" />

            {isPartialPaymentRestricted ? (
              /* ── Restricted: only full payment allowed — redesigned solo layout ── */
              <div className="tbfm-restricted-payment-section">

                {/* Info banner */}
                <div className="tbfm-restricted-banner">
                  <span className="tbfm-restricted-banner-icon">⚡</span>
                  <div className="tbfm-restricted-banner-text">
                    <strong>Full Payment Required</strong>
                    <span>Partial payment is unavailable for travel dates of <strong>today</strong> or <strong>tomorrow</strong>.</span>
                  </div>
                </div>

                {/* Solo full-payment card — horizontal layout */}
                <div className="tbfm-payment-card active tbfm-payment-card-solo" onClick={() => setPaymentType('full')}>
                  <div className="tbfm-solo-card-inner">

                    {/* Left: radio + title + description + benefits */}
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
                        <p className="tbfm-payment-description">
                          Complete payment now and secure your booking instantly.
                        </p>
                        <ul className="tbfm-payment-benefits">
                          <li>✓ Instant confirmation</li>
                          <li>✓ No further payments needed</li>
                          <li>✓ Priority processing</li>
                        </ul>
                      </div>
                    </div>

                    {/* Right: amount display */}
                    <div className="tbfm-solo-card-right">
                      <div className="tbfm-payment-amount tbfm-solo-amount">
                        {currencySymbol}{formatCurrency(effectiveTotalAmount)}
                      </div>
                      <span className="tbfm-solo-total-label">Total Amount</span>
                    </div>

                  </div>
                </div>
              </div>

            ) : (
              /* ── Normal: full + partial payment side by side ── */
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
                      {currencySymbol}{formatCurrency(effectiveTotalAmount)}
                    </div>
                    <p className="tbfm-payment-description">
                      Complete payment now and secure your booking
                    </p>
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
                      {currencySymbol}{formatCurrency(effectivePartialAmount)}
                      <span className="tbfm-payment-percentage">50% Down Payment</span>
                    </div>
                    <p className="tbfm-payment-description">
                      Pay 50% now, remaining balance before your transfer.
                    </p>
                    <div className="tbfm-payment-breakdown">
                      <div className="tbfm-breakdown-row">
                        <span>Now (50%):</span>
                        <strong>{currencySymbol}{formatCurrency(effectivePartialAmount)}</strong>
                      </div>
                      <div className="tbfm-breakdown-row">
                        <span>Later (50%):</span>
                        <strong>{currencySymbol}{formatCurrency(effectiveTotalAmount - effectivePartialAmount)}</strong>
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
                  {currencySymbol}{formatCurrency(amountToPay)}
                </strong>
              </div>
              {paymentType === 'partial' && (
                <div className="tbfm-summary-row tbfm-remaining">
                  <span>Remaining balance:</span>
                  <span>{currencySymbol}{formatCurrency(effectiveTotalAmount - effectivePartialAmount)}</span>
                </div>
              )}
              {hasNightSurcharge && (
                <div className="tbfm-night-surcharge-notice">
                  <span className="tbfm-night-surcharge-icon">🌙</span>
                  <span>
                    Night schedule surcharge of{' '}
                    <strong>{currencySymbol}{(nightSurchargeCount * NIGHT_SURCHARGE).toLocaleString()}</strong> applied
                    {nightSurchargeCount > 1 ? ` (${nightSurchargeCount}x ₱500 — both times are 12AM–5AM)` : ' (12AM–5AM)'}
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* ── STICKY CONFIRM BUTTON ── */}
          <div className="tbfm-actions">
            <button
              type="submit"
              disabled={localLoading}
              className="tbfm-submit-btn"
            >
              {localLoading ? 'PROCESSING...' : 'CONFIRM BOOKING'}
            </button>
          </div>

        </form>
      </div>

  
      {/* ── Night Surcharge Warning Modal ── */}
      {nightSurchargeField && (
        <div className="tbfm-night-modal-overlay">
          <div className="tbfm-night-modal-card">
            <div className="tbfm-night-modal-icon">🌙</div>
            <h3 className="tbfm-night-modal-title">Night Schedule Surcharge</h3>
            <p className="tbfm-night-modal-body">
              Schedules between <strong>12:00 AM and 5:00 AM</strong> include an additional night fee of{' '}
              <strong className="tbfm-night-modal-amount">₱500</strong> to cover overnight driver allowances and logistics.
            </p>
            <div className="tbfm-night-modal-actions">
              <button
                type="button"
                className="tbfm-night-btn tbfm-night-btn-close"
                onClick={handleNightSurchargeClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tbfm-night-btn tbfm-night-btn-confirm"
                onClick={handleNightSurchargeConfirm}
              >
                Continue (+₱500)
              </button>
            </div>
          </div>
        </div>
      )}

      <CustomConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Your Transfer Booking"
        message={`Are you sure you want to book ${transfer.title || transfer.activityName || transfer.activity}? You will be redirected to the payment page.`}
        onConfirm={handleConfirmBooking}
        onCancel={() => setShowConfirmModal(false)}
        type="primary"
      />

      <BookingCompletedModal
        isOpen={showBookingCompletedModal}
        onClose={handleCloseBookingCompleted}
        activityName={transfer.activity}
      />
    </div>
  );
};

export default TransferBookingFormModal;