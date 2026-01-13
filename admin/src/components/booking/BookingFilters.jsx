import React from 'react';
import { Search, Filter, ChevronDown, Calendar } from 'lucide-react';
import './BookingFilters.css';

const BookingFilters = ({ 
  searchTerm, 
  setSearchTerm, 
  filterStatus, 
  setFilterStatus, 
  statusOptions, 
  paymentFilter,
  setPaymentFilter,
  paymentOptions,
  dateStart,
  setDateStart,
  dateEnd,
  setDateEnd
}) => {
  return (
    <div className="bkm-filter-card">
      <div className="bkm-filter-wrapper">
        
        {/* LEFT: Branding */}
        <div className="bkm-brand-section">
            <div className="bkm-brand-icon">
                <Filter size={18} strokeWidth={2.5} />
            </div>
            <div className="bkm-brand-label">
                BOOKING <span>FILTERS</span>
            </div>
        </div>
        
        <div className="bkm-controls-group">
            {/* MIDDLE: Filter Dropdowns & Date */}
            <div className="bkm-filters-row">
                
                {/* Status Filter */}
                <div className="bkm-filter-item">
                    <label>Status:</label>
                    <div className="bkm-select-wrapper">
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bkm-select"
                        >
                            {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                    {status === 'ALL' ? 'ALL BOOKINGS' : status.toUpperCase().replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="bkm-select-icon" size={14} />
                    </div>
                </div>

                {/* Payment Filter */}
                <div className="bkm-filter-item">
                    <label>Payment:</label>
                    <div className="bkm-select-wrapper">
                        <select 
                            value={paymentFilter} 
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="bkm-select"
                        >
                            {paymentOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label.toUpperCase()}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="bkm-select-icon" size={14} />
                    </div>
                </div>

                {/* ✅ NEW: Date Range Filter Inputs */}
                <div className="bkm-filter-item">
                    <label>Date:</label>
                    <div className="bkm-date-group">
                        <input 
                            type="date" 
                            className="bkm-date-input"
                            value={dateStart}
                            onChange={(e) => setDateStart(e.target.value)}
                            title="Start Date"
                        />
                        <span className="bkm-date-separator">-</span>
                        <input 
                            type="date" 
                            className="bkm-date-input"
                            value={dateEnd}
                            onChange={(e) => setDateEnd(e.target.value)}
                            title="End Date"
                        />
                    </div>
                </div>

            </div>

            {/* RIGHT: Search Box */}
            <div className="bkm-search-box">
                <Search size={16} className="bkm-search-icon" /> 
                <input
                    type="text"
                    className="bkm-search-input"
                    placeholder="Search by name, ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>

      </div>
    </div>
  );
};

export default BookingFilters;