// src/components/Transfers/transferCard.jsx
import React, { useState } from 'react';
import { MapPin, ChevronRight, Car, ArrowRight, ArrowLeftRight } from 'lucide-react';
import './transferCard.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80';

// ── Category badge color map ──────────────────────────────────────────────────
const CATEGORY_COLORS = {
  'local transfer':         { bg: '#FF8C00', label: 'Local Transfer' },
  'international transfer': { bg: '#1d4ed8', label: 'International' },
};

const getCategoryStyle = (category = '') => {
  return CATEGORY_COLORS[category.toLowerCase()] || { bg: '#FF8C00', label: category || 'Transfer' };
};

// ── Price row (one-way / roundtrip) ──────────────────────────────────────────
const PriceRow = ({ label, icon: Icon, price, currencySymbol, formatPrice }) => {
  if (!price || price === 0) return null;
  return (
    <div className="transfer-price-row">
      <span className="transfer-price-row-label">
        <Icon size={13} style={{ color: '#FF8C00', flexShrink: 0 }} />
        {label}
      </span>
      <span className="transfer-price-row-value">
        <span className="transfer-currency">{currencySymbol}</span>
        <span className="transfer-price-value">{formatPrice(price)}</span>
      </span>
    </div>
  );
};

// ── Main TransferCard Component ───────────────────────────────────────────────
function TransferCard({ transfer, onInquire, currency = 'PHP', exchangeRate = 58 }) {
  const [imgError, setImgError] = useState(false);

  if (!transfer) return null;

  const currencySymbol = currency === 'USD' ? '$' : '₱';

  const convert = (amount) =>
    currency === 'USD' ? (amount || 0) / exchangeRate : (amount || 0);

  const formatPrice = (amount) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    });

  // Image: use the one stored in the model, fall back to unsplash
  const imageUrl = imgError || !transfer.imageUrl
    ? FALLBACK_IMAGE
    : transfer.imageUrl;

  const categoryStyle = getCategoryStyle(transfer.category);

  // Starting price = oneWayPrice (lower of the two)
  const startingPrice = convert(transfer.oneWayPrice);
  const roundtripConverted = convert(transfer.roundtripPrice);

  return (
    <div className="transfer-card">
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="transfer-card-image">
        <img
          src={imageUrl}
          alt={transfer.title}
          className="transfer-image-content"
          onError={() => setImgError(true)}
        />

        {/* ── Badges row: Category + Destination ── */}
        <div className="transfer-badges-row">
          {/* Category badge */}
          <span
            className="transfer-category-badge"
            style={{ backgroundColor: categoryStyle.bg }}
          >
            <Car size={11} /> {categoryStyle.label}
          </span>

          {/* Destination tag */}
          {transfer.packageDestination && (
            <span className="transfer-destination-badge">
              <MapPin size={10} /> {transfer.packageDestination}
            </span>
          )}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="transfer-card-body">
        <div>
          {/* Title */}
          <div className="transfer-card-header">
            <h3 className="transfer-card-title">
              <span className="transfer-title-text">{transfer.title}</span>
            </h3>
          </div>

          {/* Pricing rows */}
          <div className="transfer-pricing-block">
            <PriceRow
              label="One Way"
              icon={ArrowRight}
              price={startingPrice}
              currencySymbol={currencySymbol}
              formatPrice={formatPrice}
            />
            {transfer.roundtripPrice > 0 && (
              <PriceRow
                label="Roundtrip"
                icon={ArrowLeftRight}
                price={roundtripConverted}
                currencySymbol={currencySymbol}
                formatPrice={formatPrice}
              />
            )}
          </div>
        </div>

        {/* ── Footer: starting price + inquire button ───────────────────────── */}
        <div className="transfer-card-footer">
          <div className="transfer-price-info">
            <span className="transfer-price-label">Starting at</span>
            <div className="transfer-price-amount">
              <span className="transfer-currency">{currencySymbol}</span>
              <span className="transfer-price-value">{formatPrice(startingPrice)}</span>
            </div>
          </div>

          <button
            className="transfer-book-button"
            onClick={(e) => {
              e.stopPropagation();
              if (onInquire) onInquire(transfer);
            }}
          >
            <span>Inquire Now</span>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default TransferCard;