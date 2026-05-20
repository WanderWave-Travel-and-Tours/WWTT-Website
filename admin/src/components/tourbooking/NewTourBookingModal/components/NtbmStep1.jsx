import React from 'react';
import { MapPin, Users, CreditCard, Wallet } from 'lucide-react';
import TourCard from './TourCard';
import PassengerCard from './PassengerCard';

const NtbmStep1 = ({
  // Destination
  destinations,
  filteredTours,
  selectedDestination,
  setSelectedDestination,
  selectedTour,
  setSelectedTour,
  destDropdownOpen,
  setDestDropdownOpen,
  destRef,

  // Trip config
  paxCount,
  setPaxCount,
  departureDate,
  handleDepartureDateChange,

  // Payment
  paymentType,
  setPaymentType,

  // Passengers
  passengers,
  updatePassenger,
  handleDobPartChange,

  // Pricing
  packageTotal,
  payableAmount,
  initialPaymentAmount,

  // Helpers
  getDurationDays,
  computeEndDate,
  isDateTodayOrTomorrow,
}) => {
  const filteredDests = destinations.filter(d =>
    d.toLowerCase().includes(selectedDestination.toLowerCase())
  );

  return (
    <>
      {/* ── SECTION: Trip Details ── */}
      <div className="ntbm-section-label">
        <MapPin size={15} /> Trip Details
      </div>

      <div className="ntbm-card" style={{ marginBottom: '20px' }}>

        {/* Destination searchable input */}
        <div className="ntbm-field" ref={destRef}>
          <label>Destination <span style={{ color: '#ef4444' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="ntbm-input"
              value={selectedDestination}
              onChange={e => {
                setSelectedDestination(e.target.value);
                setDestDropdownOpen(true);
                setSelectedTour(null);
              }}
              onFocus={() => setDestDropdownOpen(true)}
              placeholder="Type to search destination..."
            />

            {destDropdownOpen && selectedDestination && filteredDests.length > 0 && (
              <div className="ntbm-dest-dropdown">
                {filteredDests.map(d => (
                  <div
                    key={d}
                    className="ntbm-dest-option"
                    onMouseDown={() => {
                      setSelectedDestination(d);
                      setSelectedTour(null);
                      setDestDropdownOpen(false);
                    }}
                  >
                    📍 {d}
                  </div>
                ))}
              </div>
            )}

            {destDropdownOpen && selectedDestination && filteredDests.length === 0 && (
              <div className="ntbm-dest-dropdown">
                <div style={{ padding: '14px 16px', color: '#94a3b8', fontSize: '0.9rem' }}>
                  No destinations found
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tour package list */}
        {selectedDestination && filteredTours.length > 0 && (
          <div className="ntbm-field" style={{ marginTop: '16px' }}>
            <label>Tour Package <span style={{ color: '#ef4444' }}>*</span></label>
            <div className="ntbm-tour-grid">
              {filteredTours.map(tour => (
                <TourCard
                  key={tour._id}
                  tour={tour}
                  isSelected={selectedTour?._id === tour._id}
                  onSelect={setSelectedTour}
                />
              ))}
            </div>
          </div>
        )}

        {selectedDestination && filteredTours.length === 0 && (
          <div style={{
            marginTop: '16px',
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            textAlign: 'center',
            color: '#94a3b8',
            border: '1.5px dashed #e2e8f0',
            fontSize: '0.9rem',
          }}>
            No active tours found for <strong>{selectedDestination}</strong>
          </div>
        )}
      </div>

      {/* ── SECTION: Trip Configuration (shown when a tour is selected) ── */}
      {selectedTour && (
        <>
          <div className="ntbm-section-label">
            <Users size={15} /> Trip Configuration
          </div>

          <div className="ntbm-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

              {/* Pax counter */}
              <div>
                <label className="ntbm-field-label">Number of Pax</label>
                <div className="ntbm-pax-row">
                  <button
                    className="ntbm-pax-btn"
                    onClick={() => { if (paxCount > 1) setPaxCount(p => p - 1); }}
                    disabled={paxCount <= 1}
                  >−</button>
                  <span className="ntbm-pax-count">{paxCount}</span>
                  <button
                    className="ntbm-pax-btn"
                    onClick={() => setPaxCount(p => p + 1)}
                  >+</button>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#94a3b8' }}>
                  Total: ₱{(selectedTour.price * paxCount).toLocaleString()}
                </div>
              </div>

              {/* Departure date */}
              <div>
                <label className="ntbm-field-label">
                  Departure Date <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  className="ntbm-input"
                  value={departureDate}
                  onChange={e => handleDepartureDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            {/* Date preview */}
            {departureDate && selectedTour && (
              <div className="ntbm-date-preview">
                <div className="ntbm-date-preview-item">
                  <span className="ntbm-date-preview-emoji">✈️</span>
                  <div>
                    <div className="ntbm-date-preview-lbl">Departure</div>
                    <div className="ntbm-date-preview-val">{departureDate}</div>
                  </div>
                </div>
                <div style={{ color: '#f59e0b', fontSize: '1.4rem', fontWeight: 300 }}>→</div>
                <div className="ntbm-date-preview-item">
                  <span className="ntbm-date-preview-emoji">🏠</span>
                  <div>
                    <div className="ntbm-date-preview-lbl">Return</div>
                    <div className="ntbm-date-preview-val">{computeEndDate()}</div>
                  </div>
                </div>
                <div className="ntbm-duration-chip">
                  {selectedTour.duration} • {getDurationDays(selectedTour.duration)} day
                  {getDurationDays(selectedTour.duration) > 1 ? 's' : ''}
                </div>
              </div>
            )}
          </div>

          {/* ── SECTION: Payment Option ── */}
          <div className="ntbm-section-label">
            <CreditCard size={15} /> Payment Option
          </div>

          <div className="bfm-payment-section">
            <div className="bfm-payment-header">
              <Wallet size={20} />
              <h3>Choose Payment Method</h3>
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
                    <span>Pay in Full</span>
                    <span className="bfm-recommended-badge">Recommended</span>
                  </div>
                </div>
                <div className="bfm-payment-card-body">
                  <div className="bfm-payment-amount">
                    ₱{packageTotal.toLocaleString()}
                    <span className="bfm-payment-percentage">100%</span>
                  </div>
                  <div className="bfm-payment-description">
                    Pay the full amount now and enjoy hassle-free travel.
                  </div>
                  <ul className="bfm-payment-benefits">
                    <li>✅ No balance to settle</li>
                    <li>✅ Guaranteed booking confirmation</li>
                    <li>✅ Peace of mind before your trip</li>
                  </ul>
                </div>
              </div>

              {/* Partial Payment (hidden for today/tomorrow) */}
              {!isDateTodayOrTomorrow() && (
                <div
                  className={`bfm-payment-card ${paymentType === 'partial' ? 'active' : ''}`}
                  onClick={() => setPaymentType('partial')}
                >
                  <div className="bfm-payment-card-header">
                    <div className="bfm-payment-radio">
                      <div className={`bfm-radio-dot ${paymentType === 'partial' ? 'active' : ''}`} />
                    </div>
                    <div className="bfm-payment-card-title">
                      <Wallet size={18} />
                      <span>Partial Payment</span>
                      <span className="bfm-flexible-badge">Flexible</span>
                    </div>
                  </div>
                  <div className="bfm-payment-card-body">
                    <div className="bfm-payment-amount">
                      ₱{Math.round(packageTotal / 2).toLocaleString()}
                      <span className="bfm-payment-percentage">50% deposit</span>
                    </div>
                    <div className="bfm-payment-description">
                      Pay a 50% deposit now, settle the rest before departure.
                    </div>
                    {paymentType === 'partial' ? (
                      <div className="bfm-payment-breakdown">
                        <div className="bfm-breakdown-row">
                          <span>Due now (50%)</span>
                          <strong>₱{Math.round(packageTotal / 2).toLocaleString()}</strong>
                        </div>
                        <div className="bfm-breakdown-row">
                          <span>Balance before departure</span>
                          <strong>₱{(packageTotal - Math.round(packageTotal / 2)).toLocaleString()}</strong>
                        </div>
                      </div>
                    ) : (
                      <ul className="bfm-payment-benefits">
                        <li>💳 Spread your payment</li>
                        <li>💳 Reserve your slot now</li>
                        <li>💳 Balance due before departure</li>
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Notice for today/tomorrow departures */}
            {isDateTodayOrTomorrow() && (
              <div style={{
                marginTop: '10px',
                padding: '10px 14px',
                background: '#fefce8',
                border: '1.5px solid #fcd34d',
                borderRadius: '10px',
                fontSize: '0.85rem',
                color: '#92400e',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                ⚠️ Partial payment is not available for bookings departing today or tomorrow. Full payment is required.
              </div>
            )}

            {/* Payment summary */}
            <div className="bfm-payment-summary">
              <div className="bfm-summary-row">
                <span>Tour Price (×{paxCount} pax)</span>
                <span style={{ color: '#374151', fontWeight: 700 }}>
                  ₱{packageTotal.toLocaleString()}
                </span>
              </div>
              <div className="bfm-summary-row">
                <span>{paymentType === 'partial' ? 'Initial Payment Due Now' : 'Total Amount Due'}</span>
                <span className="bfm-amount-highlight">₱{payableAmount.toLocaleString()}</span>
              </div>
              {paymentType === 'partial' && (
                <div className="bfm-summary-row bfm-remaining">
                  <span>Remaining Balance</span>
                  <span>₱{(packageTotal - initialPaymentAmount).toLocaleString()} due before departure</span>
                </div>
              )}
            </div>
          </div>

          {/* ── SECTION: Passengers ── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            marginTop: '20px',
          }}>
            <div className="ntbm-section-label" style={{ margin: 0 }}>
              <Users size={15} /> Passengers
            </div>
            <button
              className="ntbm-btn-add-passenger"
              onClick={() => setPaxCount(p => p + 1)}
            >
              + Add Passenger
            </button>
          </div>

          {passengers.map((p, i) => (
            <PassengerCard
              key={i}
              passenger={p}
              index={i}
              total={passengers.length}
              onUpdate={updatePassenger}
              onDobChange={handleDobPartChange}
              onRemove={() => { if (paxCount > 1) setPaxCount(c => c - 1); }}
            />
          ))}
        </>
      )}
    </>
  );
};

export default NtbmStep1;
