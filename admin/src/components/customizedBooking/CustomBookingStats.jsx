import React from 'react';
import './CustomBookingStats.css';

const CustomBookingStats = ({ stats }) => {
  return (
    <div className="cbk-stats-grid">
      {stats.map((s, i) => (
        <div
          className={`cbk-stat-card cbk-stat-card--${s.variant}`}
          key={i}
          style={{ backgroundImage: s.image ? `url(${s.image})` : undefined }}
        >
          <div className="cbk-stat-body">
            <div className="cbk-stat-value">{s.value}</div>
            <div className="cbk-stat-label">{s.label}</div>
            {s.subtext && (
              <div className="cbk-stat-sub">{s.subtext}</div>
            )}
          </div>
          <div className="cbk-stat-icon-wrap">
            {s.icon}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomBookingStats;