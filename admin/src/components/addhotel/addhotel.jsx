import React, { useState } from 'react';
import Sidebar from '../sidebar/sidebar';
import './addhotel.css';
import { MapPin, Star, Wifi, Coffee, Car, Dumbbell } from 'lucide-react';

const AddHotel = () => {
  const [hotelDetails, setHotelDetails] = useState({
    name: '',
    location: '',
    address: '',
    price: '',
    rating: '4',
    description: '',
    amenities: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const amenitiesList = [
    { id: 'wifi', label: 'Free Wifi', icon: <Wifi size={14} /> },
    { id: 'breakfast', label: 'Breakfast', icon: <Coffee size={14} /> },
    { id: 'parking', label: 'Parking', icon: <Car size={14} /> },
    { id: 'gym', label: 'Gym', icon: <Dumbbell size={14} /> }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHotelDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityChange = (amenityId) => {
    setHotelDetails(prev => {
      const newAmenities = prev.amenities.includes(amenityId)
        ? prev.amenities.filter(id => id !== amenityId)
        : [...prev.amenities, amenityId];
      return { ...prev, amenities: newAmenities };
    });
  };

  const handleSubmit = async () => {
    if (!hotelDetails.name || !hotelDetails.location || !hotelDetails.price) {
      alert('Please fill in the required fields (Name, Location, Price)');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      alert('Hotel added successfully!');
      setIsSubmitting(false);
      setHotelDetails({
        name: '',
        location: '',
        address: '',
        price: '',
        rating: '4',
        description: '',
        amenities: []
      });
    }, 1000);
  };

  return (
    <div className="hotel-page">
      <Sidebar />
      <main className="hotel-main">
        <div className="hotel-container">
          <header className="hotel-header">
            <h1 className="hotel-title">ADD NEW HOTEL</h1>
            <p className="hotel-subtitle">Register a new accommodation partner</p>
          </header>

          <div className="hotel-grid">
            <div className="hotel-left">
              <section className="hotel-section">
                <h2 className="section-title">HOTEL DETAILS</h2>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Hotel Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={hotelDetails.name} 
                      onChange={handleChange} 
                      placeholder="e.g. Wanderwave Resort & Spa" 
                    />
                  </div>

                  <div className="form-group">
                    <label>Location (City/Area)</label>
                    <input 
                      type="text" 
                      name="location" 
                      value={hotelDetails.location} 
                      onChange={handleChange} 
                      placeholder="e.g. El Nido, Palawan" 
                    />
                  </div>

                  <div className="form-group">
                    <label>Price per Night (₱)</label>
                    <input 
                      type="number" 
                      name="price" 
                      value={hotelDetails.price} 
                      onChange={handleChange} 
                      placeholder="e.g. 2500" 
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Full Address</label>
                    <input 
                      type="text" 
                      name="address" 
                      value={hotelDetails.address} 
                      onChange={handleChange} 
                      placeholder="Street address, Barangay" 
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea 
                      name="description" 
                      rows="4" 
                      value={hotelDetails.description} 
                      onChange={handleChange}
                      placeholder="Brief description of the hotel..."
                    ></textarea>
                  </div>

                  <div className="form-group full-width">
                    <label>Amenities</label>
                    <div className="amenities-grid">
                      {amenitiesList.map(item => (
                        <label key={item.id} className={`amenity-checkbox ${hotelDetails.amenities.includes(item.id) ? 'active' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={hotelDetails.amenities.includes(item.id)}
                            onChange={() => handleAmenityChange(item.id)}
                          />
                          <span className="amenity-icon">{item.icon}</span>
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="action-buttons">
                <button className="btn-cancel">Cancel</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Hotel'}
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <aside className="hotel-right">
              <div className="preview-card">
                <span className="preview-label">PREVIEW</span>
                <div className="card-display">
                  <div className="card-image-placeholder">
                    <span>Hotel Image</span>
                  </div>
                  <div className="card-content">
                    <div className="card-header-row">
                      <h3 className="card-title">{hotelDetails.name || 'Hotel Name'}</h3>
                      <span className="card-rating">
                        <Star size={14} fill="#f59e0b" color="#f59e0b"/> {hotelDetails.rating}
                      </span>
                    </div>
                    <div className="card-location">
                      <MapPin size={14} />
                      {hotelDetails.location || 'Location'}
                    </div>
                    <p className="card-desc">
                      {hotelDetails.description || 'Description will appear here...'}
                    </p>
                    <div className="card-footer">
                      <div className="card-amenities">
                        {hotelDetails.amenities.length > 0 ? (
                          <span>{hotelDetails.amenities.length} Amenities Selected</span>
                        ) : (
                          <span>No amenities</span>
                        )}
                      </div>
                      <div className="card-price">
                        <span className="price-value">₱{hotelDetails.price || '0'}</span>
                        <span className="price-unit">/ night</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddHotel;