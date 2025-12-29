import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import HotelImageUpload from './HotelImageUpload';
import HotelDetails from './HotelDetails';
import HotelAmenities from './HotelAmenities';
import HotelGallery from './HotelGallery';
import HotelPreview from './HotelPreview';
import { useToast } from '../toast/ToastManager'; 
import './addhotel.css';

const API_BASE_URL = 'http://localhost:5000';

const AddHotel = () => {
  const navigate = useNavigate();
  const toast = useToast(); 
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const [hotelDetails, setHotelDetails] = useState({
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

  const [destinations, setDestinations] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [type, setType] = useState("Budget");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDestinations();
  }, []);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
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
      toast.error('Failed to load destinations', 'Connection Error'); 
    } finally {
      setLoading(false);
    }
  };

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
      toast.error('Please fill in all required fields', 'Validation Error'); 
      window.scrollTo(0, 0);
      return;
    }

    if (isNaN(hotelDetails.price) || Number(hotelDetails.price) <= 0) {
      toast.error('Please enter a valid price', 'Validation Error'); 
      window.scrollTo(0, 0);
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

      // =========================================================
      // 1. KUNIN ANG USER DATA PARA SA ACTIVITY LOGS
      // =========================================================
      const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
      const activeUser = adminData.email || adminData.username || adminData.user || 'Unknown User';
      const activeId = adminData.id || adminData._id || "";
      // =========================================================

      const hotelPayload = {
        name: hotelDetails.name,
        location: hotelDetails.destination,
        city: cityName,
        description: `${type} accommodation in ${hotelDetails.destination}`,
        price: Number(hotelDetails.price),
        maxCapacity: Number(hotelDetails.maxCapacity) || 4,
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
        }],
        // Isama ang user data sa payload
        userEmail: activeUser,
        adminId: activeId
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
        toast.success(`${hotelDetails.name} has been added successfully!`, 'Hotel Added'); 
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
      } else {
        toast.error(data.message || 'Failed to save hotel', 'Save Failed'); 
        window.scrollTo(0, 0);
      }
    } catch (err) {
      console.error('Error saving hotel:', err);
      toast.error('Please check if your backend is running', 'Connection Error'); 
      window.scrollTo(0, 0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/view-hotels');
    }
  };

  return (
    <div className="atour-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
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