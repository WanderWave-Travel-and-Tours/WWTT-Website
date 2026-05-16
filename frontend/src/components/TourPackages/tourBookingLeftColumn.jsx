import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, CheckCircle, ChevronLeft, User,
  Clock, BedDouble, UtensilsCrossed, Plane,
  Bus, Waves, TreePine, Landmark, Ticket,
  Camera, Tag
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import './tourBookingLeftColumn.css';

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const isGuideItem = (text) =>
  /\b(licensed\s+)?tour\s*guide\b|\bguide\b/i.test(text);

/** Extract a leading emoji from an inclusion string, return { emoji, cleanText } */
const extractLeadingEmoji = (text) => {
  const emojiRegex = /^((?:\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F\uDE80-\uDEFF]|\uD83E[\uDD00-\uDDFF]|[\u2600-\u27BF]|[\u2300-\u23FF]|[\u2B00-\u2BFF])\uFE0F?)+\s*/;
  const match = text.match(emojiRegex);
  if (!match) return { emoji: null, cleanText: text.trim() };
  return {
    emoji: match[0].trim(),
    cleanText: text.slice(match[0].length).trim(),
  };
};

/** Detect category label per inclusion item */
const detectInclusionCategory = (text) => {
  const lower = text.toLowerCase();
  if (/\b(licensed\s+)?tour\s*guide\b|\bguide\b/i.test(lower))    return 'COMPLIMENTARY';
  if (/\d{1,2}:\d{2}\s*(am|pm)|schedule|itinerary/i.test(lower))  return 'SCHEDULE';
  if (/hotel|accommodation|accomodation|lodge|resort|inn|stay/i.test(lower)) return 'ACCOMMODATION';
  if (/breakfast|lunch|dinner|meal|food|buffet|dining/i.test(lower)) return 'MEALS';
  if (/flight|airfare|airline|air fare/i.test(lower))               return 'AIRFARE';
  if (/transfer|transport|van|bus|pudo|round.?trip/i.test(lower))   return 'TRANSFER';
  if (/beach|island hopping|shore|sidetrip/i.test(lower))           return 'BEACH SIDETRIP';
  if (/safari|sanctuary|wildlife|reserve/i.test(lower))             return 'WILDLIFE SANCTUARY';
  if (/town|city|heritage|culture|local|museum/i.test(lower))       return 'TOWN VISIT';
  if (/entrance|admission|ticket|fee/i.test(lower))                  return 'ENTRANCE FEE';
  if (/island|hopping|snorkel|diving|kayak|trekking|surfing|swimming|activity|activities/i.test(lower)) return 'ACTIVITY';
  return 'INCLUSION';
};

