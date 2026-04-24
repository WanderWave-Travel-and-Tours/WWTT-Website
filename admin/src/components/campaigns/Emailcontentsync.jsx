
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Mail,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Search,
  Eye,
  EyeOff,
  Loader2,
  Zap,
  MapPin,
  Package,
  ChevronDown,
  X,
} from 'lucide-react';
import './EmailContentSync.css';

// ── Base URL — reads from env or falls back to same-origin ──
const API_BASE = import.meta.env?.VITE_API_URL || '';

// ────────────────────────────────────────────────────────────
//  PACKAGE SELECTOR SUB-COMPONENT
//  Searchable dropdown of packages fetched from the backend.
// ────────────────────────────────────────────────────────────
const PackageSelector = ({ packages, selected, onSelect, loading }) => {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState('');
  const dropdownRef           = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = packages.filter(
    (p) =>
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      (p.destination || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="ecs-pkg-selector" ref={dropdownRef}>
      <button
        type="button"
        className={`ecs-pkg-trigger ${open ? 'ecs-pkg-trigger--open' : ''}`}
        onClick={() => { setOpen((v) => !v); setQuery(''); }}
        disabled={loading}
      >
        {loading ? (
          <span className="ecs-pkg-placeholder">
            <Loader2 size={14} className="ecs-spin" /> Loading packages…
          </span>
        ) : selected ? (
          <span className="ecs-pkg-selected-label">
            <Package size={14} style={{ color: '#001F3F', flexShrink: 0 }} />
            <span className="ecs-pkg-selected-title">{selected.title}</span>
            {selected.destination && (
              <span className="ecs-pkg-selected-dest">
                <MapPin size={11} /> {selected.destination}
              </span>
            )}
          </span>
        ) : (
          <span className="ecs-pkg-placeholder">Select a package…</span>
        )}
        <ChevronDown size={15} className={`ecs-pkg-chevron ${open ? 'ecs-pkg-chevron--open' : ''}`} />
      </button>

      {open && (
        <div className="ecs-pkg-dropdown">
          {/* Search inside dropdown */}
          <div className="ecs-pkg-search-wrap">
            <Search size={13} className="ecs-pkg-search-icon" />
            <input
              className="ecs-pkg-search"
              placeholder="Search by name or destination…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="ecs-pkg-list">
            {filtered.length === 0 ? (
              <div className="ecs-pkg-empty">No packages match "{query}"</div>
            ) : (
              filtered.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  className={`ecs-pkg-option ${selected?._id === p._id ? 'ecs-pkg-option--active' : ''}`}
                  onClick={() => { onSelect(p); setOpen(false); }}
                >
                  <Package size={13} style={{ flexShrink: 0 }} />
                  <span className="ecs-pkg-option-name">{p.title}</span>
                  {p.destination && (
                    <span className="ecs-pkg-option-dest">
                      <MapPin size={10} /> {p.destination}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  HTML PREVIEW PANEL
//  Renders the returned HTML blobs in an iframe-like container.
// ────────────────────────────────────────────────────────────
const PreviewPanel = ({ title, html, onClose }) => {
  if (!html) return null;
  return (
    <div className="ecs-preview-panel">
      <div className="ecs-preview-header">
        <span className="ecs-preview-title">{title}</span>
        <button className="ecs-preview-close" onClick={onClose} title="Close preview">
          <X size={14} />
        </button>
      </div>
      <div
        className="ecs-preview-body"
        // Safe — this HTML was generated server-side by our own builder
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
};

// ────────────────────────────────────────────────────────────
//  MAIN COMPONENT
// ────────────────────────────────────────────────────────────
const EmailContentSync = () => {
  // Package list state
  const [packages, setPackages]       = useState([]);
  const [pkgLoading, setPkgLoading]   = useState(true);
  const [pkgError, setPkgError]       = useState(null);

  // Form state
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [testEmail, setTestEmail]     = useState('');

  // Sync state
  const [syncing, setSyncing]         = useState(false);
  const [result, setResult]           = useState(null);   // { success, message, preview? }

  // Preview panel state
  const [previewType, setPreviewType] = useState(null);   // 'inclusions' | 'itinerary'

  // ── Fetch packages on mount ─────────────────────────────
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/packages`);
        // Handle both { data: [...] } and plain array shapes
        const list = Array.isArray(data) ? data : (data.data || []);
        setPackages(list);
      } catch (err) {
        setPkgError('Could not load packages. Check your API connection.');
        console.error('❌ [EmailContentSync] fetchPackages:', err.message);
      } finally {
        setPkgLoading(false);
      }
    };
    fetchPackages();
  }, []);

  // ── Clear result when inputs change ─────────────────────
  useEffect(() => {
    setResult(null);
    setPreviewType(null);
  }, [selectedPkg, testEmail]);

  // ── Handle sync ─────────────────────────────────────────
  const handleSync = async () => {
    if (!selectedPkg) return;
    if (!testEmail || !testEmail.includes('@')) return;

    setSyncing(true);
    setResult(null);
    setPreviewType(null);

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/packages/${selectedPkg._id}/sync-email`,
        { email: testEmail },
        { headers: { 'Content-Type': 'application/json' } }
      );
      setResult({ success: true, ...data });
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Sync failed. Check the console for details.';
      setResult({ success: false, message: msg });
      console.error('❌ [EmailContentSync] sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const isFormValid = selectedPkg && testEmail.includes('@');

  return (
    <section className="ecs-wrap">
      {/* ── Section Header ── */}
      <div className="ecs-section-header">
        <div className="ecs-section-header-left">
          <div className="ecs-icon-wrap">
            <Zap size={20} color="#001F3F" />
          </div>
          <div>
            <h2 className="ecs-section-title">Email Content Sync</h2>
            <p className="ecs-section-sub">
              Push a package's Inclusions &amp; Itinerary as HTML to your GHL Master Template.
            </p>
          </div>
        </div>
        <span className="ecs-ghl-badge">GoHighLevel</span>
      </div>

      {/* ── Main Card ── */}
      <div className="ecs-card">

        {/* Package error banner */}
        {pkgError && (
          <div className="ecs-alert ecs-alert--error">
            <AlertCircle size={15} />
            {pkgError}
          </div>
        )}

        <div className="ecs-form-grid">
          {/* Column 1 — Package selector */}
          <div className="ecs-field">
            <label className="ecs-label">
              <Package size={13} />
              Select Package
            </label>
            <PackageSelector
              packages={packages}
              selected={selectedPkg}
              onSelect={setSelectedPkg}
              loading={pkgLoading}
            />
            {selectedPkg && (
              <p className="ecs-field-hint">
                <MapPin size={11} /> {selectedPkg.destination || 'No destination set'}
                {selectedPkg.inclusions?.length > 0 && (
                  <> &nbsp;·&nbsp; {selectedPkg.inclusions.length} inclusions</>
                )}
                {selectedPkg.itinerary?.length > 0 && (
                  <> &nbsp;·&nbsp; {selectedPkg.itinerary.length} days</>
                )}
              </p>
            )}
          </div>

          {/* Column 2 — Test email */}
          <div className="ecs-field">
            <label className="ecs-label" htmlFor="ecs-email">
              <Mail size={13} />
              Test Email Address
            </label>
            <div className="ecs-input-wrap">
              <input
                id="ecs-email"
                type="email"
                className="ecs-input"
                placeholder="you@wanderwaveph.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <p className="ecs-field-hint">
              This will be the GHL contact that receives the HTML payload.
            </p>
          </div>
        </div>

        {/* ── Result Banner ── */}
        {result && (
          <div className={`ecs-alert ${result.success ? 'ecs-alert--success' : 'ecs-alert--error'}`}>
            {result.success
              ? <CheckCircle2 size={16} />
              : <AlertCircle size={16} />
            }
            <span>{result.message}</span>
          </div>
        )}

        {/* ── Actions Row ── */}
        <div className="ecs-actions-row">
          <button
            className="ecs-btn-sync"
            onClick={handleSync}
            disabled={!isFormValid || syncing}
          >
            {syncing ? (
              <>
                <Loader2 size={15} className="ecs-spin" />
                Syncing…
              </>
            ) : (
              <>
                <RefreshCw size={15} />
                Sync to GHL
              </>
            )}
          </button>

          {/* Preview buttons — only visible after a successful sync */}
          {result?.success && result.preview && (
            <div className="ecs-preview-btns">
              <button
                className={`ecs-btn-preview ${previewType === 'inclusions' ? 'ecs-btn-preview--active' : ''}`}
                onClick={() =>
                  setPreviewType((v) => (v === 'inclusions' ? null : 'inclusions'))
                }
              >
                {previewType === 'inclusions' ? <EyeOff size={13} /> : <Eye size={13} />}
                Inclusions HTML
              </button>
              <button
                className={`ecs-btn-preview ${previewType === 'itinerary' ? 'ecs-btn-preview--active' : ''}`}
                onClick={() =>
                  setPreviewType((v) => (v === 'itinerary' ? null : 'itinerary'))
                }
              >
                {previewType === 'itinerary' ? <EyeOff size={13} /> : <Eye size={13} />}
                Itinerary HTML
              </button>
            </div>
          )}
        </div>

        {/* ── HTML Preview Panels ── */}
        {result?.preview && (
          <>
            <PreviewPanel
              title="Inclusions Preview"
              html={previewType === 'inclusions' ? result.preview.inclusions_html : null}
              onClose={() => setPreviewType(null)}
            />
            <PreviewPanel
              title="Itinerary Preview"
              html={previewType === 'itinerary' ? result.preview.itinerary_html : null}
              onClose={() => setPreviewType(null)}
            />
          </>
        )}
      </div>

      {/* ── How it Works info strip ── */}
      <div className="ecs-info-strip">
        <div className="ecs-info-step">
          <span className="ecs-info-num">1</span>
          <span className="ecs-info-text">Pick a package &amp; enter a test email.</span>
        </div>
        <div className="ecs-info-arrow">→</div>
        <div className="ecs-info-step">
          <span className="ecs-info-num">2</span>
          <span className="ecs-info-text">Backend builds inline-CSS HTML blobs.</span>
        </div>
        <div className="ecs-info-arrow">→</div>
        <div className="ecs-info-step">
          <span className="ecs-info-num">3</span>
          <span className="ecs-info-text">Payload fires to GHL webhook.</span>
        </div>
        <div className="ecs-info-arrow">→</div>
        <div className="ecs-info-step">
          <span className="ecs-info-num">4</span>
          <span className="ecs-info-text">GHL workflow saves fields &amp; sends the email.</span>
        </div>
      </div>
    </section>
  );
};

export default EmailContentSync;