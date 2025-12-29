import React from 'react';
import './ActivityLogsStats.css'; 

const ActivityLogsStats = ({ stats }) => {
    const getStatClass = (label) => {
        return label.toLowerCase().replace(/ /g, '-').replace(/\(|\)/g, '');
    }
    
    return (
        <div className="act-stats-grid">
            {stats.map((s, i) => (
                <div 
                    className={`act-card act-card-${getStatClass(s.label)}`} 
                    key={i}
                    style={{backgroundImage: `url(${s.image})`}}
                >
                    <div className="act-card-content">
                        <h2>{s.value}</h2>
                        <span>{s.label}</span>
                    </div>
                    <div className="act-card-icon">{s.icon}</div>
                </div>
            ))}
        </div>
    );
};

export default ActivityLogsStats;