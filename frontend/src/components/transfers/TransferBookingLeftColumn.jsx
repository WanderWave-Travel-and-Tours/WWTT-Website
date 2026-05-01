// src/components/Transfers/TransferBookingLeftColumn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Bus, ArrowRight, ArrowLeftRight,
  CheckSquare, ChevronDown, ChevronLeft
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

  // Show short label on badge
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

// ── Main Component ─────────────────────────────────────────────────────────────
const TransferBookingLeftColumn = ({
  transfer,
  currency     = 'PHP',
  exchangeRate = 58,
  onGoBack,
  transferType = 'oneway', // 'oneway' | 'roundtrip'
}) => {
  const navigate = useNavigate();
  const toast    = useToast();

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
  const oneWayPrice      = transfer.oneWayPrice || 0;
  const roundtripPrice   = transfer.roundtripPrice || 0;
  const displayPrice     = transferType === 'roundtrip' && roundtripPrice > 0
    ? convertPrice(roundtripPrice)
    : convertPrice(oneWayPrice);

  const formatPrice = (amount) => amount.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });

  // ── Use imageUrl from model, fallback to unsplash ─────────────────────────
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
        {/* Category badge overlay */}
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
        <div className="blc-meta-row">
          {transfer.packageDestination && (
            <div className="blc-meta-item">
              <MapPin size={18} color="#f97316" />
              {transfer.packageDestination}
            </div>
          )}
        </div>

        {/* Pricing breakdown — one-way and roundtrip */}
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          border: '1.5px solid #fed7aa',
          borderRadius: '12px',
          padding: '14px 16px',
          marginTop: '12px',
          marginBottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontSize: '0.9rem',
        }}>
          {/* One Way */}
          {oneWayPrice > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: '600' }}>
                <ArrowRight size={16} color="#f97316" />
                <span>One Way</span>
              </div>
              <span style={{ fontWeight: '800', color: '#ea580c', fontSize: '1rem' }}>
                {currencySymbol}{formatPrice(convertPrice(oneWayPrice))}
              </span>
            </div>
          )}
          {/* Roundtrip */}
          {roundtripPrice > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#92400e', fontWeight: '600' }}>
                <ArrowLeftRight size={16} color="#f97316" />
                <span>Roundtrip</span>
              </div>
              <span style={{ fontWeight: '800', color: '#ea580c', fontSize: '1rem' }}>
                {currencySymbol}{formatPrice(convertPrice(roundtripPrice))}
              </span>
            </div>
          )}
        </div>
      </div>

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