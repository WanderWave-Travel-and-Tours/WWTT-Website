import React, { useState } from 'react';
import BookingLeftColumn from './bookingLeftColumn';
import BookingRightForm from './bookingRightForm';
import './packageBooking.css';

function PackageBooking({ pkg, currency = 'PHP', exchangeRate = 58 }) {
  const [customizationData, setCustomizationData] = useState(null);

  if (!pkg) return null;

  const handleCustomizationChange = (data) => {
    console.log('📦 Package customization updated:', data);
    setCustomizationData(data);
  };

  // Calculate effective package price
  const effectivePackagePrice = customizationData 
    ? customizationData.totalPrice 
    : pkg.price;

  const effectivePackageTotal = customizationData
    ? customizationData.totalPrice
    : pkg.price;

  return (
    <div className="pb-page">
      <div className="pb-container">
        <div className="pb-unified-card">
          <div className="pb-left-panel">
            <BookingLeftColumn 
              pkg={pkg} 
              currency={currency}      
              exchangeRate={exchangeRate}
              onCustomizationChange={handleCustomizationChange}
            />
          </div>

          <div className="pb-right-panel">
            <BookingRightForm 
              pkg={pkg} 
              currency={currency}      
              exchangeRate={exchangeRate}
              customizationData={customizationData}
              effectivePackagePrice={effectivePackagePrice}
              effectivePackageTotal={effectivePackageTotal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PackageBooking;