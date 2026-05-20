import React from "react";
import { MessageSquare } from "lucide-react";

const NotesSection = ({ formData, handleChange }) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <MessageSquare size={20} className="ea-section-icon" />
      <h3>Notes / Message</h3>
    </div>

    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="ea-input-group">
        <label>Client Message / Notes</label>
        <textarea
          name="message"
          value={formData.message}
          onChange={handleChange}
          className="ea-input ea-textarea"
          placeholder="Add notes or client message here..."
        />
      </div>
    </div>
  </section>
);

export default NotesSection;
