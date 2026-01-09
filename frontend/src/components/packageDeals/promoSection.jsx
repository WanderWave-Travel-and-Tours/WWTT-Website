import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Ticket, Copy, Check } from 'lucide-react';
import './promoSection.css';

function PromoSection({ onBookNow }) {
  const [promos, setPromos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  // Fallback images if no image uploaded
  const getPromoFallbackImage = (type) => {
    switch(type) {
      case 'Weekly':
        return "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&q=80";
      case 'Monthly':
        return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80";
      case 'Yearly':
        return "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80";
      default:
        return "https://images.unsplash.com/photo-1530789253388-582c481c54b0?w=1200&q=80";
    }
  };

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const response = await fetch('https://wanderwaveph-backend.onrender.com/api/promos');
        const data = await response.json();

        if (Array.isArray(data)) {
          const today = new Date();
          const activePromos = data.filter(promo => {
            const expiryDate = new Date(promo.validUntil);
            return expiryDate >= today;
          });

          const formattedPromos = activePromos.map(p => {
            // Check if backend provided an image, otherwise use fallback
            const imageUrl = p.image 
                ? `https://wanderwaveph-backend.onrender.com/uploads/${p.image}` 
                : getPromoFallbackImage(p.durationType);

            return {
              id: p._id,
              type: p.durationType,
              code: p.code,
              discount: p.discountType === 'Percentage' 
                ? `${p.discountValue}%` 
                : `₱${p.discountValue}`,
              discountType: p.discountType,
              description: p.description,
              validUntil: new Date(p.validUntil),
              image: imageUrl
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

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % promos.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  useEffect(() => {
    if (promos.length > 1) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [currentIndex, promos.length]);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

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
    const minSwipeDistance = 50;
    if (distance > minSwipeDistance) handleNext();
    if (distance < -minSwipeDistance) handlePrev();
  };

  if (loading) return null;
  if (promos.length === 0) return null;

  return (
    <section className="promo-destination-section">
      <div className="section-title-header">
        <h2 className="section-main-title">PROMO</h2>
      </div>

      <div className="promo-carousel-wrapper">
        {promos.length > 1 && (
          <>
            <button className="external-arrow arrow-left" onClick={handlePrev}>
              <ChevronLeft size={26} />
            </button>
            <button className="external-arrow arrow-right" onClick={handleNext}>
              <ChevronRight size={26} />
            </button>
          </>
        )}

        <div className="promo-carousel-container">
          <div 
            className="promo-track"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {promos.map((promo, index) => (
              <div
                key={promo.id}
                className={`promo-slide ${index === currentIndex ? 'active' : ''}`}
                style={{
                  transform: `translateX(${(index - currentIndex) * 100}%)`
                }}
              >
                <div className="promo-voucher-card">
                  <div className="card-image-side">
                    <img src={promo.image} alt="Destination" className="destination-bg-image" />
                    <div className="image-overlay"></div>
                  </div>

                  <div className="card-details-side">
                    <div className="promo-header">
                      <div className="promo-type-row">
                        <div className="deal-type-badge">
                          <Ticket size={14} />
                          <span>{promo.type.toUpperCase()} DEAL</span>
                        </div>
                        
                        <div className="discount-badge">
                          <span className="discount-text">SAVE</span>
                          <span>{promo.discount}</span>
                          <span className="discount-text">OFF</span>
                        </div>
                      </div>
                    </div>

                    <div className="promo-content">
                      <h3 className="promo-title">All Tours & Packages</h3>
                      <p className="promo-description">{promo.description}</p>
                    </div>

                    <div className="promo-code-box">
                      <span className="code-label">PROMO CODE</span>
                      <div className="code-input-container">
                        <div className="code-display">
                          <span className="code-value">{promo.code}</span>
                        </div>
                        <button 
                          className="copy-btn"
                          onClick={() => copyCode(promo.code)}
                        >
                          {copiedCode === promo.code ? (
                            <Check size={18} />
                          ) : (
                            <Copy size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {promos.length > 1 && (
            <div className="carousel-dots">
              {promos.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => setCurrentIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default PromoSection;