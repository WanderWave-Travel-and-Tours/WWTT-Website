import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Plane, Hotel,
  Utensils, Bus, Camera, Briefcase, ChevronDown, ChevronUp,
  CheckSquare, CalendarDays, ChevronLeft
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import './tourBookingLeftColumn.css'; // ✅ Reuse same styles

// ── Duration color map ────────────────────────────────────────────────────────
const DURATION_COLORS = {
  '2D1N':  { top: '#d97706', text: '#d97706' },
  '3D2N':  { top: '#14532d', text: '#14532d' },
  '4D3N':  { top: '#1d4ed8', text: '#1d4ed8' },
  '5D4N':  { top: '#dc2626', text: '#dc2626' },
  '6D5N':  { top: '#7c3aed', text: '#7c3aed' },
  '7D6N':  { top: '#b45309', text: '#b45309' },
  '8D7N':  { top: '#9f1239', text: '#9f1239' },
  '9D8N':  { top: '#15803d', text: '#15803d' },
  '10D9N': { top: '#1e40af', text: '#1e40af' },
};
const DEFAULT_DURATION_COLOR = { top: '#ea580c', text: '#ea580c' };

// ── Calendar Duration Badge ───────────────────────────────────────────────────
const CalendarDurationBadge = ({ duration }) => {
  const colors = DURATION_COLORS[duration] || DEFAULT_DURATION_COLOR;
  const fontSize = duration.length >= 5 ? "11" : "12.5";
  const gradId = `blc_grad_${duration}`;
  const bodyGradId = `blc_bodygrad_${duration}`;
  const ringGradId = `blc_ringgrad_${duration}`;
  return (
    <span className="blc-duration-calendar-badge" aria-label={duration}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" className="blc-duration-calendar-svg">
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
        <rect x="3" y="9" width="48" height="43" rx="8" ry="8" fill="rgba(0,0,0,0.12)" />
        <rect x="2" y="8" width="48" height="43" rx="8" ry="8" fill={`url(#${bodyGradId})`} />
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={colors.top} />
        <rect x="2" y="14" width="48" height="7" fill={colors.top} />
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={`url(#${gradId})`} />
        <rect x="2" y="21" width="48" height="1" fill="rgba(0,0,0,0.08)" />
        <rect x="9" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="10" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringGradId})`} />
        <rect x="37" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="38" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringGradId})`} />
        <text
          x="26" y="38"
          textAnchor="middle" dominantBaseline="middle"
          fill={colors.text} fontSize={fontSize} fontWeight="900"
          fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.3"
        >{duration}</text>
      </svg>
    </span>
  );
};

// ── Parse duration from title ─────────────────────────────────────────────────
const parseTitleDuration = (title) => {
  if (!title) return { duration: null, restOfTitle: title };
  const match = title.match(/(\d+D\d+N)/i);
  if (!match) return { duration: null, restOfTitle: title };
  const duration = match[0].toUpperCase();
  const restOfTitle = title.replace(/(\d+D\d+N)/i, '').replace(/\s{2,}/g, ' ').trim();
  return { duration, restOfTitle };
};

