import React from "react";
import { User } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// ClientInfoSection
// ─────────────────────────────────────────────────────────────────────────────
const ClientInfoSection = ({ formData, handleChange }) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <User size={20} className="ea-section-icon" />
      <h3>Client Information</h3>
    </div>
    <div className="ea-fields-grid">
      <div className="ea-input-group">
        <label>Full Name</label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="ea-input"
          required
        />
      </div>
      <div className="ea-input-group">
        <label>Email Address</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="ea-input"
          required
        />
      </div>
      <div className="ea-input-group">
        <label>Phone Number</label>
        <input
          type="text"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="ea-input"
        />
      </div>
      <div className="ea-input-group">
        <label>Passenger Count</label>
        <input
          type="number"
          name="passengerCount"
          value={formData.passengerCount}
          onChange={handleChange}
          className="ea-input"
          min="1"
        />
      </div>
    </div>
  </section>
);

export default ClientInfoSection;
