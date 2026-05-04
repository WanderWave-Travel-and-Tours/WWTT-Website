import React, { useState, useEffect, useRef } from 'react';
import TourBookingLeftColumn from './tourBookingLeftColumn';
import TourBookingRightForm from './tourBookingRightForm';

import './tourBooking.css';
import { usePageTracker } from '../../hooks/usePageTracker';

function TourBooking({
  pkg,
  onGoBack,
  currency = 'PHP',
  exchangeRate = 58,
  currentUser = null
}) {
  const [paxCount, setPaxCount] = useState(1);
  const [selectedFlight, setSelectedFlight] = useState(null);

  const isMounted = useRef(true);

  
  // Prevent back button
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handlePopState = () => window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Page tracker
  const packageId   = pkg._id || pkg.id;
  const packageName = pkg.name || pkg.title || 'Unknown Tour';

  usePageTracker({
    page:        'tour-booking',
    path:        `/tour-booking/${packageId}`,
    label:       `Tour Booking Page: ${packageName}`,
    packageId,
    packageName,
  });

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