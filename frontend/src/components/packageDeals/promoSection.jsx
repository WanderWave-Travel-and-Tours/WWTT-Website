import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Ticket, Copy, Check, Clock } from 'lucide-react';
import './promoSection.css';

const COMING_SOON_PROMO = {
  id: 'coming-soon',
  isComingSoon: true,
  type: 'Coming Soon',
  code: null, localPrice: null, internationalPrice: null,
  discountType: null, description: null, image: null,
};

function PromoSection({ onBookNow }) {
  const [promos, setPromos]             = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex]       = useState(null);
  const [animDir, setAnimDir]           = useState(null); // 'next' | 'prev'
  const [isAnimating, setIsAnimating]   = useState(false);
  const [loading, setLoading]           = useState(true);
  const [copiedCode, setCopiedCode]     = useState(null);
  const [overlayOpen, setOverlayOpen]   = useState(false);
  const autoRef                         = useRef(null);
  const animRef                         = useRef(null);

  const PHP_TO_USD_RATE = 56;

  const readCurrency = () =>
    localStorage.getItem('currency') ||
    localStorage.getItem('selectedCurrency') ||
    localStorage.getItem('currencyPreference') ||
    'PHP';

  const [currency, setCurrency] = useState(readCurrency);

  useEffect(() => {
    const onStorage = () => setCurrency(readCurrency());
    const onCurrencyChange = (e) => setCurrency(e.detail?.currency || readCurrency());
    window.addEventListener('storage', onStorage);
    window.addEventListener('currencyChanged', onCurrencyChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('currencyChanged', onCurrencyChange);
    };
  }, []);

  const fallbackImg = (type) => {
    const map = {
      Weekly:  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80',
      Monthly: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
      Yearly:  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
    };
    return map[type] || 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&q=80';
  };

  useEffect(() => {
    (async () => {
      try {
        const res  = await fetch('/api/promos');
        const data = await res.json();
        if (Array.isArray(data)) {
          const today  = new Date();
          const active = data.filter(p =>
            new Date(p.validUntil) >= today &&
            p.promoType !== 'voucher' &&
            p.isArchive !== 'Yes'
          );
          const mapped = active.map(p => ({
            id: p._id, isComingSoon: false,
            type: p.durationType, code: p.code,
            localPrice: p.pricing?.local ?? null,
            internationalPrice: p.pricing?.international ?? null,
            discountType: p.discountType,
            description: p.description,
            validUntil: new Date(p.validUntil),
            image: p.image
              ? (p.image.startsWith('http') ? p.image : `/uploads/${p.image}`)
              : fallbackImg(p.durationType),
          }));
          setPromos([...mapped, COMING_SOON_PROMO]);
        }
      } catch {
        setPromos([COMING_SOON_PROMO]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const fmtPrice = (val, type) => {
    if (val == null) return null;
    if (type === 'Percentage') return `${Math.round(val)}%`;
    return currency === 'USD'
      ? `$${Math.round(val / PHP_TO_USD_RATE).toLocaleString()}`
      : `₱${Math.round(val).toLocaleString()}`;
  };

  const getPrice = (p) => {
    if (p.localPrice > 0)         return { price: fmtPrice(p.localPrice, p.discountType),         type: 'local' };
    if (p.internationalPrice > 0) return { price: fmtPrice(p.internationalPrice, p.discountType), type: 'international' };
    return null;
  };

  // ── Navigate with animation ──
  const navigate = useCallback((dir) => {
    if (isAnimating || promos.length <= 1) return;
    setIsAnimating(true);
    setAnimDir(dir);
    setPrevIndex(currentIndex);
    setCurrentIndex(p =>
      dir === 'next'
        ? (p + 1) % promos.length
        : (p - 1 + promos.length) % promos.length
    );
    // Clear animation state after transition completes
    clearTimeout(animRef.current);
    animRef.current = setTimeout(() => {
      setIsAnimating(false);
      setAnimDir(null);
      setPrevIndex(null);
    }, 580);
  }, [isAnimating, promos.length, currentIndex]);

  // ── Auto-advance ──
  const startAuto = useCallback(() => {
    clearInterval(autoRef.current);
    autoRef.current = setInterval(() => navigate('next'), 8000);
  }, [navigate]);

  useEffect(() => {
    if (promos.length > 1) startAuto();
    return () => clearInterval(autoRef.current);
  }, [promos.length, startAuto]);

  const goNext = () => { setOverlayOpen(false); navigate('next'); startAuto(); };
  const goPrev = () => { setOverlayOpen(false); navigate('prev'); startAuto(); };
  const goTo   = (i) => {
    if (i === currentIndex) return;
    const dir = i > currentIndex ? 'next' : 'prev';
    if (isAnimating) return;
    setIsAnimating(true);
    setAnimDir(dir);
    setPrevIndex(currentIndex);
    setCurrentIndex(i);
    clearTimeout(animRef.current);
    animRef.current = setTimeout(() => {
      setIsAnimating(false);
      setAnimDir(null);
      setPrevIndex(null);
    }, 580);
    startAuto();
  };

  // ── Touch ──
  const [tx, setTx] = useState(null);
  const onTStart = (e) => setTx(e.targetTouches[0].clientX);
  const onTEnd   = (e) => {
    if (tx === null) return;
    const d = tx - e.changedTouches[0].clientX;
    if (d >  50) goNext();
    if (d < -50) goPrev();
    setTx(null);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openOverlay = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setOverlayOpen(true);
  };

  const closeOverlay = (e) => {
    e.stopPropagation();
    e.preventDefault();
    setOverlayOpen(false);
  };

  if (loading || promos.length === 0) return null;

  const n = promos.length;

  // Build the 3 visible slots + the outgoing card during animation
  const activePromo = promos[currentIndex];
  const prevPromo   = promos[(currentIndex - 1 + n) % n];
  const nextPromo   = promos[(currentIndex + 1) % n];
  const outPromo    = prevIndex !== null ? promos[prevIndex] : null;

  // ── Determine CSS classes per slot based on animation state ──
  // During animation we show 4 cards:
  //   outgoing card exits (was active → slides out)
  //   incoming card enters (was peek → slides to active)
  //   new prev/next peek cards

  // KEY INSIGHT: Use promo.id as React key so the same card DOM element persists
  // when it moves between positions. CSS transition then animates the position change.
  // 
  // During animation we render 4 cards:
  //   - outPromo:    was active, now animating to peek position (exit anim)
  //   - activePromo: was peek, now animating to active (enter anim)
  //   - prevPromo:   left-peek (static or entering from far left if brand new)
  //   - nextPromo:   right-peek (static or entering from far right if brand new)

  const newNextPromo = promos[(currentIndex + 1) % n];
  const newPrevPromo = promos[(currentIndex - 1 + n) % n];

  let slots;
  if (isAnimating && animDir && outPromo) {
    if (animDir === 'next') {
      // outPromo was active → exits to left-peek   (exitToLeft anim)
      // activePromo was right-peek → enters center  (enterFromRight anim)
      // prevPromo is the OLD left-peek → it's being "pushed further left" → exits off-screen
      // newNextPromo is brand new → enters from far right into right-peek
      slots = [
        { promo: outPromo,     cls: 'promo-slide--exit-left',                       key: 'anim-exit-left',   position: 'exit'   },
        { promo: activePromo,  cls: 'promo-slide--active promo-slide--enter-right', key: 'anim-active',      position: 'active' },
        { promo: newNextPromo, cls: 'promo-slide--next-enter',                      key: 'anim-next-enter',  position: 'next'   },
        { promo: prevPromo,    cls: 'promo-slide--prev-exit',                       key: 'anim-prev-exit',   position: 'prev'   },
      ];
    } else {
      slots = [
        { promo: outPromo,     cls: 'promo-slide--exit-right',                      key: 'anim-exit-right',  position: 'exit'   },
        { promo: activePromo,  cls: 'promo-slide--active promo-slide--enter-left',  key: 'anim-active',      position: 'active' },
        { promo: newPrevPromo, cls: 'promo-slide--prev-enter',                      key: 'anim-prev-enter',  position: 'prev'   },
        { promo: nextPromo,    cls: 'promo-slide--next-exit',                       key: 'anim-next-exit',   position: 'next'   },
      ];
    }
  } else {
    slots = [
      { promo: prevPromo,   cls: 'promo-slide--prev',   key: 'slot-prev',   position: 'prev'   },
      { promo: activePromo, cls: 'promo-slide--active', key: 'slot-active', position: 'active' },
      { promo: nextPromo,   cls: 'promo-slide--next',   key: 'slot-next',   position: 'next'   },
    ];
  }

  // Shared details layout (desktop + mobile overlay)
  // Order: title → description → badges → validity strip → promo code
  const renderDetailsContent = (promo, pp) => (
    <>
      {/* Row 1: title + description */}
      <div className="promo-content">
        <h3 className="promo-title">All Tours & Packages</h3>
        <p className="promo-description">{promo.description}</p>
      </div>

      {/* Row 2: badges side by side — below description */}
      <div className="promo-badges-row">
        <div className="deal-type-badge">
          <Ticket size={12}/><span>{promo.type.toUpperCase()} DEAL</span>
        </div>
        {pp && (
          <div className="discount-badge">
            <span className="discount-text">
              {pp.type === 'local'
                ? (currency === 'USD' ? 'PH' : '🇵🇭 LOCAL')
                : (currency === 'USD' ? 'INTL.' : '🌐 INTL.')}
            </span>
            <span>{pp.price}</span>
            <span className="discount-text">OFF</span>
          </div>
        )}
      </div>

      {/* Row 3: perks strip */}
      <div className="promo-perks-row">
        <div className="promo-perk"><span>🏷️</span><span>All Packages</span></div>
        <div className="promo-perk"><span>👥</span><span>Per Person</span></div>
        <div className="promo-perk"><span>📅</span><span>
          {promo.validUntil ? `Until ${promo.validUntil.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}` : 'Limited Time'}
        </span></div>
      </div>

      {/* Row 4: validity strip */}
      <div className="promo-validity-strip">
        <span className="validity-icon">🎫</span>
        <span className="validity-text">Valid for all tours & packages</span>
        {promo.validUntil && (
          <span className="validity-date">
            Until {promo.validUntil.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Row 4b: min pax notice */}
      <div className="promo-min-pax-notice">
        <span className="promo-min-pax-icon">👥</span>
        <span className="promo-min-pax-text">
          Minimum of <strong>4 passengers</strong> required to apply this promo code.
        </span>
      </div>

      {/* Row 5: promo code */}
      <div className="promo-code-box">
        <span className="code-label">PROMO CODE</span>
        <div className="code-input-container">
          <div className="code-display">
            <span className="code-value">{promo.code}</span>
          </div>
          <button className="copy-btn" onClick={() => copyCode(promo.code)}>
            {copiedCode === promo.code ? <Check size={18}/> : <Copy size={18}/>}
          </button>
        </div>
      </div>
    </>
  );



  const renderCard = (promo, isActive) => {
    if (promo.isComingSoon) return (
      <div className="promo-voucher-card coming-soon-card">
        {/* Desktop: clock icon side */}
        <div className="coming-soon-image-side">
          <div className="coming-soon-icon-wrap">
            <Clock size={64} strokeWidth={1.2}/>
            <div className="cs-pulse-ring"/>
            <div className="cs-pulse-ring cs-pulse-ring--delay"/>
          </div>
        </div>
        {/* Desktop: details side */}
        <div className="card-details-side coming-soon-details">
          <div className="promo-badges-row">
            <div className="deal-type-badge coming-soon-badge">
              <Clock size={12}/><span>UPCOMING PROMO</span>
            </div>
          </div>
          <div className="promo-content">
            <h3 className="promo-title coming-soon-title">Something Big Is Coming!</h3>
            <p className="promo-description coming-soon-desc">
              Our next exclusive promo is almost here. Stay tuned for unbeatable deals on local and international tours & packages. Follow us on social media to be the first to know!
            </p>
          </div>
          {/* Decorative feature list */}
          <div className="cs-features">
            <div className="cs-feature-item"><span className="cs-feature-icon">✈️</span><span>Domestic & International Tours</span></div>
            <div className="cs-feature-item"><span className="cs-feature-icon">🏖️</span><span>Exclusive Package Deals</span></div>
            <div className="cs-feature-item"><span className="cs-feature-icon">🔔</span><span>Follow us to get notified first</span></div>
          </div>
          <div className="coming-soon-footer">
            <div className="coming-soon-dots-anim"><span/><span/><span/></div>
            <span className="coming-soon-label">Launching Soon</span>
          </div>
        </div>
        {/* Mobile: content shown directly over the background — NO See Details btn */}
        <div className="coming-soon-mobile-overlay">
          <div className="csm-icon">
            <Clock size={40} strokeWidth={1.2}/>
            <div className="cs-pulse-ring cs-pulse-ring--sm"/>
          </div>
          <div className="csm-content">
            <div className="deal-type-badge coming-soon-badge csm-badge">
              <Clock size={11}/><span>UPCOMING PROMO</span>
            </div>
            <h3 className="promo-title coming-soon-title csm-title">Something Big Is Coming!</h3>
            <p className="promo-description coming-soon-desc csm-desc">
              Stay tuned for unbeatable deals on tours & packages!
            </p>
            <div className="coming-soon-footer csm-footer">
              <div className="coming-soon-dots-anim"><span/><span/><span/></div>
              <span className="coming-soon-label">Launching Soon</span>
            </div>
          </div>
        </div>
      </div>
    );

    const pp = getPrice(promo);
    const isFlipped = isActive && overlayOpen;

    return (
      <div className={`promo-voucher-card${isFlipped ? ' card-flipped' : ''}`}>
        <div className="card-flip-inner">
          {/* FRONT FACE */}
          <div className="card-face card-face--front">
            <div className="card-image-side">
              <img src={promo.image} alt="Promo" className="destination-bg-image"/>
              <div className="image-overlay"/>
            </div>
            {/* Desktop: inline details */}
            <div className="card-details-side">
              {renderDetailsContent(promo, pp)}
            </div>
            {/* Mobile: See Details button over image */}
            {isActive && (
              <button className="mobile-see-details-btn" onClick={openOverlay}>
                See Details
              </button>
            )}
          </div>

          {/* BACK FACE */}
          <div className="card-face card-face--back">
            <div className="back-face-header">
              <h3 className="promo-title back-face-title">All Tours & Packages</h3>
              <button
                className="mobile-overlay-close"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOverlayOpen(false);
                }}
              >✕</button>
            </div>
            <div className="back-face-body">
              {renderDetailsContent(promo, pp)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="promo-destination-section">
      <div className="promo-carousel-wrapper">
        {n > 1 && <>
          <button className="external-arrow arrow-left"  onClick={goPrev}><ChevronLeft  size={22}/></button>
          <button className="external-arrow arrow-right" onClick={goNext}><ChevronRight size={22}/></button>
        </>}

        <div className="promo-carousel-container">
          <div className="promo-track-mask">
            <div className="promo-track" onTouchStart={onTStart} onTouchEnd={onTEnd}>
              {slots.map(({ promo, cls, key, position }) => (
                <div key={key} className={`promo-slide ${cls}`}>
                  {renderCard(promo, position === 'active' || cls === 'promo-slide--active')}
                </div>
              ))}
            </div>
          </div>

          {n > 1 && (
            <div className="carousel-dots">
              {promos.map((_, i) => (
                <button key={i} className={`dot ${i === currentIndex ? 'active' : ''}`}
                  onClick={() => goTo(i)}/>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PromoSection;