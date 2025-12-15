import React, { useState, useEffect } from "react";
import {
  X, MapPin, Star, Wifi, Car, Waves, Dumbbell, UtensilsCrossed,
  Wind, BellRing, Shirt, Wine, CheckCircle, AlertCircle, Edit,
  Calendar, Users, DollarSign, Image as ImageIcon
} from "lucide-react";
import "./ViewHotelModal.css";

// --- HELPER: Amenity Icon Mapper ---
const getAmenityConfig = (key) => {
  const config = {
    wifi: { label: "Free Wifi", icon: <Wifi size={14} /> },
    parking: { label: "Parking", icon: <Car size={14} /> },
    pool: { label: "Swimming Pool", icon: <Waves size={14} /> },
    gym: { label: "Gym / Fitness", icon: <Dumbbell size={14} /> },
    restaurant: { label: "Restaurant", icon: <UtensilsCrossed size={14} /> },
    spa: { label: "Spa & Wellness", icon: <Waves size={14} /> },
    airConditioning: { label: "Air Conditioning", icon: <Wind size={14} /> },
    roomService: { label: "Room Service", icon: <BellRing size={14} /> },
    laundry: { label: "Laundry", icon: <Shirt size={14} /> },
    bar: { label: "Bar / Lounge", icon: <Wine size={14} /> }
  };
  return config[key] || { label: key, icon: <CheckCircle size={14} /> };
};

