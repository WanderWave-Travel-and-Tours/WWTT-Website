import React, { useState, useEffect } from 'react';
import { Archive, Eye, MapPin, Users, Home, CheckCircle } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import ViewHotelModal from './ViewHotelModal';
import HotelPagination from './HotelPagination';
import HotelFilters from './HotelFilters';
import './viewhotel.css';

const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com';

const ViewHotels = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  // Get unique cities from hotels
  const getCities = () => {
    const cities = ['ALL'];
    const uniqueCities = [...new Set(hotels.map(hotel => hotel.city).filter(Boolean))];
    return [...cities, ...uniqueCities.sort()];
  };

  const cityOptions = getCities();
  const statusOptions = ['ALL', 'Active', 'Inactive', 'Featured'];

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${API_BASE_URL}/api/hotels?limit=100`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setHotels(data.data);
        setCurrentPage(1);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('Request timeout - server too slow');
        alert('Server is taking too long to respond. Please check your connection.');
      } else {
        console.error('Error fetching hotels:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleDelete = async (hotelId, hotelName) => {
    if (!window.confirm(`Are you sure you want to archive "${hotelName}"?\n\nThis will mark the hotel as inactive.`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/${hotelId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Hotel archived successfully!');
        fetchHotels();
      } else {
        alert('Error archiving hotel: ' + data.message);
      }
    } catch (error) {
      console.error('Error archiving hotel:', error);
      alert('Failed to archive hotel: ' + error.message);
    }
  };

  const handleEdit = (hotelId) => {
    window.location.href = `/edit-hotel/${hotelId}`;
  };

  const handleViewDetails = (hotel) => {
    setSelectedHotel(hotel);
    setShowDetailModal(true);
  };

  // 👇 UPDATED: Smart Image URL Logic (Matches Modal Logic)
  const getImageUrl = (hotel) => {
    let imagePath = null;

    // 1. Priority: Main Image
    if (hotel.mainImage) {
      imagePath = hotel.mainImage;
    } 
    // 2. Fallback: First Gallery Image
    else if (hotel.images && hotel.images.length > 0) {
      // Handle if images[0] is object or string
      imagePath = typeof hotel.images[0] === 'string' ? hotel.images[0] : hotel.images[0].url;
    }

    if (!imagePath) return null;

    // 3. If it's already a full URL or Base64, return immediately
    if (imagePath.startsWith('data:') || imagePath.startsWith('blob:') || imagePath.startsWith('http')) {
      return imagePath;
    }

    // 4. Fix formatting (Windows backslashes to forward slashes)
    let cleanPath = imagePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);

    // 5. Build Full URL
    // Prevent double 'uploads/' if the path already has it
    if (cleanPath.startsWith('uploads/')) {
        return `${API_BASE_URL}/${cleanPath}`;
    }
    
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  // Filter and search logic
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.city?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = filterCity === 'ALL' || hotel.city === filterCity;
    
    let matchesStatus = true;
    if (filterStatus === 'Active') {
      matchesStatus = hotel.isActive === true;
    } else if (filterStatus === 'Inactive') {
      matchesStatus = hotel.isActive === false;
    } else if (filterStatus === 'Featured') {
      matchesStatus = hotel.featured === true;
    }
    
    return matchesSearch && matchesCity && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirstItem, indexOfLastItem);

  const activeHotels = hotels.filter(h => h.isActive).length;
  const featuredHotels = hotels.filter(h => h.featured).length;

  const mainClass = `vh-main ${isSidebarCollapsed ? 'vh-main--collapsed' : ''}`;

  return (
    <div className="vh-page">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      <main className={mainClass}>
        <div className="vh-container">
          <header className="vh-header">
            <div className="vh-header-content">
              <h1 className="vh-title">HOTEL LIST</h1>
              <p className="vh-subtitle">
                Managing {hotels.length} properties • {activeHotels} active • {featuredHotels} featured
              </p>
            </div>
            <button className="vh-btn vh-btn--add" onClick={() => window.location.href='/add-hotel'}>
              + Add New Hotel
            </button>
          </header>

          <HotelFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterCity={filterCity}
            setFilterCity={setFilterCity}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            cityOptions={cityOptions}
            statusOptions={statusOptions}
          />

          {loading ? (
            <div className="vh-loading">
              <div className="vh-spinner"></div>
              <p>Loading hotels from database...</p>
            </div>
          ) : hotels.length === 0 ? (
            <div className="vh-empty">
              <span className="vh-empty-icon">🏨</span>
              <h3>No hotels yet</h3>
              <p>Start by adding your first hotel</p>
            </div>
          ) : filteredHotels.length === 0 ? (
            <div className="vh-empty">
              <span className="vh-empty-icon">🔍</span>
              <h3>No hotels found</h3>
              <p>Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="vh-table-wrapper">
              <table className="vh-table">
                <thead>
                  <tr>
                    <th>PREVIEW</th>
                    <th>HOTEL NAME</th>
                    <th>LOCATION</th>
                    <th>CAPACITY</th>
                    <th>PRICE</th>
                    <th>AMENITIES</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {currentHotels.map((hotel) => {
                    const amenitiesCount = hotel.amenities 
                      ? Object.values(hotel.amenities).filter(Boolean).length 
                      : 0;
                    
                    // Use the fixed getImageUrl function here
                    const imageUrl = getImageUrl(hotel);
                    
                    return (
                      <tr key={hotel._id}>
                        <td>
                          <div className="vh-image-preview">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={hotel.name}
                                onError={(e) => { 
                                    e.target.onerror = null; // Prevent infinite loop
                                    e.target.src = 'https://via.placeholder.com/400x250?text=No+Image'; 
                                }}
                              />
                            ) : (
                              <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: '#f1f5f9',
                                color: '#94a3b8'
                              }}>
                                <Home size={20} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="vh-hotel-name">{hotel.name}</span>
                          {hotel.featured && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '10px',
                              padding: '2px 8px',
                              background: '#fef3c7',
                              color: '#d97706',
                              borderRadius: '6px',
                              fontWeight: '700',
                              textTransform: 'uppercase'
                            }}>
                              ⭐ Featured
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="vh-location-cell">
                            <MapPin size={14} />
                            <span>{hotel.location || hotel.city || 'N/A'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="vh-capacity-badge">
                            <Users size={12} />
                            {hotel.maxCapacity || 4} Pax
                          </span>
                        </td>
                        <td>
                          <span className="vh-price-value">{formatPrice(hotel.price || 0)}</span>
                        </td>
                        <td>
                          <span className="vh-amenities-badge">
                            <CheckCircle size={12} />
                            {amenitiesCount} Amenities
                          </span>
                        </td>
                        <td>
                          <span className={`vh-status vh-status--${hotel.isActive ? 'active' : 'inactive'}`}>
                            <Home size={12} />
                            {hotel.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="vh-actions">
                            <button 
                              className="vh-action-btn vh-action-btn--view"
                              onClick={() => handleViewDetails(hotel)}
                              title="View Details"
                            >
                              <Eye size={16} />
                              <span>View</span>
                            </button>
                            <button 
                              className="vh-action-btn vh-action-btn--delete"
                              onClick={() => handleDelete(hotel._id, hotel.name)}
                              title="Archive"
                            >
                              <Archive size={16} />
                              <span>Archive</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              <HotelPagination
                totalItems={filteredHotels.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </main>

      {showDetailModal && selectedHotel && (
        <ViewHotelModal
          hotel={selectedHotel}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEdit}
        />
      )}
    </div>
  );
};

export default ViewHotels;