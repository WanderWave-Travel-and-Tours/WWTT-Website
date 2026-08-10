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
  // ── shared transferType state from parent (synced with left column) ──
  transferType: transferTypeProp,
  onTransferTypeChange,
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

  // ── Transfer type — use prop if provided (synced with left column),
  //    otherwise fall back to local state ─────────────────────────────────
  const hasRoundtrip = (transfer.roundtripPrice || 0) > 0;
  const [internalTransferType, setInternalTransferType] = useState('oneway');
  const isControlled  = transferTypeProp !== undefined;
  const transferType  = isControlled ? transferTypeProp : internalTransferType;
  const setTransferType = (val) => {
    if (!isControlled) setInternalTransferType(val);
    if (onTransferTypeChange) onTransferTypeChange(val);
  };

  // ── Passenger count ───────────────────────────────────────────────────────
  // If transfer.pax is set, use it as fixed value; otherwise default to 1
  const fixedPax = transfer.pax && transfer.pax > 0 ? transfer.pax : null;
  const [passengerCount, setPassengerCount] = useState(fixedPax ?? 1);

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
            `/api/bookings/check-voucher-usage?email=${encodeURIComponent(loggedInUserEmail)}&promoCode=${encodeURIComponent(promoCode.trim().toUpperCase())}`
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

      const url = `/api/promos/validate/${promoCode.trim().toUpperCase()}?packageId=${transferId}${loggedInUserEmail ? `&userEmail=${encodeURIComponent(loggedInUserEmail)}` : ''}`;
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
                <div className="brf-selected-date-title">{formatSelectedDate()}</div>
                <div className="brf-selected-date-subtitle">Travel Date Selected</div>
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
            <div className="brf-pax-note-sm">
              {fixedPax ? `Fixed capacity: ${fixedPax} pax` : 'Number of passengers'}
            </div>
          </div>
          <div className="brf-quantity-controls">
            <button
              onClick={() => !fixedPax && setPassengerCount(prev => Math.max(1, prev - 1))}
              className={`brf-quantity-btn${(fixedPax || passengerCount <= 1) ? ' brf-quantity-btn-disabled' : ''}`}
              type="button"
              disabled={!!fixedPax || passengerCount <= 1}
            >
              <Minus size={18} color="#000000" strokeWidth={3} className="brf-qty-icon" />
            </button>
            <span className="brf-quantity-value">{passengerCount}</span>
            <button
              onClick={() => !fixedPax && setPassengerCount(prev => Math.min(20, prev + 1))}
              className={`brf-quantity-btn${fixedPax ? ' brf-quantity-btn-disabled' : ''}`}
              type="button"
              disabled={!!fixedPax}
            >
              <Plus size={18} color="#000000" strokeWidth={3} className="brf-qty-icon" />
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
              <div className="brf-promo-error-notice">
                ❌ {promoError}
              </div>
            )}
          </>
        ) : (
          <div className="brf-promo-success-box">
            <div className="brf-flex-1">
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
          <div className="brf-promo-warning-notice">
            ⚠️ {promoWarning}
          </div>
        )}
      </div>

      {/* ── Price Summary + CTA ──────────────────────────────────────────── */}
      <div className="brf-booking-footer">
        <div className="brf-total-row">
          <span className="brf-total-label">
            Transfer Price
            <span className="brf-transfer-type-label">
              ({transferType === 'roundtrip' ? 'Roundtrip' : 'One Way'})
            </span>
          </span>
          <span className="brf-total-amount brf-total-amount-active">
            {currencySymbol}{convertedTotal.toLocaleString(undefined, {
              minimumFractionDigits: currency === 'USD' ? 2 : 0,
              maximumFractionDigits: currency === 'USD' ? 2 : 0,
            })}
          </span>
        </div>

        {appliedPromo && (
          <div className="brf-total-row brf-discount-row">
            <span>- Promo Discount ({appliedPromo.code})</span>
            <span className="brf-fw-700">
              -{currencySymbol}{convertedDiscount.toLocaleString(undefined, {
                minimumFractionDigits: currency === 'USD' ? 2 : 0,
                maximumFractionDigits: currency === 'USD' ? 2 : 0,
              })}
            </span>
          </div>
        )}

        <div className="brf-total-row brf-grand-total-row">
          <span>TOTAL AMOUNT</span>
          <span className="brf-grand-total-value">
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
          <div className="brf-invalid-total-notice">
            <div className="brf-invalid-total-icon">⚠️</div>
            <div>
              <strong className="brf-invalid-total-title">Cannot proceed with booking</strong>
              <span className="brf-invalid-total-text">Transfer price is zero. Please contact support.</span>
            </div>
          </div>
        )}

        <button className="brf-contact-sales-btn" onClick={handleContactSales}>
          <MessageCircle size={20} /> Contact Sales
        </button>

        <p className="brf-no-payment-note">
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