const ViewHotelModal = ({ hotel, onClose, onEdit }) => {
  const [activeHeroImage, setActiveHeroImage] = useState(null);

  // Reset active image when hotel changes
  useEffect(() => {
    if (hotel) {
      const main = hotel.mainImage || (hotel.images && hotel.images.length > 0 ? hotel.images[0].url : null);
      setActiveHeroImage(main);
    }
  }, [hotel]);

  if (!hotel) return null;

  // Format Currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  // Get Active Amenities
  const activeAmenities = Object.entries(hotel.amenities || {})
    .filter(([_, isActive]) => isActive)
    .map(([key]) => key);

  // Get Gallery Images (ensure it's an array)
  const getGalleryImages = () => {
    if (Array.isArray(hotel.images)) return hotel.images;
    return [];
  };

  const galleryImages = getGalleryImages();

  return (
    <div className="vhm-overlay" onClick={onClose}>
      <div className="vhm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* === HEADER === */}
        <div className="vhm-header">
          <div className="vhm-header-content">
            <div className="vhm-title-group">
              <h2 className="vhm-title">{hotel.name}</h2>
              <div className="vhm-meta">
                <MapPin size={14} />
                <span>{hotel.location || hotel.city}</span>
                <span className="vhm-divider">•</span>
                <span className={`vhm-status ${hotel.isActive ? 'active' : 'inactive'}`}>
                  {hotel.isActive ? 'Active Listing' : 'Inactive'}
                </span>
              </div>
            </div>
            
            {/* Featured Badge */}
            {hotel.featured && (
              <div className="vhm-badge-featured">
                <Star size={14} fill="#f59e0b" color="#f59e0b" />
                <span>Featured</span>
              </div>
            )}
          </div>
          <button className="vhm-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* === BODY === */}
        <div className="vhm-body">

          {/* 1. MEDIA SECTION (Grid Layout: Hero + Side Thumbnails) */}
          <div className="vhm-media-grid">
            
            {/* Left: Main Hero Image */}
            <div className="vhm-hero-wrapper">
              {activeHeroImage ? (
                <img src={activeHeroImage} alt={hotel.name} className="vhm-hero-img" />
              ) : (
                <div className="vhm-placeholder-img">
                  <ImageIcon size={48} />
                  <span>No Images Available</span>
                </div>
              )}
              <div className="vhm-price-tag">
                <span className="vhm-price-amount">{formatPrice(hotel.price)}</span>
                <span className="vhm-price-unit">/ night</span>
              </div>
            </div>

            {/* Right: Vertical Thumbnail Strip */}
            <div className="vhm-thumbnail-col">
              {/* Always show main image as first thumbnail */}
              {hotel.mainImage && (
                <div 
                  className={`vhm-thumb-item ${activeHeroImage === hotel.mainImage ? 'active' : ''}`}
                  onClick={() => setActiveHeroImage(hotel.mainImage)}
                >
                  <img src={hotel.mainImage} alt="Main" />
                </div>
              )}
              
              {/* Show gallery images */}
              {galleryImages.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`vhm-thumb-item ${activeHeroImage === (img.url || img) ? 'active' : ''}`}
                  onClick={() => setActiveHeroImage(img.url || img)}
                >
                  <img 
                    src={img.url || img} 
                    alt={`Gallery ${idx}`}
                    onError={(e) => e.target.style.display = 'none'} 
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="vhm-content-grid">
            
            {/* 2. GENERAL INFO CARD */}
            <div className="vhm-card">
              <div className="vhm-card-header">
                <h3>General Information</h3>
              </div>
              <div className="vhm-info-grid">
                <div className="vhm-info-item">
                  <div className="vhm-icon-box"><DollarSign size={18} /></div>
                  <div>
                    <label>Base Price</label>
                    <p>{formatPrice(hotel.price)}</p>
                  </div>
                </div>
                <div className="vhm-info-item">
                  <div className="vhm-icon-box"><Users size={18} /></div>
                  <div>
                    <label>Max Capacity</label>
                    <p>{hotel.maxCapacity || 4} Guests</p>
                  </div>
                </div>
                <div className="vhm-info-item">
                  <div className="vhm-icon-box"><Star size={18} /></div>
                  <div>
                    <label>Rating</label>
                    <p>{hotel.rating || 0} / 5.0</p>
                  </div>
                </div>
                <div className="vhm-info-item">
                  <div className="vhm-icon-box"><Calendar size={18} /></div>
                  <div>
                    <label>Added On</label>
                    <p>{new Date(hotel.createdAt || Date.now()).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. AMENITIES CARD */}
            <div className="vhm-card">
              <div className="vhm-card-header">
                <h3>Amenities</h3>
                <span className="vhm-count-badge">{activeAmenities.length}</span>
              </div>
              {activeAmenities.length > 0 ? (
                <div className="vhm-amenities-list">
                  {activeAmenities.map((key) => {
                    const { label, icon } = getAmenityConfig(key);
                    return (
                      <div key={key} className="vhm-amenity-pill">
                        {icon} <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="vhm-empty-state">
                  <AlertCircle size={20} />
                  <span>No amenities listed</span>
                </div>
              )}
            </div>

          </div>

          {/* 4. DESCRIPTION */}
          <div className="vhm-card">
            <div className="vhm-card-header">
              <h3>Description</h3>
            </div>
            <div className="vhm-description-box">
              {hotel.description || "No description available for this hotel."}
            </div>
          </div>

          {/* 5. ROOM TYPES (Updated: No Available Column) */}
          {hotel.roomTypes && hotel.roomTypes.length > 0 && (
            <div className="vhm-card">
              <div className="vhm-card-header">
                <h3>Room Configuration</h3>
              </div>
              <div className="vhm-table-wrapper">
                <table className="vhm-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Capacity</th>
                      <th>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotel.roomTypes.map((room, idx) => (
                      <tr key={idx}>
                        <td className="fw-bold">{room.type}</td>
                        <td>{room.capacity} Pax</td>
                        <td className="text-green">{formatPrice(room.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* === FOOTER === */}
        <div className="vhm-footer">
          <button className="vhm-btn vhm-btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="vhm-btn vhm-btn-primary" onClick={() => onEdit && onEdit(hotel._id)}>
            <Edit size={16} />
            <span>Edit Hotel Details</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ViewHotelModal;