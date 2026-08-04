import React, { useState, useEffect, useRef } from 'react';
import {
  Check, Building2, X, MapPin, ChevronLeft, ChevronRight,
  Wifi, Car, Waves, Dumbbell, Utensils, Sparkles, Wind, Shirt, Wine, Star, Eye,
  Coffee, ShowerHead
} from 'lucide-react';
import './hotelRoomSelector.css';

// ✨ HELPER: Shuffle array randomly
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ✨ HELPER: Get all images from all hotels in a category and randomize them
const getAllCategoryImages = (hotels) => {
  const allImages = [];
  
  
  hotels.forEach((hotel, idx) => {
    
    // Try multiple possible image field names
    const possibleImageFields = [
      'hotelImages',
      'images', 
      'image',
      'hotelImage',
      'photos',
      'pictures',
      'gallery'
    ];
    
    let foundImages = false;
    
    // Check each possible field
    for (const field of possibleImageFields) {
      if (hotel[field]) {
        
        // If it's an array
        if (Array.isArray(hotel[field]) && hotel[field].length > 0) {
          allImages.push(...hotel[field]);
          foundImages = true;
          break;
        }
        // If it's a single string/URL
        else if (typeof hotel[field] === 'string') {
          allImages.push(hotel[field]);
          foundImages = true;
          break;
        }
      }
    }
    
    if (!foundImages) {
    }
  });
  
  
  // If no images found, use placeholder
  if (allImages.length === 0) {
    return ['https://placehold.co/800x600?text=No+Image'];
  }
  
  // Randomize the images
  const shuffled = shuffleArray(allImages);
  return shuffled;
};


