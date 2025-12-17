import React from 'react';
import { Archive as ArchiveIcon, XCircle, Package, RotateCcw, Trash2, Wrench } from 'lucide-react';
import './ArchiveStats.css'; 

const ArchiveStats = ({ stats }) => {
    const getStatClass = (label) => {
        return label.toLowerCase().replace(/ /g, '-').replace(/\(|\)/g, '');
    }
    
    return (
        <div className="arc-stats-grid">
            {stats.map((s, i) => (
                <div 
                    className={`arc-card arc-card-${getStatClass(s.label)}`} 
                    key={i}
                    style={{backgroundImage: `url(${s.image})`}}
                >
                    <div className="arc-card-content">
                        <h2>{s.value}</h2>
                        <span>{s.label}</span>
                    </div>
                    <div className="arc-card-icon">{s.icon}</div>
                </div>
            ))}
        </div>
    );
};

export default ArchiveStats;