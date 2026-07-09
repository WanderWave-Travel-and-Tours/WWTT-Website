import React, { useState } from 'react';
import { UserCircle2, Headset, X } from 'lucide-react';
import './BookingChoiceModal.css';

// Shown before any "sales" booking form opens, across Sales Booking,
// Tour Booking, Transfer Booking, and Custom Booking pages.
// onSelect receives 'walkin' or 'assist' — the parent mounts the next form
// modal immediately; its own fade-in entrance is what carries the transition,
// so there's no dead pause waiting on this modal to finish closing first.
const BookingChoiceModal = ({ isOpen, onClose, onSelect }) => {
  const [selectedMode, setSelectedMode] = useState(null); // null | 'walkin' | 'assist'

  // The component stays mounted between opens (the parent toggles `isOpen`
  // rather than conditionally rendering it), so selectedMode would
  // otherwise persist from the previous session and reopen already
  // "selected" and locked (handleSelect ignores clicks once set). Reset it
  // during render on the closed→open transition, per React's guidance for
  // adjusting state from props instead of doing it in an effect
  // (https://react.dev/reference/react/useState#storing-information-from-previous-renders).
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setSelectedMode(null);
  }

  if (!isOpen) return null;

  const handleSelect = (mode) => {
    if (selectedMode) return; // ignore double-clicks
    setSelectedMode(mode);
    onSelect?.(mode);
  };

  const handleClose = () => {
    if (selectedMode) return;
    onClose?.();
  };

  return (
    <div
      className="bcm-overlay"
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="bcm-modal">
        <button className="bcm-close-btn" onClick={handleClose} type="button">
          <X size={18} />
        </button>

        <div className="bcm-header">
          <span className="bcm-eyebrow">New Booking</span>
          <h2>How is this booking being made?</h2>
        </div>

        <div className="bcm-content">
          <button
            type="button"
            className={[
              'bcm-option',
              'bcm-option-walkin',
              selectedMode === 'walkin' ? 'bcm-option-selected' : '',
              selectedMode && selectedMode !== 'walkin' ? 'bcm-option-dismissed' : '',
            ].join(' ').trim()}
            onClick={() => handleSelect('walkin')}
          >
            <div className="bcm-option-art">
              <svg viewBox="0 0 300 220" className="bcm-art-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="bcm-walkin-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFF1E3" />
                    <stop offset="100%" stopColor="#FFDCB8" />
                  </linearGradient>
                  <linearGradient id="bcm-walkin-desk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FBC694" />
                    <stop offset="100%" stopColor="#EFA765" />
                  </linearGradient>
                  <linearGradient id="bcm-walkin-floor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFDFC2" />
                    <stop offset="100%" stopColor="#FFD1A3" />
                  </linearGradient>
                  <radialGradient id="bcm-walkin-glow" cx="50%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect x="0" y="0" width="300" height="220" fill="url(#bcm-walkin-sky)" />
                <rect x="0" y="0" width="300" height="220" fill="url(#bcm-walkin-glow)" />
                <rect x="0" y="158" width="300" height="62" fill="url(#bcm-walkin-floor)" />

                {/* window glazing bars */}
                <rect x="222" y="18" width="60" height="122" rx="6" fill="#FFFFFF" opacity="0.35" />
                <line x1="252" y1="18" x2="252" y2="140" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />
                <line x1="222" y1="79" x2="282" y2="79" stroke="#FFFFFF" strokeWidth="2" opacity="0.6" />

                {/* potted plant */}
                <path d="M28 96 C10 90 8 68 30 62 C34 46 62 46 66 62 C88 66 86 92 68 98 Z" fill="#5F9868" />
                <path d="M28 96 C10 90 8 68 30 62" fill="none" stroke="#4C7E54" strokeWidth="0" />
                <ellipse cx="47" cy="70" rx="10" ry="16" fill="#6FAE79" opacity="0.7" />
                <rect x="34" y="150" width="24" height="34" rx="3" fill="#C9773E" />
                <rect x="34" y="150" width="24" height="8" rx="3" fill="#B8672F" />

                {/* reception desk */}
                <rect x="78" y="150" width="158" height="10" rx="3" fill="#FFEDD9" />
                <rect x="82" y="160" width="150" height="50" rx="6" fill="url(#bcm-walkin-desk)" />
                <rect x="82" y="160" width="150" height="6" fill="#E8934F" opacity="0.5" />

                {/* welcome sign */}
                <rect x="118" y="8" width="76" height="28" rx="6" fill="#FFFFFF" />
                <text x="156" y="27" textAnchor="middle" fontSize="12" fontWeight="800" fill="#E8763A" letterSpacing="1">WELCOME</text>

                {/* monitor on desk */}
                <rect x="148" y="118" width="46" height="34" rx="4" fill="#3A4657" />
                <rect x="152" y="122" width="38" height="24" rx="2" fill="#7FB2E8" />
                <rect x="166" y="152" width="10" height="9" fill="#3A4657" />
                <rect x="160" y="160" width="22" height="4" rx="2" fill="#2E3949" />

                {/* desk bell */}
                <ellipse cx="210" cy="176" rx="12" ry="6" fill="#F1F3F5" stroke="#D8DEE4" strokeWidth="1.5" />
                <path d="M200 176 a10 12 0 0 1 20 0" fill="#FFD24C" stroke="#E0AE2A" strokeWidth="1.5" />
                <circle cx="210" cy="164" r="2.5" fill="#E0AE2A" />
              </svg>
              <div className="bcm-option-icon">
                <UserCircle2 size={24} strokeWidth={2.2} />
              </div>
              <div className="bcm-option-check">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                  <circle cx="12" cy="12" r="11" fill="#FF7518" />
                  <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="bcm-option-text">
              <span className="bcm-option-title">Walk-in Booking</span>
              <span className="bcm-option-desc">Customer is booking in person at the office.</span>
            </div>
            <span className="bcm-option-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>

          <button
            type="button"
            className={[
              'bcm-option',
              'bcm-option-assist',
              selectedMode === 'assist' ? 'bcm-option-selected' : '',
              selectedMode && selectedMode !== 'assist' ? 'bcm-option-dismissed' : '',
            ].join(' ').trim()}
            onClick={() => handleSelect('assist')}
          >
            <div className="bcm-option-art">
              <svg viewBox="0 0 300 220" className="bcm-art-svg" aria-hidden="true">
                <defs>
                  <linearGradient id="bcm-assist-sky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EAF3FF" />
                    <stop offset="100%" stopColor="#CFE1FB" />
                  </linearGradient>
                  <linearGradient id="bcm-assist-desk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D3E3F8" />
                    <stop offset="100%" stopColor="#B7CFEF" />
                  </linearGradient>
                  <linearGradient id="bcm-assist-monitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8FB3E6" />
                    <stop offset="100%" stopColor="#6E96D6" />
                  </linearGradient>
                  <radialGradient id="bcm-assist-glow" cx="50%" cy="30%" r="65%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect x="0" y="0" width="300" height="220" fill="url(#bcm-assist-sky)" />
                <rect x="0" y="0" width="300" height="220" fill="url(#bcm-assist-glow)" />
                <rect x="0" y="166" width="300" height="54" fill="#C3D9F5" />

                {/* speech bubble */}
                <rect x="196" y="26" width="70" height="42" rx="12" fill="#FFFFFF" opacity="0.9" />
                <path d="M214 68 l-10 14 v-14 Z" fill="#FFFFFF" opacity="0.9" />
                <circle cx="216" cy="46" r="4" fill="#9DB8DE" />
                <circle cx="231" cy="46" r="4" fill="#9DB8DE" />
                <circle cx="246" cy="46" r="4" fill="#9DB8DE" />

                {/* plant */}
                <ellipse cx="34" cy="176" rx="18" ry="9" fill="#5F9868" />
                <ellipse cx="24" cy="182" rx="12" ry="7" fill="#6FAE79" />
                <rect x="22" y="186" width="24" height="28" rx="3" fill="#6E96D6" opacity="0.8" />

                {/* desk */}
                <rect x="66" y="132" width="150" height="10" rx="3" fill="#E8F1FC" />
                <rect x="70" y="142" width="142" height="46" rx="6" fill="url(#bcm-assist-desk)" />

                {/* laptop */}
                <path d="M96 132 L104 96 L182 96 L190 132 Z" fill="#BFD4F1" />
                <rect x="100" y="100" width="82" height="32" rx="3" fill="url(#bcm-assist-monitor)" />
                <rect x="106" y="105" width="70" height="22" rx="2" fill="#FFFFFF" opacity="0.18" />
                <rect x="130" y="130" width="12" height="6" fill="#9EBBE6" />

                {/* headset agent */}
                <circle cx="235" cy="98" r="17" fill="#F6D9C4" />
                <path d="M218 92 q3 -22 20 -22 q19 0 20 20" fill="none" stroke="#4E71AC" strokeWidth="6" strokeLinecap="round" />
                <circle cx="218" cy="96" r="7" fill="#4E71AC" />
                <circle cx="255" cy="92" r="7" fill="#4E71AC" />
                <path d="M218 96 q3 18 20 19" fill="none" stroke="#4E71AC" strokeWidth="4.5" strokeLinecap="round" />
                <circle cx="238" cy="115" r="4.5" fill="#4E71AC" />
                <path d="M212 128 q23 -14 46 0 l4 24 h-54 Z" fill="#4E71AC" opacity="0.85" />

                {/* coffee cup */}
                <rect x="200" y="150" width="16" height="18" rx="3" fill="#FFFFFF" />
                <path d="M216 154 q8 0 8 6 q0 6 -8 6" fill="none" stroke="#B7CFEF" strokeWidth="3" />
              </svg>
              <div className="bcm-option-icon">
                <Headset size={24} strokeWidth={2.2} />
              </div>
              <div className="bcm-option-check">
                <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                  <circle cx="12" cy="12" r="11" fill="#3B6FD6" />
                  <path d="M7 12.5l3 3 7-7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="bcm-option-text">
              <span className="bcm-option-title">Assist a Customer</span>
              <span className="bcm-option-desc">Booking on the customer's behalf remotely (call, chat, etc.).</span>
            </div>
            <span className="bcm-option-arrow" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingChoiceModal;
