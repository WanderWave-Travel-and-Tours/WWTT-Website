import React from 'react';
import { useToast } from '../../toast/ToastManager';
import { useBookingLogic } from '../hooks/useBookingLogic';
import BookingProgressBar    from '../components/BookingProgressBar';
import BookingStep1          from '../components/BookingStep1';
import BookingStep2          from '../components/BookingStep2';
import TransferDetailsModal  from '../components/TransferDetailsModal';
import BookingPreviewModal   from '../components/BookingPreviewModal';
import './newBookingModal.css';

const NewBookingModal = ({ isOpen, onClose }) => {
  const toast = useToast();
  const b     = useBookingLogic(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className="nbm-overlay">
      <div className="nbm-modal">

        {/* ── HEADER ── */}
        <div className="nbm-header">
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#0f172a' }}>
            Create New Booking
          </h2>
          <button
            onClick={b.handleClose}
            style={{
              background: 'none', border: 'none', fontSize: '28px',
              cursor: 'pointer', color: '#64748b', lineHeight: 1,
              padding: '0 4px', borderRadius: '6px', transition: 'color 0.2s',
            }}
          >×</button>
        </div>

        {/* ── PROGRESS BAR ── */}
        <BookingProgressBar currentStep={b.currentStep} />

        {/* ── BODY ── */}
        <div className="nbm-body">

          {b.currentStep === 1 && (
            <BookingStep1
              // Destination
              selectedDestination={b.selectedDestination}
              setSelectedDestination={b.setSelectedDestination}
              destinations={b.destinations}
              filteredDestinations={b.filteredDestinations}
              destDropdownOpen={b.destDropdownOpen}
              setDestDropdownOpen={b.setDestDropdownOpen}
              destRef={b.destRef}
              resetDestinationRelated={b.resetDestinationRelated}
              // Package
              filteredPackages={b.filteredPackages}
              selectedPackage={b.selectedPackage}
              setSelectedPackage={b.setSelectedPackage}
              updateField={b.updateField}
              setDepartureDate={b.setDepartureDate}
              // Package type flags
              isSoloPkg={b.isSoloPkg}
              isMinTwoPkg={b.isMinTwoPkg}
              isSoloJoinersPkg={b.isSoloJoinersPkg}
              handlePackageTypeDetect={b.handlePackageTypeDetect}
              // Pax
              paxCount={b.paxCount}
              setPaxCount={b.setPaxCount}
              addPassenger={b.addPassenger}
              removePassenger={b.removePassenger}
              // Date
              departureDate={b.departureDate}
              isRestrictedDestination={b.isRestrictedDestination}
              isAllowedBookingDay={b.isAllowedBookingDay}
              getAllowedDayLabel={b.getAllowedDayLabel}
              getDurationDays={b.getDurationDays}
              // Passengers
              formData={b.formData}
              updatePassenger={b.updatePassenger}
              handleDateOfBirthChange={b.handleDateOfBirthChange}
              handleDobPartChange={b.handleDobPartChange}
              // Toast
              toast={toast}
            />
          )}

          {b.currentStep === 2 && (
            <BookingStep2
              // Hotel
              hotelData={b.hotelData}
              selectedRoomType={b.selectedRoomType}
              setSelectedRoomType={b.setSelectedRoomType}
              paxCount={b.paxCount}
              selectedPackage={b.selectedPackage}
              getDurationDays={b.getDurationDays}
              // Promo
              promoCode={b.promoCode}
              setPromoCode={b.setPromoCode}
              appliedPromo={b.appliedPromo}
              promoError={b.promoError}
              isCheckingPromo={b.isCheckingPromo}
              handleApplyPromo={b.handleApplyPromo}
              handleRemovePromo={b.handleRemovePromo}
              // Payment
              formData={b.formData}
              updateField={b.updateField}
              payableAmount={b.payableAmount}
              computeFinalTotal={b.computeFinalTotal}
              calculateBasePackageTotal={b.calculateBasePackageTotal}
              calculateHotelTotal={b.calculateHotelTotal}
              calculateDiscount={b.calculateDiscount}
            />
          )}

        </div>

        {/* ── FOOTER BUTTONS ── */}
        <div className="nbm-footer">
          {b.currentStep > 1 && (
            <button
              className="nbm-btn nbm-btn-back"
              onClick={() => b.setCurrentStep(prev => prev - 1)}
            >
              ← Back
            </button>
          )}

          {b.currentStep === 1 && (
            <button
              className="nbm-btn nbm-btn-next"
              onClick={() => b.setCurrentStep(2)}
              disabled={!b.selectedPackage || !b.departureDate}
            >
              Continue to Hotel &amp; Payment →
            </button>
          )}

          {b.currentStep === 2 && (
            <button
              className="nbm-btn nbm-btn-next"
              onClick={() => b.setShowConfirm(true)}
              disabled={!b.selectedRoomType || b.loading}
            >
              {b.loading ? 'Creating Booking...' : 'Review & Create Booking ✓'}
            </button>
          )}
        </div>

      </div>

      {/* ── TRANSFER DETAILS MODAL ── */}
      {b.showTransferDetailsModal && (
        <TransferDetailsModal
          transfer={b.showTransferDetailsModal}
          transferTypes={b.transferTypes}
          formData={b.formData}
          departureDate={b.departureDate}
          selectedDestination={b.selectedDestination}
          selectedPackage={b.selectedPackage}
          paxCount={b.paxCount}
          getDurationDays={b.getDurationDays}
          transferDetailsForm={b.transferDetailsForm}
          setTransferDetailsForm={b.setTransferDetailsForm}
          setTransferDetailsMap={b.setTransferDetailsMap}
          setSelectedTransferAddOns={b.setSelectedTransferAddOns}
          setShowTransferDetailsModal={b.setShowTransferDetailsModal}
        />
      )}

      {/* ── BOOKING PREVIEW MODAL ── */}
      {b.showConfirm && (
        <BookingPreviewModal
          onClose={() => b.setShowConfirm(false)}
          handleSubmit={b.handleSubmit}
          loading={b.loading}
          selectedDestination={b.selectedDestination}
          selectedPackage={b.selectedPackage}
          departureDate={b.departureDate}
          paxCount={b.paxCount}
          isSoloPkg={b.isSoloPkg}
          isMinTwoPkg={b.isMinTwoPkg}
          formData={b.formData}
          selectedRoomType={b.selectedRoomType}
          appliedPromo={b.appliedPromo}
          selectedTourAddOns={b.selectedTourAddOns}
          selectedTransferAddOns={b.selectedTransferAddOns}
          transferTypes={b.transferTypes}
          calculateBasePackageTotal={b.calculateBasePackageTotal}
          calculateDiscount={b.calculateDiscount}
          calculateHotelTotal={b.calculateHotelTotal}
          calculateAddOnsTotal={b.calculateAddOnsTotal}
          computeFinalTotal={b.computeFinalTotal}
          payableAmount={b.payableAmount}
          getDurationDays={b.getDurationDays}
        />
      )}

    </div>
  );
};

export default NewBookingModal;