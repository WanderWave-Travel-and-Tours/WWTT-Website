import React from 'react';
import './CustomBookingStats.css';

const CustomBookingStats = ({ stats }) => {
  return (
    <div className="cbk-stats-grid">
      {stats.map((s, i) => (
        <div className={`cbk-stat-card ${s.variant}`} key={i}>
          <div className="cbk-stat-icon-wrap">
            {s.icon}
          </div>
          <div className="cbk-stat-content">
            <div className="cbk-stat-value">{s.value}</div>
            <div className="cbk-stat-label">{s.label}</div>
            {s.subtext && <span className="cbk-stat-sub">{s.subtext}</span>}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CustomBookingStats;
