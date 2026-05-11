// src/components/location/LocationSelect.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A drop-in replacement for any <input type="text"> location field.
// Looks and feels identical to your existing .tbfm-form-input.
// A 🔍 button on the right fires the fetch — typing freely still works.
//
// Usage (exactly replaces a plain <input>):
//
//   <LocationSelect
//     value={pickupLocation}
//     onChange={setPickupLocation}
//     placeholder="Hotel name, address, or landmark"
//     required
//   />
//
// Props:
//   value        {string}         — controlled value
//   onChange     {(str) => void}  — called with plain string
//   placeholder  {string}
//   source       {string}         — optional filter tag: 'transfer' | 'hotel' | 'tour'
//   disabled     {boolean}
//   required     {boolean}
// ─────────────────────────────────────────────────────────────────────────────
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, MapPin, X, Loader } from 'lucide-react';

// ── Inline styles — no extra CSS file needed ─────────────────────────────────
// All values hardcoded to match the tbfm palette exactly so the component
// slots in without touching TransferBookingFormModal.css.
const S = {
  wrapper: {
    position: 'relative',
    width:    '100%',
  },

  inputRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
  },

  // Matches .tbfm-form-input exactly
  input: {
    flex:         1,
    height:       '40px',
    padding:      '0 12px',
    border:       '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize:     '0.875rem',
    color:        '#1e293b',
    background:   '#fff',
    outline:      'none',
    transition:   'border 0.15s, box-shadow 0.15s',
    boxSizing:    'border-box',
    width:        '100%',
  },

  inputFocus: {
    borderColor: '#2563eb',
    boxShadow:   '0 0 0 3px rgba(37,99,235,0.12)',
  },

  searchBtn: {
    flexShrink:     0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    width:          '40px',
    height:         '40px',
    borderRadius:   '8px',
    border:         '1px solid #e2e8f0',
    background:     '#f8fafc',
    cursor:         'pointer',
    color:          '#64748b',
    transition:     'background 0.15s, border-color 0.15s, color 0.15s',
  },

  searchBtnHover: {
    background:  '#2563eb',
    borderColor: '#2563eb',
    color:       '#fff',
  },

  searchBtnLoading: {
    background:  '#eff6ff',
    borderColor: '#bfdbfe',
    color:       '#2563eb',
    cursor:      'wait',
  },

  panel: {
    position:      'absolute',
    top:           'calc(100% + 6px)',
    left:          0,
    right:         '46px',  // doesn't extend under the search button
    background:    '#fff',
    border:        '1px solid #e2e8f0',
    borderRadius:  '10px',
    boxShadow:     '0 8px 24px rgba(0,0,0,0.10)',
    zIndex:        9999,
    overflow:      'hidden',
    maxHeight:     '232px',
    display:       'flex',
    flexDirection: 'column',
  },

  panelHeader: {
    padding:       '8px 12px 6px',
    fontSize:      '0.72rem',
    fontWeight:    600,
    letterSpacing: '0.05em',
    color:         '#94a3b8',
    textTransform: 'uppercase',
    borderBottom:  '1px solid #f1f5f9',
    flexShrink:    0,
  },

  list: {
    overflowY: 'auto',
    flex:      1,
    padding:   '4px',
  },

  item: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
    padding:    '8px 10px',
    borderRadius:'6px',
    cursor:     'pointer',
    fontSize:   '0.875rem',
    color:      '#1e293b',
    transition: 'background 0.1s',
    userSelect: 'none',
  },

  itemHover: {
    background: '#f1f5f9',
  },

  itemIcon: {
    color:      '#94a3b8',
    flexShrink: 0,
  },

  empty: {
    padding:   '16px 12px',
    fontSize:  '0.85rem',
    color:     '#94a3b8',
    textAlign: 'center',
  },

  clearBtn: {
    position:   'absolute',
    right:      '8px',
    top:        '50%',
    transform:  'translateY(-50%)',
    background: 'none',
    border:     'none',
    cursor:     'pointer',
    color:      '#94a3b8',
    padding:    '2px',
    display:    'flex',
    alignItems: 'center',
  },
};

