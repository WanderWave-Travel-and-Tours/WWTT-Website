import React from 'react';
import './PricingCalculator.css';

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

const PricingCalculator = ({ 
    supplierRate, 
    handleSupplierRateChange, 
    markupValue, 
    handleMarkupChange, 
    markupType, 
    toggleMarkupType, 
    price,
    // Pax Mode Props
    paxMode,
    onPaxModeChange,
    tourType,
    pax,
    minPax,
    // ✅ Solo and Multiple Pax Price Props
    soloPaxPrice,
    handleSoloPaxPriceChange,
    multiplePaxPrice,
    handleMultiplePaxPriceChange,
}) => {
    
    const supplierRateNum = parseFloat(supplierRate) || 0;
    const markupValueNum = parseFloat(markupValue) || 0;
    let markupInPeso = 0;
    
    if (markupType === "percentage") {
        markupInPeso = (supplierRateNum * markupValueNum) / 100;
    } else {
        markupInPeso = markupValueNum;
    }
    
    const formattedMarkupInPeso = Number(markupInPeso).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    // Compute current multiplier for display
    // Solo = ×1 (base price for 1 person), Multiple = ×actual pax count from Basic Info
    const currentMultiplier = paxMode === 'solo'
        ? 1
        : (tourType === 'private' ? parseInt(pax) || 1 : parseInt(minPax) || 1);

    // Pax label for hint text
    const paxLabel = tourType === 'private'
        ? (pax ? `${pax} pax (Private)` : '— pax (set in Basic Info)')
        : (minPax ? `${minPax} min pax (Joiners)` : '— pax (set in Basic Info)');

    // Per-pax base amount for breakdown display
    const perPaxAmount = supplierRateNum + markupInPeso;

    return (
        <section className="apkg-section">
            <h2 className="apkg-section-title">PRICING</h2>
            <div className="apkg-pricing-layout">

                {/* PAX MODE TOGGLE */}
                <div className="apkg-field">
                    <label className="apkg-pax-mode-label">
                        Pricing Mode
                    </label>
                    <div className="apkg-pax-mode-toggle">
                        <button
                            type="button"
                            className={`apkg-pax-btn ${paxMode === 'solo' ? 'active' : ''}`}
                            onClick={() => onPaxModeChange('solo')}
                        >
                            <span className="apkg-pax-icon">👤</span>
                            <span className="apkg-pax-text">Solo</span>
                        </button>
                        <button
                            type="button"
                            className={`apkg-pax-btn ${paxMode === 'multiple' ? 'active' : ''}`}
                            onClick={() => onPaxModeChange('multiple')}
                        >
                            <span className="apkg-pax-icon">👥</span>
                            <span className="apkg-pax-text">Multiple Pax</span>
                        </button>
                    </div>
                    <span className="apkg-pax-hint">
                        {paxMode === 'solo'
                            ? '💡 Solo rate — base price for a single person booking (×1)'
                            : `📋 Based on ${paxLabel} from Basic Info`
                        }
                    </span>
                </div>

                <div className="apkg-pricing-inputs">
                    <div className="apkg-field">
                        <label>Supplier Rate (PHP)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={supplierRate}
                            onChange={handleSupplierRateChange}
                            onWheel={(e) => e.target.blur()}
                            required
                            step="0.01"
                            min="0"
                        />
                    </div>
                    <div className="apkg-field">
                        <label>
                            Markup 
                            <span className={`apkg-markup-badge apkg-markup-badge--${markupType}`}>
                                {markupType === "percentage" ? "% MODE" : "₱ PESO MODE"}
                            </span>
                        </label>
                        <div className="apkg-field-with-toggle">
                            <input
                                type="number"
                                placeholder={
                                    markupType === "percentage" ? "Enter %" : "Enter peso amount"
                                }
                                value={markupValue}
                                onChange={handleMarkupChange}
                                onWheel={(e) => e.target.blur()}
                                required
                                step="0.01"
                                min="0"
                                max={
                                    markupType === "percentage" ? "100" : undefined
                                }
                            />
                            <button
                                type="button"
                                className="apkg-toggle-markup"
                                onClick={toggleMarkupType}
                                title={`Switch to ${
                                    markupType === "percentage" ? "Peso" : "Percentage"
                                }`}
                            >
                                <IconCurrencyToggle />
                            </button>
                        </div>
                    </div>
                </div>

                {/* ✅ PAX PRICING SECTION — Solo and Multiple Pax selling price input fields only */}
                <div className="apkg-pax-price-section">
                    <div className="apkg-pax-price-header">
                        <span className="apkg-pax-price-title">PAX PRICING</span>
                        <span className="apkg-pax-price-subtitle">Set the selling price per booking type</span>
                    </div>
                    <div className="apkg-pax-price-inputs">
                        {/* ✅ Solo Pax Price — custom price for 1-person booking */}
                        <div className="apkg-field">
                            <label className="apkg-pax-price-label">
                                <span className="apkg-pax-price-icon">👤</span>
                                Solo Pax Price (PHP)
                            </label>
                            <input
                                type="number"
                                placeholder="Price for 1 person"
                                value={soloPaxPrice}
                                onChange={handleSoloPaxPriceChange}
                                onWheel={(e) => e.target.blur()}
                                step="0.01"
                                min="0"
                            />
                        </div>
                        {/* ✅ Multiple Pax Price — custom price for group/multi-person booking */}
                        <div className="apkg-field">
                            <label className="apkg-pax-price-label">
                                <span className="apkg-pax-price-icon">👥</span>
                                Multiple Pax Price (PHP)
                            </label>
                            <input
                                type="number"
                                placeholder="Price for group booking"
                                value={multiplePaxPrice}
                                onChange={handleMultiplePaxPriceChange}
                                onWheel={(e) => e.target.blur()}
                                step="0.01"
                                min="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="apkg-total-price-box">
                    <div className="apkg-total-price-content">
                        <div className="apkg-total-price-label">
                            <IconPeso />
                            TOTAL SELLING PRICE
                        </div>
                        <div className="apkg-total-price-amount">
                            ₱
                            {price
                                ? Number(price).toLocaleString("en-US", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                  })
                                : "0.00"}
                        </div>

                        {/* BREAKDOWN: Shows multiplier */}
                        <div className="apkg-total-price-breakdown">
                            {supplierRate && markupValue ? (
                                <>
                                    <span>
                                        (₱{Number(supplierRate).toLocaleString()}
                                    </span>
                                    <span className="apkg-plus">+</span>
                                    <span>
                                        {markupType === "percentage"
                                            ? `${markupValue}% / ₱${formattedMarkupInPeso})`
                                            : `₱${Number(markupValue).toLocaleString()})`}
                                    </span>
                                    <span className="apkg-plus">×</span>
                                    <span className="apkg-multiplier-badge">
                                        {currentMultiplier} {paxMode === 'solo' ? 'solo' : 'pax'}
                                    </span>
                                </>
                            ) : supplierRate ? (
                                <>
                                    <span>
                                        ₱{Number(supplierRate).toLocaleString()}
                                    </span>
                                    <span className="apkg-plus">×</span>
                                    <span className="apkg-multiplier-badge">
                                        {currentMultiplier} {paxMode === 'solo' ? 'solo' : 'pax'}
                                    </span>
                                </>
                            ) : (
                                <span className="apkg-breakdown-empty">
                                    Enter supplier rate and markup to calculate
                                </span>
                            )}
                        </div>

                        {/* Per-pax note */}
                        {supplierRate && perPaxAmount > 0 && (
                            <div className="apkg-per-pax-note">
                                ₱{perPaxAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} base rate × {currentMultiplier} {paxMode === 'solo' ? '(solo ×1)' : `pax`}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingCalculator;