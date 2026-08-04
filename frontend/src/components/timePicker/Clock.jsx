// src/components/Transfers/timePicker/Clock.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import './Clock.css';

const CustomTimePicker = ({ value, onChange, required, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hour, setHour] = useState(7);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM');
  const [mode, setMode] = useState('hour');

  const wrapperRef = useRef(null);
  const clockRef   = useRef(null);

  const CLOCK_R = 130;
  const CENTER  = 155;
  const HAND_R  = 105;

  // Parse incoming 24h value
  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number);
      setPeriod(h >= 12 ? 'PM' : 'AM');
      setHour(h % 12 === 0 ? 12 : h % 12);
      setMinute(m);
    } else {
      setHour(7);
      setMinute(0);
      setPeriod('AM');
    }
  }, [value]);

  const to24h = (h, m, p) => {
    let h24 = h % 12;
    if (p === 'PM') h24 += 12;
    return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const formatDisplay = () => {
    if (!value && hour === 7 && minute === 0) return '';
    return `${hour}:${String(minute).padStart(2, '0')} ${period}`;
  };

  const hourAngleDeg   = (hour % 12) * 30;
  const minuteAngleDeg = minute * 6;

  const polarToXY = (angleDeg, r) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: CENTER + r * Math.cos(rad), y: CENTER + r * Math.sin(rad) };
  };

  const handleClockClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const dx   = e.clientX - cx;
    const dy   = e.clientY - cy;
    let angle  = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    if (mode === 'hour') {
      const h = Math.round(angle / 30) % 12 || 12;
      setHour(h);
      onChange({ target: { value: to24h(h, minute, period) } });
      setMode('minute');
    } else {
      const m = Math.round(angle / 6) % 60;
      setMinute(m);
      onChange({ target: { value: to24h(hour, m, period) } });
    }
  };

  const handlePeriodChange = (p) => {
    setPeriod(p);
    onChange({ target: { value: to24h(hour, minute, p) } });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    setMode('hour');
  };

  const handleCancel = () => {
    setIsOpen(false);
    setMode('hour');
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest('.tbfm-analog-clock-popup')) {
        setIsOpen(false);
        setMode('hour');
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Hour number positions around the clock
  const hourNumbers = Array.from({ length: 12 }, (_, i) => {
    const n   = i + 1;
    const pos = polarToXY(n * 30, HAND_R);
    return { n, ...pos };
  });

  // Minute tick marks (every 5 min = 12 labels: 0,5,10,...55)
  const minuteLabels = Array.from({ length: 12 }, (_, i) => {
    const m   = i * 5;
    const pos = polarToXY(m * 6, HAND_R);
    return { m, ...pos };
  });

  // Hand tip positions
  const hourTip   = polarToXY(hourAngleDeg,   75);
  const minuteTip = polarToXY(minuteAngleDeg, 95);

  const displayHour   = String(hour).padStart(2, '0');
  const displayMinute = String(minute).padStart(2, '0');

  return (
    <div className="tbfm-time-picker-wrapper" ref={wrapperRef}>
      <div className="tbfm-time-trigger" onClick={() => setIsOpen(true)}>
        <span className={formatDisplay() ? 'tbfm-time-value' : 'tbfm-time-placeholder'}>
          {formatDisplay() || placeholder || 'Select time'}
        </span>
        <Clock size={16} />
      </div>

      {/* MODAL OVERLAY */}
      {isOpen && (
        <div className="tbfm-clock-overlay">
          <div className="tbfm-analog-clock-popup">

            {/* Header */}
            <div className="tbfm-analog-header">
              <div className="tbfm-analog-time-display">
                <span
                  className={`tbfm-analog-segment ${mode === 'hour' ? 'active' : ''}`}
                  onClick={() => setMode('hour')}
                >
                  {displayHour}
                </span>
                <span className="tbfm-analog-colon">:</span>
                <span
                  className={`tbfm-analog-segment ${mode === 'minute' ? 'active' : ''}`}
                  onClick={() => setMode('minute')}
                >
                  {displayMinute}
                </span>
              </div>

              <div className="tbfm-analog-period-stack">
                <button
                  type="button"
                  className={`tbfm-analog-period-btn ${period === 'AM' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('AM')}
                >AM</button>
                <button
                  type="button"
                  className={`tbfm-analog-period-btn ${period === 'PM' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('PM')}
                >PM</button>
              </div>
            </div>

            {/* Clock Face */}
            <div className="tbfm-analog-face-wrap">
              <svg
                ref={clockRef}
                viewBox="0 0 310 310"
                className="tbfm-analog-svg"
                onClick={handleClockClick}
              >
                {/* Clock circle */}
                <circle cx={CENTER} cy={CENTER} r={CLOCK_R} fill="#eef2f8" />

                {/* Minute tick lines */}
                {Array.from({ length: 60 }, (_, i) => {
                  const a  = (i * 6 - 90) * (Math.PI / 180);
                  const r1 = i % 5 === 0 ? 116 : 120;
                  const r2 = 128;
                  return (
                    <line
                      key={i}
                      x1={CENTER + r1 * Math.cos(a)}
                      y1={CENTER + r1 * Math.sin(a)}
                      x2={CENTER + r2 * Math.cos(a)}
                      y2={CENTER + r2 * Math.sin(a)}
                      stroke={i % 5 === 0 ? '#8ea8c3' : '#c0d0e0'}
                      strokeWidth={i % 5 === 0 ? 2 : 1}
                    />
                  );
                })}

                {/* Hour numbers — only shown in hour mode */}
                {mode === 'hour' && hourNumbers.map(({ n, x, y }) => {
                  const isSelected = hour === n;
                  return (
                    <g
                      key={n}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHour(n);
                        onChange({ target: { value: to24h(n, minute, period) } });
                        setMode('minute');
                      }}
                    >
                      {isSelected && <circle cx={x} cy={y} r={16} fill="#001b3e" />}
                      <text
                        x={x} y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="14"
                        fontWeight={isSelected ? '700' : '500'}
                        fill={isSelected ? 'white' : '#374151'}
                        className="tbfm-analog-clickable-text"
                      >
                        {n}
                      </text>
                    </g>
                  );
                })}

                {/* Minute labels (every 5 min) — shown when in minute mode */}
                {mode === 'minute' && minuteLabels.map(({ m, x, y }) => {
                  const isSelected = minute === m;
                  return (
                    <g
                      key={m}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMinute(m);
                        onChange({ target: { value: to24h(hour, m, period) } });
                      }}
                    >
                      {isSelected && <circle cx={x} cy={y} r={16} fill="#001b3e" />}
                      <text
                        x={x} y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="12"
                        fontWeight={isSelected ? '700' : '400'}
                        fill={isSelected ? 'white' : '#374151'}
                        className="tbfm-analog-clickable-text"
                      >
                        {String(m).padStart(2, '0')}
                      </text>
                    </g>
                  );
                })}

                {/* Hour hand */}
                {mode === 'hour' && (
                  <>
                    <line
                      x1={CENTER} y1={CENTER}
                      x2={hourTip.x} y2={hourTip.y}
                      stroke="#001b3e" strokeWidth="3" strokeLinecap="round"
                    />
                    <circle cx={hourTip.x} cy={hourTip.y} r="14" fill="#001b3e" opacity="0.25" />
                  </>
                )}

                {/* Minute hand */}
                {mode === 'minute' && (
                  <>
                    <line
                      x1={CENTER} y1={CENTER}
                      x2={minuteTip.x} y2={minuteTip.y}
                      stroke="#001b3e" strokeWidth="2.5" strokeLinecap="round"
                    />
                    <circle cx={minuteTip.x} cy={minuteTip.y} r="14" fill="#001b3e" opacity="0.25" />
                  </>
                )}

                {/* Center dot */}
                <circle cx={CENTER} cy={CENTER} r="5" fill="#001b3e" />
              </svg>
            </div>

            {/* Footer */}
            <div className="tbfm-analog-footer">
              <button type="button" className="tbfm-analog-cancel-btn" onClick={handleCancel}>Cancel</button>
              <button type="button" className="tbfm-analog-ok-btn"     onClick={handleConfirm}>OK</button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default CustomTimePicker;