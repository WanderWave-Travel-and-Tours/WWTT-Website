import React from 'react';
import { Search, RefreshCw, MessageSquare } from 'lucide-react';
import './FeedbackFilters.css';

const FeedbackFilters = ({ 
  searchQuery, 
  setSearchQuery, 
  filterCategory,
  setFilterCategory,
  filterRating,
  setFilterRating,
  onRefresh 
}) => {
  return (
    <div className="fb-filter-card">
      <div className="fb-filter-wrapper">
        
        {/* Branding Label */}
        <div className="fb-brand-label">
          <MessageSquare size={20} style={{ color: '#64748b' }} />
          FEEDBACK <span>FILTERS</span>
        </div>
        
        {/* Filter Dropdowns */}
        <div className="fb-filter-dropdowns">
          <select 
            className="fb-filter-select"
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="all">All Categories</option>
            <option value="bug">Bug Reports</option>
            <option value="suggestion">Suggestions</option>
            <option value="general">General</option>
          </select>

          <select 
            className="fb-filter-select"
            value={filterRating} 
            onChange={(e) => setFilterRating(e.target.value)}
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
        </div>
        
        {/* Search Box */}
        <div className="fb-search-box">
          <Search size={18} className="fb-search-icon" />
          <input
            type="text"
            placeholder="Search feedback..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Refresh Button */}
        <button className="fb-refresh-btn" onClick={onRefresh}>
          <RefreshCw size={16} />
          Refresh
        </button>
        
      </div>
    </div>
  );
};

export default FeedbackFilters;