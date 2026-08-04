import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  X, MapPin, Calendar, Users, CheckCircle,
  ArrowRight, Zap, Shield
} from 'lucide-react';
import './TourPreviewModal.css';

const TourPreviewModal = ({
  isOpen,
  onClose,
  onProceed,
  pkg,
  currency = 'PHP',
  exchangeRate = 58,
  computedPackageTotal      = null,
  computedOriginalPrice     = null,
  computedFinalPackageTotal = null,
  computedDiscountAmount    = null,
  appliedPromo              = null,
  paxCount                  = null,
  timerExpired: timerExpiredProp = null,
  selectedFlight            = null,
  selectedRoomType          = null,
}) => {
  const [timerExpiredLocal, setTimerExpiredLocal] = useState(false);
  const [userIpAddress,     setUserIpAddress]     = useState(null);
  const modalRef = useRef(null);

  const timerExpired = timerExpiredProp !== null ? timerExpiredProp : timerExpiredLocal;

  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(d => setUserIpAddress(d.ip))
      .catch(() => setUserIpAddress('unknown'));
  }, []);

  useEffect(() => {
    if (!userIpAddress || (!pkg?._id && !pkg?.id)) return;
    const id = pkg._id || pkg.id;
    const checkTimer = () => {
      const stored = localStorage.getItem(`timer_${id}_${userIpAddress}`);
      if (stored) {
        try { const { startTime } = JSON.parse(stored); setTimerExpiredLocal(Math.max(0, 900000 - (Date.now() - startTime)) === 0); }
        catch { setTimerExpiredLocal(false); }
      } else { setTimerExpiredLocal(false); }
    };
    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [userIpAddress, pkg?._id, pkg?.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !pkg) return null;

  const currencySymbol = currency === 'PHP' ? '₱' : '$';

  const finalTotal = (() => {
    let total = computedFinalPackageTotal || computedPackageTotal || 0;
    if (selectedFlight) total += selectedFlight.price?.amount || 0;
    return total;
  })();

  const basePrice   = pkg.price || 0;
  const markupPrice = Math.round(basePrice * 1.10);

  let originalPrice, discountPct, discountAmount;
  if (computedFinalPackageTotal !== null) {
    originalPrice  = (computedOriginalPrice && computedOriginalPrice > computedFinalPackageTotal) ? computedOriginalPrice : null;
    discountAmount = computedDiscountAmount || 0;
    discountPct    = (appliedPromo && appliedPromo.discountType === 'Percentage')
      ? appliedPromo.discountValue || appliedPromo.pricing?.local || 0
      : (!timerExpired && computedOriginalPrice && computedOriginalPrice > computedFinalPackageTotal
          ? Math.round(((computedOriginalPrice - computedFinalPackageTotal) / computedOriginalPrice) * 100) : 0);
  } else {
    originalPrice  = timerExpired ? null : markupPrice;
    discountPct    = !timerExpired ? Math.round(((markupPrice - basePrice) / markupPrice) * 100) : 0;
    discountAmount = 0;
  }

  const formatPrice = (p) => p.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });

  const getPaxNumber = () => {
    if (pkg.minPax) return pkg.minPax;
    const title = (pkg.title || pkg.name || '').toLowerCase();
    if (title.includes('solo')) return 1;
    if (title.includes('couple') || title.includes('duo')) return 2;
    if (title.includes('family')) return 4;
    return 2;
  };

  const inclusions = pkg.inclusions || [];

  const CATEGORIES = [
    { key: 'flight',   label: 'Airfare',    icon: '✈️', kws: ['airfare','flight','airline','plane ticket','rt airfare'] },
    { key: 'hotel',    label: 'Hotel',      icon: '🏨', kws: ['hotel','accommodation','accomodation','lodging','room','stay','night'] },
    { key: 'transfer', label: 'Transfer',   icon: '🚌', kws: ['roundtrip','round trip','rt transfer','transfer','pudo'] },
    { key: 'meals',    label: 'Meals',      icon: '🍽️', kws: ['meal','meals','breakfast','lunch','dinner','buffet','food'] },
    { key: 'tours',    label: 'Activities', icon: '📸', kws: ['tour','island hopping','activity','activities','snorkeling','diving','trekking','kayaking','surfing','swimming'] },
    { key: 'guide',    label: 'Tour Guide', icon: '🧭', kws: [] },
  ];
  const lowerInclusions = inclusions.map(s => s.toLowerCase());
  const pkgNameLow = (pkg.title || pkg.name || '').toLowerCase();
  const hasNoGuide = ['no guide','no tour guide','without guide','w/o guide'].some(kw =>
    pkgNameLow.includes(kw) || lowerInclusions.some(i => i.includes(kw))
  );
  const activeCategories = CATEGORIES.filter(cat => {
    if (cat.key === 'guide') return !hasNoGuide;
    if (cat.key === 'flight') return !!selectedFlight || lowerInclusions.some(inc => cat.kws.some(kw => inc.includes(kw)));
    return lowerInclusions.some(inc => cat.kws.some(kw => inc.includes(kw)));
  });

  return ReactDOM.createPortal(
    <div className="ppm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ppm-modal" ref={modalRef}>

        {/* ─── CLOSE ─── */}
        <button className="ppm-close-btn" onClick={onClose} aria-label="Close preview">
          <X size={24} strokeWidth={3} />
        </button>

        {/* ─── HERO ─── */}
        <div className="ppm-hero">
          <img
            src={pkg.image || 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image'}
            alt={pkg.title || pkg.name}
            className="ppm-hero-img"
            onError={(e) => { e.target.src = 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image'; }}
          />
          <div className="ppm-hero-overlay" />

          <div className="ppm-hero-badges">
            {!timerExpired && discountPct > 0 && (
              <div className="ppm-badge ppm-badge--discount"><Zap size={13} /><span>Limited Offer · {discountPct}% OFF</span></div>
            )}
            {pkg.tourType === 'joiners' && (
              <div className="ppm-badge ppm-badge--joiners"><Users size={13} /><span>Joiners Tour</span></div>
            )}
          </div>

          <div className="ppm-hero-title-wrap">
            <h2 className="ppm-hero-title">{pkg.title || pkg.name}</h2>
            <div className="ppm-hero-meta">
              <span className="ppm-meta-chip"><MapPin size={13} /> {pkg.location || pkg.destination}</span>
              <span className="ppm-meta-chip"><Calendar size={13} /> {pkg.duration}</span>
              <span className="ppm-meta-chip"><Users size={13} />{pkg.tourType === 'joiners' ? `Min ${getPaxNumber()}` : getPaxNumber()} Pax</span>
              {pkg.category && <span className="ppm-meta-chip">{pkg.category}</span>}
            </div>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="ppm-body">
          <div className="ppm-inclusions-body">

            {/* Header */}
            <div className="ppm-inclusions-header">
              <Shield size={17} color="#10b981" />
              <span>What's Included</span>
              {inclusions.length > 0 && (
                <span className="ppm-inclusions-count">{inclusions.length} items</span>
              )}
            </div>

            {/* Category pills */}
            {activeCategories.length > 0 && (
              <div className="ppm-category-pills">
                {activeCategories.map(cat => (
                  <span key={cat.key} className="ppm-category-pill">
                    <span>{cat.icon}</span>
                    {cat.label}
                  </span>
                ))}
              </div>
            )}

            {/* Inclusions list */}
            {inclusions.length > 0 ? (
              <ul className="ppm-inclusions-list">
                {inclusions.map((item, i) => (
                  <li key={i} className="ppm-inclusion-item">
                    <span className="ppm-inclusion-check">
                      <CheckCircle size={15} color="#10b981" />
                    </span>
                    <span className="ppm-inclusion-text">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ppm-empty">No inclusions listed.</p>
            )}

          </div>
        </div>

        {/* ─── FOOTER ─── */}
        <div className="ppm-footer">
          <div className="ppm-footer-price">
            <span className="ppm-price-label">Starting from</span>
            <div className="ppm-price-row">
              {originalPrice && (
                <span className="ppm-price-original">{currencySymbol}{formatPrice(originalPrice)}</span>
              )}
              <span className={`ppm-price-main ${!timerExpired ? 'discounted' : ''}`}>
                {currencySymbol}{finalTotal.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0,
                })}
              </span>
              {!timerExpired && discountPct > 0 && <span className="ppm-price-save">Save {discountPct}%</span>}
            </div>
            <span className="ppm-price-note">
              <Users size={12} />
              {paxCount ? `${paxCount} pax` : 'per pax'} · Taxes may apply
              {discountAmount > 0 && appliedPromo && (
                <span className="ppm-promo-applied-badge">
                  🏷️ Promo applied
                </span>
              )}
            </span>
          </div>

          <div className="ppm-footer-actions">
            <button className="ppm-cancel-btn" onClick={onClose}>Back</button>
            <button className="ppm-proceed-btn" onClick={() => { onClose(); onProceed(pkg); }}>
              <span>Proceed to Book</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default TourPreviewModal;