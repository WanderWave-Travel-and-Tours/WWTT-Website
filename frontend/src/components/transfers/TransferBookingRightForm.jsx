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
  // If transfer.pax is set, use it as fixed value; otherwise default to 1
  const fixedPax = transfer.pax && transfer.pax > 0 ? transfer.pax : null;
  const [passengerCount, setPassengerCount] = useState(fixedPax ?? 1);

  // ── Age-based passenger breakdown ─────────────────────────────────────────
  // infantCount  : 0–2 years old → FREE
  // kidCount     : 3–4 years old → 50% discount
  // adultCount   : 5+ years old  → full price (derived: passengerCount - infants - kids)
  const [infantCount, setInfantCount] = useState(0);
  const [kidCount,    setKidCount]    = useState(0);

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

  // ── Age-based pricing ────────────────────────────────────────────────────
  // infants (0–2): FREE
  // kids    (3–4): 50% of basePrice
  // adults  (5+) : full basePrice
  const adultCount     = Math.max(0, passengerCount - infantCount - kidCount);
  const agePricedTotal = (adultCount * basePrice) + (kidCount * basePrice * 0.5) + (infantCount * 0);
  const agePricedAfterPromo = Math.max(0, agePricedTotal - discountAmount);

  const finalAmount   = agePricedAfterPromo;
  const partialAmount = Math.round(finalAmount * 0.50);
  const hasValidTotal = finalAmount > 0 || infantCount === passengerCount; // allow all-infant bookings

  const convertedTotal    = convertPrice(agePricedTotal);
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
        infantCount,
        kidCount,
        adultCount,
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

        {/* Total Passengers */}
        <div className="brf-quantity-item">
          <div>
            <span className="brf-quantity-label">Passengers</span>
            <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '4px' }}>
              {fixedPax ? `Fixed capacity: ${fixedPax} pax` : 'Total number of passengers'}
            </div>
          </div>
          <div className="brf-quantity-controls">
            <button
              onClick={() => {
                if (!fixedPax) {
                  const next = Math.max(1, passengerCount - 1);
                  setPassengerCount(next);
                  // clamp infants + kids so they never exceed new total
                  if (infantCount + kidCount > next) {
                    const excess = infantCount + kidCount - next;
                    if (kidCount >= excess) setKidCount(kidCount - excess);
                    else { setKidCount(0); setInfantCount(Math.max(0, infantCount - (excess - kidCount))); }
                  }
                }
              }}
              className="brf-quantity-btn"
              type="button"
              disabled={!!fixedPax || passengerCount <= 1}
              style={(fixedPax || passengerCount <= 1) ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <Minus size={18} color="#000000" strokeWidth={3} style={{ minWidth: '18px', minHeight: '18px', stroke: '#000000' }} />
            </button>
            <span className="brf-quantity-value">{passengerCount}</span>
            <button
              onClick={() => !fixedPax && setPassengerCount(prev => Math.min(20, prev + 1))}
              className="brf-quantity-btn"
              type="button"
              disabled={!!fixedPax}
              style={fixedPax ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              <Plus size={18} color="#000000" strokeWidth={3} style={{ minWidth: '18px', minHeight: '18px', stroke: '#000000' }} />
            </button>
          </div>
        </div>

        {/* Age breakdown — only shown when total > 0 */}
        {passengerCount > 0 && (
          <div style={{ marginTop: '12px', padding: '12px 14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: '900', letterSpacing: '1px', textTransform: 'uppercase', color: '#1e3a5f', marginBottom: '10px' }}>
              Age Breakdown
            </div>

            {/* Infants 0–2 — FREE */}
            <div className="brf-quantity-item" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
              <div>
                <span className="brf-quantity-label" style={{ fontSize: '0.9rem' }}>Infants <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.78rem' }}>(0–2 yrs)</span></span>
                <div style={{ fontSize: '0.78rem', color: '#16a34a', fontWeight: '600', marginTop: '2px' }}>FREE 🎉</div>
              </div>
              <div className="brf-quantity-controls">
                <button
                  onClick={() => setInfantCount(prev => Math.max(0, prev - 1))}
                  className="brf-quantity-btn"
                  type="button"
                  disabled={infantCount <= 0}
                  style={infantCount <= 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                  <Minus size={16} color="#000000" strokeWidth={3} />
                </button>
                <span className="brf-quantity-value" style={{ minWidth: '24px', textAlign: 'center' }}>{infantCount}</span>
                <button
                  onClick={() => {
                    if (infantCount + kidCount < passengerCount) setInfantCount(prev => prev + 1);
                  }}
                  className="brf-quantity-btn"
                  type="button"
                  disabled={infantCount + kidCount >= passengerCount}
                  style={infantCount + kidCount >= passengerCount ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                  <Plus size={16} color="#000000" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Kids 3–4 — 50% discount */}
            <div className="brf-quantity-item" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
              <div>
                <span className="brf-quantity-label" style={{ fontSize: '0.9rem' }}>Kids <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.78rem' }}>(3–4 yrs)</span></span>
                <div style={{ fontSize: '0.78rem', color: '#d97706', fontWeight: '600', marginTop: '2px' }}>50% Discount</div>
              </div>
              <div className="brf-quantity-controls">
                <button
                  onClick={() => setKidCount(prev => Math.max(0, prev - 1))}
                  className="brf-quantity-btn"
                  type="button"
                  disabled={kidCount <= 0}
                  style={kidCount <= 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                  <Minus size={16} color="#000000" strokeWidth={3} />
                </button>
                <span className="brf-quantity-value" style={{ minWidth: '24px', textAlign: 'center' }}>{kidCount}</span>
                <button
                  onClick={() => {
                    if (infantCount + kidCount < passengerCount) setKidCount(prev => prev + 1);
                  }}
                  className="brf-quantity-btn"
                  type="button"
                  disabled={infantCount + kidCount >= passengerCount}
                  style={infantCount + kidCount >= passengerCount ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                >
                  <Plus size={16} color="#000000" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Adults — derived, display only */}
            <div className="brf-quantity-item" style={{ paddingTop: '8px', paddingBottom: '4px' }}>
              <div>
                <span className="brf-quantity-label" style={{ fontSize: '0.9rem' }}>Adults <span style={{ fontWeight: '500', color: '#6b7280', fontSize: '0.78rem' }}>(5+ yrs)</span></span>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: '2px' }}>Full price</div>
              </div>
              <div className="brf-quantity-controls">
                <span className="brf-quantity-value" style={{ minWidth: '24px', textAlign: 'center' }}>{adultCount}</span>
              </div>
            </div>
          </div>
        )}
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

        {/* Age-based discount breakdown */}
        {(infantCount > 0 || kidCount > 0) && (
          <div style={{ marginBottom: '8px', padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.82rem', color: '#166534' }}>
            {adultCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>{adultCount}x Adult</span>
                <span>{currencySymbol}{convertPrice(adultCount * basePrice).toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}</span>
              </div>
            )}
            {kidCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#92400e' }}>
                <span>{kidCount}x Kid (50% off)</span>
                <span>{currencySymbol}{convertPrice(kidCount * basePrice * 0.5).toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}</span>
              </div>
            )}
            {infantCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a' }}>
                <span>{infantCount}x Infant (FREE)</span>
                <span>₱0</span>
              </div>
            )}
          </div>
        )}

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