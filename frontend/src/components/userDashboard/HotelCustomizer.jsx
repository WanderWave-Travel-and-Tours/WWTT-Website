import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Building2 } from 'lucide-react';
import HotelRoomSelector from '../packageDeals/hotelRoomSelector';
import './HotelCustomizer.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wanderwaveph.onrender.com';

// ─────────────────────────────────────────────────────────────
// DESTINATION → HOTEL LOCATION SEARCH TERM
// Maps the package destination to the string the hotel API
// endpoint expects in /api/hotels/location/:location/rooms
// ─────────────────────────────────────────────────────────────
const DEST_HOTEL_MAP = {
  'puerto princesa': 'Puerto Princesa',
  'el nido':         'El Nido',
  'coron palawan':   'Coron',
  'coron':           'Coron',
  'siargao':         'Siargao',
  'siquijor':        'Siquijor',
  'bohol':           'Bohol',
  'cebu':            'Cebu',
  'boracay':         'Boracay',
  'batanes':         'Batanes',
};

const resolveHotelLocation = (destination) => {
  if (!destination) return null;
  const lower = destination.toLowerCase();
  const keys = Object.keys(DEST_HOTEL_MAP).sort((a, b) => b.length - a.length);
  const match = keys.find(k => lower.includes(k));
  return match ? DEST_HOTEL_MAP[match] : null;
};

// ─────────────────────────────────────────────────────────────
// TIER PRICE LOGIC — mirrors bookingRightForm.jsx exactly
//
// Budget / Standard → ₱0 extra (included in base package price)
// 4-star            → ₱1,660 per room per night additional
// 5-star            → ₱2,500 per room per night additional
//
// This must stay in sync with calculateBasePackageTotal() and
// calculateHotelTotal() in bookingRightForm.jsx.
// ─────────────────────────────────────────────────────────────
const getPerNightRate = (roomType) => {
  const t = (roomType || '').toUpperCase();
  if (t.includes('5')) return 2500;
  if (t.includes('4')) return 1660;
  return 0; // Budget / Standard — no additional charge
};

// ─────────────────────────────────────────────────────────────
// NORMALIZE TYPE — HotelRoomSelector merges "Budget" into
// "Standard" for display purposes. We must resolve the saved
// booking.selectedRoomType (e.g. "Budget") to the grouped key
// (e.g. "Standard") so the isSelected highlight works correctly.
// ─────────────────────────────────────────────────────────────
const normalizeRoomTypeKey = (type) => {
  if (!type) return '';
  if (type.toLowerCase().includes('budget')) return 'Standard';
  return type;
};

