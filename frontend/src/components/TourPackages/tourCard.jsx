// src/components/TourPackages/tourCard.jsx
import React, { useState } from 'react';
import { MapPin, Clock, Users, ChevronRight, CheckCircle2, Tag } from 'lucide-react';
import './tourCard.css';

// ── Duration color map (reused from packageCard palette) ──────────────────────
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

// ── Calendar Duration Badge (reused from packageCard) ─────────────────────────
const CalendarDurationBadge = ({ duration }) => {
  const colors = DURATION_COLORS[duration?.toUpperCase()] || DEFAULT_DURATION_COLOR;
  const normalizedDuration = duration?.toUpperCase() || '';
  const fontSize = normalizedDuration.length >= 5 ? "11" : "12.5";
  const gradId = `tgrad_${normalizedDuration}`;
  const bodyGradId = `tbodygrad_${normalizedDuration}`;
  const ringGradId = `tringgrad_${normalizedDuration}`;
  return (
    <span className="duration-calendar-badge" aria-label={normalizedDuration}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" className="duration-calendar-svg">
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
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          fontSize={fontSize}
          fontWeight="900"
          fontFamily="'Arial Black', Arial, sans-serif"
          letterSpacing="0.3"
        >
          {normalizedDuration}
        </text>
      </svg>
    </span>
  );
};

// ── Parse duration string to extract D/N pattern ──────────────────────────────
const parseDurationBadge = (durationStr) => {
  if (!durationStr) return null;
  const match = durationStr.match(/(\d+D\d+N)/i);
  return match ? match[0].toUpperCase() : null;
};

// ── Inclusions list (max 3 shown) ─────────────────────────────────────────────
const InclusionsList = ({ inclusions = [] }) => {
  if (!inclusions || inclusions.length === 0) return null;
  const shown = inclusions.slice(0, 3);
  const remaining = inclusions.length - 3;
  return (
    <div className="inclusions-section">
      <ul className="inclusions-list">
        {shown.map((item, idx) => (
          <li key={idx} className="inclusion-item">
            <CheckCircle2 className="inclusion-icon" />
            <span className="inclusion-text">{item}</span>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <span className="inclusions-more">+{remaining} more</span>
      )}
    </div>
  );
};

// ── Tour Type Badge (image overlay) ──────────────────────────────────────────
const TourTypeBadge = ({ tourType, minPax }) => {
  const isJoiners = tourType === 'joiners';
  return (
    <>
      <span className="tour-type-badge-img">
        <Users size={11} />
        {isJoiners ? 'Joiners' : 'Private'}
      </span>
      {isJoiners && minPax && (
        <span className="tour-minpax-badge-img">
          Min. {minPax} pax
        </span>
      )}
    </>
  );
};

// ── Main TourCard Component ────────────────────────────────────────────────────
function TourCard({ tour, onBookNow, currency = 'PHP', exchangeRate = 58 }) {
  const [imgError, setImgError] = useState(false);

  if (!tour) return null;

  const durationBadge = parseDurationBadge(tour.duration);
  const currencySymbol = currency === 'USD' ? '$' : '₱';

  const convertedPrice = currency === 'USD'
    ? tour.price / exchangeRate
    : tour.price;

  const formatPrice = (amount) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    });

  const imageUrl = imgError
    ? 'https://via.placeholder.com/800x400?text=Tour+Image'
    : (tour.image || 'https://via.placeholder.com/800x400?text=Tour+Image');

  return (
    <div className="tour-card">
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="tour-card-image">
        <img
          src={imageUrl}
          alt={tour.title}
          className="tour-image-content"
          onError={() => setImgError(true)}
        />

        {/* Single top row: LOCAL · JOINERS · Min. X pax */}
        <div className="tour-image-top-row">
          <span className={`tour-category-badge ${tour.category === 'International' ? 'intl' : 'local'}`}>
            {tour.category}
          </span>
          <TourTypeBadge tourType={tour.tourType} minPax={tour.minPax} />
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="tour-card-body">
        <div>
          {/* Title row with optional duration badge */}
          <div className="tour-card-header">
            <h3 className="tour-card-title">
              {durationBadge ? (
                <span className="title-with-badge">
                  <CalendarDurationBadge duration={durationBadge} />
                  <span className="title-text">{tour.title.replace(/\d+D\d+N/i, '').trim()}</span>
                </span>
              ) : (
                <span className="title-text">{tour.title}</span>
              )}
            </h3>
          </div>

          {/* Meta row */}
          <div className="tour-meta-row">
            <div className="tour-detail-row">
              <MapPin className="tour-detail-icon" />
              <span className="tour-detail-text">{tour.destination}</span>
            </div>
            <span className="tour-meta-divider">·</span>
            <div className="tour-detail-row">
              <Clock className="tour-detail-icon" />
              <span className="tour-detail-text">{tour.duration}</span>
            </div>
          </div>

          {/* Inclusions */}
          <InclusionsList inclusions={tour.inclusions} />
        </div>

        {/* ── Footer: price + book button ───────────────────────────────── */}
        <div className="tour-card-footer">
          <div className="tour-price-info">
            <span className="tour-price-label">Starting at</span>
            <div className="tour-price-amount">
              <span className="tour-currency">{currencySymbol}</span>
              <span className="tour-price-value">{formatPrice(convertedPrice)}</span>
            </div>
          </div>

          <button
            className="tour-book-button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBookNow) onBookNow(tour);
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

export default TourCard;