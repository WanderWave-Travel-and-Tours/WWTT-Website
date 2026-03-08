// src/components/PackageDeals/packageCard.jsx - WITH AUTOMATIC TIMER-BASED PRICING
import React, { useState, useEffect, useRef } from 'react';
import { Heart, Star, MapPin, Calendar, Users, ChevronRight } from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';
import sampleGif from '../../../../backend/assets/sample.gif';
import './packageCard.css';

// ✅ Unique accent color per duration — WanderWave branded
const DURATION_COLORS = {
  '2D1N':  { top: '#7c3aed', text: '#7c3aed' },  // deep purple
  '3D2N':  { top: '#ea580c', text: '#ea580c' },  // original — unchanged
  '4D3N':  { top: '#1e40af', text: '#1e40af' },  // deep blue
  '5D4N':  { top: '#b91c1c', text: '#b91c1c' },  // dark red
  '6D5N':  { top: '#0f766e', text: '#0f766e' },  // dark teal
  '7D6N':  { top: '#065f46', text: '#065f46' },  // dark green
  '8D7N':  { top: '#4c1d95', text: '#4c1d95' },  // deep violet
  '9D8N':  { top: '#164e63', text: '#164e63' },  // dark cyan
  '10D9N': { top: '#831843', text: '#831843' },  // dark rose
};
const DEFAULT_DURATION_COLOR = { top: '#ea580c', text: '#ea580c' };

// ✅ Calendar icon badge — closely matches reference design
const CalendarDurationBadge = ({ duration }) => {
  const colors = DURATION_COLORS[duration] || DEFAULT_DURATION_COLOR;
  const fontSize = duration.length >= 5 ? "11" : "12.5";
  const gradId = `grad_${duration}`;
  const bodyGradId = `bodygrad_${duration}`;
  const ringGradId = `ringgrad_${duration}`;
  return (
    <span className="duration-calendar-badge" aria-label={duration}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 54 54"
        className="duration-calendar-svg"
      >
        <defs>
          {/* Header gradient — light top to slightly darker bottom */}
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
          </linearGradient>
          {/* Body gradient — white top fading to light gray */}
          <linearGradient id={bodyGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dde3ea" />
          </linearGradient>
          {/* Ring gradient */}
          <linearGradient id={ringGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* Outer shadow */}
        <rect x="3" y="9" width="48" height="43" rx="8" ry="8" fill="rgba(0,0,0,0.12)" />

        {/* White/gray body */}
        <rect x="2" y="8" width="48" height="43" rx="8" ry="8" fill={`url(#${bodyGradId})`} />

        {/* Colored top header — THINNER (only 13px tall) */}
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={colors.top} />
        {/* Square off bottom of header */}
        <rect x="2" y="14" width="48" height="7" fill={colors.top} />
        {/* Shine on header */}
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={`url(#${gradId})`} />

        {/* Separator line */}
        <rect x="2" y="21" width="48" height="1" fill="rgba(0,0,0,0.08)" />

        {/* LEFT ring — pushed to far left edge */}
        <rect x="9" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="10" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringGradId})`} />

        {/* RIGHT ring — pushed to far right edge */}
        <rect x="37" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="38" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringGradId})`} />

        {/* Duration text — bold, colored, centered in white body area */}
        <text
          x="26"
          y="38"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          fontSize={fontSize}
          fontWeight="900"
          fontFamily="'Arial Black', Arial, sans-serif"
          letterSpacing="0.3"
        >
          {duration}
        </text>
      </svg>
    </span>
  );
};

