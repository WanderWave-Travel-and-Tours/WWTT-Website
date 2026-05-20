import React from "react";
import { CreditCard } from "lucide-react";

const PricingSection = ({ formData, handleChange }) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <CreditCard size={20} className="ea-section-icon" />
      <h3>Pricing &amp; Payment</h3>
    </div>

    {/* ── Airfare toggle ── */}
    <div className="etbk-airfare-row">
      <div className="etbk-airfare-icon">✈️</div>
      <div className="etbk-airfare-info">
        <div className="etbk-airfare-title">Includes Airfare</div>
        <div className="etbk-airfare-desc">
          Toggle if this booking includes airfare
        </div>
      </div>
      <label className="etbk-toggle-wrap">
        <input
          type="checkbox"
          name="includesAirfare"
          checked={formData.includesAirfare}
          onChange={handleChange}
          className="etbk-toggle-input"
        />
        <span className="etbk-toggle-slider" />
      </label>
    </div>

    {/* ── Price fields ── */}
    <div className="ea-fields-grid">
      <div className="ea-input-group">
        <label>Package Price (₱)</label>
        <input
          type="number"
          name="packagePrice"
          value={formData.packagePrice}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>
      <div className="ea-input-group">
        <label>Discount Amount (₱)</label>
        <input
          type="number"
          name="discountAmount"
          value={formData.discountAmount}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>

      {formData.includesAirfare && (
        <div className="ea-input-group">
          <label>Airfare Total (₱)</label>
          <input
            type="number"
            name="airfareTotal"
            value={formData.airfareTotal}
            onChange={handleChange}
            className="ea-input"
            min="0"
          />
        </div>
      )}

      <div className="ea-input-group">
        <label>Seller Price (₱)</label>
        <input
          type="number"
          name="sellerPrice"
          value={formData.sellerPrice}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>
      <div className="ea-input-group">
        <label>Markup (₱)</label>
        <input
          type="number"
          name="markup"
          value={formData.markup}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>
      <div className="ea-input-group">
        <label>Total Amount (₱)</label>
        <input
          type="number"
          name="totalAmount"
          value={formData.totalAmount}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>
      <div className="ea-input-group">
        <label>Payment Type</label>
        <select
          name="paymentType"
          value={formData.paymentType}
          onChange={handleChange}
          className="ea-input ea-select"
        >
          <option value="full">Full</option>
          <option value="partial">Partial</option>
        </select>
      </div>
      <div className="ea-input-group">
        <label>Payment Status</label>
        <select
          name="paymentStatus"
          value={formData.paymentStatus}
          onChange={handleChange}
          className="ea-input ea-select"
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="partial">Partial</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>
      <div className="ea-input-group">
        <label>Initial Payment (₱)</label>
        <input
          type="number"
          name="initialPaymentAmount"
          value={formData.initialPaymentAmount}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>
      <div className="ea-input-group">
        <label>Remaining Balance (₱)</label>
        <input
          type="number"
          name="remainingBalance"
          value={formData.remainingBalance}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>
    </div>

    {/* ── Total strip ── */}
    <div className="etbk-total-strip">
      <span>TOTAL AMOUNT</span>
      <span className="etbk-total-amount">
        ₱{Number(formData.totalAmount || 0).toLocaleString()}
      </span>
    </div>
  </section>
);

export default PricingSection;
