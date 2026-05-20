import React from 'react';

const NtbmProgress = ({ currentStep }) => (
  <div className="ntbm-progress">
    <div className={`ntbm-step ${currentStep === 1 ? 'active' : ''}`}>
      <div className={`ntbm-step-dot ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
        {currentStep > 1 ? '✓' : '1'}
      </div>
      Trip Details
    </div>

    <div
      className="ntbm-progress-line"
      style={{ background: currentStep >= 2 ? '#f59e0b' : '#e2e8f0' }}
    />

    <div className={`ntbm-step ${currentStep === 2 ? 'active' : ''}`}>
      <div className={`ntbm-step-dot ${currentStep === 2 ? 'active' : ''}`}>2</div>
      Booking Preview
    </div>
  </div>
);

export default NtbmProgress;