// ✅ Renders calendar badge + title text inline
const renderTitleWithDuration = (title) => {
  if (!title) return <span className="title-text">{title}</span>;

  const durationRegex = /(\d+D\d+N)/i;
  const match = title.match(durationRegex);

  if (!match) return <span className="title-text">{title}</span>;

  const duration = match[0].toUpperCase();
  const restOfTitle = title.replace(durationRegex, '').replace(/\s{2,}/g, ' ').trim();

  return (
    <span className="title-with-badge">
      <CalendarDurationBadge duration={duration} />
      <span className="title-text">{restOfTitle}</span>
    </span>
  );
};

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
  const [timerExpired, setTimerExpired] = useState(false);
  const [userIpAddress, setUserIpAddress] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const gifImgRef = useRef(null);

  // ============================================================
  // ✅ FETCH USER IP ADDRESS
  // ============================================================
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIpAddress(data.ip);
      } catch (error) {
        console.error('❌ Error fetching IP:', error);
        setUserIpAddress('unknown');
      }
    };
    fetchIpAddress();
  }, []);

  // ============================================================
  // ✅ CHECK TIMER STATUS FROM LOCALSTORAGE (SAME AS BOOKINGRIGHTFORM)
  // ============================================================
  useEffect(() => {
    if (!userIpAddress || !pkg.id) return;

    const checkTimerStatus = () => {
      const timerKey = `timer_${pkg.id}_${userIpAddress}`;
      const storedTimer = localStorage.getItem(timerKey);

      if (storedTimer) {
        try {
          const timerData = JSON.parse(storedTimer);
          const now = Date.now();
          const elapsed = now - timerData.startTime;
          const remaining = Math.max(0, 900000 - elapsed); // 15 minutes = 900000ms

          if (remaining > 0) {
            setTimerExpired(false);
          } else {
            setTimerExpired(true);
          }
        } catch (error) {
          console.error('Error parsing timer:', error);
          setTimerExpired(false);
        }
      } else {
        // No timer exists yet, so discount is still active
        setTimerExpired(false);
      }
    };

    // Check immediately
    checkTimerStatus();

    // Check every second to stay in sync
    const interval = setInterval(checkTimerStatus, 1000);

    return () => clearInterval(interval);
  }, [userIpAddress, pkg.id]);

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  
  // ============================================================
  // ✅ PRICE CALCULATION BASED ON TIMER STATUS
  // ============================================================
  let displayPrice = pkg.price;
  let displayOriginalPrice = pkg.price;
  let showDiscount = false;
  let discountPercentage = 0;

  if (timerExpired) {
    // Timer expired - show 10% markup price (same as bookingRightForm)
    displayPrice = Math.round(pkg.price * 1.10);
    displayOriginalPrice = displayPrice;
    showDiscount = false;
    discountPercentage = 0;
  } else {
    // Timer active - show discounted price
    displayPrice = pkg.price;
    displayOriginalPrice = pkg.originalPrice || Math.round(pkg.price * 1.10);
    showDiscount = true;
    discountPercentage = Math.round((1 - pkg.price / displayOriginalPrice) * 100);
  }

  // Apply currency conversion
  const convertedPrice = currency === 'PHP' 
    ? displayPrice 
    : ((displayPrice / exchangeRate) * 1.30);

  const convertedOriginalPrice = currency === 'PHP'
    ? displayOriginalPrice
    : ((displayOriginalPrice / exchangeRate) * 1.30);

  // ============================================================
  // ✅ SOLO PRICE — double the base price, with currency conversion
  // ============================================================
  const soloBasePrice = pkg.price * 2;
  const convertedSoloPrice = currency === 'PHP'
    ? soloBasePrice
    : ((soloBasePrice / exchangeRate) * 1.30);

  // ============================================================
  // ✅ SELLER RATE (MARKUP) PRICE — 10% markup on base price
  // ============================================================
  const sellerRateBasePrice = Math.round(pkg.price * 1.10);
  const convertedSellerRatePrice = currency === 'PHP'
    ? sellerRateBasePrice
    : ((sellerRateBasePrice / exchangeRate) * 1.30);

  // ============================================================
  // PAX EXTRACTION LOGIC
  // ============================================================
  const getPaxNumber = () => {
    // 1. Check if package has pax field
    if (pkg.pax) {
      return pkg.pax;
    }

    // 2. Check if package has minPax field (for joiners)
    if (pkg.minPax) {
      return pkg.minPax;
    }

    // 3. Extract from title if no pax field
    const title = pkg.name.toLowerCase();
    
    // Check for "solo" in title
    if (title.includes('solo')) {
      return 1;
    }
    
    // Check for "couple" or "duo" in title
    if (title.includes('couple') || title.includes('duo')) {
      return 2;
    }
    
    // Check for "family" (common for 4 pax)
    if (title.includes('family')) {
      return 4;
    }
    
    // Check for "group" (common for 6+ pax)
    if (title.includes('group')) {
      return 6;
    }
    
    // Try to extract number from title patterns like "2 pax", "3pax", "for 2", etc.
    const paxPatterns = [
      /(\d+)\s*pax/i,           // "2 pax" or "2pax"
      /for\s*(\d+)/i,           // "for 2" or "for 4"
      /(\d+)\s*person/i,        // "2 person" or "2 persons"
      /(\d+)\s*people/i,        // "2 people"
      /(\d+)\s*guest/i,         // "2 guest" or "2 guests"
    ];
    
    for (const pattern of paxPatterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (num > 0 && num <= 50) { // Reasonable range
          return num;
        }
      }
    }
    
    // 4. Fallback to maxGuests if available
    if (pkg.maxGuests) {
      return pkg.maxGuests;
    }
    
    // 5. Default fallback
    return 2;
  };

  const paxNumber = getPaxNumber();

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    
    if (isLoggedIn) {
      // Pass package info to parent
      onToggleFavorite(pkg.id, pkg.name, pkg.location);
    } else {
      onLoginRequired();
    }
  };

  // ============================================================
  // ✅ PRICE FORMAT HELPER
  // ============================================================
  const formatPrice = (amount) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    });

  return (
    <div className="package-card"
      onMouseEnter={() => {
        setIsHovered(true);
        // Synchronously reset gif — bypasses React re-render delay
        if (gifImgRef.current) {
          gifImgRef.current.src = '';
          gifImgRef.current.src = `${sampleGif}?v=${Date.now()}`;
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
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

      {/* ✅ SHOW DISCOUNT BADGE ONLY IF TIMER NOT EXPIRED */}
      {showDiscount && discountPercentage > 0 && (
        <div className="discount-badge" style={{
          position: 'absolute',
          top: '15px',
          right: '15px',
          backgroundColor: '#FF8C00',
          color: 'white',
          padding: '6px 12px',
          borderRadius: '20px',
          fontWeight: '700',
          fontSize: '13px',
          zIndex: 2,
          boxShadow: '0 2px 8px rgba(255, 140, 0, 0.4)'
        }}>
          {discountPercentage}% OFF
        </div>
      )}

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

      {/* ✅ SAMPLE GIF — appears on card hover, resets playback on every hover */}
      <img
        ref={gifImgRef}
        src={sampleGif}
        alt=""
        style={{
          position: 'absolute',
          right: '-22px',
          bottom: '60px',
          width: '160px',
          height: '160px',
          objectFit: 'contain',
          zIndex: 4,
          pointerEvents: 'none',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.30))',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.85)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}
      />
      
      <div className="card-body">
        <div>
          <div className="card-header">
            <h3 className="card-title">{renderTitleWithDuration(pkg.name)}</h3>
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
          </div>
        </div>

        <div className="card-footer">

          {/* ✅ DUAL PRICE DISPLAY: Solo (double) + Seller Rate (markup) */}
          <div className="price-info">

            {/* ── SOLO PRICE (2×) ── */}
            <div className="price-block">
              <span className="price-label">Solo</span>

              {/* Strikethrough only shown while timer is active */}
              {showDiscount && discountPercentage > 0 && (
                <div className="price-original">
                  {currencySymbol}{formatPrice(convertedOriginalPrice * 2)}
                </div>
              )}

              <div className="price-amount">
                <span className="currency">{currencySymbol}</span>
                <span className="price-value">{formatPrice(convertedSoloPrice)}</span>
              </div>
            </div>

            {/* ── DIVIDER ── */}
            <div className="price-block-divider" />

            {/* ── SELLER RATE / MARKUP PRICE ── */}
            <div className="price-block">
              <span className="price-label">2 PAX ABOVE</span>

              {/* Strikethrough only shown while timer is active */}
              {showDiscount && discountPercentage > 0 && (
                <div className="price-original">
                  {currencySymbol}{formatPrice(convertedOriginalPrice)}
                </div>
              )}

              <div className="price-amount">
                <span className="currency">{currencySymbol}</span>
                <span className="price-value seller-rate">
                  {formatPrice(convertedSellerRatePrice)}
                </span>
              </div>
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