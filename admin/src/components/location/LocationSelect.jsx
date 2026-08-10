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

const RENDER_BASE = '';
const DEBOUNCE_MS = 300;
const MIN_CHARS   = 2;

// ── Inline styles (no extra CSS file needed) ──────────────────────────────────
const S = {
  wrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    minHeight: '45px',
    padding: '0 40px 0 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '0.9rem',
    color: '#1f2937',
    background: '#fff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  },
  inputFocus: {
    border: '1px solid #3b82f6',
  },
  clearBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
    fontSize: '16px',
    lineHeight: 1,
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    zIndex: 9999,
    maxHeight: '220px',
    overflowY: 'auto',
    padding: '4px 0',
  },
  option: (isHighlighted) => ({
    padding: '10px 14px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    background: isHighlighted ? '#eff6ff' : 'transparent',
    borderBottom: '1px solid #f3f4f6',
    lineHeight: 1.4,
  }),
  optionLast: {
    borderBottom: 'none',
  },
  statusMsg: {
    padding: '10px 14px',
    fontSize: '0.85rem',
    color: '#6b7280',
    fontStyle: 'italic',
  },
  badge: {
    display: 'inline-block',
    fontSize: '0.7rem',
    background: '#f0fdf4',
    color: '#16a34a',
    border: '1px solid #bbf7d0',
    borderRadius: '4px',
    padding: '1px 5px',
    marginLeft: '6px',
    verticalAlign: 'middle',
    fontStyle: 'normal',
  },
};

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
    <div style={S.wrapper} ref={wrapperRef}>
      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        style={{ ...S.input, ...(isFocused ? S.inputFocus : {}) }}
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
        <button type="button" style={S.clearBtn} onClick={handleClear} tabIndex={-1} aria-label="Clear">
          ✕
        </button>
      )}

      {/* Dropdown */}
      {isOpen && (
        <ul style={S.dropdown} role="listbox">
          {isLoading ? (
            <li style={S.statusMsg}>Searching…</li>
          ) : options.length === 0 ? (
            <li style={S.statusMsg}>
              {inputValue.length < MIN_CHARS ? 'Type at least 2 characters…' : 'No locations found'}
            </li>
          ) : (
            options.map((opt, i) => (
              <li
                key={`${opt.value}-${i}`}
                role="option"
                style={{
                  ...S.option(i === highlighted),
                  ...(i === options.length - 1 ? S.optionLast : {}),
                }}
                onMouseDown={() => selectOption(opt)}
                onMouseEnter={() => setHighlighted(i)}
              >
                {opt.label}
                {opt.fromDB && <span style={S.badge}>Popular</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default LocationSelect;