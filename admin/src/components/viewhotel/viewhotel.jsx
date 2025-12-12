import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewhotel.css';
import { Edit, Trash2, MapPin, Star, Plus, Search, Filter, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ViewHotels = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    featured: 0,
    avgRating: 0,
    avgPrice: 0
  });

  useEffect(() => {
    fetchHotels();
    fetchStats();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all hotels without pagination
      const response = await fetch('https://wanderwaveph-backend.onrender.com/api/hotels?limit=100');
      const data = await response.json();

      console.log('Hotels fetched:', data);

      if (data.success && Array.isArray(data.data)) {
        setHotels(data.data);
        setStats(prev => ({ ...prev, total: data.total }));
      } else {
        setError('Invalid response format from server');
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setError('Failed to load hotels: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('https://wanderwaveph-backend.onrender.com/api/hotels/stats');
      const data = await response.json();

      if (data.success) {
        setStats({
          total: data.data.totalHotels,
          featured: data.data.featuredHotels,
          avgRating: data.data.averageRating.toFixed(1),
          avgPrice: Math.round(data.data.averagePrice)
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (hotelId, hotelName) => {
    if (!window.confirm(`Are you sure you want to delete "${hotelName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/hotels/${hotelId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('Hotel deleted successfully!');
        fetchHotels(); // Refresh list
      } else {
        alert('Error deleting hotel: ' + data.message);
      }
    } catch (error) {
      console.error('Error deleting hotel:', error);
      alert('Failed to delete hotel');
    }
  };

  const handleEdit = (hotelId) => {
    navigate(`/edit-hotel/${hotelId}`);
  };

  const handleToggleFeatured = async (hotelId, currentStatus) => {
    try {
      const response = await fetch(`https://wanderwaveph-backend.onrender.com/api/hotels/${hotelId}/featured`, {
        method: 'PATCH'
      });

      const data = await response.json();

      if (data.success) {
        fetchHotels(); // Refresh list
        fetchStats(); // Refresh stats
      } else {
        alert('Error updating featured status: ' + data.message);
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
      alert('Failed to update featured status');
    }
  };

  // Filter hotels based on search and city
  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === '' || hotel.city?.toLowerCase().includes(filterCity.toLowerCase());
    return matchesSearch && matchesCity;
  });

  // Get unique cities for filter
  const uniqueCities = [...new Set(hotels.map(h => h.city).filter(Boolean))];

  return (
    <div className="hotel-page">
      <Sidebar />
      <main className="hotel-main">
        <div className="hotel-container">
          {/* Header */}
          <header className="hotel-header flex-between">
            <div>
              <h1 className="hotel-title">HOTEL LIST</h1>
              <p className="hotel-subtitle">Manage your accommodation partners</p>
            </div>
            <button className="btn-submit flex-center" onClick={() => navigate('/add-hotel')}>
              <Plus size={18} style={{ marginRight: '8px' }} /> Add Hotel
            </button>
          </header>

          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total Hotels</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Featured</div>
              <div className="stat-value">{stats.featured}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Rating</div>
              <div className="stat-value">
                <Star size={18} fill="#f59e0b" color="#f59e0b" style={{ display: 'inline', marginRight: '4px' }} />
                {stats.avgRating}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Price</div>
              <div className="stat-value">₱{stats.avgPrice.toLocaleString()}</div>
            </div>
          </div>

          {/* Filters */}
          <div className="filters-section">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search hotels by name or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <Filter size={18} />
              <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)}>
                <option value="">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <button className="btn-refresh" onClick={fetchHotels} disabled={loading}>
              <RefreshCw size={18} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="error-message">
              {error}
              <button onClick={fetchHotels} style={{ marginLeft: '1rem' }}>Retry</button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading hotels...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredHotels.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">🏨</div>
              <h3>No Hotels Found</h3>
              <p>
                {searchTerm || filterCity
                  ? 'Try adjusting your filters'
                  : 'Start by adding your first hotel'}
              </p>
              {!searchTerm && !filterCity && (
                <button className="btn-submit" onClick={() => navigate('/add-hotel')}>
                  <Plus size={18} /> Add Your First Hotel
                </button>
              )}
            </div>
          )}

          {/* Hotels Table */}
          {!loading && !error && filteredHotels.length > 0 && (
            <div className="hotel-table-container">
              <table className="hotel-table">
                <thead>
                  <tr>
                    <th>Hotel Name</th>
                    <th>Location</th>
                    <th>Max Capacity</th>
                    <th>Amenities</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHotels.map((hotel) => {
                    const amenitiesCount = Object.values(hotel.amenities || {}).filter(Boolean).length;
                    
                    // Check if mainImage is a blob URL or base64
                    const imageUrl = hotel.mainImage && hotel.mainImage.startsWith('blob:') 
                      ? hotel.mainImage 
                      : hotel.mainImage && hotel.mainImage.startsWith('data:image')
                      ? hotel.mainImage
                      : hotel.images && hotel.images.length > 0 && hotel.images[0].url
                      ? hotel.images[0].url
                      : null;
                    
                    return (
                      <tr key={hotel._id}>
                        <td>
                          <div className="hotel-cell-name">
                            {imageUrl ? (
                              <img 
                                src={imageUrl} 
                                alt={hotel.name}
                                className="hotel-thumb-img"
                                onError={(e) => {
                                  console.log('Image failed to load:', imageUrl);
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="hotel-thumb" 
                              style={{ display: imageUrl ? 'none' : 'flex' }}
                            >
                              {hotel.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-bold">{hotel.name}</span>
                              {hotel.featured && (
                                <span className="badge badge-featured">Featured</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="text-muted">
                          <div className="flex-align">
                            <MapPin size={14} style={{ marginRight: '4px' }} />
                            {hotel.location || hotel.city}
                          </div>
                        </td>
                        <td className="text-center">
                          {hotel.maxCapacity || 4} persons
                        </td>
                        <td className="text-center">
                          <span className="amenities-badge">
                            {amenitiesCount} amenities
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${hotel.isActive ? 'badge-active' : 'badge-inactive'}`}>
                            {hotel.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-group">
                            <button 
                              className="action-btn edit" 
                              onClick={() => handleEdit(hotel._id)}
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className={`action-btn ${hotel.featured ? 'featured' : 'star'}`}
                              onClick={() => handleToggleFeatured(hotel._id, hotel.featured)}
                              title={hotel.featured ? 'Unfeature' : 'Feature'}
                            >
                              <Star size={16} fill={hotel.featured ? "#f59e0b" : "none"} />
                            </button>
                            <button 
                              className="action-btn delete" 
                              onClick={() => handleDelete(hotel._id, hotel.name)}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Results Count */}
          {!loading && !error && filteredHotels.length > 0 && (
            <div className="results-footer">
              Showing {filteredHotels.length} of {hotels.length} hotels
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewHotels;