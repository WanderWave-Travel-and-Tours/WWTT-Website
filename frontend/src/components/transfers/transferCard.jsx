// src/components/Transfers/transferCard.jsx
import React, { useState } from 'react';
import { MapPin, ChevronRight, Car, ArrowRight, ArrowLeftRight, Users } from 'lucide-react';
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
const PriceRow = ({ label, icon: Icon, price, markup, currencySymbol, formatPrice }) => {
  if (!price || price === 0) return null;
  const basePrice = markup ? price - markup : price;
  return (
    <div className="transfer-price-row">
      <span className="transfer-price-row-label">
        <Icon size={13} style={{ color: '#FF8C00', flexShrink: 0 }} />
        {label}
      </span>
      <span className="transfer-price-row-value">
        {markup > 0 && (
          <span className="transfer-price-breakdown">
            {currencySymbol}{formatPrice(basePrice)} + {currencySymbol}{formatPrice(markup)} markup
          </span>
        )}
        <span className="transfer-price-total">
          <span className="transfer-currency">{currencySymbol}</span>
          <span className="transfer-price-value">{formatPrice(price)}</span>
        </span>
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

  // Markup values (if present on the transfer model)
  const oneWayMarkup = convert(transfer.oneWayMarkup || 0);
  const roundtripMarkup = convert(transfer.roundtripMarkup || 0);

  // Pax / capacity
  const paxCount = transfer.pax || transfer.maxPax || transfer.capacity || null;

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

        {/* ── Top badges row: Category only ── */}
        <div className="transfer-badges-row">
          {/* Category badge */}
          <span
            className="transfer-category-badge"
            style={{ backgroundColor: categoryStyle.bg }}
          >
            <Car size={11} /> {categoryStyle.label}
          </span>
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

            {/* Destination + Pax — side by side */}
            <div className="transfer-meta-pills">
              {transfer.packageDestination && (
                <div className="transfer-destination-row">
                  <MapPin size={13} className="transfer-destination-icon" />
                  <span className="transfer-destination-text">{transfer.packageDestination}</span>
                </div>
              )}
              {paxCount && (
                <span className="transfer-pax-badge">
                  <Users size={11} /> {paxCount} PAX
                </span>
              )}
            </div>
          </div>

          {/* Pricing rows */}
          <div className="transfer-pricing-block">
            <PriceRow
              label="One Way"
              icon={ArrowRight}
              price={startingPrice}
              markup={oneWayMarkup}
              currencySymbol={currencySymbol}
              formatPrice={formatPrice}
            />
            {transfer.roundtripPrice > 0 && (
              <PriceRow
                label="Roundtrip"
                icon={ArrowLeftRight}
                price={roundtripConverted}
                markup={roundtripMarkup}
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