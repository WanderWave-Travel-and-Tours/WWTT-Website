import React from 'react';
import { FileText, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import './BookingStats.css'; 

const BookingStats = ({ stats }) => {
    // Function to generate a descriptive class name for specific styling
    const getStatClass = (label) => {
        // Converts "Total Bookings" to "total-bookings"
        return label.toLowerCase().replace(/ /g, '-');
    }
    
    return (
        <div className="bkm-stats-grid">
            {stats.map((s, i) => (
                <div 
                    // Set the image via inline style
                    className={`bkm-card bkm-card-${getStatClass(s.label)}`} 
                    key={i}
                    style={{backgroundImage: `url(${s.image})`}}
                >
                    {/* Content wrapper for Z-index */}
                    <div className="bkm-card-content">
                        <h2>{s.label === "Total Revenue" ? `₱${s.value}` : s.value}</h2>
                        <span>{s.label}</span>
                    </div>
                    <div className="bkm-card-icon">{s.icon}</div>
                </div>
            ))}
        </div>
    );
};

export default BookingStats;