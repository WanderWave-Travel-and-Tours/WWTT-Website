import React, { useEffect, useState } from 'react';
import { Car } from 'lucide-react';
import { useTransferBooking } from './hooks/useTransferBooking';
import LateNightSurchargeModal from './components/LateNightSurchargeModal';
import BookingPreviewModal from './components/BookingPreviewModal';
import TripDetailsStep from './components/TripDetailsStep';
import PaymentStep from './components/PaymentStep';

// CSS
import './css/modalBase.css';
import './css/tripDetails.css';
import './css/passengerCard.css';
import './css/previewModal.css';
import './css/transferDetailsModal.css';
import './PaymentOption.css';

const CLOSE_DURATION = 200; // ms — must match .nbm-overlay-closing transition in modalBase.css

const NewTransferBookingModal = ({ isOpen, onClose, bookingMode = 'assist' }) => {
  const booking = useTransferBooking(isOpen, onClose, bookingMode);

  // Keep rendering briefly after isOpen flips false so the overlay/modal can
  // fade out instead of vanishing instantly.
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setClosing(false);
    } else if (shouldRender) {
      setClosing(true);
      const timer = setTimeout(() => setShouldRender(false), CLOSE_DURATION);
      return () => clearTimeout(timer);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shouldRender) return null;

  // ── Preview screen ───────────────────────────────────────────────────────
  if (booking.showPreview) {
    return (
      <BookingPreviewModal
        passengers={booking.passengers}
        destination={booking.destination}
        selectedTransfer={booking.selectedTransfer}
        tripType={booking.tripType}
        paxCount={booking.paxCount}
        travelDate={booking.travelDate}
        arrivalTime={booking.arrivalTime}
        pickupLocation={booking.pickupLocation}
        returnDate={booking.returnDate}
        departureTime={booking.departureTime}
        dropoffLocation={booking.dropoffLocation}
        sellingPrice={booking.sellingPrice}
        arrivalSurcharge={booking.arrivalSurcharge}
        departureSurcharge={booking.departureSurcharge}
        paymentType={booking.paymentType}
        totalAmount={booking.totalAmount}
        initialPaymentAmount={booking.initialPaymentAmount}
        remainingBalance={booking.remainingBalance}
        loading={booking.loading}
        onClose={() => booking.setShowPreview(false)}
        onConfirm={booking.handleSubmit}
      />
    );
  }

  // ── Main Modal ───────────────────────────────────────────────────────────
  return (
    <>
      {/* Late Night Warning — floats above everything */}
      <LateNightSurchargeModal
        lateNightModal={booking.lateNightModal}
        pendingTime={booking.pendingTime}
        onConfirm={booking.handleLateNightConfirm}
        onClose={booking.handleLateNightClose}
      />

      <div className={`nbm-overlay ${closing ? 'nbm-overlay-closing' : ''}`}>
        <div className={`nbm-modal ${closing ? 'nbm-modal-closing' : ''}`}>

          {/* ── Header ── */}
          <div className="nbm-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #fc9c1b)',
                borderRadius: 9, width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Car size={18} color="#fff" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#ffffff' }}>
                  New Transfer Booking
                </h2>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)' }}>
                  Create a sales transfer booking
                </p>
              </div>
            </div>
            <button
              onClick={booking.handleClose}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                fontSize: '20px', cursor: 'pointer',
                color: 'rgba(255,255,255,0.8)', lineHeight: 1,
                padding: '4px 8px', borderRadius: '6px',
              }}
            >×</button>
          </div>

          {/* ── Progress ── */}
          <div className="nbm-progress">
            <div className={`nbm-step ${booking.currentStep === 1 ? 'active' : ''}`}>
              <div className={`nbm-step-dot ${booking.currentStep === 1 ? 'active' : booking.currentStep > 1 ? 'done' : ''}`}>
                {booking.currentStep > 1 ? '✓' : '1'}
              </div>
              Trip & Passengers
            </div>
            <div
              className="nbm-progress-line"
              style={{ background: booking.currentStep >= 2 ? '#f59e0b' : '#e2e8f0' }}
            />
            <div className={`nbm-step ${booking.currentStep === 2 ? 'active' : ''}`}>
              <div className={`nbm-step-dot ${booking.currentStep === 2 ? 'active' : ''}`}>2</div>
              Payment Option
            </div>
          </div>

          {/* ── Body ── */}
          <div className="nbm-body">
            {booking.currentStep === 1 && (
              <TripDetailsStep
                destination={booking.destination}
                setDestination={booking.setDestination}
                showDestDropdown={booking.showDestDropdown}
                setShowDestDropdown={booking.setShowDestDropdown}
                destWrapperRef={booking.destWrapperRef}
                destSuggestions={booking.destSuggestions}
                paxCount={booking.paxCount}
                setPaxCount={booking.setPaxCount}
                tripType={booking.tripType}
                setTripType={booking.setTripType}
                filteredTransfers={booking.filteredTransfers}
                selectedTransfer={booking.selectedTransfer}
                setSelectedTransfer={booking.setSelectedTransfer}
                loadingTransfers={booking.loadingTransfers}
                travelDate={booking.travelDate}
                setTravelDate={booking.setTravelDate}
                returnDate={booking.returnDate}
                setReturnDate={booking.setReturnDate}
                arrivalTime={booking.arrivalTime}
                departureTime={booking.departureTime}
                handleArrivalTimeChange={booking.handleArrivalTimeChange}
                handleDepartureTimeChange={booking.handleDepartureTimeChange}
                pickupLocation={booking.pickupLocation}
                setPickupLocation={booking.setPickupLocation}
                dropoffLocation={booking.dropoffLocation}
                setDropoffLocation={booking.setDropoffLocation}
                passengers={booking.passengers}
                updatePassenger={booking.updatePassenger}
                handleDobPartChange={booking.handleDobPartChange}
                totalSurcharge={booking.totalSurcharge}
                arrivalSurcharge={booking.arrivalSurcharge}
                departureSurcharge={booking.departureSurcharge}
              />
            )}

            {booking.currentStep === 2 && (
              <PaymentStep
                selectedTransfer={booking.selectedTransfer}
                tripType={booking.tripType}
                paxCount={booking.paxCount}
                travelDate={booking.travelDate}
                totalSurcharge={booking.totalSurcharge}
                totalAmount={booking.totalAmount}
                sellingPrice={booking.sellingPrice}
                arrivalSurcharge={booking.arrivalSurcharge}
                departureSurcharge={booking.departureSurcharge}
                initialPaymentAmount={booking.initialPaymentAmount}
                remainingBalance={booking.remainingBalance}
                paymentType={booking.paymentType}
                setPaymentType={booking.setPaymentType}
                isPartialPaymentRestricted={booking.isPartialPaymentRestricted}
              />
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, background: '#fff' }}>
            {booking.currentStep === 1 ? (
              <>
                <button onClick={booking.handleClose} className="nbm-btn nbm-btn-back" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button onClick={booking.handleNext} className="nbm-btn nbm-btn-next" style={{ flex: 2 }}>
                  Next: Payment Option
                </button>
              </>
            ) : (
              <>
                <button onClick={() => booking.setCurrentStep(1)} className="nbm-btn nbm-btn-back" style={{ flex: 1 }}>
                  Back
                </button>
                <button
                  onClick={() => booking.setShowPreview(true)}
                  disabled={booking.loading}
                  className="nbm-btn nbm-btn-next"
                  style={{ flex: 2 }}
                >
                  {booking.loading ? 'Processing...' : 'Review Booking'}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </>
  );
};

export default NewTransferBookingModal;