import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ message, type = 'success', onClose, duration = 5000, title }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={24} />;
      case 'error':
        return <XCircle size={24} />;
      case 'warning':
        return <AlertTriangle size={24} />;
      case 'info':
        return <Info size={24} />;
      default:
        return <Info size={24} />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'success':
        return 'Success!';
      case 'error':
        return 'Error!';
      case 'warning':
        return 'Warning!';
      case 'info':
        return 'Info';
      default:
        return 'Notification';
    }
  };
 
  return (
    <div className={`toast toast--${type}`}>
      <div className="toast__icon">
        {getIcon()}
      </div>
      <div className="toast__content">
        <div className="toast__title">{getTitle()}</div>
        <div className="toast__message">{message}</div>
      </div>
      <button className="toast__close" onClick={onClose}>
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;