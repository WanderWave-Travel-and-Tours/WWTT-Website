import React from "react";
import { CreditCard } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// PricingSection
// All price, payment type/status, and balance fields.
// ─────────────────────────────────────────────────────────────────────────────
const PricingSection = ({ formData, handleChange }) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <CreditCard size={20} className="ea-section-icon" />
      <h3>Pricing &amp; Payment</h3>
    </div>

    <div className="ea-fields-grid">
      <div className="ea-input-group">
        <label>One-Way Price (₱)</label>
        <input
          type="number"
          name="oneWayPrice"
          value={formData.oneWayPrice}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>
      <div className="ea-input-group">
        <label>Roundtrip Price (₱)</label>
        <input
          type="number"
          name="roundtripPrice"
          value={formData.roundtripPrice}
          onChange={handleChange}
          className="ea-input"
          min="0"
        />
      </div>
      <div className="ea-input-group">
        <label>Selling Price (₱)</label>
        <input
          type="number"
          name="sellingPrice"
          value={formData.sellingPrice}
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

    {/* Total display strip */}
    <div className="etb-total-strip">
      <span>TOTAL AMOUNT</span>
      <span className="etb-total-amount">
        ₱{Number(formData.totalAmount || 0).toLocaleString()}
      </span>
    </div>
  </section>
);

export default PricingSection;
