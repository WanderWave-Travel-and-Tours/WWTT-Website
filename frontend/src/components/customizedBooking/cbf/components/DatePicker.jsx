// cbf/components/DatePicker.jsx
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Calendar, ChevronRight } from 'lucide-react';
import { fmtDate } from '../utils';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAY_LABELS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

/**
 * Custom date picker with a centered modal calendar.
 *
 * Props:
 *   value         – "YYYY-MM-DD" string or ""
 *   minDate       – "YYYY-MM-DD" earliest selectable date (defaults to today)
 *   maxDate       – "YYYY-MM-DD" latest selectable date (optional)
 *   onChange      – (val: string) => void
 *   hasError      – boolean (optional)
 *   placeholder   – string (optional)
 *   disabledDates – string[] of "YYYY-MM-DD" dates to disable (optional)
 */
export default function DatePicker({
  value,
  minDate,
  maxDate,
  onChange,
  hasError = false,
  placeholder = 'Select date',
  disabledDates = [],
}) {
  const today        = new Date().toISOString().split('T')[0];
  const effectiveMin = minDate || today;
  const effectiveMax = maxDate || null;

  const toDate       = (s) => (s ? new Date(s + 'T00:00:00') : null);
  const selectedDate = toDate(value);
  const minD         = toDate(effectiveMin);

  const initView = () => {
    const base = selectedDate || minD || new Date();
    return { year: base.getFullYear(), month: base.getMonth() };
  };

  const minYear = toDate(effectiveMin)?.getFullYear() ?? new Date().getFullYear();
  const maxYear = effectiveMax ? toDate(effectiveMax).getFullYear() : new Date().getFullYear() + 5;
  const yearOptions = [];
  for (let y = maxYear; y >= minYear; y--) yearOptions.push(y);

  const [open, setOpen]   = useState(false);
  const [view, setView]   = useState(initView);
  const calRef            = useRef(null);

  const handleBackdropClick = (e) => {
    if (calRef.current && !calRef.current.contains(e.target)) setOpen(false);
  };

  const handleOpen = () => {
    setView(initView());
    setOpen(true);
  };

  // Lock body scroll while calendar is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const prevMonth = () =>
    setView(v => ({
      year:  v.month === 0 ? v.year - 1 : v.year,
      month: v.month === 0 ? 11 : v.month - 1,
    }));

  const nextMonth = () =>
    setView(v => ({
      year:  v.month === 11 ? v.year + 1 : v.year,
      month: v.month === 11 ? 0 : v.month + 1,
    }));

  const firstDay  = new Date(view.year, view.month, 1).getDay();
  const daysInMon = new Date(view.year, view.month + 1, 0).getDate();
  const cells     = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMon; d++) cells.push(d);

  const cellDate = (d) => {
    const mm = String(view.month + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    return `${view.year}-${mm}-${dd}`;
  };

  const isPast = (d) => {
    const cd = cellDate(d);
    if (cd < effectiveMin) return true;
    if (effectiveMax && cd > effectiveMax) return true;
    if (disabledDates.includes(cd)) return true;
    return false;
  };
  const isSelected = (d) => cellDate(d) === value;
  const isToday    = (d) => cellDate(d) === today;

  const select = (d) => {
    if (isPast(d)) return;
    onChange(cellDate(d));
    setOpen(false);
  };

  const displayValue = value ? fmtDate(value) : '';

  const calendarModal = open ? (
    <div className="cbf-dp-modal-backdrop" onMouseDown={handleBackdropClick}>
      <div className="cbf-dp-calendar cbf-dp-calendar-modal" ref={calRef}>
        <div className="cbf-dp-modal-header-row">
          <span className="cbf-dp-modal-title">Select Date</span>
          <button
            type="button"
            className="cbf-dp-modal-close"
            onClick={() => setOpen(false)}
            aria-label="Close calendar"
          >
            &#10005;
          </button>
        </div>

        <div className="cbf-dp-cal-header">
          <button type="button" className="cbf-dp-nav" onClick={prevMonth}>&#8249;</button>
          <div className="cbf-dp-selectors">
            <select
              className="cbf-dp-select"
              value={view.month}
              onChange={e => setView(v => ({ ...v, month: parseInt(e.target.value) }))}
            >
              {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              className="cbf-dp-select"
              value={view.year}
              onChange={e => setView(v => ({ ...v, year: parseInt(e.target.value) }))}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button type="button" className="cbf-dp-nav" onClick={nextMonth}>&#8250;</button>
        </div>

        <div className="cbf-dp-day-labels">
          {DAY_LABELS.map(l => <span key={l}>{l}</span>)}
        </div>

        <div className="cbf-dp-grid">
          {cells.map((d, i) =>
            d === null
              ? <span key={`e${i}`} className="cbf-dp-cell cbf-dp-empty" />
              : (
                <button
                  key={d}
                  type="button"
                  className={[
                    'cbf-dp-cell',
                    isPast(d)                         ? 'cbf-dp-past'     : '',
                    isSelected(d)                     ? 'cbf-dp-selected' : '',
                    isToday(d) && !isSelected(d)      ? 'cbf-dp-today'    : '',
                  ].join(' ').trim()}
                  onClick={() => select(d)}
                  disabled={isPast(d)}
                >
                  {d}
                </button>
              )
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="cbf-datepicker-wrap">
      <div
        className={`cbf-input-wrap cbf-datepicker-trigger ${hasError ? 'cbf-dp-error' : ''}`}
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleOpen()}
      >
        <Calendar size={14} className="cbf-input-icon" />
        <span className={`cbf-dp-display ${!displayValue ? 'cbf-dp-placeholder' : ''}`}>
          {displayValue || placeholder}
        </span>
        <ChevronRight
          size={12}
          className={`cbf-dp-chevron ${open ? 'cbf-dp-chevron-open' : ''}`}
        />
      </div>
      {ReactDOM.createPortal(calendarModal, document.body)}
    </div>
  );
}
