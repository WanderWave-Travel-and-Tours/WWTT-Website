import React from 'react';
import './TourPricing.css';

// Kinuha ang mga icons mula sa original na PricingCalculator
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

const TourPricing = ({ supp, onSupp, mark, onMark, type, onToggle, price }) => {
    const sNum = parseFloat(supp) || 0;
    const mNum = parseFloat(mark) || 0;
    let markInPeso = type === "percentage" ? (sNum * mNum) / 100 : mNum;
    
    const formattedMarkupInPeso = Number(markInPeso).toLocaleString("en-US", {
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
                            value={supp}
                            onChange={(e) => onSupp(e.target.value)}
                            required
                            step="0.01"
                            min="0"
                        />
                    </div>
                    <div className="apkg-field">
                        <label>
                            Markup 
                            <span className={`apkg-markup-badge apkg-markup-badge--${type}`}>
                                {type === "percentage" ? "% MODE" : "₱ PESO MODE"}
                            </span>
                        </label>
                        <div className="apkg-field-with-toggle">
                            <input
                                type="number"
                                placeholder={type === "percentage" ? "Enter %" : "Enter peso amount"}
                                value={mark}
                                onChange={(e) => onMark(e.target.value)}
                                required
                                step="0.01"
                                min="0"
                            />
                            <button
                                type="button"
                                className="apkg-toggle-markup"
                                onClick={onToggle}
                                title={`Switch to ${type === "percentage" ? "Peso" : "Percentage"}`}
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
                            {supp && mark ? (
                                <>
                                    <span>₱{Number(supp).toLocaleString()}</span>
                                    <span className="apkg-plus">+</span>
                                    <span>
                                        {type === "percentage"
                                            ? `${mark}% (₱${formattedMarkupInPeso})`
                                            : `₱${Number(mark).toLocaleString()}`}
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

export default TourPricing;