/** Return a lucide icon component for a given category */
const getCategoryIcon = (category) => {
  const props = { size: 15, color: '#fff', strokeWidth: 2.2 };
  switch (category) {
    case 'COMPLIMENTARY':      return <User       {...props} />;
    case 'SCHEDULE':           return <Clock      {...props} />;
    case 'ACCOMMODATION':      return <BedDouble  {...props} />;
    case 'MEALS':              return <UtensilsCrossed {...props} />;
    case 'AIRFARE':            return <Plane      {...props} />;
    case 'TRANSFER':           return <Bus        {...props} />;
    case 'BEACH SIDETRIP':     return <Waves      {...props} />;
    case 'WILDLIFE SANCTUARY': return <TreePine   {...props} />;
    case 'TOWN VISIT':         return <Landmark   {...props} />;
    case 'ENTRANCE FEE':       return <Ticket     {...props} />;
    case 'ACTIVITY':           return <Camera     {...props} />;
    default:                   return <Tag        {...props} />;
  }
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
  const [showAllInclusions, setShowAllInclusions] = useState(false);

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

  const inclusions = pkg.inclusions || [];

  // ── Smart category detection (kept for other usage) ───────────────────────
  const CATEGORIES = [
    { key: 'flight',   label: 'Airfare',    icon: '✈️', kws: ['airfare','air fare','flight','airline','plane ticket','rt airfare'] },
    { key: 'hotel',    label: 'Hotel',      icon: '🏨', kws: ['hotel','accommodation','accomodation','lodging','room','stay','night'] },
    { key: 'transfer', label: 'Transfer',   icon: '🚌', kws: ['roundtrip','round trip','round-trip','rt transfer','transfer','roadtrip','pudo'] },
    { key: 'meals',    label: 'Meals',      icon: '🍽️', kws: ['meal','meals','breakfast','lunch','dinner','buffet','food','dining'] },
    { key: 'tours',    label: 'Activities', icon: '📸', kws: ['tour','island hopping','activity','activities','snorkeling','diving','trekking','kayaking','surfing','swimming'] },
    { key: 'guide',    label: 'Tour Guide', icon: '🧭', kws: [] },
  ];
  const lowerInclusions = inclusions.map(s => s.toLowerCase().trim());
  const pkgNameLow = (pkg.name || pkg.title || '').toLowerCase();
  const hasNoGuide = ['no guide','no tour guide','without guide','w/o guide'].some(kw =>
    pkgNameLow.includes(kw) || lowerInclusions.some(i => i.includes(kw))
  );
  const activeCategories = CATEGORIES.filter(cat => {
    if (cat.key === 'guide') return !hasNoGuide;
    if (cat.key === 'flight') return !!selectedFlight || lowerInclusions.some(inc => cat.kws.some(kw => inc.includes(kw)));
    return lowerInclusions.some(inc => cat.kws.some(kw => inc.includes(kw)));
  });

  // ── Build final display list — guide row always first ────────────────────
  const hasGuideInInclusions = inclusions.some(item => isGuideItem(item));
  let displayInclusions;
  if (!hasNoGuide && !hasGuideInInclusions) {
    // No guide in list yet — auto-prepend
    displayInclusions = ['Licensed Tour Guide', ...inclusions];
  } else if (!hasNoGuide && hasGuideInInclusions) {
    // Guide exists somewhere in the array — move it/them to the front
    const guideItems    = inclusions.filter(item => isGuideItem(item));
    const nonGuideItems = inclusions.filter(item => !isGuideItem(item));
    displayInclusions = [...guideItems, ...nonGuideItems];
  } else {
    // hasNoGuide — show inclusions as-is, no guide row
    displayInclusions = inclusions;
  }

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
      </div>

      {/* ── What's Included ──────────────────────────────────────────────── */}
      <div className="blc-inclusions-section">

        {/* Header — orange left border */}
        <div className="blc-inclusions-header">
          <h3 className="blc-inclusions-title">What's Included</h3>
          {displayInclusions.length > 0 && (
            <span className="blc-inclusions-badge">✓ {displayInclusions.length} items</span>
          )}
        </div>

        {/* Inclusions list — v2 */}
        {displayInclusions.length > 0 ? (
          <>
            <ul className="blc-inclusions-list">
              {(showAllInclusions ? displayInclusions : displayInclusions.slice(0, 5)).map((item, idx) => {
              const guide = isGuideItem(item);
              const category = detectInclusionCategory(item);
              const { cleanText } = extractLeadingEmoji(item);

              return (
                <li
                  key={idx}
                  className={`blc-inclusion-item-v2${guide ? ' blc-inclusion-item--guide' : ''}`}
                >
                  {/* Left: icon circle */}
                  <div className="blc-incl-icon-col">
                    <div className={`blc-incl-circle${guide ? ' blc-incl-circle--guide' : ''}`}>
                      {getCategoryIcon(category)}
                    </div>
                  </div>

                  {/* Middle: category label + title */}
                  <div className="blc-incl-text-col">
                    <span className="blc-incl-category-label">{category}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="blc-incl-main-title">{cleanText}</span>
                      {guide && (
                        <span className="blc-incl-free-badge">FREE</span>
                      )}
                    </div>
                  </div>

                  {/* Right: checkmark */}
                  <div className="blc-incl-check-col">
                    <CheckCircle
                      size={18}
                      color={guide ? '#f97316' : '#10b981'}
                      strokeWidth={1.8}
                    />
                  </div>
                </li>
              );
            })}
            </ul>

            {/* See More / See Less button */}
            {displayInclusions.length > 5 && (
              <button
                className="blc-see-more-btn"
                onClick={() => setShowAllInclusions(prev => !prev)}
                type="button"
              >
                {showAllInclusions
                  ? '▲ See Less'
                  : `▼ See ${displayInclusions.length - 5} More Item${displayInclusions.length - 5 > 1 ? 's' : ''}`}
              </button>
            )}
          </>
        ) : (
          <p className="blc-inclusions-empty">No inclusions listed.</p>
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