// src/components/PackageDeals/packageCard.jsx - WITH AUTOMATIC TIMER-BASED PRICING
import React from 'react';
import { Heart, Star, MapPin, Calendar, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';
import './packageCard.css';

// ✅ Unique accent color per duration — WanderWave branded
const DURATION_COLORS = {
  '2D1N':  { top: '#d97706', text: '#d97706' },  // yellow orange
  '3D2N':  { top: '#14532d', text: '#14532d' },  // dark green
  '4D3N':  { top: '#1d4ed8', text: '#1d4ed8' },  // blue
  '5D4N':  { top: '#dc2626', text: '#dc2626' },  // red
  '6D5N':  { top: '#7c3aed', text: '#7c3aed' },  // purple
  '7D6N':  { top: '#b45309', text: '#b45309' },  // amber
  '8D7N':  { top: '#9f1239', text: '#9f1239' },  // dark rose
  '9D8N':  { top: '#15803d', text: '#15803d' },  // green
  '10D9N': { top: '#1e40af', text: '#1e40af' },  // dark blue
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

// ✅ Checks if title contains a duration pattern
const hasDurationInTitle = (title) => {
  if (!title) return false;
  return /(\d+D\d+N)/i.test(title);
};

// ✅ SVG Rubber Stamp — circular badge style
const RubberStamp = ({ text }) => {
  const cleanText = text.replace(
    /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|\u200d|\uFE0F/gu,
    ''
  ).trim().toUpperCase();

  // Split into max 2 lines smartly
  const words = cleanText.split(/[\s\/]+/).filter(Boolean);
  let line1 = '';
  let line2 = '';

  if (words.length === 1) {
    line1 = words[0];
  } else {
    const mid = Math.ceil(words.length / 2);
    line1 = words.slice(0, mid).join(' ');
    line2 = words.slice(mid).join(' ');
  }

  const R = 38;   // circle radius
  const size = R * 2 + 16; // total SVG size with padding
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rubber-stamp-svg"
    >
      {/* Circle fill */}
      <circle cx={cx} cy={cy} r={R} fill="#ea580c"/>

      {/* Outer dashed border */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeDasharray="4 2"/>

      {/* Inner solid border */}
      <circle cx={cx} cy={cy} r={R - 5} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>

      {/* Text — 1 or 2 lines, always centered */}
      {line2 ? (
        <>
          <text
            x={cx} y={cy - 7}
            textAnchor="middle" dominantBaseline="central"
            fill="#ffffff" fontSize="10" fontWeight="900"
            fontFamily="'Arial Black', Arial, sans-serif"
            letterSpacing="1"
          >{line1}</text>
          <text
            x={cx} y={cy + 8}
            textAnchor="middle" dominantBaseline="central"
            fill="#ffffff" fontSize="10" fontWeight="900"
            fontFamily="'Arial Black', Arial, sans-serif"
            letterSpacing="1"
          >{line2}</text>
        </>
      ) : (
        <text
          x={cx} y={cy}
          textAnchor="middle" dominantBaseline="central"
          fill="#ffffff" fontSize="10" fontWeight="900"
          fontFamily="'Arial Black', Arial, sans-serif"
          letterSpacing="1"
        >{line1}</text>
      )}
    </svg>
  );
};

// ✅ Strips emojis from a string before display
const stripEmojis = (str) =>
  str.replace(
    /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|\u200d|\uFE0F/gu,
    ''
  ).trim();

// ✅ Renders the inclusions list — plain, no container box
const InclusionsList = ({ inclusions }) => {
  if (!inclusions || inclusions.length === 0) return null;

  const MAX_VISIBLE = 3;
  const visible = inclusions.slice(0, MAX_VISIBLE);
  const remaining = inclusions.length - MAX_VISIBLE;

  return (
    <div className="inclusions-section">
      <ul className="inclusions-list">
        {visible.map((item, idx) => (
          <li key={idx} className="inclusion-item">
            <CheckCircle2 className="inclusion-icon" size={13} />
            <span className="inclusion-text">{stripEmojis(item)}</span>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <span className="inclusions-more">+{remaining} more</span>
      )}
    </div>
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
  const currencySymbol = currency === 'PHP' ? '₱' : '$';

  // Apply currency conversion for fallback base price
  const convertedPrice = currency === 'PHP'
    ? pkg.price
    : ((pkg.price / exchangeRate) * 1.30);

  // ============================================================
  // ✅ SOLO & MULTIPLE PAX PRICES — directly from database fields
  // ============================================================
  const hasSoloPaxPrice = pkg.soloPaxPrice != null;
  const hasMultiplePaxPrice = pkg.multiplePaxPrice != null;

  const convertedSoloPrice = hasSoloPaxPrice
    ? (currency === 'PHP' ? pkg.soloPaxPrice : ((pkg.soloPaxPrice / exchangeRate) * 1.30))
    : null;

  const convertedMultiplePaxPrice = hasMultiplePaxPrice
    ? (currency === 'PHP' ? pkg.multiplePaxPrice : ((pkg.multiplePaxPrice / exchangeRate) * 1.30))
    : null;

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

  // ✅ Determine if title has a duration pattern
  const titleHasDuration = hasDurationInTitle(pkg.name);

  return (
    <div className="package-card"
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

      <div className="card-image">
        <img 
          src={getImageUrl(pkg.image)} 
          alt={pkg.name} 
          className="image-content"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/800x400?text=Image+Not+Available';
          }}
        />
        {/* ✅ STAMP OVERLAY — only shown when title has NO duration pattern */}
        {!titleHasDuration && (
          <div className="title-stamp-overlay">
            <RubberStamp text={pkg.name} />
          </div>
        )}
      </div>

      
      <div className="card-body">
        <div>
          <div className="card-header">
            {/* ✅ Title in card body — only shown when title HAS a duration pattern */}
            {titleHasDuration && (
              <h3 className="card-title">{renderTitleWithDuration(pkg.name)}</h3>
            )}
            <div className="meta-row">
              <div className="detail-row">
                <MapPin className="detail-icon" />
                <span className="detail-text">{pkg.location}</span>
              </div>
              <span className="meta-divider">·</span>
              <div className="rating-row">
                <Star className="star-icon" size={13} fill="currentColor" />
                <span className="rating-value">{pkg.rating}</span>
                <span className="rating-count">({pkg.reviews})</span>
              </div>
            </div>
          </div>

          {/* ✅ INCLUSIONS */}
          <InclusionsList inclusions={pkg.inclusions} />
        </div>

        <div className="card-footer">

          {/* ✅ DUAL PRICE DISPLAY: Solo + Multiple Pax — from DB fields */}
          <div className="price-info">

            {/* ── SOLO PRICE ── */}
            {hasSoloPaxPrice && (
              <div className="price-block">
                <div className="price-amount">
                  <span className="currency">{currencySymbol}</span>
                  <span className="price-value">{formatPrice(convertedSoloPrice)}</span>
                </div>
              </div>
            )}

            {/* ── DIVIDER — only show if both prices exist ── */}
            {hasSoloPaxPrice && hasMultiplePaxPrice && (
              <div className="price-block-divider" />
            )}

            {/* ── MULTIPLE PAX PRICE ── */}
            {hasMultiplePaxPrice && (
              <div className="price-block">
                <span className="price-label">2 PAX ABOVE</span>
                <div className="price-amount">
                  <span className="currency">{currencySymbol}</span>
                  <span className="price-value seller-rate">
                    {formatPrice(convertedMultiplePaxPrice)}
                  </span>
                </div>
              </div>
            )}

            {/* ── FALLBACK: show base price if neither pax price is set ── */}
            {!hasSoloPaxPrice && !hasMultiplePaxPrice && (
              <div className="price-block">
                <div className="price-amount">
                  <span className="currency">{currencySymbol}</span>
                  <span className="price-value">{formatPrice(convertedPrice)}</span>
                </div>
              </div>
            )}

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