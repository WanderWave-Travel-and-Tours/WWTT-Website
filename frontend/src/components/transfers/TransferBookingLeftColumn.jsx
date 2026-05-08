// src/components/Transfers/TransferBookingLeftColumn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Bus, ArrowRight, ArrowLeftRight,
  CheckSquare, ChevronDown, ChevronLeft, Check
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import './TransferBookingLeftColumn.css';

// ── Transfer Type Badge (color based on category field) ─────────────────────
const TransferTypeBadge = ({ category }) => {
  const label = (category || 'Transfer').toUpperCase();

  const colorMap = {
    'LOCAL TRANSFER':         { top: '#ea580c', text: '#ea580c' },
    'INTERNATIONAL TRANSFER': { top: '#1d4ed8', text: '#1d4ed8' },
  };

  const colors = colorMap[label] || { top: '#ea580c', text: '#ea580c' };

  const shortLabel = label.includes('INTERNATIONAL') ? 'INTL' : 'LOCAL';
  const gradId  = `tbadge_grad_${shortLabel}`;
  const bodyId  = `tbadge_body_${shortLabel}`;
  const ringId  = `tbadge_ring_${shortLabel}`;

  return (
    <span className="blc-duration-calendar-badge" aria-label={category}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" className="blc-duration-calendar-svg">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
          </linearGradient>
          <linearGradient id={bodyId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dde3ea" />
          </linearGradient>
          <linearGradient id={ringId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        <rect x="3" y="9" width="48" height="43" rx="8" ry="8" fill="rgba(0,0,0,0.12)" />
        <rect x="2" y="8" width="48" height="43" rx="8" ry="8" fill={`url(#${bodyId})`} />
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={colors.top} />
        <rect x="2" y="14" width="48" height="7" fill={colors.top} />
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={`url(#${gradId})`} />
        <rect x="2" y="21" width="48" height="1" fill="rgba(0,0,0,0.08)" />
        <rect x="9"  y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="10" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringId})`} />
        <rect x="37" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="38" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringId})`} />
        <text x="26" y="37" textAnchor="middle" dominantBaseline="middle"
          fill={colors.text} fontSize="9" fontWeight="900"
          fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.3"
        >{shortLabel}</text>
      </svg>
    </span>
  );
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80';

