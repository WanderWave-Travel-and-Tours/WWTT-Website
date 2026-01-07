import React, { useState } from 'react';
import { Search, Download, Bell, X } from 'lucide-react';
import './DashboardHeader.css';

const DashboardHeader = ({ 
  onSearch, 
  searchTerm = '',
  onDownloadPDF,  // ✅ KEEP existing download function
  notificationCount = 0  // ✅ KEEP existing notification count
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen);
    if (isSearchOpen) {
      setLocalSearchTerm('');
      if (onSearch) onSearch('');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchTerm(value);
    if (onSearch) onSearch(value);
  };

  const handleClearSearch = () => {
    setLocalSearchTerm('');
    if (onSearch) onSearch('');
  };

  return (
    <div className="dash-header">
      <div className="dash-header-left">
        <div className="dash-title-section">
          <h1 className="dash-title">DASHBOARD</h1>
          <p className="dash-subtitle">Welcome back, Admin! Here's what's happening today.</p>
        </div>
      </div>

      <div className="dash-header-right">
        {/* ✅ NEW: Search Container */}
        <div className={`dash-search-container ${isSearchOpen ? 'dash-search-open' : ''}`}>
          {isSearchOpen && (
            <div className="dash-search-input-wrapper">
              <Search size={18} className="dash-search-input-icon" />
              <input
                type="text"
                className="dash-search-input"
                placeholder="Search bookings, packages, customers..."
                value={localSearchTerm}
                onChange={handleSearchChange}
                autoFocus
              />
              {localSearchTerm && (
                <button 
                  className="dash-search-clear"
                  onClick={handleClearSearch}
                  title="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
          
          <button 
            className="dash-icon-btn dash-search-toggle"
            onClick={handleSearchToggle}
            title={isSearchOpen ? "Close search" : "Search"}
          >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        </div>

        {/* ✅ EXISTING: Download PDF Button - HINDI KINALALAGAY! */}
        <button 
          className="dash-icon-btn" 
          onClick={onDownloadPDF}
          title="Download Report"
        >
          <Download size={20} />
        </button>

        {/* ✅ EXISTING: Notifications - HINDI KINALALAGAY! */}
        <button className="dash-icon-btn dash-notification-btn" title="Notifications">
          <Bell size={20} />
          {notificationCount > 0 && (
            <span className="dash-notification-badge">{notificationCount}</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default DashboardHeader;