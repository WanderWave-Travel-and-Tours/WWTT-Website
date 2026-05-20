import React from 'react';

const BookingProgressBar = ({ currentStep }) => (
  <div className="nbm-progress">
    {/* Step 1 */}
    <div className={`nbm-step ${currentStep === 1 ? 'active' : ''}`}>
      <div className={`nbm-step-dot ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
        {currentStep > 1 ? '✓' : '1'}
      </div>
      <span className="nbm-step-label">Trip Details</span>
    </div>

    <div
      className="nbm-progress-line"
      style={{ background: currentStep >= 2 ? '#f59e0b' : '#e2e8f0' }}
    />

    {/* Step 2 */}
    <div className={`nbm-step ${currentStep === 2 ? 'active' : ''}`}>
      <div className={`nbm-step-dot ${currentStep === 2 ? 'active' : ''}`}>2</div>
      <span className="nbm-step-label">Hotel &amp; Payment</span>
    </div>
  </div>
);

export default BookingProgressBar;
