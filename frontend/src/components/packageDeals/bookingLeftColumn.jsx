import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Calendar, Plane, Hotel,
  Utensils, Bus, Camera, Briefcase, ChevronDown, ChevronUp,
  CheckSquare, CalendarDays, ChevronLeft, Settings, Clock
} from 'lucide-react';
import PackageCustomizer from './PackageCustomizer';
import './BookingLeftColumn.css';

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

// ✅ Calendar icon badge — matches packageCard design
const CalendarDurationBadge = ({ duration }) => {
  const colors = DURATION_COLORS[duration] || DEFAULT_DURATION_COLOR;
  const fontSize = duration.length >= 5 ? "11" : "12.5";
  const gradId = `blc_grad_${duration}`;
  const bodyGradId = `blc_bodygrad_${duration}`;
  const ringGradId = `blc_ringgrad_${duration}`;
  return (
    <span className="blc-duration-calendar-badge" aria-label={duration}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 54 54"
        className="blc-duration-calendar-svg"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
          </linearGradient>
          <linearGradient id={bodyGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dde3ea" />
          </linearGradient>
          <linearGradient id={ringGradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>

        {/* Outer shadow */}
        <rect x="3" y="9" width="48" height="43" rx="8" ry="8" fill="rgba(0,0,0,0.12)" />
        {/* White/gray body */}
        <rect x="2" y="8" width="48" height="43" rx="8" ry="8" fill={`url(#${bodyGradId})`} />
        {/* Colored top header */}
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={colors.top} />
        {/* Square off bottom of header */}
        <rect x="2" y="14" width="48" height="7" fill={colors.top} />
        {/* Shine on header */}
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={`url(#${gradId})`} />
        {/* Separator line */}
        <rect x="2" y="21" width="48" height="1" fill="rgba(0,0,0,0.08)" />
        {/* LEFT ring */}
        <rect x="9" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="10" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringGradId})`} />
        {/* RIGHT ring */}
        <rect x="37" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="38" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringGradId})`} />
        {/* Duration text */}
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

// ✅ Extracts duration code and rest of title
const parseTitleDuration = (title) => {
  if (!title) return { duration: null, restOfTitle: title };
  const durationRegex = /(\d+D\d+N)/i;
  const match = title.match(durationRegex);
  if (!match) return { duration: null, restOfTitle: title };
  const duration = match[0].toUpperCase();
  const restOfTitle = title.replace(durationRegex, '').replace(/\s{2,}/g, ' ').trim();
  return { duration, restOfTitle };
};

const BookingLeftColumn = ({
  pkg,
  currency = 'PHP',
  exchangeRate = 58,
  onCustomizationChange,
  timerExpired = false,
  onGoBack,         // ✅ ADDED: receive onGoBack from PackageBooking → PackageDeals
  paxCount = 1      // ✅ Lifted from right form — price multiplies directly per pax
}) => {
  // --- NAVIGATION SETUP ---
  const navigate = useNavigate();
  const { code } = useParams();
  const [isItineraryExpanded, setIsItineraryExpanded] = useState(false);
  const [expandedDayIndices, setExpandedDayIndices] = useState({});
  const [isIncludedExpanded, setIsIncludedExpanded] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isCustomized, setIsCustomized] = useState(false);
  const [customizationData, setCustomizationData] = useState(null);

  // ✅ FIXED: Use onGoBack prop if available (same-page view switch),
  //           fallback to navigate only if rendered standalone
  const handleBackClick = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      navigate('/packages');
    }
  };

  const itinerary = pkg.itinerary || [];
  const INITIAL_DAYS = 3;
  const shouldShowButton = itinerary.length > INITIAL_DAYS;
  const visibleItinerary = isItineraryExpanded ? itinerary : itinerary.slice(0, INITIAL_DAYS);

  const toggleDay = (index) => {
    setExpandedDayIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCustomizationChange = (customizationDataFromChild) => {
    setCustomizationData(customizationDataFromChild);
    setIsCustomized(
      customizationDataFromChild.additionalPrice !== 0 || 
      customizationDataFromChild.deductions > 0 ||
      customizationDataFromChild.additions > 0
    );
    if (onCustomizationChange) {
      onCustomizationChange(customizationDataFromChild);
    }
  };

  const CUSTOMIZABLE_DESTINATIONS = [
    'siargao', 'siquijor', 'bohol', 'cebu',
    'el nido', 'coron', 'palawan', 'puerto princesa',
  ];
  const dest = (pkg.destination || pkg.location || '').toLowerCase().trim();
  const isCustomizableDestination = CUSTOMIZABLE_DESTINATIONS.some(d => dest.includes(d));

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice = (phpPrice) => {
    if (currency === 'PHP') return phpPrice;
    return (phpPrice / exchangeRate) * 1.30;
  };

  const basePrice = pkg.price || 0;
  const originalPriceWithMarkup = Math.round(basePrice * 1.10);
  const activeBasePrice = timerExpired ? originalPriceWithMarkup : basePrice;
  const customizationAdjustment = customizationData ? customizationData.additionalPrice : 0;
  const adjustedActivePrice = Math.max(0, activeBasePrice + customizationAdjustment);

  // ✅ Price multiplies directly per pax — 1 pax = 1×price, 2 pax = 2×price, etc.
  const displayPrice = Math.round(adjustedActivePrice * paxCount);
  const convertedDisplayPrice = convertPrice(displayPrice);

  // ✅ Original (strikethrough) price — same straight multiplication
  const adjustedOriginalPrice = Math.round((originalPriceWithMarkup + customizationAdjustment) * paxCount);
  const convertedOriginalPrice = convertPrice(adjustedOriginalPrice);

  const discountPercentage = !timerExpired && displayPrice < adjustedOriginalPrice
    ? Math.round(((adjustedOriginalPrice - displayPrice) / adjustedOriginalPrice) * 100)
    : 0;

  const { duration, restOfTitle } = parseTitleDuration(pkg.name);

  return (
    <div className="blc-container">
      <button 
        className="blc-back-btn" 
        onClick={handleBackClick}
        type="button"
      >
        <ChevronLeft size={22} strokeWidth={2.5} />
        <span>Go Back</span>
      </button>

      <div className="blc-image-wrapper">
        <img
          src={pkg.image || 'https://placehold.co/800x600/CCCCCC/333333?text=No+Image'}
          alt={pkg.name}
          className="blc-main-image"
        />
        {!timerExpired && discountPercentage > 0 && (
          <div className="blc-offer-badge-overlay">
            <Clock size={16} />
            <span>Limited Time Offer - Save {discountPercentage}%</span>
          </div>
        )}
      </div>

      <div className="blc-header-section">

        {/* ✅ Badge left | Title + Price stacked right */}
        <div className="blc-title-badge-row">
          {duration && <CalendarDurationBadge duration={duration} />}
          <div className="blc-badge-right-col">
            <h1 className="blc-title">{restOfTitle || pkg.name}</h1>
            <div className="blc-price-section">
              {!timerExpired && convertedOriginalPrice > convertedDisplayPrice && (
                <span className="blc-price-original">
                  {currencySymbol}{convertedOriginalPrice.toLocaleString(undefined, {
                    minimumFractionDigits: currency === 'USD' ? 2 : 0,
                    maximumFractionDigits: currency === 'USD' ? 2 : 0
                  })}
                </span>
              )}
              <span className="blc-price" style={{ color: !timerExpired ? '#f97316' : '#64748b' }}>
                {currencySymbol}{convertedDisplayPrice.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0
                })}
              </span>
              <span className="blc-price-pax">/{paxCount} pax</span>
              {isCustomized && (
                <span className="blc-customized-badge">
                  <Settings size={14} /> Customized
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="blc-meta-row">
          <div className="blc-meta-item">
            <MapPin size={18} color="#f97316" /> {pkg.location || pkg.destination}
          </div>
        </div>

        <div className="blc-icons-row">
          {[Plane, Hotel, Bus, Utensils, Camera, Briefcase].map((Icon, i) => (
            <Icon key={i} size={22} className="blc-icon" />
          ))}
        </div>
      </div>

      {isCustomizableDestination && (
        <div className="blc-customizer-section">
          <button
            className={`blc-customizer-toggle ${showCustomizer ? 'active' : ''}`}
            onClick={() => setShowCustomizer(!showCustomizer)}
          >
            <Settings size={20} />
            <span>{showCustomizer ? 'Hide Customization' : 'Customize This Package'}</span>
          </button>
          {showCustomizer && (
            <PackageCustomizer
              pkg={pkg}
              currency={currency}
              exchangeRate={exchangeRate}
              onCustomizationChange={handleCustomizationChange}
              timerExpired={timerExpired}
              activeBasePrice={activeBasePrice}
            />
          )}
        </div>
      )}

      {!showCustomizer && (
        <div className="blc-card">
          <div className="blc-card-header" onClick={() => setIsIncludedExpanded(!isIncludedExpanded)}>
            <h3 className="blc-section-title">
              <CheckSquare size={20} color="#10b981" /> What's Included
            </h3>
            <div className={`blc-chevron ${isIncludedExpanded ? 'rotated' : ''}`}>
              <ChevronDown size={20} />
            </div>
          </div>
          <div className={`blc-collapsible ${isIncludedExpanded ? 'open' : ''}`}>
            <ul className="blc-list">
              {pkg.inclusions?.map((item, idx) => (
                <li key={idx} className="blc-list-item">
                  <div style={{ minWidth: '20px', marginTop: '2px' }}><CheckSquare size={16} color="#10b981" /></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div>
        <h3 className="blc-section-title" style={{ marginBottom: '24px' }}>
          <CalendarDays size={20} color="#f97316" /> Tour Itinerary
        </h3>
        <div className="blc-timeline-container">
          <div className="blc-timeline-line"></div>
          {visibleItinerary.map((day, idx) => {
            const isOpen = expandedDayIndices[idx];
            return (
              <div key={idx} className="blc-timeline-item">
                <div className={`blc-timeline-dot ${isOpen ? 'active' : ''}`}></div>
                <div style={{ paddingLeft: '16px' }}>
                  <div className={`blc-day-card ${isOpen ? 'active' : ''}`} onClick={() => toggleDay(idx)}>
                    <h4 className="blc-day-title">
                      Day {day.day}: <span style={{ color: '#f97316' }}>{day.title}</span>
                    </h4>
                    <div className={`blc-chevron ${isOpen ? 'rotated' : ''}`}>
                      <ChevronDown size={20} />
                    </div>
                  </div>
                  <div className={`blc-day-content ${isOpen ? 'open' : ''}`}>
                    <div className="blc-day-inner">
                      <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {day.activities.map((act, i) => (
                          <li key={i} style={{ marginBottom: '6px' }}>{act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {(!itinerary || itinerary.length === 0) && (
            <p style={{ color: '#999', paddingLeft: '20px', fontStyle: 'italic' }}>No itinerary available.</p>
          )}
        </div>
        {shouldShowButton && (
          <div className="blc-expand-btn-container">
            <button
              onClick={() => setIsItineraryExpanded(!isItineraryExpanded)}
              className="blc-expand-btn"
            >
              {isItineraryExpanded ? (
                <>Show Less Days <ChevronUp size={16} /></>
              ) : (
                <>Show {itinerary.length - INITIAL_DAYS} More Days <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingLeftColumn;