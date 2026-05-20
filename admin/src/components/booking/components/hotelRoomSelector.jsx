import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, Building2, X, MapPin, ChevronLeft, ChevronRight,
  Wifi, Car, Waves, Dumbbell, Utensils, Sparkles, Wind, Shirt, Wine, Star, Eye
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

const HotelRoomSelector = ({ roomTypes, selectedRoomType, onRoomTypeChange, durationNights = 1, numberOfPax = 1 }) => {
  const [lightboxState, setLightboxState] = useState({
    isOpen: false,
    categoryName: '',
    images: [],
    priceRange: '',
    roomType: null,
    hotelCount: 0
  });

  const hasAutoSelectedRef = useRef(false);

  // ✅ Per-night rate lookup based on hotel tier
  // Only 4-star and 5-star hotels carry an additional nightly cost.
  // Standard / Budget hotels are covered by the base package price.
  const getPerNightRate = (roomType) => {
    const t = (roomType || '').toUpperCase();
    if (t.includes('5')) return 2500;
    if (t.includes('4')) return 1660;
    return 0; // Standard / Budget — no additional charge
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
  useEffect(() => {
    if (roomTypes && roomTypes.length > 0 && !hasAutoSelectedRef.current) {
      hasAutoSelectedRef.current = true;
    }
  }, [roomTypes]);

  const getHotelImages = (hotel) => {
    if (hotel.hotelImages && hotel.hotelImages.length > 0) {
      return hotel.hotelImages;
    }
    if (hotel.image) {
      return [hotel.image];
    }
    return ['https://placehold.co/800x600?text=Hotel+Image'];
  };

  const getRoomTypeIcon = (type) => {
    return '🏨';
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
        {groupKeys.map((roomType) => {
          
          const group = groupedRoomTypes[roomType];
          const min = group.minPrice === Infinity ? 0 : group.minPrice;
          const max = group.maxPrice === -Infinity ? 0 : group.maxPrice;

          // ✅ FIX: Normalize selected room type to handle Budget→Standard merging.
          // When parent sets selectedRoomType to a BUDGET room, it should still
          // highlight the "Standard" (Budget Accommodations) card correctly.
          const normalizedSelectedType = selectedRoomType?.type?.toLowerCase().includes('budget')
            ? 'Standard'
            : selectedRoomType?.type;
          const isSelected = normalizedSelectedType === roomType;

          const categoryName = getCategoryDisplayName(roomType);

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

              <div className="hrs-card-header" style={{marginBottom: 0, flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'nowrap'}}>
                <div className="hrs-card-title-group" style={{flexWrap: 'nowrap', alignItems: 'flex-start'}}>
                  <span className="hrs-icon">{getRoomTypeIcon(roomType)}</span>
                  <div>
                    <h4>{categoryName}</h4>
                    <span className="hrs-hotel-count">
                      {group.hotels.length} partner hotel{group.hotels.length !== 1 ? 's' : ''} available
                    </span>
                  </div>

                </div>
                <div className="hrs-category-right" style={{flexDirection: 'column', alignItems: 'flex-end'}}>
                  {isSelected && <div className="hrs-badge-selected">✓ SELECTED</div>}
                </div>
              </div>

              <div className="hrs-details" style={{borderTop: '1px dashed #e5e7eb', marginTop: '12px', paddingTop: '12px'}}>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#6b7280',
                  marginBottom: '12px',
                  lineHeight: '1.5'
                }}>
                  <strong>Note:</strong> These are sample hotels that may be included in this package. 
                  The actual hotel will be confirmed upon booking based on availability.
                </div>


                
                {/* VIEW DETAILS BUTTON */}
                <button
                  className="hrs-view-details-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenCategoryGallery(roomType, group);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(5, 150, 105, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <Eye size={18} />
                  View Sample Hotels Gallery
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HotelRoomSelector;