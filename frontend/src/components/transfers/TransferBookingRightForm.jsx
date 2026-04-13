// src/components/Transfers/TransferBookingRightForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, MessageCircle, Car } from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import TransferBookingFormModal from './TransferBookingFormModal';
import '../packageDeals/BookingRightForm.css'; // reuse same styles

const TransferBookingRightForm = ({
  transfer,
  currency = 'PHP',
  exchangeRate = 58,
  onPassengerCountChange = null,
  currentUser = null,
}) => {
  const navigate = useNavigate();
  const toast    = useToast();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  // ── Passenger count ───────────────────────────────────────────────────────
  // Parse max pax from transfer.pax e.g. "1-2" → max = 2, "3-4" → max = 4, "10+" → max = 20
  const parseMaxPax = (paxStr) => {
    if (!paxStr) return 10;
    if (paxStr.includes('+')) return 20;
    const parts = paxStr.split('-').map(Number);
    return parts[parts.length - 1] || 10;
  };
  const maxPax = parseMaxPax(transfer.pax);

  const [passengerCount, setPassengerCount] = useState(1);
  const [showModal,      setShowModal]      = useState(false);

  // ── Transfer detail form state (lifted so RightForm controls & passes to modal) ──
  const [travelDate,      setTravelDate]      = useState('');
  const [pickupTime,      setPickupTime]      = useState('');
  const [pickupLocation,  setPickupLocation]  = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [paymentType,     setPaymentType]     = useState('full');

  const updatePassengerCount = (val) => {
    const newVal = Math.max(1, Math.min(maxPax, val));
    setPassengerCount(newVal);
    if (onPassengerCountChange) onPassengerCountChange(newVal);
  };

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice   = (phpPrice) => currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;

  const basePrice      = transfer.sellingPrice || 0;
  const totalAmount    = convertPrice(basePrice) * passengerCount;
  const partialAmount  = Math.round(totalAmount * 0.5 * 100) / 100;

  const formatCurrency = (amount) => amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });

  const handleBookClick = () => {
    setPassengerStep_unused(1); // reset
    setShowModal(true);
  };

  // dummy — keeps the same pattern as tour booking
  const [, setPassengerStep_unused] = useState(1);

  const handleContactSales = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Contact Sales',
      message: 'You will be redirected to our chat support. Continue?',
      onConfirm: () => {
        closeConfirmModal();
        if (typeof window.openGHLChat === 'function') window.openGHLChat();
      },
    });
  };

  return (
    <div className="brf-container">
      <div className="brf-header">
        <div className="brf-header-icon"><Car size={24} color="#FF8C00" /></div>
        <div>
          <h2 className="brf-package-name">{transfer.activity}</h2>
          <p className="brf-package-destination" style={{ color: '#64748b', fontSize: '0.9rem', margin: '4px 0 0' }}>
            {transfer.destination}
          </p>
        </div>
      </div>

      {/* ── Supplier & Pax info ────────────────────────────────────────────── */}
      {(transfer.supplierName || transfer.pax) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {transfer.supplierName && (
            <span style={{ background: '#FF8C00', color: '#fff', fontSize: '0.72rem', fontWeight: '800', padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {transfer.supplierName}
            </span>
          )}
          {transfer.pax && (
            <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem', fontWeight: '600', padding: '3px 10px', borderRadius: '20px' }}>
              {transfer.pax} pax capacity
            </span>
          )}
        </div>
      )}

      {/* ── Price per unit ─────────────────────────────────────────────────── */}
      <div className="brf-section">
        <div className="brf-section-title">Price</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
          <span style={{ color: '#64748b', fontSize: '0.95rem' }}>Per unit ({transfer.pax || '1'} pax)</span>
          <span style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FF8C00' }}>
            {currencySymbol}{formatCurrency(convertPrice(basePrice))}
          </span>
        </div>
      </div>

      {/* ── Passenger Count ────────────────────────────────────────────────── */}
      <div className="brf-section">
        <div className="brf-section-title">Number of Passengers</div>
        <div className="brf-pax-row">
          <div className="brf-pax-item">
            <span className="brf-pax-label">Passengers</span>
            <div className="brf-qty-control">
              <button
                type="button"
                className="brf-qty-btn"
                onClick={() => updatePassengerCount(passengerCount - 1)}
                disabled={passengerCount <= 1}
              >
                <Minus size={16} />
              </button>
              <span className="brf-qty-value">{passengerCount}</span>
              <button
                type="button"
                className="brf-qty-btn"
                onClick={() => updatePassengerCount(passengerCount + 1)}
                disabled={passengerCount >= maxPax}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
        {transfer.pax && (
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '4px 0 0', textAlign: 'center' }}>
            Max capacity: {transfer.pax} pax per vehicle
          </p>
        )}
      </div>

      {/* ── Price Summary + CTA ───────────────────────────────────────────── */}
      <div className="brf-booking-footer">
        <div className="brf-total-row">
          <span className="brf-total-label">
            {currencySymbol}{formatCurrency(convertPrice(basePrice))} × {passengerCount} pax
          </span>
          <span className="brf-total-amount" style={{ color: '#10b981' }}>
            {currencySymbol}{formatCurrency(totalAmount)}
          </span>
        </div>

        <div className="brf-total-row" style={{ borderTop: '2px solid #FF8C00', paddingTop: '12px', marginTop: '8px', fontSize: '1.1rem', fontWeight: '800', color: '#1f2937' }}>
          <span>TOTAL AMOUNT</span>
          <span style={{ color: '#FF8C00' }}>
            {currencySymbol}{formatCurrency(totalAmount)}
          </span>
        </div>

        <button
          className="brf-book-now-btn"
          onClick={handleBookClick}
          style={{ background: '#FF8C00', borderColor: '#FF8C00' }}
        >
          Book This Transfer
        </button>

        <button className="brf-contact-sales-btn" onClick={handleContactSales}>
          <MessageCircle size={20} /> Contact Sales
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#9ca3af', marginTop: '12px' }}>
          No payment required today until you confirm.
        </p>
      </div>

      {/* ── Booking Form Modal ────────────────────────────────────────────── */}
      <TransferBookingFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        transfer={transfer}
        travelDate={travelDate}       setTravelDate={setTravelDate}
        pickupTime={pickupTime}       setPickupTime={setPickupTime}
        pickupLocation={pickupLocation}   setPickupLocation={setPickupLocation}
        dropoffLocation={dropoffLocation} setDropoffLocation={setDropoffLocation}
        specialRequests={specialRequests} setSpecialRequests={setSpecialRequests}
        passengerCount={passengerCount}
        totalAmount={totalAmount}
        partialAmount={partialAmount}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        currency={currency}
        exchangeRate={exchangeRate}
        currencySymbol={currencySymbol}
      />

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
