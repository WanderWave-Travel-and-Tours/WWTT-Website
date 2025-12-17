import React from 'react';
import BookingLeftColumn from './bookingLeftColumn';
import BookingRightForm from './bookingRightForm';
import './packageBooking.css';

function PackageBooking({ pkg }) {
  if (!pkg) return null;

  return (
    <div className="pb-page">
      {/* Main Booking Container */}
      <div className="pb-container">
        <div className="pb-unified-card">
          {/* Left Panel - Package Details & Itinerary */}
          <div className="pb-left-panel">
            <BookingLeftColumn pkg={pkg} />
          </div>

          {/* Right Panel - Calendar & Booking Form */}
          <div className="pb-right-panel">
            <BookingRightForm pkg={pkg} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageBooking;