import React from 'react';

const NtbmFooter = ({
  currentStep,
  selectedTour,
  departureDate,
  loading,
  onCancel,
  onBack,
  onNext,
  onSubmit,
}) => (
  <div className="ntbm-footer">
    {currentStep === 1 ? (
      <>
        <button className="ntbm-btn ntbm-btn-back" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="ntbm-btn ntbm-btn-next"
          onClick={onNext}
          disabled={!selectedTour || !departureDate}
        >
          Preview Booking →
        </button>
      </>
    ) : (
      <>
        <button className="ntbm-btn ntbm-btn-back" onClick={onBack}>
          ← Back to Edit
        </button>
        <button
          className="ntbm-btn ntbm-btn-next"
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? 'Creating Booking...' : '✅ Confirm & Proceed to Payment'}
        </button>
      </>
    )}
  </div>
);

export default NtbmFooter;
