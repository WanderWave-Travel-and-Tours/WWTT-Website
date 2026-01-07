import React from 'react';
import { Package, TrendingUp, DollarSign } from 'lucide-react';
import './SellerRateStats.css';

const SellerRateStats = ({ stats }) => {
  
  const getIcon = (label) => {
    if (label.includes('Total')) return <Package size={24} />;
    if (label.includes('Markup')) return <TrendingUp size={24} />;
    if (label.includes('Revenue')) return <DollarSign size={24} />;
    return <Package size={24} />;
  };

  return (
    <div className="sr-stats-grid">
      {stats.map((stat, index) => (
        <div 
          className="sr-card" 
          key={index}
          style={{ backgroundImage: `url(${stat.image})` }}
        >
          <div className="sr-card-content">
            <h2>{stat.value}</h2>
            <span>{stat.label}</span>
          </div>
          <div className="sr-card-icon" style={{ color: stat.color }}>
            {getIcon(stat.label)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SellerRateStats;