// ── Inject spin keyframe once ────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('ls-spin-kf')) {
  const tag = document.createElement('style');
  tag.id = 'ls-spin-kf';
  tag.textContent = '@keyframes ls-spin { to { transform: rotate(360deg); } }';
  document.head.appendChild(tag);
}

// ── Component ────────────────────────────────────────────────────────────────
const LocationSelect = ({
  value       = '',
  onChange,
  placeholder = 'Hotel name, address, or landmark',
  source      = '',
  disabled    = false,
  required    = false,
}) => {
  const [suggestions,  setSuggestions]  = useState([]);
  const [isOpen,       setIsOpen]       = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [btnHovered,   setBtnHovered]   = useState(false);
  const [hoveredIdx,   setHoveredIdx]   = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef   = useRef(null);
  const abortRef   = useRef(null);

  // ── Close panel on outside click ─────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Fetch from /api/locations ─────────────────────────────────────────────
  const fetchSuggestions = useCallback(async (q = '') => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: 20 });
      if (q.trim()) params.set('q', q.trim());
      if (source)   params.set('source', source);

      const res  = await fetch(`/api/locations?${params}`, { signal: abortRef.current.signal });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) setSuggestions(json.data);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.warn('LocationSelect fetch error:', err.message);
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [source]);

  // ── Search button: fetch with the current typed value as the query ────────
  const handleSearchClick = async (e) => {
    e.preventDefault();
    if (disabled || isLoading) return;
    await fetchSuggestions(value);
    setIsOpen(true);
    setHoveredIdx(-1);
    inputRef.current?.focus();
  };

  // ── Pick a suggestion ─────────────────────────────────────────────────────
  const handleSelect = (opt) => {
    onChange?.(opt.value);
    setIsOpen(false);
  };

  // ── Clear the field ───────────────────────────────────────────────────────
  const handleClear = (e) => {
    e.preventDefault();
    onChange?.('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // ── Keyboard nav inside the open panel ───────────────────────────────────
  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if      (e.key === 'ArrowDown') { e.preventDefault(); setHoveredIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setHoveredIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && hoveredIdx >= 0) { e.preventDefault(); handleSelect(suggestions[hoveredIdx]); }
    else if (e.key === 'Escape')    { setIsOpen(false); }
  };

  const btnStyle = {
    ...S.searchBtn,
    ...(isLoading                    ? S.searchBtnLoading : {}),
    ...(btnHovered && !isLoading     ? S.searchBtnHover   : {}),
  };

  return (
    <div ref={wrapperRef} style={S.wrapper}>

      {/* ── Input + search button row ────────────────────────────────── */}
      <div style={S.inputRow}>

        {/* Text input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => { onChange?.(e.target.value); setIsOpen(false); }}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            style={{
              ...S.input,
              paddingRight: value ? '30px' : '12px',
              ...(inputFocused ? S.inputFocus : {}),
            }}
          />
          {value && !disabled && (
            <button type="button" style={S.clearBtn} onMouseDown={handleClear} tabIndex={-1} aria-label="Clear">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          type="button"
          style={btnStyle}
          onMouseEnter={() => setBtnHovered(true)}
          onMouseLeave={() => setBtnHovered(false)}
          onClick={handleSearchClick}
          disabled={disabled || isLoading}
          title="Search saved locations"
          aria-label="Search saved locations"
        >
          {isLoading
            ? <Loader size={15} style={{ animation: 'ls-spin 0.7s linear infinite' }} />
            : <Search size={15} />}
        </button>
      </div>

      {/* ── Suggestions panel ────────────────────────────────────────── */}
      {isOpen && (
        <div style={S.panel} role="listbox">
          <div style={S.panelHeader}>Saved locations</div>
          {suggestions.length === 0
            ? <div style={S.empty}>{isLoading ? 'Searching…' : 'No saved locations found'}</div>
            : (
              <div style={S.list}>
                {suggestions.map((opt, i) => (
                  <div
                    key={opt.value}
                    role="option"
                    aria-selected={i === hoveredIdx}
                    style={{ ...S.item, ...(i === hoveredIdx ? S.itemHover : {}) }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(-1)}
                    onMouseDown={() => handleSelect(opt)}
                  >
                    <MapPin size={13} style={S.itemIcon} />
                    <span>{opt.label}</span>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
};

export default LocationSelect;