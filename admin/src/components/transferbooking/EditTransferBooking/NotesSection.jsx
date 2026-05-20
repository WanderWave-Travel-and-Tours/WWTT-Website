import React from "react";
import { MessageSquare } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// NotesSection
// Message and special requests textareas.
// ─────────────────────────────────────────────────────────────────────────────
const NotesSection = ({ formData, handleChange }) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <MessageSquare size={20} className="ea-section-icon" />
      <h3>Notes / Special Requests</h3>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="ea-input-group">
        <label>Message</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="ea-input ea-textarea"
          placeholder="Add notes or client message here..."
        />
      </div>
      <div className="ea-input-group">
        <label>Special Requests</label>
        <textarea
          name="specialRequests"
          value={formData.specialRequests}
          onChange={handleChange}
          className="ea-input ea-textarea"
          placeholder="Any special requests or requirements..."
        />
      </div>
    </div>
  </section>
);

export default NotesSection;
