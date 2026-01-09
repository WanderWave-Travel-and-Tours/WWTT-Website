
import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';
import './Toast.css';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success', title = null, duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, title, duration };
    
    setToasts(prev => [...prev, newToast]);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const toast = {
    success: (message, title, duration) => addToast(message, 'success', title, duration),
    error: (message, title, duration) => addToast(message, 'error', title, duration),
    warning: (message, title, duration) => addToast(message, 'warning', title, duration),
    info: (message, title, duration) => addToast(message, 'info', title, duration),
    neutral: (message, title, duration) => addToast(message, 'neutral', title, duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            title={toast.title}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;