// src/components/PackageDeals/packageCard.jsx - COMPLETE CODE
import React from 'react';
import { Heart, Star, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';
import './packageCard.css';

function PackageCard({ 
  package: pkg, 
  isFavorite, 
  onToggleFavorite, 
  onBookNow, 
  currency = 'PHP', 
  exchangeRate = 58, 
  isLoggedIn, 
  onLoginRequired 
}) { 
  
  const displayPrice = currency === 'PHP' 
    ? pkg.price 
    : ((pkg.price / exchangeRate) * 1.30); 

  const displayOriginalPrice = currency === 'PHP'
    ? pkg.originalPrice
    : ((pkg.originalPrice / exchangeRate) * 1.30);

  const currencySymbol = currency === 'PHP' ? '₱' : '$';

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    
    if (isLoggedIn) {
      // Pass package info to parent
      onToggleFavorite(pkg.id, pkg.name, pkg.location);
    } else {
      onLoginRequired();
    }
  };

  return (
    <div className="package-card">
      {pkg.featured && (
        <span className="badge badge-featured">🔥 Featured</span>
      )}
      {pkg.discount && (
        <span className="badge badge-discount">
          {pkg.discount}% OFF {currencySymbol}{displayOriginalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      )}
      
      <button 
        className={`favorite-button ${isFavorite ? 'active' : ''}`}
        onClick={handleFavoriteClick}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        title={isLoggedIn ? (isFavorite ? "Remove from wishlist" : "Add to wishlist") : "Login to add to wishlist"}
        style={{
          transition: 'all 0.3s ease',
          transform: isFavorite ? 'scale(1.1)' : 'scale(1)'
        }}
      >
        <Heart strokeWidth={2.5} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <div className="card-image">
        <img 
          src={getImageUrl(pkg.image)} 
          alt={pkg.name} 
          className="image-content"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
          }}
        />
      </div>
      
      <div className="card-body">
        <div>
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
              <MapPin className="detail-icon" />
              <span className="detail-text">{pkg.location}</span>
            </div>
            <div className="detail-row">
              <Calendar className="detail-icon" />
              <span className="detail-text">{pkg.duration}</span>
            </div>
            <div className="detail-row">
              <Users className="detail-icon" />
              <span className="detail-text">Up to {pkg.maxGuests} guests</span>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <div className="price-info">
            <span className="price-label">Starting from</span>
            <div className="price-amount">
              <span className="currency">{currencySymbol}</span>
              <span className="price-value">
                {displayPrice.toLocaleString(undefined, { 
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0 
                })}
              </span>
            </div>
          </div>
          
          <button 
            className="book-button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBookNow) onBookNow(pkg); 
            }}
          >
            <span>Book Now</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default PackageCard;