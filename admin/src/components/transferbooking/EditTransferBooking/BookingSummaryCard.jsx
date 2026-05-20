import React from "react";

// ─────────────────────────────────────────────────────────────────────────────
// BookingSummaryCard
// Right-sidebar summary of trip type, dates, passengers, and price breakdown.
// ─────────────────────────────────────────────────────────────────────────────
const BookingSummaryCard = ({
  formData,
  isRoundtrip,
  summaryLateNightCharge,
  summaryLateNightReasons,
  submitting,
  handleCancel,
}) => (
  <div className="ea-sticky-sidebar">

    {/* Summary card */}
    <div className="ea-card-sidebar">
      <div className="ea-section-header" style={{ marginBottom: "14px" }}>
        <h3>Booking Summary</h3>
      </div>
      <div className="etb-summary-list">
        <div className="etb-summary-row">
          <span>Type</span>
          <strong>{isRoundtrip ? "Roundtrip" : "One Way"}</strong>
        </div>
        <div className="etb-summary-row">
          <span>Travel Date</span>
          <strong>{formData.travelDate || "—"}</strong>
        </div>
        {isRoundtrip && (
          <div className="etb-summary-row">
            <span>Return Date</span>
            <strong>{formData.returnDate || "—"}</strong>
          </div>
        )}
        <div className="etb-summary-row">
          <span>Passengers</span>
          <strong>{formData.passengerCount}</strong>
        </div>

        {/* Price breakdown */}
        <div className="etb-summary-row">
          <span>Base Price</span>
          <strong>₱{Number(formData.sellingPrice || 0).toLocaleString()}</strong>
        </div>

        {summaryLateNightCharge > 0 && (
          <div className="etb-summary-row etb-summary-row--late-charge">
            <span>
              🌙 Late Night
              <span className="etb-summary-charge-hint">
                {summaryLateNightReasons.join(", ")}
              </span>
            </span>
            <strong>+₱{summaryLateNightCharge.toLocaleString()}</strong>
          </div>
        )}

        <div className="etb-summary-row etb-summary-row--total">
          <span>Total</span>
          <strong>₱{Number(formData.totalAmount || 0).toLocaleString()}</strong>
        </div>
      </div>
    </div>

    {/* Actions */}
    <div className="ea-card-sidebar ea-actions-card">
      <button
        type="submit"
        className="ea-btn ea-btn--submit"
        disabled={submitting}
      >
        {submitting ? "Updating..." : "Save Changes"}
      </button>
      <button
        type="button"
        className="ea-btn ea-btn--cancel"
        onClick={handleCancel}
        disabled={submitting}
      >
        Cancel
      </button>
    </div>

  </div>
);

export default BookingSummaryCard;
