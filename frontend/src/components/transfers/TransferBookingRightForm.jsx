import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Minus, Plus, MessageCircle, Ticket
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import axios from 'axios';
import './TransferBookingRightForm.css'; // ✅ Reuse same brf- styles

const TransferBookingRightForm = ({
  transfer,
  currency = 'PHP',
  exchangeRate = 58,
  currentUser = null,
}) => {
  const navigate = useNavigate();
  const toast    = useToast();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  // ── Calendar state ────────────────────────────────────────────────────────
  const [selectedDate,   setSelectedDate]   = useState(null);
  const [currentMonth,   setCurrentMonth]   = useState(new Date());

  // ── Passenger count ───────────────────────────────────────────────────────
  const [passengerCount, setPassengerCount] = useState(1);

  // ── Transfer details (collected in booking form modal) ────────────────────
  const [pickupTime,       setPickupTime]       = useState('');
  const [pickupLocation,   setPickupLocation]   = useState('');
  const [dropoffLocation,  setDropoffLocation]  = useState('');
  const [specialRequests,  setSpecialRequests]  = useState('');
  const [fullName,         setFullName]         = useState('');
  const [email,            setEmail]            = useState('');
  const [phone,            setPhone]            = useState('');
  const [message,          setMessage]          = useState('');
  const [paymentType,      setPaymentType]      = useState('full');

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,          setLoading]          = useState(false);
  const [showBookingForm,  setShowBookingForm]  = useState(false);

  // ── Promo state ───────────────────────────────────────────────────────────
  const [promoCode,        setPromoCode]        = useState('');
  const [appliedPromo,     setAppliedPromo]     = useState(null);
  const [promoError,       setPromoError]       = useState('');
  const [promoWarning,     setPromoWarning]     = useState('');
  const [isCheckingPromo,  setIsCheckingPromo]  = useState(false);

  // ── Currency helpers ──────────────────────────────────────────────────────
  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice   = (phpPrice) => currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;

  // ── Price calculations ────────────────────────────────────────────────────
  const sellingPrice = transfer.sellingPrice || transfer.price || 0;

  const discountAmount = (() => {
    if (!appliedPromo) return 0;
    const val = appliedPromo.discountValue ?? 0;
    return appliedPromo.discountType === 'Percentage'
      ? (sellingPrice * val / 100)
      : val;
  })();

  const finalAmount    = Math.max(0, sellingPrice - discountAmount);
  const partialAmount  = Math.round(finalAmount * 0.50);
  const hasValidTotal  = finalAmount > 0;

  const convertedTotal    = convertPrice(sellingPrice);
  const convertedDiscount = convertPrice(discountAmount);
  const convertedFinal    = convertPrice(finalAmount);
  const convertedPartial  = convertPrice(partialAmount);

  // ── Calendar helpers ──────────────────────────────────────────────────────
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay    = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const monthNames  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const changeMonth = (offset) => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + offset);
    setCurrentMonth(d);
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return '';
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), selectedDate);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatTravelDateStr = () => {
    if (!selectedDate) return '';
    const yr  = currentMonth.getFullYear();
    const mo  = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dy  = String(selectedDate).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  // ── Promo handlers ────────────────────────────────────────────────────────
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) { setPromoError('Please enter a promo code'); return; }
    setIsCheckingPromo(true); setPromoError('');
    try {
      const transferId = transfer._id || transfer.id;
      let loggedInUserEmail = '';
      if (currentUser?.email) {
        loggedInUserEmail = currentUser.email.trim().toLowerCase();
      } else {
        try {
          const u = localStorage.getItem('wanderwave_user');
          if (u) loggedInUserEmail = (JSON.parse(u)?.email || '').trim().toLowerCase();
        } catch (_) {}
      }

      if (loggedInUserEmail) {
        try {
          const k = `usedVouchers_${loggedInUserEmail}`;
          if (JSON.parse(localStorage.getItem(k) || '[]').includes(promoCode.trim().toUpperCase())) {
            setPromoError('You have already used this voucher.');
            setAppliedPromo(null);
            toast.error('You have already used this voucher.');
            setIsCheckingPromo(false);
            return;
          }
        } catch (_) {}
        try {
          const r = await fetch(
            `https://wanderwaveph.onrender.com/api/bookings/check-voucher-usage?email=${encodeURIComponent(loggedInUserEmail)}&promoCode=${encodeURIComponent(promoCode.trim().toUpperCase())}`
          );
          const d = await r.json();
          if (d.success && d.hasUsed) {
            setPromoError('You have already used this voucher.');
            setAppliedPromo(null);
            toast.error('You have already used this voucher.');
            setIsCheckingPromo(false);
            return;
          }
        } catch (_) {}
      }

      const url = `https://wanderwaveph.onrender.com/api/promos/validate/${promoCode.trim().toUpperCase()}?packageId=${transferId}${loggedInUserEmail ? `&userEmail=${encodeURIComponent(loggedInUserEmail)}` : ''}`;
      const response = await fetch(url);
      const data     = await response.json();

      if (response.ok && data.valid) {
        const promo           = data.promo;
        const hasUsageLimit   = promo.usageLimit && promo.usageLimit > 0;
        const usedCount       = promo.usedCount || 0;
        const remainingUses   = hasUsageLimit ? (promo.usageLimit - usedCount) : Infinity;

        if (hasUsageLimit && remainingUses <= 0) {
          setPromoError('This promo code has reached its usage limit.');
          setAppliedPromo(null);
          setIsCheckingPromo(false);
          return;
        }

        setPromoWarning('');
        setAppliedPromo({
          code:          promo.code,
          discountType:  promo.discountType,
          discountValue: promo.discountValue ?? 0,
          pricing:       promo.pricing || null,
          promoId:       promo._id,
          promoType:     promo.promoType || 'promo',
          remainingUses: hasUsageLimit ? remainingUses : null,
          usageLimit:    promo.usageLimit || null,
          usedCount,
        });

        if (promo.promoType === 'voucher' && loggedInUserEmail) {
          try {
            const k   = `usedVouchers_${loggedInUserEmail}`;
            const arr = JSON.parse(localStorage.getItem(k) || '[]');
            if (!arr.includes(promo.code.toUpperCase())) {
              arr.push(promo.code.toUpperCase());
              localStorage.setItem(k, JSON.stringify(arr));
            }
          } catch (_) {}
        }
        toast.success(`Promo "${promo.code}" applied!`);
      } else {
        setPromoError(data.message || 'Invalid or expired promo code');
        setAppliedPromo(null);
        toast.error(data.message || 'Invalid or expired promo code');
      }
    } catch {
      setPromoError('Failed to validate promo code');
      setAppliedPromo(null);
      toast.error('Failed to validate promo code');
    } finally { setIsCheckingPromo(false); }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null); setPromoCode(''); setPromoError(''); setPromoWarning('');
    toast.success('Promo code removed');
  };

  // ── Contact Sales ─────────────────────────────────────────────────────────
  const handleContactSales = () => {
    if (typeof window.openGHLChat === 'function') window.openGHLChat();
  };

  // ── Book click ────────────────────────────────────────────────────────────
  const handleBookClick = () => {
    if (!selectedDate) { toast.error('Please select a travel date first!'); return; }
    setShowBookingForm(true);
  };

  // ── Submit booking ────────────────────────────────────────────────────────
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) { toast.error('Please enter your full name'); return; }
    if (!email.trim())    { toast.error('Please enter your email'); return; }

    setLoading(true);
    try {
      const bookingData = {
        transferId:      transfer._id || transfer.id || null,
        activityName:    transfer.activityName || transfer.name || transfer.title,
        bookingType:     'transfer',
        supplierName:    transfer.supplierName || '',
        destination:     transfer.destination  || '',
        pax:             transfer.pax          || '',
        travelDate:      formatTravelDateStr(),
        pickupTime:      pickupTime.trim(),
        pickupLocation:  pickupLocation.trim(),
        dropoffLocation: dropoffLocation.trim(),
        specialRequests: specialRequests.trim(),
        fullName:        fullName.trim(),
        email:           email.trim(),
        phone:           phone.trim(),
        message:         message.trim(),
        passengerCount,
        sellingPrice,
        totalAmount:          finalAmount,
        currency,
        paymentType,
        initialPaymentAmount: paymentType === 'partial' ? partialAmount : finalAmount,
        remainingBalance:     paymentType === 'partial' ? (finalAmount - partialAmount) : 0,
      };

      const RENDER_BASE = 'https://wanderwaveph.onrender.com';
      try { await axios.get(RENDER_BASE, { timeout: 25000 }); } catch (_) {}

      const postBooking = () => axios.post(`${RENDER_BASE}/api/transfer-bookings`, bookingData, { timeout: 90000 });

      let bookingResponse;
      try {
        bookingResponse = await postBooking();
      } catch (firstErr) {
        const isRetryable = firstErr.code === 'ECONNABORTED' || firstErr.message?.includes('timeout') || firstErr.message?.includes('Network Error');
        if (isRetryable) {
          toast.info('Server is starting up, retrying...');
          await new Promise(r => setTimeout(r, 4000));
          bookingResponse = await postBooking();
        } else throw firstErr;
      }

      if (bookingResponse.data.success) {
        const bookingId = bookingResponse.data.bookingId;
        toast.success('Booking saved! Preparing payment link...');

        const paymentResponse = await axios.post(
          `${RENDER_BASE}/api/payment/create-intent`,
          {
            bookingId,
            paymentType,
            paymentAmount: paymentType === 'partial' ? partialAmount : finalAmount,
          },
          { timeout: 60000 }
        );

        if (paymentResponse.data.success && paymentResponse.data.checkoutUrl) {
          const checkoutUrl = paymentResponse.data.checkoutUrl;
          setShowBookingForm(false);
          setConfirmModal({
            isOpen: true,
            title:   'Proceed to Payment',
            message: 'Your booking has been saved. You will now be redirected to PayMongo to complete your payment. Do you want to continue?',
            onConfirm: () => { closeConfirmModal(); window.location.href = checkoutUrl; },
          });
        } else {
          toast.error('Payment link failed. Please pay manually on your dashboard.');
          setTimeout(() => navigate('/dashboard'), 1500);
        }
      } else {
        throw new Error(bookingResponse.data.message || 'Booking failed');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to submit booking. Please try again.';
      toast.error(msg);
    } finally { setLoading(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="brf-container">
      <div className="brf-header">
        <h2>Book Your Transfer</h2>
        <p className="brf-subtitle">Select your travel date and passenger details</p>
        <br />
      </div>

      {/* ── Calendar ─────────────────────────────────────────────────────── */}
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
                <div style={{ fontWeight: '600', color: '#1f2937' }}>{formatSelectedDate()}</div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '4px' }}>Travel Date Selected</div>
              </div>
            </div>
          )}

          <div className="brf-calendar-grid">
            {['S','M','T','W','T','F','S'].map((d, i) => (
              <div key={i} className="brf-calendar-day-label">{d}</div>
            ))}
            {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day         = i + 1;
              const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              dateToCheck.setHours(0,0,0,0);
              const today = new Date(); today.setHours(0,0,0,0);
              const isPast     = dateToCheck < today;
              const isSelected = selectedDate === day;
              return (
                <button
                  key={day}
                  disabled={isPast}
                  onClick={() => !isPast && setSelectedDate(day)}
                  className={`brf-calendar-day ${isSelected ? 'brf-selected' : ''} ${isPast ? 'brf-disabled-date' : ''}`}
                >{day}</button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Passenger Count ──────────────────────────────────────────────── */}
      <div className="brf-quantity-section">
        <div className="brf-quantity-item">
          <div>
            <span className="brf-quantity-label">Passengers</span>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>Number of passengers</div>
          </div>
          <div className="brf-quantity-controls">
            <button
              onClick={() => setPassengerCount(prev => Math.max(1, prev - 1))}
              className="brf-quantity-btn"
              type="button"
              disabled={passengerCount <= 1}
              style={passengerCount <= 1 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <Minus size={18} color="#000000" strokeWidth={3} style={{ minWidth: '18px', minHeight: '18px', stroke: '#000000' }} />
            </button>
            <span className="brf-quantity-value">{passengerCount}</span>
            <button
              onClick={() => setPassengerCount(prev => Math.min(20, prev + 1))}
              className="brf-quantity-btn"
              type="button"
            >
              <Plus size={18} color="#000000" strokeWidth={3} style={{ minWidth: '18px', minHeight: '18px', stroke: '#000000' }} />
            </button>
          </div>
        </div>
      </div>

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
                type="text"
                className={`brf-promo-input ${promoError ? 'error' : ''}`}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="Enter promo code"
                onKeyPress={(e) => { if (e.key === 'Enter') handleApplyPromo(); }}
              />
              <button className="brf-promo-apply-btn" onClick={handleApplyPromo} disabled={isCheckingPromo}>
                {isCheckingPromo ? 'Checking...' : 'Apply'}
              </button>
            </div>
            {promoError && (
              <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '8px', padding: '10px 12px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #fecaca', lineHeight: '1.5' }}>
                ❌ {promoError}
              </div>
            )}
          </>
        ) : (
          <div className="brf-promo-success-box">
            <div style={{ flex: 1 }}>
              <div className="brf-promo-code-text">{appliedPromo.code}</div>
              <div className="brf-promo-desc-text">
                {appliedPromo.discountType === 'Percentage'
                  ? `${appliedPromo.discountValue}% discount`
                  : `${currencySymbol}${convertPrice(appliedPromo.discountValue).toLocaleString()} off`
                }
              </div>
            </div>
            <button className="brf-promo-remove-btn" onClick={handleRemovePromo}>Remove</button>
          </div>
        )}
        {promoWarning && (
          <div style={{ marginTop: '8px', padding: '8px 12px', background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '0.82rem', color: '#92400e' }}>
            ⚠️ {promoWarning}
          </div>
        )}
      </div>

      {/* ── Price Summary + CTA ──────────────────────────────────────────── */}
      <div className="brf-booking-footer">
        <div className="brf-total-row">
          <span className="brf-total-label">Transfer Price</span>
          <span className="brf-total-amount" style={{ color: '#10b981' }}>
            {currencySymbol}{convertedTotal.toLocaleString(undefined, {
              minimumFractionDigits: currency === 'USD' ? 2 : 0,
              maximumFractionDigits: currency === 'USD' ? 2 : 0,
            })}
          </span>
        </div>

        {appliedPromo && (
          <div className="brf-total-row" style={{ color: '#10b981', fontSize: '0.9rem' }}>
            <span>- Promo Discount ({appliedPromo.code})</span>
            <span style={{ fontWeight: '700' }}>
              -{currencySymbol}{convertedDiscount.toLocaleString(undefined, {
                minimumFractionDigits: currency === 'USD' ? 2 : 0,
                maximumFractionDigits: currency === 'USD' ? 2 : 0,
              })}
            </span>
          </div>
        )}

        <div className="brf-total-row" style={{ borderTop: '2px solid #fc9c1b', paddingTop: '12px', marginTop: '8px', fontSize: '1.1rem', fontWeight: '800', color: '#1f2937' }}>
          <span>TOTAL AMOUNT</span>
          <span style={{ color: '#fc9c1b' }}>
            {currencySymbol}{convertedFinal.toLocaleString(undefined, {
              minimumFractionDigits: currency === 'USD' ? 2 : 0,
              maximumFractionDigits: currency === 'USD' ? 2 : 0,
            })}
          </span>
        </div>

        <button className="brf-book-now-btn" onClick={handleBookClick} disabled={!hasValidTotal}>
          Book This Transfer
        </button>

        {!hasValidTotal && (
          <div style={{ marginTop: '12px', padding: '16px', background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px', color: '#92400e' }}>
            <div style={{ fontSize: '24px' }}>⚠️</div>
            <div>
              <strong style={{ display: 'block', marginBottom: '4px' }}>Cannot proceed with booking</strong>
              <span style={{ fontSize: '0.9rem' }}>Transfer price is zero. Please contact support.</span>
            </div>
          </div>
        )}

        <button className="brf-contact-sales-btn" onClick={handleContactSales}>
          <MessageCircle size={20} /> Contact Sales
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af', marginTop: '12px' }}>
          No payment required today.
        </p>
      </div>

      {/* ── Booking Form Modal ────────────────────────────────────────────── */}
      {showBookingForm && (
        <div className="brf-modal-overlay" onClick={() => setShowBookingForm(false)}>
          <div className="brf-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="brf-modal-close-btn" onClick={() => setShowBookingForm(false)}>✕</button>

            {/* Header */}
            <div className="brf-modal-header">
              <h2 className="brf-modal-title">Complete Your Booking</h2>
              <p className="brf-modal-subtitle">
                {transfer.activityName || transfer.name || transfer.title}
              </p>
              <div className="brf-modal-trip-summary">
                <div className="brf-summary-item">
                  <span className="brf-summary-label">Travel Date</span>
                  <span className="brf-summary-value">{formatSelectedDate()}</span>
                </div>
                <div className="brf-summary-item">
                  <span className="brf-summary-label">Passengers</span>
                  <span className="brf-summary-value">{passengerCount} pax</span>
                </div>
                <div className="brf-summary-item">
                  <span className="brf-summary-label">Total Amount</span>
                  <span className="brf-summary-value brf-price">
                    {currencySymbol}{convertedFinal.toLocaleString(undefined, {
                      minimumFractionDigits: currency === 'USD' ? 2 : 0,
                      maximumFractionDigits: currency === 'USD' ? 2 : 0,
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Scrollable form */}
            <div className="brf-modal-form-wrapper">
              <form onSubmit={handleSubmitBooking}>

                {/* Contact Info */}
                <h3 className="brf-form-section-header">👤 Contact Information</h3>
                <div className="brf-form-grid" style={{ marginBottom: '20px' }}>
                  <div className="brf-form-group">
                    <label>Full Name <span className="brf-required-asterisk">*</span></label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      placeholder="Juan Dela Cruz"
                    />
                  </div>
                  <div className="brf-form-group">
                    <label>Email Address <span className="brf-required-asterisk">*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="juan@email.com"
                    />
                  </div>
                  <div className="brf-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+63 912 345 6789"
                    />
                  </div>
                  <div className="brf-form-group">
                    <label>Pickup Time</label>
                    <input
                      type="time"
                      value={pickupTime}
                      onChange={e => setPickupTime(e.target.value)}
                    />
                  </div>
                  <div className="brf-form-group brf-full-width">
                    <label>Pickup Location</label>
                    <input
                      type="text"
                      value={pickupLocation}
                      onChange={e => setPickupLocation(e.target.value)}
                      placeholder="Hotel name, address, or landmark"
                    />
                  </div>
                  <div className="brf-form-group brf-full-width">
                    <label>Drop-off Location</label>
                    <input
                      type="text"
                      value={dropoffLocation}
                      onChange={e => setDropoffLocation(e.target.value)}
                      placeholder="Hotel name, address, or landmark"
                    />
                  </div>
                  <div className="brf-form-group brf-full-width">
                    <label>Special Requests / Notes</label>
                    <textarea
                      value={specialRequests}
                      onChange={e => setSpecialRequests(e.target.value)}
                      rows={3}
                      placeholder="Any special requests, flight details, or notes for our driver..."
                      style={{ resize: 'vertical' }}
                    />
                  </div>
                </div>

                {/* Payment Option */}
                <h3 className="brf-form-section-header">💳 Payment Option</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentType('full')}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '12px',
                      border: `2px solid ${paymentType === 'full' ? '#fc9c1b' : '#e2e8f0'}`,
                      background: paymentType === 'full' ? '#fff7ed' : 'white',
                      cursor: 'pointer',
                      fontWeight: '700',
                      color: paymentType === 'full' ? '#c2410c' : '#374151',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>💳</div>
                    <div style={{ fontSize: '0.95rem' }}>Full Payment</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px', color: paymentType === 'full' ? '#ea580c' : '#6b7280' }}>
                      {currencySymbol}{convertedFinal.toLocaleString(undefined, {
                        minimumFractionDigits: currency === 'USD' ? 2 : 0,
                        maximumFractionDigits: currency === 'USD' ? 2 : 0,
                      })}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentType('partial')}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '12px',
                      border: `2px solid ${paymentType === 'partial' ? '#fc9c1b' : '#e2e8f0'}`,
                      background: paymentType === 'partial' ? '#fff7ed' : 'white',
                      cursor: 'pointer',
                      fontWeight: '700',
                      color: paymentType === 'partial' ? '#c2410c' : '#374151',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: '6px' }}>🔖</div>
                    <div style={{ fontSize: '0.95rem' }}>50% Deposit</div>
                    <div style={{ fontSize: '0.85rem', marginTop: '4px', color: paymentType === 'partial' ? '#ea580c' : '#6b7280' }}>
                      {currencySymbol}{convertedPartial.toLocaleString(undefined, {
                        minimumFractionDigits: currency === 'USD' ? 2 : 0,
                        maximumFractionDigits: currency === 'USD' ? 2 : 0,
                      })}
                    </div>
                  </button>
                </div>

                {/* Actions */}
                <div className="brf-modal-actions">
                  <button type="button" className="brf-back-btn" onClick={() => setShowBookingForm(false)}>
                    ← Back
                  </button>
                  <button type="submit" className="brf-modal-submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : '🎫 Confirm & Pay'}
                  </button>
                </div>

              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ─────────────────────────────────────────────────── */}
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

export default TransferBookingRightForm;