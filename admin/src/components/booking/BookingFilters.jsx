import React from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';
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
  createdByFilter,
  setCreatedByFilter
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
            {/* MIDDLE: Filter Dropdowns */}
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

                {/* Created By Filter */}
                <div className="bkm-filter-item">
                    <label>Created By:</label>
                    <div className="bkm-select-wrapper">
                        <select 
                            value={createdByFilter} 
                            onChange={(e) => setCreatedByFilter(e.target.value)}
                            className="bkm-select"
                        >
                            <option value="ALL">ALL</option>
                            <option value="sales">Sales</option>
                            <option value="user">User</option>
                        </select>
                        <ChevronDown className="bkm-select-icon" size={14} />
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