const HotelLightbox = ({ isOpen, onClose, categoryName, images, priceRange, roomType, hotelCount }) => {
  const [activeImgIndex, setActiveImgIndex] = useState(0);

  React.useEffect(() => {
    if (isOpen) {
      setActiveImgIndex(0);
    }
  }, [isOpen]);

  // ✨ Keyboard navigation
  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeImgIndex, images.length]);

  if (!isOpen) return null;

  const safeImages = images && images.length > 0 ? images : ['https://placehold.co/800x600?text=No+Image'];

  // ✨ Navigation functions
  const goToNext = () => {
    setActiveImgIndex((prev) => (prev + 1) % safeImages.length);
  };

  const goToPrev = () => {
    setActiveImgIndex((prev) => (prev - 1 + safeImages.length) % safeImages.length);
  };

  const renderAmenities = (amenitiesObj) => {
    if (!amenitiesObj) return <span className="hrs-amenity-fallback">Standard amenities included</span>;

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
            <h2>{categoryName}</h2>
            <div className="hrs-lightbox-header-subtitle">
              <div className="hrs-lightbox-location">
                <Building2 size={16} /> 
                {hotelCount} Partner Hotel{hotelCount !== 1 ? 's' : ''} Available
              </div>
              <span className="hrs-lightbox-status-badge">
                ✓ Sample Gallery
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
              className="hrs-close-icon"
            />
          </button>
        </div>

        <div className="hrs-lightbox-body">
          {/* ENHANCED GALLERY SECTION */}
          <div className="hrs-gallery-section">
            <div className="hrs-main-stage">
              <img
                src={safeImages[activeImgIndex]}
                alt="Hotel Sample View"
                className="hrs-main-img"
                onError={(e) => { e.target.src = 'https://placehold.co/800x600/1e293b/94a3b8?text=Hotel+Image'; }}
              />
              
              {/* ✨ NAVIGATION ARROWS */}
              {safeImages.length > 1 && (
                <>
                  <button 
                    className="hrs-nav-arrow hrs-nav-prev"
                    onClick={goToPrev}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={32} strokeWidth={3} />
                  </button>
                  
                  <button 
                    className="hrs-nav-arrow hrs-nav-next"
                    onClick={goToNext}
                    aria-label="Next image"
                  >
                    <ChevronRight size={32} strokeWidth={3} />
                  </button>
                  
                  {/* ✨ IMAGE COUNTER */}
                  <div className="hrs-image-counter">
                    {activeImgIndex + 1} / {safeImages.length}
                  </div>
                </>
              )}
            </div>

            <div className="hrs-side-grid">
              {safeImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Hotel view ${idx + 1}`}
                  className={`hrs-side-thumb ${idx === activeImgIndex ? 'hrs-active' : ''}`}
                  onClick={() => setActiveImgIndex(idx)}
                  onError={(e) => { e.target.src = 'https://placehold.co/120x80/1e293b/94a3b8?text=Hotel'; }}
                />
              ))}
            </div>
          </div>

          {/* LUXURY INFO SECTION */}
          <div className="hrs-info-section">
            <div className="hrs-info-card">
              <div className="hrs-info-header">
                Package Information
              </div>
              <div className="hrs-info-grid">
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Capacity</span>
                  <span className="hrs-info-value">{roomType?.capacity || 2} Guests</span>
                </div>
                <div className="hrs-info-item">
                  <span className="hrs-info-label">Category</span>
                  <span className="hrs-info-value">
                    <div className="hrs-rating-display">
                      <span className="hrs-rating-number">{categoryName}</span>
                    </div>
                  </span>
                </div>
                <div className="hrs-info-item hrs-info-item--about">
                  <span className="hrs-info-label">About This Package</span>
                  <span className="hrs-info-value hrs-info-value--about">
                    These are sample hotels that may be included in this package tier. The actual hotel assignment will be confirmed upon booking based on availability. All partner hotels in this category meet our quality standards and include the listed amenities.
                  </span>
                </div>
              </div>
            </div>

            <div className="hrs-info-card">
              <div className="hrs-info-header">
                Typical Amenities & Facilities
              </div>
              <div className="hrs-amenities-wrap">
                {renderAmenities(roomType?.amenities)}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const HotelRoomSelector = ({ roomTypes, selectedRoomType, onRoomTypeChange, durationNights = 1, numberOfPax = 1, onHotelTotalChange = null }) => {
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    categoryName: '',
    images: [],
    priceRange: '',
    roomType: null,
    hotelCount: 0
  });

  const hasAutoSelectedRef = useRef(false);

  useEffect(() => {
    if (roomTypes && roomTypes.length > 0 && !hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = true;
    }
  }, [roomTypes]);

  // Amenity present if ANY partner hotel in the tier offers it
  const AMENITY_ICONS = [
    { key: 'wifi',            label: 'Free Wifi',   Icon: Wifi },
    { key: 'breakfast',       label: 'Breakfast',   Icon: Coffee },
    { key: 'bathroom',        label: 'Private Bath',Icon: ShowerHead, check: (v) => v === 'private' },
    { key: 'airConditioning', label: 'Aircon',       Icon: Wind },
    { key: 'pool',            label: 'Pool',         Icon: Waves },
    { key: 'restaurant',      label: 'Restaurant',   Icon: Utensils },
  ];

  const getGroupAmenities = (group) => {
    return AMENITY_ICONS.filter(({ key, check }) =>
      group.hotels.some(h => {
        const val = h.amenities?.[key];
        return check ? check(val) : !!val;
      })
    );
  };

  const getGroupThumbnail = (group) => {
    const withImage = group.hotels.find(h => h.hotelImage || (h.hotelImages && h.hotelImages.length > 0) || h.image);
    return withImage?.hotelImage || withImage?.hotelImages?.[0] || withImage?.image || 'https://placehold.co/400x300?text=Hotel';
  };

  const getGroupRating = (group) => {
    const ratings = group.hotels.map(h => h.hotelRating || 0).filter(r => r > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  };

  // ✅ Per-night rate lookup based on hotel tier
  // Matches both star numbers AND tier keywords from the DB
  // Only 4-star and 5-star hotels carry an additional nightly cost.
  // Standard / Budget / 3-Star & below are covered by the base package price.
  const getPerNightRate = (roomType) => {
    const t = (roomType || '').toUpperCase();
    // 5-star tier: "5-STAR", "5STAR", "PREMIUM", "LUXURY", "DELUXE"
    if (t.includes('5') || t.includes('PREMIUM') || t.includes('LUXURY') || t.includes('DELUXE')) return 2500;
    // 4-star tier: "4-STAR", "4STAR", "MID-RANGE", "MIDRANGE", "MID", "SUPERIOR"
    if (t.includes('4') || t.includes('MID') || t.includes('SUPERIOR')) return 1660;
    // Standard / Budget = ₱0
    return 0;
  };

  // ✅ Read actual capacity from DB (first hotel in group), fallback to 2
  const getRoomsNeeded = (group) => {
    const capacity = group.hotels[0]?.capacity || 2;
    return Math.ceil(numberOfPax / capacity);
  };

  // ✅ Total hotel cost for a category: rate × nights × rooms
  const getCategoryHotelTotal = (roomType, group) => {
    return getPerNightRate(roomType) * durationNights * getRoomsNeeded(group);
  };

  // ✨ Get generic category display name
  const getCategoryDisplayName = (roomType) => {
    if (!roomType) return 'Hotels';
    const type = roomType.toLowerCase();
    if (type.includes('standard')) return 'Budget Accommodations';
    if (type.includes('4')) return 'Mid Range Hotels';
    if (type.includes('5')) return 'Premium Hotels';
    return `${roomType} Hotels`;
  };

  // Group room types — Budget hotels are merged into Standard
  const groupedRoomTypes = roomTypes.reduce((acc, room) => {
    const rawType = room.type || 'Standard';
    // ✅ Merge budget into standard
    const type = rawType.toLowerCase().includes('budget') ? 'Standard' : rawType;
    if (!acc[type]) {
      acc[type] = {
        hotels: [],
        minPrice: Infinity,
        maxPrice: -Infinity
      };
    }
    acc[type].hotels.push(room);
    const price = Number(room.price) || 0;
    if (price < acc[type].minPrice) acc[type].minPrice = price;
    if (price > acc[type].maxPrice) acc[type].maxPrice = price;
    return acc;
  }, {});

  // ✨ Handle opening lightbox with randomized images from entire category
  const handleOpenCategoryGallery = (roomType, group) => {
    const allImages = getAllCategoryImages(group.hotels);
    const min = group.minPrice === Infinity ? 0 : group.minPrice;
    const max = group.maxPrice === -Infinity ? 0 : group.maxPrice;
    const priceRange = min === max
      ? `₱${min.toLocaleString()}`
      : `₱${min.toLocaleString()} - ₱${max.toLocaleString()}`;

    // Get a sample room type for amenities (use first hotel)
    const sampleRoom = group.hotels[0];

    setLightboxState({
      isOpen: true,
      categoryName: getCategoryDisplayName(roomType),
      images: allImages,
      priceRange: priceRange,
      roomType: sampleRoom,
      hotelCount: group.hotels.length
    });
  };

  // ✅ Handle category selection — reports hotel total back to parent via callback
  const handleCategorySelect = (roomType, firstHotel, group) => {
    onRoomTypeChange(firstHotel);
    // ✅ Fire callback so parent can add hotel cost to its total without re-implementing logic
    if (onHotelTotalChange) {
      const hotelTotal = getCategoryHotelTotal(roomType, group);
      onHotelTotalChange(hotelTotal, firstHotel);
    }
  };

  if (!roomTypes || roomTypes.length === 0) return null;

  const groupKeys = Object.keys(groupedRoomTypes);

  return (
    <div className="hrs-container">
      <HotelLightbox
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState(prev => ({ ...prev, isOpen: false }))}
        categoryName={lightboxState.categoryName}
        images={lightboxState.images}
        priceRange={lightboxState.priceRange}
        roomType={lightboxState.roomType}
        hotelCount={lightboxState.hotelCount}
      />

      <div className="hrs-header">
        <h3>Choose Your Accommodation Package</h3>
        <p className="hrs-subtitle">Select your preferred package tier - all include tour activities + accommodation from our partner hotels</p>
      </div>

      <div className="hrs-list">
        {groupKeys.map((roomType, idx) => {

          const group = groupedRoomTypes[roomType];

          // ✅ FIX: Normalize selected room type to handle Budget→Standard merging.
          // When parent sets selectedRoomType to a BUDGET room, it should still
          // highlight the "Standard" (Budget Accommodations) card correctly.
          const normalizedSelectedType = selectedRoomType?.type?.toLowerCase().includes('budget')
            ? 'Standard'
            : selectedRoomType?.type;
          const isSelected = normalizedSelectedType === roomType;

          const categoryName = getCategoryDisplayName(roomType);
          const amenities = getGroupAmenities(group);
          const rating = getGroupRating(group);
          const thumbnail = getGroupThumbnail(group);
          const isBestValue = idx === 0;

          // ✅ Compute hotel cost for this category for card display
          const categoryHotelTotal = getCategoryHotelTotal(roomType, group);

          return (
            <div
              key={roomType}
              className={`hrs-card hrs-category-card ${isSelected ? 'hrs-selected' : ''}`}
              onClick={() => handleCategorySelect(roomType, group.hotels[0], group)}
            >
              {isSelected && (
                <div className="hrs-checkmark-corner">
                  <Check size={14} color="#fff" strokeWidth={3} />
                </div>
              )}

              <div
                className="hrs-card-thumb-wrap"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCategoryGallery(roomType, group);
                }}
              >
                <img src={thumbnail} alt={categoryName} className="hrs-card-thumb" />
                {isBestValue && <span className="hrs-card-ribbon">Best Value</span>}
                <div className="hrs-card-thumb-hover">
                  <Eye size={16} /> View Sample Hotels
                </div>
              </div>

              <div className="hrs-card-body">
                <div className="hrs-card-toprow">
                  <div>
                    <h4>{categoryName}</h4>
                    <div className="hrs-card-subrow">
                      {rating > 0 && (
                        <span className="hrs-card-rating">
                          <Star size={13} fill="#f59e0b" color="#f59e0b" /> {rating.toFixed(1)}
                        </span>
                      )}
                      <span className="hrs-hotel-count">
                        {group.hotels.length} hotel{group.hotels.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {amenities.length > 0 && (
                  <div className="hrs-amenity-row">
                    {amenities.slice(0, 3).map(({ key, label, Icon }) => (
                      <span key={key} className="hrs-amenity-pill">
                        <Icon size={11} /> {label}
                      </span>
                    ))}
                  </div>
                )}

                <button
                  className="hrs-view-details-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCategoryGallery(roomType, group);
                  }}
                >
                  <Eye size={12} /> View Sample Hotels ({group.hotels.length})
                </button>
              </div>

              <div className="hrs-card-priceblock">
                {categoryHotelTotal === 0 ? (
                  <>
                    <div className="hrs-card-price-from">&nbsp;</div>
                    <div className="hrs-card-price hrs-card-price-included">
                      Included
                      <span className="hrs-card-price-unit">in package</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="hrs-card-price-from">Add</div>
                    <div className="hrs-card-price">
                      +₱{categoryHotelTotal.toLocaleString()}
                      <span className="hrs-card-price-unit">total upgrade</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotelRoomSelector;