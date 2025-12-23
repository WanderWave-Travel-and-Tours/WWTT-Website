import React from 'react';
import BookingLeftColumn from './bookingLeftColumn';
import BookingRightForm from './bookingRightForm';
import './packageBooking.css';

function PackageBooking({ pkg, currency = 'PHP', exchangeRate = 58 }) {
  if (!pkg) return null;

  return (
    <div className="pb-page">
      <div className="pb-container">
        <div className="pb-unified-card">
          <div className="pb-left-panel">
            <BookingLeftColumn 
              pkg={pkg} 
              currency={currency}      
              exchangeRate={58} />
          </div>

          <div className="pb-right-panel">
            <BookingRightForm 
              pkg={pkg} 
              currency={currency}      
              exchangeRate={58}        
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageBooking;