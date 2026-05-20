import React from 'react';

const NtbmHeader = ({ onClose }) => (
  <div className="ntbm-header">
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div className="ntbm-header-icon">🗺️</div>
      <div>
        <h2 style={{
          margin: 0,
          fontSize: '22px',
          fontWeight: 800,
          color: '#0f172a',
          fontFamily: 'Arial Black, sans-serif',
          textTransform: 'uppercase',
        }}>
          New Tour Booking
        </h2>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Create a walk-in tour booking for a customer
        </p>
      </div>
    </div>
    <button className="ntbm-close-btn" onClick={onClose}>×</button>
  </div>
);

export default NtbmHeader;
