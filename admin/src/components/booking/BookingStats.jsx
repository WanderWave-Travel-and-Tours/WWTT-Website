import React from 'react';
import { FileText, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import './BookingStats.css'; 

const BookingStats = ({ stats }) => {
    const getStatClass = (label) => {
        return label.toLowerCase().replace(/ /g, '-');
    }
    
    return (
        <div className="bkm-stats-grid">
            {stats.map((s, i) => (
                <div 
                    className={`bkm-card bkm-card-${getStatClass(s.label)}`} 
                    key={i}
                    style={{backgroundImage: `url(${s.image})`}}
                >
                    <div className="bkm-card-content">
                        <h2>{s.label === "Total Revenue" ? `₱${s.value}` : s.value}</h2>
                        <span>{s.label}</span>
                        {/* ✅ NEW: Show subtext if available */}
                        {s.subtext && (
                            <span className="stat-subtext">{s.subtext}</span>
                        )}
                    </div>
                    <div className="bkm-card-icon">{s.icon}</div>
                </div>
            ))}
        </div>
    );
};

export default BookingStats;