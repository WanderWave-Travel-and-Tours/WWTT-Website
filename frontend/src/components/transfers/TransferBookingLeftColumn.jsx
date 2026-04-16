import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Bus, Users, Utensils, Camera, Briefcase,
  CheckSquare, ChevronDown, ChevronLeft
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import CustomConfirmModal from '../confirmationModal/CustomConfirmModal';
import './TransferBookingLeftColumn.css'; // ✅ Reuse same blc- styles

// ── Transfer Type Badge (replaces CalendarDurationBadge) ────────────────────────
const TransferTypeBadge = ({ type }) => {
  // Choose color based on transfer type keyword
  const label = (type || 'Transfer').toUpperCase().replace(/\s+/g, '\n');
  const colorMap = {
    airport:    { top: '#1d4ed8', text: '#1d4ed8' },
    private:    { top: '#7c3aed', text: '#7c3aed' },
    shared:     { top: '#059669', text: '#059669' },
    van:        { top: '#b45309', text: '#b45309' },
    bus:        { top: '#dc2626', text: '#dc2626' },
  };
  const lowerType = (type || '').toLowerCase();
  const colors = Object.entries(colorMap).find(([key]) => lowerType.includes(key))?.[1]
    || { top: '#ea580c', text: '#ea580c' };

  const words    = label.split(/[\s\/\n]+/).filter(Boolean);
  const line1    = words.slice(0, Math.ceil(words.length / 2)).join(' ');
  const line2    = words.slice(Math.ceil(words.length / 2)).join(' ');
  const fontSize = label.length >= 8 ? '10' : '11.5';
  const gradId   = `tbadge_grad_${type}`;
  const bodyId   = `tbadge_body_${type}`;
  const ringId   = `tbadge_ring_${type}`;

  return (
    <span className="blc-duration-calendar-badge" aria-label={type}>
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
        {/* Card shadow */}
        <rect x="3" y="9" width="48" height="43" rx="8" ry="8" fill="rgba(0,0,0,0.12)" />
        {/* Card body */}
        <rect x="2" y="8" width="48" height="43" rx="8" ry="8" fill={`url(#${bodyId})`} />
        {/* Colored header */}
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={colors.top} />
        <rect x="2" y="14" width="48" height="7" fill={colors.top} />
        <rect x="2" y="8" width="48" height="13" rx="8" ry="8" fill={`url(#${gradId})`} />
        <rect x="2" y="21" width="48" height="1" fill="rgba(0,0,0,0.08)" />
        {/* Left ring */}
        <rect x="9"  y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="10" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringId})`} />
        {/* Right ring */}
        <rect x="37" y="1" width="8" height="14" rx="4" ry="4" fill="#64748b" />
        <rect x="38" y="1.5" width="6" height="12" rx="3" ry="3" fill={`url(#${ringId})`} />
        {/* Label text */}
        {line2 ? (
          <>
            <text x="26" y="32" textAnchor="middle" dominantBaseline="middle"
              fill={colors.text} fontSize={fontSize} fontWeight="900"
              fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.3"
            >{line1}</text>
            <text x="26" y="43" textAnchor="middle" dominantBaseline="middle"
              fill={colors.text} fontSize={fontSize} fontWeight="900"
              fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.3"
            >{line2}</text>
          </>
        ) : (
          <text x="26" y="38" textAnchor="middle" dominantBaseline="middle"
            fill={colors.text} fontSize={fontSize} fontWeight="900"
            fontFamily="'Arial Black', Arial, sans-serif" letterSpacing="0.3"
          >{line1}</text>
        )}
      </svg>
    </span>
  );
};

// ── Derive a short badge label from the transfer name/type ──────────────────
const getTransferBadgeLabel = (transfer) => {
  const name = (transfer.activityName || transfer.name || transfer.title || '').toLowerCase();
  if (name.includes('airport'))  return 'Airport';
  if (name.includes('private'))  return 'Private';
  if (name.includes('shared'))   return 'Shared';
  if (name.includes('van'))      return 'Van';
  if (name.includes('bus'))      return 'Bus';
  return 'Transfer';
};

// ── Main Component ────────────────────────────────────────────────────────────
const TransferBookingLeftColumn = ({
  transfer,
  currency     = 'PHP',
  exchangeRate = 58,
  onGoBack,
  paxCount     = 1,
}) => {
  const navigate = useNavigate();
  const toast    = useToast();

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const closeConfirmModal = () => setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });

  const [isIncludedExpanded, setIsIncludedExpanded] = useState(false);

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
  const convertPrice   = (phpPrice) => currency === 'PHP' ? phpPrice : (phpPrice / exchangeRate) * 1.30;

  const sellingPrice           = transfer.sellingPrice || transfer.price || 0;
  const convertedDisplayPrice  = convertPrice(sellingPrice);

  const transferName  = transfer.activityName || transfer.name || transfer.title || 'Transfer';
  const badgeLabel    = getTransferBadgeLabel(transfer);

  // ── Inclusion icon detection ──────────────────────────────────────────────
  // ── Inclusion icon detection ──────────────────────────────────────────────
