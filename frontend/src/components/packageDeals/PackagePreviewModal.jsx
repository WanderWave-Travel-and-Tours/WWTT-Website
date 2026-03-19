import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  X, MapPin, Calendar, Users, Star, CheckCircle,
  ChevronRight, ChevronDown, ChevronUp, Plane, Hotel,
  Utensils, Bus, Camera, Briefcase, Clock, Tag,
  CalendarDays, ArrowRight, Shield, Zap
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageHelper';
import './PackagePreviewModal.css';

const PackagePreviewModal = ({
  isOpen,
  onClose,
  onProceed,
  pkg,
  currency = 'PHP',
  exchangeRate = 58,
  // ✅ Computed prices passed from BookingRightForm — use these instead of recalculating
  computedPackageTotal = null,
  computedOriginalPrice = null,
  computedFinalPackageTotal = null,
  computedDiscountAmount = null,
  appliedPromo = null,
  paxCount = null,
  timerExpired: timerExpiredProp = null,
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedDay, setExpandedDay] = useState(null);
  const [timerExpiredLocal, setTimerExpiredLocal] = useState(false);
  const [userIpAddress, setUserIpAddress] = useState(null);
  const modalRef = useRef(null);

  // ✅ Use prop if provided, otherwise fall back to local timer state
  const timerExpired = timerExpiredProp !== null ? timerExpiredProp : timerExpiredLocal;

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        setUserIpAddress(data.ip);
      } catch {
        setUserIpAddress('unknown');
      }
    };
    fetchIp();
  }, []);

  useEffect(() => {
    if (!userIpAddress || (!pkg?._id && !pkg?.id)) return;
    // ✅ FIX: Use same key format as packageBooking.jsx (pkg._id || pkg.id)
    const packageId = pkg._id || pkg.id;
    const checkTimer = () => {
      const timerKey = `timer_${packageId}_${userIpAddress}`;
      const stored = localStorage.getItem(timerKey);
      if (stored) {
        try {
          const { startTime } = JSON.parse(stored);
          const remaining = Math.max(0, 900000 - (Date.now() - startTime));
          setTimerExpiredLocal(remaining === 0);
        } catch {
          setTimerExpiredLocal(false);
        }
      } else {
        // No timer yet = package not yet visited = discount still available
        setTimerExpiredLocal(false);
      }
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
      setActiveTab('overview');
      setExpandedDay(null);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !pkg) return null;

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice = (p) => currency === 'PHP' ? p : (p / exchangeRate) * 1.30;

  // ✅ Use computed prices from BookingRightForm if available (reflects pax, hotel, promos, timer)
  // Fall back to simple per-pkg calculation only if props not provided
  const basePrice = pkg.price || 0;
  const markupPrice = Math.round(basePrice * 1.10);

  let displayPrice, originalPrice, discountPct, discountAmount;

  if (computedFinalPackageTotal !== null) {
    // ✅ PRIMARY: use exact values passed from BookingRightForm
    displayPrice = computedFinalPackageTotal;
    originalPrice = (computedOriginalPrice && computedOriginalPrice > computedFinalPackageTotal)
      ? computedOriginalPrice
      : null;
    discountAmount = computedDiscountAmount || 0;
    discountPct = (appliedPromo && appliedPromo.discountType === 'Percentage')
      ? appliedPromo.discountValue || appliedPromo.pricing?.local || 0
      : (!timerExpired && computedOriginalPrice && computedOriginalPrice > computedFinalPackageTotal
          ? Math.round(((computedOriginalPrice - computedFinalPackageTotal) / computedOriginalPrice) * 100)
          : 0);
  } else {
    // Fallback: simple single-pax calculation
    displayPrice = timerExpired ? markupPrice : basePrice;
    originalPrice = timerExpired ? null : markupPrice;
    discountPct = !timerExpired
      ? Math.round(((markupPrice - basePrice) / markupPrice) * 100)
      : 0;
    discountAmount = 0;
  }

  const convertedDisplay = displayPrice;    // already converted by parent
  const convertedOriginal = originalPrice;  // already converted by parent

  const formatPrice = (p) => p.toLocaleString(undefined, {
    minimumFractionDigits: currency === 'USD' ? 2 : 0,
    maximumFractionDigits: currency === 'USD' ? 2 : 0,
  });

  const getPaxNumber = () => {
    if (pkg.pax) return pkg.pax;
    if (pkg.minPax) return pkg.minPax;
    const title = (pkg.name || '').toLowerCase();
    if (title.includes('solo')) return 1;
    if (title.includes('couple') || title.includes('duo')) return 2;
    if (title.includes('family')) return 4;
    if (title.includes('group')) return 6;
    const patterns = [/(\d+)\s*pax/i, /for\s*(\d+)/i, /(\d+)\s*person/i, /(\d+)\s*people/i];
    for (const p of patterns) {
      const m = title.match(p);
      if (m && parseInt(m[1]) > 0 && parseInt(m[1]) <= 50) return parseInt(m[1]);
    }
    if (pkg.maxGuests) return pkg.maxGuests;
    return 2;
  };
  const paxNumber = getPaxNumber();

  const itinerary = pkg.itinerary || [];
  const inclusions = pkg.inclusions || [];
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'inclusions', label: "What's Included" },
    { id: 'itinerary', label: 'Itinerary' },
  ];

  return ReactDOM.createPortal(
    <div className="ppm-backdrop" onClick={handleBackdropClick}>
      <div className="ppm-modal" ref={modalRef}>

        {/* ─── CLOSE BUTTON ─── */}
        <button className="ppm-close-btn" onClick={onClose} aria-label="Close preview">
          <X size={24} strokeWidth={3} style={{ width: 24, height: 24, minWidth: 24, flexShrink: 0 }} />
        </button>

        {/* ─── HERO IMAGE ─── */}
        <div className="ppm-hero">
          <img
            src={getImageUrl(pkg.image) || 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image'}
            alt={pkg.name}
            className="ppm-hero-img"
            onError={(e) => {
              e.target.src = 'https://placehold.co/800x400/e2e8f0/94a3b8?text=No+Image';
            }}
          />
          <div className="ppm-hero-overlay" />

          {/* Badges */}
          <div className="ppm-hero-badges">
            {!timerExpired && discountPct > 0 && (
              <div className="ppm-badge ppm-badge--discount">
                <Zap size={13} />
                <span>Limited Offer · {discountPct}% OFF</span>
              </div>
            )}
            {pkg.tourType === 'joiners' && (
              <div className="ppm-badge ppm-badge--joiners">
                <Users size={13} />
                <span>Joiners Tour</span>
              </div>
            )}
          </div>

          {/* Title overlay */}
          <div className="ppm-hero-title-wrap">
            <h2 className="ppm-hero-title">{pkg.name}</h2>
            <div className="ppm-hero-meta">
              <span className="ppm-meta-chip">
                <MapPin size={13} /> {pkg.location || pkg.destination}
              </span>
              <span className="ppm-meta-chip">
                <Calendar size={13} /> {pkg.duration}
              </span>
              <span className="ppm-meta-chip">
                <Users size={13} />
                {pkg.tourType === 'joiners' ? `Min ${paxNumber}` : paxNumber} Pax
              </span>
              {pkg.rating && (
                <span className="ppm-meta-chip ppm-meta-chip--star">
                  <Star size={12} fill="currentColor" /> {pkg.rating}
                  {pkg.reviews && <span style={{ opacity: 0.8 }}>({pkg.reviews})</span>}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ─── BODY ─── */}
        <div className="ppm-body">

          {/* TABS */}
          <div className="ppm-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                className={`ppm-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── OVERVIEW TAB ─── */}
          {activeTab === 'overview' && (
            <div className="ppm-tab-content">

              {/* Icons row */}
              <div className="ppm-icons-row">
                {[
                  { Icon: Plane,     label: 'Flights' },
                  { Icon: Hotel,     label: 'Hotel' },
                  { Icon: Bus,       label: 'Transfer' },
                  { Icon: Utensils,  label: 'Meals' },
                  { Icon: Camera,    label: 'Tours' },
                  { Icon: Briefcase, label: 'Guide' },
                ].map(({ Icon, label }) => (
                  <div key={label} className="ppm-icon-chip">
                    <Icon size={20} className="ppm-icon" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              {/* Description */}
              {pkg.description && (
                <p className="ppm-description">{pkg.description}</p>
              )}

              {/* Quick highlights from inclusions */}
              {inclusions.length > 0 && (
                <div className="ppm-highlights">
                  <h4 className="ppm-highlights-title">
                    <Shield size={15} color="#10b981" /> Package Highlights
                  </h4>
                  <div className="ppm-highlights-grid">
                    {inclusions.slice(0, 4).map((item, i) => (
                      <div key={i} className="ppm-highlight-item">
                        <CheckCircle size={14} color="#10b981" />
                        <span>{item}</span>
                      </div>
                    ))}
                    {inclusions.length > 4 && (
                      <div
                        className="ppm-highlight-item ppm-highlight-more"
                        onClick={() => setActiveTab('inclusions')}
                      >
                        <ChevronRight size={14} />
                        <span>+{inclusions.length - 4} more inclusions</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Itinerary teaser */}
              {itinerary.length > 0 && (
                <div className="ppm-itinerary-teaser">
                  <h4 className="ppm-highlights-title">
                    <CalendarDays size={15} color="#f97316" /> Tour Itinerary
                  </h4>
                  {itinerary.slice(0, 2).map((day, i) => (
                    <div key={i} className="ppm-day-teaser">
                      <span className="ppm-day-label">Day {day.day}</span>
                      <span className="ppm-day-title">{day.title}</span>
                    </div>
                  ))}
                  {itinerary.length > 2 && (
                    <button
                      className="ppm-see-more-btn"
                      onClick={() => setActiveTab('itinerary')}
                    >
                      See full {itinerary.length}-day itinerary <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── INCLUSIONS TAB ─── */}
          {activeTab === 'inclusions' && (
            <div className="ppm-tab-content">
              {inclusions.length > 0 ? (
                <ul className="ppm-inclusions-list">
                  {inclusions.map((item, i) => (
                    <li key={i} className="ppm-inclusion-item">
                      <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="ppm-empty">No inclusions listed for this package.</p>
              )}
            </div>
          )}

          {/* ─── ITINERARY TAB ─── */}
          {activeTab === 'itinerary' && (
            <div className="ppm-tab-content">
              {itinerary.length > 0 ? (
                <div className="ppm-timeline">
                  {itinerary.map((day, idx) => {
                    const isOpen = expandedDay === idx;
                    return (
                      <div key={idx} className="ppm-timeline-item">
                        <div className="ppm-timeline-dot-wrap">
                          <div className={`ppm-timeline-dot ${isOpen ? 'active' : ''}`} />
                          {idx < itinerary.length - 1 && <div className="ppm-timeline-line" />}
                        </div>
                        <div className="ppm-timeline-content">
                          <button
                            className={`ppm-day-btn ${isOpen ? 'active' : ''}`}
                            onClick={() => setExpandedDay(isOpen ? null : idx)}
                          >
                            <div>
                              <span className="ppm-day-num">Day {day.day}</span>
                              <span className="ppm-day-name">{day.title}</span>
                            </div>
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {isOpen && (
                            <ul className="ppm-activities">
                              {day.activities?.map((act, i) => (
                                <li key={i} className="ppm-activity-item">
                                  <span className="ppm-activity-dot" />
                                  {act}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="ppm-empty">No itinerary available for this package.</p>
              )}
            </div>
          )}
        </div>

        {/* ─── STICKY FOOTER ─── */}
        <div className="ppm-footer">
          <div className="ppm-footer-price">
            <span className="ppm-price-label">Starting from</span>
            <div className="ppm-price-row">
              {convertedOriginal && (
                <span className="ppm-price-original">
                  {currencySymbol}{formatPrice(convertedOriginal)}
                </span>
              )}
              <span className={`ppm-price-main ${!timerExpired ? 'discounted' : ''}`}>
                {currencySymbol}{formatPrice(convertedDisplay)}
              </span>
              {!timerExpired && discountPct > 0 && (
                <span className="ppm-price-save">Save {discountPct}%</span>
              )}
            </div>
            <span className="ppm-price-note">
              <Users size={12} />
              {paxCount ? `${paxCount} pax` : 'per pax'} · Taxes may apply
              {discountAmount > 0 && appliedPromo && (
                <span style={{
                  marginLeft: '6px',
                  background: '#ecfdf5',
                  color: '#059669',
                  border: '1px solid #a7f3d0',
                  borderRadius: '20px',
                  padding: '1px 7px',
                  fontWeight: '700',
                  fontSize: '0.7rem'
                }}>
                  🏷️ Promo applied
                </span>
              )}
            </span>
          </div>

          <div className="ppm-footer-actions">
            <button className="ppm-cancel-btn" onClick={onClose}>
              Back
            </button>
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

export default PackagePreviewModal;