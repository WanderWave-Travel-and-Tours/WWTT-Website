import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import {
  X, MapPin, Calendar, Users, Star, CheckCircle,
  ChevronRight, ChevronDown, ChevronUp, Plane, Hotel,
  Utensils, Bus, Camera, Briefcase, Clock, Tag,
  CalendarDays, ArrowRight, Shield, Zap
} from 'lucide-react';
import './TourPreviewModal.css'; // ✅ Reuse same styles

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
}) => {
  const [activeTab,          setActiveTab]          = useState('overview');
  const [expandedDay,        setExpandedDay]        = useState(null);
  const [timerExpiredLocal,  setTimerExpiredLocal]  = useState(false);
  const [userIpAddress,      setUserIpAddress]      = useState(null);
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
      setActiveTab('overview');
      setExpandedDay(null);
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
  const convertPrice   = (p) => currency === 'PHP' ? p : (p / exchangeRate) * 1.30;
  const basePrice      = pkg.price || 0;
  const markupPrice    = Math.round(basePrice * 1.10);

  let displayPrice, originalPrice, discountPct, discountAmount;
  if (computedFinalPackageTotal !== null) {
    displayPrice   = computedFinalPackageTotal;
    originalPrice  = (computedOriginalPrice && computedOriginalPrice > computedFinalPackageTotal) ? computedOriginalPrice : null;
    discountAmount = computedDiscountAmount || 0;
    discountPct    = (appliedPromo && appliedPromo.discountType === 'Percentage')
      ? appliedPromo.discountValue || appliedPromo.pricing?.local || 0
      : (!timerExpired && computedOriginalPrice && computedOriginalPrice > computedFinalPackageTotal
          ? Math.round(((computedOriginalPrice - computedFinalPackageTotal) / computedOriginalPrice) * 100) : 0);
  } else {
    displayPrice   = timerExpired ? markupPrice : basePrice;
    originalPrice  = timerExpired ? null : markupPrice;
    discountPct    = !timerExpired ? Math.round(((markupPrice - basePrice) / markupPrice) * 100) : 0;
    discountAmount = 0;
  }

  const formatPrice = (p) => p.toLocaleString(undefined, { minimumFractionDigits: currency === 'USD' ? 2 : 0, maximumFractionDigits: currency === 'USD' ? 2 : 0 });

  const getPaxNumber = () => {
    if (pkg.minPax) return pkg.minPax;
    const title = (pkg.title || pkg.name || '').toLowerCase();
    if (title.includes('solo')) return 1;
    if (title.includes('couple') || title.includes('duo')) return 2;
    if (title.includes('family')) return 4;
    return 2;
  };

  const itinerary  = pkg.itinerary  || [];
  const inclusions = pkg.inclusions || [];
  const tabs = [
    { id: 'overview',   label: 'Overview' },
    { id: 'inclusions', label: "What's Included" },
    { id: 'itinerary',  label: 'Itinerary' },
  ];

  return ReactDOM.createPortal(
    <div className="ppm-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ppm-modal" ref={modalRef}>

        {/* ─── CLOSE ─── */}
        <button className="ppm-close-btn" onClick={onClose} aria-label="Close preview">
          <X size={24} strokeWidth={3} style={{ width: 24, height: 24, minWidth: 24, flexShrink: 0 }} />
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

          {/* TABS */}
          <div className="ppm-tabs">
            {tabs.map(tab => (
              <button key={tab.id} className={`ppm-tab ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ─── OVERVIEW ─── */}
          {activeTab === 'overview' && (
            <div className="ppm-tab-content">
              {/* Inclusion icons — uses raw pkg.inclusions (no customizer for tours) */}
              {(() => {
                const FLIGHT_KW   = ['airfare','flight','airline','plane ticket','rt airfare'];
                const HOTEL_KW    = ['hotel','accommodation','accomodation','lodging','room','stay','night'];
                const TRANSFER_KW = ['roundtrip','round trip','rt transfer','transfer','pudo'];
                const MEALS_KW    = ['meal','meals','breakfast','lunch','dinner','buffet','food'];
                const TOURS_KW    = ['tour','island hopping','activity','activities','snorkeling','diving','trekking','kayaking','surfing','swimming'];
                const NO_GUIDE_KW = ['no guide','no tour guide','without guide','w/o guide'];
                const active      = (pkg.inclusions || []).map(s => s.toLowerCase().trim());
                const hasKw       = (kws) => active.some(inc => kws.some(kw => inc.includes(kw)));
                const pkgNameLow  = (pkg.title || pkg.name || '').toLowerCase();
                const hasNoGuide  = NO_GUIDE_KW.some(kw => pkgNameLow.includes(kw)) || active.some(inc => NO_GUIDE_KW.some(kw => inc.includes(kw)));
                const ICONS = [
                  { Icon: Plane,     label: 'Flights',  active: !!selectedFlight || hasKw(FLIGHT_KW)  },
                  { Icon: Hotel,     label: 'Hotel',    active: hasKw(HOTEL_KW)                        },
                  { Icon: Bus,       label: 'Transfer', active: hasKw(TRANSFER_KW)                     },
                  { Icon: Utensils,  label: 'Meals',    active: hasKw(MEALS_KW)                        },
                  { Icon: Camera,    label: 'Tours',    active: hasKw(TOURS_KW)                        },
                  { Icon: Briefcase, label: 'Guide',    active: !hasNoGuide                            },
                ];
                return (
                  <div className="ppm-icons-row">
                    {ICONS.map(({ Icon, label, active: a }) => (
                      <div key={label} className={`ppm-icon-chip${a ? ' ppm-icon-chip--active' : ''}`}>
                        <Icon size={20} className={a ? 'ppm-icon ppm-icon--active' : 'ppm-icon'} />
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {pkg.description && <p className="ppm-description">{pkg.description}</p>}

              {inclusions.length > 0 && (
                <div className="ppm-highlights">
                  <h4 className="ppm-highlights-title"><Shield size={15} color="#10b981" /> Package Highlights</h4>
                  <div className="ppm-highlights-grid">
                    {inclusions.slice(0, 4).map((item, i) => (
                      <div key={i} className="ppm-highlight-item"><CheckCircle size={14} color="#10b981" /><span>{item}</span></div>
                    ))}
                    {inclusions.length > 4 && (
                      <div className="ppm-highlight-item ppm-highlight-more" onClick={() => setActiveTab('inclusions')}>
                        <ChevronRight size={14} /><span>+{inclusions.length - 4} more inclusions</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {itinerary.length > 0 && (
                <div className="ppm-itinerary-teaser">
                  <h4 className="ppm-highlights-title"><CalendarDays size={15} color="#f97316" /> Tour Itinerary</h4>
                  {itinerary.slice(0, 2).map((day, i) => (
                    <div key={i} className="ppm-day-teaser">
                      <span className="ppm-day-label">Day {day.day}</span>
                      <span className="ppm-day-title">{day.title}</span>
                    </div>
                  ))}
                  {itinerary.length > 2 && (
                    <button className="ppm-see-more-btn" onClick={() => setActiveTab('itinerary')}>
                      See full {itinerary.length}-day itinerary <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── INCLUSIONS ─── */}
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
              ) : <p className="ppm-empty">No inclusions listed.</p>}
            </div>
          )}

          {/* ─── ITINERARY ─── */}
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
                          <button className={`ppm-day-btn ${isOpen ? 'active' : ''}`} onClick={() => setExpandedDay(isOpen ? null : idx)}>
                            <div>
                              <span className="ppm-day-num">Day {day.day}</span>
                              <span className="ppm-day-name">{day.title}</span>
                            </div>
                            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                          {isOpen && (
                            <ul className="ppm-activities">
                              {day.activities?.map((act, i) => (
                                <li key={i} className="ppm-activity-item"><span className="ppm-activity-dot" />{act}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="ppm-empty">No itinerary available.</p>}
            </div>
          )}
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
                {currencySymbol}{formatPrice(displayPrice)}
              </span>
              {!timerExpired && discountPct > 0 && <span className="ppm-price-save">Save {discountPct}%</span>}
            </div>
            <span className="ppm-price-note">
              <Users size={12} />
              {paxCount ? `${paxCount} pax` : 'per pax'} · Taxes may apply
              {discountAmount > 0 && appliedPromo && (
                <span style={{ marginLeft: '6px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '20px', padding: '1px 7px', fontWeight: '700', fontSize: '0.7rem' }}>
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
