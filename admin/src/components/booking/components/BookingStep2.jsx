import React from 'react';
import HotelRoomSelector from './hotelRoomSelector';

const BookingStep2 = ({
  // Hotel
  hotelData,
  selectedRoomType, setSelectedRoomType,
  paxCount,
  selectedPackage,
  getDurationDays,

  // Promo
  promoCode, setPromoCode,
  appliedPromo,
  promoError,
  isCheckingPromo,
  handleApplyPromo,
  handleRemovePromo,

  // Payment
  formData,
  updateField,
  payableAmount,
  computeFinalTotal,
  calculateBasePackageTotal,
  calculateHotelTotal,
  calculateDiscount,
}) => (
  <div className="nbm-step-panel">
    <h3 className="nbm-step-title">Accommodation &amp; Payment</h3>
    <p className="nbm-step-subtitle">Choose hotel tier, apply promo, and review total.</p>

    <div className="nbm-card">

      {/* ── Hotel Room Selector ── */}
      <div style={{ marginBottom: '28px' }}>
        <h4 style={{ margin: '0 0 12px', fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>
          Choose Accommodation Tier
        </h4>

        {hotelData && hotelData.roomTypes && hotelData.roomTypes.length > 0 ? (
          <HotelRoomSelector
            roomTypes={hotelData.roomTypes}
            selectedRoomType={selectedRoomType}
            onRoomTypeChange={setSelectedRoomType}
            numberOfPax={paxCount}
            durationDays={getDurationDays(selectedPackage?.duration || '1D')}
            durationNights={getDurationDays(selectedPackage?.duration || '1D') - 1}
          />
        ) : (
          <div style={{
            padding: '20px', background: '#fefce8', borderRadius: '10px',
            color: '#854d0e', textAlign: 'center', fontWeight: 600,
          }}>
            No hotels available for this destination yet.
          </div>
        )}
      </div>

      {/* ── Promo Code ── */}
      <div className="nbm-field">
        <label>
          Promo Code{' '}
          <span style={{ color: '#94a3b8', fontWeight: 400, fontSize: '0.85rem' }}>(optional)</span>
        </label>

        {!appliedPromo ? (
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ flex: 1 }}
              value={promoCode}
              onChange={e => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Enter promo code"
              onKeyPress={e => { if (e.key === 'Enter') handleApplyPromo(); }}
            />
            <button
              onClick={handleApplyPromo}
              disabled={isCheckingPromo || !selectedPackage || paxCount < 4}
              style={{
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #f59e0b, #fc9c1b)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: (isCheckingPromo || !selectedPackage || paxCount < 4) ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: (isCheckingPromo || !selectedPackage || paxCount < 4) ? 0.6 : 1,
              }}
            >
              {isCheckingPromo ? 'Checking...' : 'Apply'}
            </button>
          </div>
        ) : (
          <div style={{
            background: '#f0fdf4', border: '2px solid #10b981',
            borderRadius: '12px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: '#166534', fontSize: '1.1rem' }}>
                {appliedPromo.code}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#166534' }}>
                {appliedPromo.discountType === 'Percentage'
                  ? `${appliedPromo.pricing?.local || appliedPromo.discountValue}% off per pax`
                  : `₱${(appliedPromo.pricing?.local || appliedPromo.discountValue).toLocaleString()} off per pax`}
              </div>
            </div>
            <button
              onClick={handleRemovePromo}
              style={{
                background: '#ef4444', color: 'white', border: 'none',
                padding: '8px 20px', borderRadius: '8px',
                fontSize: '0.9rem', cursor: 'pointer', fontWeight: 600,
              }}
            >
              Remove
            </button>
          </div>
        )}

        {/* 4-pax requirement warning */}
        {selectedPackage && paxCount < 4 && !appliedPromo && (
          <div style={{
            color: '#f59e0b', fontSize: '0.82rem', marginTop: '8px',
            padding: '8px 12px', background: '#fffbeb',
            borderRadius: '8px', border: '1px solid #fde047',
          }}>
            ⚠️ This promo code requires a minimum of <strong>4 pax</strong>
          </div>
        )}

        {promoError && (
          <div style={{
            color: '#ef4444', fontSize: '0.85rem', marginTop: '8px',
            padding: '10px', background: '#fee2e2', borderRadius: '8px',
          }}>
            ❌ {promoError}
          </div>
        )}
      </div>

      {/* ── Payment Type ── */}
      <div className="nbm-field" style={{ marginTop: '20px' }}>
        <label>Payment Type</label>
        <select
          value={formData.paymentType}
          onChange={e => updateField('paymentType', e.target.value)}
        >
          <option value="full">Pay in Full</option>
          <option value="partial">Partial Payment</option>
        </select>
      </div>

      {formData.paymentType === 'partial' && (
        <div className="nbm-field" style={{ marginTop: '12px' }}>
          <label>
            Initial Payment Amount (₱)
            <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600 }}>
              {' '}— 50% of Total (auto)
            </span>
          </label>
          <input
            type="number"
            value={formData.initialPaymentAmount}
            readOnly
            style={{ backgroundColor: '#f8fafc', color: '#0f172a', cursor: 'not-allowed' }}
          />
        </div>
      )}
    </div>

    {/* ── Total Summary ── */}
    <div className="nbm-total-box">
      <div className="nbm-total-row">
        <span>Package Total</span>
        <span>₱{calculateBasePackageTotal().toLocaleString()}</span>
      </div>

      {appliedPromo && (
        <div className="nbm-total-row" style={{ color: '#10b981', fontSize: '0.95rem' }}>
          <span>- Promo Discount ({appliedPromo.code})</span>
          <span>-₱{calculateDiscount().toLocaleString()}</span>
        </div>
      )}

      {selectedRoomType && (
        <div className="nbm-total-row" style={{ fontSize: '0.95rem', color: '#64748b' }}>
          <span>Hotel Accommodation</span>
          <span>₱{calculateHotelTotal().toLocaleString()}</span>
        </div>
      )}

      <div className="nbm-total-row nbm-total-final">
        <strong>
          {formData.paymentType === 'partial' ? 'INITIAL PAYMENT DUE NOW (50%)' : 'FINAL TOTAL'}
        </strong>
        <strong>₱{payableAmount.toLocaleString()}</strong>
      </div>

      {formData.paymentType === 'partial' && (
        <p style={{
          textAlign: 'right', fontSize: '0.85rem',
          color: '#64748b', marginTop: '8px', fontWeight: 600,
        }}>
          (50% deposit • Balance ₱{(computeFinalTotal() - payableAmount).toLocaleString()} due before departure)
        </p>
      )}
    </div>
  </div>
);

export default BookingStep2;
