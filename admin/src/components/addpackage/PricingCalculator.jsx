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
    // ✅ Solo Pax Pricing Breakdown Props
    soloPaxPrice,
    soloSupplierRate,
    handleSoloSupplierRateChange,
    soloMarkupValue,
    handleSoloMarkupChange,
    soloMarkupType,
    toggleSoloMarkupType,
    // ✅ Multiple Pax Pricing Breakdown Props
    multiplePaxPrice,
    multipleSupplierRate,
    handleMultipleSupplierRateChange,
    multipleMarkupValue,
    handleMultipleMarkupChange,
    multipleMarkupType,
    toggleMultipleMarkupType,
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
    const currentMultiplier = paxMode === 'solo'
        ? 2
        : (tourType === 'private' ? parseInt(pax) || 1 : parseInt(minPax) || 1);

    // Pax label for hint text
    const paxLabel = tourType === 'private'
        ? (pax ? `${pax} pax (Private)` : '— pax (set in Basic Info)')
        : (minPax ? `${minPax} min pax (Joiners)` : '— pax (set in Basic Info)');

    // Per-pax base amount for breakdown display
    const perPaxAmount = supplierRateNum + markupInPeso;

    // ✅ Compute markup-in-peso for solo pax (display only inside this component)
    const soloSupplierRateNum = parseFloat(soloSupplierRate) || 0;
    const soloMarkupValueNum = parseFloat(soloMarkupValue) || 0;
    const soloMarkupInPeso = soloMarkupType === "percentage"
        ? (soloSupplierRateNum * soloMarkupValueNum) / 100
        : soloMarkupValueNum;

    // ✅ Compute markup-in-peso for multiple pax (display only inside this component)
    const multipleSupplierRateNum = parseFloat(multipleSupplierRate) || 0;
    const multipleMarkupValueNum = parseFloat(multipleMarkupValue) || 0;
    const multipleMarkupInPeso = multipleMarkupType === "percentage"
        ? (multipleSupplierRateNum * multipleMarkupValueNum) / 100
        : multipleMarkupValueNum;

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
                            ? '💡 Solo rate — supplier rate and markup are doubled (×2)'
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

                {/* ✅ TOTAL SELLING PRICE — shown above PAX PRICING for proper flow */}
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
                    </div>
                </div>

                {/* ✅ PAX PRICING SECTION
                    Each pax type (Solo / Multiple) now has its own
                    Supplier Rate + Markup (with % or ₱ toggle) = computed Selling Price.
                    Same pattern as the main pricing section above.
                */}
                <div className="apkg-pax-price-section">
                    <h3 className="apkg-pax-price-title">PAX PRICING</h3>
                    <p className="apkg-pax-price-subtitle">Set the supplier rate and markup per booking type</p>

                    {/* ── SOLO PAX ── */}
                    <div className="apkg-pax-price-card">
                        <div className="apkg-pax-price-card-header">
                            <span className="apkg-pax-price-icon">👤</span>
                            <span className="apkg-pax-price-card-label">SOLO PAX</span>
                        </div>
                        <div className="apkg-pricing-inputs">
                            <div className="apkg-field">
                                <label>Supplier Rate (PHP)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={soloSupplierRate}
                                    onChange={handleSoloSupplierRateChange}
                                    onWheel={(e) => e.target.blur()}
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div className="apkg-field">
                                <label>
                                    Markup
                                    <span className={`apkg-markup-badge apkg-markup-badge--${soloMarkupType}`}>
                                        {soloMarkupType === "percentage" ? "% MODE" : "₱ PESO MODE"}
                                    </span>
                                </label>
                                <div className="apkg-field-with-toggle">
                                    <input
                                        type="number"
                                        placeholder={soloMarkupType === "percentage" ? "Enter %" : "Enter peso amount"}
                                        value={soloMarkupValue}
                                        onChange={handleSoloMarkupChange}
                                        onWheel={(e) => e.target.blur()}
                                        step="0.01"
                                        min="0"
                                        max={soloMarkupType === "percentage" ? "100" : undefined}
                                    />
                                    <button
                                        type="button"
                                        className="apkg-toggle-markup"
                                        onClick={toggleSoloMarkupType}
                                        title={`Switch to ${soloMarkupType === "percentage" ? "Peso" : "Percentage"}`}
                                    >
                                        <IconCurrencyToggle />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="apkg-pax-total-box">
                            <div className="apkg-pax-total-label">
                                <IconPeso />
                                SOLO PAX SELLING PRICE
                            </div>
                            <div className="apkg-pax-total-amount">
                                ₱{soloPaxPrice
                                    ? Number(soloPaxPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : "0.00"}
                            </div>
                            {soloSupplierRateNum > 0 && (
                                <div className="apkg-pax-total-breakdown">
                                    ₱{soloSupplierRateNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} supplier
                                    {" + "}₱{soloMarkupInPeso.toLocaleString("en-US", { minimumFractionDigits: 2 })} markup
                                    {soloMarkupType === "percentage" && soloMarkupValueNum > 0 && (
                                        <span> ({soloMarkupValueNum}%)</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── MULTIPLE PAX ── */}
                    <div className="apkg-pax-price-card">
                        <div className="apkg-pax-price-card-header">
                            <span className="apkg-pax-price-icon">👥</span>
                            <span className="apkg-pax-price-card-label">MULTIPLE PAX</span>
                        </div>
                        <div className="apkg-pricing-inputs">
                            <div className="apkg-field">
                                <label>Supplier Rate (PHP)</label>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={multipleSupplierRate}
                                    onChange={handleMultipleSupplierRateChange}
                                    onWheel={(e) => e.target.blur()}
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div className="apkg-field">
                                <label>
                                    Markup
                                    <span className={`apkg-markup-badge apkg-markup-badge--${multipleMarkupType}`}>
                                        {multipleMarkupType === "percentage" ? "% MODE" : "₱ PESO MODE"}
                                    </span>
                                </label>
                                <div className="apkg-field-with-toggle">
                                    <input
                                        type="number"
                                        placeholder={multipleMarkupType === "percentage" ? "Enter %" : "Enter peso amount"}
                                        value={multipleMarkupValue}
                                        onChange={handleMultipleMarkupChange}
                                        onWheel={(e) => e.target.blur()}
                                        step="0.01"
                                        min="0"
                                        max={multipleMarkupType === "percentage" ? "100" : undefined}
                                    />
                                    <button
                                        type="button"
                                        className="apkg-toggle-markup"
                                        onClick={toggleMultipleMarkupType}
                                        title={`Switch to ${multipleMarkupType === "percentage" ? "Peso" : "Percentage"}`}
                                    >
                                        <IconCurrencyToggle />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="apkg-pax-total-box">
                            <div className="apkg-pax-total-label">
                                <IconPeso />
                                MULTIPLE PAX SELLING PRICE
                            </div>
                            <div className="apkg-pax-total-amount">
                                ₱{multiplePaxPrice
                                    ? Number(multiplePaxPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                    : "0.00"}
                            </div>
                            {multipleSupplierRateNum > 0 && (
                                <div className="apkg-pax-total-breakdown">
                                    ₱{multipleSupplierRateNum.toLocaleString("en-US", { minimumFractionDigits: 2 })} supplier
                                    {" + "}₱{multipleMarkupInPeso.toLocaleString("en-US", { minimumFractionDigits: 2 })} markup
                                    {multipleMarkupType === "percentage" && multipleMarkupValueNum > 0 && (
                                        <span> ({multipleMarkupValueNum}%)</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default PricingCalculator;