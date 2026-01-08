import React, { useState, useEffect, useRef } from 'react';
import { X, Activity, CheckCircle, AlertCircle, Info, Clock, Eye } from 'lucide-react';
import './NotificationDropdown.css';

const NotificationDropdown = ({ 
  isOpen, 
  onClose, 
  onViewAll
}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const dropdownRef = useRef(null);
  const audioRef = useRef(null);

  const API_BASE_URL = 'http://localhost:5000';

  const getReadNotifications = () => {
    const stored = localStorage.getItem('readNotifications');
    if (!stored) return [];
    
    const data = JSON.parse(stored);
    const today = new Date().toDateString();
    
    if (data.date !== today) {
      localStorage.setItem('readNotifications', JSON.stringify({ date: today, ids: [] }));
      return [];
    }
    
    return data.ids || [];
  };

  const saveReadNotifications = (readIds) => {
    const today = new Date().toDateString();
    localStorage.setItem('readNotifications', JSON.stringify({
      date: today,
      ids: readIds
    }));
    
    // Dispatch event to notify DashboardHeader
    window.dispatchEvent(new Event('notificationRead'));
  };

  useEffect(() => {
    if (isOpen) {
      fetchTodayLogs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        fetchTodayLogs(true);
      }, 15000);

      return () => clearInterval(interval);
    }
  }, [isOpen, lastNotificationId]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchTodayLogs = async (checkForNew = false) => {
    setLoading(!checkForNew);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/activity-logs?limit=1000`);
      
      if (response.ok) {
        const logs = await response.json();
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayLogs = logs.filter(log => {
          const logDate = new Date(log.createdAt);
          logDate.setHours(0, 0, 0, 0);
          return logDate.getTime() === today.getTime();
        });

        const readIds = getReadNotifications();
        
        const notificationsData = todayLogs.map(log => ({
          id: log._id,
          action: log.action,
          module: log.module,
          user: log.user,
          description: log.description,
          severity: log.severity,
          timestamp: log.createdAt,
          isRead: readIds.includes(log._id)
        }));

        notificationsData.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        if (checkForNew && notificationsData.length > 0) {
          const latestId = notificationsData[0].id;
          
          if (lastNotificationId && latestId !== lastNotificationId) {
            playNotificationSound();
          }
          
          setLastNotificationId(latestId);
        } else if (!checkForNew && notificationsData.length > 0) {
          setLastNotificationId(notificationsData[0].id);
        }

        setNotifications(notificationsData);
        
        const unread = notificationsData.filter(n => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2S57OuhUBELTKXh8bllHAU2jdXvz38oBSt+zPHajzsLGGO268qBMQYncsXu25Q9CxNYruXwuW4fBTCFz/DOeiwGKHnJ796OOwoVYrXs6qVUEgpKouLztWkdBjiP1fHPfywGLHzL8N+NOwsXYrXr66RVFApKoOLyr2wgBTB+zPHajToLGGC37O2mVBEKSqDh8LNpHwU3jtXwz34sBSt7y/DejjwLFmK07OukVRIKSqHi87RoHAU3jtXxz38rBSt7yu/djTwLFmCz7OylVRIJSZ/h8bNoHwU2jtXwz38rBSt7yu/fjjsKFV+z7OylUxIJSJ7g8LJoHwU1jdTwzn8rBSp6ye7dizzLFV+y6+qjVBEJR53f8bFnHwU0jNPwzX8qBSl6yO7cjTsKFFyx6+uiUxEJRp3f8bFnHwUzi9Pwzn4qBSh5x+7cizwLFFux6uuhUhAJRZzf8LBnHgUyi9Lvzn4qBSh4x+3cizwKE1qw6eqgUhAJRJvf8K9mHgUxi9Hvzn4pBSh4xu3bjDsKElqv6OqfUg8JQ5rf8K9lHgUxitHvzX4pBSd4xu3bjDsKE1mv5+meURAJQpne76xlHgUwitDuzX4oBSZ3xe3aizwKEliu5umdUQ8JQpje76xkHgUvic/tzn4oBSZ2xOzaizsKEVet5eidUBEJQZfd76xkHwUui9DuzH8oBSV2w+zZizsJEFWs5OibUA8JQJbf8K1lHgUticzvzH4nBSV1wuzZijsJD1Wr4+eaUA8JQJXd8K1kHgUricvvzH0nBCR0wezYiToJEFSq4uiaUA4JPpTd76xkHgUqiMvvy34mBCN0wOzYiDoIDlOp4uiZUA4JO5Pc76tjHgUphsrvyn0mBCN0wOzXhzsIDlKo4eaZUA4IOZLb76xjHgUohsrvyn0mBCJzv+vYhzsIDlGn4OaYUA4IOZDY8KpiHgUoisntyn0lBCFzv+vXhzoIDlCm3+aYTw4JN5HY76xhHgQpicntyn0lBCByvuvXhjoIDk+l3+aXUQ0INZHY76xhHgQoh8nsyn0lAx9yv+vWhjkIDU6k3+aXTw0IN5DX76xhHQQnh8jtyn0lAx9xv+rWhTkIDU2j3uWXTwwIN5HX76tgHQQnh8ftyXwlAx9wvurWhjkIDUyj3eWWTwwHNpHW7qpgHQQnh8ftyXwkAx5wvurWhjkHDUqj3OSWTwwHNY/W7qlgHQMm');
        audioRef.current.volume = 0.5;
      }
      
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    } catch (error) {
      console.log('Error playing notification sound:', error);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle size={16} className="notif-icon notif-icon-success" />;
      case 'WARNING':
        return <AlertCircle size={16} className="notif-icon notif-icon-warning" />;
      case 'ERROR':
        return <AlertCircle size={16} className="notif-icon notif-icon-error" />;
      default:
        return <Info size={16} className="notif-icon notif-icon-info" />;
    }
  };

  const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE':
        return '#10b981';
      case 'UPDATE':
        return '#f59e0b';
      case 'DELETE':
        return '#ef4444';
      case 'LOGIN':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
    
    const readIds = getReadNotifications();
    if (!readIds.includes(id)) {
      readIds.push(id);
      saveReadNotifications(readIds);
    }
    
    const newUnread = notifications.filter(n => 
      n.id === id ? false : !n.isRead
    ).length;
    setUnreadCount(newUnread);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    
    const allIds = notifications.map(n => n.id);
    saveReadNotifications(allIds);
    
    setUnreadCount(0);
  };

  if (!isOpen) return null;

  return (
    <div className="notif-dropdown" ref={dropdownRef}>
      <div className="notif-header">
        <div className="notif-header-left">
          <h3 className="notif-title">Notifications</h3>
          {unreadCount > 0 && (
            <span className="notif-unread-badge">{unreadCount}</span>
          )}
        </div>
        <button className="notif-close-btn" onClick={onClose}>
          <X size={18} />
        </button>
      </div>

      {notifications.length > 0 && (
        <div className="notif-actions">
          {unreadCount > 0 && (
            <button className="notif-action-btn" onClick={markAllAsRead}>
              <CheckCircle size={14} />
              Mark all as read
            </button>
          )}
          <button className="notif-action-btn" onClick={onViewAll}>
            <Eye size={14} />
            View all logs
          </button>
        </div>
      )}

      <div className="notif-list">
        {loading ? (
          <div className="notif-loading">
            <div className="notif-spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">
            <Activity size={48} className="notif-empty-icon" />
            <p className="notif-empty-text">No notifications today</p>
            <span className="notif-empty-subtext">You're all caught up!</span>
          </div>
        ) : (
          <>
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`notif-item ${notif.isRead ? 'notif-item-read' : 'notif-item-unread'}`}
                onClick={() => !notif.isRead && markAsRead(notif.id)}
              >
                <div className="notif-item-indicator"></div>
                
                <div className="notif-item-icon">
                  {getSeverityIcon(notif.severity)}
                </div>

                <div className="notif-item-content">
                  <div className="notif-item-header">
                    <span
                      className="notif-item-action"
                      style={{ color: getActionColor(notif.action) }}
                    >
                      {notif.action}
                    </span>
                    <span className="notif-item-module">{notif.module}</span>
                  </div>
                  
                  <p className="notif-item-description">{notif.description}</p>
                  
                  <div className="notif-item-footer">
                    <span className="notif-item-user">
                      <span className="notif-user-icon">👤</span>
                      {notif.user}
                    </span>
                    <span className="notif-item-time">
                      <Clock size={12} />
                      {formatTimestamp(notif.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;