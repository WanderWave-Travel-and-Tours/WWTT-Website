import React from 'react';
import { HelpCircle } from 'lucide-react';
import './CustomConfirmModal.css';

const CustomConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  type = "primary" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="arc-confirm-root"> {/* Root wrapper para sa isolation */}
      <div className="arc-confirm-overlay">
        <div className="arc-confirm-modal">
          <div className="arc-confirm-icon-container">
            <HelpCircle 
              size={48} 
              className={type === 'danger' ? 'icon-danger' : 'icon-primary'} 
            />
          </div>
          
          <h3 className="arc-confirm-title">{title}</h3>
          <p className="arc-confirm-message">{message}</p>
          
          <div className="arc-confirm-actions">
            <button 
              type="button" 
              className="btn-cancel" 
              onClick={onCancel}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className={`btn-confirm ${type === 'danger' ? 'bg-danger' : 'bg-primary'}`} 
              onClick={onConfirm}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomConfirmModal;