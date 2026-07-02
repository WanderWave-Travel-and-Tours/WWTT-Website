import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toDateStr = (year, month, day) => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const formatDateRangeDisplay = (start, end) => {
  if (!start || !end) return '';
  const startMonth = MONTH_NAMES[start.getMonth()];
  const endMonth = MONTH_NAMES[end.getMonth()];
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
  }
  if (startMonth !== endMonth && startYear === endYear) {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
  }
  return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
};

// Always-visible inline calendar for picking the departure date, with a
// highlighted preview of the full trip range (departure → return) based on
// the selected package's duration. Mirrors the frontend's booking calendar
// (bookingRightForm.jsx) — dates before today are disabled since this picks
// a future departure, not a birthdate.
const TripDateCalendar = ({ value, onChange, durationDays = 1, isDateAllowed, showSelectedDisplay = true, imageUrl, imageAlt }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const selected = value ? new Date(`${value}T00:00:00`) : null;
  const [viewMonth, setViewMonth] = useState(selected ? selected.getMonth() : today.getMonth());
  const [viewYear, setViewYear] = useState(selected ? selected.getFullYear() : today.getFullYear());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const rangeStart = selected;
  const rangeEnd = selected ? (() => {
    const e = new Date(selected);
    e.setDate(e.getDate() + durationDays - 1);
    return e;
  })() : null;

  const changeMonth = (offset) => {
    let m = viewMonth + offset;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    else if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  const handleDayClick = (day) => {
    onChange({ target: { value: toDateStr(viewYear, viewMonth, day) } });
  };

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = toDateStr(viewYear, viewMonth, day);
    const checkDate = new Date(viewYear, viewMonth, day);
    checkDate.setHours(0, 0, 0, 0);

    const isPast = checkDate < today;
    const isNotAllowedDay = isDateAllowed ? !isDateAllowed(dateStr) : false;
    const isDisabled = isPast || isNotAllowedDay;

    const isSelected = selected &&
      selected.getFullYear() === viewYear &&
      selected.getMonth() === viewMonth &&
      selected.getDate() === day;

    const isInRange = !isSelected && rangeStart && rangeEnd &&
      checkDate >= rangeStart && checkDate <= rangeEnd;

    const isToday = checkDate.getTime() === today.getTime();

    days.push(
      <button
        key={day}
        type="button"
        disabled={isDisabled}
        onClick={() => !isDisabled && handleDayClick(day)}
        className={[
          'nbm-tdcal-day',
          isSelected ? 'selected' : '',
          isInRange ? 'in-range' : '',
          isToday && !isSelected ? 'today' : '',
          isDisabled ? 'disabled' : '',
        ].filter(Boolean).join(' ')}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="nbm-tdcal">
      {imageUrl && (
        <div className="nbm-tdcal-hero">
          <img src={imageUrl} alt={imageAlt || 'Package'} className="nbm-tdcal-hero-img" />
          {rangeStart && rangeEnd && (
            <div className="nbm-tdcal-hero-datebadge">
              <CalendarIcon size={14} />
              <div>
                <span className="nbm-tdcal-hero-datebadge-range">{formatDateRangeDisplay(rangeStart, rangeEnd)}</span>
                <span className="nbm-tdcal-hero-datebadge-sub">
                  {durationDays} {durationDays === 1 ? 'Day' : 'Days'} · {Math.max(durationDays - 1, 0)} {durationDays - 1 === 1 ? 'Night' : 'Nights'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="nbm-tdcal-header">
        <button type="button" className="nbm-tdcal-nav-btn" onClick={() => changeMonth(-1)} aria-label="Previous month">
          <ChevronLeft size={18} />
        </button>
        <h4 className="nbm-tdcal-month-year">{MONTH_NAMES[viewMonth]} {viewYear}</h4>
        <button type="button" className="nbm-tdcal-nav-btn" onClick={() => changeMonth(1)} aria-label="Next month">
          <ChevronRight size={18} />
        </button>
      </div>

      {showSelectedDisplay && selected && rangeEnd && (
        <div className="nbm-tdcal-selected-display">
          <CalendarIcon size={18} className="nbm-tdcal-selected-icon" />
          <div>
            <div className="nbm-tdcal-selected-range">{formatDateRangeDisplay(rangeStart, rangeEnd)}</div>
            <div className="nbm-tdcal-selected-sub">
              {durationDays} {durationDays === 1 ? 'day' : 'days'} · {Math.max(durationDays - 1, 0)} {durationDays - 1 === 1 ? 'night' : 'nights'}
            </div>
          </div>
        </div>
      )}

      <div className="nbm-tdcal-grid">
        {WEEK_DAYS.map((d, i) => <div key={i} className="nbm-tdcal-weekday">{d}</div>)}
        {days}
      </div>
    </div>
  );
};

export default TripDateCalendar;
