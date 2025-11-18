import React from 'react';
import { ArrowLeft } from 'lucide-react';
import BookingLeftColumn from './bookingLeftColumn';
import BookingRightForm from './bookingRightForm';
import './PackageBooking.css';

function PackageBooking({ pkg, onGoBack }) {
  if (!pkg) return null;

  return (
    <div className="booking-page">
      {/* Navigation Header */}
      <div className="booking-header">
        <div className="booking-header-content">
          <button onClick={onGoBack} className="go-back-btn">
            <ArrowLeft size={20} />
            <span>GO BACK</span>
          </button>
        </div>
      </div>

      <div className="booking-container">
        {/* Unified Card Wrapper */}
        <div className="unified-booking-card">
          
          {/* Left Side: Visuals & Info */}
          <div className="unified-left-panel">
            <BookingLeftColumn pkg={pkg} />
          </div>

          {/* Right Side: Form & Logic */}
          <div className="unified-right-panel">
            <BookingRightForm pkg={pkg} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default PackageBooking;