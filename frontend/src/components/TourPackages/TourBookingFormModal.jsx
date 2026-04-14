import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { X, Plane, CheckCircle, Upload, Wallet, CreditCard, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import './TourBookingFormModal.css';
import '../packageDeals/PaymentOption.css';

// ── Custom Date Picker — Month/Year dropdowns + day grid ─────────────────────
const CustomDatePicker = ({ value, onChange, maxDate, required, placeholder }) => {
  const today = new Date();
  const maxDateObj = maxDate ? new Date(maxDate) : today;
  const maxYear = maxDateObj.getFullYear();
  const minYear = maxYear - 100;

  const parseValue = (v) => {
    if (!v) return null;
    const [y, m, d] = v.split('-').map(Number);
    return { year: y, month: m - 1, day: d };
  };

  const parsed = parseValue(value);
  const [isOpen, setIsOpen]     = useState(false);
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth());
  const [viewYear, setViewYear]   = useState(parsed?.year ?? maxYear);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const years = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
  const getFirstDay    = (m, y) => new Date(y, m, 1).getDay();

  const formatDate    = (y, m, d) => `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const formatDisplay = (v) => {
    if (!v) return '';
    const [y, m, d] = v.split('-');
    return `${monthNames[parseInt(m) - 1]} ${parseInt(d)}, ${y}`;
  };

  const handleDayClick = (day) => {
    const formatted = formatDate(viewYear, viewMonth, day);
    onChange(formatted);
    setIsOpen(false);
  };

  const daysInMonth = getDaysInMonth(viewMonth, viewYear);
  const firstDay    = getFirstDay(viewMonth, viewYear);

  // Close on outside click
  const wrapperRef = useRef(null);
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        className="bfm-calendar-trigger"
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarIcon size={16} color="#fc9c1b" />
          <span className={value ? 'bfm-date-value' : 'bfm-date-placeholder'}>
            {value ? formatDisplay(value) : placeholder || 'Select date'}
          </span>
        </span>
        <ChevronRight size={14} className="bfm-trigger-icon" style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {/* Calendar popup */}
      {isOpen && (
        <div className="bfm-custom-calendar" style={{ minWidth: '300px' }}>
          {/* Month + Year dropdowns */}
          <div className="bfm-calendar-header">
            <div className="bfm-calendar-selectors">
              <select
                className="bfm-month-select"
                value={viewMonth}
                onChange={e => setViewMonth(Number(e.target.value))}
              >
                {monthNames.map((name, idx) => (
                  <option key={idx} value={idx}>{name}</option>
                ))}
              </select>
              <select
                className="bfm-year-select"
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="bfm-calendar-weekdays">
            {weekDays.map(d => (
              <div key={d} className="bfm-cal-weekday">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="bfm-calendar-days">
            {[...Array(firstDay)].map((_, i) => (
              <div key={`e-${i}`} className="bfm-cal-day empty" />
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const day  = i + 1;
              const dStr = formatDate(viewYear, viewMonth, day);
              const isSelected = dStr === value;
              const isDisabled = maxDate && dStr > maxDate;
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => !isDisabled && handleDayClick(day)}
                  className={`bfm-cal-day${isSelected ? ' selected' : ''}${isDisabled ? ' disabled' : ''}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Booking Completed Modal ───────────────────────────────────────────────────
const BookingCompletedModal = ({ isOpen, onClose, packageName }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>Booking Confirmed!</h3>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '24px' }}>
          Your booking for <strong>{packageName}</strong> has been submitted successfully.
        </p>
        <button onClick={onClose} style={{ background: '#fc9c1b', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const TourBookingFormModal = ({
  isOpen, onClose, pkg,
  currentMonth, selectedDate, getCalculatedDates, monthNames,
  packageTotal, appliedPromo, discountAmount, finalPackageTotal,
  selectedFlight, airfareTotal, totalAmount, bookingWithAirfare,
  isInternationalFlight, requiresID, requiresPassport,
  passengerStep, totalPassengers, paymentType, setPaymentType,
  partialAmount, progressPercent, currentPassenger, passengers,
  handlePassengerChange, handleFileUpload, removeFile,
  handleNextPassenger, handleBackPassenger, loading,
  currency = 'PHP', exchangeRate = 58, currencySymbol = '₱',
  convertPrice,
}) => {
  const toast = useToast();
  const [localLoading, setLocalLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [showBookingCompletedModal, setShowBookingCompletedModal] = useState(false);

  if (!isOpen) return null;

  const formatCurrency = (amount) => amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0
  });

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return '';
    const birthDate = new Date(dateOfBirth);
    const today     = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 0 ? age : '';
  };

  const handleDateOfBirthChange = (passengerIndex, dateValue) => {
    handlePassengerChange(passengerIndex, 'dateOfBirth', dateValue);
    const age = calculateAge(dateValue);
    if (age !== '') handlePassengerChange(passengerIndex, 'age', age.toString());
  };

  const isLastPassenger    = passengerStep === totalPassengers;
  const finalAmount        = selectedFlight ? totalAmount : finalPackageTotal;
  const partialPercentage  = selectedFlight ? 85 : 50;
  const partialPercentageText = selectedFlight ? '85%' : '50%';

  const handleFormSubmit = (e) => { e.preventDefault(); handleNextPassenger(e); };

  // ── Confirm booking → POST to /api/tour-bookings ─────────────────────────
  const handleConfirmBooking = async () => {
    setShowConfirmModal(false); setPendingSubmit(false); setLocalLoading(true);
    try {
      const fullBookingData = {
        // ✅ Tour-specific identifiers
        bookingType:  'tour',
        tourId:       pkg._id || pkg.id,
        packageId:    pkg._id || pkg.id,     // kept for backend compatibility
        packageName:  pkg.name || pkg.title,
        sellerPrice:  pkg.sellerPrice || 0,
        markup:       pkg.markup || 0,
        price:        finalPackageTotal,
        fullName:     (passengers[0]?.firstName || '') + ' ' + (passengers[0]?.lastName || ''),
        email:        passengers[0]?.email,
        totalAmount:  finalAmount, finalPackageTotal, packageTotal: finalPackageTotal,
        initialPaymentAmount: paymentType === 'full' ? finalAmount : partialAmount,
        paymentType,
        startDate: getCalculatedDates().start?.toISOString().split('T')[0],
        endDate:   getCalculatedDates().end?.toISOString().split('T')[0],
        duration:  pkg.duration,
        pax: { adult: totalPassengers, children: 0, infants: 0 },
        passengers: passengers.map((p, i) => ({
          passengerNumber: p.passengerNumber || i + 1,
          firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone,
          dateOfBirth: p.dateOfBirth, age: parseInt(p.age) || 0, gender: p.gender || '',
          address: p.address || '', nationality: p.nationality || 'Filipino',
        })),
        selectedFlight:    selectedFlight || null,
        includesAirfare:   bookingWithAirfare || false,
        airfareTotal:      airfareTotal || 0,
        flightDetails: selectedFlight ? {
          airline:       selectedFlight.airline?.name || selectedFlight.airline || '',
          flightNumber:  selectedFlight.flightNumber || '',
          route:         `${selectedFlight.departure?.iataCode || ''} → ${selectedFlight.arrival?.iataCode || ''}`,
          departureTime: selectedFlight.departure?.at || selectedFlight.departureTime || '',
          arrivalTime:   selectedFlight.arrival?.at || selectedFlight.arrivalTime || '',
          isInternational: isInternationalFlight || false,
        } : null,
        // No hotel fields for tours
        isCustomized:          false,
        customizedInclusions:  [],
        promoCode:     appliedPromo?.code || null,
        promoId:       appliedPromo?._id || appliedPromo?.id || null,
        discountAmount: discountAmount || 0,
        currency, timerExpiredAtBooking: false, priceType: 'discounted', appliedMarkup: 0,
      };

      const formData = new FormData();
      formData.append('bookingData', JSON.stringify(fullBookingData));
      passengers.forEach((p, i) => {
        if (p.idFile instanceof File)       formData.append(`idFile_${i}`, p.idFile);
        if (p.passportFile instanceof File) formData.append(`passportFile_${i}`, p.passportFile);
      });

      const RENDER_BASE = 'https://wanderwaveph.onrender.com';
      toast.info('Connecting to server, please wait...');
      try { await axios.get(RENDER_BASE, { timeout: 25000 }); } catch (_) {}

      // ✅ NOW USING TOUR BOOKING ROUTE
      const postBooking = () => axios.post(`${RENDER_BASE}/api/tour-bookings`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000
      });

      let bookingRes;
      try { bookingRes = await postBooking(); }
      catch (firstErr) {
        const isRetryable = firstErr.code === 'ECONNABORTED' || firstErr.message?.includes('timeout') || firstErr.message?.includes('Network Error');
        if (isRetryable) { toast.info('Server is starting up, retrying...'); await new Promise(r => setTimeout(r, 4000)); bookingRes = await postBooking(); }
        else throw firstErr;
      }

      if (!bookingRes.data?.success) throw new Error(bookingRes.data?.message || 'Failed to create tour booking');
      const bookingId = bookingRes.data.bookingId || bookingRes.data.data?._id;
      if (!bookingId) throw new Error('Booking was created but no booking ID was returned. Please contact support.');

      const amountToPay = paymentType === 'full' ? finalAmount : partialAmount;
      const paymentRes  = await axios.post(`${RENDER_BASE}/api/payment/create-intent`, {
        bookingId, paymentType, paymentAmount: amountToPay
      }, { timeout: 60000 });

      if (paymentRes.data.success && paymentRes.data.checkoutUrl) {
        toast.success('Redirecting to secure payment page...');
        if (paymentRes.data.checkoutSessionId) sessionStorage.setItem('pendingCheckoutSessionId', paymentRes.data.checkoutSessionId);
        onClose();
        window.location.href = paymentRes.data.checkoutUrl;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to create booking');
    } finally { setLocalLoading(false); }
  };

  const handleCancelConfirmation  = () => { setShowConfirmModal(false); setPendingSubmit(false); };
  const handleCloseBookingCompleted = () => { setShowBookingCompletedModal(false); onClose(); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="bfm-overlay">
      <div className="bfm-modal-card">

        <button className="bfm-close-btn" onClick={onClose} aria-label="Close Modal">
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* HEADER */}
        <div className="bfm-modal-header">
          <img src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" alt="Wanderwave Logo" className="bfm-modal-logo" />
          <h2 className="bfm-modal-title">Your Adventure Awaits!</h2>
          <p className="bfm-modal-subtitle">
            Please complete your details below. We'll secure your spot for <strong>{pkg.title || pkg.name}</strong> instantly.
          </p>

          <div className="bfm-trip-summary">
            <div className="bfm-summary-item">
              <span className="bfm-summary-label">Travel Dates</span>
              <strong className="bfm-summary-value">
                {monthNames[currentMonth.getMonth()]} {selectedDate} - {getCalculatedDates().end?.getDate()}, {currentMonth.getFullYear()}
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
                ) : `${currencySymbol}${formatCurrency(packageTotal)}`}
              </strong>
              {appliedPromo && (
                <span className="bfm-summary-subtext" style={{ color: '#10b981', fontWeight: '600' }}>
                  Promo applied: -{currencySymbol}{formatCurrency(discountAmount)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        {totalPassengers > 1 && (
          <div className="bfm-progress-section">
            <div className="bfm-progress-bar">
              <div className="bfm-progress-fill" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="bfm-progress-text">Passenger {passengerStep} of {totalPassengers}</p>
          </div>
        )}

        {/* FORM */}
        <form id="bfm-passenger-form" onSubmit={handleFormSubmit} className="bfm-form">
          <div className="bfm-form-body">

            <h3 className="bfm-passenger-title">
              {totalPassengers > 1 ? `Passenger ${passengerStep} Details` : 'Passenger Details'}
            </h3>

            {/* Name row */}
            <div className="bfm-form-row">
              <div className="bfm-form-group">
                <label className="bfm-form-label">First Name *</label>
                <input type="text" className="bfm-form-input" required
                  placeholder="Juan"
                  value={currentPassenger?.firstName || ''}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'firstName', e.target.value)} />
              </div>
              <div className="bfm-form-group">
                <label className="bfm-form-label">Last Name *</label>
                <input type="text" className="bfm-form-input" required
                  placeholder="dela Cruz"
                  value={currentPassenger?.lastName || ''}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'lastName', e.target.value)} />
              </div>
            </div>

            {/* Email / Phone */}
            {passengerStep === 1 && (
              <div className="bfm-form-row">
                <div className="bfm-form-group">
                  <label className="bfm-form-label">Email Address *</label>
                  <input type="email" className="bfm-form-input" required
                    placeholder="juan@email.com"
                    value={currentPassenger?.email || ''}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'email', e.target.value)} />
                </div>
                <div className="bfm-form-group">
                  <label className="bfm-form-label">Phone Number *</label>
                  <input type="tel" className="bfm-form-input" required
                    placeholder="09XXXXXXXXX"
                    value={currentPassenger?.phone || ''}
                    onChange={(e) => handlePassengerChange(passengerStep - 1, 'phone', e.target.value)} />
                </div>
              </div>
            )}

            {/* DOB / Age */}
            <div className="bfm-form-row">
              <div className="bfm-form-group">
                <label className="bfm-form-label">Date of Birth *</label>
                <CustomDatePicker
                  value={currentPassenger?.dateOfBirth || ''}
                  onChange={(val) => handleDateOfBirthChange(passengerStep - 1, val)}
                  maxDate={new Date().toISOString().split('T')[0]}
                  required placeholder="Select date of birth"
                />
              </div>
              <div className="bfm-form-group">
                <label className="bfm-form-label">Age</label>
                <input type="number" className="bfm-form-input" min="0" max="120"
                  placeholder="Auto-calculated"
                  value={currentPassenger?.age || ''}
                  onChange={(e) => handlePassengerChange(passengerStep - 1, 'age', e.target.value)} />
              </div>
            </div>

            {/* Gender */}
            <div className="bfm-form-group">
              <label className="bfm-form-label">Gender *</label>
              <select className="bfm-form-input" required
                value={currentPassenger?.gender || ''}
                onChange={(e) => handlePassengerChange(passengerStep - 1, 'gender', e.target.value)}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Nationality */}
            <div className="bfm-form-group">
              <label className="bfm-form-label">Nationality *</label>
              <input type="text" className="bfm-form-input" required
                placeholder="Filipino"
                value={currentPassenger?.nationality || 'Filipino'}
                onChange={(e) => handlePassengerChange(passengerStep - 1, 'nationality', e.target.value)} />
            </div>

            {/* Address */}
            <div className="bfm-form-group">
              <label className="bfm-form-label">Address</label>
              <input type="text" className="bfm-form-input"
                placeholder="City, Province"
                value={currentPassenger?.address || ''}
                onChange={(e) => handlePassengerChange(passengerStep - 1, 'address', e.target.value)} />
            </div>

            {/* ID / Passport uploads */}
            {bookingWithAirfare && requiresID && (
              <div className="bfm-form-group">
                <label className="bfm-form-label">Valid ID * (required for domestic flight)</label>
                {!currentPassenger?.idFile ? (
                  <label className="bfm-upload-label">
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(passengerStep - 1, 'id', e)} />
                    <Upload size={20} /> Upload Valid ID
                  </label>
                ) : (
                  <div className="bfm-uploaded-file">
                    <CheckCircle size={16} color="#10b981" />
                    <span>{currentPassenger.idFileName}</span>
                    <button type="button" onClick={() => removeFile(passengerStep - 1, 'id')} className="bfm-remove-file">×</button>
                  </div>
                )}
              </div>
            )}

            {bookingWithAirfare && requiresPassport && (
              <div className="bfm-form-group">
                <label className="bfm-form-label">Passport * (required for international flight)</label>
                {!currentPassenger?.passportFile ? (
                  <label className="bfm-upload-label">
                    <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                      onChange={(e) => handleFileUpload(passengerStep - 1, 'passport', e)} />
                    <Upload size={20} /> Upload Passport
                  </label>
                ) : (
                  <div className="bfm-uploaded-file">
                    <CheckCircle size={16} color="#10b981" />
                    <span>{currentPassenger.passportFileName}</span>
                    <button type="button" onClick={() => removeFile(passengerStep - 1, 'passport')} className="bfm-remove-file">×</button>
                  </div>
                )}
              </div>
            )}

            {/* PAYMENT OPTIONS (last passenger only) */}
            {isLastPassenger && (
              <div className="bfm-payment-section">
                <div className="bfm-payment-header">
                  <Wallet size={22} />
                  <h3>Choose Payment Plan</h3>
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
                        <CreditCard size={20} />
                        <span>Full Payment</span>
                        <span className="bfm-recommended-badge">Recommended</span>
                      </div>
                    </div>
                    <div className="bfm-payment-card-body">
                      <div className="bfm-payment-amount">
                        {currencySymbol}{formatCurrency(finalAmount)}
                        <span className="bfm-payment-percentage">100%</span>
                      </div>
                      <p className="bfm-payment-description">Pay the full amount now and you're all set!</p>
                      <ul className="bfm-payment-benefits">
                        <li>✅ Booking confirmed immediately</li>
                        <li>✅ No remaining balance</li>
                        <li>✅ Priority slot reservation</li>
                      </ul>
                    </div>
                  </div>

                  {/* Partial Payment */}
                  <div
                    className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
                    onClick={() => setPaymentType('partial')}
                  >
                    <div className="bfm-payment-card-header">
                      <div className="bfm-payment-radio">
                        <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                      </div>
                      <div className="bfm-payment-card-title">
                        <Wallet size={20} />
                        <span>Partial Payment</span>
                        <span className="bfm-flexible-badge">Flexible</span>
                      </div>
                    </div>
                    <div className="bfm-payment-card-body">
                      <div className="bfm-payment-amount">
                        {currencySymbol}{formatCurrency(partialAmount)}
                        <span className="bfm-payment-percentage">{partialPercentageText} now</span>
                      </div>
                      <p className="bfm-payment-description">Pay {partialPercentageText} now, rest before your trip.</p>
                      <ul className="bfm-payment-benefits">
                        <li>✅ Lower upfront cost</li>
                        <li>✅ Slot secured immediately</li>
                        <li>⚠️ Remaining balance due before trip</li>
                      </ul>
                      <div className="bfm-payment-breakdown">
                        <div className="bfm-breakdown-row">
                          <span>Pay now ({partialPercentageText})</span>
                          <strong>{currencySymbol}{formatCurrency(partialAmount)}</strong>
                        </div>
                        <div className="bfm-breakdown-row">
                          <span>Remaining balance</span>
                          <strong>{currencySymbol}{formatCurrency(finalAmount - partialAmount)}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bfm-payment-summary">
                  <div className="bfm-summary-row">
                    <span>Amount to pay now:</span>
                    <strong className="bfm-amount-highlight">
                      {currencySymbol}{formatCurrency(paymentType === 'full' ? finalAmount : partialAmount)}
                    </strong>
                  </div>
                  {paymentType === 'partial' && (
                    <div className="bfm-summary-row bfm-remaining">
                      <span>Remaining balance:</span>
                      <span>{currencySymbol}{formatCurrency(finalAmount - partialAmount)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </form>

        {/* ACTION BUTTONS - Sticky footer outside scroll area */}
        <div className="bfm-actions">
          {passengerStep > 1 && (
            <button type="button" onClick={handleBackPassenger} className="bfm-back-btn">Back</button>
          )}
          <button
            type="submit"
            form="bfm-passenger-form"
            disabled={localLoading || loading}
            className="bfm-submit-btn"
            style={{ flex: passengerStep === 1 ? '1' : '2' }}
          >
            {localLoading || loading
              ? 'PROCESSING...'
              : passengerStep === totalPassengers
                ? 'CONFIRM BOOKING'
                : `NEXT: PASSENGER ${passengerStep + 1}`}
          </button>
        </div>
      </div>

      <CustomConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Your Booking"
        message={`Are you sure you want to confirm this booking for ${pkg.title || pkg.name}? You will be redirected to the payment page.`}
        onConfirm={handleConfirmBooking}
        onCancel={handleCancelConfirmation}
        type="primary"
      />

      <BookingCompletedModal
        isOpen={showBookingCompletedModal}
        onClose={handleCloseBookingCompleted}
        packageName={pkg.title || pkg.name}
      />
    </div>
  );
};

export default TourBookingFormModal;