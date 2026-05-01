// src/components/Transfers/TransferBookingRightForm.jsx
import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, ChevronRight, Minus, Plus, MessageCircle, Ticket,
  ArrowRight, ArrowLeftRight
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
// ✅ Modal import REMOVED — modal is now rendered in TransferBooking.jsx (root level)
//    to avoid being clipped by overflow:hidden on pb-unified-card
import './TransferBookingRightForm.css';

const TransferBookingRightForm = ({
  transfer,
  currency = 'PHP',
  exchangeRate = 58,
  currentUser = null,
  onPassengerCountChange,
  // ── lifted modal opener from TransferBooking.jsx ──
  onOpenModal,
  // ── lifted form field state from TransferBooking.jsx ──
  arrivalTime,      setArrivalTime,
  departureTime,    setDepartureTime,
  pickupLocation,   setPickupLocation,
  dropoffLocation,  setDropoffLocation,
  specialRequests,  setSpecialRequests,
  paymentType,      setPaymentType,
}) => {
  const toast = useToast();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  // ── Calendar state ────────────────────────────────────────────────────────
  const [selectedDate,  setSelectedDate]  = useState(null);
  const [currentMonth,  setCurrentMonth]  = useState(new Date());

  // ── Transfer type selection (one-way / roundtrip) ─────────────────────────
  const hasRoundtrip = (transfer.roundtripPrice || 0) > 0;
  const [transferType, setTransferType] = useState('oneway'); // 'oneway' | 'roundtrip'

  // ── Passenger count ───────────────────────────────────────────────────────
  const [passengerCount, setPassengerCount] = useState(1);

  // ── Local travelDate (derived from calendar selection) ───────────────────
  const [travelDate, setTravelDate] = useState('');

  // ── Promo state ───────────────────────────────────────────────────────────
  const [promoCode,       setPromoCode]       = useState('');
  const [appliedPromo,    setAppliedPromo]    = useState(null);
  const [promoError,      setPromoError]      = useState('');
  const [promoWarning,    setPromoWarning]    = useState('');
  const [isCheckingPromo, setIsCheckingPromo] = useState(false);

  // Notify parent of passenger count changes
  useEffect(() => {
    if (onPassengerCountChange) onPassengerCountChange(passengerCount);
  }, [passengerCount]);

  // ── Currency helpers ──────────────────────────────────────────────────────
  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice   = (phpPrice) => currency === 'PHP' ? (phpPrice || 0) : ((phpPrice || 0) / exchangeRate);

  // ── Price from Transfer model ─────────────────────────────────────────────
  const oneWayPrice    = transfer.oneWayPrice    || 0;
  const roundtripPrice = transfer.roundtripPrice || 0;

  const basePrice = transferType === 'roundtrip' && roundtripPrice > 0
    ? roundtripPrice
    : oneWayPrice;

  const discountAmount = (() => {
    if (!appliedPromo) return 0;
    const val = appliedPromo.discountValue ?? 0;
    return appliedPromo.discountType === 'Percentage'
      ? (basePrice * val / 100)
      : val;
  })();

  const finalAmount   = Math.max(0, basePrice - discountAmount);
  const partialAmount = Math.round(finalAmount * 0.50);
  const hasValidTotal = finalAmount > 0;

  const convertedTotal    = convertPrice(basePrice);
  const convertedDiscount = convertPrice(discountAmount);
  const convertedFinal    = convertPrice(finalAmount);

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
    const yr = currentMonth.getFullYear();
    const mo = String(currentMonth.getMonth() + 1).padStart(2, '0');
    const dy = String(selectedDate).padStart(2, '0');
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

  // ── Book click — validate date then call onOpenModal (root-level) ─────────
  const handleBookClick = () => {
    if (!selectedDate) { toast.error('Please select a travel date first!'); return; }
    const dateStr = formatTravelDateStr();
    setTravelDate(dateStr);
    // ✅ Pass all modal data up to TransferBooking.jsx so modal renders
    //    outside pb-unified-card (fixes overflow:hidden clipping)
    if (onOpenModal) {
      onOpenModal({
        transferType,
        travelDate:      dateStr,
        arrivalTime:     arrivalTime     ?? '',
        departureTime:   departureTime   ?? '',
        pickupLocation:  pickupLocation  ?? '',
        dropoffLocation: dropoffLocation ?? '',
        specialRequests: specialRequests ?? '',
        paymentType:     paymentType     ?? 'full',
        totalAmount:     convertedFinal,
        partialAmount:   convertedFinal * 0.5,
      });
    }
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
              dateToCheck.setHours(0, 0, 0, 0);
              const today = new Date(); today.setHours(0, 0, 0, 0);
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

      {/* ── Transfer Type Selector (only if roundtrip price exists) ─────── */}
      {hasRoundtrip && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '900', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#1e3a5f', marginBottom: '8px' }}>
            🚗 Transfer Type
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setTransferType('oneway')}
              style={{
                padding: '14px 10px',
                borderRadius: '12px',
                border: `2px solid ${transferType === 'oneway' ? '#fc9c1b' : '#e2e8f0'}`,
                background: transferType === 'oneway' ? '#fff7ed' : 'white',
                cursor: 'pointer',
                fontWeight: '700',
                color: transferType === 'oneway' ? '#c2410c' : '#374151',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowRight size={20} color={transferType === 'oneway' ? '#f97316' : '#94a3b8'} />
              <span style={{ fontSize: '0.9rem' }}>One Way</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: transferType === 'oneway' ? '#ea580c' : '#6b7280' }}>
                {currencySymbol}{convertPrice(oneWayPrice).toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTransferType('roundtrip')}
              style={{
                padding: '14px 10px',
                borderRadius: '12px',
                border: `2px solid ${transferType === 'roundtrip' ? '#fc9c1b' : '#e2e8f0'}`,
                background: transferType === 'roundtrip' ? '#fff7ed' : 'white',
                cursor: 'pointer',
                fontWeight: '700',
                color: transferType === 'roundtrip' ? '#c2410c' : '#374151',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <ArrowLeftRight size={20} color={transferType === 'roundtrip' ? '#f97316' : '#94a3b8'} />
              <span style={{ fontSize: '0.9rem' }}>Roundtrip</span>
              <span style={{ fontSize: '0.85rem', fontWeight: '800', color: transferType === 'roundtrip' ? '#ea580c' : '#6b7280' }}>
                {currencySymbol}{convertPrice(roundtripPrice).toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}
              </span>
            </button>
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
          <span className="brf-total-label">
            Transfer Price
            <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: '6px', fontWeight: '500' }}>
              ({transferType === 'roundtrip' ? 'Roundtrip' : 'One Way'})
            </span>
          </span>
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