const inclusionIcons = (() => {
  const TRANSFER_KW = ['transfer', 'pickup', 'drop-off', 'dropoff', 'vehicle', 'van', 'bus'];
  const MEALS_KW    = ['meal', 'meals', 'breakfast', 'lunch', 'dinner', 'food', 'snack'];
  const TOURS_KW    = ['tour', 'activity', 'activities', 'sightseeing'];
  const GUIDE_KW    = ['guide', 'driver'];

  // ✅ Mas safe na check
  const inclusions = transfer.inclusions;
  const activeInclusions = Array.isArray(inclusions)
    ? inclusions.map(s => s.toLowerCase().trim())
    : [];

  const hasKw = (kws) => activeInclusions.some(inc => kws.some(kw => inc.includes(kw)));

  return [
    { Icon: Bus,       label: 'Transfer', active: true },
    { Icon: Users,     label: 'Pax',      active: true },
    { Icon: Utensils,  label: 'Meals',    active: hasKw(MEALS_KW) },
    { Icon: Camera,    label: 'Tours',    active: hasKw(TOURS_KW) },
    { Icon: Briefcase, label: 'Guide',    active: hasKw(GUIDE_KW) },
  ];
})();

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
          src={transfer.image || 'https://placehold.co/800x600/CCCCCC/333333?text=No+Image'}
          alt={transferName}
          className="blc-main-image"
        />
        {/* Pax badge overlay */}
        {transfer.pax && (
          <div className="blc-offer-badge-overlay">
            👥 {transfer.pax} pax
          </div>
        )}
      </div>

      {/* ── Header Info ──────────────────────────────────────────────────── */}
      <div className="blc-header-section">
        <div className="blc-title-badge-row">
          <TransferTypeBadge type={badgeLabel} />

          <div className="blc-badge-right-col">
            <h1 className="blc-title">{transferName}</h1>

            <div className="blc-price-section">
              <span className="blc-price" style={{ color: '#f97316' }}>
                {currencySymbol}{convertedDisplayPrice.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0,
                })}
              </span>
              <span className="blc-price-pax">/transfer</span>
            </div>
          </div>
        </div>

        {/* Meta row — location + supplier */}
        <div className="blc-meta-row">
          {(transfer.destination || transfer.location) && (
            <div className="blc-meta-item">
              <MapPin size={18} color="#f97316" />
              {transfer.destination || transfer.location}
            </div>
          )}
          {transfer.supplierName && (
            <div className="blc-meta-item">
              <Bus size={18} color="#64748b" />
              {transfer.supplierName}
            </div>
          )}
        </div>

        {/* Route info — pickup ➜ dropoff */}
        {(transfer.pickupLocation || transfer.dropoffLocation) && (
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            border: '1.5px solid #bfdbfe',
            borderRadius: '12px',
            padding: '14px 16px',
            marginTop: '12px',
            marginBottom: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            fontSize: '0.9rem',
          }}>
            {transfer.pickupLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: '600' }}>
                <span style={{ fontSize: '1rem' }}>📍</span>
                <span><strong>From:</strong> {transfer.pickupLocation}</span>
              </div>
            )}
            {transfer.dropoffLocation && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e40af', fontWeight: '600' }}>
                <span style={{ fontSize: '1rem' }}>🏁</span>
                <span><strong>To:</strong> {transfer.dropoffLocation}</span>
              </div>
            )}
          </div>
        )}

        {/* Inclusion icons row */}
        <div className="blc-icons-row">
          {inclusionIcons.map(({ Icon, label, active }) => (
            <Icon
              key={label}
              size={22}
              className={active ? 'blc-icon blc-icon--active' : 'blc-icon'}
            />
          ))}
        </div>
      </div>

      {/* ── What's Included ──────────────────────────────────────────────── */}
            {/* ── What's Included ──────────────────────────────────────────────── */}
      {Array.isArray(transfer.inclusions) && transfer.inclusions.length > 0 && (
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
              {transfer.inclusions.map((item, idx) => (
                <li key={idx} className="blc-list-item">
                  <div style={{ minWidth: '20px', marginTop: '2px' }}>
                    <CheckSquare size={16} color="#10b981" />
                  </div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Transfer Details ─────────────────────────────────────────────── */}
      {(transfer.pax || transfer.passengerCapacity || transfer.description || transfer.notes) && (
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <h3 className="blc-section-title" style={{ marginBottom: '12px' }}>
            <Bus size={20} color="#f97316" /> Transfer Details
          </h3>
          <ul className="blc-list">
            {transfer.pax && (
              <li className="blc-list-item">
                <div style={{ minWidth: '20px', marginTop: '2px' }}>
                  <Users size={16} color="#f97316" />
                </div>
                <span><strong>Capacity:</strong> {transfer.pax}</span>
              </li>
            )}
            {transfer.pickupTime && (
              <li className="blc-list-item">
                <div style={{ minWidth: '20px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px' }}>🕐</span>
                </div>
                <span><strong>Pickup Time:</strong> {transfer.pickupTime}</span>
              </li>
            )}
            {transfer.description && (
              <li className="blc-list-item">
                <div style={{ minWidth: '20px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px' }}>ℹ️</span>
                </div>
                <span>{transfer.description}</span>
              </li>
            )}
            {transfer.notes && (
              <li className="blc-list-item">
                <div style={{ minWidth: '20px', marginTop: '2px' }}>
                  <span style={{ fontSize: '14px' }}>📝</span>
                </div>
                <span>{transfer.notes}</span>
              </li>
            )}
          </ul>
        </div>
      )}

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