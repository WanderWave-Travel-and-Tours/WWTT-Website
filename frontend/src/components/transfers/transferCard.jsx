// src/components/Transfers/transferCard.jsx
import React, { useState } from 'react';
import { MapPin, Users, ChevronRight, CheckCircle2, Car, Tag } from 'lucide-react';
import './transferCard.css';

// ── Pax color map ─────────────────────────────────────────────────────────────
const PAX_COLORS = {
  '1-2':   { top: '#0f766e', text: '#0f766e' },
  '3-4':   { top: '#1d4ed8', text: '#1d4ed8' },
  '5-6':   { top: '#7c3aed', text: '#7c3aed' },
  '7-8':   { top: '#b45309', text: '#b45309' },
  '9-10':  { top: '#dc2626', text: '#dc2626' },
  '10+':   { top: '#9f1239', text: '#9f1239' },
};
const DEFAULT_PAX_COLOR = { top: '#ea580c', text: '#ea580c' };

// ── Pax SVG Badge (mirrors CalendarDurationBadge from tourCard) ───────────────
const PaxBadge = ({ pax }) => {
  const label = pax?.trim() || '';
  const colors = PAX_COLORS[label] || DEFAULT_PAX_COLOR;
  const fontSize = label.length >= 4 ? '10' : '11.5';
  const gradId = `tpgrad_${label.replace(/[^a-z0-9]/gi, '')}`;
  const bodyGradId = `tpbodygrad_${label.replace(/[^a-z0-9]/gi, '')}`;
  const ringGradId = `tpringgrad_${label.replace(/[^a-z0-9]/gi, '')}`;
  return (
    <span className="transfer-pax-badge" aria-label={`${label} pax`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" className="transfer-pax-svg">
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
        {/* People icon rings */}
        <rect x="9" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="10" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringGradId})`} />
        <rect x="37" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="38" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringGradId})`} />
        {/* Pax text */}
        <text
          x="26" y="35"
          textAnchor="middle"
          dominantBaseline="middle"
          fill={colors.text}
          fontSize={fontSize}
          fontWeight="900"
          fontFamily="'Arial Black', Arial, sans-serif"
          letterSpacing="0.3"
        >
          {label}
        </text>
        <text
          x="26" y="46"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#64748b"
          fontSize="7.5"
          fontWeight="700"
          fontFamily="Arial, sans-serif"
        >
          PAX
        </text>
      </svg>
    </span>
  );
};

// ── Inclusions list (max 3 shown) ─────────────────────────────────────────────
const InclusionsList = ({ inclusions }) => {
  if (!inclusions) return null;
  const items = inclusions.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  if (items.length === 0) return null;
  const shown = items.slice(0, 3);
  const remaining = items.length - 3;
  return (
    <div className="transfer-inclusions-section">
      <ul className="transfer-inclusions-list">
        {shown.map((item, idx) => (
          <li key={idx} className="transfer-inclusion-item">
            <CheckCircle2 className="transfer-inclusion-icon" />
            <span className="transfer-inclusion-text">{item}</span>
          </li>
        ))}
      </ul>
      {remaining > 0 && (
        <span className="transfer-inclusions-more">+{remaining} more</span>
      )}
    </div>
  );
};

// ── Supplier badge ─────────────────────────────────────────────────────────────
const SupplierBadge = ({ supplierName }) => (
  <span className="transfer-supplier-badge">
    <Car size={10} />
    {supplierName}
  </span>
);

// ── Main TransferCard Component ───────────────────────────────────────────────
function TransferCard({ transfer, onInquire, currency = 'PHP', exchangeRate = 58 }) {
  const [imgError, setImgError] = useState(false);

  if (!transfer) return null;

  const currencySymbol = currency === 'USD' ? '$' : '₱';

  const convertedPrice = currency === 'USD'
    ? transfer.sellingPrice / exchangeRate
    : transfer.sellingPrice;

  const formatPrice = (amount) =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: currency === 'USD' ? 2 : 0,
      maximumFractionDigits: currency === 'USD' ? 2 : 0,
    });

  // Use a transport/transfer placeholder image
  const imageUrl = imgError
    ? 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80'
    : 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80';

  return (
    <div className="transfer-card">
      {/* ── Image ─────────────────────────────────────────────────────────── */}
      <div className="transfer-card-image">
        <img
          src={imageUrl}
          alt={transfer.activity}
          className="transfer-image-content"
          onError={() => setImgError(true)}
        />
        {/* Transfer badge */}
        <span className="transfer-category-badge">
          <Car size={11} /> Transfer
        </span>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="transfer-card-body">
        <div>
          {/* Title row with optional pax badge */}
          <div className="transfer-card-header">
            <h3 className="transfer-card-title">
              {transfer.pax ? (
                <span className="transfer-title-with-badge">
                  <PaxBadge pax={transfer.pax} />
                  <span className="transfer-title-text">{transfer.activity}</span>
                </span>
              ) : (
                <span className="transfer-title-text">{transfer.activity}</span>
              )}
            </h3>
          </div>

          {/* Meta row */}
          <div className="transfer-meta-row">
            <div className="transfer-detail-row">
              <MapPin className="transfer-detail-icon" />
              <span className="transfer-detail-text">{transfer.destination}</span>
            </div>
          </div>

          {/* Supplier row */}
          <div className="transfer-type-row">
            <SupplierBadge supplierName={transfer.supplierName} />
            {transfer.pax && (
              <span className="transfer-minpax-text">
                <Users size={12} /> {transfer.pax} pax
              </span>
            )}
          </div>

          {/* Inclusions */}
          <InclusionsList inclusions={transfer.inclusions} />

          {/* Notes */}
          {transfer.notes && (
            <p className="transfer-notes">{transfer.notes}</p>
          )}
        </div>

        {/* ── Footer: price + inquire button ───────────────────────────────── */}
        <div className="transfer-card-footer">
          <div className="transfer-price-info">
            <span className="transfer-price-label">Starting at</span>
            <div className="transfer-price-amount">
              <span className="transfer-currency">{currencySymbol}</span>
              <span className="transfer-price-value">{formatPrice(convertedPrice)}</span>
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
