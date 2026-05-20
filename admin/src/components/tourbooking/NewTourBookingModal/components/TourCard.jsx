import React from 'react';

const TourCard = ({ tour, isSelected, onSelect }) => (
  <div
    className={`ntbm-tour-card ${isSelected ? 'selected' : ''}`}
    onClick={() => onSelect(tour)}
  >
    {tour.image && (
      <div className="ntbm-tour-img-wrap">
        <img src={tour.image} alt={tour.title} className="ntbm-tour-img" />
      </div>
    )}

    <div className="ntbm-tour-info">
      <div className="ntbm-tour-title">{tour.title || tour.name}</div>
      <div className="ntbm-tour-meta">
        {tour.duration && (
          <span className="ntbm-tour-tag">{tour.duration}</span>
        )}
        {tour.tourType && (
          <span className={`ntbm-tour-tag ${tour.tourType.toLowerCase() === 'private' ? 'private' : 'joiners'}`}>
            {tour.tourType}
          </span>
        )}
      </div>
      <div className="ntbm-tour-price">
        ₱{(tour.price || 0).toLocaleString()}{' '}
        <span style={{ fontSize: '11px', fontWeight: 500, color: '#94a3b8' }}>/ pax</span>
      </div>
    </div>

    {isSelected && (
      <div className="ntbm-tour-check">✓</div>
    )}
  </div>
);

export default TourCard;
