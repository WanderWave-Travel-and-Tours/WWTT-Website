import { Heart, Star, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import './PackageCard.css';

function PackageCard({ package: pkg, isFavorite, onToggleFavorite, onBookNow, currency = 'PHP', exchangeRate = 58 }) { 
  
  const displayPrice = currency === 'PHP' 
    ? pkg.price 
    : (pkg.price / exchangeRate);

  const displayOriginalPrice = currency === 'PHP'
    ? pkg.originalPrice
    : (pkg.originalPrice / exchangeRate);

  const currencySymbol = currency === 'PHP' ? '₱' : '$';

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
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(pkg.id);
        }}
        aria-label="Add to favorites"
      >
        <Heart strokeWidth={2.5} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>

      <div className="card-image">
        <img src={pkg.image} alt={pkg.name} className="image-content" />
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