import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, X, MapPin, Calendar, Plane, Hotel, 
  Utensils, Bus, Camera, Briefcase, ChevronDown, ChevronUp, 
  CheckSquare, XCircle, CalendarDays, ChevronLeft, Settings, Clock 
} from 'lucide-react';
import PackageCustomizer from './PackageCustomizer';
import './BookingLeftColumn.css';

const BookingLeftColumn = ({ 
  pkg, 
  currency = 'PHP', 
  exchangeRate = 58,
  onCustomizationChange 
}) => {
  const navigate = useNavigate(); 
  const [isItineraryExpanded, setIsItineraryExpanded] = useState(false);
  const [expandedDayIndices, setExpandedDayIndices] = useState({});
  const [isIncludedExpanded, setIsIncludedExpanded] = useState(false);
  const [isExcludedExpanded, setIsExcludedExpanded] = useState(false);
  const [showCustomizer, setShowCustomizer] = useState(false);
  const [isCustomized, setIsCustomized] = useState(false);

  // ============================================
  // TIMER STATES
  // ============================================
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerExpired, setTimerExpired] = useState(false);
  const [userIpAddress, setUserIpAddress] = useState(null);

  const hasExclusions = pkg.excludes && pkg.excludes.length > 0;
  const itinerary = pkg.itinerary || [];
  const INITIAL_DAYS = 3;
  const shouldShowButton = itinerary.length > INITIAL_DAYS;
  const visibleItinerary = isItineraryExpanded ? itinerary : itinerary.slice(0, INITIAL_DAYS);

  // ============================================
  // GET USER IP ADDRESS
  // ============================================
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setUserIpAddress(data.ip);
        console.log('✅ User IP:', data.ip);
      } catch (error) {
        console.error('❌ Error fetching IP:', error);
        setUserIpAddress('unknown');
      }
    };
    fetchIpAddress();
  }, []);

  // ============================================
  // TIMER MANAGEMENT - 15 MINUTES
  // ============================================
  useEffect(() => {
    if (!userIpAddress) {
      console.log('⏰ Waiting for IP address...');
      return;
    }
    
    if (!pkg._id && !pkg.id) {
      console.log('⏰ Waiting for package ID...');
      return;
    }

    const packageId = pkg._id || pkg.id;
    const timerKey = `timer_${packageId}_${userIpAddress}`;
    const storedTimer = localStorage.getItem(timerKey);

    console.log('⏰ Timer Key:', timerKey);
    console.log('⏰ Stored Timer:', storedTimer);

    if (storedTimer) {
      const timerData = JSON.parse(storedTimer);
      const now = Date.now();
      const elapsed = now - timerData.startTime;
      const remaining = Math.max(0, 900000 - elapsed); // 15 minutes = 900000ms

      if (remaining > 0) {
        setTimeRemaining(remaining);
        setTimerExpired(false);
        console.log('✅ Timer resumed:', Math.floor(remaining / 1000), 'seconds left');
      } else {
        setTimeRemaining(0);
        setTimerExpired(true);
        console.log('⏰ Timer expired');
      }
    } else {
      // Start new timer
      const startTime = Date.now();
      localStorage.setItem(timerKey, JSON.stringify({ startTime }));
      setTimeRemaining(900000); // 15 minutes
      setTimerExpired(false);
      console.log('🚀 Timer started - 15 minutes');
    }
  }, [userIpAddress, pkg._id, pkg.id]);

  // ============================================
  // COUNTDOWN TIMER
  // ============================================
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          setTimerExpired(true);
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // ============================================
  // RESET TIMER DAILY
  // ============================================
  useEffect(() => {
    if (!userIpAddress) return;
    if (!pkg._id && !pkg.id) return;

    const packageId = pkg._id || pkg.id;

    const checkDailyReset = () => {
      const timerKey = `timer_${packageId}_${userIpAddress}`;
      const lastResetKey = `lastReset_${packageId}_${userIpAddress}`;
      const lastReset = localStorage.getItem(lastResetKey);
      const today = new Date().toDateString();

      if (lastReset !== today) {
        localStorage.removeItem(timerKey);
        localStorage.setItem(lastResetKey, today);
        
        const startTime = Date.now();
        localStorage.setItem(timerKey, JSON.stringify({ startTime }));
        setTimeRemaining(900000);
        setTimerExpired(false);
        console.log('🔄 Timer reset for new day');
      }
    };

    checkDailyReset();
    const dailyCheck = setInterval(checkDailyReset, 60000); // Check every minute

    return () => clearInterval(dailyCheck);
  }, [userIpAddress, pkg._id, pkg.id]);

  const toggleDay = (index) => {
    setExpandedDayIndices(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleCustomizationChange = (customizationData) => {
    setIsCustomized(customizationData.additionalPrice > 0);
    if (onCustomizationChange) {
      onCustomizationChange(customizationData);
    }
  };

  const currencySymbol = currency === 'PHP' ? '₱' : '$';
  const convertPrice = (phpPrice) => {
    if (currency === 'PHP') return phpPrice;
    return (phpPrice / exchangeRate) * 1.30;
  };

  // ============================================
  // CALCULATE PRICE WITH TIMER LOGIC
  // ============================================
  const basePrice = pkg.price || 0;
  const originalPriceWithMarkup = Math.round(basePrice * 1.10);
  const displayPrice = timerExpired ? originalPriceWithMarkup : basePrice;
  const convertedDisplayPrice = convertPrice(displayPrice);
  const convertedOriginalPrice = convertPrice(originalPriceWithMarkup);

  return (
    <div className="blc-container">
      
      {/* GO BACK */}
      <button className="blc-back-btn" onClick={() => navigate(-1)}>
        <ChevronLeft size={20} />
        Go Back
      </button>

      {/* IMAGE */}
      <div className="blc-image-wrapper">
        <img 
            src={pkg.image || 'https://placehold.co/800x600/CCCCCC/333333?text=No+Image'} 
            alt={pkg.name} 
            className="blc-main-image" 
        />
      </div>

      {/* HEADER INFO */}
      <div className="blc-header-section">
        <h1 className="blc-title">{pkg.name}</h1>
        
        {/* PRICE ROW WITH ALIGNED TIMER */}
        <div className="blc-price-timer-wrapper">
          
          {/* LEFT: PRICE */}
          <div className="blc-price-section">
            {!timerExpired && (
              <span className="blc-price-original">
                {currencySymbol}{convertedOriginalPrice.toLocaleString(undefined, { 
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0 
                })}
              </span>
            )}
            <span className="blc-price" style={{
              color: !timerExpired ? '#10b981' : '#fc9c1b'
            }}>
              {currencySymbol}{convertedDisplayPrice.toLocaleString(undefined, { 
                minimumFractionDigits: currency === 'USD' ? 2 : 0,
                maximumFractionDigits: currency === 'USD' ? 2 : 0 
              })}
            </span>
            {isCustomized && (
              <span className="blc-customized-badge">
                <Settings size={14} /> Customized
              </span>
            )}
          </div>

          {/* RIGHT: TIMER */}
          {!timerExpired && timeRemaining !== null && (
            <div className="blc-timer-compact">
              <div className="blc-timer-compact-header">
                ⚡ HURRY - SPECIAL OFFER ENDS SOON!
              </div>
              <div className="blc-timer-compact-boxes">
                <div className="blc-timer-compact-box">
                  <div className="blc-timer-compact-number">
                    {Math.floor(timeRemaining / 60000).toString().padStart(2, '0')}
                  </div>
                  <div className="blc-timer-compact-label">MINUTES</div>
                </div>
                <div className="blc-timer-compact-colon">:</div>
                <div className="blc-timer-compact-box">
                  <div className="blc-timer-compact-number">
                    {Math.floor((timeRemaining % 60000) / 1000).toString().padStart(2, '0')}
                  </div>
                  <div className="blc-timer-compact-label">SECONDS</div>
                </div>
              </div>
              <div className="blc-timer-compact-savings">
                🔥 Save {currencySymbol}{(convertedOriginalPrice - convertedDisplayPrice).toLocaleString(undefined, { 
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0 
                })}!
              </div>
            </div>
          )}
        </div>
        
        {!timerExpired && (
          <div style={{
            background: '#d1fae5',
            color: '#047857',
            padding: '10px 14px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: '700',
            marginTop: '12px',
            textAlign: 'center',
            border: '2px solid #10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.1)'
          }}>
            <Clock size={18} />
            <span>
              🎉 Special Offer Active - Save {Math.round(((originalPriceWithMarkup - basePrice) / originalPriceWithMarkup) * 100)}%!
            </span>
          </div>
        )}
        
        <div className="blc-meta-row" style={{ marginTop: '20px' }}>
          <div className="blc-meta-item">
            <MapPin size={18} color="#f97316"/> {pkg.location || pkg.destination}
          </div>
          <div className="blc-meta-item">
            <Calendar size={18} color="#f97316"/> {pkg.duration} {pkg.nights ? `/ ${pkg.nights}` : ''}
          </div>
        </div>

        <div className="blc-icons-row">
          {[Plane, Hotel, Bus, Utensils, Camera, Briefcase].map((Icon, i) => (
            <Icon key={i} size={22} className="blc-icon" />
          ))}
        </div>
      </div>

      {/* PACKAGE CUSTOMIZER */}
      <div className="blc-customizer-section">
        <button 
          className={`blc-customizer-toggle ${showCustomizer ? 'active' : ''}`}
          onClick={() => setShowCustomizer(!showCustomizer)}
        >
          <Settings size={20} />
          <span>{showCustomizer ? 'Hide Customization' : 'Customize This Package'}</span>
        </button>
        
        {showCustomizer && (
          <PackageCustomizer 
            pkg={pkg}
            currency={currency}
            exchangeRate={exchangeRate}
            onCustomizationChange={handleCustomizationChange}
          />
        )}
      </div>

      {/* INCLUSIONS SECTION - Only show if not customizing */}
      {!showCustomizer && (
        <div className="blc-card">
          <div className="blc-card-header" onClick={() => setIsIncludedExpanded(!isIncludedExpanded)}>
            <h3 className="blc-section-title">
              <CheckSquare size={24} color="#10b981" /> What's Included
            </h3>
            <div className={`blc-chevron ${isIncludedExpanded ? 'rotated' : ''}`}>
              <ChevronDown size={20} />
            </div>
          </div>

          <div className={`blc-collapsible ${isIncludedExpanded ? 'open' : ''}`}>
            <ul className="blc-list">
              {pkg.inclusions?.map((item, idx) => (
                <li key={idx} className="blc-list-item">
                  <div style={{minWidth:'20px', marginTop:'2px'}}><CheckSquare size={16} color="#10b981" /></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {hasExclusions && (
            <div className="blc-divider">
              <div className="blc-card-header" onClick={() => setIsExcludedExpanded(!isExcludedExpanded)}>
                <h3 className="blc-section-title">
                  <XCircle size={20} color="#ef4444" /> What's Excluded
                </h3>
                <div className={`blc-chevron ${isExcludedExpanded ? 'rotated' : ''}`}>
                  <ChevronDown size={20} />
                </div>
              </div>

              <div className={`blc-collapsible ${isExcludedExpanded ? 'open' : ''}`}>
                <ul className="blc-list">
                  {pkg.excludes.map((item, idx) => (
                    <li key={idx} className="blc-list-item">
                      <div style={{minWidth:'20px', marginTop:'2px'}}><XCircle size={16} color="#ef4444" /></div>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ITINERARY TIMELINE */}
      <div>
        <h3 className="blc-section-title" style={{marginBottom: '24px'}}>
           <CalendarDays size={24} color="#f97316"/> Tour Itinerary
        </h3>

        <div className="blc-timeline-container">
          <div className="blc-timeline-line"></div>

          {visibleItinerary.map((day, idx) => {
            const isOpen = expandedDayIndices[idx];

            return (
              <div key={idx} className="blc-timeline-item">
                <div className={`blc-timeline-dot ${isOpen ? 'active' : ''}`}></div>

                <div style={{ paddingLeft: '16px' }}>
                  <div className={`blc-day-card ${isOpen ? 'active' : ''}`} onClick={() => toggleDay(idx)}>
                    <h4 className="blc-day-title">
                      Day {day.day}: <span style={{color: '#f97316'}}>{day.title}</span>
                    </h4>
                    <div className={`blc-chevron ${isOpen ? 'rotated' : ''}`}>
                      <ChevronDown size={20} />
                    </div>
                  </div>

                  <div className={`blc-day-content ${isOpen ? 'open' : ''}`}>
                      <div className="blc-day-inner">
                        <ul style={{ paddingLeft: '20px', margin: 0, color: '#475569', fontSize: '0.95rem', lineHeight: '1.6' }}>
                          {day.activities.map((act, i) => (
                              <li key={i} style={{marginBottom: '6px'}}>{act}</li>
                          ))}
                        </ul>
                      </div>
                  </div>
                </div>
              </div>
            );
          })}

          {(!itinerary || itinerary.length === 0) && (
             <p style={{color: '#999', paddingLeft: '20px', fontStyle: 'italic'}}>No itinerary available.</p>
          )}
        </div>

        {shouldShowButton && (
          <div className="blc-expand-btn-container">
            <button
              onClick={() => setIsItineraryExpanded(!isItineraryExpanded)}
              className="blc-expand-btn"
            >
              {isItineraryExpanded ? (
                <>Show Less Days <ChevronUp size={16} /></>
              ) : (
                <>Show {itinerary.length - INITIAL_DAYS} More Days <ChevronDown size={16} /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingLeftColumn;