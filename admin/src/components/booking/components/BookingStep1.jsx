import React, { useState, useRef, useEffect } from 'react';
import { Users, UserPlus, MapPin, Clock, Tag, CheckCircle, Info, ChevronDown, Package as PackageIcon } from 'lucide-react';
import PassengerCard from './PassengerCard';
import TripDateCalendar from './TripDateCalendar';
import PackageCustomizer from './PackageCustomizer';
import { detectPackageTypeInfo, isCustomizableDestination } from '../utils/bookingUtils';

// Some package titles already bake in their duration/destination (e.g.
// "4D3N Da Nang, Vietnam Solo"), so blindly prepending both again produces
// visible duplication in the dropdown. Only prepend what's not already there.
const buildPackageDisplayName = (pkg) => {
  const title = pkg.title || '';
  const titleLower = title.toLowerCase();
  const parts = [];
  if (pkg.duration && !titleLower.includes(pkg.duration.toLowerCase())) parts.push(pkg.duration);
  if (pkg.destination && !titleLower.includes(pkg.destination.toLowerCase())) parts.push(pkg.destination);
  parts.push(title);
  return parts.join(' ');
};

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
  handleFileUpload,
  removeFile,
  openCropper,
  handleDateOfBirthChange,
  handleDobPartChange,

  // Document requirements
  isInternational,

  // Package customization
  customizationData, setCustomizationData,

  // Toast (passed down for date validation error)
  toast,
}) => {

  const allowedDayLabel = getAllowedDayLabel();

  const [pkgDropdownOpen, setPkgDropdownOpen] = useState(false);
  const pkgRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pkgRef.current && !pkgRef.current.contains(e.target)) {
        setPkgDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const packageBadge = (pkg) => {
    const { isSoloPkg: solo, isMinTwoPkg: minTwo, isSoloJoinersPkg: joiners } = detectPackageTypeInfo(pkg);
    if (solo) return { label: 'Solo', className: 'nbm-badge-green' };
    if (minTwo) return { label: 'Min. 2', className: 'nbm-badge-blue' };
    if (joiners) return { label: 'Joiners', className: 'nbm-badge-amber' };
    return null;
  };

  return (
    <div className="nbm-step-panel">
      <h3 className="nbm-step-title">Trip Details</h3>
      <p className="nbm-step-subtitle">Fill in customer info, destination, package, and passengers.</p>

      {/* ── TRIP DETAILS card: Destination, Package, Departure Date, Package Details ── */}
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
          <div className="nbm-field" style={{ marginTop: '16px' }} ref={pkgRef}>
            <label>Package <span style={{ color: 'red' }}>*</span></label>
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className="nbm-pkg-trigger"
                onClick={() => setPkgDropdownOpen(prev => !prev)}
              >
                <span className={selectedPackage ? 'nbm-pkg-trigger-value' : 'nbm-pkg-trigger-placeholder'}>
                  {selectedPackage ? buildPackageDisplayName(selectedPackage) : 'Select Package'}
                </span>
                <ChevronDown size={18} className={`nbm-pkg-trigger-icon ${pkgDropdownOpen ? 'open' : ''}`} />
              </button>

              {pkgDropdownOpen && (
                <div className="nbm-pkg-dropdown">
                  {filteredPackages.length === 0 && (
                    <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
                      No packages found
                    </div>
                  )}
                  {filteredPackages.map(pkg => {
                    const badge = packageBadge(pkg);
                    const isSelected = selectedPackage?._id === pkg._id;
                    return (
                      <div
                        key={pkg._id}
                        className={`nbm-pkg-option ${isSelected ? 'selected' : ''}`}
                        onMouseDown={() => {
                          setSelectedPackage(pkg);
                          setDepartureDate('');
                          const displayName = buildPackageDisplayName(pkg);
                          updateField('packageName', displayName);
                          updateField('duration', pkg.duration);
                          handlePackageTypeDetect(pkg);
                          setSelectedDestination(pkg.destination);
                          setPkgDropdownOpen(false);
                          setCustomizationData(null);
                        }}
                      >
                        <PackageIcon size={16} className="nbm-pkg-option-icon" />
                        <div className="nbm-pkg-option-info">
                          <span className="nbm-pkg-option-title">{buildPackageDisplayName(pkg)}</span>
                          <span className="nbm-pkg-option-price">₱{(pkg.price || 0).toLocaleString()} / per pax</span>
                        </div>
                        {badge && <span className={`nbm-badge ${badge.className}`}>{badge.label}</span>}
                        {isSelected && <CheckCircle size={16} className="nbm-pkg-option-check" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Departure date + package details — only once a package is chosen */}
        {selectedPackage && (
          <div className="nbm-tripconfig-body nbm-tripconfig-body-split">

            <div className="nbm-tripconfig-cal-col">
              {isRestrictedDestination && allowedDayLabel && (
                <div className="nbm-tripconfig-cal-meta">
                  <span className="nbm-tripconfig-hint">Available: {allowedDayLabel}</span>
                </div>
              )}
              <TripDateCalendar
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
                durationDays={getDurationDays(selectedPackage.duration)}
                isDateAllowed={(dateStr) => !isRestrictedDestination || isAllowedBookingDay(dateStr)}
                showSelectedDisplay={false}
                imageUrl={selectedPackage.image}
                imageAlt={selectedPackage.title}
              />
            </div>

            <div className="nbm-pkgdetails-col">

              {(isSoloJoinersPkg || isSoloPkg || isMinTwoPkg) && (
                <div className="nbm-pkgdetails-toprow">
                  {isSoloJoinersPkg
                    ? <span className="nbm-badge nbm-badge-amber">Joiners</span>
                    : isSoloPkg
                      ? <span className="nbm-badge nbm-badge-green">Solo Pax</span>
                      : <span className="nbm-badge nbm-badge-blue">Min. 2 Pax</span>}
                </div>
              )}

              <div className="nbm-pkgdetails-title-wrap">
                <h4 className="nbm-pkgdetails-title">{selectedPackage.title}</h4>
              </div>

              <div className="nbm-pkgdetails-info">
                <div className="nbm-pkgdetails-row">
                  <MapPin size={16} className="nbm-pkgdetails-row-icon" />
                  <div>
                    <span className="nbm-pkgdetails-row-label">Destination</span>
                    <strong>{selectedPackage.destination}</strong>
                  </div>
                </div>
                <div className="nbm-pkgdetails-row">
                  <Clock size={16} className="nbm-pkgdetails-row-icon" />
                  <div>
                    <span className="nbm-pkgdetails-row-label">Duration</span>
                    <strong>
                      {selectedPackage.duration}
                      {' '}({getDurationDays(selectedPackage.duration)} Days, {Math.max(getDurationDays(selectedPackage.duration) - 1, 0)} Nights)
                    </strong>
                  </div>
                </div>
                <div className="nbm-pkgdetails-row">
                  <Tag size={16} className="nbm-pkgdetails-row-icon" />
                  <div>
                    <span className="nbm-pkgdetails-row-label">Package Price</span>
                    <strong className="nbm-pkgdetails-price">
                      {customizationData && customizationData.additionalPrice !== 0 && (
                        <span className="nbm-pkgdetails-price-original">₱{(selectedPackage.price || 0).toLocaleString()}</span>
                      )}
                      ₱{(customizationData ? customizationData.totalPrice : (selectedPackage.price || 0)).toLocaleString()}
                      <span className="nbm-pkgdetails-price-suffix"> / per pax</span>
                    </strong>
                  </div>
                </div>
              </div>

              {isCustomizableDestination(selectedPackage.destination) ? (
                <PackageCustomizer
                  key={selectedPackage._id}
                  pkg={selectedPackage}
                  onCustomizationChange={setCustomizationData}
                />
              ) : (
                Array.isArray(selectedPackage.inclusions) && selectedPackage.inclusions.length > 0 && (
                  <div className="nbm-pkgdetails-inclusions">
                    <div className="nbm-pkgdetails-inclusions-title">Inclusions</div>
                    <ul className="nbm-pkgdetails-inclusions-list">
                      {selectedPackage.inclusions.map((item, idx) => (
                        <li key={idx}>
                          <CheckCircle size={14} /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              )}

              {isMinTwoPkg && (
                <div className="nbm-pkgdetails-remarks">
                  <Info size={15} className="nbm-pkgdetails-remarks-icon" />
                  <div>
                    <div className="nbm-pkgdetails-remarks-title">Remarks</div>
                    <div className="nbm-pkgdetails-remarks-text">Minimum of 2 pax to avail this package.</div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── PASSENGERS ── */}
      <div style={{ marginTop: '16px', borderTop: '2px solid #e2e8f0', paddingTop: '14px' }}>
        <h3 style={{ margin: '0 0 14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}>
          <Users size={18} /> Passengers
        </h3>

        {formData.passengers.map((p, i) => (
          <PassengerCard
            key={i}
            passenger={p}
            index={i}
            updatePassenger={updatePassenger}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
            openCropper={openCropper}
            handleDobPartChange={handleDobPartChange}
            totalPassengers={formData.passengers.length}
            removePassenger={removePassenger}
            isSoloPkg={isSoloPkg}
            isMinTwoPkg={isMinTwoPkg}
            isInternational={isInternational}
          />
        ))}

        {!isSoloPkg && (
          <button className="nbm-btn-add-more-passengers" onClick={addPassenger}>
            <UserPlus size={16} /> Add More Passengers
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingStep1;
