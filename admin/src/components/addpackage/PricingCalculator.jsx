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

const PricingCalculator = ({ supplierRate, handleSupplierRateChange, markupValue, handleMarkupChange, markupType, toggleMarkupType, price }) => {
    
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

    return (
        <section className="apkg-section">
            <h2 className="apkg-section-title">PRICING</h2>
            <div className="apkg-pricing-layout">
                <div className="apkg-pricing-inputs">
                    <div className="apkg-field">
                        <label>Supplier Rate (PHP)</label>
                        <input
                            type="number"
                            placeholder="0.00"
                            value={supplierRate}
                            onChange={(e) => handleSupplierRateChange(e.target.value)}
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
                                onChange={(e) => handleMarkupChange(e.target.value)}
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
                        <div className="apkg-total-price-breakdown">
                            {supplierRate && markupValue ? (
                                <>
                                    <span>
                                        ₱{Number(supplierRate).toLocaleString()}
                                    </span>
                                    <span className="apkg-plus">+</span>
                                    <span>
                                        {markupType === "percentage"
                                            ? `${markupValue}% (₱${formattedMarkupInPeso})`
                                            : `₱${Number(markupValue).toLocaleString()}`}
                                    </span>
                                </>
                            ) : (
                                <span className="apkg-breakdown-empty">
                                    Enter supplier rate and markup to calculate
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PricingCalculator;