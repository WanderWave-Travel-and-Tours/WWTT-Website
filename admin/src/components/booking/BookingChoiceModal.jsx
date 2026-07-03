import React from 'react';
import { UserCheck, Users, X } from 'lucide-react';
import './BookingChoiceModal.css';

// Shown before any "sales" booking form opens, across Sales Booking,
// Tour Booking, Transfer Booking, and Custom Booking pages.
// onSelect receives 'walkin' or 'assist'.
const BookingChoiceModal = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="bcm-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="bcm-modal">
        <div className="bcm-header">
          <div className="bcm-header-text">
            <h2>New Booking</h2>
            <p>How is this booking being made?</p>
          </div>
          <button className="bcm-close-btn" onClick={onClose} type="button">
            <X size={16} />
          </button>
        </div>

        <div className="bcm-content">
          <button
            type="button"
            className="bcm-option"
            onClick={() => onSelect?.('walkin')}
          >
            <div className="bcm-option-icon">
              <Users size={20} />
            </div>
            <div className="bcm-option-text">
              <span className="bcm-option-title">Walk-in Booking</span>
              <span className="bcm-option-desc">Customer is booking in person at the office.</span>
            </div>
          </button>

          <button
            type="button"
            className="bcm-option"
            onClick={() => onSelect?.('assist')}
          >
            <div className="bcm-option-icon">
              <UserCheck size={20} />
            </div>
            <div className="bcm-option-text">
              <span className="bcm-option-title">Assist a Customer</span>
              <span className="bcm-option-desc">Booking on the customer's behalf remotely (call, chat, etc.).</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingChoiceModal;
