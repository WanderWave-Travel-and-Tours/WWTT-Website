// src/components/Transfers/TransferBookingLeftColumn.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Car, Users, ChevronLeft, ChevronDown, CheckSquare
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import '../packageDeals/BookingLeftColumn.css'; // reuse same styles

// ── Pax color map (mirrors transferCard.jsx) ──────────────────────────────────
const PAX_COLORS = {
  '1-2':  { top: '#0f766e' },
  '3-4':  { top: '#1d4ed8' },
  '5-6':  { top: '#7c3aed' },
  '7-8':  { top: '#b45309' },
  '9-10': { top: '#dc2626' },
  '10+':  { top: '#9f1239' },
};
const DEFAULT_PAX_COLOR = { top: '#FF8C00' };

// ── Pax SVG Badge ─────────────────────────────────────────────────────────────
const PaxBadge = ({ pax }) => {
  const label  = pax?.trim() || '';
  const colors = PAX_COLORS[label] || DEFAULT_PAX_COLOR;
  const fontSize = label.length >= 4 ? '10' : '11.5';
  const safeId = label.replace(/[^a-z0-9]/gi, '') || 'default';
  return (
    <span aria-label={`${label} pax`} style={{ display: 'inline-flex', alignItems: 'flex-start' }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 54 54" style={{ width: 68, height: 68, display: 'block', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.22))' }}>
        <defs>
          <linearGradient id={`tpgrad_${safeId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
          </linearGradient>
          <linearGradient id={`tpbody_${safeId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#dde3ea" />
          </linearGradient>
          <linearGradient id={`tpring_${safeId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        <rect x="3" y="9" width="48" height="43" rx="8" ry="8" fill="rgba(0,0,0,0.12)" />
        <rect x="2" y="8" width="48" height="43" rx="8" ry="8" fill={`url(#tpbody_${safeId})`} />
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={colors.top} />
        <rect x="2" y="14" width="48" height="7" fill={colors.top} />
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={`url(#tpgrad_${safeId})`} />
        <rect x="2" y="21" width="48" height="1" fill="rgba(0,0,0,0.08)" />
        <rect x="9" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="10" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#tpring_${safeId})`} />
        <rect x="37" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="38" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#tpring_${safeId})`} />
        <text x="26" y="35" textAnchor="middle" dominantBaseline="middle" fill={colors.top} fontSize={fontSize} fontWeight="900" fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.3">{label}</text>
        <text x="26" y="46" textAnchor="middle" dominantBaseline="middle" fill="#64748b" fontSize="7.5" fontWeight="700" fontFamily="Arial, sans-serif">PAX</text>
      </svg>
    </span>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const TransferBookingLeftColumn = ({
  transfer,
  currency = 'PHP',
  exchangeRate = 58,
  onGoBack,
  passengerCount = 1,
}) => {
  const navigate = useNavigate();
  const toast    = useToast();

  const [confirmModal,       setConfirmModal]       = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [isInclusionsOpen,   setIsInclusionsOpen]   = useState(false);

  const closeConfirmModal = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  const handleBackClick = () => {
    if (onGoBack) {
      onGoBack();
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Leave This Page?',
        message: 'Are you sure you want to go back to transfers? Any unsaved changes will be lost.',
        onConfirm: () => { closeConfirmModal(); navigate('/transfers'); },
      });
    }
  };

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice   = (phpPrice) => currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;
  const displayPrice   = convertPrice(transfer.sellingPrice || 0);

  // Parse inclusions (string CSV or array)
  const inclusionItems = (() => {
    if (!transfer.inclusions) return [];
    if (Array.isArray(transfer.inclusions)) return transfer.inclusions;
    return transfer.inclusions.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  })();

  return (
    <div className="blc-container">

      {/* ── Back Button ────────────────────────────────────────────────────── */}
      <button className="blc-back-btn" onClick={handleBackClick} type="button">
        <ChevronLeft size={22} strokeWidth={2.5} />
        <span>Go Back</span>
      </button>

      {/* ── Image ────────────────────────────────────────────────────────────── */}
      <div className="blc-image-wrapper">
        <div className="blc-image-inner">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80"
            alt={transfer.activity}
            className="blc-main-image"
          />
        </div>
      </div>

      {/* ── Header Info ────────────────────────────────────────────────────── */}
      <div className="blc-header-section">
        <div className="blc-title-badge-row">
          {transfer.pax && <PaxBadge pax={transfer.pax} />}
          <div className="blc-badge-right-col">
            <h1 className="blc-title">{transfer.activity}</h1>
            <div className="blc-price-section">
              <span className="blc-price" style={{ color: '#FF8C00' }}>
                {currencySymbol}{displayPrice.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0,
                })}
              </span>
              <span className="blc-price-pax">/ {transfer.pax || '1'} pax</span>
            </div>
          </div>
        </div>

        <div className="blc-meta-row">
          <div className="blc-meta-item">
            <MapPin size={18} color="#FF8C00" /> {transfer.destination}
          </div>
          {transfer.supplierName && (
            <div className="blc-meta-item">
              <Car size={18} color="#FF8C00" /> {transfer.supplierName}
            </div>
          )}
          {transfer.pax && (
            <div className="blc-meta-item">
              <Users size={18} color="#FF8C00" /> {transfer.pax} pax
            </div>
          )}
        </div>

        {/* ── Inclusion icons row ──────────────────────────────────────────── */}
        <div className="blc-icons-row">
          <Car   size={22} className="blc-icon blc-icon--active" />
          <MapPin size={22} className="blc-icon blc-icon--active" />
          <Users size={22} className="blc-icon blc-icon--active" />
        </div>
      </div>

      {/* ── Notes ────────────────────────────────────────────────────────────── */}
      {transfer.notes && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '16px', fontSize: '0.9rem', color: '#475569', fontStyle: 'italic', lineHeight: '1.6', borderLeft: '4px solid #FF8C00' }}>
          <strong style={{ color: '#1e293b', fontStyle: 'normal' }}>Note: </strong>
          {transfer.notes}
        </div>
      )}

      {/* ── What's Included ──────────────────────────────────────────────────── */}
      {inclusionItems.length > 0 && (
        <div className="blc-card">
          <div className="blc-card-header" onClick={() => setIsInclusionsOpen(!isInclusionsOpen)}>
            <h3 className="blc-section-title">
              <CheckSquare size={20} color="#10b981" /> What's Included
            </h3>
            <div className={`blc-chevron ${isInclusionsOpen ? 'rotated' : ''}`}>
              <ChevronDown size={20} />
            </div>
          </div>
          <div className={`blc-collapsible ${isInclusionsOpen ? 'open' : ''}`}>
            <ul className="blc-list">
              {inclusionItems.map((item, idx) => (
                <li key={idx} className="blc-list-item">
                  <div style={{ minWidth: '20px', marginTop: '2px' }}><CheckSquare size={16} color="#10b981" /></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Price Summary ──────────────────────────────────────────────────── */}
      <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '12px', padding: '16px', marginTop: '16px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Price Summary</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.95rem', color: '#374151' }}>
            {currencySymbol}{displayPrice.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })} × {passengerCount} pax
          </span>
          <strong style={{ fontSize: '1.2rem', color: '#FF8C00' }}>
            {currencySymbol}{(displayPrice * passengerCount).toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 })}
          </strong>
        </div>
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

export default TransferBookingLeftColumn;
