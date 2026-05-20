import React from 'react';
import { CreditCard, Car, Clock } from 'lucide-react';

const PaymentStep = ({
  selectedTransfer, tripType, paxCount, travelDate,
  totalSurcharge, totalAmount,
  sellingPrice, arrivalSurcharge, departureSurcharge,
  initialPaymentAmount, remainingBalance,
  paymentType, setPaymentType,
  isPartialPaymentRestricted,
}) => {
  return (
    <>
      <h3 className="nbm-step-title">Payment Option</h3>
      <p className="nbm-step-subtitle">Choose how the customer will pay for this transfer booking.</p>

      {/* Price summary pill */}
      {selectedTransfer && (
        <div style={{
          background: 'linear-gradient(135deg, #fff9f0, #fefce8)',
          border: '2px solid #fcd34d', borderRadius: 12,
          padding: '12px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Car size={17} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                {selectedTransfer.title}
              </div>
              <div style={{ fontSize: '0.73rem', color: '#92400e' }}>
                {tripType === 'roundtrip' ? 'Roundtrip' : 'One Way'} · {paxCount} pax · {travelDate}
                {totalSurcharge > 0 && (
                  <span style={{ marginLeft: 6, color: '#dc2626', fontWeight: 700 }}>
                    · +₱{totalSurcharge.toLocaleString()} surcharge
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.25rem', color: '#f59e0b' }}>
            ₱{totalAmount.toLocaleString()}
          </div>
        </div>
      )}

      {/* Payment cards */}
      <div className="bfm-payment-section" style={{ marginTop: 0 }}>
        <div className="bfm-payment-header">
          <CreditCard size={22} />
          <h3>Select Payment Method</h3>
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
                <CreditCard size={18} />
                <span>Full Payment</span>
                <span className="bfm-recommended-badge">✓ Recommended</span>
              </div>
            </div>
            <div className="bfm-payment-card-body">
              <div className="bfm-payment-amount">
                ₱{totalAmount.toLocaleString()}
                <span className="bfm-payment-percentage">100%</span>
              </div>
              <div className="bfm-payment-description">Pay the full amount now and you're all set.</div>
              <ul className="bfm-payment-benefits">
                <li>Instant booking confirmation</li>
                <li>No balance to follow up</li>
              </ul>
            </div>
          </div>

          {/* Partial Payment */}
          {!isPartialPaymentRestricted && (
            <div
              className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
              onClick={() => setPaymentType('partial')}
            >
              <div className="bfm-payment-card-header">
                <div className="bfm-payment-radio">
                  <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                </div>
                <div className="bfm-payment-card-title">
                  <CreditCard size={18} />
                  <span>Partial Payment</span>
                  <span className="bfm-flexible-badge">Flexible</span>
                </div>
              </div>
              <div className="bfm-payment-card-body">
                <div className="bfm-payment-amount">
                  ₱{Math.round(totalAmount / 2).toLocaleString()}
                  <span className="bfm-payment-percentage">50%</span>
                </div>
                <div className="bfm-payment-description">Pay 50% now, settle balance before travel date.</div>
                {paymentType === 'partial' && (
                  <div className="bfm-payment-breakdown">
                    <div className="bfm-breakdown-row">
                      <span>Due Now (50%)</span>
                      <strong>₱{initialPaymentAmount.toLocaleString()}</strong>
                    </div>
                    <div className="bfm-breakdown-row">
                      <span>Balance Due</span>
                      <strong>₱{remainingBalance.toLocaleString()}</strong>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Partial payment restriction notice */}
        {isPartialPaymentRestricted && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            background: '#fefce8', border: '1.5px solid #fde68a',
            borderRadius: 12, padding: '12px 16px', marginTop: 12,
          }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>
              <Clock size={16} color="#f59e0b" />
            </span>
            <div style={{ fontSize: '0.85rem', color: '#92400e', lineHeight: 1.5 }}>
              <strong>Partial payment is not available</strong> for bookings with a travel date of{' '}
              <strong>today or tomorrow</strong>. Full payment is required.
            </div>
          </div>
        )}

        <div className="bfm-payment-summary">
          <div className="bfm-summary-row">
            <span>Base Transfer Price</span>
            <span>₱{sellingPrice.toLocaleString()}</span>
          </div>
          {arrivalSurcharge > 0 && (
            <div className="bfm-summary-row">
              <span>Late Night Surcharge (Arrival)</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>+₱{arrivalSurcharge.toLocaleString()}</span>
            </div>
          )}
          {departureSurcharge > 0 && (
            <div className="bfm-summary-row">
              <span>Late Night Surcharge (Departure)</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>+₱{departureSurcharge.toLocaleString()}</span>
            </div>
          )}
          <div className="bfm-summary-row">
            <span>Amount Due Now</span>
            <span className="bfm-amount-highlight">₱{initialPaymentAmount.toLocaleString()}</span>
          </div>
          {paymentType === 'partial' && (
            <div className="bfm-summary-row bfm-remaining">
              <span>Remaining Balance</span>
              <span>₱{remainingBalance.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PaymentStep;
