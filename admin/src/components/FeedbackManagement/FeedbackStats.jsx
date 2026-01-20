import React from 'react';
import { MessageSquare, Bug, Star } from 'lucide-react';
import './FeedbackStats.css';

const FeedbackStats = ({ stats }) => {
  
  const getIcon = (label) => {
    if (label.includes('Total')) return <MessageSquare size={24} />;
    if (label.includes('Bug')) return <Bug size={24} />;
    if (label.includes('Rating')) return <Star size={24} />;
    return <MessageSquare size={24} />;
  };

  return (
    <div className="fb-stats-grid">
      {stats.map((stat, index) => (
        <div 
          className="fb-card" 
          key={index}
          style={{ backgroundImage: `url(${stat.image})` }}
        >
          <div className="fb-card-content">
            <h2>{stat.value}</h2>
            <span>{stat.label}</span>
          </div>
          <div className="fb-card-icon" style={{ color: stat.color }}>
            {getIcon(stat.label)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeedbackStats;