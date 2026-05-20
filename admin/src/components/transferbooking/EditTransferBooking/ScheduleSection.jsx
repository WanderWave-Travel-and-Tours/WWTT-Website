import React from "react";
import { Calendar } from "lucide-react";
import CustomTimePicker from "../../timePicker/Clock";
import { isLateNight, recalculatePrice } from "./transferBookingUtils";

// ─────────────────────────────────────────────────────────────────────────────
// ScheduleSection
// Handles outbound + optional return leg date/time inputs.
// ─────────────────────────────────────────────────────────────────────────────
const ScheduleSection = ({ formData, handleChange, setFormData, isRoundtrip }) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <Calendar size={20} className="ea-section-icon" />
      <h3>Schedule</h3>
    </div>

    {/* ONE-WAY / OUTBOUND LEG */}
    <div
      className="etb-leg-block"
      style={{ marginBottom: isRoundtrip ? "20px" : "0" }}
    >
      {isRoundtrip && (
        <div className="etb-leg-label etb-leg-label--outbound">OUTBOUND</div>
      )}
      <div className="ea-fields-grid">
        <div className="ea-input-group">
          <label>Travel Date</label>
          <input
            type="date"
            name="travelDate"
            value={formData.travelDate}
            onChange={handleChange}
            className="ea-input"
            required
          />
        </div>
        <div className="ea-input-group">
          <label>
            Arrival Time
            {isLateNight(formData.arrivalTime) && (
              <span className="etb-late-night-badge">🌙 +₱500</span>
            )}
          </label>
          <CustomTimePicker
            value={formData.arrivalTime}
            onChange={(e) => {
              const arrivalTime = e.target.value;
              setFormData((prev) => {
                const updated = { ...prev, arrivalTime };
                const { sellingPrice, totalAmount } = recalculatePrice(updated);
                return { ...updated, sellingPrice, totalAmount };
              });
            }}
            placeholder="Select arrival time"
            required={isRoundtrip}
          />
        </div>
      </div>
    </div>

    {/* ROUNDTRIP — RETURN LEG */}
    {isRoundtrip && (
      <div className="etb-leg-block">
        <div className="etb-leg-label etb-leg-label--return">RETURN</div>
        <div className="ea-fields-grid">
          <div className="ea-input-group">
            <label>Return Date</label>
            <input
              type="date"
              name="returnDate"
              value={formData.returnDate}
              onChange={handleChange}
              className="ea-input"
              required
            />
          </div>
          <div className="ea-input-group">
            <label>
              Departure Time
              {isRoundtrip && isLateNight(formData.departureTime) && (
                <span className="etb-late-night-badge">🌙 +₱500</span>
              )}
            </label>
            <CustomTimePicker
              value={formData.departureTime}
              onChange={(e) => {
                const departureTime = e.target.value;
                setFormData((prev) => {
                  const updated = { ...prev, departureTime };
                  const { sellingPrice, totalAmount } = recalculatePrice(updated);
                  return { ...updated, sellingPrice, totalAmount };
                });
              }}
              placeholder="Select departure time"
              required
            />
          </div>
        </div>
      </div>
    )}
  </section>
);

export default ScheduleSection;
