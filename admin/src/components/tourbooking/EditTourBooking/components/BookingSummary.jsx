import React from "react";

const BookingSummary = ({ formData, totalPax }) => (
  <div className="ea-card-sidebar">
    <div className="ea-section-header" style={{ marginBottom: "14px" }}>
      <h3>Booking Summary</h3>
    </div>

    <div className="etbk-summary-list">
      <div className="etbk-summary-row">
        <span>Package</span>
        <strong style={{ maxWidth: "180px", textAlign: "right", wordBreak: "break-word" }}>
          {formData.packageName || "—"}
        </strong>
      </div>
      <div className="etbk-summary-row">
        <span>Duration</span>
        <strong>{formData.duration || "—"}</strong>
      </div>
      <div className="etbk-summary-row">
        <span>Start Date</span>
        <strong>{formData.startDate || "—"}</strong>
      </div>
      {formData.endDate && (
        <div className="etbk-summary-row">
          <span>End Date</span>
          <strong>{formData.endDate}</strong>
        </div>
      )}
      <div className="etbk-summary-row">
        <span>PAX</span>
        <strong>
          {totalPax} pax
          {parseInt(formData.paxAdult)    > 0 && ` (${formData.paxAdult}A`}
          {parseInt(formData.paxChildren) > 0 && ` · ${formData.paxChildren}C`}
          {parseInt(formData.paxInfants)  > 0 && ` · ${formData.paxInfants}I`}
          {parseInt(formData.paxAdult)    > 0 && ")"}
        </strong>
      </div>

      {/* Price rows */}
      <div className="etbk-summary-row">
        <span>Package Price</span>
        <strong>₱{Number(formData.packagePrice || 0).toLocaleString()}</strong>
      </div>

      {Number(formData.discountAmount) > 0 && (
        <div className="etbk-summary-row etbk-summary-row--discount">
          <span>🏷️ Discount</span>
          <strong>−₱{Number(formData.discountAmount).toLocaleString()}</strong>
        </div>
      )}

      {formData.includesAirfare && (
        <div className="etbk-summary-row etbk-summary-row--airfare">
          <span>✈️ Airfare</span>
          <strong>+₱{Number(formData.airfareTotal || 0).toLocaleString()}</strong>
        </div>
      )}

      <div className="etbk-summary-row etbk-summary-row--total">
        <span>Total</span>
        <strong>₱{Number(formData.totalAmount || 0).toLocaleString()}</strong>
      </div>
    </div>
  </div>
);

export default BookingSummary;
