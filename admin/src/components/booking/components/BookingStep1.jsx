import React from 'react';
import { Users } from 'lucide-react';
import PassengerCard from './PassengerCard';

const BookingStep1 = ({
  // Destination
  selectedDestination, setSelectedDestination,
  destinations, filteredDestinations,
  destDropdownOpen, setDestDropdownOpen,
  destRef,
  resetDestinationRelated,

  // Package
  filteredPackages, selectedPackage, setSelectedPackage,
  updateField,

  // Package type flags
  isSoloPkg, isMinTwoPkg, isSoloJoinersPkg,
  handlePackageTypeDetect,

  // Pax
  paxCount, setPaxCount,
  addPassenger, removePassenger,

  // Date
  departureDate, setDepartureDate,
  isRestrictedDestination,
  isAllowedBookingDay,
  getAllowedDayLabel,
  getDurationDays,

  // Passengers
  formData,
  updatePassenger,
  handleDateOfBirthChange,
  handleDobPartChange,

  // Toast (passed down for date validation error)
  toast,
}) => {

  const allowedDayLabel = getAllowedDayLabel();

  return (
    <div className="nbm-step-panel">
      <h3 className="nbm-step-title">Trip Details</h3>
      <p className="nbm-step-subtitle">Fill in customer info, destination, package, and passengers.</p>

      {/* ── DESTINATION + PACKAGE card ── */}
      <div className="nbm-card">

        {/* Destination — Searchable dropdown */}
        <div className="nbm-field" style={{ marginTop: '16px' }} ref={destRef}>
          <label>Destination <span style={{ color: 'red' }}>*</span></label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={selectedDestination}
              onChange={e => {
                const val = e.target.value;
                setSelectedDestination(val);
                setDestDropdownOpen(true);
                if (val !== selectedDestination) resetDestinationRelated();
              }}
              onFocus={() => setDestDropdownOpen(true)}
              placeholder="Type to search destination..."
            />

            {destDropdownOpen && selectedDestination && filteredDestinations.length > 0 && (
              <div className="nbm-dest-dropdown">
                {filteredDestinations.map(dest => (
                  <div
                    key={dest}
                    className="nbm-dest-option"
                    onMouseDown={() => {
                      setSelectedDestination(dest);
                      resetDestinationRelated();
                      setDestDropdownOpen(false);
                    }}
                  >
                    <span className="nbm-dest-pin">📍</span> {dest}
                  </div>
                ))}
              </div>
            )}

            {destDropdownOpen && selectedDestination && filteredDestinations.length === 0 && (
              <div className="nbm-dest-dropdown">
                <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                  No destinations found
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Package dropdown — only when valid destination is selected */}
        {selectedDestination && destinations.includes(selectedDestination) && (
          <div className="nbm-field" style={{ marginTop: '16px' }}>
            <label>Package <span style={{ color: 'red' }}>*</span></label>
            <select
              value={selectedPackage?._id || ''}
              onChange={e => {
                const pkg = filteredPackages.find(p => p._id === e.target.value);
                if (pkg) {
                  setSelectedPackage(pkg);
                  setDepartureDate('');
                  const displayName = `${pkg.duration} ${pkg.destination} ${pkg.title}`;
                  updateField('packageName', displayName);
                  updateField('duration', pkg.duration);
                  handlePackageTypeDetect(pkg);
                  setSelectedDestination(pkg.destination);
                }
              }}
            >
              <option value="">Select Package</option>
              {filteredPackages.map(pkg => (
                <option key={pkg._id} value={pkg._id}>
                  {`${pkg.duration} ${pkg.destination} ${pkg.title}`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── PAX + DEPARTURE DATE — Trip Configuration Card ── */}
      {selectedPackage && (
        <div className="nbm-tripconfig-card">

          {/* Card Header */}
          <div className="nbm-tripconfig-header">
            <div className="nbm-tripconfig-icon">🗓️</div>
            <div>
              <div className="nbm-tripconfig-title">Trip Configuration</div>
              <div className="nbm-tripconfig-sub">Set number of travellers and preferred departure</div>
            </div>
          </div>

          {/* Two columns: Pax | Date */}
          <div className="nbm-tripconfig-grid">

            {/* LEFT — Number of Pax */}
            <div className="nbm-tripconfig-col">
              <div className="nbm-tripconfig-label-row">
                <span className="nbm-tripconfig-label">Number of Pax</span>
                {isSoloPkg       && <span className="nbm-badge nbm-badge-green">Solo</span>}
                {isMinTwoPkg     && <span className="nbm-badge nbm-badge-blue">Min. 2</span>}
                {isSoloJoinersPkg && <span className="nbm-badge nbm-badge-amber">Joiners</span>}
              </div>

              {isSoloPkg ? (
                <div className="nbm-pax-solo">1 Pax (Solo — Fixed)</div>
              ) : (
                <div className="nbm-pax-stepper">
                  <button
                    className="nbm-pax-stepper-btn"
                    onClick={() => {
                      const min = isMinTwoPkg ? 2 : 1;
                      if (paxCount > min) setPaxCount(paxCount - 1);
                    }}
                    disabled={paxCount <= (isMinTwoPkg ? 2 : 1)}
                  >−</button>
                  <div className="nbm-pax-stepper-val">
                    <span className="nbm-pax-stepper-num">{paxCount}</span>
                    <span className="nbm-pax-stepper-unit">pax</span>
                  </div>
                  <button
                    className="nbm-pax-stepper-btn"
                    onClick={() => setPaxCount(paxCount + 1)}
                  >+</button>
                </div>
              )}

              <div className="nbm-tripconfig-hint">
                {isSoloPkg    ? 'Fixed at 1 traveller'
                : isMinTwoPkg ? 'Minimum 2 travellers'
                :               'Add or remove travellers'}
              </div>
            </div>

            {/* Divider */}
            <div className="nbm-tripconfig-divider" />

            {/* RIGHT — Departure Date */}
            <div className="nbm-tripconfig-col">
              <div className="nbm-tripconfig-label-row">
                <span className="nbm-tripconfig-label">
                  Departure Date <span style={{ color: '#ef4444' }}>*</span>
                </span>
              </div>

              <div className="nbm-tripconfig-date-wrap">
                <span className="nbm-tripconfig-date-icon">📅</span>
                <input
                  type="date"
                  className="nbm-tripconfig-date-input"
                  value={departureDate}
                  onChange={e => {
                    const val = e.target.value;
                    if (isRestrictedDestination && !isAllowedBookingDay(val)) {
                      const label = getAllowedDayLabel();
                      toast.error(`This package departs on ${label} only.`);
                      return;
                    }
                    setDepartureDate(val);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {isRestrictedDestination && allowedDayLabel && (
                <div className="nbm-tripconfig-restrict">
                  📅 {allowedDayLabel}
                </div>
              )}

              <div className="nbm-tripconfig-hint">Select your travel start date</div>
            </div>
          </div>

          {/* Date preview strip */}
          {departureDate && (
            <div className="nbm-tripconfig-datestrip">
              <div className="nbm-tripconfig-datestrip-item">
                <span className="nbm-tripconfig-datestrip-emoji">✈️</span>
                <div>
                  <div className="nbm-tripconfig-datestrip-label">Departure</div>
                  <div className="nbm-tripconfig-datestrip-val">{departureDate}</div>
                </div>
              </div>
              <div className="nbm-tripconfig-datestrip-arrow">→</div>
              <div className="nbm-tripconfig-datestrip-item">
                <span className="nbm-tripconfig-datestrip-emoji">🏠</span>
                <div>
                  <div className="nbm-tripconfig-datestrip-label">Return</div>
                  <div className="nbm-tripconfig-datestrip-val">
                    {(() => {
                      const s = new Date(departureDate);
                      s.setDate(s.getDate() + getDurationDays(selectedPackage.duration) - 1);
                      return s.toISOString().split('T')[0];
                    })()}
                  </div>
                </div>
              </div>
              <div className="nbm-tripconfig-datestrip-pill">
                {selectedPackage.duration} · {getDurationDays(selectedPackage.duration)} days
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PASSENGERS ── */}
      <div style={{ marginTop: '16px', borderTop: '2px solid #e2e8f0', paddingTop: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}>
            <Users size={18} /> Passengers
          </h3>
          {!isSoloPkg && (
            <button className="nbm-btn-add-passenger" onClick={addPassenger}>
              + Add Passenger
            </button>
          )}
        </div>

        {formData.passengers.map((p, i) => (
          <PassengerCard
            key={i}
            passenger={p}
            index={i}
            updatePassenger={updatePassenger}
            handleDobPartChange={handleDobPartChange}
            totalPassengers={formData.passengers.length}
            removePassenger={removePassenger}
            isSoloPkg={isSoloPkg}
            isMinTwoPkg={isMinTwoPkg}
          />
        ))}
      </div>
    </div>
  );
};

export default BookingStep1;
