import React from 'react';
import { Search, RefreshCw, Package } from 'lucide-react';
import './Sellerratefilters.css';

const SellerRateFilters = ({ searchQuery, setSearchQuery, onRefresh }) => {
  return (
    <div className="sr-filter-card">
      <div className="sr-filter-wrapper">
        
        {/* ORDER 1: Branding Label (LEFT CORNER) */}
        <div className="sr-brand-label">
          <Package size={20} style={{ color: '#64748b' }} />
          SUPPLIER RATE <span>FILTERS</span>
        </div>
        
        {/* ORDER 2: SEARCH BOX - Pushed to the right */}
        <div className="sr-search-box">
          <Search size={18} className="sr-search-icon" />
          <input
            type="text"
            placeholder="Search destination, activity, supplier, or pax..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* ORDER 3: Refresh Button */}
        <button className="sr-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
        
      </div>
    </div>
  );
};

export default SellerRateFilters;