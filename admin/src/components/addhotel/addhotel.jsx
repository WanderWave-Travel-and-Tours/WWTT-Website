import React, { useState, useRef, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './addhotel.css';
import toast, { Toaster } from 'react-hot-toast';
import { MapPin, Wifi, Car, Dumbbell, UtensilsCrossed, Waves, Wind, BellRing, Shirt, Wine, Users } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000'; 

const AddHotel = () => {
  const [hotelDetails, setHotelDetails] = useState({
    name: '',
    destination: '',
    price: '', 
    maxCapacity: '', // <-- Binago mula 4 tungo sa ''
    amenities: {
      wifi: false,
      parking: false,
      pool: false,
      gym: false,
      restaurant: false,
      spa: false,
      airConditioning: false,
      roomService: false,
      laundry: false,
      bar: false
    }
  });

  const [destinations, setDestinations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [file, setFile] = useState(null);
  const pasteAreaRef = useRef(null);
  const [isPasteActive, setIsPasteActive] = useState(false);
  const [type, setType] = useState("Budget");
  const [loading, setLoading] = useState(true);

  const amenitiesList = [
    { id: 'wifi', label: 'Free Wifi', icon: <Wifi size={14} /> },
    { id: 'parking', label: 'Parking', icon: <Car size={14} /> },
    { id: 'pool', label: 'Pool', icon: <Waves size={14} /> },
    { id: 'gym', label: 'Gym', icon: <Dumbbell size={14} /> },
    { id: 'restaurant', label: 'Restaurant', icon: <UtensilsCrossed size={14} /> },
    { id: 'spa', label: 'Spa', icon: <Waves size={14} /> },
    { id: 'airConditioning', label: 'A/C', icon: <Wind size={14} /> },
    { id: 'roomService', label: 'Room Service', icon: <BellRing size={14} /> },
    { id: 'laundry', label: 'Laundry', icon: <Shirt size={14} /> },
    { id: 'bar', label: 'Bar', icon: <Wine size={14} /> }
  ];

  const showToastError = (message) => {
    toast.error(message, {
      style: { border: '1px solid #ef4444', color: '#ef4444' },
      iconTheme: { primary: '#ef4444', secondary: '#fff' },
      position: 'top-center',
    });
  };

  const showToastSuccess = (message) => {
    toast.success(message, {
      style: { border: '1px solid #059669', color: '#059669' },
      iconTheme: { primary: '#059669', secondary: '#fff' },
      position: 'top-center',
    });
  };

  const isSupportedImage = (fileBlob) => {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (fileBlob && supportedTypes.includes(fileBlob.type)) {
      return true;
    }
    return false;
  };

  const clearFile = () => {
    setFile(null); 
    setPreviewUrl(null);
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      
      const url = `${API_BASE_URL}/api/packages/all`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers.get('content-type'));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON! Got HTML instead. Check if backend is running on correct port.');
      }
      
      const data = await response.json();
      console.log('Received data:', data);
      
      if (data.status === 'ok' && Array.isArray(data.data)) {
        const uniqueDestinations = [...new Set(
          data.data
            .map(pkg => pkg.destination)
            .filter(dest => dest && dest.trim() !== '')
        )];
        
        console.log('Unique destinations:', uniqueDestinations);
        setDestinations(uniqueDestinations);
        
        if (uniqueDestinations.length === 0) {
          showToastError('No destinations found in packages.');
        }
      } else {
        console.error('Invalid data format:', data);
        showToastError('Invalid data format from server.');
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
      showToastError(`Failed to load destinations: ${error.message}. Make sure backend is running on ${API_BASE_URL}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateRooms = (guests) => {
    // Gumagamit ng 4 bilang default kung walang value na inilagay
    const maxCapacity = Number(hotelDetails.maxCapacity) || 4; 
    return Math.ceil(guests / maxCapacity);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'price') {
      let cleanedValue = value.replace(/[^0-9.]/g, ''); 

      const parts = cleanedValue.split('.');
      if (parts.length > 2) {
        cleanedValue = parts[0] + '.' + parts.slice(1).join('');
      }

      const digitsOnly = cleanedValue.replace(/\./g, '');
      if (digitsOnly.length > 6) {
        return; 
      }
      
      setHotelDetails(prev => ({ ...prev, [name]: cleanedValue }));

    } else if (name === 'maxCapacity') { // Max Capacity Validation and Filtering
      // Tanggapin lang ang digits (alisin ang signs at non-numeric characters)
      const cleanedValue = value.replace(/[^0-9]/g, '');

      // Limitahan sa 3 digits (hindi nag-a-update ng state kung 4 digits na)
      if (cleanedValue.length > 3) {
        return; 
      }
      
      // Update state with the cleaned value (empty string is allowed)
      setHotelDetails(prev => ({ ...prev, [name]: cleanedValue }));

    } else {
      setHotelDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (isSupportedImage(selected)) {
        setFile(selected);
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setFile(null); 
        setPreviewUrl(null);
        showToastError('Unsupported file type. Only JPG, PNG, and WebP images are allowed.');
        e.target.value = null;
      }
    }
  };

  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    let imageFound = false;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          imageFound = true;
          const blob = items[i].getAsFile();
          if (blob) {
            if (isSupportedImage(blob)) {
              setFile(blob);
              setPreviewUrl(URL.createObjectURL(blob));
              setIsPasteActive(false);
              return;
            } else {
              showToastError('Unsupported file type from paste. Only JPG, PNG, and WebP images are allowed.');
              setFile(null);
              setPreviewUrl(null);
              setIsPasteActive(false);
              return;
            }
          }
          break;
        }
      }
    }
    if (!imageFound) {
      showToastError('No image data found in the clipboard.');
    }
  };

  const activatePasteArea = () => {
    setIsPasteActive(true);
    if (pasteAreaRef.current) {
      pasteAreaRef.current.focus();
    }
  };

  const handleAmenityChange = (amenityId) => {
    setHotelDetails(prev => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenityId]: !prev.amenities[amenityId]
      }
    }));
  };

  const handleSubmit = async () => {
    if (!hotelDetails.name || !hotelDetails.destination) {
      showToastError('Please fill in all required fields (Name, Destination).');
      return;
    }
    
    const numericPrice = Number(hotelDetails.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showToastError('Price per room must be a positive number.');
      return;
    }

    const numericCapacity = Number(hotelDetails.maxCapacity);
    if (isNaN(numericCapacity) || numericCapacity < 1) { // Min 1 validation
      showToastError('Max Capacity must be a positive number (minimum 1).');
      return;
    }

    if (hotelDetails.maxCapacity.length > 3 || numericCapacity > 999) { // Max 3 digits validation
      showToastError('Max capacity cannot exceed 3 digits (999).');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = {
        name: hotelDetails.name,
        location: hotelDetails.destination,
        address: hotelDetails.destination,
        city: hotelDetails.destination.split(',')[0].trim(),
        country: 'Philippines',
        description: `${type} accommodation in ${hotelDetails.destination}`,
        price: numericPrice, 
        priceUnit: 'per night',
        maxCapacity: numericCapacity, 
        rating: 0,
        amenities: hotelDetails.amenities,
        mainImage: previewUrl || '', 
        featured: false,
        isActive: true,
        roomTypes: [{
          type: type,
          capacity: numericCapacity, 
          price: numericPrice,
          available: 10,
          description: `${type} room with ${hotelDetails.maxCapacity} person capacity`
        }]
      };

      const response = await fetch(`${API_BASE_URL}/api/hotels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        showToastSuccess('Hotel added successfully!');
        setHotelDetails({
          name: '',
          destination: '',
          price: '',
          maxCapacity: '', // <-- Binago mula 4 tungo sa ''
          amenities: {
            wifi: false,
            parking: false,
            pool: false,
            gym: false,
            restaurant: false,
            spa: false,
            airConditioning: false,
            roomService: false,
            laundry: false,
            bar: false
          }
        });
        setPreviewUrl(null);
        setFile(null);
        setType("Budget");
        
      } else {
        showToastError(data.message || 'Error creating hotel.');
      }
    } catch (error) {
      console.error('Error creating hotel:', error);
      showToastError('Failed to create hotel. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setHotelDetails({
      name: '',
      destination: '',
      price: '',
      maxCapacity: '', // <-- Binago mula 4 tungo sa ''
      amenities: {
        wifi: false,
        parking: false,
        pool: false,
        gym: false,
        restaurant: false,
        spa: false,
        airConditioning: false,
        roomService: false,
        laundry: false,
        bar: false
      }
    });
    clearFile(); 
    setType("Budget");
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => {
      if (isPasteActive && pasteAreaRef.current) {
        e.preventDefault(); 
        handlePaste(e);
      }
    };

    document.addEventListener("paste", handleGlobalPaste);
    return () => document.removeEventListener("paste", handleGlobalPaste);
  }, [isPasteActive]);

  const activeAmenitiesCount = Object.values(hotelDetails.amenities).filter(Boolean).length;

  const exampleGuests = [4, 5, 8, 10];
  
  const currentPrice = Number(hotelDetails.price) || 0; 
  // Gumagamit ng default na 4 para sa preview kung blangko ang input
  const currentCapacity = Number(hotelDetails.maxCapacity) || 4; 
  
  const roomCalculations = exampleGuests.map(guests => ({
    guests,
    rooms: calculateRooms(guests),
    totalPrice: calculateRooms(guests) * currentPrice
  }));

  return (
    <div className="hotel-page">
      <Sidebar />
      <Toaster /> 
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
                    <label>Hotel Category</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value)}
                      style={{
                        padding: '0.75rem 1rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        outline: 'none',
                        backgroundColor: '#fff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="Budget">Budget</option>
                      <option value="Standard">Standard</option>
                      <option value="4 Star">4 Star</option>
                      <option value="5 Star">5 Star</option>
                    </select>
                  </div>

                  <div className="form-group full-width">
                    <label>Hotel Name *</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={hotelDetails.name} 
                      onChange={handleChange} 
                      placeholder="e.g. Wanderwave Resort & Spa" 
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Destination *</label>
                    {loading ? (
                      <input 
                        type="text" 
                        value="Loading destinations..." 
                        disabled
                        style={{ 
                          backgroundColor: '#f1f5f9',
                          padding: '0.75rem 1rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      />
                    ) : destinations.length === 0 ? (
                      <div>
                        <input 
                          type="text" 
                          value="No destinations available" 
                          disabled
                          style={{ 
                            backgroundColor: '#fee2e2',
                            padding: '0.75rem 1rem',
                            border: '1px solid #fca5a5',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            color: '#dc2626'
                          }}
                        />
                        <button 
                          onClick={fetchDestinations}
                          style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                        >
                          Retry Loading
                        </button>
                      </div>
                    ) : (
                      <select
                        name="destination"
                        value={hotelDetails.destination}
                        onChange={handleChange}
                        required
                        style={{
                          padding: '0.75rem 1rem',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          outline: 'none',
                          backgroundColor: '#fff',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        <option value="">Select Destination</option>
                        {destinations.map((dest, index) => (
                          <option key={index} value={dest}>
                            {dest}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Max Capacity per Room *</label>
                    <input 
                      type="text" 
                      inputMode="numeric" 
                      name="maxCapacity" 
                      value={hotelDetails.maxCapacity} // <-- Ito ay blangko na sa simula
                      onChange={handleChange} 
                      placeholder="e.g. 4" 
                      required
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Minimum 1 person. Maximum 3 digits (999). Only numbers allowed.
                    </span>
                  </div>

                  <div className="form-group full-width">
                    <label>Price per Room per Night (₱) *</label>
                    <input 
                      type="text" 
                      name="price" 
                      value={hotelDetails.price} 
                      onChange={handleChange} 
                      placeholder="e.g. 2500" 
                      required
                      min="1" 
                      inputMode="decimal" 
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Minimum ₱1.00. Maximum 6 digits (e.g., 9999.99). Only numbers and '.' allowed.
                    </span>
                  </div>

                  {(hotelDetails.price || hotelDetails.maxCapacity !== '') && (
                    <div className="form-group full-width">
                      <label>Room Calculation Preview</label>
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '0.5rem', fontWeight: '500' }}>
                          <Users size={14} style={{ display: 'inline', marginRight: '0.5rem' }} />
                          Example: {currentCapacity} persons/room @ ₱{currentPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}/room/night
                        </p>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          {roomCalculations.map(calc => (
                            <div key={calc.guests} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '0.5rem',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}>
                              <span style={{ color: '#64748b' }}>
                                {calc.guests} guests = {calc.rooms} room{calc.rooms > 1 ? 's' : ''}
                              </span>
                              <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                                ₱{calc.totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="form-group full-width">
                    <label>Hotel Image</label>
                    {previewUrl ? (
                      <div style={{ marginTop: '0.5rem' }}>
                        <img src={previewUrl} alt="Preview" style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }} />
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <label style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}>
                            <input type="file" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" hidden />
                            Change
                          </label>
                          <button type="button" onClick={activatePasteArea} style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#64748b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}>Paste</button>
                          <button type="button" onClick={clearFile} style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}>Remove</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <label style={{
                          flex: 1,
                          padding: '2rem',
                          border: '2px dashed #cbd5e1',
                          borderRadius: '8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: '#f8fafc'
                        }}>
                          <input type="file" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" hidden />
                          <p style={{ margin: '0.5rem 0', color: '#475569' }}>Click to upload</p>
                          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>JPG, PNG or WebP</span>
                        </label>
                        <span style={{ color: '#94a3b8', fontSize: '0.875rem' }}>OR</span>
                        <div ref={pasteAreaRef} onClick={activatePasteArea} onBlur={() => setIsPasteActive(false)} tabIndex={0} style={{
                          flex: 1,
                          padding: '2rem',
                          border: `2px dashed ${isPasteActive ? '#3b82f6' : '#cbd5e1'}`,
                          borderRadius: '8px',
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: isPasteActive ? '#eff6ff' : '#f8fafc',
                          outline: 'none'
                        }}>
                          <p style={{ margin: '0.5rem 0', color: '#475569' }}>Paste screenshot</p>
                          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Press Ctrl+V or Cmd+V</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group full-width">
                    <label>Amenities</label>
                    <div className="amenities-grid">
                      {amenitiesList.map(item => (
                        <label key={item.id} className={`amenity-checkbox ${hotelDetails.amenities[item.id] ? 'active' : ''}`}>
                          <input type="checkbox" checked={hotelDetails.amenities[item.id]} onChange={() => handleAmenityChange(item.id)} />
                          <span className="amenity-icon">{item.icon}</span>
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="action-buttons">
                <button className="btn-cancel" onClick={handleCancel}>Cancel</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Hotel'}
                </button>
              </div>
            </div>

            <aside className="hotel-right">
              <div className="preview-card">
                <span className="preview-label">PREVIEW</span>
                <div className="card-display">
                  <div className="card-image-placeholder" style={{
                    backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}>
                    {!previewUrl && <span>Hotel Image</span>}
                  </div>
                  <div className="card-content">
                    <div className="card-header-row">
                      <h3 className="card-title">{hotelDetails.name || 'Hotel Name'}</h3>
                      <span style={{
                        background: '#f3f4f6',
                        color: '#6b7280',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.85rem',
                        fontWeight: '500'
                      }}>{type}</span>
                    </div>
                    <div className="card-location">
                      <MapPin size={14} />
                      {hotelDetails.destination || 'Destination'}
                    </div>
                    <p className="card-desc">
                      {`${type} accommodation in ${hotelDetails.destination || 'your destination'}. Max ${currentCapacity} persons per room.`}
                    </p>
                    <div className="card-footer">
                      <div className="card-amenities">
                        <span>{activeAmenitiesCount > 0 ? `${activeAmenitiesCount} Amenities` : 'No amenities'}</span>
                      </div>
                      <div className="card-price">
                        <span className="price-value">₱{currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) || '0'}</span>
                        <span className="price-unit">/ room / night</span>
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