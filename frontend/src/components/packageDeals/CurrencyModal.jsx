import React from 'react';
import { X, Plane } from 'lucide-react';
import './CurrencyModal.css';

function CurrencyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      
      {/* Airplane Animation */}
      <div className="airplane-container">
        <Plane className="airplane-icon" size={40} />
        <div className="airplane-trail"></div>
        <div className="cloud cloud-1">☁️</div>
        <div className="cloud cloud-2">☁️</div>
      </div>

      {/* Receipt Modal */}
      <div className="receipt-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Perforated Top Edge */}
        <div className="receipt-perforation-top"></div>

        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          <X size={20} />
        </button>

        {/* Receipt Header */}
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

        {/* Dotted Line Divider */}
        <div className="receipt-divider"></div>

        {/* Receipt Body */}
        <div className="receipt-body">
          
          {/* Main Notice */}
          <div className="receipt-section main-notice">
            <div className="notice-icon">
            </div>
            <h3 className="notice-title">Important Notice</h3>
            <p className="notice-text">
              Prices for <strong>International Packages</strong> may fluctuate daily based on current foreign exchange rates.
            </p>
            <p className="notice-subtext">
              Transaction fees may also apply depending on your chosen payment method.
            </p>
          </div>

        </div>

        {/* Dotted Line Divider */}
        <div className="receipt-divider"></div>

        {/* Receipt Footer */}
        <div className="receipt-footer">
          <div className="receipt-stamp">
            <div className="stamp-circle">
              <span>✓</span>
            </div>
            <p className="stamp-text">ACKNOWLEDGED</p>
          </div>
          
          <button className="receipt-confirm-btn" onClick={onClose}>
            <span className="btn-text">GOT IT, THANKS!</span>
          </button>

          <div className="receipt-footer-note">
            Thank you for choosing WANDERWAVE Travel & Tours
          </div>
        </div>

        {/* Perforated Bottom Edge */}
        <div className="receipt-perforation-bottom"></div>

        {/* Receipt Tear Effect */}
        <div className="receipt-tear"></div>

      </div>
    </div>
  );
}

export default CurrencyModal;