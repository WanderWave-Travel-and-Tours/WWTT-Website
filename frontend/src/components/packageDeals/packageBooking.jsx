import React from 'react';
import { ArrowLeft } from 'lucide-react';
import BookingLeftColumn from './bookingLeftColumn';
import BookingRightForm from './bookingRightForm';
import './packageBooking.css';

function PackageBooking({ pkg, onGoBack }) {
  if (!pkg) return null;

  return (
    <div className="booking-page">
      <div className="booking-header">
        <div className="booking-header-content">
          <button onClick={onGoBack} className="go-back-btn">
            <ArrowLeft size={20} />
            <span>GO BACK</span>
          </button>
        </div>
      </div>

      <div className="booking-container">
        <div className="unified-booking-card">
          <div className="unified-left-panel">
            <BookingLeftColumn pkg={pkg} />
          </div>

          <div className="unified-right-panel">
            <BookingRightForm pkg={pkg} />
          </div>

        </div>
      </div>
    </div>
  );
}

export default PackageBooking;