// src/components/Transfers/TransferBookingFormModal.jsx
import React, { useState, useRef } from 'react';
import axios from 'axios';
import {
  X, CheckCircle, Wallet, CreditCard,
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Car
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import './TransferBookingFormModal.css';
import '../packageDeals/PaymentOption.css';

// ── Custom Date Picker (copied from TourBookingFormModal) ─────────────────────
const CustomDatePicker = ({ value, onChange, minDate, required, placeholder }) => {
  const [isOpen,     setIsOpen]     = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [viewMonth,  setViewMonth]  = useState(new Date().getMonth());
  const [viewYear,   setViewYear]   = useState(new Date().getFullYear());
  const calendarRef = useRef(null);

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const weekDays   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

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

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: selectedDate ? '#1f2937' : '#9ca3af' }}
      >
        <CalendarIcon size={16} color="#FF8C00" />
        {selectedDate ? formatDisplay(selectedDate) : placeholder || 'Select date'}
      </button>

      {isOpen && (
        <div ref={calendarRef} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 9999, background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.12)', padding: '16px', minWidth: '280px', marginTop: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <button type="button" onClick={() => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><ChevronLeft size={18} /></button>
            <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{monthNames[viewMonth]} {viewYear}</span>
            <button type="button" onClick={() => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}><ChevronRight size={18} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '8px' }}>
            {weekDays.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: '700', color: '#9ca3af', padding: '4px' }}>{d}</div>)}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {[...Array(firstDay)].map((_, i) => <div key={`e-${i}`} />)}
            {[...Array(daysInMonth)].map((_, i) => {
              const day  = i + 1;
              const dStr = formatDate(viewYear, viewMonth, day);
              const isSelected = dStr === selectedDate;
              const isDisabled = minDate ? dStr < minDate : dStr < todayStr;
              return (
                <button
                  key={day} type="button" onClick={() => !isDisabled && handleDayClick(day)} disabled={isDisabled}
                  style={{ padding: '6px 2px', borderRadius: '6px', border: 'none', background: isSelected ? '#FF8C00' : 'transparent', color: isSelected ? '#fff' : isDisabled ? '#d1d5db' : '#374151', fontWeight: isSelected ? '700' : '400', fontSize: '0.85rem', cursor: isDisabled ? 'not-allowed' : 'pointer', textAlign: 'center' }}
                >{day}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Booking Completed Modal ───────────────────────────────────────────────────
const BookingCompletedModal = ({ isOpen, onClose, activityName }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '32px', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h3 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1f2937', marginBottom: '8px' }}>Booking Confirmed!</h3>
        <p style={{ color: '#6b7280', fontSize: '0.95rem', marginBottom: '24px' }}>
          Your transfer booking for <strong>{activityName}</strong> has been submitted successfully.
        </p>
        <button onClick={onClose} style={{ background: '#FF8C00', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '8px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
          Close
        </button>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const TransferBookingFormModal = ({
  isOpen, onClose, transfer,
  travelDate, setTravelDate,
  pickupTime, setPickupTime,
  pickupLocation, setPickupLocation,
  dropoffLocation, setDropoffLocation,
  specialRequests, setSpecialRequests,
  passengerCount,
  totalAmount, partialAmount,
  paymentType, setPaymentType,
  currency = 'PHP', exchangeRate = 58, currencySymbol = '₱',
}) => {
  const toast = useToast();
  const [localLoading,             setLocalLoading]             = useState(false);
  const [showConfirmModal,         setShowConfirmModal]         = useState(false);
  const [showBookingCompletedModal, setShowBookingCompletedModal] = useState(false);

  // Contact form state
  const [fullName,    setFullName]    = useState('');
  const [email,       setEmail]       = useState('');
  const [phone,       setPhone]       = useState('');
  const [message,     setMessage]     = useState('');

  if (!isOpen) return null;

  const formatCurrency = (amount) => amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });

  const amountToPay = paymentType === 'full' ? totalAmount : partialAmount;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmBooking = async () => {
    setShowConfirmModal(false);
    setLocalLoading(true);
    try {
      const RENDER_BASE = 'https://wanderwaveph.onrender.com';

      const bookingData = {
        bookingType:     'transfer',
        transferId:      transfer._id || null,
        activityName:    transfer.activity || transfer.activityName || transfer.name || transfer.title || '',
        supplierName:    transfer.supplierName || '',
        destination:     transfer.destination  || '',
        pax:             transfer.pax          || '',
        travelDate,
        pickupTime,
        pickupLocation,
        dropoffLocation,
        specialRequests,
        fullName,
        email,
        phone,
        message,
        passengerCount,
        sellingPrice:    transfer.sellingPrice || 0,
        totalAmount,
        currency,
        paymentType,
        initialPaymentAmount: amountToPay,
        remainingBalance: paymentType === 'full' ? 0 : totalAmount - partialAmount,
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

  return (
    <div className="bfm-overlay">
      <div className="bfm-modal-card">

        <button className="bfm-close-btn" onClick={onClose} aria-label="Close Modal">
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* HEADER */}
        <div className="bfm-modal-header">
          <img src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" alt="Wanderwave Logo" className="bfm-modal-logo" />
          <h2 className="bfm-modal-title">Book Your Transfer</h2>
          <p className="bfm-modal-subtitle">
            Complete your details below to secure your transfer for <strong>{transfer.activity}</strong>.
          </p>

          <div className="bfm-trip-summary">
            <div className="bfm-summary-item">
              <span className="bfm-summary-label">Transfer</span>
              <strong className="bfm-summary-value">{transfer.activity}</strong>
              <span className="bfm-summary-subtext">{transfer.destination}</span>
            </div>
            <div className="bfm-summary-item">
              <span className="bfm-summary-label">Transfer Price</span>
              <strong className="bfm-summary-value bfm-price">
                {currencySymbol}{formatCurrency(totalAmount)}
              </strong>
              <span className="bfm-summary-subtext">{passengerCount} pax</span>
            </div>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleFormSubmit} className="bfm-form">
          <div className="bfm-form-body">

            <h3 className="bfm-passenger-title">Contact & Transfer Details</h3>

            {/* Full Name / Email */}
            <div className="bfm-form-row">
              <div className="bfm-form-group">
                <label className="bfm-form-label">Full Name *</label>
                <input type="text" className="bfm-form-input" required
                  placeholder="Juan dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="bfm-form-group">
                <label className="bfm-form-label">Email Address *</label>
                <input type="email" className="bfm-form-input" required
                  placeholder="juan@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>

            {/* Phone */}
            <div className="bfm-form-group">
              <label className="bfm-form-label">Phone Number *</label>
              <input type="tel" className="bfm-form-input" required
                placeholder="09XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)} />
            </div>

            {/* Travel Date */}
            <div className="bfm-form-row">
              <div className="bfm-form-group">
                <label className="bfm-form-label">Travel Date *</label>
                <CustomDatePicker
                  value={travelDate}
                  onChange={setTravelDate}
                  required
                  placeholder="Select travel date"
                />
              </div>
              <div className="bfm-form-group">
                <label className="bfm-form-label">Pickup Time</label>
                <input type="time" className="bfm-form-input"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)} />
              </div>
            </div>

            {/* Pickup / Dropoff */}
            <div className="bfm-form-row">
              <div className="bfm-form-group">
                <label className="bfm-form-label">Pickup Location *</label>
                <input type="text" className="bfm-form-input" required
                  placeholder="e.g. Airport Terminal 1"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)} />
              </div>
              <div className="bfm-form-group">
                <label className="bfm-form-label">Drop-off Location *</label>
                <input type="text" className="bfm-form-input" required
                  placeholder="e.g. Hotel Name"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)} />
              </div>
            </div>

            {/* Special Requests */}
            <div className="bfm-form-group">
              <label className="bfm-form-label">Special Requests</label>
              <textarea className="bfm-form-input" rows="3"
                placeholder="Any special requirements (e.g. child seat, extra luggage)..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* Message */}
            <div className="bfm-form-group">
              <label className="bfm-form-label">Additional Message</label>
              <textarea className="bfm-form-input" rows="2"
                placeholder="Anything else we should know?"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            {/* PAYMENT OPTIONS */}
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
                      {currencySymbol}{formatCurrency(totalAmount)}
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
                      <span className="bfm-payment-percentage">50% now</span>
                    </div>
                    <p className="bfm-payment-description">Pay 50% now, rest before your transfer.</p>
                    <ul className="bfm-payment-benefits">
                      <li>✅ Lower upfront cost</li>
                      <li>✅ Slot secured immediately</li>
                      <li>⚠️ Remaining balance due before transfer</li>
                    </ul>
                    <div className="bfm-payment-breakdown">
                      <div className="bfm-breakdown-row">
                        <span>Pay now (50%)</span>
                        <strong>{currencySymbol}{formatCurrency(partialAmount)}</strong>
                      </div>
                      <div className="bfm-breakdown-row">
                        <span>Remaining balance</span>
                        <strong>{currencySymbol}{formatCurrency(totalAmount - partialAmount)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bfm-payment-summary">
                <div className="bfm-summary-row">
                  <span>Amount to pay now:</span>
                  <strong className="bfm-amount-highlight">
                    {currencySymbol}{formatCurrency(amountToPay)}
                  </strong>
                </div>
                {paymentType === 'partial' && (
                  <div className="bfm-summary-row bfm-remaining">
                    <span>Remaining balance:</span>
                    <span>{currencySymbol}{formatCurrency(totalAmount - partialAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="bfm-actions">
              <button
                type="submit"
                disabled={localLoading}
                className="bfm-submit-btn"
                style={{ flex: 1 }}
              >
                {localLoading ? 'PROCESSING...' : 'CONFIRM BOOKING'}
              </button>
            </div>

          </div>
        </form>
      </div>

      <CustomConfirmModal
        isOpen={showConfirmModal}
        title="Confirm Your Transfer Booking"
        message={`Are you sure you want to book ${transfer.activity}? You will be redirected to the payment page.`}
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