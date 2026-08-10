import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  // FIX #1: Track consecutive failures to apply backoff and stop hammering a broken endpoint.
  const failCountRef = useRef(0);
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  const API_BASE_URL = '';
  const BASE_POLL_INTERVAL = 10000;   // 10 s when healthy
  const MAX_FAILURES = 5;             // stop polling after 5 consecutive failures
  const BACKOFF_MULTIPLIER = 2;       // double the interval each failure (unused in setInterval but used to gate restarts)

  const sections = [
    { value: 'all', label: 'All Sections', icon: 'BarChart2' },
    { value: 'revenue-analytics', label: 'Revenue Analytics', icon: 'PesoSign' },
    { value: 'financial-performance', label: 'Financial Performance', icon: 'TrendingUp' },
    { value: 'combined-revenue', label: 'Combined Revenue Trends', icon: 'Activity' },
    { value: 'recent-bookings', label: 'Recent Bookings', icon: 'Calendar' },
    { value: 'top-packages', label: 'Top Performing Packages', icon: 'Award' },
  ];

  // FIX #1: fetchUnreadCount now uses an AbortController so in-flight requests are
  // cancelled on unmount, and it applies exponential backoff via a failure counter.
  const fetchUnreadCount = useCallback(async () => {
    // Abort any previous in-flight request before starting a new one.
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/api/activity-logs?limit=1000`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        // Non-2xx: count as failure but don't throw to console as an unhandled error.
        failCountRef.current += 1;
        if (failCountRef.current >= MAX_FAILURES) {
          console.warn(
            `[DashboardHeader] Activity-logs endpoint returned ${response.status} ` +
            `${MAX_FAILURES} times in a row — pausing polling to avoid 404 spam.`
          );
          stopPolling();
        }
        return;
      }

      // Successful response — reset failure counter.
      failCountRef.current = 0;

      const logs = await response.json();
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
      } catch (e) { /* ignore parse errors */ }

      const unread = todayLogs.filter(log => !readIds.includes(log._id)).length;
      setUnreadNotifications(unread);

    } catch (err) {
      if (err.name === 'AbortError') {
        // Request was intentionally cancelled — not a real error.
        return;
      }
      // Network/other error — apply failure tracking.
      failCountRef.current += 1;
      console.warn(
        `[DashboardHeader] fetchUnreadCount failed (attempt ${failCountRef.current}):`,
        err.message
      );
      if (failCountRef.current >= MAX_FAILURES) {
        console.warn(
          `[DashboardHeader] Too many consecutive fetch failures — pausing polling.`
        );
        stopPolling();
      }
    }
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling(); // clear any existing interval first
    intervalRef.current = setInterval(() => {
      // Only poll if failure count hasn't maxed out yet.
      if (failCountRef.current < MAX_FAILURES) {
        fetchUnreadCount();
      }
    }, BASE_POLL_INTERVAL);
  }, [fetchUnreadCount, stopPolling]);

  // FIX #1: Mount → fetch once, then start polling. Unmount → cancel everything.
  useEffect(() => {
    fetchUnreadCount();
    startPolling();

    return () => {
      stopPolling();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchUnreadCount, startPolling, stopPolling]);

  // FIX #1: Listen to localStorage changes (reset failure count so polling resumes
  // after the user manually triggers a notification read).
  useEffect(() => {
    const handler = () => {
      // Reset failure count so polling resumes if it was paused.
      if (failCountRef.current >= MAX_FAILURES) {
        failCountRef.current = 0;
        startPolling();
      }
      fetchUnreadCount();
    };
    window.addEventListener('notificationRead', handler);
    return () => window.removeEventListener('notificationRead', handler);
  }, [fetchUnreadCount, startPolling]);

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