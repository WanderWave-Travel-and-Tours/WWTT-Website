import React from "react";
import { Calendar } from "lucide-react";

const ScheduleSection = ({ formData, handleChange }) => {
  const computeDuration = () => {
    if (!formData.startDate || !formData.endDate) return null;
    const diff = Math.round(
      (new Date(formData.endDate) - new Date(formData.startDate)) /
        (1000 * 60 * 60 * 24)
    );
    if (diff < 0) return "Invalid range";
    const nights = diff;
    const days   = nights + 1;
    return `${days}D ${nights}N`;
  };

  const durationLabel = computeDuration();

  return (
    <section className="ea-section">
      <div className="ea-section-header">
        <Calendar size={20} className="ea-section-icon" />
        <h3>Tour Schedule</h3>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Start Date */}
        <div style={{
          padding: "16px",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "10px",
        }}>
          <div style={{
            fontSize: "11px", fontWeight: 900, letterSpacing: "1.2px",
            textTransform: "uppercase", color: "#f59e0b", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Calendar size={13} /> Start Date
          </div>
          <div className="ea-input-group" style={{ margin: 0 }}>
            <label>Start / Travel Date</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="ea-input"
              required
            />
          </div>
        </div>

        {/* End Date */}
        <div style={{
          padding: "16px",
          background: "#f0fdf4",
          border: "1px solid #a7f3d0",
          borderRadius: "10px",
        }}>
          <div style={{
            fontSize: "11px", fontWeight: 900, letterSpacing: "1.2px",
            textTransform: "uppercase", color: "#10b981", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "6px",
          }}>
            <Calendar size={13} /> End Date
          </div>
          <div className="ea-input-group" style={{ margin: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="ea-input"
              min={formData.startDate || undefined}
            />
          </div>
        </div>
      </div>

      {/* Auto-computed duration pill */}
      {durationLabel && (
        <div style={{
          marginTop: "12px",
          display: "inline-flex", alignItems: "center", gap: "6px",
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: "20px", padding: "5px 14px",
          fontSize: "12px", fontWeight: 700, color: "#1d4ed8",
        }}>
          <Calendar size={13} />
          {durationLabel}
        </div>
      )}
    </section>
  );
};

export default ScheduleSection;
