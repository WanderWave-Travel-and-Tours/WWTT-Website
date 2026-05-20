import React from "react";
import { User } from "lucide-react";

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
    </div>
  </section>
);

export default ClientInfoSection;
