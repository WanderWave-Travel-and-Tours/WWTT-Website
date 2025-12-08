import React from 'react';
import { X, Plane } from 'lucide-react';
import './CurrencyModal.css';

function CurrencyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="airplane-container">
        <Plane className="airplane-icon" />
        <div className="airplane-trail"></div>
        <div className="cloud cloud-1">☁️</div>
        <div className="cloud cloud-2">☁️</div>
      </div>

      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="receipt-perforation-top"></div>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>
        <div className="receipt-header">
          <div className="receipt-logo">
            <img 
              src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/6911894edaa4e3fb6cfb8afe.png" 
              alt="Logo" 
              className="logo-image"
            />
          </div>
          <h2 className="receipt-title">TRAVEL NOTICE</h2>
          <div className="receipt-subtitle">International Bookings Advisory</div>
        </div>
        <div className="receipt-body">
          <div className="main-notice">
            <h3 className="notice-title">Important Notice</h3>
            <p className="notice-text">
              Prices for <strong>International Packages</strong> may fluctuate daily based on current foreign exchange rates.
            </p>
            <p className="notice-subtext">
              Transaction fees may also apply depending on your chosen payment method.
            </p>
          </div>
        </div>
        <div className="receipt-footer">
          <div className="receipt-stamp">
            <div className="stamp-circle">✓</div>
            <span className="stamp-text">ACKNOWLEDGED</span>
          </div>
          <button className="receipt-confirm-btn" onClick={onClose}>
            GOT IT, THANKS!
          </button>
          <div className="receipt-footer-note">
            WANDERWAVE Travel & Tours
          </div>
        </div>
        <div className="receipt-perforation-bottom"></div>
      </div>
    </div>
  );
}

export default CurrencyModal;