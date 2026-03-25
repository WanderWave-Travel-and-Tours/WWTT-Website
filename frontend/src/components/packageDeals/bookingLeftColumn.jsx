import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Calendar, Plane, Hotel,
  Utensils, Bus, Camera, Briefcase, ChevronDown, ChevronUp,
  CheckSquare, CalendarDays, ChevronLeft, Settings, Clock
} from 'lucide-react';
import PackageCustomizer from './PackageCustomizer';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
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

// ✅ SVG Rubber Stamp — circular badge style (for titles with no duration pattern)
const RubberStamp = ({ text }) => {
  const cleanText = text.replace(
    /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|\u200d|\uFE0F/gu,
    ''
  ).trim().toUpperCase();

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

  const R = 38;
  const size = R * 2 + 16;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="blc-rubber-stamp-svg"
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

const BookingLeftColumn = ({
  pkg,
  currency = 'PHP',
  exchangeRate = 58,
  onCustomizationChange,
  timerExpired = false,
  onGoBack,         // ✅ ADDED: receive onGoBack from PackageBooking → PackageDeals
  paxCount = 1,     // ✅ Lifted from right form — price multiplies directly per pax
  hotelUpgradeCost = 0,  // ✅ Hotel accommodation total passed from parent (nights × rate × rooms)
  selectedFlight = null, // ✅ Flight selection from BookingRightForm — highlights Flights icon
}) => {
  // --- NAVIGATION SETUP ---
  const navigate = useNavigate();
  const { code } = useParams();
  const toast = useToast();

  // ✅ Confirm Modal state — replaces bare navigate('/packages') with a confirmation step
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });
  const closeConfirmModal = () =>
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

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
      setConfirmModal({
        isOpen: true,
        title: 'Leave This Page?',
        message: 'Are you sure you want to go back to packages? Any unsaved changes will be lost.',
        onConfirm: () => {
          closeConfirmModal();
          navigate('/packages');
        },
      });
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

  // ✅ PAX RULES — checks BOTH DB fields AND title (pkg.title is the DB field; pkg.name is the alias)
  const pkgNameLower = (pkg.title || pkg.name || '').toLowerCase();
  // ✅ Use regex for solo/joiners to handle ALL spacing variants:
  //    "solo/joiners", "solo/ joiners", "solo /joiners", "solo / joiners", "solo joiners"
  const titleIsSoloJoiners = /solo\s*\/\s*joiners/i.test(pkgNameLower) || /\bsolo\s+joiners\b/i.test(pkgNameLower);
  // ✅ "solo" must be an exact standalone word — not part of "solo/joiners"
  const titleIsSolo       = !titleIsSoloJoiners && /\bsolo\b/i.test(pkgNameLower);
  const titleIsMinTwo     = pkgNameLower.includes('min of 2') || pkgNameLower.includes('min. of 2') || pkgNameLower.includes('minimum 2') || pkgNameLower.includes('min 2 pax') || pkgNameLower.includes('min.of 2');

  // ⚠️ titleIsSoloJoiners ALWAYS takes priority — a "solo/joiners" package must NEVER
  //    be treated as solo even if pax===1 is stored in the DB for that record.
  const isSoloPkg     = !titleIsSoloJoiners && ((pkg.pax === 1) || titleIsSolo);
  const isMinOfTwoPkg = (!isSoloPkg && (pkg.tourType === 'private' && pkg.pax === 2)) || titleIsMinTwo;
  const isSoloJoiners = (!isSoloPkg && pkg.tourType === 'joiners') || titleIsSoloJoiners;

  // ✅ effectivePaxCount: For min-2 packages the base price covers 2 pax — guard against
  // the parent initially sending paxCount=1 before onPaxChange fires on mount.
  // Solo is locked at 1 regardless of what the parent passes.
  const effectivePaxCount = isMinOfTwoPkg
    ? Math.max(2, paxCount)
    : isSoloPkg
      ? 1
      : Math.max(1, paxCount);

  const basePrice = pkg.price || 0;
  const originalPriceWithMarkup = Math.round(basePrice * 1.10);
  const activeBasePrice = timerExpired ? originalPriceWithMarkup : basePrice;
  const customizationAdjustment = customizationData ? customizationData.additionalPrice : 0;
  const adjustedActivePrice = Math.max(0, activeBasePrice + customizationAdjustment);
  const adjustedOriginalActivePrice = Math.max(0, originalPriceWithMarkup + customizationAdjustment);

  // ✅ For min-2 packages: base price covers 2 pax; extra pax = price/2 each.
  //    Uses effectivePaxCount so min-2 always prices from 2 pax even if the prop
  //    hasn't updated yet (e.g. first render before onPaxChange fires).
  const displayPrice = isMinOfTwoPkg
    ? Math.round(adjustedActivePrice + Math.max(0, effectivePaxCount - 2) * (adjustedActivePrice / 2)) + hotelUpgradeCost
    : Math.round(adjustedActivePrice * effectivePaxCount) + hotelUpgradeCost;
  const convertedDisplayPrice = convertPrice(displayPrice);

  // ✅ Original (strikethrough) price — same logic + hotel cost
  const adjustedOriginalPrice = isMinOfTwoPkg
    ? Math.round(adjustedOriginalActivePrice + Math.max(0, effectivePaxCount - 2) * (adjustedOriginalActivePrice / 2)) + hotelUpgradeCost
    : Math.round(adjustedOriginalActivePrice * effectivePaxCount) + hotelUpgradeCost;
  const convertedOriginalPrice = convertPrice(adjustedOriginalPrice);

  const discountPercentage = !timerExpired && displayPrice < adjustedOriginalPrice
    ? Math.round(((adjustedOriginalPrice - displayPrice) / adjustedOriginalPrice) * 100)
    : 0;

  const { duration, restOfTitle } = parseTitleDuration(pkg.title || pkg.name);

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
        {/* Inner div clips the image with border-radius; outer wrapper stays overflow:visible so badges are never cut */}
        <div className="blc-image-inner">
          <img
            src={pkg.image || 'https://placehold.co/800x600/CCCCCC/333333?text=No+Image'}
            alt={pkg.name}
            className="blc-main-image"
          />
        </div>
        {/* ✅ STAMP OVERLAY — only shown when title has NO duration pattern */}
        {!duration && (
          <div className="blc-title-stamp-overlay">
            <RubberStamp text={pkg.title || pkg.name} />
          </div>
        )}
        {!timerExpired && discountPercentage > 0 && !(isSoloJoiners && effectivePaxCount === 1) && (
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
            {duration && <h1 className="blc-title">{restOfTitle || pkg.name}</h1>}
            <div className="blc-price-section">
              {!timerExpired && convertedOriginalPrice > convertedDisplayPrice && !(isSoloJoiners && effectivePaxCount === 1) && (
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
              <span className="blc-price-pax">
                /{effectivePaxCount} pax{isMinOfTwoPkg && effectivePaxCount > 2 ? ` (base 2 + ${effectivePaxCount - 2} extra)` : ''}
              </span>

              {hotelUpgradeCost > 0 && (
                <span style={{
                  fontSize: '0.78rem',
                  color: '#0284c7',
                  background: '#e0f2fe',
                  border: '1px solid #bae6fd',
                  borderRadius: '5px',
                  padding: '2px 8px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  🏨 +{currencySymbol}{convertPrice(hotelUpgradeCost).toLocaleString()} hotel
                </span>
              )}
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
  {(() => {
    const FLIGHT_KW   = ['airfare', 'air fare', 'flight', 'airline', 'air ticket', 'plane ticket', 'rt airfare', 'rt flight'];
    const HOTEL_KW    = ['hotel', 'accommodation', 'accomodation', 'lodging', 'room', 'stay', 'night'];
    const TRANSFER_KW = ['roundtrip', 'round trip', 'round-trip', 'rt transfer', 'rt transport', 'transfer', 'roadtrip', 'road trip', 'rt pudo', 'pudo'];
    const MEALS_KW    = ['meal', 'meals', 'breakfast', 'lunch', 'dinner', 'buffet', 'food', 'dining', 'snack'];
    const TOURS_KW    = ['tour', 'island hopping', 'island-hopping', 'activity', 'activities', 'snorkeling', 'diving', 'trekking', 'kayaking', 'surfing', 'chocolate hills', 'whale shark', 'swimming'];
    const NO_GUIDE_KW = ['no guide', 'no tour guide', 'without guide', 'w/o guide', 'no-guide'];

    const hasCustomizer = !!customizationData?.inclusions;

    const activeInclusions = hasCustomizer
      ? customizationData.inclusions
          .filter(inc => inc.isChecked)
          .map(inc => (inc.name || '').toLowerCase().trim())
      : (pkg.inclusions || []).map(s => s.toLowerCase().trim());

    const hasKw = (kws) => activeInclusions.some(inc => 
      kws.some(kw => inc.includes(kw))
    );

    // ✅ SMART HOTEL DETECTION - Handles "5D4N Accommodation", "4D3N Accom", etc.
    const hasHotel = hasCustomizer 
      ? activeInclusions.some(inc => 
          HOTEL_KW.some(kw => inc.includes(kw)) ||
          /\d+d\d+n.*(accommodation|accomodation)/i.test(inc) ||
          /accommodation/i.test(inc)
        )
      : true;

    const pkgNameLower = (pkg.name || '').toLowerCase();
    const hasNoGuide = NO_GUIDE_KW.some(kw => pkgNameLower.includes(kw))
      || activeInclusions.some(inc => NO_GUIDE_KW.some(kw => inc.includes(kw)));

    const ICONS = [
      { Icon: Plane,     label: 'Flights',  active: !!selectedFlight || hasKw(FLIGHT_KW)  },
      { Icon: Hotel,     label: 'Hotel',    active: hasHotel },   // ← Smart detection
      { Icon: Bus,       label: 'Transfer', active: hasKw(TRANSFER_KW)                     },
      { Icon: Utensils,  label: 'Meals',    active: hasKw(MEALS_KW)                        },
      { Icon: Camera,    label: 'Tours',    active: hasKw(TOURS_KW)                        },
      { Icon: Briefcase, label: 'Guide',    active: !hasNoGuide                            },
    ];

    return ICONS.map(({ Icon, label, active }) => (
      <Icon
        key={label}
        size={22}
        className={active ? 'blc-icon blc-icon--active' : 'blc-icon'}
      />
    ));
  })()}
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

      {/* ✅ Custom Confirm Modal — replaces bare navigate('/packages') */}
      <CustomConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

export default BookingLeftColumn;