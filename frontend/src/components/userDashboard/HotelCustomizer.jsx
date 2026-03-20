import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle, Building2, RotateCcw } from 'lucide-react';
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
  // Longest-first match so "puerto princesa" beats "princesa"
  const keys = Object.keys(DEST_HOTEL_MAP).sort((a, b) => b.length - a.length);
  const match = keys.find(k => lower.includes(k));
  return match ? DEST_HOTEL_MAP[match] : null;
};

// ─────────────────────────────────────────────────────────────
// HotelCustomizer
//
// Props:
//   booking            — the full booking object from parent
//   onUpdate           — callback(updatedBooking) after save
//   packageDestination — resolved destination string from BookingCustomizer
// ─────────────────────────────────────────────────────────────
const HotelCustomizer = ({ booking, onUpdate, packageDestination }) => {
  const [roomTypes, setRoomTypes]           = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [isSaving, setIsSaving]             = useState(false);
  const [error, setError]                   = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess]       = useState(false);

  const fetchedLocationRef = useRef('');
  const initialRoomTypeRef = useRef(null); // snapshot for discard

  // ── Resolve hotel location from package destination ──────────
  const hotelLocation = resolveHotelLocation(packageDestination);

  // ── Derive pax count for room calculation ─────────────────────
  const numberOfPax =
    (booking?.pax?.adult || 1) +
    (booking?.pax?.children || 0);

  // ── Derive duration nights from booking.duration (e.g. "3D2N" → 2) ──
  const durationNights = (() => {
    const match = (booking?.duration || '').match(/(\d+)N/i);
    return match ? parseInt(match[1]) : 1;
  })();

  // ─────────────────────────────────────────────────────────────
  // FETCH HOTEL ROOM TYPES for the resolved location
  // ─────────────────────────────────────────────────────────────
  const fetchHotelRooms = useCallback(async (location) => {
    if (!location) return;
    if (fetchedLocationRef.current === location) return; // already fetched

    setIsLoading(true);
    setError('');
    fetchedLocationRef.current = location;

    try {
      const res  = await fetch(`${API_BASE_URL}/api/hotels/location/${encodeURIComponent(location)}/rooms`);
      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        setRoomTypes(data.data);

        // Pre-select the room type currently saved on the booking (if any)
        if (booking?.selectedRoomType) {
          const match = data.data.find(r =>
            r.type?.toLowerCase() === booking.selectedRoomType.toLowerCase()
          );
          if (match) {
            setSelectedRoomType(match);
            initialRoomTypeRef.current = match;
          }
        }
      } else {
        setRoomTypes([]);
        setError(`No hotels found for ${location}.`);
      }
    } catch (err) {
      console.error('❌ Error fetching hotel rooms:', err);
      setError('Failed to load hotel options. Please try again.');
      fetchedLocationRef.current = ''; // allow retry
    } finally {
      setIsLoading(false);
    }
  }, [booking?.selectedRoomType]);

  useEffect(() => {
    if (hotelLocation) {
      fetchHotelRooms(hotelLocation);
    }
  }, [hotelLocation, fetchHotelRooms]);

  // ─────────────────────────────────────────────────────────────
  // HANDLE ROOM TYPE SELECTION
  // ─────────────────────────────────────────────────────────────
  const handleRoomTypeChange = (roomType) => {
    setSelectedRoomType(roomType);
    setSaveSuccess(false);

    // Mark unsaved only if it's actually different from what's saved on booking
    const currentSaved = booking?.selectedRoomType || '';
    const newType      = roomType?.type || '';
    setHasUnsavedChanges(newType !== currentSaved);
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
      initialRoomTypeRef.current = selectedRoomType;

      if (onUpdate) {
        const bookingData = data.booking || data;
        onUpdate(bookingData);
      }

      // Clear success indicator after 3s
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('❌ Error saving hotel selection:', err);
      setError(`Failed to save: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // DISCARD
  // ─────────────────────────────────────────────────────────────
  const handleDiscard = () => {
    setSelectedRoomType(initialRoomTypeRef.current);
    setHasUnsavedChanges(false);
    setError('');
    setSaveSuccess(false);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  // If no resolved hotel location, show nothing (destination not supported)
  if (!hotelLocation) {
    return (
      <div className="hc-container">
        <div className="hc-header">
          <span className="hc-header-accent" />
          <h3 className="hc-header-title">HOTEL SELECTION</h3>
        </div>
        <div className="hc-empty">
          <Building2 size={36} color="#cbd5e1" />
          <p>Hotel selection is not available for this destination.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hc-container">
      {/* ── Header ── */}
      <div className="hc-header">
        <span className="hc-header-accent" />
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
          {/* ── HotelRoomSelector (existing component) ── */}
          <div className="hc-selector-wrap">
            <HotelRoomSelector
              roomTypes={roomTypes}
              selectedRoomType={selectedRoomType}
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
                <span className="hc-summary-value">{selectedRoomType.type}</span>
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
                  {Math.ceil(numberOfPax / (selectedRoomType.capacity || 2))} room{Math.ceil(numberOfPax / (selectedRoomType.capacity || 2)) > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* ── Save / Discard bar ── */}
          {hasUnsavedChanges && (
            <div className="hc-save-bar">
              <p className="hc-save-bar-note">
                You have an unsaved hotel selection.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="hc-discard-btn"
                  onClick={handleDiscard}
                  disabled={isSaving}
                >
                  <span>✕</span> Discard
                </button>
                <button
                  className="hc-save-btn"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <><div className="hc-spinner-sm" /> Saving...</>
                  ) : (
                    <><CheckCircle size={14} /> Save Hotel</>
                  )}
                </button>
              </div>
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
