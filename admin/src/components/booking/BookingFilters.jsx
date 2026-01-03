import React from 'react';
import { Search, Wallet } from 'lucide-react';
import './BookingFilters.css'; 

const BookingFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  statusOptions, 
  getFilterClassName,
  paymentFilter,
  setPaymentFilter,
  paymentOptions,
  getPaymentFilterClassName
}) => {
  return (
    <div className="bkm-filter-card">
      <div className="bkm-filter-wrapper">
        
        {/* ORDER 1: Branding Label */}
        <div className="bkm-brand-label">
            BOOKING <span>FILTERS</span>
        </div>
        
        {/* ORDER 2: Status Filter Buttons */}
        <div className="filter-buttons">
          {statusOptions.map(status => (
            <button
              key={status}
              className={`filter-btn ${getFilterClassName(status)}`} 
              onClick={() => setFilterStatus(status)}
            >
              {status === 'ALL' ? 'All Bookings' : status.toLowerCase().replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* ✅ NEW: Payment Filter Buttons */}
        <div className="payment-filter-section">
          <div className="payment-filter-label">
            <Wallet size={16} />
            <span>Payment Status:</span>
          </div>
          <div className="filter-buttons">
            {paymentOptions.map(option => (
              <button
                key={option.value}
                className={`filter-btn filter-btn-payment ${getPaymentFilterClassName(option.value)}`}
                onClick={() => setPaymentFilter(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* ORDER 3: Search Box */}
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