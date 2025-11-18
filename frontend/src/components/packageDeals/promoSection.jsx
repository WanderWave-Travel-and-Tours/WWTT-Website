import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import './PromoSection.css';

function PromoSection({ promoFilter, onPromoFilterChange, onBookNow }) {
  
  const promos = [
    {
      id: 'weekly',
      label: 'Weekly',
      title: "GET 30% OFF ON YOUR FIRST BOOKING!",
      text: "Limited time weekly offer for new travelers. Book now!",
      icon: "🎁",
      color: "linear-gradient(135deg, #ffe8cc 0%, #ffd9a8 100%)", 
      btnColor: "#f97316"
    },
    {
      id: 'monthly',
      label: 'Monthly',
      title: "MAY SUPER SALE: BORACAY FOR 2!",
      text: "Exclusive monthly deal. All-inclusive package for couples.",
      icon: "🏖️",
      color: "linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)", 
      btnColor: "#0891b2" 
    },
    {
      id: 'yearly',
      label: 'Yearly',
      title: "YEAR-END BLOWOUT: JAPAN TOUR",
      text: "Plan your year-end vacation early and save up to 50%!",
      icon: "🌸",
      color: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)", 
      btnColor: "#db2777" 
    }
  ];

  const currentIndex = promos.findIndex(p => p.id === promoFilter);

  // --- HANDLERS ---
  const handleNext = () => {
    const nextIndex = (currentIndex + 1) % promos.length;
    onPromoFilterChange(promos[nextIndex].id);
  };

  const handlePrev = () => {
    const prevIndex = (currentIndex - 1 + promos.length) % promos.length;
    onPromoFilterChange(promos[prevIndex].id);
  };

  // --- AUTO-PLAY LOGIC (Desktop Only) ---
  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;

    if (isDesktop) {
      const interval = setInterval(() => {
        handleNext();
      }, 4000); 

      return () => clearInterval(interval);
    }
  }, [currentIndex, onPromoFilterChange]); 


  // --- SWIPE LOGIC (Mobile Touch) ---
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) handleNext();
    if (isRightSwipe) handlePrev();
  };

  return (
    <section className="promo-section">
      
      <div className="promo-header">
        <h2 className="promo-section-title">PROMO</h2>
        <div className="promo-filters">
          {promos.map(item => (
            <button
              key={item.id}
              className={`promo-filter-btn ${promoFilter === item.id ? 'active' : ''}`}
              onClick={() => onPromoFilterChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div 
        className="promo-slider-container"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Arrows (Desktop only via CSS) */}
        <button className="slider-arrow arrow-left" onClick={handlePrev}>
          <ChevronLeft size={24} />
        </button>
        <button className="slider-arrow arrow-right" onClick={handleNext}>
          <ChevronRight size={24} />
        </button>

        <div 
          className="promo-slider-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {promos.map((promo) => (
            <div key={promo.id} className="promo-slide">
              <div className="promo-banner" style={{ background: promo.color }}>
                <div className="promo-content">
                  <h2 className="promo-title">{promo.title}</h2>
                  <p className="promo-text">{promo.text}</p>
                  <button 
                    className="promo-button" 
                    onClick={onBookNow}
                    style={{ backgroundColor: promo.btnColor }}
                  >
                    Book Now
                  </button>
                </div>
                <div className="promo-icon">{promo.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </section>
  );
}

export default PromoSection;