// ── Rubber Stamp (no-duration titles) ────────────────────────────────────────
const RubberStamp = ({ text }) => {
  const cleanText = text.replace(
    /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|\u200d|\uFE0F/gu,
    ''
  ).trim().toUpperCase();
  const words = cleanText.split(/[\s\/]+/).filter(Boolean);
  let line1 = '', line2 = '';
  if (words.length === 1) { line1 = words[0]; }
  else { const mid = Math.ceil(words.length / 2); line1 = words.slice(0, mid).join(' '); line2 = words.slice(mid).join(' '); }
  const R = 38, size = R * 2 + 16, cx = size / 2, cy = size / 2;
  const longestLine = line2 ? (line1.length >= line2.length ? line1 : line2) : line1;
  const computedFontSize = Math.min(10, Math.max(6, Math.floor(((R - 8) * 2) / (longestLine.length * 0.65))));
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="blc-rubber-stamp-svg">
      <circle cx={cx} cy={cy} r={R} fill="#ea580c"/>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeDasharray="4 2"/>
      <circle cx={cx} cy={cy} r={R - 5} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1"/>
      {line2 ? (
        <>
          <text x={cx} y={cy - 7} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={computedFontSize} fontWeight="900" fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.5">{line1}</text>
          <text x={cx} y={cy + 8} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={computedFontSize} fontWeight="900" fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.5">{line2}</text>
        </>
      ) : (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize={computedFontSize} fontWeight="900" fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.5">{line1}</text>
      )}
    </svg>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const TourBookingLeftColumn = ({
  pkg,
  currency = 'PHP',
  exchangeRate = 58,
  onGoBack,
  paxCount = 1,
  selectedFlight = null,
}) => {
  const navigate = useNavigate();
  const toast = useToast();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  const [isItineraryExpanded, setIsItineraryExpanded] = useState(false);
  const [expandedDayIndices, setExpandedDayIndices] = useState({});
  const [isIncludedExpanded, setIsIncludedExpanded] = useState(false);

  // ✅ Back navigation — uses onGoBack prop if available (same-page view switch)
  const handleBackClick = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Leave This Page?',
        message: 'Are you sure you want to go back to tours? Any unsaved changes will be lost.',
        onConfirm: () => { closeConfirmModal(); navigate('/tours'); },
      });
    }
  };

  const itinerary = pkg.itinerary || [];
  const INITIAL_DAYS = 3;
  const shouldShowButton = itinerary.length > INITIAL_DAYS;
  const visibleItinerary = isItineraryExpanded ? itinerary : itinerary.slice(0, INITIAL_DAYS);

  const toggleDay = (index) => setExpandedDayIndices(prev => ({ ...prev, [index]: !prev[index] }));

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice = (phpPrice) => currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;

  // ── Pax/price rules ───────────────────────────────────────────────────────
  const pkgNameLower = (pkg.title || pkg.name || '').toLowerCase();
  const titleIsSoloJoiners = /solo\s*\/\s*joiners/i.test(pkgNameLower) || /\bsolo\s+joiners\b/i.test(pkgNameLower);
  const titleIsSolo       = !titleIsSoloJoiners && /\bsolo\b/i.test(pkgNameLower);
  const titleIsMinTwo     = pkgNameLower.includes('min of 2') || pkgNameLower.includes('min. of 2') || pkgNameLower.includes('minimum 2') || pkgNameLower.includes('min 2 pax');

  const isSoloPkg     = !titleIsSoloJoiners && ((pkg.pax === 1) || titleIsSolo);
  const isMinOfTwoPkg = (!isSoloPkg && (pkg.tourType === 'private' && pkg.pax === 2)) || titleIsMinTwo;
  const isSoloJoiners = (!isSoloPkg && pkg.tourType === 'joiners') || titleIsSoloJoiners;

  const effectivePaxCount = isMinOfTwoPkg ? Math.max(2, paxCount) : isSoloPkg ? 1 : Math.max(1, paxCount);

  const basePrice = pkg.price || 0;

  const displayPrice = isMinOfTwoPkg
    ? Math.round(basePrice + Math.max(0, effectivePaxCount - 2) * (basePrice / 2))
    : Math.round(basePrice * effectivePaxCount);
  const convertedDisplayPrice = convertPrice(displayPrice);

  const { duration, restOfTitle } = parseTitleDuration(pkg.title || pkg.name);

  return (
    <div className="blc-container">
      {/* ── Go Back ──────────────────────────────────────────────────────── */}
      <button className="blc-back-btn" onClick={handleBackClick} type="button">
        <ChevronLeft size={22} strokeWidth={2.5} />
        <span>Go Back</span>
      </button>

      {/* ── Image ────────────────────────────────────────────────────────── */}
      <div className="blc-image-wrapper">
        <img
          src={pkg.image || 'https://placehold.co/800x600/CCCCCC/333333?text=No+Image'}
          alt={pkg.title || pkg.name}
          className="blc-main-image"
        />
      </div>

      {/* ── Header Info ──────────────────────────────────────────────────── */}
      <div className="blc-header-section">
        <div className="blc-title-badge-row">
          {duration && <CalendarDurationBadge duration={duration} />}
          <div className="blc-badge-right-col">
            {duration && <h1 className="blc-title">{restOfTitle || (pkg.title || pkg.name)}</h1>}
            {!duration && <h1 className="blc-title">{pkg.title || pkg.name}</h1>}
            <div className="blc-price-section">
              <span className="blc-price" style={{ color: '#f97316' }}>
                {currencySymbol}{convertedDisplayPrice.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0
                })}
              </span>
              <span className="blc-price-pax">
                /{effectivePaxCount} pax{isMinOfTwoPkg && effectivePaxCount > 2 ? ` (base 2 + ${effectivePaxCount - 2} extra)` : ''}
              </span>
            </div>
          </div>
        </div>

        <div className="blc-meta-row">
          <div className="blc-meta-item">
            <MapPin size={18} color="#f97316" /> {pkg.location || pkg.destination}
          </div>
        </div>

        {/* ── Inclusion icons ──────────────────────────────────────────── */}
        <div className="blc-icons-row">
          {(() => {
            const FLIGHT_KW   = ['airfare', 'air fare', 'flight', 'airline', 'plane ticket', 'rt airfare'];
            const HOTEL_KW    = ['hotel', 'accommodation', 'accomodation', 'lodging', 'room', 'stay', 'night'];
            const TRANSFER_KW = ['roundtrip', 'round trip', 'round-trip', 'rt transfer', 'transfer', 'roadtrip', 'pudo'];
            const MEALS_KW    = ['meal', 'meals', 'breakfast', 'lunch', 'dinner', 'buffet', 'food', 'dining'];
            const TOURS_KW    = ['tour', 'island hopping', 'activity', 'activities', 'snorkeling', 'diving', 'trekking', 'kayaking', 'surfing', 'swimming'];
            const NO_GUIDE_KW = ['no guide', 'no tour guide', 'without guide', 'w/o guide'];
            const activeInclusions = (pkg.inclusions || []).map(s => s.toLowerCase().trim());
            const hasKw = (kws) => activeInclusions.some(inc => kws.some(kw => inc.includes(kw)));
            const pkgNameLow = (pkg.name || pkg.title || '').toLowerCase();
            const hasNoGuide = NO_GUIDE_KW.some(kw => pkgNameLow.includes(kw)) || activeInclusions.some(inc => NO_GUIDE_KW.some(kw => inc.includes(kw)));
            const ICONS = [
              { Icon: Plane,     label: 'Flights',  active: !!selectedFlight || hasKw(FLIGHT_KW)  },
              { Icon: Hotel,     label: 'Hotel',    active: hasKw(HOTEL_KW)                        },
              { Icon: Bus,       label: 'Transfer', active: hasKw(TRANSFER_KW)                     },
              { Icon: Utensils,  label: 'Meals',    active: hasKw(MEALS_KW)                        },
              { Icon: Camera,    label: 'Tours',    active: hasKw(TOURS_KW)                        },
              { Icon: Briefcase, label: 'Guide',    active: !hasNoGuide                            },
            ];
            return ICONS.map(({ Icon, label, active }) => (
              <Icon key={label} size={22} className={active ? 'blc-icon blc-icon--active' : 'blc-icon'} />
            ));
          })()}
        </div>
      </div>

      {/* ── What's Included ──────────────────────────────────────────────── */}
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
            {(pkg.inclusions || []).map((item, idx) => (
              <li key={idx} className="blc-list-item">
                <div style={{ minWidth: '20px', marginTop: '2px' }}><CheckSquare size={16} color="#10b981" /></div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Itinerary ────────────────────────────────────────────────────── */}
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
            <button onClick={() => setIsItineraryExpanded(!isItineraryExpanded)} className="blc-expand-btn">
              {isItineraryExpanded ? (<>Show Less Days <ChevronUp size={16} /></>) : (<>Show {itinerary.length - INITIAL_DAYS} More Days <ChevronDown size={16} /></>)}
            </button>
          </div>
        )}
      </div>

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

export default TourBookingLeftColumn;