// cbf/steps/Step3TourDates.jsx
import React from 'react';
import { MapPin, Users, Clock, Calendar } from 'lucide-react';
import DatePicker from '../components/DatePicker';
import { fmt, fmtDate } from '../utils';

/**
 * Step 3 Phase A — collect a scheduled date for each selected tour.
 *
 * Props:
 *   selectedTours    – Tour[]
 *   tourDateIdx      – number (index of current tour)
 *   currentTourDate  – string "YYYY-MM-DD"
 *   tourDates        – { [tourId]: "YYYY-MM-DD" }
 *   info             – { travelDate, returnDate, destination, paxCount }
 *   onDateChange     – (val: string) => void
 */
export default function Step3TourDates({
  selectedTours,
  tourDateIdx,
  currentTourDate,
  tourDates,
  info,
  onDateChange,
}) {
  const currentTour = selectedTours[tourDateIdx];
  if (!currentTour) return null;

  // Compute days between travel and return
  const tripDays = (() => {
    if (!info.travelDate || !info.returnDate) return null;
    const diff = Math.round(
      (new Date(info.returnDate + 'T00:00:00') - new Date(info.travelDate + 'T00:00:00'))
      / (1000 * 60 * 60 * 24)
    );
    return diff > 0 ? diff : null;
  })();

  const getDayName = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
  };

  const splitDate = (dateStr) => {
    if (!dateStr) return { month: '', day: '', year: '' };
    const [y, m, day] = dateStr.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return { month: months[parseInt(m) - 1], day: parseInt(day), year: y };
  };

  const startParts = splitDate(info.travelDate);
  const endParts   = splitDate(info.returnDate);
  const selParts   = splitDate(currentTourDate);

  // Dates already taken by other tours
  const disabledDates = Object.entries(tourDates)
    .filter(([id, d]) => d && id !== currentTour._id)
    .map(([, d]) => d);

  return (
    <div className="cbf-section">

      {/* ── Tour hero card ── */}
      <div className="cbf-tour-hero-card">
        {(currentTour.imageUrl || currentTour.image) ? (
          <img
            src={currentTour.imageUrl || currentTour.image}
            alt={currentTour.title || currentTour.name}
            className="cbf-thc-img"
          />
        ) : (
          <div className="cbf-thc-img cbf-thc-img-placeholder">🏝️</div>
        )}
        <div className="cbf-thc-overlay">
          {currentTour.category && (
            <span className="cbf-thc-badge">{currentTour.category}</span>
          )}
          <div className="cbf-thc-title">{currentTour.title || currentTour.name}</div>
          <div className="cbf-thc-meta-row">
            <span className="cbf-thc-meta-item">
              <MapPin size={11} /> {currentTour.destination || info.destination}
            </span>
            <span className="cbf-thc-price-right">
              Total <strong>₱{fmt((currentTour.price || 0) * (parseInt(info.paxCount) || 1))}</strong>
            </span>
          </div>
          <div className="cbf-thc-sub-row">
            <span>₱{fmt(currentTour.price || 0)} × {info.paxCount} pax</span>
            {currentTour.rating && (
              <span className="cbf-thc-rating">★ {currentTour.rating}</span>
            )}
          </div>
        </div>
        {selectedTours.length > 1 && (
          <div className="cbf-thc-counter">
            {tourDateIdx + 1} / {selectedTours.length}
          </div>
        )}
      </div>

      {/* ── Booking Context ── */}
      <div className="cbf-bctx-section-label">BOOKING CONTEXT</div>
      <div className="cbf-bctx-card">
        {/* Trip Start */}
        <div className="cbf-bctx-side">
          <div className="cbf-bctx-side-label">TRIP START</div>
          <div className="cbf-bctx-date-big">
            {info.travelDate ? fmtDate(info.travelDate) : '—'}
          </div>
          <div className="cbf-bctx-day-name">{getDayName(info.travelDate)}</div>
          <div className="cbf-bctx-detail"><MapPin size={11} /> {info.destination}</div>
          <div className="cbf-bctx-detail"><Users size={11} /> {info.paxCount} Passengers</div>
        </div>

        {/* Center — days badge */}
        <div className="cbf-bctx-center">
          {tripDays && (
            <>
              <div className="cbf-bctx-days-num">{tripDays}</div>
              <div className="cbf-bctx-days-lbl">Days</div>
            </>
          )}
          <div className="cbf-bctx-arrow">→</div>
        </div>

        {/* Trip End */}
        {info.returnDate ? (
          <div className="cbf-bctx-side cbf-bctx-side-right">
            <div className="cbf-bctx-side-label">TRIP END</div>
            <div className="cbf-bctx-date-big">{fmtDate(info.returnDate)}</div>
            <div className="cbf-bctx-day-name">{getDayName(info.returnDate)}</div>
            <div className="cbf-bctx-detail"><MapPin size={11} /> {info.destination}</div>
            {tripDays && (
              <div className="cbf-bctx-detail">
                <Clock size={11} /> {tripDays} Night{tripDays !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        ) : (
          <div className="cbf-bctx-side cbf-bctx-side-right">
            <div className="cbf-bctx-side-label">TRIP END</div>
            <div className="cbf-bctx-date-big" style={{ opacity: 0.4 }}>—</div>
            <div className="cbf-bctx-day-name" style={{ opacity: 0.4 }}>Not set</div>
          </div>
        )}
      </div>

      <div className="cbf-bctx-info-note">
        <Clock size={12} /> Your tour will be scheduled within this trip window.
      </div>

      {/* ── Scheduled Tour Date ── */}
      <div className="cbf-sched-section-label">
        SCHEDULED TOUR DATE
      </div>

      {currentTourDate ? (
        /* Selected date card */
        <div className="cbf-sched-date-card">
          <div className="cbf-sdc-date-box">
            <div className="cbf-sdc-month">{selParts.month.toUpperCase()}</div>
            <div className="cbf-sdc-day">{selParts.day}</div>
            <div className="cbf-sdc-year">{selParts.year}</div>
          </div>
          <div className="cbf-sdc-body">
            <div className="cbf-sdc-weekday">{getDayName(currentTourDate)}</div>
            <div className="cbf-sdc-tour-name">{currentTour.title || currentTour.name}</div>
            <div className="cbf-sdc-meta">
              <span><MapPin size={11} /> {currentTour.destination || info.destination}</span>
              <span><Users size={11} /> {info.paxCount} pax</span>
            </div>
          </div>
          <button
            type="button"
            className="cbf-sdc-change-btn"
            onClick={() => onDateChange('')}
            title="Change date"
          >
            <Calendar size={16} />
          </button>
        </div>
      ) : (
        /* Date picker trigger */
        <div className="cbf-sched-picker-wrap">
          <div className="cbf-sched-picker-label">
            When would you like to take this tour?
          </div>
          <DatePicker
            value={currentTourDate}
            minDate={info.travelDate || new Date().toISOString().split('T')[0]}
            maxDate={info.returnDate || info.travelDate || undefined}
            disabledDates={disabledDates}
            onChange={onDateChange}
            hasError={false}
            placeholder="Select tour date"
          />
          <span className="cbf-sched-hint">
            Each tour must be scheduled on a separate day.
          </span>
        </div>
      )}

      {currentTourDate && info.travelDate && (
        <p className="cbf-sched-window-note">
          Tour date is within your trip window{' '}
          <strong>
            {fmtDate(info.travelDate)}
            {info.returnDate ? ` – ${fmtDate(info.returnDate)}` : ''}
          </strong>.
          {' '}Each tour must be scheduled on a separate day.
        </p>
      )}
    </div>
  );
}
