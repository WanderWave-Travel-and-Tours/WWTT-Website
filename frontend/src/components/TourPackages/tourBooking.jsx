import React, { useState } from 'react';
import TourBookingLeftColumn from './tourBookingLeftColumn';
import TourBookingRightForm from './tourBookingRightForm';
import './tourBooking.css';

function TourBooking({
  pkg,
  onGoBack,
  currency = 'PHP',
  exchangeRate = 58,
  currentUser = null
}) {
  const [paxCount, setPaxCount] = useState(1);
  const [selectedFlight, setSelectedFlight] = useState(null);

  if (!pkg) return null;

  return (
    <div className="pb-page">
      <div className="pb-container">
        <div className="pb-unified-card">
          <div className="pb-left-panel">
            <TourBookingLeftColumn
              pkg={pkg}
              currency={currency}
              exchangeRate={exchangeRate}
              onGoBack={onGoBack}
              paxCount={paxCount}
              selectedFlight={selectedFlight}
            />
          </div>

          <div className="pb-right-panel">
            <TourBookingRightForm
              pkg={pkg}
              currency={currency}
              exchangeRate={exchangeRate}
              onPaxChange={setPaxCount}
              onFlightChange={setSelectedFlight}
              initialPaxFromFunnel={pkg.initialPaxFromFunnel}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TourBooking;