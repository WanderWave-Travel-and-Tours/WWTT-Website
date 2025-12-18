import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import HotelImageUpload from './HotelImageUpload';
import HotelDetails from './HotelDetails';
import HotelAmenities from './HotelAmenities';
import HotelGallery from './HotelGallery';
import HotelPreview from './HotelPreview';
import { useToast } from '../toast/ToastManager'; // 👈 ADD THIS LINE
import './addhotel.css'; // Assuming this CSS file contains necessary styles
import toast, { Toaster } from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:5000';

const AddHotel = () => {
  const navigate = useNavigate();
  const toast = useToast(); // 👈 ADD THIS LINE
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const [hotelDetails, setHotelDetails] = useState({
    name: '',
    destination: '',
    price: '', 
    maxCapacity: '', // <-- Inayos na: Simula sa blankong string
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
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [type, setType] = useState("Budget");
  const [loading, setLoading] = useState(true);

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
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        // Log the unexpected content type or content for debugging
        const text = await response.text(); 
        console.error('Non-JSON response:', text.substring(0, 200) + '...');
        throw new Error('Response is not JSON! Got non-JSON content instead.');
      }
      
      const response = await fetch(`${API_BASE_URL}/api/packages/all`);
      const data = await response.json();
      
      if (data.status === 'ok' && Array.isArray(data.data)) {
        const uniqueDestinations = [...new Set(
          data.data.map(pkg => pkg.destination).filter(dest => dest && dest.trim() !== '')
        )];
        setDestinations(uniqueDestinations);
      }
    } catch (error) {
      console.error('Error fetching destinations:', error);
      showToastError(`Failed to load destinations: ${error.message}`);
      toast.error('Failed to load destinations', 'Connection Error'); // 👈 ADD THIS LINE
    } finally {
      setLoading(false);
    }
  };

  const calculateRooms = (guests) => {
    // Gumagamit ng 4 bilang default kung walang valid number ang maxCapacity
    const maxCapacity = Number(hotelDetails.maxCapacity) > 0 ? Number(hotelDetails.maxCapacity) : 4; 
    return Math.ceil(guests / maxCapacity);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'price') {
      let cleanedValue = value.replace(/[^0-9.]/g, ''); 

      // Pinipigilan ang multiple decimal points
      const parts = cleanedValue.split('.');
      if (parts.length > 2) {
        cleanedValue = parts[0] + '.' + parts.slice(1).join('');
      }

      // Max 6 total digits (e.g., 9999.99, 123456)
      const digitsOnly = cleanedValue.replace(/\./g, '');
      if (digitsOnly.length > 6) {
        return; 
      }
      
      setHotelDetails(prev => ({ ...prev, [name]: cleanedValue }));

    } else if (name === 'maxCapacity') { // Max Capacity Validation and Filtering
      // Tanggapin lang ang digits (alisin ang signs at non-numeric characters)
      const cleanedValue = value.replace(/[^0-9]/g, '');

      // Limitahan sa 3 digits
      if (cleanedValue.length > 3) {
        return; 
      }
      
      // Update state with the cleaned value (empty string is allowed)
      setHotelDetails(prev => ({ ...prev, [name]: cleanedValue }));

    } else {
      setHotelDetails(prev => ({ ...prev, [name]: value }));
    }
  };

  // Helper to convert file to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  // Handle Main Image
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

  // Handle Multiple Gallery Images
  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validFiles = files.filter(file => isSupportedImage(file));

      if (validFiles.length < files.length) {
        showToastError('Some selected files were ignored. Only JPG, PNG, and WebP images are allowed for the gallery.');
      }
      
      const newGalleryItems = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setGalleryFiles(prev => [...prev, ...newGalleryItems]);
    }
    // Clear the input value to allow the same file(s) to be selected again if needed
    e.target.value = null;
  };

  const removeGalleryImage = (indexToRemove) => {
    // Revoke the object URL to prevent memory leaks
    if (galleryFiles[indexToRemove] && galleryFiles[indexToRemove].preview) {
      URL.revokeObjectURL(galleryFiles[indexToRemove].preview);
    }
    setGalleryFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  // Clean up object URLs when the component unmounts (or on cancel/reset)
  useEffect(() => {
    return () => {
      galleryFiles.forEach(item => URL.revokeObjectURL(item.preview));
    };
  }, []);


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
  const updateField = (field, value) => {
    setHotelDetails(prev => ({ ...prev, [field]: value }));
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

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!hotelDetails.name || !hotelDetails.destination || !hotelDetails.price) {
      toast.error('Please fill in all required fields', 'Validation Error'); // 👈 ADD THIS LINE
      window.scrollTo(0, 0);
      return;
    }

    if (isNaN(hotelDetails.price) || Number(hotelDetails.price) <= 0) {
      toast.error('Please enter a valid price', 'Validation Error'); // 👈 ADD THIS LINE
      window.scrollTo(0, 0);
  const handleSubmit = async () => {
    // 1. Basic Field Validation
    if (!hotelDetails.name || !hotelDetails.destination) {
      showToastError('Please fill in all required fields (Name, Destination).');
      return;
    }
    
    // 2. Price Validation
    const numericPrice = Number(hotelDetails.price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      showToastError('Price per room must be a positive number.');
      return;
    }

    // 3. Capacity Validation
    const numericCapacity = Number(hotelDetails.maxCapacity);
    if (isNaN(numericCapacity) || numericCapacity < 1) { 
      // Gumagamit ng 4 bilang default sa logic, pero kailangan ng valid input para sa database
      showToastError('Max Capacity must be a positive number (minimum 1).');
      return;
    }

    // Since we filtered to max 3 digits in handleChange, this check is redundant but kept for safety.
    if (hotelDetails.maxCapacity.length > 3 || numericCapacity > 999) { 
      showToastError('Max capacity cannot exceed 3 digits (999).');
      return;
    }

    setIsSubmitting(true);

    try {
      let mainImageBase64 = '';
      if (file) {
        mainImageBase64 = await convertToBase64(file);
        console.log('Main image converted to base64, length:', mainImageBase64.length);
      }

      const galleryImagesBase64 = [];
      for (const item of galleryFiles) {
        try {
          const base64 = await convertToBase64(item.file);
          galleryImagesBase64.push({ 
            url: base64, 
            caption: item.caption || '' 
          });
        } catch (err) {
          console.error('Error converting gallery image:', err);
        }
      }

      console.log('Gallery images converted:', galleryImagesBase64.length);

      // Extract city from destination
      const cityName = hotelDetails.destination.split(',')[0].trim();
      // Convert gallery images to base64 array
      const galleryImagesPromises = galleryFiles.map(async (item) => {
        const base64 = await convertToBase64(item.file);
        // It's important to include the file extension in the caption or filename 
        // if the backend relies on it, but for simplicity here, we stick to the required format.
        return {
          url: base64,
          caption: item.file.name || '' // Use file name as caption or just empty string
        };
      });
      
      const galleryImagesBase64 = await Promise.all(galleryImagesPromises);

      const hotelPayload = {
        name: hotelDetails.name,
        location: hotelDetails.destination,
        city: cityName,
        description: `${type} accommodation in ${hotelDetails.destination}`,
        price: numericPrice, 
        maxCapacity: numericCapacity, 
        amenities: hotelDetails.amenities,
        mainImage: mainImageBase64,
        images: galleryImagesBase64,
        featured: false,
        isActive: true,
        roomTypes: [{
          type: type,
          capacity: Number(hotelDetails.maxCapacity) || 4,
          price: Number(hotelDetails.price),
          available: 5,
          description: `Standard ${type} room`
          capacity: numericCapacity, 
          price: numericPrice,
          available: 10, // Default value for availability
          description: `${type} room with ${numericCapacity} person capacity`
        }]
      };

      console.log('Sending hotel payload:', {
        ...hotelPayload,
        mainImage: mainImageBase64 ? `[BASE64 ${mainImageBase64.length} chars]` : 'none',
        images: `[${galleryImagesBase64.length} images]`
      });

      const response = await fetch(`${API_BASE_URL}/api/hotels`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(hotelPayload)
      });

      const data = await response.json();
      console.log('Server response:', data);

      if (data.success) {
        showToastSuccess('Hotel added successfully!');
        // Reset Form
        handleCancel(); // Re-use handleCancel for reset logic
        toast.success(`${hotelDetails.name} has been added successfully!`, 'Hotel Added'); // 👈 ADD THIS LINE
        window.scrollTo(0, 0);
        
        // Reset form
        setHotelDetails({
          name: '',
          destination: '',
          price: '',
          maxCapacity: 4,
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
        setFile(null);
        setPreviewUrl(null);
        setGalleryFiles([]);
        setType("Budget");

        // 👇 COMMENT OUT OR REMOVE THESE 3 LINES TO STOP REDIRECT
        // setTimeout(() => {
        //   navigate('/view-hotels');
        // }, 1500);
      } else {
        toast.error(data.message || 'Failed to save hotel', 'Save Failed'); // 👈 ADD THIS LINE
        window.scrollTo(0, 0);
        showToastError(data.message || 'Error creating hotel.');
      }
    } catch (err) {
      console.error('Error saving hotel:', err);
      toast.error('Please check if your backend is running', 'Connection Error'); // 👈 ADD THIS LINE
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error creating hotel:', error);
      showToastError('Failed to create hotel. Please check your network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/view-hotels');
    }
  };
    // Clear hotel details
    setHotelDetails({
      name: '',
      destination: '',
      price: '',
      maxCapacity: '', // <-- Reset to blank string
      amenities: {
        wifi: false, parking: false, pool: false, gym: false, restaurant: false,
        spa: false, airConditioning: false, roomService: false, laundry: false, bar: false
      }
    });
    // Clear images and revoke URLs to free up memory
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    galleryFiles.forEach(item => URL.revokeObjectURL(item.preview));
    
    setPreviewUrl(null);
    setFile(null);
    setGalleryFiles([]); 
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
  // Gumagamit ng default na 4 para sa preview kung blangko ang input (pero > 0 dapat)
  const currentCapacity = Number(hotelDetails.maxCapacity) > 0 ? Number(hotelDetails.maxCapacity) : 4; 
  
  const roomCalculations = exampleGuests.map(guests => ({
    guests,
    rooms: calculateRooms(guests),
    totalPrice: calculateRooms(guests) * currentPrice
  }));

  return (
    <div className="atour-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <Toaster /> 
      <main className={`atour-main ${isSidebarCollapsed ? 'atour-collapsed' : ''}`}>
        <div className="atour-container">
          <header className="atour-header">
            <div className="atour-header-content">
              <h1 className="atour-title">NEW HOTEL</h1>
              <p className="atour-subtitle">Register a new accommodation partner to your catalog</p>
            </div>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="atour-grid">
              <div className="atour-left">
                <HotelImageUpload
                  file={file}
                  setFile={setFile}
                  previewUrl={previewUrl}
                  setPreviewUrl={setPreviewUrl}
                />

                <HotelDetails
                  hotelDetails={hotelDetails}
                  updateField={updateField}
                  type={type}
                  setType={setType}
                  destinations={destinations}
                  loading={loading}
                  fetchDestinations={fetchDestinations}
                />

                <HotelGallery
                  galleryFiles={galleryFiles}
                  setGalleryFiles={setGalleryFiles}
                />

                <HotelAmenities
                  amenities={hotelDetails.amenities}
                  handleAmenityChange={handleAmenityChange}
                />
              </div>

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
                      placeholder="e.g. 2500.00" 
                      required
                      min="1" 
                      inputMode="decimal" 
                    />
                    <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                      Minimum ₱1.00. Maximum 6 total digits (e.g., 9999.99). Only numbers and '.' allowed.
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

                  {/* Main Image Section */}
                  <div className="form-group full-width">
                    <label>Main Hotel Image (Cover)</label>
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
                        {isPasteActive && (
                           <div style={{ marginTop: '0.5rem', padding: '0.5rem', border: '1px solid #3b82f6', borderRadius: '4px', backgroundColor: '#eff6ff' }}>
                             <p style={{ margin: 0, color: '#1d4ed8', fontSize: '0.875rem' }}>Press **Ctrl+V** anywhere to paste the image.</p>
                           </div>
                         )}
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
                        <div ref={pasteAreaRef} 
                             onClick={activatePasteArea} 
                             onBlur={() => setIsPasteActive(false)} 
                             tabIndex={0} 
                             style={{
                               flex: 1,
                               padding: '2rem',
                               border: `2px dashed ${isPasteActive ? '#3b82f6' : '#cbd5e1'}`,
                               borderRadius: '8px',
                               textAlign: 'center',
                               cursor: 'pointer',
                               backgroundColor: isPasteActive ? '#eff6ff' : '#f8fafc',
                               outline: 'none',
                               transition: 'border-color 0.2s, background-color 0.2s'
                             }}>
                          <p style={{ margin: '0.5rem 0', color: '#475569' }}>Paste screenshot</p>
                          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Press Ctrl+V</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Multiple Gallery Images Section */}
                  <div className="form-group full-width">
                    <label>Hotel Gallery (Multiple Views)</label>
                    <div className="gallery-section">
                      <div className="gallery-grid">
                        {/* Upload Button */}
                        <label className="upload-box" style={{
                           padding: '2rem', 
                           border: '2px dashed #3b82f6', 
                           borderRadius: '8px', 
                           display: 'flex', 
                           flexDirection: 'column', 
                           alignItems: 'center', 
                           justifyContent: 'center', 
                           cursor: 'pointer', 
                           backgroundColor: '#eff6ff', 
                           color: '#3b82f6',
                           minHeight: '120px'
                        }}>
                          <input 
                            type="file" 
                            onChange={handleGalleryChange} 
                            accept="image/jpeg,image/png,image/webp" // Restricted to supported types
                            multiple 
                            hidden 
                          />
                          <ImagePlus size={24} color="#3b82f6" />
                          <span style={{ marginTop: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>Add Photos</span>
                        </label>

                        {/* Gallery Previews */}
                        {galleryFiles.map((item, index) => (
                          <div key={index} className="gallery-item" style={{ position: 'relative', height: '120px', overflow: 'hidden', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <img 
                              src={item.preview} 
                              alt={`Gallery ${index}`} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <button 
                              type="button" 
                              className="remove-image-btn"
                              onClick={() => removeGalleryImage(index)}
                              style={{ 
                                position: 'absolute', 
                                top: '4px', 
                                right: '4px', 
                                backgroundColor: 'rgba(239, 68, 68, 0.8)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '50%', 
                                width: '24px', 
                                height: '24px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                cursor: 'pointer',
                                zIndex: 10
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="helper-text" style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>{galleryFiles.length} photos selected (JPG, PNG, WebP allowed)</p>
                    </div>
                  </div>

                  <div className="form-group full-width">
                    <label>Amenities</label>
                    <div className="amenities-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '0.5rem'
                    }}>
                      {amenitiesList.map(item => (
                        <label key={item.id} 
                               className={`amenity-checkbox ${hotelDetails.amenities[item.id] ? 'active' : ''}`}
                               style={{
                                   display: 'flex',
                                   alignItems: 'center',
                                   padding: '0.5rem',
                                   border: `1px solid ${hotelDetails.amenities[item.id] ? '#3b82f6' : '#e2e8f0'}`,
                                   borderRadius: '6px',
                                   cursor: 'pointer',
                                   backgroundColor: hotelDetails.amenities[item.id] ? '#eff6ff' : '#fff',
                                   fontSize: '0.875rem',
                                   fontWeight: '500',
                                   color: hotelDetails.amenities[item.id] ? '#3b82f6' : '#475569',
                                   transition: 'all 0.2s'
                               }}>
                          <input 
                            type="checkbox" 
                            checked={hotelDetails.amenities[item.id]} 
                            onChange={() => handleAmenityChange(item.id)} 
                            hidden 
                          />
                          <span className="amenity-icon" style={{ marginRight: '0.5rem', display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                          {item.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <div className="action-buttons" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <button className="btn-cancel" onClick={handleCancel} style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#e2e8f0',
                    color: '#475569',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '600'
                }}>Cancel</button>
                <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting} style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: isSubmitting ? '#93c5fd' : '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    fontWeight: '600'
                }}>
                  {isSubmitting ? 'Saving...' : 'Save Hotel'}
                </button>
              </div>
            </div>

            <aside className="hotel-right">
              <div className="preview-card" style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1rem',
                  backgroundColor: '#fff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
              }}>
                <span className="preview-label" style={{
                    display: 'block',
                    marginBottom: '0.75rem',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    color: '#94a3b8'
                }}>PREVIEW</span>
                <div className="card-display">
                  <div className="card-image-placeholder" style={{
                    backgroundImage: previewUrl ? `url(${previewUrl})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '180px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8'
                  }}>
                    {!previewUrl && <span>Hotel Image</span>}
                  </div>
                  <div className="card-content" style={{ padding: '1rem 0 0 0' }}>
                    <div className="card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 className="card-title" style={{ margin: 0, fontSize: '1.125rem', color: '#1e293b' }}>{hotelDetails.name || 'Hotel Name'}</h3>
                      <span style={{
                        background: '#f3f4f6',
                        color: '#6b7280',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem', // Changed from 0.85rem for better fit
                        fontWeight: '500'
                      }}>{type}</span>
                    </div>
                    <div className="card-location" style={{ display: 'flex', alignItems: 'center', marginTop: '0.25rem', fontSize: '0.875rem', color: '#475569' }}>
                      <MapPin size={14} style={{ marginRight: '0.4rem' }} />
                      {hotelDetails.destination || 'Destination'}
                    </div>
                    <p className="card-desc" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.75rem', lineHeight: '1.4' }}>
                      {`${type} accommodation in ${hotelDetails.destination || 'your destination'}. Max ${currentCapacity} persons per room.`}
                    </p>
                    <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1rem', marginTop: '1rem' }}>
                      <div className="card-amenities">
                        <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{activeAmenitiesCount > 0 ? `${activeAmenitiesCount} Amenities Selected` : 'No amenities'}</span>
                      </div>
                      <div className="card-price" style={{ textAlign: 'right' }}>
                        <span className="price-value" style={{ display: 'block', fontSize: '1.25rem', color: '#16a34a', fontWeight: '700' }}>₱{currentPrice.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2}) || '0'}</span>
                        <span className="price-unit" style={{ fontSize: '0.75rem', color: '#64748b' }}>/ room / night</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
              <aside className="atour-right">
                <HotelPreview
                  hotelDetails={hotelDetails}
                  previewUrl={previewUrl}
                  type={type}
                />
                <div className="atour-actions">
                  <button 
                    type="button" 
                    className="atour-btn atour-btn--cancel" 
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="atour-btn atour-btn--submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Hotel'}
                  </button>
                </div>
              </aside>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default AddHotel;