// ─────────────────────────────────────────────────────────────
// HotelCustomizer
//
// Props:
//   booking              — full booking object from parent
//   onUpdate             — callback(updatedBooking) after save
//   packageDestination   — resolved destination string from BookingCustomizer
//   onHotelPriceChange   — callback(info) so BookingCustomizer price
//                          summary reflects pending hotel tier changes
// ─────────────────────────────────────────────────────────────
const HotelCustomizer = ({
  booking,
  onUpdate,
  packageDestination,
  onHotelPriceChange,
  // ── Unified save bar props ─────────────────────────────────
  // onHasUnsavedChanges(bool) — tells BookingCustomizer when hotel
  //   has pending changes so the unified save bar can appear/hide
  // saveRef — ref whose .current is set to handleSave so the parent
  //   can trigger the hotel save after confirm without prop drilling
  // discardRef — ref whose .current is set to handleDiscard so the
  //   parent can revert the hotel selection on unified Discard
  onHasUnsavedChanges,
  saveRef,
  discardRef,
}) => {
  const [roomTypes, setRoomTypes]               = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isLoading, setIsLoading]               = useState(false);
  const [isSaving, setIsSaving]                 = useState(false);
  const [error, setError]                       = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess]           = useState(false);

  const fetchedLocationRef = useRef('');
  const initialRoomTypeRef = useRef(null); // snapshot used for Discard

  // ── Resolve hotel location from package destination ──────────
  // Falls back to the raw packageDestination so destinations not in
  // DEST_HOTEL_MAP (e.g. international) can still fetch hotel data.
  const hotelLocation = resolveHotelLocation(packageDestination) || packageDestination || null;

  // ── Pax count for rooms calculation ───────────────────────────
  const numberOfPax =
    (booking?.pax?.adult || 1) +
    (booking?.pax?.children || 0);

  // ── Duration nights from booking.duration (e.g. "3D2N" → 2) ──
  const durationNights = (() => {
    const match = (booking?.duration || '').match(/(\d+)N/i);
    return match ? parseInt(match[1]) : 1;
  })();

  // ─────────────────────────────────────────────────────────────
  // EMIT PRICE INFO to parent BookingCustomizer
  //
  // Uses the same tier-rate logic as bookingRightForm.jsx so the
  // price summary stays consistent with what the booking form shows.
  // ─────────────────────────────────────────────────────────────
  const emitPriceChange = useCallback((roomType, isUnsaved) => {
    if (!onHotelPriceChange) return;

    const normalizedType = normalizeRoomTypeKey(roomType?.type || '');
    const pricePerNight  = getPerNightRate(normalizedType);
    const rooms          = roomType
      ? Math.ceil(numberOfPax / (roomType.capacity || 2))
      : 0;
    const totalHotelCost = pricePerNight * rooms * durationNights;

    onHotelPriceChange({
      pricePerNight,
      numberOfRooms:    rooms,
      durationNights,
      totalHotelCost,
      selectedRoomType: roomType,
      savedRoomType:    booking?.selectedRoomType || '',
      isUnsaved,
    });
  }, [numberOfPax, durationNights, onHotelPriceChange, booking?.selectedRoomType]);

  // ─────────────────────────────────────────────────────────────
  // AUTO-SELECT: resolve booking.selectedRoomType against the
  // loaded roomTypes array.
  //
  // KEY FIX: HotelRoomSelector groups "Budget" rooms under the
  // "Standard" display key. The saved booking.selectedRoomType
  // may be "Budget", so a direct .type match fails — the card
  // never highlights. We find the correct room by:
  //   1. Exact type match (e.g. "Standard" === "Standard")
  //   2. Normalized match (Budget → Standard group)
  //   3. Fallback to first Budget/Standard room in the list
  // ─────────────────────────────────────────────────────────────
  const tryAutoSelect = useCallback((rooms, savedRoomType) => {
    if (!rooms.length) return;

    let match = null;

    if (savedRoomType) {
      const savedLower     = savedRoomType.toLowerCase();
      const savedNormalized = normalizeRoomTypeKey(savedRoomType).toLowerCase();

      // 1. Exact match
      match = rooms.find(r => r.type?.toLowerCase() === savedLower);

      // 2. Normalized match (e.g. saved "Budget" → find first "Standard" room)
      if (!match) {
        match = rooms.find(r =>
          normalizeRoomTypeKey(r.type).toLowerCase() === savedNormalized
        );
      }
    }

    // 3. Default: prefer Budget tier, then Standard, then cheapest
    if (!match) {
      match =
        rooms.find(r => r.type?.toLowerCase().includes('budget')) ||
        rooms.find(r => r.type?.toLowerCase().includes('standard')) ||
        [...rooms].sort((a, b) => a.price - b.price)[0];
    }

    if (match) {
      // ✅ KEY FIX: HotelRoomSelector groups "Budget" rooms under the "Standard"
      // display key and checks isSelected via selectedRoomType?.type === groupKey.
      // If we pass the raw { type: "Budget" } object, the card never highlights
      // because "Budget" !== "Standard". We normalize the type to the grouped key
      // so the selector's isSelected check passes correctly.
      const normalizedMatch = {
        ...match,
        type: normalizeRoomTypeKey(match.type),
      };
      setSelectedRoomType(normalizedMatch);
      initialRoomTypeRef.current = normalizedMatch;
      // Emit saved cost (isUnsaved=false) so price summary is correct on load
      emitPriceChange(normalizedMatch, false);
    }
  }, [emitPriceChange]);

  // ─────────────────────────────────────────────────────────────
  // FETCH HOTEL ROOM TYPES for the resolved location
  // ─────────────────────────────────────────────────────────────
  const fetchHotelRooms = useCallback(async (location) => {
    if (!location) return;
    if (fetchedLocationRef.current === location) return;

    setIsLoading(true);
    setError('');
    fetchedLocationRef.current = location;

    try {
      const res  = await fetch(`${API_BASE_URL}/api/hotels/location/${encodeURIComponent(location)}/rooms`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setRoomTypes(data.data);
        tryAutoSelect(data.data, booking?.selectedRoomType);
      } else {
        setRoomTypes([]);
        setError(`No hotels found for ${location}.`);
      }
    } catch (err) {
      console.error('❌ Error fetching hotel rooms:', err);
      setError('Failed to load hotel options. Please try again.');
      fetchedLocationRef.current = '';
    } finally {
      setIsLoading(false);
    }
  }, [booking?.selectedRoomType, tryAutoSelect]);

  useEffect(() => {
    if (hotelLocation) {
      fetchHotelRooms(hotelLocation);
    }
  }, [hotelLocation, fetchHotelRooms]);

  // ─────────────────────────────────────────────────────────────
  // RE-APPLY AUTO-SELECT when booking.selectedRoomType changes
  // (e.g. after onUpdate fires and the booking prop refreshes).
  // Rooms are already loaded — just re-match against the list.
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (roomTypes.length > 0 && booking?.selectedRoomType) {
      tryAutoSelect(roomTypes, booking.selectedRoomType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking?.selectedRoomType]);

  // ─────────────────────────────────────────────────────────────
  // HANDLE ROOM TYPE SELECTION (user clicks a card)
  // ─────────────────────────────────────────────────────────────
  const handleRoomTypeChange = (roomType) => {
    setSelectedRoomType(roomType);
    setSaveSuccess(false);

    // Compare normalized types so Budget vs Standard doesn't produce
    // a false "unsaved" when the saved value is effectively the same tier
    const savedNormalized   = normalizeRoomTypeKey(booking?.selectedRoomType || '');
    const selectedNormalized = normalizeRoomTypeKey(roomType?.type || '');
    const isUnsaved         = selectedNormalized !== savedNormalized;
    setHasUnsavedChanges(isUnsaved);
    if (onHasUnsavedChanges) onHasUnsavedChanges(isUnsaved);

    emitPriceChange(roomType, isUnsaved);
  };

  // ─────────────────────────────────────────────────────────────
  // SAVE HOTEL SELECTION TO BACKEND
  // ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!booking?._id || !selectedRoomType) return;

    setIsSaving(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${booking._id}/hotel`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedRoomType: selectedRoomType.type,
          hotelName:        selectedRoomType.hotelName || '',
          numberOfRooms:    Math.ceil(numberOfPax / (selectedRoomType.capacity || 2)),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      console.log('✅ Hotel selection saved:', data);

      setSaveSuccess(true);
      setHasUnsavedChanges(false);
      if (onHasUnsavedChanges) onHasUnsavedChanges(false);
      initialRoomTypeRef.current = selectedRoomType;

      // After save the hotel is no longer unsaved
      emitPriceChange(selectedRoomType, false);

      if (onUpdate) {
        const bookingData = data.booking || data;
        onUpdate(bookingData);
      }

      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('❌ Error saving hotel selection:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DISCARD — revert to last saved selection
  // ─────────────────────────────────────────────────────────────
  const handleDiscard = () => {
    const reverted = initialRoomTypeRef.current;
    setSelectedRoomType(reverted);
    setHasUnsavedChanges(false);
    if (onHasUnsavedChanges) onHasUnsavedChanges(false);
    setError('');
    setSaveSuccess(false);
    emitPriceChange(reverted, false);
  };

  // ── Expose save/discard to parent via refs ────────────────────
  // Called on every render so refs always point to the latest closures
  useEffect(() => {
    if (saveRef)    saveRef.current    = handleSave;
    if (discardRef) discardRef.current = handleDiscard;
  });

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  if (!hotelLocation) {
    const hasSavedHotel = booking?.selectedRoomType || booking?.hotelName;
    return (
      <div className="hc-container">
        <div className="hc-header">
          <span className="hc-header-accent" />
          <Building2 size={22} color="#3b82f6" style={{ flexShrink: 0, marginRight: 8 }} />
          <h3 className="hc-header-title">HOTEL SELECTION</h3>
          {booking?.selectedRoomType && (
            <span className="hc-current-badge">
              Current: {booking.selectedRoomType}
            </span>
          )}
        </div>
        {hasSavedHotel ? (
          <div className="hc-selection-summary" style={{ margin: '12px' }}>
            {booking?.selectedRoomType && (
              <div className="hc-summary-row">
                <span className="hc-summary-label">Selected Tier</span>
                <span className="hc-summary-value">{booking.selectedRoomType}</span>
              </div>
            )}
            {booking?.hotelName && (
              <div className="hc-summary-row">
                <span className="hc-summary-label">Hotel</span>
                <span className="hc-summary-value">{booking.hotelName}</span>
              </div>
            )}
            {booking?.numberOfRooms && (
              <div className="hc-summary-row">
                <span className="hc-summary-label">Rooms Needed</span>
                <span className="hc-summary-value">
                  {booking.numberOfRooms} room{booking.numberOfRooms > 1 ? 's' : ''}
                </span>
              </div>
            )}
            <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
              Hotel selection editing is not available for this destination.
            </p>
          </div>
        ) : (
          <div className="hc-empty">
            <Building2 size={36} color="#cbd5e1" />
            <p>Hotel selection is not available for this destination.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="hc-container">
      {/* ── Header ── */}
      <div className="hc-header">
        <span className="hc-header-accent" />
        <Building2 size={22} color="#3b82f6" style={{ flexShrink: 0, marginRight: 8 }} />
        <h3 className="hc-header-title">HOTEL SELECTION</h3>
        {booking?.selectedRoomType && (
          <span className="hc-current-badge">
            Current: {booking.selectedRoomType}
          </span>
        )}
      </div>

      {/* ── Location tag ── */}
      <div className="hc-location-tag">
        📍 {hotelLocation}
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="hc-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* ── Loading ── */}
      {isLoading ? (
        <div className="hc-loading">
          <div className="hc-spinner" />
          <p>Loading hotel options...</p>
        </div>
      ) : roomTypes.length > 0 ? (
        <>
          {/* ── HotelRoomSelector ── */}
          {/* ✅ KEY FIX: HotelRoomSelector groups "Budget" rooms under the
               "Standard" display key and checks isSelected via
               selectedRoomType?.type === groupKey ("Standard").
               We must normalize the type we pass in so that a booking
               with selectedRoomType.type === "Budget" correctly highlights
               the Budget Accommodations card. We only normalize the prop
               passed to the child — the real selectedRoomType state in
               HotelCustomizer keeps the raw type for accurate DB saves. */}
          <div className="hc-selector-wrap">
            <HotelRoomSelector
              roomTypes={roomTypes}
              selectedRoomType={
                selectedRoomType
                  ? { ...selectedRoomType, type: normalizeRoomTypeKey(selectedRoomType.type) }
                  : null
              }
              onRoomTypeChange={handleRoomTypeChange}
              durationNights={durationNights}
              numberOfPax={numberOfPax}
            />
          </div>

          {/* ── Selected Room Summary ── */}
          {selectedRoomType && (
            <div className="hc-selection-summary">
              <div className="hc-summary-row">
                <span className="hc-summary-label">Selected Tier</span>
                <span className="hc-summary-value">
                  {/* Show normalized display name matching HotelRoomSelector */}
                  {normalizeRoomTypeKey(selectedRoomType.type)}
                </span>
              </div>
              {selectedRoomType.hotelName && (
                <div className="hc-summary-row">
                  <span className="hc-summary-label">Hotel</span>
                  <span className="hc-summary-value">{selectedRoomType.hotelName}</span>
                </div>
              )}
              <div className="hc-summary-row">
                <span className="hc-summary-label">Rooms Needed</span>
                <span className="hc-summary-value">
                  {Math.ceil(numberOfPax / (selectedRoomType.capacity || 2))} room
                  {Math.ceil(numberOfPax / (selectedRoomType.capacity || 2)) > 1 ? 's' : ''}
                </span>
              </div>
              {/* Show additional cost only when tier carries a surcharge */}
              {getPerNightRate(normalizeRoomTypeKey(selectedRoomType.type)) > 0 && (
                <div className="hc-summary-row">
                  <span className="hc-summary-label">Hotel Surcharge</span>
                  <span className="hc-summary-value" style={{ color: '#b45309' }}>
                    +₱{(
                      getPerNightRate(normalizeRoomTypeKey(selectedRoomType.type)) *
                      Math.ceil(numberOfPax / (selectedRoomType.capacity || 2)) *
                      durationNights
                    ).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ── Success message ── */}
          {saveSuccess && (
            <div className="hc-success-bar">
              ✅ Hotel selection saved successfully!
            </div>
          )}
        </>
      ) : !isLoading && !error ? (
        <div className="hc-empty">
          <Building2 size={36} color="#cbd5e1" />
          <p>No hotel options available for {hotelLocation}.</p>
          <p className="hc-empty-hint">Contact admin to add hotels for this destination.</p>
        </div>
      ) : null}
    </div>
  );
};

export default HotelCustomizer;