// ── Transfer Type Selector ─────────────────────────────────────────────────
const TransferTypeSelector = ({ transferType, onSelect, oneWayPrice, roundtripPrice, currencySymbol, formatPrice, convertPrice }) => {
  const options = [
    {
      key: 'oneway',
      icon: <ArrowRight size={28} strokeWidth={2.5} />,
      label: 'One Way',
      description: 'Single journey to your destination',
      price: convertPrice(oneWayPrice),
      features: ['Flexible departure', 'Direct route', 'No return needed'],
    },
    {
      key: 'roundtrip',
      icon: <ArrowLeftRight size={28} strokeWidth={2.5} />,
      label: 'Roundtrip',
      description: 'Go & return for a complete trip',
      price: convertPrice(roundtripPrice),
      features: ['Both-way covered', 'Guaranteed return', 'Priority booking'],
    },
  ];

  return (
    <div className="blc-transfer-type-section">
      <div className="blc-transfer-type-header">
        <ArrowLeftRight size={16} color="#f97316" />
        <span className="blc-transfer-type-label">TRANSFER TYPE</span>
      </div>
      <div className="blc-transfer-type-grid">
        {options.map((opt) => {
          const isActive = transferType === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              className={`blc-transfer-type-card${isActive ? ' active' : ''}`}
              onClick={() => onSelect(opt.key)}
            >
              {/* Selected check */}
              <span className={`blc-tt-check${isActive ? ' visible' : ''}`}>
                {isActive && <Check size={14} strokeWidth={3} />}
              </span>

              {/* Icon circle */}
              <div className={`blc-tt-icon-circle${isActive ? ' active' : ''}`}>
                {opt.icon}
              </div>

              {/* Label + description */}
              <p className={`blc-tt-name${isActive ? ' active' : ''}`}>{opt.label}</p>
              <p className="blc-tt-desc">{opt.description}</p>

              {/* Price */}
              <p className={`blc-tt-price${isActive ? ' active' : ''}`}>
                {currencySymbol}{formatPrice(opt.price)}
              </p>

              {/* Features */}
              <ul className="blc-tt-features">
                {opt.features.map((f) => (
                  <li key={f} className="blc-tt-feature-item">
                    <Check size={13} strokeWidth={2.5} color="#f97316" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const TransferBookingLeftColumn = ({
  transfer,
  currency     = 'PHP',
  exchangeRate = 58,
  onGoBack,
  // parent can optionally control transferType; if not passed, managed internally
  transferType: transferTypeProp,
  onTransferTypeChange,
}) => {
  const navigate = useNavigate();
  const toast    = useToast();

  // ── Internal state — used when parent doesn't control transferType ─────────
  const [internalTransferType, setInternalTransferType] = useState('oneway');

  const isControlled = transferTypeProp !== undefined;
  const transferType = isControlled ? transferTypeProp : internalTransferType;

  const handleTransferTypeChange = (type) => {
    if (!isControlled) setInternalTransferType(type);
    if (onTransferTypeChange) onTransferTypeChange(type);
  };

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  // ── Back navigation ───────────────────────────────────────────────────────
  const handleBackClick = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      setConfirmModal({
        isOpen:  true,
        title:   'Leave This Page?',
        message: 'Are you sure you want to go back? Any unsaved changes will be lost.',
        onConfirm: () => { closeConfirmModal(); navigate('/transfers'); },
      });
    }
  };

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice   = (phpPrice) => currency === 'PHP' ? (phpPrice || 0) : ((phpPrice || 0) / exchangeRate);

  // ── Price from Transfer model fields ──────────────────────────────────────
  const oneWayPrice    = transfer.oneWayPrice || 0;
  const roundtripPrice = transfer.roundtripPrice || 0;
  const displayPrice   = transferType === 'roundtrip' && roundtripPrice > 0
    ? convertPrice(roundtripPrice)
    : convertPrice(oneWayPrice);

  const formatPrice = (amount) => amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });

  const imageUrl = transfer.imageUrl || FALLBACK_IMAGE;

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
          src={imageUrl}
          alt={transfer.title || 'Transfer'}
          className="blc-main-image"
          onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
        />
        <div className="blc-offer-badge-overlay">
          <Bus size={14} />
          {transfer.category || 'Transfer'}
        </div>
      </div>

      {/* ── Header Info ──────────────────────────────────────────────────── */}
      <div className="blc-header-section">
        <div className="blc-title-badge-row">
          <TransferTypeBadge category={transfer.category} />

          <div className="blc-badge-right-col">
            <h1 className="blc-title">{transfer.title || 'Transfer'}</h1>

            <div className="blc-price-section">
              <span className="blc-price" style={{ color: '#f97316' }}>
                {currencySymbol}{formatPrice(displayPrice)}
              </span>
              <span className="blc-price-pax">/transfer</span>
            </div>
          </div>
        </div>

        {/* Meta row — destination */}
        {transfer.packageDestination && (
          <div className="blc-meta-row">
            <div className="blc-meta-item">
              <MapPin size={18} color="#f97316" />
              {transfer.packageDestination}
            </div>
          </div>
        )}
      </div>

      {/* ── Transfer Type Selector ───────────────────────────────────────── */}
      <TransferTypeSelector
        transferType={transferType}
        onSelect={handleTransferTypeChange}
        oneWayPrice={oneWayPrice}
        roundtripPrice={roundtripPrice}
        currencySymbol={currencySymbol}
        formatPrice={formatPrice}
        convertPrice={convertPrice}
      />

      {/* ── Confirm Modal ─────────────────────────────────────────────────── */}
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

export default TransferBookingLeftColumn;