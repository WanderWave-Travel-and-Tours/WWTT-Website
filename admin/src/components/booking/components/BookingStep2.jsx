import React from 'react';
import { CreditCard, Wallet } from 'lucide-react';
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
      <div style={{ marginTop: '20px' }}>
        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, color: '#374151', marginBottom: '10px' }}>
          Payment Option
        </label>

        <div className="tbfm-payment-options">
          {/* Full Payment */}
          <div
            className={`tbfm-payment-card ${formData.paymentType === 'full' ? 'active' : ''}`}
            onClick={() => updateField('paymentType', 'full')}
          >
            <div className="tbfm-payment-card-header">
              <div className="tbfm-payment-radio">
                <div className={`tbfm-radio-dot ${formData.paymentType === 'full' ? 'active' : ''}`} />
              </div>
              <div className="tbfm-payment-card-title">
                <CreditCard size={15} className="tbfm-card-icon" />
                <span>Pay in Full</span>
                <span className="tbfm-badge tbfm-badge-popular">Most Popular</span>
              </div>
            </div>
            <div className="tbfm-payment-card-body">
              <div className="tbfm-payment-amount">
                ₱{computeFinalTotal().toLocaleString()}
              </div>
              <p className="tbfm-payment-description">Complete payment now and secure your booking</p>
              <ul className="tbfm-payment-benefits">
                <li>Instant confirmation</li>
                <li>No further payments needed</li>
                <li>Priority processing</li>
              </ul>
            </div>
          </div>

          {/* Partial Payment */}
          <div
            className={`tbfm-payment-card ${formData.paymentType === 'partial' ? 'active' : ''}`}
            onClick={() => updateField('paymentType', 'partial')}
          >
            <div className="tbfm-payment-card-header">
              <div className="tbfm-payment-radio">
                <div className={`tbfm-radio-dot ${formData.paymentType === 'partial' ? 'active' : ''}`} />
              </div>
              <div className="tbfm-payment-card-title">
                <Wallet size={15} className="tbfm-card-icon" />
                <span>Partial Payment</span>
                <span className="tbfm-badge tbfm-badge-flexible">Flexible</span>
              </div>
            </div>
            <div className="tbfm-payment-card-body">
              <div className="tbfm-payment-amount">
                ₱{Math.round(computeFinalTotal() / 2).toLocaleString()}
                <span className="tbfm-payment-percentage">50% Down Payment</span>
              </div>
              <p className="tbfm-payment-description">Pay 50% now, remaining balance before departure</p>
              <div className="tbfm-payment-breakdown">
                <div className="tbfm-breakdown-row">
                  <span>Now (50%):</span>
                  <strong>₱{Math.round(computeFinalTotal() / 2).toLocaleString()}</strong>
                </div>
                <div className="tbfm-breakdown-row">
                  <span>Later (50%):</span>
                  <strong>₱{(computeFinalTotal() - Math.round(computeFinalTotal() / 2)).toLocaleString()}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="tbfm-payment-summary">
          <div className="tbfm-summary-row">
            <span>Amount to pay now:</span>
            <strong className="tbfm-amount-highlight">₱{payableAmount.toLocaleString()}</strong>
          </div>
          {formData.paymentType === 'partial' && (
            <div className="tbfm-summary-row tbfm-remaining">
              <span>Remaining balance:</span>
              <span>₱{(computeFinalTotal() - payableAmount).toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* ── Total Summary ── */}
    <div className="nbm-total-box">
      <div className="nbm-total-heading">Cost Breakdown</div>

      <div className="nbm-total-itemized">
        <div className="nbm-total-row">
          <span>Package Total</span>
          <span>₱{calculateBasePackageTotal().toLocaleString()}</span>
        </div>

        {appliedPromo && (
          <div className="nbm-total-row nbm-total-row-discount">
            <span>Promo Discount ({appliedPromo.code})</span>
            <span>-₱{calculateDiscount().toLocaleString()}</span>
          </div>
        )}

        {selectedRoomType && calculateHotelTotal() > 0 && (
          <div className="nbm-total-row">
            <span>Hotel Accommodation</span>
            <span>₱{calculateHotelTotal().toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="nbm-total-final">
        <span className="nbm-total-final-label">
          {formData.paymentType === 'partial' ? 'Initial Payment Due Now (50%)' : 'Final Total'}
        </span>
        <span className="nbm-total-final-amount">₱{payableAmount.toLocaleString()}</span>
      </div>

      {formData.paymentType === 'partial' && (
        <div className="nbm-total-note">
          50% deposit &bull; Balance ₱{(computeFinalTotal() - payableAmount).toLocaleString()} due before departure
        </div>
      )}
    </div>
  </div>
);

export default BookingStep2;
