// src/components/PackageDeals/packageCard.jsx - WITH AUTOMATIC TIMER-BASED PRICING
import React, { useState, useEffect } from 'react';
import { Heart, Star, MapPin, Calendar, Users, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
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

// ✅ SVG Rubber Stamp — circular badge style, auto-adjusts font size for long titles
const RubberStamp = ({ text }) => {
  const cleanText = text.replace(
    /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|\u200d|\uFE0F/gu,
    ''
  ).trim().toUpperCase();

  const words = cleanText.split(/[\s\/]+/).filter(Boolean);

  // ✅ Split into up to 3 lines for long titles, 2 lines for short
  let lines = [];
  if (words.length <= 2) {
    // 1–2 words: keep on 1 or 2 lines as before
    if (words.length === 1) {
      lines = [words[0]];
    } else {
      lines = [words[0], words[1]];
    }
  } else if (words.length <= 4) {
    // 3–4 words: split into 2 balanced lines
    const mid = Math.ceil(words.length / 2);
    lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
  } else {
    // 5+ words: split into 3 lines
    const third = Math.ceil(words.length / 3);
    lines = [
      words.slice(0, third).join(' '),
      words.slice(third, third * 2).join(' '),
      words.slice(third * 2).join(' '),
    ].filter(Boolean);
  }

  const R = 38;
  const size = R * 2 + 16;
  const cx = size / 2;
  const cy = size / 2;

  // ✅ Auto font size: shrink based on longest line character count
  const maxLineLen = Math.max(...lines.map(l => l.length));
  let fontSize = 10;
  if (maxLineLen > 14) fontSize = 7;
  else if (maxLineLen > 11) fontSize = 8;
  else if (maxLineLen > 8)  fontSize = 9;

  // ✅ Vertical spacing: tighter for 3 lines
  const lineHeight = lines.length === 3 ? 11 : 15;
  const totalHeight = (lines.length - 1) * lineHeight;
  const startY = cy - totalHeight / 2;

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

      {/* Text lines — auto-sized, vertically centered */}
      {lines.map((line, i) => (
        <text
          key={i}
          x={cx}
          y={startY + i * lineHeight}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#ffffff"
          fontSize={fontSize}
          fontWeight="900"
          fontFamily="'Arial Black', Arial, sans-serif"
          letterSpacing="0.5"
        >
          {line}
        </text>
      ))}
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
        <span className="inclusions-more" style={{ background: '#001b3e', color: '#fff' }}>+{remaining} more</span>
      )}
    </div>
  );
};

