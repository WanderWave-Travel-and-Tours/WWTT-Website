import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus } from 'lucide-react'; // ✅ Using Plus Icon
import Sidebar from '../sidebar/sidebar';
import ViewHotelModal from './ViewHotelModal';
import HotelPagination from './HotelPagination';
import HotelFilters from './HotelFilters';
import HotelsTable from './HotelsTable';
import { useToast } from '../toast/ToastManager';
import './viewhotel.css'; // ✅ Imported updated CSS

const API_BASE_URL = 'http://localhost:5000';

// Custom Confirmation Modal
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
  if (!isOpen) return null;
  return (
    <div className="arc-confirm-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 11000
    }}>
      <div className="arc-confirm-modal" style={{
        backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
        maxWidth: '400px', width: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
        <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button 
            onClick={onCancel}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0',
              backgroundColor: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            style={{
              padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none',
              backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6',
              color: 'white', cursor: 'pointer', fontWeight: '500'
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const ViewHotels = () => {
  const toast = useToast();
  
  // ✅ STATE: Matches Standard Logic
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // ✅ Toggle Function
  const toggleSidebar = () => setIsSidebarCollapsed(prev => !prev);

  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // --- FILTERS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCity, setFilterCity] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedDate, setSelectedDate] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState(null);

  // Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false, title: "", message: "", onConfirm: () => {}, type: "primary"
  });

  const askConfirmation = (title, message, onConfirm, type = "primary") => {
    setConfirmConfig({
      isOpen: true, title, message,
      onConfirm: () => { onConfirm(); setConfirmConfig(prev => ({ ...prev, isOpen: false })); },
      type
    });
  };

  const getCities = () => {
    const cities = ['ALL'];
    const activeHotels = hotels.filter(h => (h.isArchive || "No") === "No");
    const uniqueCities = [...new Set(activeHotels.map(hotel => hotel.city).filter(Boolean))];
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
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        const initializedData = data.data.map(hotel => {
            const dateObj = hotel.createdAt ? new Date(hotel.createdAt) : null;
            const isValidDate = dateObj && !isNaN(dateObj);

            return {
                ...hotel,
                isArchive: hotel.isArchive || "No",
                filterDate: isValidDate ? dateObj.toLocaleDateString('en-CA') : '',
                displayDateAdded: isValidDate ? dateObj.toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric'
                }) : 'N/A'
            };
        });
        setHotels(initializedData);
        setCurrentPage(1);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        toast.error('Server is taking too long to respond.', 'Timeout');
      } else {
        toast.error('Failed to fetch hotels.', 'Error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleArchive = (hotelId, hotelName) => {
    askConfirmation(
      "Archive Hotel",
      `Are you sure you want to archive "${hotelName}"? This will move it to the Archive page.`,
      () => performArchive(hotelId),
      "danger"
    );
  };

  const performArchive = async (hotelId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hotels/archive/${hotelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Hotel moved to archive successfully!', 'Archived');
        fetchHotels(); 
        if (showDetailModal) setShowDetailModal(false);
      } else {
        toast.error('Error archiving hotel: ' + data.message, 'Failed');
      }
    } catch (error) {
      toast.error('Failed to archive hotel.', 'Server Error');
    }
  };

  const handleEdit = (hotelId) => {
    window.location.href = `/edit-hotel/${hotelId}`;
  };

  const handleViewDetails = (hotel) => {
    setSelectedHotel(hotel);
    setShowDetailModal(true);
  };

  const getImageUrl = (hotel) => {
    let imagePath = null;
    if (hotel.mainImage) {
      imagePath = hotel.mainImage;
    } else if (hotel.images && hotel.images.length > 0) {
      imagePath = typeof hotel.images[0] === 'string' ? hotel.images[0] : hotel.images[0].url;
    }

    if (!imagePath) return null;
    if (imagePath.startsWith('data:') || imagePath.startsWith('blob:') || imagePath.startsWith('http')) return imagePath;

    let cleanPath = imagePath.replace(/\\/g, '/');
    if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
    if (cleanPath.startsWith('uploads/')) return `${API_BASE_URL}/${cleanPath}`;
    
    return `${API_BASE_URL}/uploads/${cleanPath}`;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(price);
  };

  const filteredHotels = hotels.filter(hotel => {
    const isNotArchived = (hotel.isArchive || "No") === "No";
    const matchesSearch = hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          hotel.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCity = filterCity === 'ALL' || hotel.city === filterCity;
    let matchesStatus = true;
    if (filterStatus === 'Active') matchesStatus = hotel.isActive === true;
    else if (filterStatus === 'Inactive') matchesStatus = hotel.isActive === false;
    else if (filterStatus === 'Featured') matchesStatus = hotel.featured === true;

    let matchesDate = true;
    if (selectedDate) matchesDate = hotel.filterDate === selectedDate;

    return isNotArchived && matchesSearch && matchesCity && matchesStatus && matchesDate;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHotels = filteredHotels.slice(indexOfFirstItem, indexOfLastItem);

  const activeHotelsCount = hotels.filter(h => h.isActive && (h.isArchive || "No") === "No").length;
  const featuredHotelsCount = hotels.filter(h => h.featured && (h.isArchive || "No") === "No").length;

  return (
    <div className="vh-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      {/* ✅ LAYOUT FIX: Uses 'expanded' class logic */}
      <main className={`vh-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <div className="vh-container">
          
          {/* ✅ HEADER UI: Matches Standard Design */}
          <header className="vh-header">
            <div className="vh-header-content">
              <h1 className="vh-title">HOTEL LIST</h1>
              <p className="vh-subtitle">
                Managing {filteredHotels.length} properties • {activeHotelsCount} active • {featuredHotelsCount} featured
              </p>
            </div>
            <button className="vh-btn-add" onClick={() => window.location.href='/add-hotel'}>
              <Plus size={18} strokeWidth={3} />
              ADD NEW HOTEL
            </button>
          </header>

          <HotelFilters
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            filterCity={filterCity} setFilterCity={setFilterCity}
            filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            cityOptions={cityOptions} statusOptions={statusOptions}
            selectedDate={selectedDate} setSelectedDate={setSelectedDate}
          />

          {loading ? (
            <div className="vh-loading"><div className="vh-spinner"></div><p>Loading hotels...</p></div>
          ) : filteredHotels.length === 0 ? (
            <div className="vh-empty"><h3>No hotels found</h3></div>
          ) : (
            <>
              {/* ✅ NEW ISOLATED TABLE COMPONENT */}
              <HotelsTable 
                hotels={currentHotels}
                handleViewDetails={handleViewDetails}
                handleArchive={handleArchive}
                getImageUrl={getImageUrl}
                formatPrice={formatPrice}
              />
              
              <HotelPagination
                totalItems={filteredHotels.length}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </main>

      {showDetailModal && selectedHotel && (
        <ViewHotelModal
          hotel={selectedHotel}
          onClose={() => setShowDetailModal(false)}
          onEdit={handleEdit}
          onArchive={(id) => handleArchive(id, selectedHotel.name)}
        />
      )}

      <CustomConfirmModal 
        isOpen={confirmConfig.isOpen} title={confirmConfig.title} message={confirmConfig.message}
        type={confirmConfig.type} onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ViewHotels;