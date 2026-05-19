// cbf/steps/Step1BasicInfo.jsx
import React from 'react';
import { MapPin, User, Mail, Phone, Users } from 'lucide-react';
import DatePicker from './DatePicker';

/**
 * Step 1 — Basic Info
 * Collects destination, contact details, travel dates, and pax count.
 *
 * Props:
 *   info             – form values object
 *   infoErrors       – validation errors object
 *   allDestinations  – string[] for autocomplete
 *   showDestDropdown – boolean
 *   onInfoChange     – (field, value) => void
 *   onDestFocus      – () => void
 *   onDestBlur       – () => void
 *   onDestSelect     – (dest: string) => void
 *   setShowDestDropdown – (bool) => void
 */
export default function Step1BasicInfo({
  info,
  infoErrors,
  allDestinations,
  showDestDropdown,
  onInfoChange,
  onDestFocus,
  onDestBlur,
  onDestSelect,
  setShowDestDropdown,
}) {
  const today = new Date().toISOString().split('T')[0];

  const filteredDestinations = (() => {
    const q = info.destination.toLowerCase();
    return allDestinations.filter(d => d.toLowerCase().includes(q));
  })();

  return (
    <div className="cbf-section">
      <div className="cbf-section-title">
        <MapPin size={16} /> Where do you want to go?
      </div>

      <div className="cbf-form-grid">

        {/* ── Destination ── */}
        <div className="cbf-field cbf-full" style={{ position: 'relative' }}>
          <label>Destination <span className="cbf-req">*</span></label>
          <div className="cbf-input-wrap">
            <MapPin size={14} className="cbf-input-icon" />
            <input
              className={infoErrors.destination ? 'cbf-error' : ''}
              placeholder="e.g. Palawan, Cebu, Boracay"
              value={info.destination}
              autoComplete="off"
              onChange={e => {
                onInfoChange('destination', e.target.value);
                setShowDestDropdown(true);
              }}
              onFocus={onDestFocus}
              onBlur={onDestBlur}
            />
          </div>

          {/* Autocomplete dropdown */}
          {showDestDropdown && info.destination.trim() && filteredDestinations.length > 0 && (
            <div className="cbf-dest-dropdown">
              {filteredDestinations.map(d => (
                <button
                  key={d}
                  type="button"
                  className="cbf-dest-option"
                  onMouseDown={() => onDestSelect(d)}
                >
                  <MapPin size={12} /> {d}
                </button>
              ))}
            </div>
          )}
          {infoErrors.destination && (
            <span className="cbf-err-msg">{infoErrors.destination}</span>
          )}
        </div>

        {/* ── Full Name ── */}
        <div className="cbf-field">
          <label>Full Name <span className="cbf-req">*</span></label>
          <div className="cbf-input-wrap">
            <User size={14} className="cbf-input-icon" />
            <input
              className={infoErrors.fullName ? 'cbf-error' : ''}
              placeholder="Juan dela Cruz"
              value={info.fullName}
              onChange={e => onInfoChange('fullName', e.target.value)}
            />
          </div>
          {infoErrors.fullName && (
            <span className="cbf-err-msg">{infoErrors.fullName}</span>
          )}
        </div>

        {/* ── Email ── */}
        <div className="cbf-field">
          <label>Email Address <span className="cbf-req">*</span></label>
          <div className="cbf-input-wrap">
            <Mail size={14} className="cbf-input-icon" />
            <input
              type="email"
              className={infoErrors.email ? 'cbf-error' : ''}
              placeholder="juan@email.com"
              value={info.email}
              onChange={e => onInfoChange('email', e.target.value)}
            />
          </div>
          {infoErrors.email && (
            <span className="cbf-err-msg">{infoErrors.email}</span>
          )}
        </div>

        {/* ── Phone ── */}
        <div className="cbf-field">
          <label>Phone Number</label>
          <div className="cbf-input-wrap">
            <Phone size={14} className="cbf-input-icon" />
            <input
              placeholder="+63 9XX XXX XXXX"
              value={info.phone}
              onChange={e => onInfoChange('phone', e.target.value)}
            />
          </div>
        </div>

        {/* ── Travel Date ── */}
        <div className="cbf-field">
          <label>Travel Date <span className="cbf-req">*</span></label>
          <DatePicker
            value={info.travelDate}
            minDate={today}
            onChange={val =>
              onInfoChange('travelDate', val) ||
              // also clear returnDate if it falls before new travel date
              (info.returnDate && info.returnDate < val && onInfoChange('returnDate', ''))
            }
            hasError={!!infoErrors.travelDate}
            placeholder="Select travel date"
          />
          {infoErrors.travelDate && (
            <span className="cbf-err-msg">{infoErrors.travelDate}</span>
          )}
        </div>

        {/* ── Return Date ── */}
        <div className="cbf-field">
          <label>Return Date <span className="cbf-optional">(optional)</span></label>
          <DatePicker
            value={info.returnDate}
            minDate={info.travelDate || today}
            onChange={val => onInfoChange('returnDate', val)}
            placeholder="Select return date"
          />
        </div>

        {/* ── Pax Count ── */}
        <div className="cbf-field">
          <label>Number of Passengers <span className="cbf-req">*</span></label>
          <div className="cbf-input-wrap">
            <Users size={14} className="cbf-input-icon" />
            <input
              type="number"
              min="1"
              max="20"
              className={infoErrors.paxCount ? 'cbf-error' : ''}
              placeholder="e.g. 2"
              value={info.paxCount}
              onChange={e => {
                const v = e.target.value;
                onInfoChange(
                  'paxCount',
                  v === '' ? '' : Math.min(20, parseInt(v) || 1),
                );
              }}
            />
          </div>
          {infoErrors.paxCount && (
            <span className="cbf-err-msg">{infoErrors.paxCount}</span>
          )}
        </div>

        {/* ── Message ── */}
        <div className="cbf-field cbf-full">
          <label>
            Message / Notes <span className="cbf-optional">(optional)</span>
          </label>
          <textarea
            className="cbf-textarea"
            placeholder="Any special requests or information we should know..."
            value={info.message}
            rows={3}
            onChange={e => onInfoChange('message', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
