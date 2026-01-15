import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Check, X, MapPin, Calendar, Plane, Hotel, 
  Utensils, Bus, Camera, Briefcase, ChevronDown, ChevronUp, 
  CheckSquare, XCircle, CalendarDays, ChevronLeft, Settings 
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

  const hasExclusions = pkg.excludes && pkg.excludes.length > 0;
  const itinerary = pkg.itinerary || [];
  const INITIAL_DAYS = 3;
  const shouldShowButton = itinerary.length > INITIAL_DAYS;
  const visibleItinerary = isItineraryExpanded ? itinerary : itinerary.slice(0, INITIAL_DAYS);

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
  const displayPrice = convertPrice(pkg.price || 0);

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
        
        <div className="blc-price-row">
          <span className="blc-price">
            {currencySymbol}{displayPrice.toLocaleString(undefined, { 
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
        
        <div className="blc-meta-row">
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