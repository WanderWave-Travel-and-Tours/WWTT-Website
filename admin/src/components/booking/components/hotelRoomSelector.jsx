import React, { useState, useEffect, useRef } from 'react';
import {
  Check, Building2, X, MapPin, ChevronLeft, ChevronRight,
  Wifi, Car, Waves, Dumbbell, Utensils, Sparkles, Wind, Shirt, Wine, Star, Eye,
  Coffee, ShowerHead, Tv, Info
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
  
  console.log('🏨 Getting images for hotels:', hotels);
  console.log('📊 Total hotels to process:', hotels.length);
  
  hotels.forEach((hotel, idx) => {
    console.log(`\n--- Hotel ${idx} ---`);
    console.log('Full hotel object:', hotel);
    console.log('Hotel keys:', Object.keys(hotel));
    
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
        console.log(`  ✅ Found ${field}:`, hotel[field]);
        
        // If it's an array
        if (Array.isArray(hotel[field]) && hotel[field].length > 0) {
          console.log(`    Adding ${hotel[field].length} images from ${field}`);
          allImages.push(...hotel[field]);
          foundImages = true;
          break;
        }
        // If it's a single string/URL
        else if (typeof hotel[field] === 'string') {
          console.log(`    Adding single image from ${field}`);
          allImages.push(hotel[field]);
          foundImages = true;
          break;
        }
      }
    }
    
    if (!foundImages) {
      console.log(`  ⚠️ No images found for hotel: ${hotel.hotelName || hotel.name || 'Unknown'}`);
    }
  });
  
  console.log('\n📸 Total images collected:', allImages.length);
  console.log('Images array:', allImages);
  
  // If no images found, use placeholder
  if (allImages.length === 0) {
    console.log('⚠️ No images found, using placeholder');
    return ['https://placehold.co/800x600?text=No+Image'];
  }
  
  // Randomize the images
  const shuffled = shuffleArray(allImages);
  console.log('🔀 Images shuffled, returning:', shuffled.length, 'images');
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
    if (!amenitiesObj) return <span style={{fontSize:'0.85rem', color:'#64748b'}}>Standard amenities included</span>;

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
                alt="Hotel Sample View" 
                className="hrs-main-img"
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
                <div className="hrs-info-item" style={{flexDirection: 'column', alignItems: 'flex-start', gap: '8px'}}>
                  <span className="hrs-info-label">About This Package</span>
                  <span className="hrs-info-value" style={{
                    fontSize: '0.9rem', 
                    fontWeight: '500', 
                    lineHeight:'1.5',
                    maxWidth: '100%',
                    textAlign: 'left',
                    color: '#475569'
                  }}>
                    These are sample hotels that may be included in this package tier. The actual hotel assignment will be confirmed upon booking based on availability. All partner hotels in this category meet our quality standards and include the listed amenities.
                  </span>
                </div>
              </div>
            </div>

            <div className="hrs-info-card">
              <div className="hrs-info-header">
                Typical Amenities & Facilities
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
    const withImage = group.hotels.find(h => h.hotelImage);
    return withImage?.hotelImage || 'https://placehold.co/400x300?text=Hotel';
  };

  const getGroupRating = (group) => {
    const ratings = group.hotels.map(h => h.hotelRating || 0).filter(r => r > 0);
    if (ratings.length === 0) return 0;
    return ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
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

  // ✅ Handle category selection — triggered only on double-click
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
          const min = group.minPrice === Infinity ? 0 : group.minPrice;

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

          return (
            <div
              key={roomType}
              className={`hrs-card hrs-category-card ${isSelected ? 'hrs-selected' : ''}`}
              onClick={() => handleCategorySelect(roomType, group.hotels[0])}
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
                        {group.hotels.length} partner hotel{group.hotels.length !== 1 ? 's' : ''} available
                      </span>
                    </div>
                  </div>
                </div>

                {amenities.length > 0 && (
                  <div className="hrs-amenity-row">
                    {amenities.map(({ key, label, Icon }) => (
                      <span key={key} className="hrs-amenity-pill">
                        <Icon size={13} /> {label}
                      </span>
                    ))}
                  </div>
                )}

                <div className="hrs-card-note">
                  <Info size={13} className="hrs-card-note-icon" />
                  <span>
                    These are sample hotels that may be included in this package. The actual hotel will be confirmed upon booking based on availability.
                  </span>
                </div>

                <button
                  className="hrs-view-details-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCategoryGallery(roomType, group);
                  }}
                >
                  <Eye size={14} /> View Sample Hotels ({group.hotels.length})
                </button>
              </div>

              <div className="hrs-card-priceblock">
                <div className="hrs-card-price-from">From</div>
                <div className="hrs-card-price">
                  ₱{min.toLocaleString()}
                  <span className="hrs-card-price-unit">/ person</span>
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