// ============================================================
// ✅ TIMER CHECK HOOK — reads localStorage to determine if
//    the discount timer for this package+IP has expired.
//    Returns: { timerExpired, timerReady }
//    timerReady = false while IP is still being fetched (avoids flash)
// ============================================================
const usePackageTimerExpired = (packageId) => {
  const [timerExpired, setTimerExpired] = useState(false);
  const [timerReady, setTimerReady] = useState(false);

  useEffect(() => {
    if (!packageId) return;

    const checkTimer = (ip) => {
      const timerKey = `timer_${packageId}_${ip}`;
      const lastResetKey = `lastReset_${packageId}_${ip}`;
      const today = new Date().toDateString();
      const lastReset = localStorage.getItem(lastResetKey);

      // ✅ If it's a new day, timer would be reset on booking page load — treat as NOT expired
      if (lastReset !== today) {
        setTimerExpired(false);
        setTimerReady(true);
        return;
      }

      const storedTimer = localStorage.getItem(timerKey);
      if (!storedTimer) {
        // No timer yet — user hasn't visited booking page, show discounted price
        setTimerExpired(false);
        setTimerReady(true);
        return;
      }

      try {
        const { startTime } = JSON.parse(storedTimer);
        const elapsed = Date.now() - startTime;
        const expired = elapsed >= 900000; // 15 minutes
        setTimerExpired(expired);
      } catch {
        setTimerExpired(false);
      }
      setTimerReady(true);
    };

    // ✅ Fetch IP then check timer — same source of truth as booking page
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => checkTimer(data.ip))
      .catch(() => {
        // If IP fetch fails, default to non-expired (show discount price)
        setTimerExpired(false);
        setTimerReady(true);
      });
  }, [packageId]);

  return { timerExpired, timerReady };
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

  // ✅ Check timer status for this package
  const packageId = pkg._id || pkg.id;
  const { timerExpired, timerReady } = usePackageTimerExpired(packageId);

  // ============================================================
  // ✅ PRICE COMPUTATION — timer-aware
  //    Discounted  = pkg.price (base)
  //    Expired     = pkg.price * 1.10 (original/regular price)
  // ============================================================
  const basePrice      = pkg.price || 0;
  const regularPrice   = Math.round(basePrice * 1.10); // what they pay when timer expires
  const discountAmount = regularPrice - basePrice;
  const discountPct    = Math.round((discountAmount / regularPrice) * 100);

  const applyConversion = (phpPrice) =>
    currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;

  const displayPrice   = applyConversion(timerExpired ? regularPrice : basePrice);
  const originalPrice  = applyConversion(regularPrice); // shown as strikethrough when NOT expired

  // ✅ Solo & Multiple Pax prices — also timer-aware
  const hasSoloPaxPrice     = pkg.soloPaxPrice != null;
  const hasMultiplePaxPrice = pkg.multiplePaxPrice != null;

  const soloBase     = pkg.soloPaxPrice || 0;
  const multiBase    = pkg.multiplePaxPrice || 0;
  const soloRegular  = Math.round(soloBase * 1.10);
  const multiRegular = Math.round(multiBase * 1.10);

  const convertedSoloPrice         = hasSoloPaxPrice     ? applyConversion(timerExpired ? soloRegular  : soloBase)  : null;
  const convertedSoloOriginal      = hasSoloPaxPrice     ? applyConversion(soloRegular)  : null;
  const convertedMultiplePaxPrice  = hasMultiplePaxPrice ? applyConversion(timerExpired ? multiRegular : multiBase) : null;
  const convertedMultiOriginal     = hasMultiplePaxPrice ? applyConversion(multiRegular) : null;

  // ============================================================
  // PAX EXTRACTION LOGIC
  // ============================================================
  const getPaxNumber = () => {
    if (pkg.pax) return pkg.pax;
    if (pkg.minPax) return pkg.minPax;

    const title = pkg.name.toLowerCase();
    if (title.includes('solo')) return 1;
    if (title.includes('couple') || title.includes('duo')) return 2;
    if (title.includes('family')) return 4;
    if (title.includes('group')) return 6;

    const paxPatterns = [
      /(\d+)\s*pax/i,
      /for\s*(\d+)/i,
      /(\d+)\s*person/i,
      /(\d+)\s*people/i,
      /(\d+)\s*guest/i,
    ];
    for (const pattern of paxPatterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        const num = parseInt(match[1]);
        if (num > 0 && num <= 50) return num;
      }
    }
    if (pkg.maxGuests) return pkg.maxGuests;
    return 2;
  };

  const paxNumber = getPaxNumber();

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (isLoggedIn) {
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
    <div className="package-card">
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

        {/* ✅ LIMITED TIME OFFER BADGE — only shown when timer is NOT expired */}
        {timerReady && !timerExpired && discountPct > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            background: '#001b3e',
            color: '#fff',
            fontSize: '0.7rem',
            fontWeight: '800',
            padding: '4px 10px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 2px 8px rgba(0,27,62,0.5)',
            letterSpacing: '0.3px',
          }}>
            <Clock size={11} />
            LIMITED OFFER · SAVE {discountPct}%
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

          {/* ✅ DUAL PRICE DISPLAY: Solo + Multiple Pax — timer-aware */}
          <div className="price-info">

            {/* ── SOLO PRICE ── */}
            {hasSoloPaxPrice && (
              <div className="price-block">
                {/* Strikethrough original — only when timer is active (not expired) */}
                {timerReady && !timerExpired && (
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    textDecoration: 'line-through',
                    fontWeight: '500',
                    display: 'block',
                    lineHeight: 1,
                    marginBottom: '1px',
                  }}>
                    {currencySymbol}{formatPrice(convertedSoloOriginal)}
                  </span>
                )}
                <div className="price-amount">
                  <span className="currency">{currencySymbol}</span>
                  <span
                    className="price-value"
                    style={{ color: timerReady && !timerExpired ? '#f97316' : undefined }}
                  >
                    {timerReady ? formatPrice(convertedSoloPrice) : '—'}
                  </span>
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
                {/* Strikethrough original — only when timer is active */}
                {timerReady && !timerExpired && (
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    textDecoration: 'line-through',
                    fontWeight: '500',
                    display: 'block',
                    lineHeight: 1,
                    marginBottom: '1px',
                  }}>
                    {currencySymbol}{formatPrice(convertedMultiOriginal)}
                  </span>
                )}
                <div className="price-amount">
                  <span className="currency">{currencySymbol}</span>
                  <span
                    className="price-value seller-rate"
                    style={{ color: timerReady && !timerExpired ? '#f97316' : undefined }}
                  >
                    {timerReady ? formatPrice(convertedMultiplePaxPrice) : '—'}
                  </span>
                </div>
              </div>
            )}

            {/* ── FALLBACK: show base price if neither pax price is set ── */}
            {!hasSoloPaxPrice && !hasMultiplePaxPrice && (
              <div className="price-block">
                {/* Strikethrough original — only when timer is active */}
                {timerReady && !timerExpired && discountPct > 0 && (
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#94a3b8',
                    textDecoration: 'line-through',
                    fontWeight: '500',
                    display: 'block',
                    lineHeight: 1,
                    marginBottom: '1px',
                  }}>
                    {currencySymbol}{formatPrice(originalPrice)}
                  </span>
                )}
                <div className="price-amount">
                  <span className="currency">{currencySymbol}</span>
                  <span
                    className="price-value"
                    style={{ color: timerReady && !timerExpired ? '#f97316' : undefined }}
                  >
                    {timerReady ? formatPrice(displayPrice) : '—'}
                  </span>
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