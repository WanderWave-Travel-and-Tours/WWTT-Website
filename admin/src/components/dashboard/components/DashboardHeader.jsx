import React, { useState, useEffect } from 'react';
import { Download, Bell, ChevronDown, BarChart2, TrendingUp, Activity, Calendar, Award } from 'lucide-react';
import NotificationDropdown from './NotificationDropdown';
import './DashboardHeader.css';

// Custom Peso Sign Icon Component
const PesoSign = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 6h9a4 4 0 0 1 0 8H5" />
    <line x1="3" y1="10" x2="11" y2="10" />
    <line x1="3" y1="14" x2="11" y2="14" />
    <line x1="5" y1="4" x2="5" y2="20" />
  </svg>
);

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
    { value: 'all', label: 'All Sections', icon: 'BarChart2' },
    { value: 'revenue-analytics', label: 'Revenue Analytics', icon: 'PesoSign' },
    { value: 'financial-performance', label: 'Financial Performance', icon: 'TrendingUp' },
    { value: 'combined-revenue', label: 'Combined Revenue Trends', icon: 'Activity' },
    { value: 'recent-bookings', label: 'Recent Bookings', icon: 'Calendar' },
    { value: 'top-packages', label: 'Top Performing Packages', icon: 'Award' },
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
    if (!selected) return BarChart2;
    
    const iconMap = {
      'BarChart2': BarChart2,
      'PesoSign': PesoSign,
      'TrendingUp': TrendingUp,
      'Activity': Activity,
      'Calendar': Calendar,
      'Award': Award
    };
    
    return iconMap[selected.icon] || BarChart2;
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      'BarChart2': BarChart2,
      'PesoSign': PesoSign,
      'TrendingUp': TrendingUp,
      'Activity': Activity,
      'Calendar': Calendar,
      'Award': Award
    };
    
    return iconMap[iconName] || BarChart2;
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

  const SelectedIcon = getSelectedIcon();

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
            <span className="filter-icon">
              <SelectedIcon size={18} />
            </span>
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
                {sections.map((section) => {
                  const IconComponent = getIconComponent(section.icon);
                  return (
                    <button
                      key={section.value}
                      className={`dash-dropdown-item ${
                        selectedSection === section.value ? 'dash-dropdown-item--active' : ''
                      }`}
                      onClick={() => handleSectionSelect(section.value)}
                    >
                      <span className="dropdown-icon">
                        <IconComponent size={18} />
                      </span>
                      <span className="dropdown-label">{section.label}</span>
                      {selectedSection === section.value && (
                        <span className="dropdown-check">✓</span>
                      )}
                    </button>
                  );
                })}
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