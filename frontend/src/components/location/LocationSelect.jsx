// components/location/LocationSelect.jsx
// ─────────────────────────────────────────────────────────────────────────────
// Autocomplete input for pickup / drop-off locations.
//
// Priority:
//   1. Your internal /api/locations endpoint (previously-booked spots, sorted by usage)
//   2. OpenStreetMap Nominatim fallback (for new locations not yet in the DB)
//
// Uses NO external UI library — plain React state + a styled native <ul> dropdown.
// This avoids the react-select "Invalid hook call" crash caused by duplicate
// React instances when react-select is bundled alongside another copy of React.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import './LocationSelect.css';

const RENDER_BASE = '';
const DEBOUNCE_MS = 300;
const MIN_CHARS   = 2;

// ── Component ─────────────────────────────────────────────────────────────────
const LocationSelect = ({ value = '', onChange, placeholder = 'Search location...', source = 'transfer' }) => {
  const [inputValue,   setInputValue]   = useState(value || '');
  const [options,      setOptions]      = useState([]);
  const [isOpen,       setIsOpen]       = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [highlighted,  setHighlighted]  = useState(-1);
  const [isFocused,    setIsFocused]    = useState(false);

  const wrapperRef  = useRef(null);
  const inputRef    = useRef(null);
  const debounceRef = useRef(null);

  // Sync external value → local input (e.g. when parent clears the field)
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlighted(-1);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Search: internal DB first, OSM fallback ────────────────────────────────
  const search = useCallback(async (query) => {
    if (!query || query.trim().length < MIN_CHARS) {
      setOptions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    try {
      // 1️⃣ Internal locations (previously booked, ranked by usageCount)
      const internalRes = await axios.get(`${RENDER_BASE}/api/locations`, {
        params: { q: query.trim(), source, limit: 8 },
        timeout: 5000,
      });

      const internalOpts = (internalRes.data?.data || []).map((opt) => ({
        label:     opt.label,
        value:     opt.value,
        fromDB:    true,
      }));

      if (internalOpts.length >= 5) {
        // Enough internal results — skip OSM call
        setOptions(internalOpts);
        setIsLoading(false);
        return;
      }

      // 2️⃣ OSM fallback to fill remaining slots
      const osmRes = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q:              query.trim(),
            format:         'json',
            addressdetails: 1,
            limit:          6 - internalOpts.length,
            countrycodes:   'ph',
          },
          timeout: 6000,
        }
      );

      const osmOpts = (osmRes.data || []).map((item) => ({
        label:  item.display_name,
        value:  item.display_name,
        fromDB: false,
      }));

      // Deduplicate: remove OSM results whose label already exists in internal results
      const internalValues = new Set(internalOpts.map((o) => o.value.toLowerCase()));
      const filteredOSM    = osmOpts.filter(
        (o) => !internalValues.has(o.label.toLowerCase())
      );

      setOptions([...internalOpts, ...filteredOSM]);
    } catch (err) {
      // If internal API fails, try OSM alone
      try {
        const osmRes = await axios.get(
          `https://nominatim.openstreetmap.org/search`,
          {
            params: {
              q:              query.trim(),
              format:         'json',
              addressdetails: 1,
              limit:          6,
              countrycodes:   'ph',
            },
            timeout: 6000,
          }
        );
        setOptions(
          (osmRes.data || []).map((item) => ({
            label:  item.display_name,
            value:  item.display_name,
            fromDB: false,
          }))
        );
      } catch {
        setOptions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [source]);

  // ── Input change handler with debounce ─────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setHighlighted(-1);

    // Notify parent immediately so the field value stays in sync
    onChange(val);

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), DEBOUNCE_MS);
  };

  // ── Option select ──────────────────────────────────────────────────────────
  const selectOption = (opt) => {
    setInputValue(opt.value);
    onChange(opt.value);
    setIsOpen(false);
    setHighlighted(-1);
  };

  // ── Keyboard navigation ────────────────────────────────────────────────────
  const handleKeyDown = (e) => {
    if (!isOpen || options.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault();
      selectOption(options[highlighted]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // ── Clear button ───────────────────────────────────────────────────────────
  const handleClear = () => {
    setInputValue('');
    onChange('');
    setOptions([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ls-wrapper" ref={wrapperRef}>
      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        className={`ls-input${isFocused ? ' ls-input--focus' : ''}`}
        value={inputValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          setIsFocused(true);
          if (inputValue.length >= MIN_CHARS) setIsOpen(true);
        }}
        onBlur={() => setIsFocused(false)}
        autoComplete="off"
      />

      {/* Clear button */}
      {inputValue && (
        <button type="button" className="ls-clear-btn" onClick={handleClear} tabIndex={-1} aria-label="Clear">
          ✕
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <ul className="ls-dropdown" role="listbox">
          {isLoading ? (
            <li className="ls-status-msg">Searching…</li>
          ) : options.length === 0 ? (
            <li className="ls-status-msg">
              {inputValue.length < MIN_CHARS ? 'Type at least 2 characters…' : 'No locations found'}
            </li>
          ) : (
            options.map((opt, i) => (
              <li
                key={`${opt.value}-${i}`}
                role="option"
                className={`ls-option${i === highlighted ? ' ls-option--highlighted' : ''}${i === options.length - 1 ? ' ls-option--last' : ''}`}
                onMouseDown={() => selectOption(opt)}
                onMouseEnter={() => setHighlighted(i)}
              >
                {opt.label}
                {opt.fromDB && <span className="ls-badge">Popular</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default LocationSelect;