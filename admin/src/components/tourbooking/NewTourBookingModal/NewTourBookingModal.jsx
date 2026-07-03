import React, { useEffect, useState } from 'react';
import { useNtbmBooking } from './hooks/useNtbmBooking';
import { useToast } from '../../toast/ToastManager';
import NtbmHeader   from './components/NtbmHeader';
import NtbmProgress from './components/NtbmProgress';
import NtbmFooter   from './components/NtbmFooter';
import NtbmStep1    from './components/NtbmStep1';
import NtbmStep2    from './components/NtbmStep2';
import './newTourBookingModal.css';
import './PaymentOption.css';

const CLOSE_DURATION = 200; // ms — must match .ntbm-overlay-closing transition below

const NewTourBookingModal = ({ isOpen, onClose, bookingMode = 'assist' }) => {
  const toast = useToast();
  const booking = useNtbmBooking({ isOpen, onClose, bookingMode });

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

  return (
    <div className={`ntbm-overlay ${closing ? 'ntbm-overlay-closing' : ''}`}>
      <div className={`ntbm-modal ${closing ? 'ntbm-modal-closing' : ''}`}>

        <NtbmHeader onClose={booking.handleClose} />

        <NtbmProgress currentStep={booking.currentStep} />

        <div className="ntbm-body">
          {booking.currentStep === 1 && (
            <NtbmStep1
              // Destination / tours
              destinations={booking.destinations}
              filteredTours={booking.filteredTours}
              selectedDestination={booking.selectedDestination}
              setSelectedDestination={booking.setSelectedDestination}
              selectedTour={booking.selectedTour}
              setSelectedTour={booking.setSelectedTour}
              destDropdownOpen={booking.destDropdownOpen}
              setDestDropdownOpen={booking.setDestDropdownOpen}
              destRef={booking.destRef}
              // Trip config
              paxCount={booking.paxCount}
              setPaxCount={booking.setPaxCount}
              departureDate={booking.departureDate}
              handleDepartureDateChange={booking.handleDepartureDateChange}
              isRestrictedDestination={booking.isRestrictedDestination}
              isDateAllowed={booking.isDateAllowed}
              getAllowedDayLabel={booking.getAllowedDayLabel}
              // Payment
              paymentType={booking.paymentType}
              setPaymentType={booking.setPaymentType}
              // Passengers
              passengers={booking.passengers}
              updatePassenger={booking.updatePassenger}
              handleDobPartChange={booking.handleDobPartChange}
              // Pricing
              packageTotal={booking.packageTotal}
              payableAmount={booking.payableAmount}
              initialPaymentAmount={booking.initialPaymentAmount}
              // Helpers
              getDurationDays={booking.getDurationDays}
              computeEndDate={booking.computeEndDate}
              isDateTodayOrTomorrow={booking.isDateTodayOrTomorrow}
              // Toast
              toast={toast}
            />
          )}

          {booking.currentStep === 2 && (
            <NtbmStep2
              passengers={booking.passengers}
              selectedDestination={booking.selectedDestination}
              selectedTour={booking.selectedTour}
              departureDate={booking.departureDate}
              paxCount={booking.paxCount}
              paymentType={booking.paymentType}
              tourPrice={booking.tourPrice}
              packageTotal={booking.packageTotal}
              initialPaymentAmount={booking.initialPaymentAmount}
              payableAmount={booking.payableAmount}
              computeEndDate={booking.computeEndDate}
            />
          )}
        </div>

        <NtbmFooter
          currentStep={booking.currentStep}
          selectedTour={booking.selectedTour}
          departureDate={booking.departureDate}
          loading={booking.loading}
          onCancel={booking.handleClose}
          onBack={() => booking.setCurrentStep(1)}
          onNext={() => { if (booking.validateStep1()) booking.setCurrentStep(2); }}
          onSubmit={booking.handleSubmit}
        />

      </div>
    </div>
  );
};

export default NewTourBookingModal;
