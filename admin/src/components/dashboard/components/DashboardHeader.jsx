import React, { useState, useEffect } from 'react';
import { Download, Bell, ChevronDown } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import './DashboardHeader.css';

const DashboardHeader = ({ 
  onSectionFilter,
  selectedSection = 'all',
  onDownloadPDF,
  onViewActivityLogs
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com';

  const sections = [
    { value: 'all', label: 'All Sections', icon: '📊' },
    { value: 'revenue-analytics', label: 'Revenue Analytics', icon: '💰' },
    { value: 'financial-performance', label: 'Financial Performance', icon: '💼' },
    { value: 'combined-revenue', label: 'Combined Revenue Trends', icon: '📉' },
    { value: 'recent-bookings', label: 'Recent Bookings', icon: '🎫' },
    { value: 'top-packages', label: 'Top Performing Packages', icon: '🏆' },
  ];

  // Fetch unread count
  const fetchUnreadCount = () => {
    fetch(`${API_BASE_URL}/api/activity-logs?limit=1000`)
      .then(response => response.json())
      .then(logs => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayLogs = logs.filter(log => {
          const logDate = new Date(log.createdAt);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime();
        });
        
        let readIds = [];
        try {
          const stored = localStorage.getItem('readNotifications');
          if (stored) {
            const data = JSON.parse(stored);
            if (data.date === new Date().toDateString()) {
              readIds = data.ids || [];
            }
          }
        } catch (e) {}
        
        const unread = todayLogs.filter(log => !readIds.includes(log._id)).length;
        setUnreadNotifications(unread);
      })
      .catch(error => console.error('Error fetching unread count:', error));
  };

  // Fetch on mount and set polling
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 10000);
    return () => clearInterval(interval);
  }, []);

  // Listen to localStorage changes
  useEffect(() => {
    const handler = () => fetchUnreadCount();
    window.addEventListener('notificationRead', handler);
    return () => window.removeEventListener('notificationRead', handler);
  }, []);

  const handleSectionSelect = (value) => {
    if (onSectionFilter) {
      onSectionFilter(value);
    }
    setIsDropdownOpen(false);
  };

  const getSelectedLabel = () => {
    const selected = sections.find(s => s.value === selectedSection);
    return selected ? selected.label : 'All Sections';
  };

  const getSelectedIcon = () => {
    const selected = sections.find(s => s.value === selectedSection);
    return selected ? selected.icon : '📊';
  };

  const handleNotificationClick = () => {
    setIsNotificationOpen(!isNotificationOpen);
  };

  const handleViewAllLogs = () => {
    setIsNotificationOpen(false);
    if (onViewActivityLogs) {
      onViewActivityLogs();
    } else {
      window.location.href = '/activity-logs';
    }
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
        <div className="dash-filter-container">
          <button 
            className="dash-filter-btn"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            title="Filter Dashboard Sections"
          >
            <span className="filter-icon">{getSelectedIcon()}</span>
            <span className="filter-label">{getSelectedLabel()}</span>
            <ChevronDown 
              size={16} 
              className={`filter-chevron ${isDropdownOpen ? 'filter-chevron--open' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <>
              <div 
                className="dash-dropdown-overlay" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="dash-dropdown-menu">
                {sections.map((section) => (
                  <button
                    key={section.value}
                    className={`dash-dropdown-item ${
                      selectedSection === section.value ? 'dash-dropdown-item--active' : ''
                    }`}
                    onClick={() => handleSectionSelect(section.value)}
                  >
                    <span className="dropdown-icon">{section.icon}</span>
                    <span className="dropdown-label">{section.label}</span>
                    {selectedSection === section.value && (
                      <span className="dropdown-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button 
          className="dash-icon-btn" 
          onClick={onDownloadPDF}
          title="Download Report"
        >
          <Download size={20} />
        </button>

        <div className="dash-notification-container">
          <button 
            className="dash-icon-btn dash-notification-btn" 
            onClick={handleNotificationClick}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadNotifications > 0 && (
              <span className="dash-notification-badge">{unreadNotifications}</span>
            )}
          </button>

          <NotificationDropdown
            isOpen={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            onViewAll={handleViewAllLogs}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;