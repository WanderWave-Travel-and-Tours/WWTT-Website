import React from 'react';
import { Search } from 'lucide-react';
import './BookingFilters.css'; 

const BookingFilters = ({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, statusOptions, getFilterClassName }) => {
  return (
    <div className="bkm-filter-card">
      <div className="bkm-filter-wrapper">
        
        {/* ORDER 1: Branding Label (BOOKING FILTERS) */}
        <div className="bkm-brand-label">
            BOOKING <span>FILTERS</span>
        </div>
        
        {/* ORDER 2: Filter Buttons (Left side) */}
        <div className="filter-buttons">
          {statusOptions.map(status => (
            <button
              key={status}
              // CRUCIAL: getFilterClassName returns 'active-gradient' if active
              className={`filter-btn ${getFilterClassName(status)}`} 
              onClick={() => setFilterStatus(status)}
            >
              {/* Lowercase, capitalize for clean look */}
              {status === 'ALL' ? 'All Bookings' : status.toLowerCase().replace('_', ' ')}
            </button>
          ))}
        </div>
        
        {/* ORDER 3: Search Box (Right side) */}
        <div className="search-box">
          <Search size={18} className="search-icon" /> 
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, ID, or package..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        

      </div>
    </div>
  );
};

export default BookingFilters;