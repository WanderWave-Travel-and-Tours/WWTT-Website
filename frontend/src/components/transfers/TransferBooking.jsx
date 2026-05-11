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

  // ── Night Surcharge warning modal — lifted here so it renders ABOVE the
  //    booking modal (higher z-index) rather than being trapped inside it ──
  const [nightSurchargeField,   setNightSurchargeField]   = useState(null);
  const [nightSurchargePending, setNightSurchargePending] = useState('');
  const NIGHT_SURCHARGE = 500;

  const handleNightSurcharge = ({ field, value }) => {
    setNightSurchargePending(value);
    setNightSurchargeField(field);
  };

  const handleNightSurchargeConfirm = () => {
    if (nightSurchargeField === 'arrival')   setArrivalTime(nightSurchargePending);
    if (nightSurchargeField === 'departure') setDepartureTime(nightSurchargePending);
    setNightSurchargeField(null);
    setNightSurchargePending('');
  };

  const handleNightSurchargeClose = () => {
    if (nightSurchargeField === 'arrival')   setArrivalTime('');
    if (nightSurchargeField === 'departure') setDepartureTime('');
    setNightSurchargeField(null);
    setNightSurchargePending('');
  };

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
              onTransferTypeChange={setTransferType}
            />
          </div>

          <div className="pb-right-panel">
            <TransferBookingRightForm
              transfer={transfer}
              currency={currency}
              exchangeRate={exchangeRate}
              onPassengerCountChange={setPassengerCount}
              currentUser={currentUser}
              transferType={transferType}
              onTransferTypeChange={setTransferType}
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
          // ── night surcharge modal is handled here at parent level ──
          onNightSurcharge={handleNightSurcharge}
        />
      )}

      {/* ── Night Surcharge Warning Modal — rendered here (outside booking modal)
           so it sits ABOVE the booking modal overlay in the z-index stack ── */}
      {nightSurchargeField && (
        <div className="tbfm-night-modal-overlay">
          <div className="tbfm-night-modal-card">
            <div className="tbfm-night-modal-icon">🌙</div>
            <h3 className="tbfm-night-modal-title">Night Schedule Surcharge</h3>
            <p className="tbfm-night-modal-body">
              Schedules between <strong>12:00 AM and 5:00 AM</strong> include an additional night fee of{' '}
              <strong className="tbfm-night-modal-amount">₱500</strong> to cover overnight driver allowances and logistics.
            </p>
            <div className="tbfm-night-modal-actions">
              <button
                type="button"
                className="tbfm-night-btn tbfm-night-btn-close"
                onClick={handleNightSurchargeClose}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tbfm-night-btn tbfm-night-btn-confirm"
                onClick={handleNightSurchargeConfirm}
              >
                Continue (+₱500)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransferBooking;