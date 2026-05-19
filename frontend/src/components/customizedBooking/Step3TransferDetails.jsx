// cbf/steps/Step3TransferDetails.jsx
import React from 'react';
import { MapPin, Users, Mail, User, Calendar, Car, Clock, FileText } from 'lucide-react';
import CustomTimePicker from '../timePicker/Clock';
import LocationSelect   from '../location/LocationSelect';
import { fmt, fmtDate, isNightHour } from './utils';

/**
 * Step 3 Phase B — collect scheduling details for each selected transfer.
 *
 * Props:
 *   currentTransfer  – Transfer object
 *   transferTypes    – { [id]: 'oneway' | 'roundtrip' }
 *   detailForm       – { arrivalTime, departureTime, pickupLocation, dropoffLocation, message }
 *   detailsIdx       – number
 *   totalTransfers   – number
 *   info             – { travelDate, returnDate, destination, paxCount, fullName, email }
 *   onDetailChange   – (field, value) => void
 *   onNightTimeAttempt – (field, pendingValue) => void
 */
export default function Step3TransferDetails({
  currentTransfer,
  transferTypes,
  detailForm,
  detailsIdx,
  totalTransfers,
  info,
  onDetailChange,
  onNightTimeAttempt,
}) {
  if (!currentTransfer) return null;

  const isRoundtrip = transferTypes[currentTransfer._id] === 'roundtrip';

  const handleTimeChange = (field, val) => {
    if (val && isNightHour(val)) {
      onNightTimeAttempt(field, val);
    } else {
      onDetailChange(field, val);
    }
  };

  return (
    <div className="cbf-section">

      {/* ── Transfer Hero Card ── */}
      <div className="cbf-t-hero-card">
        {currentTransfer.imageUrl ? (
          <img
            src={currentTransfer.imageUrl}
            alt={currentTransfer.title}
            className="cbf-t-hero-bg"
          />
        ) : (
          <div className="cbf-t-hero-bg cbf-t-hero-bg-placeholder">🚐</div>
        )}
        <div className="cbf-t-hero-scrim" />
        <div className="cbf-t-hero-content">
          {/* Top row: badges + price */}
          <div className="cbf-t-hero-top">
            <div className="cbf-t-badges-row">
              {currentTransfer.category && (
                <span className="cbf-t-badge-cat">{currentTransfer.category}</span>
              )}
              <span className={`cbf-t-badge-type ${isRoundtrip ? 'rt' : 'ow'}`}>
                {isRoundtrip ? '🔄 Round Trip' : '➡️ One Way'}
              </span>
            </div>
            <span className="cbf-t-price-badge">
              ₱{Number(
                isRoundtrip
                  ? currentTransfer.roundtripPrice
                  : currentTransfer.oneWayPrice
              ).toLocaleString()}
            </span>
          </div>

          {/* Bottom: route from → to */}
          <div className="cbf-t-route-row">
            <div className="cbf-t-route-point">
              <div className="cbf-t-route-city">
                {currentTransfer.fromCity || currentTransfer.origin || 'Manila'}
              </div>
              {(currentTransfer.fromTerminal || currentTransfer.fromArea) && (
                <div className="cbf-t-route-sub">
                  {currentTransfer.fromTerminal || currentTransfer.fromArea}
                </div>
              )}
            </div>
            <div className="cbf-t-route-mid">
              <Car size={12} />
              {currentTransfer.duration && (
                <span className="cbf-t-route-dur">~{currentTransfer.duration}</span>
              )}
            </div>
            <div className="cbf-t-route-point cbf-t-route-point-right">
              <div className="cbf-t-route-city">
                {currentTransfer.toCity || currentTransfer.packageDestination || info.destination}
              </div>
              {(currentTransfer.toArea || currentTransfer.toTerminal) && (
                <div className="cbf-t-route-sub">
                  {currentTransfer.toArea || currentTransfer.toTerminal}
                </div>
              )}
            </div>
          </div>
        </div>

        {totalTransfers > 1 && (
          <div className="cbf-t-hero-counter">{detailsIdx + 1} / {totalTransfers}</div>
        )}
      </div>

      {/* ── Booking Context ── */}
      <div className="cbf-bctx-section-label" style={{ marginBottom: '6px' }}>BOOKING CONTEXT</div>
      <div className="cbf-info-card-grid" style={{ marginBottom: '10px' }}>
        {info.travelDate && (
          <div className="cbf-info-card">
            <div className="cbf-ic-icon-wrap date"><Calendar size={13} /></div>
            <div className="cbf-ic-body">
              <span className="cbf-ic-label">Travel Date</span>
              <strong className="cbf-ic-value">{fmtDate(info.travelDate)}</strong>
            </div>
          </div>
        )}
        {isRoundtrip && info.returnDate && (
          <div className="cbf-info-card">
            <div className="cbf-ic-icon-wrap date"><Calendar size={13} /></div>
            <div className="cbf-ic-body">
              <span className="cbf-ic-label">Return Date</span>
              <strong className="cbf-ic-value">{fmtDate(info.returnDate)}</strong>
            </div>
          </div>
        )}
        <div className="cbf-info-card">
          <div className="cbf-ic-icon-wrap destination"><MapPin size={13} /></div>
          <div className="cbf-ic-body">
            <span className="cbf-ic-label">Destination</span>
            <strong className="cbf-ic-value">{info.destination}</strong>
          </div>
        </div>
        <div className="cbf-info-card">
          <div className="cbf-ic-icon-wrap pax"><Users size={13} /></div>
          <div className="cbf-ic-body">
            <span className="cbf-ic-label">Passengers</span>
            <strong className="cbf-ic-value">{info.paxCount} pax</strong>
          </div>
        </div>
        <div className="cbf-info-card">
          <div className="cbf-ic-icon-wrap name"><User size={13} /></div>
          <div className="cbf-ic-body">
            <span className="cbf-ic-label">Name</span>
            <strong className="cbf-ic-value">{info.fullName}</strong>
          </div>
        </div>
        <div className="cbf-info-card cbf-info-card-full">
          <div className="cbf-ic-icon-wrap email"><Mail size={13} /></div>
          <div className="cbf-ic-body">
            <span className="cbf-ic-label">Email</span>
            <strong className="cbf-ic-value">{info.email}</strong>
          </div>
        </div>
      </div>

      {/* ── Transfer Info ── */}
      <div className="cbf-transfer-info-label">TRANSFER INFO</div>
      <div className="cbf-form-grid">

        {/* Arrival Time */}
        <div className="cbf-field">
          <label>
            Arrival Time <span className="cbf-req">*</span>
            <span className="cbf-field-hint"> — when you arrive</span>
          </label>
          <CustomTimePicker
            value={detailForm.arrivalTime}
            onChange={e => handleTimeChange('arrivalTime', e.target.value)}
            placeholder="Select arrival time"
          />
        </div>

        {/* Departure Time (roundtrip only) */}
        {isRoundtrip && (
          <div className="cbf-field">
            <label>
              Departure Time <span className="cbf-req">*</span>
              {info.returnDate && (
                <span className="cbf-field-hint"> Return on {fmtDate(info.returnDate)}</span>
              )}
            </label>
            <CustomTimePicker
              value={detailForm.departureTime}
              onChange={e => handleTimeChange('departureTime', e.target.value)}
              placeholder="Select departure time"
            />
          </div>
        )}

        {/* Pickup Location */}
        <div className="cbf-field cbf-full">
          <label>Pickup Location <span className="cbf-req">*</span></label>
          <LocationSelect
            value={detailForm.pickupLocation}
            onChange={val => onDetailChange('pickupLocation', val)}
            placeholder="e.g. NAIA Terminal 3, Pasay City"
            source="transfer"
          />
        </div>

        {/* Drop-off Location (roundtrip only) */}
        {isRoundtrip && (
          <div className="cbf-field cbf-full">
            <label>
              Drop-off Location <span className="cbf-req">*</span>
              <span className="cbf-field-hint"> Where you return to</span>
            </label>
            <LocationSelect
              value={detailForm.dropoffLocation}
              onChange={val => onDetailChange('dropoffLocation', val)}
              placeholder="e.g. NAIA Terminal 3, Pasay City"
              source="transfer"
            />
          </div>
        )}

        {/* Special Requests */}
        <div className="cbf-field cbf-full">
          <label>Special Requests <span className="cbf-optional">(optional)</span></label>
          <textarea
            className="cbf-textarea"
            placeholder="e.g. Need child seat, extra luggage, late night pick-up..."
            rows={3}
            value={detailForm.message}
            onChange={e => onDetailChange('message', e.target.value)}
          />
        </div>
      </div>

      {/* ── Luggage notice ── */}
      <div className="cbf-luggage-notice">
        <span className="cbf-luggage-icon">🧳</span>
        <span>
          <strong>Luggage included:</strong> Up to 2 check-in bags and 1 carry-on per
          passenger at no extra charge.
        </span>
      </div>
    </div>
  );
}
