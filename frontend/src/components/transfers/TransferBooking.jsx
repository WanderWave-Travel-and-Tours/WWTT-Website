// src/components/Transfers/TransferBooking.jsx
import React, { useState } from 'react';
import TransferBookingLeftColumn from './TransferBookingLeftColumn';
import TransferBookingRightForm from './TransferBookingRightForm';
import TransferBookingFormModal from './TransferBookingFormModal';
import './TransferBooking.css';

function TransferBooking({
  transfer,
  onGoBack,
  currency = 'PHP',
  exchangeRate = 58,
  currentUser = null,
}) {
  const [passengerCount, setPassengerCount] = useState(1);

  // ── Modal state lifted to root so it renders OUTSIDE pb-unified-card
  //    (overflow:hidden on pb-unified-card traps position:fixed children)
  const [showBookingModal,  setShowBookingModal]  = useState(false);
  const [transferType,      setTransferType]      = useState('oneway');
  const [travelDate,        setTravelDate]        = useState('');
  const [arrivalTime,       setArrivalTime]       = useState('');
  const [departureTime,     setDepartureTime]     = useState('');
  const [pickupLocation,    setPickupLocation]    = useState('');
  const [dropoffLocation,   setDropoffLocation]   = useState('');
  const [specialRequests,   setSpecialRequests]   = useState('');
  const [paymentType,       setPaymentType]       = useState('full');
  const [totalAmount,       setTotalAmount]       = useState(0);
  const [partialAmount,     setPartialAmount]     = useState(0);

  if (!transfer) return null;

  const currencySymbol = currency === 'PHP' ? '₱' : '$';

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
              transferType={transferType}
            />
          </div>

          <div className="pb-right-panel">
            <TransferBookingRightForm
              transfer={transfer}
              currency={currency}
              exchangeRate={exchangeRate}
              onPassengerCountChange={setPassengerCount}
              currentUser={currentUser}
              // ── lifted modal props ──
              onOpenModal={(modalProps) => {
                setTransferType(modalProps.transferType);
                setTravelDate(modalProps.travelDate);
                setArrivalTime(modalProps.arrivalTime     ?? '');
                setDepartureTime(modalProps.departureTime ?? '');
                setPickupLocation(modalProps.pickupLocation  ?? '');
                setDropoffLocation(modalProps.dropoffLocation ?? '');
                setSpecialRequests(modalProps.specialRequests ?? '');
                setPaymentType(modalProps.paymentType ?? 'full');
                setTotalAmount(modalProps.totalAmount);
                setPartialAmount(modalProps.partialAmount);
                setShowBookingModal(true);
              }}
              // pass setters back so the right form can still update them
              setArrivalTime={setArrivalTime}
              setDepartureTime={setDepartureTime}
              setPickupLocation={setPickupLocation}
              setDropoffLocation={setDropoffLocation}
              setSpecialRequests={setSpecialRequests}
              setPaymentType={setPaymentType}
              paymentType={paymentType}
              arrivalTime={arrivalTime}
              departureTime={departureTime}
              pickupLocation={pickupLocation}
              dropoffLocation={dropoffLocation}
              specialRequests={specialRequests}
            />
          </div>
        </div>
      </div>

      {/* ── Modal rendered HERE — outside pb-unified-card so overflow:hidden
           on that card does NOT trap the position:fixed overlay ── */}
      {showBookingModal && (
        <TransferBookingFormModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          transfer={transfer}
          transferType={transferType}
          travelDate={travelDate}
          setTravelDate={setTravelDate}
          arrivalTime={arrivalTime}
          setArrivalTime={setArrivalTime}
          departureTime={departureTime}
          setDepartureTime={setDepartureTime}
          pickupLocation={pickupLocation}
          setPickupLocation={setPickupLocation}
          dropoffLocation={dropoffLocation}
          setDropoffLocation={setDropoffLocation}
          specialRequests={specialRequests}
          setSpecialRequests={setSpecialRequests}
          passengerCount={passengerCount}
          totalAmount={totalAmount}
          partialAmount={partialAmount}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          currency={currency}
          exchangeRate={exchangeRate}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}

export default TransferBooking;