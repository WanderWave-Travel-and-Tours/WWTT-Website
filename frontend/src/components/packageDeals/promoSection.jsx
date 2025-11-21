import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react'; 
import './PromoSection.css';

function PromoSection({ onBookNow }) {
  
  const [promos, setPromos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const getPromoDesign = (type) => {
    switch(type) {
      case 'Weekly':
        return {
          label: 'Weekly',
          icon: "🎁",
          color: "linear-gradient(135deg, #ffe8cc 0%, #ffd9a8 100%)", 
          btnColor: "#f97316"
        };
      case 'Monthly':
        return {
          label: 'Monthly',
          icon: "🏖️",
          color: "linear-gradient(135deg, #cffafe 0%, #a5f3fc 100%)", 
          btnColor: "#0891b2"
        };
      case 'Yearly':
        return {
          label: 'Yearly',
          icon: "🌸",
          color: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)", 
          btnColor: "#db2777"
        };
      default: 
        return {
          label: 'Special',
          icon: "✨",
          color: "linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)",
          btnColor: "#7e22ce"
        };
    }
  };

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/promos');
        const data = await response.json();

        if (Array.isArray(data)) {
          const today = new Date();

          const activePromos = data.filter(promo => {
             const expiryDate = new Date(promo.validUntil);
             return expiryDate >= today; 
          });

          const formattedPromos = activePromos.map(p => {
            const design = getPromoDesign(p.durationType);
            return {
              id: p._id,
              label: design.label, 
              title: `${p.code}: GET ${p.discountType === 'Percentage' ? p.discountValue + '%' : '₱' + p.discountValue} OFF!`,
              text: p.description,
              icon: design.icon,
              color: design.color,
              btnColor: design.btnColor
            };
          });

          setPromos(formattedPromos);
        }
      } catch (error) {
        console.error("Error fetching promos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, []);

  const handlePromoChange = (index) => {
    setCurrentIndex(index);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length);
  };

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    if (isDesktop && promos.length > 0) {
      const interval = setInterval(() => {
        handleNext();
      }, 4000); 
      return () => clearInterval(interval);
    }
  }, [currentIndex, promos.length]); 

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
    if (distance > minSwipeDistance) handleNext();
    if (distance < -minSwipeDistance) handlePrev();
  };

  if (loading) return null; 
  if (promos.length === 0) return null;

  const currentPromo = promos[currentIndex];

  return (
    <section className="promo-section">
      
      <div className="promo-header">
        <h2 className="promo-section-title">PROMO</h2>
        <div className="promo-filters">
          {promos.map((item, index) => (
            <button
              key={item.id}
              className={`promo-filter-btn ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handlePromoChange(index)}
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
        {/* Arrows */}
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