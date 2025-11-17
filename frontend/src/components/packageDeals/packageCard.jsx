import { Heart, Star, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import './PackageCard.css';

function PackageCard({ package: pkg, isFavorite, onToggleFavorite }) {
  return (
    <div className="package-card">
      {pkg.featured && (
        <span className="badge badge-featured">🔥 Featured</span>
      )}
      {pkg.discount && (
        <span className="badge badge-discount">
          {pkg.discount}% OFF ₱{pkg.originalPrice.toLocaleString()}
        </span>
      )}
      
      <button 
        className={`favorite-button ${isFavorite ? 'active' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(pkg.id);
        }}
        aria-label="Add to favorites"
      >
        {/* UPDATED: Added strokeWidth={2.5} to make lines thicker */}
        <Heart 
          strokeWidth={2.5} 
          fill={isFavorite ? 'currentColor' : 'none'} 
        />
      </button>

      <div className="card-image">
        <img 
          src={pkg.image} 
          alt={pkg.name} 
          className="image-content" 
        />
      </div>

      <div className="card-body">
        <div className="card-header">
          <h3 className="card-title">{pkg.name}</h3>
          <div className="rating-row">
            <Star className="star-icon" size={16} fill="currentColor" />
            <span className="rating-value">{pkg.rating}</span>
            <span className="rating-count">({pkg.reviews})</span>
          </div>
        </div>

        <div className="card-details">
          <div className="detail-row">
            <MapPin className="detail-icon" size={16} />
            <span className="detail-text">{pkg.location}</span>
          </div>
          <div className="detail-row">
            <Calendar className="detail-icon" size={16} />
            <span className="detail-text">{pkg.duration}</span>
          </div>
          <div className="detail-row">
            <Users className="detail-icon" size={16} />
            <span className="detail-text">Up to {pkg.maxGuests} guests</span>
          </div>
        </div>

        <div className="includes-section">
          <span className="includes-title">Includes:</span>
          <div className="includes-list">
            {pkg.includes.map((item, idx) => (
              <span key={idx} className="include-item">{item}</span>
            ))}
          </div>
        </div>

        <div className="card-footer">
          <div className="price-info">
            <span className="price-label">Starting from</span>
            <div className="price-amount">
              <span className="currency">₱</span>
              <span className="price-value">{pkg.price.toLocaleString()}</span>
            </div>
          </div>
          <button className="book-button">
            <span>Book Now</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PackageCard;