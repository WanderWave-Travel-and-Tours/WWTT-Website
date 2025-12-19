import React, { useState, useEffect } from "react";
import {
  X, MapPin, Star, Wifi, Car, Waves, Dumbbell, UtensilsCrossed,
  Wind, BellRing, Shirt, Wine, CheckCircle, AlertCircle, Edit,
  Calendar, Users, DollarSign, Image as ImageIcon, Briefcase, Mail
} from "lucide-react";
import "./ViewHotelModal.css";

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

  useEffect(() => {
    if (hotel) {
      const main = hotel.mainImage || (hotel.images && hotel.images.length > 0 ? hotel.images[0].url : null);
      setActiveHeroImage(main);
    }
  }, [hotel]);

  if (!hotel) return null;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const activeAmenities = Object.entries(hotel.amenities || {})
    .filter(([_, isActive]) => isActive)
    .map(([key]) => key);

  const galleryImages = Array.isArray(hotel.images) ? hotel.images : [];

  return (
    <div className="vhm-overlay" onClick={onClose}>
      <div className="vhm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* === HEADER (Inspired by Image Header) === */}
        <div className="vhm-header">
          <div className="vhm-header-left">
            <h2 className="vhm-main-title">Hotel Details</h2>
            <div className="vhm-ref-tag">
              REF: #{hotel._id?.substring(0, 8).toUpperCase()} <span className="vhm-dot">•</span> {new Date(hotel.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
          
          <div className="vhm-header-right">
            <div className={`vhm-status-pill ${hotel.isActive ? 'completed' : 'inactive'}`}>
              <CheckCircle size={16} />
              <div className="vhm-status-text">
                <span className="vhm-status-label">{hotel.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                <span className="vhm-status-subtext">{hotel.isActive ? 'Listing is live' : 'Hidden from users'}</span>
              </div>
            </div>
            <button className="vhm-close-x" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="vhm-body">
          
          {/* 1. MEDIA SECTION (Centered Image Card style) */}
          <div className="vhm-media-container">
            <div className="vhm-media-card">
               <div className="vhm-processing-bar">
                 <CheckCircle size={18} className="vhm-icon-green" />
                 <span>Property Media & Assets</span>
               </div>
               
               <div className="vhm-image-box">
                 {activeHeroImage ? (
                    <img src={activeHeroImage} alt={hotel.name} className="vhm-hero-img" />
                 ) : (
                    <div className="vhm-no-image"><ImageIcon size={40} /><span>No image provided</span></div>
                 )}
                 <div className="vhm-image-info">
                   <div className="vhm-file-pill">
                     <ImageIcon size={14} className="vhm-icon-green" />
                     <span>{hotel.name}_Primary_View.jpg</span>
                   </div>
                   <button className="vhm-view-link">View Gallery</button>
                 </div>
               </div>

               <div className="vhm-gallery-strip">
                  {galleryImages.map((img, idx) => (
                    <div 
                      key={idx} 
                      className={`vhm-thumb ${activeHeroImage === (img.url || img) ? 'active' : ''}`}
                      onClick={() => setActiveHeroImage(img.url || img)}
                    >
                      <img src={img.url || img} alt="Gallery" onError={(e) => e.target.style.display = 'none'} />
                    </div>
                  ))}
               </div>
            </div>
          </div>

          {/* 2. HOTEL INFORMATION (Grid like Client Information) */}
          <div className="vhm-section-card">
            <h3 className="vhm-section-title">HOTEL INFORMATION</h3>
            <div className="vhm-info-grid">
              <div className="vhm-info-box">
                <div className="vhm-box-icon yellow"><Users size={18} /></div>
                <div className="vhm-box-content">
                  <label>HOTEL NAME</label>
                  <p>{hotel.name}</p>
                </div>
              </div>
              <div className="vhm-info-box">
                <div className="vhm-box-icon blue"><MapPin size={18} /></div>
                <div className="vhm-box-content">
                  <label>CITY / LOCATION</label>
                  <p>{hotel.city || hotel.location}</p>
                </div>
              </div>
              <div className="vhm-info-box">
                <div className="vhm-box-icon green"><DollarSign size={18} /></div>
                <div className="vhm-box-content">
                  <label>BASE AMOUNT</label>
                  <p className="vhm-amount-text">{formatPrice(hotel.price)}</p>
                </div>
              </div>
              <div className="vhm-info-box">
                <div className="vhm-box-icon orange"><Calendar size={18} /></div>
                <div className="vhm-box-content">
                  <label>DATE ADDED</label>
                  <p>{new Date(hotel.createdAt || Date.now()).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. DESCRIPTION (Message style) */}
          <div className="vhm-section-card">
            <h3 className="vhm-section-title">HOTEL DESCRIPTION</h3>
            <div className="vhm-message-area">
              <p>{hotel.description || "I would like to inquiry about Cenomar. Processing time: 5-7 business days."}</p>
            </div>
          </div>

          {/* 4. AMENITIES & ROOMS */}
          <div className="vhm-section-card">
             <div className="vhm-title-flex">
               <h3 className="vhm-section-title">AMENITIES & REQUIREMENTS</h3>
               <span className="vhm-count-pill">{activeAmenities.length} ITEMS</span>
             </div>
             {activeAmenities.length > 0 ? (
                <div className="vhm-pills-container">
                  {activeAmenities.map((key) => {
                    const { label, icon } = getAmenityConfig(key);
                    return (
                      <div key={key} className="vhm-modern-pill">
                        {icon} <span>{label}</span>
                      </div>
                    );
                  })}
                </div>
             ) : (
                <div className="vhm-empty-state">
                   <div className="vhm-empty-icon">📂</div>
                   <p>No Requirements Yet</p>
                </div>
             )}
          </div>

        </div>

        {/* === FOOTER === */}
        <div className="vhm-footer">
          <button className="vhm-btn-close" onClick={onClose}>Close</button>
          <button className="vhm-btn-edit" onClick={() => onEdit && onEdit(hotel._id)}>
            <Edit size={16} />
            Edit Hotel Details
          </button>
        </div>

      </div>
    </div>
  );
};

export default ViewHotelModal;