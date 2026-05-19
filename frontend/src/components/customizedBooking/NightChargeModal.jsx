// cbf/components/NightChargeModal.jsx
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Portal modal that warns the user about the late-night surcharge
 * when they pick a time between 12:00 AM and 5:00 AM.
 *
 * Props:
 *   field        – 'arrivalTime' | 'departureTime'
 *   pendingValue – the time string the user just picked
 *   onConfirm    – () => void  (accept the time, apply surcharge)
 *   onDismiss    – () => void  (reject the time, clear the field)
 */
export default function NightChargeModal({ field, pendingValue, onConfirm, onDismiss }) {
  return ReactDOM.createPortal(
    <div className="cbf-night-modal-backdrop">
      <div className="cbf-night-modal">
        <div className="cbf-nm-moon">🌙</div>
        <h3 className="cbf-nm-title">Late Night Schedule</h3>
        <p className="cbf-nm-desc">
          Schedules between <strong>12:00 AM – 5:00 AM</strong> include an additional
          late-night surcharge of <strong>₱500.00</strong> per time slot.
        </p>
        <p className="cbf-nm-sub">
          Do you want to continue with this schedule?
        </p>
        <div className="cbf-nm-actions">
          <button type="button" className="cbf-nm-close-btn" onClick={onDismiss}>
            ✕ Close
          </button>
          <button type="button" className="cbf-nm-confirm-btn" onClick={onConfirm}>
            Continue
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
