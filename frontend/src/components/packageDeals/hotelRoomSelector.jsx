import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Building2, X, MapPin, 
  Wifi, Car, Waves, Dumbbell, Utensils, Sparkles, Wind, Shirt, Wine, Star
} from 'lucide-react';
import './hotelRoomSelector.css';

// --- Internal Component: Lightbox Modal ---
const HotelLightbox = ({ isOpen, onClose, hotelName, images, price, roomType, initialIndex = 0 }) => {
  const [activeImgIndex, setActiveImgIndex] = useState(initialIndex);

  React.useEffect(() => {
    if (isOpen) {
      setActiveImgIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  if (!isOpen) return null;

  const safeImages = images && images.length > 0 ? images : ['https://placehold.co/800x600?text=No+Image'];

  const renderAmenities = (amenitiesObj) => {
    if (!amenitiesObj) return <span style={{fontSize:'0.85rem', color:'#64748b'}}>No amenities listed</span>;

    const mapping = [
      { key: 'wifi', label: 'Free Wifi', icon: Wifi },
      { key: 'airConditioning', label: 'Air Conditioning', icon: Wind },
      { key: 'pool', label: 'Swimming Pool', icon: Waves },
      { key: 'gym', label: 'Fitness Center', icon: Dumbbell },
      { key: 'restaurant', label: 'Restaurant', icon: Utensils },
      { key: 'bar', label: 'Bar / Lounge', icon: Wine },
      { key: 'spa', label: 'Spa & Wellness', icon: Sparkles },
      { key: 'parking', label: 'Parking', icon: Car },
      { key: 'laundry', label: 'Laundry Service', icon: Shirt },
      { key: 'roomService', label: 'Room Service', icon: Utensils },
    ];

    return mapping.map((item) => {
      if (amenitiesObj[item.key]) {
        const Icon = item.icon;
        return (
          <div key={item.key} className="hrs-amenity">
            <Icon size={16}/> {item.label}
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="hrs-lightbox-overlay" onClick={onClose}>
      <div className="hrs-lightbox-content" onClick={(e) => e.stopPropagation()}>
        
        {/* REDESIGNED PREMIUM HEADER */}
        <div className="hrs-lightbox-header">
          <div>
            <h2>{hotelName}</h2>
            <div className="hrs-lightbox-header-subtitle">
              <div className="hrs-lightbox-location">
                <MapPin size={16} /> 
                {roomType?.hotelLocation || 'Location available on map'}
              </div>
              <span className="hrs-lightbox-status-badge">
                ✓ Active Listing
              </span>
            </div>
          </div>
          
          {/* CLOSE BUTTON WITH X ICON */}
          <button 
            className="hrs-lightbox-close" 
            onClick={onClose}
            aria-label="Close Gallery"
          >
            <X 
              size={24} 
              color="#ffffff" 
              strokeWidth={3} 
              style={{ display: 'block' }}
            />
          </button>
        </div>

        <div className="hrs-lightbox-body">
          {/* ENHANCED GALLERY SECTION */}
          <div className="hrs-gallery-section">
            <div className="hrs-main-stage">
              <img 
                src={safeImages[activeImgIndex]} 
                alt="Main View" 
                className="hrs-main-img"
              />
            </div>
            {safeImages.length > 1 && (
              <div className="hrs-side-grid">
                {safeImages.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img}
                    alt={`Thumb ${idx}`}
                    className={`hrs-side-thumb ${idx === activeImgIndex ? 'hrs-active' : ''}`}
                    onClick={() => setActiveImgIndex(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* LUXURY INFO SECTION */}
          <div className="hrs-info-section">
            <div className="hrs-info-card">
              <div className="hrs-info-header">
                General Information
              </div>
              <div className="hrs-info-grid">
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Base Price</span>
                  <span className="hrs-info-value hrs-price-highlight">
                    ₱{price ? price.toLocaleString() : 'Check Price'}
                  </span>
                </div>
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Max Capacity</span>
                  <span className="hrs-info-value">{roomType?.capacity || 2} Guests</span>
                </div>
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Rating</span>
                  <span className="hrs-info-value">
                    <div className="hrs-rating-display">
                      <span className="hrs-rating-number">
                        {roomType?.hotelRating ? roomType.hotelRating.toFixed(1) : 'N/A'}
                      </span>
                      <Star size={16} fill="#fbbf24" color="#fbbf24"/>
                    </div>
                  </span>
                </div>
                <div className="hrs-info-item" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '8px'}}>
                  <span className="hrs-info-label">Details</span>
                  <span className="hrs-info-value" style={{
                    fontSize: '0.9rem', 
                    fontWeight: '500', 
                    lineHeight:'1.5',
                    maxWidth: '100%',
                    textAlign: 'left',
                    color: '#475569'
                  }}>
                    {roomType?.description || "Comfortable accommodation with standard amenities."}
                  </span>
                </div>
              </div>
            </div>

            <div className="hrs-info-card">
              <div className="hrs-info-header">
                Amenities & Facilities
              </div>
              <div style={{display:'flex', flexWrap:'wrap'}}>
                {renderAmenities(roomType?.amenities)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

// --- Main Component ---
const HotelRoomSelector = ({ 
  roomTypes = [], 
  selectedRoomType, 
  onRoomTypeChange
}) => {
  
  const [hoveredHotel, setHoveredHotel] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const hoverTimeoutRef = useRef(null);
  
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    hotelName: '',
    images: [],
    price: 0,
    roomType: null,
    initialIndex: 0
  });

  const sortedRoomTypes = [...roomTypes].sort((a, b) => a.price - b.price);

  const getRoomTypeIcon = (type) => {
    const typeUpper = type?.toUpperCase() || '';
    if (typeUpper.includes('BUDGET')) return '💰';
    if (typeUpper.includes('STANDARD')) return '⭐';
    if (typeUpper.includes('4 STAR')) return '⭐⭐⭐⭐';
    if (typeUpper.includes('5 STAR')) return '⭐⭐⭐⭐⭐';
    return '🏨';
  };

  const getHotelImages = (room) => {
    if (room.images && Array.isArray(room.images) && room.images.length > 0) {
      return room.images;
    }
    if (room.hotelImage) {
      return [room.hotelImage];
    }
    return ['https://placehold.co/600x400?text=No+Image+Available'];
  };

  // --- HOVER LOGIC (Desktop) ---
  const handleMouseEnter = (index, images) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredHotel(index);
    setPreviewImage(images[0]);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredHotel(null);
    }, 300);
  };

  // --- CLICK/TOUCH LOGIC (Mobile/Tablet) ---
  const handleHotelClick = (e, index, images) => {
    e.stopPropagation(); // Prevent selecting the card
    // Toggle: if open, close. If closed, open.
    if (hoveredHotel === index) {
      setHoveredHotel(null);
    } else {
      setHoveredHotel(index);
      setPreviewImage(images[0]);
    }
  };

  const handleOpenLightbox = (room, index = 0) => {
    setLightboxState({
      isOpen: true,
      hotelName: room.hotelName,
      images: getHotelImages(room),
      price: room.price,
      roomType: room,
      initialIndex: index
    });
    setHoveredHotel(null);
  };

  if (!roomTypes || roomTypes.length === 0) return null;

  return (
    <div className="hrs-container">
      <HotelLightbox 
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
        hotelName={lightboxState.hotelName}
        images={lightboxState.images}
        price={lightboxState.price}
        roomType={lightboxState.roomType}
        initialIndex={lightboxState.initialIndex}
      />

      <div className="hrs-header">
        <h3>Choose Your Accommodation Package</h3>
        <p className="hrs-subtitle">All packages include tour activities + hotel accommodation</p>
      </div>

      <div className="hrs-list">
        {sortedRoomTypes.map((room, index) => {
          const isSelected = selectedRoomType?.type === room.type;
          const hotelImages = getHotelImages(room);
          const currentPopupImage = previewImage || hotelImages[0];

          return (
            <div 
              key={index}
              className={`hrs-card ${isSelected ? 'hrs-selected' : ''}`}
              onClick={() => onRoomTypeChange(room)}
            >
              {isSelected && (
                <div className="hrs-checkmark">
                  <Check size={16} color="#fff" strokeWidth={3} />
                </div>
              )}

              <div className="hrs-card-header" style={{marginBottom: 0}}>
                <div className="hrs-card-title-group">
                  <span className="hrs-icon">{getRoomTypeIcon(room.type)}</span>
                  <div>
                    <h4>{room.type}</h4>
                  </div>
                  {room.type?.toUpperCase().includes('BUDGET') && !isSelected && (
                    <span className="hrs-badge-value">BEST VALUE</span>
                  )}
                </div>
                {isSelected && <div className="hrs-badge-selected">✓ SELECTED</div>}
              </div>

              <div className="hrs-details" style={{borderBottom: 'none', paddingBottom: '4px'}}>
                <div style={{ marginTop: '8px', position: 'relative' }}>
                    <span className="hrs-label">List of Hotel:</span>
                    
                    <div 
                        className="hrs-hotel-link"
                        onMouseEnter={() => handleMouseEnter(index, hotelImages)}
                        onMouseLeave={handleMouseLeave}
                        onClick={(e) => handleHotelClick(e, index, hotelImages)}
                    >
                        <Building2 size={18} color="#059669" />
                        <span style={{borderBottom: '1px dotted #059669'}}>
                            {room.hotelName || 'Partner Hotel'}
                        </span>

                        {/* --- MINI GALLERY POPUP --- */}
                        {hoveredHotel === index && (
                            <div 
                              className="hrs-popup" 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                handleOpenLightbox(room);
                              }}
                              // Remove mouseLeave from popup to allow interaction on mobile without closing
                            >
                                <div className="hrs-popup-arrow"></div>
                                
                                <div className="hrs-popup-img-wrapper">
                                  <img 
                                      src={currentPopupImage} 
                                      alt={room.hotelName} 
                                      className="hrs-popup-img"
                                  />
                                  <div className="hrs-popup-text">
                                    {hotelImages.length > 1 
                                      ? `Click to view all ${hotelImages.length} photos` 
                                      : 'Click to view photo'}
                                  </div>
                                </div>

                                {hotelImages.length > 1 ? (
                                  <div className="hrs-popup-thumbs">
                                    {hotelImages.slice(0, 4).map((img, i) => {
                                      const isPreviewing = currentPopupImage === img;
                                      return (
                                        <img 
                                          key={i}
                                          src={img} 
                                          alt="thumb" 
                                          className={`hrs-popup-thumb ${isPreviewing ? 'hrs-active' : ''}`}
                                          onMouseEnter={() => setPreviewImage(img)}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setPreviewImage(img);
                                          }}
                                        />
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div style={{fontSize:'0.75rem', color:'#64748b', textAlign:'center', marginTop:'4px'}}>
                                    View details
                                  </div>
                                )}
                                
                                {/* Mobile Close Instruction */}
                                <div className="hrs-mobile-close-hint">
                                  Tap again to close
                                </div>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotelRoomSelector;