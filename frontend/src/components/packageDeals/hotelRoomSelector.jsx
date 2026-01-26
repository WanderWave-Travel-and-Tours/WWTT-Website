import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Building2, X, MapPin, 
  Wifi, Car, Waves, Dumbbell, Utensils, Sparkles, Wind, Shirt, Wine, Star
} from 'lucide-react';
import './hotelRoomSelector.css';

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

const HotelRoomSelector = ({ roomTypes, selectedRoomType, onRoomTypeChange }) => {
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    hotelName: '',
    images: [],
    price: 0,
    roomType: null,
    initialIndex: 0
  });

  const [hoveredHotel, setHoveredHotel] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const hasAutoSelectedRef = useRef(false); // ✅ NEW: Track if we've auto-selected

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // ✅ FIXED: Force select Budget on initial load, regardless of current selection
  useEffect(() => {
    if (roomTypes && roomTypes.length > 0 && !hasAutoSelectedRef.current) {
      // Find BUDGET room type
      const budgetRoom = roomTypes.find(room => 
        room.type?.toUpperCase().includes('BUDGET')
      );
      
      if (budgetRoom) {
        console.log('🎯 Auto-selecting Budget room:', budgetRoom.hotelName);
        onRoomTypeChange(budgetRoom);
        hasAutoSelectedRef.current = true;
      } else {
        // Fallback to cheapest if no BUDGET found
        const sortedByPrice = [...roomTypes].sort((a, b) => a.price - b.price);
        if (sortedByPrice.length > 0) {
          console.log('💰 Auto-selecting cheapest room:', sortedByPrice[0].hotelName);
          onRoomTypeChange(sortedByPrice[0]);
          hasAutoSelectedRef.current = true;
        }
      }
    }
  }, [roomTypes]); // ✅ Only depend on roomTypes, not selectedRoomType or onRoomTypeChange

  const groupedRoomTypes = React.useMemo(() => {
    if (!roomTypes || roomTypes.length === 0) return {};

    const groups = {};
    
    roomTypes.forEach(room => {
      const roomType = room.type?.trim();

      if (!roomType || roomType === '') {
        console.warn('⚠️ Hotel missing type field:', room.hotelName);
        return;
      }
      const safePrice = Number(room.price) || 0; 
      
      if (!groups[roomType]) {
        groups[roomType] = {
          type: roomType,
          hotels: [],
          minPrice: safePrice,
          maxPrice: safePrice 
        };
      }
      
      groups[roomType].hotels.push(room);
      
      if (safePrice < groups[roomType].minPrice) {
        groups[roomType].minPrice = safePrice;
      }
      if (safePrice > groups[roomType].maxPrice) {
        groups[roomType].maxPrice = safePrice;
      }
    });

    const sortedGroups = Object.keys(groups).sort((a, b) => {
      // Define room type priority order
      const typeOrder = {
        'BUDGET': 1,
        'STANDARD': 2,
        '4 STAR': 3,
        '5 STAR': 4
      };
      
      const getTypePriority = (type) => {
        const typeUpper = type?.toUpperCase() || '';
        if (typeUpper.includes('BUDGET')) return typeOrder['BUDGET'];
        if (typeUpper.includes('STANDARD')) return typeOrder['STANDARD'];
        if (typeUpper.includes('4 STAR') || typeUpper.includes('4-STAR') || typeUpper.includes('FOUR STAR')) return typeOrder['4 STAR'];
        if (typeUpper.includes('5 STAR') || typeUpper.includes('5-STAR') || typeUpper.includes('FIVE STAR')) return typeOrder['5 STAR'];
        return 999; // Unknown types go to the end
      };
      
      const priorityA = getTypePriority(a);
      const priorityB = getTypePriority(b);
      
      // Sort by priority, then by price if same priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      return groups[a].minPrice - groups[b].minPrice;
    });

    const result = {};
    sortedGroups.forEach(key => {
      result[key] = groups[key];
    });

    return result;
  }, [roomTypes]);

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

  const handleMouseEnter = (hotelKey, images) => {
    if (isMobile) return;
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setHoveredHotel(hotelKey);
    setPreviewImage(images[0]);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredHotel(null);
    }, 300);
  };

  const handleHotelClick = (e, hotelKey, images) => {
    e.stopPropagation();
    
    if (hoveredHotel === hotelKey) {
      setHoveredHotel(null);
    } else {
      setHoveredHotel(hotelKey);
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

  // Handle category selection
  const handleCategorySelect = (roomType, firstHotel) => {
    onRoomTypeChange(firstHotel);
  };

  if (!roomTypes || roomTypes.length === 0) return null;

  const groupKeys = Object.keys(groupedRoomTypes);

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
        {groupKeys.map((roomType) => {
          
          const group = groupedRoomTypes[roomType];
          const min = group.minPrice || 0;
          const max = group.maxPrice || 0;
          const isSelected = selectedRoomType?.type === roomType;
          const priceRange = min === max 
            ? `₱${min.toLocaleString()}` 
            : `₱${min.toLocaleString()} - ₱${max.toLocaleString()}`;

          return (
            <div 
              key={roomType}
              className={`hrs-card hrs-category-card ${isSelected ? 'hrs-selected' : ''}`}
              onClick={() => handleCategorySelect(roomType, group.hotels[0])}
            >
              {isSelected && (
                <div className="hrs-checkmark">
                  <Check size={16} color="#fff" strokeWidth={3} />
                </div>
              )}

              <div className="hrs-card-header" style={{marginBottom: 0}}>
                <div className="hrs-card-title-group">
                  <span className="hrs-icon">{getRoomTypeIcon(roomType)}</span>
                  <div>
                    <h4>{roomType}</h4>
                    <span className="hrs-hotel-count">{group.hotels.length} Hotel{group.hotels.length > 1 ? 's' : ''} Available</span>
                  </div>
                  {roomType?.toUpperCase().includes('BUDGET') && !isSelected && (
                    <span className="hrs-badge-value">BEST VALUE</span>
                  )}
                </div>
                <div className="hrs-category-right">
                  {isSelected && <div className="hrs-badge-selected">✓ SELECTED</div>}
                  {/* <div className="hrs-price-display">{priceRange}</div> */}
                </div>
              </div>

              <div className="hrs-details" style={{borderTop: '1px dashed #e5e7eb', marginTop: '12px', paddingTop: '12px'}}>
                <span className="hrs-label">List of Hotels:</span>
                <div className="hrs-hotels-list">
                  {group.hotels.map((hotel, hotelIdx) => {
                    const hotelKey = `${roomType}-${hotelIdx}`;
                    const hotelImages = getHotelImages(hotel);
                    const currentPopupImage = previewImage || hotelImages[0];
                    
                    const safeHotelPrice = Number(hotel.price) || 0; 

                    return (
                      <div key={hotelKey} className="hrs-hotel-item" style={{position: 'relative', marginTop: '8px'}}>
                        <div 
                          className="hrs-hotel-link"
                          onMouseEnter={() => handleMouseEnter(hotelKey, hotelImages)}
                          onMouseLeave={handleMouseLeave}
                          onClick={(e) => handleHotelClick(e, hotelKey, hotelImages)}
                        >
                          <Building2 size={18} color="#059669" />
                          <span style={{borderBottom: '1px dotted #059669', cursor: 'pointer'}}>
                            {hotel.hotelName || 'Partner Hotel'}
                          </span>
                          {/*}
                          {group.hotels.length > 1 && (
                            <span className="hrs-hotel-price">₱{safeHotelPrice.toLocaleString()}</span>
                          )} */}
                        </div>

                        {hoveredHotel === hotelKey && (
                          <div 
                            className="hrs-popup" 
                            onClick={(e) => {
                              e.stopPropagation(); 
                              handleOpenLightbox(hotel);
                            }}
                            onMouseEnter={() => {
                              if (!isMobile && hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                                hoverTimeoutRef.current = null;
                              }
                            }}
                            onMouseLeave={() => {
                              if (!isMobile) {
                                handleMouseLeave();
                              }
                            }}
                          >
                            <div className="hrs-popup-arrow"></div>
                            
                            <div className="hrs-popup-img-wrapper">
                              <img 
                                src={currentPopupImage} 
                                alt={hotel.hotelName} 
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
                                      onMouseEnter={() => !isMobile && setPreviewImage(img)}
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
                            
                            {isMobile && (
                              <div className="hrs-mobile-close-hint">
                                Tap outside or name again to close
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
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