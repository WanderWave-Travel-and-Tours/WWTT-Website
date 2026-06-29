import React from 'react';
import { MapPin, Navigation, Calendar, Car, ArrowRightLeft, Clock, Users } from 'lucide-react';
import LocationSelect from '../../../location/LocationSelect';
import CustomTimePicker from '../../../timePicker/Clock';
import PassengerCard from './PassengerCard';
import { isLateNightTime } from '../utils/transferHelpers';

const TripDetailsStep = ({
  // destination
  destination, setDestination,
  showDestDropdown, setShowDestDropdown,
  destWrapperRef, destSuggestions,
  // pax & trip type
  paxCount, setPaxCount,
  tripType, setTripType,
  // transfer selection
  filteredTransfers, selectedTransfer, setSelectedTransfer,
  loadingTransfers,
  // dates & times
  travelDate, setTravelDate,
  returnDate, setReturnDate,
  arrivalTime, departureTime,
  handleArrivalTimeChange, handleDepartureTimeChange,
  // locations
  pickupLocation, setPickupLocation,
  dropoffLocation, setDropoffLocation,
  // passengers
  passengers, updatePassenger, handleDobPartChange,
  // surcharge
  totalSurcharge, arrivalSurcharge, departureSurcharge,
}) => {
  return (
    <>
      {/* ── Trip Details Card ── */}
      <div className="nbm-section-card">
        <div className="nbm-section-header">
          <div className="nbm-section-header-icon">
            <Navigation size={14} color="#fff" />
          </div>
          <div>
            <div className="nbm-section-header-title">Trip Details</div>
            <div className="nbm-section-header-sub">Destination, vehicle, and trip type</div>
          </div>
        </div>

        <div className="nbm-section-body">
          {/* Destination */}
          <div className="nbm-field">
            <label>Destination <span className="nbm-required">*</span></label>
            <div ref={destWrapperRef} style={{ position: 'relative' }}>
              <div className="nbm-input-icon-wrap">
                <MapPin size={15} className="nbm-input-icon" />
                <input
                  type="text"
                  className="nbm-input-with-icon"
                  value={destination}
                  onChange={e => { setDestination(e.target.value); setShowDestDropdown(true); }}
                  onFocus={() => destination.trim() && setShowDestDropdown(true)}
                  placeholder="e.g. Baguio, Boracay, Puerto Princesa..."
                  autoComplete="off"
                />
              </div>
              {showDestDropdown && destSuggestions.length > 0 && (
                <div className="nbm-dest-dropdown">
                  {destSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="nbm-dest-option"
                      onMouseDown={e => {
                        e.preventDefault();
                        setDestination(suggestion);
                        setShowDestDropdown(false);
                      }}
                    >
                      <MapPin size={14} style={{ flexShrink: 0, color: '#f59e0b' }} />
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pax + Trip Type */}
          <div className="nbm-row-2col">
            <div className="nbm-field">
              <label>Passengers <span className="nbm-required">*</span></label>
              <div className="nbm-pax-stepper">
                <button
                  className="nbm-pax-step-btn"
                  onClick={() => setPaxCount(p => Math.max(1, p - 1))}
                  disabled={paxCount <= 1}
                >−</button>
                <span className="nbm-pax-step-val">
                  {paxCount} <span className="nbm-pax-step-unit">pax</span>
                </span>
                <button className="nbm-pax-step-btn" onClick={() => setPaxCount(p => p + 1)}>+</button>
              </div>
            </div>

            <div className="nbm-field">
              <label>Trip Type <span className="nbm-required">*</span></label>
              <div className="nbm-segment-control">
                <button
                  className={`nbm-segment-btn${tripType === 'oneway' ? ' active' : ''}`}
                  onClick={() => setTripType('oneway')}
                >
                  One Way
                </button>
                <button
                  className={`nbm-segment-btn nbm-segment-btn-rt${tripType === 'roundtrip' ? ' active-rt' : ''}`}
                  onClick={() => setTripType('roundtrip')}
                >
                  Roundtrip
                </button>
              </div>
            </div>
          </div>

          {/* Transfer Selection */}
          <div className="nbm-field">
            <div className="nbm-field-label-row">
              <label>Select Transfer <span className="nbm-required">*</span></label>
              {destination && (
                <span className="nbm-field-hint">vehicles for {paxCount} pax</span>
              )}
            </div>
            {!destination.trim() ? (
              <div className="nbm-transfer-empty">
                <Navigation size={16} color="#cbd5e1" />
                <span>Enter a destination first to see available transfers</span>
              </div>
            ) : loadingTransfers ? (
              <div className="nbm-transfer-loading">Loading transfers...</div>
            ) : filteredTransfers.length === 0 ? (
              <div className="nbm-transfer-none">No transfers available for this destination / pax count</div>
            ) : (
              <div className="nbm-transfer-list">
                {filteredTransfers.map(t => {
                  const price = tripType === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
                  const isSelected = selectedTransfer?._id === t._id;
                  const hasRoundtrip = (t.roundtripPrice || 0) > 0;
                  if (tripType === 'roundtrip' && !hasRoundtrip) return null;
                  return (
                    <div
                      key={t._id}
                      onClick={() => setSelectedTransfer(t)}
                      className={`nbm-transfer-item${isSelected ? ' selected' : ''}`}
                    >
                      <div className={`nbm-transfer-radio${isSelected ? ' selected' : ''}`} />
                      <div className={`nbm-transfer-icon${isSelected ? ' selected' : ''}`}>
                        <Car size={15} color={isSelected ? '#fff' : '#94a3b8'} />
                      </div>
                      <div className="nbm-transfer-info">
                        <div className="nbm-transfer-name">{t.title}</div>
                        <div className="nbm-transfer-meta">
                          {t.category && <span className="nbm-transfer-tag">{t.category}</span>}
                          {t.pax      && <span className="nbm-transfer-tag">Up to {t.pax} pax</span>}
                        </div>
                      </div>
                      <div className="nbm-transfer-price-col">
                        <div className={`nbm-transfer-price${isSelected ? ' selected' : ''}`}>
                          ₱{price.toLocaleString()}
                        </div>
                        <div className="nbm-transfer-price-label">
                          {tripType === 'roundtrip' ? 'roundtrip' : 'one way'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Trip Configuration Card ── */}
      <div className="nbm-section-card" style={{ marginTop: 12 }}>
        <div className="nbm-section-header nbm-section-header-blue">
          <div className="nbm-section-header-icon nbm-section-header-icon-blue">
            <Calendar size={14} color="#fff" />
          </div>
          <div>
            <div className="nbm-section-header-title">Trip Configuration</div>
            <div className="nbm-section-header-sub">Schedule and pickup details</div>
          </div>
        </div>

        <div className="nbm-section-body">
          {/* Travel Date + Arrival Time */}
          <div className="nbm-row-2col">
            <div className="nbm-field">
              <label>Travel Date <span className="nbm-required">*</span></label>
              <input
                type="date"
                value={travelDate}
                onChange={e => setTravelDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="nbm-field">
              <label>
                Arrival Time <span className="nbm-required">*</span>
                {isLateNightTime(arrivalTime) && (
                  <span className="nbm-surcharge-badge">+₱500</span>
                )}
              </label>
              <CustomTimePicker
                value={arrivalTime}
                onChange={e => handleArrivalTimeChange(e.target.value)}
                placeholder="Select arrival time"
                required
              />
            </div>
          </div>

          {/* Pickup Location */}
          <div className="nbm-field">
            <label>Pickup Location <span className="nbm-required">*</span></label>
            <LocationSelect
              value={pickupLocation}
              onChange={val => setPickupLocation(val)}
              placeholder="e.g. NAIA Terminal 3, Hotel Name..."
              source="transfer"
            />
          </div>

          {/* Roundtrip: Return Date + Departure Time */}
          {tripType === 'roundtrip' && (
            <>
              <div className="nbm-roundtrip-divider">
                <ArrowRightLeft size={12} />
                <span>Return Trip</span>
              </div>
              <div className="nbm-row-2col">
                <div className="nbm-field">
                  <label>Return Date <span className="nbm-required">*</span></label>
                  <input
                    type="date"
                    value={returnDate}
                    onChange={e => setReturnDate(e.target.value)}
                    min={travelDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="nbm-field">
                  <label>
                    Departure Time <span className="nbm-required">*</span>
                    {isLateNightTime(departureTime) && (
                      <span className="nbm-surcharge-badge">+₱500</span>
                    )}
                  </label>
                  <CustomTimePicker
                    value={departureTime}
                    onChange={e => handleDepartureTimeChange(e.target.value)}
                    placeholder="Select departure time"
                    required
                  />
                </div>
              </div>
              <div className="nbm-field">
                <label>Dropoff Location <span className="nbm-required">*</span></label>
                <LocationSelect
                  value={dropoffLocation}
                  onChange={val => setDropoffLocation(val)}
                  placeholder="e.g. Return dropoff point..."
                  source="transfer"
                />
              </div>
            </>
          )}

          {/* Late night surcharge notice */}
          {totalSurcharge > 0 && (
            <div className="nbm-surcharge-notice">
              <Clock size={13} color="#dc2626" />
              <span>
                Late night surcharge applied
                {arrivalSurcharge > 0 && departureSurcharge > 0
                  ? ' (arrival + departure)'
                  : arrivalSurcharge > 0 ? ' (arrival)' : ' (departure)'}
              </span>
              <span className="nbm-surcharge-notice-amount">+₱{totalSurcharge.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Passengers Card ── */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div>
            <h3 className="nbm-step-title" style={{ marginBottom: 2 }}>Passenger Details</h3>
            <p className="nbm-step-subtitle" style={{ margin: 0 }}>
              Fill in info for all {paxCount} passenger{paxCount > 1 ? 's' : ''}.
            </p>
          </div>
        </div>

        {passengers.map((p, i) => (
          <PassengerCard
            key={i}
            index={i}
            passenger={p}
            total={passengers.length}
            onUpdate={updatePassenger}
            onDobChange={handleDobPartChange}
          />
        ))}
      </div>
    </>
  );
};

export default TripDetailsStep;
