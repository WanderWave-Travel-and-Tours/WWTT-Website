// src/components/Transfers/transferCard.jsx
import React, { useState } from 'react';
import { MapPin, ArrowRight, ArrowLeftRight, Users, Heart, Star } from 'lucide-react';
import './transferCard.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80';

// ── Category badge config ─────────────────────────────────────────────────────
const CATEGORY_COLORS = {
  'local transfer':         { bg: 'linear-gradient(135deg, #f97316, #ea580c)', label: 'Local Transfer' },
  'international transfer': { bg: 'linear-gradient(135deg, #1d4ed8, #1e40af)', label: 'International' },
};

const getCategoryStyle = (category = '') => {
  return CATEGORY_COLORS[category.toLowerCase()] || { bg: 'linear-gradient(135deg, #f97316, #ea580c)', label: category || 'Transfer' };
};

// ── Main TransferCard Component ───────────────────────────────────────────────
function TransferCard({
  transfer,
  onInquire,
  currency = 'PHP',
  exchangeRate = 58,
  currentUser,
  isFavorited = false,
  onFavoriteToggle,
}) {
  const [imgError, setImgError] = useState(false);
  const [activeTab, setActiveTab] = useState('oneway');

  if (!transfer) return null;

  const currencySymbol = currency === 'USD' ? '$' : '₱';

  const convert = (amount) =>
    currency === 'USD' ? (amount || 0) / exchangeRate : (amount || 0);

  const formatPrice = (amount) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    });

  const imageUrl = imgError || !transfer.imageUrl ? FALLBACK_IMAGE : transfer.imageUrl;
  const categoryStyle = getCategoryStyle(transfer.category);

  const oneWayPrice     = convert(transfer.oneWayPrice);
  const roundtripPrice  = convert(transfer.roundtripPrice);
  const oneWayMarkup    = convert(transfer.oneWayMarkup   || 0);
  const roundtripMarkup = convert(transfer.roundtripMarkup || 0);

  const hasRoundtrip = transfer.roundtripPrice > 0;
  const paxCount     = transfer.pax || transfer.maxPax || transfer.capacity || null;
  const rating       = transfer.rating || null;

  const activePrice  = activeTab === 'oneway' ? oneWayPrice : roundtripPrice;
  const activeMarkup = activeTab === 'oneway' ? oneWayMarkup : roundtripMarkup;

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onFavoriteToggle) onFavoriteToggle(transfer);
  };

  return (
    <div className="transfer-card">

      {/* ── Image ── */}
      <div className="transfer-card-image">
        <img
          src={imageUrl}
          alt={transfer.title}
          className="transfer-image-content"
          onError={() => setImgError(true)}
        />

        {/* Wishlist button — top-right */}
        <button
          className={`transfer-favorite-button ${isFavorited ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            size={20}
            strokeWidth={2}
            fill={isFavorited ? '#e91e63' : 'none'}
            color={isFavorited ? '#e91e63' : '#94a3b8'}
          />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="transfer-card-body">

        {/* Title + rating */}
        <div className="transfer-title-rating-row">
          <h3 className="transfer-card-title">
            <span className="transfer-title-text">{transfer.title}</span>
          </h3>
          {rating && (
            <div className="transfer-rating-badge">
              <Star size={12} fill="#f59e0b" color="#f59e0b" />
              <span>{rating}</span>
            </div>
          )}
        </div>

        {/* Category badge + Destination + pax pills — all on one row */}
        <div className="transfer-meta-pills">
          {/* Category badge — inline with other pills */}
          <div className="transfer-body-category-badge" style={{ background: categoryStyle.bg }}>
            <ArrowLeftRight size={10} />
            {categoryStyle.label}
          </div>

          {transfer.packageDestination && (
            <div className="transfer-destination-row">
              <MapPin size={11} className="transfer-destination-icon" />
              <span className="transfer-destination-text">{transfer.packageDestination}</span>
            </div>
          )}
          {paxCount && (
            <span className="transfer-pax-badge">
              <Users size={10} /> {paxCount} PAX
            </span>
          )}
        </div>

        {/* Toggle: One Way / Roundtrip */}
        <div className="transfer-toggle-tabs">
          <button
            className={`transfer-toggle-btn ${activeTab === 'oneway' ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setActiveTab('oneway'); }}
          >
            <ArrowRight size={13} />
            One Way
          </button>
          {hasRoundtrip && (
            <button
              className={`transfer-toggle-btn ${activeTab === 'roundtrip' ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setActiveTab('roundtrip'); }}
            >
              <ArrowLeftRight size={13} />
              Roundtrip
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="transfer-card-footer">
          <div className="transfer-price-info">
            <span className="transfer-price-label">Starting at</span>
            <div className="transfer-price-amount">
              <span className="transfer-currency">{currencySymbol}</span>
              <span className="transfer-price-value">{formatPrice(activePrice)}</span>
            </div>
          </div>

          <button
            className="transfer-book-button"
            onClick={(e) => {
              e.stopPropagation();
              if (onInquire) onInquire(transfer);
            }}
          >
            Book Now
          </button>
        </div>

      </div>
    </div>
  );
}

export default TransferCard;