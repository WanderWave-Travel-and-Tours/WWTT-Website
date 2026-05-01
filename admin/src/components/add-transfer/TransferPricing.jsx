import React from 'react';
import './TransferPricing.css';

const IconCurrencyToggle = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8V20M17 20L21 16M17 20L13 16" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPeso = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TransferPricing = ({
  // One Way
  oneWaySupplierRate,
  handleOneWaySupplierRateChange,
  oneWayMarkupValue,
  handleOneWayMarkupChange,
  oneWayMarkupType,
  toggleOneWayMarkupType,
  oneWayPrice,
  // Roundtrip
  roundtripSupplierRate,
  handleRoundtripSupplierRateChange,
  roundtripMarkupValue,
  handleRoundtripMarkupChange,
  roundtripMarkupType,
  toggleRoundtripMarkupType,
  roundtripPrice,
}) => {

  const oneWaySupplierNum = parseFloat(oneWaySupplierRate) || 0;
  const oneWayMarkupNum = parseFloat(oneWayMarkupValue) || 0;
  const oneWayMarkupInPeso = oneWayMarkupType === 'percentage'
    ? (oneWaySupplierNum * oneWayMarkupNum) / 100
    : oneWayMarkupNum;

  const roundtripSupplierNum = parseFloat(roundtripSupplierRate) || 0;
  const roundtripMarkupNum = parseFloat(roundtripMarkupValue) || 0;
  const roundtripMarkupInPeso = roundtripMarkupType === 'percentage'
    ? (roundtripSupplierNum * roundtripMarkupNum) / 100
    : roundtripMarkupNum;

  return (
    <section className="atrn-section">
      <h2 className="atrn-section-title">TRANSFER PRICING</h2>
      <div className="atrn-pricing-layout">

        {/* ── ONE WAY ── */}
        <div className="atrn-trip-card">
          <div className="atrn-trip-card-header">
            <span className="atrn-trip-icon">🚗</span>
            <div>
              <span className="atrn-trip-card-label">ONE WAY</span>
              <span className="atrn-trip-card-sub">Single direction transfer</span>
            </div>
          </div>

          <div className="atrn-pricing-inputs">
            <div className="atrn-field">
              <label>Supplier Rate (PHP)</label>
              <input
                type="number"
                placeholder="0.00"
                value={oneWaySupplierRate}
                onChange={handleOneWaySupplierRateChange}
                onWheel={(e) => e.target.blur()}
                step="0.01"
                min="0"
              />
            </div>
            <div className="atrn-field">
              <label>
                Markup
                <span className={`atrn-markup-badge atrn-markup-badge--${oneWayMarkupType}`}>
                  {oneWayMarkupType === 'percentage' ? '% MODE' : '₱ PESO MODE'}
                </span>
              </label>
              <div className="atrn-field-with-toggle">
                <input
                  type="number"
                  placeholder={oneWayMarkupType === 'percentage' ? 'Enter %' : 'Enter peso amount'}
                  value={oneWayMarkupValue}
                  onChange={handleOneWayMarkupChange}
                  onWheel={(e) => e.target.blur()}
                  step="0.01"
                  min="0"
                  max={oneWayMarkupType === 'percentage' ? '100' : undefined}
                />
                <button
                  type="button"
                  className="atrn-toggle-markup"
                  onClick={toggleOneWayMarkupType}
                  title={`Switch to ${oneWayMarkupType === 'percentage' ? 'Peso' : 'Percentage'}`}
                >
                  <IconCurrencyToggle />
                </button>
              </div>
            </div>
          </div>

          {/* One Way Total Box */}
          <div className="atrn-trip-total-box">
            <div className="atrn-trip-total-label">
              <IconPeso />
              ONE WAY SELLING PRICE
            </div>
            <div className="atrn-trip-total-amount">
              ₱{oneWayPrice
                ? Number(oneWayPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'}
            </div>
            {oneWaySupplierNum > 0 && (
              <div className="atrn-trip-total-breakdown">
                ₱{oneWaySupplierNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} supplier
                {' + '}₱{oneWayMarkupInPeso.toLocaleString('en-US', { minimumFractionDigits: 2 })} markup
                {oneWayMarkupType === 'percentage' && oneWayMarkupNum > 0 && (
                  <span> ({oneWayMarkupNum}%)</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── ROUNDTRIP ── */}
        <div className="atrn-trip-card">
          <div className="atrn-trip-card-header">
            <span className="atrn-trip-icon">🔄</span>
            <div>
              <span className="atrn-trip-card-label">ROUNDTRIP</span>
              <span className="atrn-trip-card-sub">Both directions included</span>
            </div>
          </div>

          <div className="atrn-pricing-inputs">
            <div className="atrn-field">
              <label>Supplier Rate (PHP)</label>
              <input
                type="number"
                placeholder="0.00"
                value={roundtripSupplierRate}
                onChange={handleRoundtripSupplierRateChange}
                onWheel={(e) => e.target.blur()}
                step="0.01"
                min="0"
              />
            </div>
            <div className="atrn-field">
              <label>
                Markup
                <span className={`atrn-markup-badge atrn-markup-badge--${roundtripMarkupType}`}>
                  {roundtripMarkupType === 'percentage' ? '% MODE' : '₱ PESO MODE'}
                </span>
              </label>
              <div className="atrn-field-with-toggle">
                <input
                  type="number"
                  placeholder={roundtripMarkupType === 'percentage' ? 'Enter %' : 'Enter peso amount'}
                  value={roundtripMarkupValue}
                  onChange={handleRoundtripMarkupChange}
                  onWheel={(e) => e.target.blur()}
                  step="0.01"
                  min="0"
                  max={roundtripMarkupType === 'percentage' ? '100' : undefined}
                />
                <button
                  type="button"
                  className="atrn-toggle-markup"
                  onClick={toggleRoundtripMarkupType}
                  title={`Switch to ${roundtripMarkupType === 'percentage' ? 'Peso' : 'Percentage'}`}
                >
                  <IconCurrencyToggle />
                </button>
              </div>
            </div>
          </div>

          {/* Roundtrip Total Box */}
          <div className="atrn-trip-total-box atrn-trip-total-box--roundtrip">
            <div className="atrn-trip-total-label">
              <IconPeso />
              ROUNDTRIP SELLING PRICE
            </div>
            <div className="atrn-trip-total-amount">
              ₱{roundtripPrice
                ? Number(roundtripPrice).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : '0.00'}
            </div>
            {roundtripSupplierNum > 0 && (
              <div className="atrn-trip-total-breakdown">
                ₱{roundtripSupplierNum.toLocaleString('en-US', { minimumFractionDigits: 2 })} supplier
                {' + '}₱{roundtripMarkupInPeso.toLocaleString('en-US', { minimumFractionDigits: 2 })} markup
                {roundtripMarkupType === 'percentage' && roundtripMarkupNum > 0 && (
                  <span> ({roundtripMarkupNum}%)</span>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
};

export default TransferPricing;
