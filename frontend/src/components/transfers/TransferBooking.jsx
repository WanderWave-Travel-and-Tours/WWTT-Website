// src/components/Transfers/TransferBooking.jsx
import React, { useState } from 'react';
import TransferBookingLeftColumn from './TransferBookingLeftColumn';
import TransferBookingRightForm from './TransferBookingRightForm';
import './TransferBooking.css'; // reuse same layout styles

function TransferBooking({
  transfer,
  onGoBack,
  currency = 'PHP',
  exchangeRate = 58,
  currentUser = null,
}) {
  const [passengerCount, setPassengerCount] = useState(1);

  if (!transfer) return null;

  return (
    <div className="pb-page">
      <div className="pb-container">
        <div className="pb-unified-card">
          <div className="pb-left-panel">
            <TransferBookingLeftColumn
              transfer={transfer}
              currency={currency}
              exchangeRate={exchangeRate}
              onGoBack={onGoBack}
              passengerCount={passengerCount}
            />
          </div>

          <div className="pb-right-panel">
            <TransferBookingRightForm
              transfer={transfer}
              currency={currency}
              exchangeRate={exchangeRate}
              onPassengerCountChange={setPassengerCount}
              currentUser={currentUser}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TransferBooking;
