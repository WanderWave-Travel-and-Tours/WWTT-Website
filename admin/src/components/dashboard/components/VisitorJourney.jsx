// src/components/Dashboard/VisitorJourney.jsx
//
// Self-contained: fetches its own data from /api/page-views/stats
// so it never depends on the parent's date-filtered recentViews.
// Still accepts recentViews as an optional seed prop for first paint.
//
// Usage:
//   <VisitorJourney />

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, ChevronDown, ChevronUp,
  MapPin, Clock, Layers, Wifi, WifiOff,
  Bell, RefreshCw,
} from 'lucide-react';
import './VisitorJourney.css';

// ── Constants ─────────────────────────────────────────────────────────────
const API_STATS    = '/api/page-views/stats';
const AUTO_MS      = 30_000;
const DISPLAY_LIMIT = 7;   // max visitor cards shown

const STAGE_ORDER = ['awareness', 'interest', 'consideration', 'intent', 'conversion'];

const STAGE_CONFIG = {
  awareness:     { label: 'Awareness',     color: '#6366f1', bg: '#eef2ff' },
  interest:      { label: 'Interest',      color: '#3b82f6', bg: '#eff6ff' },
  consideration: { label: 'Consideration', color: '#f59e0b', bg: '#fffbeb' },
  intent:        { label: 'Intent',        color: '#10b981', bg: '#ecfdf5' },
  conversion:    { label: 'Conversion',    color: '#22c55e', bg: '#f0fdf4' },
};

const PAGE_LABELS = {
  packages:     'Package Deals',
  booking:      'Booking',
  flights:      'Flights',
  services:     'Services',
  tours:        'Tours',
  transfers:    'Transfers',
  'tour-booking': 'Tour Booking',
};

// ── Helpers ───────────────────────────────────────────────────────────────
function deriveStage(view) {
  if (view.stage && STAGE_ORDER.includes(view.stage)) return view.stage;
  const { page, packageId } = view;
  if (page === 'booking' || page === 'tour-booking') return packageId ? 'consideration' : 'intent';
  if (page === 'packages' || page === 'tours') return 'interest';
  return 'awareness';
}

function formatRelative(dateStr) {
  if (!dateStr) return '—';
  const diff  = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins  <  1) return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  <  7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return null;
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

// ── Sub-components ────────────────────────────────────────────────────────
function StagePill({ stage }) {
  const cfg = STAGE_CONFIG[stage] || { label: stage, color: '#64748b', bg: '#f1f5f9' };
  return (
    <span
      className="vj-stage-pill"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
    >
      {cfg.label}
    </span>
  );
}

function StageProgressBar({ stage }) {
  const idx = STAGE_ORDER.indexOf(stage);
  const pct = idx < 0 ? 0 : Math.round(((idx + 1) / STAGE_ORDER.length) * 100);
  const cfg = STAGE_CONFIG[stage] || {};
  return (
    <div className="vj-progress-track">
      <div
        className="vj-progress-fill"
        style={{ width: `${pct}%`, background: cfg.color || '#6366f1' }}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
const VisitorJourney = ({ recentViews: seedViews }) => {

  // ── Data ──────────────────────────────────────────────────────────────
  const [views,              setViews]             = useState(seedViews ?? []);
  const [activeSessionCount, setActiveSessionCount] = useState(0);
  const [loading,            setLoading]           = useState(true);
  const [refreshing,         setRefreshing]        = useState(false);
  const [lastRefreshed,      setLastRefreshed]     = useState(null);
  const [fetchError,         setFetchError]        = useState(null);

  // ── UI ────────────────────────────────────────────────────────────────
  const [search,        setSearch]     = useState('');
  const [expandedId,    setExpanded]   = useState(null);
  const [pageFilter,    setPage]       = useState('all');
  const [showActive,    setShowActive] = useState(false);
  const [notifications, setNotifs]     = useState([]);
  const prevStoppedRef = useRef({});

  // ── Fetch ─────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setFetchError(null);
    try {
      const res  = await fetch(API_STATS);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (Array.isArray(json?.data?.recentViews)) {
        setViews(json.data.recentViews);
        setLastRefreshed(new Date());
      }
      // Pull the server-computed active session count (counts distinct open
      // browser tabs, not just unique IPs — so multiple tabs show correctly).
      if (typeof json?.data?.activeSessionCount === 'number') {
        setActiveSessionCount(json.data.activeSessionCount);
      }
    } catch (err) {
      console.warn('VisitorJourney fetch failed:', err);
      setFetchError('Could not load visitor data.');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchData(false); }, [fetchData]);

  // Auto-refresh every 30 s
  useEffect(() => {
    const id = setInterval(() => fetchData(false), AUTO_MS);
    return () => clearInterval(id);
  }, [fetchData]);

  // ── Group views → per-visitor objects ────────────────────────────────
  const visitors = useMemo(() => {
    const map = {};

    views.forEach(v => {
      const id = v.visitorId || 'unknown';
      if (!map[id]) {
        map[id] = {
          visitorId: id,
          shortId:   'V-' + id.slice(0, 6).toUpperCase(),
          email:     v.email || null,
          pages:     [],
          lastSeen:  v.createdAt,
          firstSeen: v.createdAt,
        };
      }
      const vis = map[id];
      if (new Date(v.createdAt) > new Date(vis.lastSeen))  vis.lastSeen  = v.createdAt;
      if (new Date(v.createdAt) < new Date(vis.firstSeen)) vis.firstSeen = v.createdAt;
      if (v.email && !vis.email) vis.email = v.email;

      vis.pages.push({
        _id:               v._id,
        page:              v.page,
        path:              v.path,
        label:             v.label,
        stage:             deriveStage(v),
        packageName:       v.packageName       || null,
        createdAt:         v.createdAt,
        sessionId:         v.sessionId         || null,
        stoppedHere:       !!v.stoppedHere,
        stoppedAt:         v.stoppedAt         || null,
        timeOnPageSeconds: v.timeOnPageSeconds || null,
      });
    });

    return Object.values(map).map(vis => {
      vis.pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      vis.currentPage = vis.pages[0]?.page || null;
      vis.currentPath = vis.pages[0]?.path || null;

      const stopped    = vis.pages.find(p => p.stoppedHere);
      vis.stoppedPage  = stopped?.page      || null;
      vis.stoppedAt    = stopped?.stoppedAt || null;

      const stageIdx   = vis.pages.reduce((best, p) => {
        const idx = STAGE_ORDER.indexOf(p.stage);
        return idx > best ? idx : best;
      }, -1);
      vis.highestStage = stageIdx >= 0 ? STAGE_ORDER[stageIdx] : 'awareness';

      const minsAgo    = (Date.now() - new Date(vis.lastSeen).getTime()) / 60_000;
      vis.isActive     = minsAgo <= 10;
      vis.uniquePages  = new Set(vis.pages.map(p => p.page)).size;

      return vis;
    }).sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return  1;
      return new Date(b.lastSeen) - new Date(a.lastSeen);
    });
  }, [views]);

  // ── Exit notifications ────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevStoppedRef.current;
    visitors.forEach(v => {
      if (v.stoppedPage && prev[v.visitorId] !== v.stoppedPage) {
        const n = {
          id:        `${v.visitorId}-${Date.now()}`,
          shortId:   v.shortId,
          email:     v.email,
          page:      v.stoppedPage,
          stoppedAt: v.stoppedAt,
        };
        setNotifs(p => [n, ...p].slice(0, 5));
        setTimeout(() => setNotifs(p => p.filter(x => x.id !== n.id)), 8000);
      }
    });
    const snap = {};
    visitors.forEach(v => { snap[v.visitorId] = v.stoppedPage; });
    prevStoppedRef.current = snap;
  }, [visitors]);

  // ── Filtered list ─────────────────────────────────────────────────────
  const filtered = useMemo(() => visitors.filter(v => {
    if (showActive && !v.isActive) return false;
    const matchPage   = pageFilter === 'all' || v.pages.some(p => p.page === pageFilter);
    const matchSearch = !search.trim() ||
      v.shortId.toLowerCase().includes(search.toLowerCase()) ||
      (v.email && v.email.toLowerCase().includes(search.toLowerCase()));
    return matchPage && matchSearch;
  }), [visitors, pageFilter, search, showActive]);

  const displayed    = filtered.slice(0, DISPLAY_LIMIT);

  const toggleExpand = id => setExpanded(prev => prev === id ? null : id);
  const isBusy       = loading || refreshing;

  // ── JSX ───────────────────────────────────────────────────────────────
  return (
    <div className="vj-root">

      {/* Header */}
      <div className="vj-header">
        <div className="vj-header-left">
          <Layers size={18} className="vj-header-icon" />
          <div>
            <h3 className="vj-title">Visitor Journey Tracker</h3>
            <p className="vj-subtitle">
              {loading
                ? 'Loading…'
                : `${visitors.length} unique visitor${visitors.length !== 1 ? 's' : ''} tracked`
              }
              {/* Active badge uses server-computed session count — counts each open
                  browser tab separately, not just unique IPs */}
              {!loading && activeSessionCount > 0 && (
                <span style={{
                  marginLeft: '8px', background: '#dcfce7', color: '#15803d',
                  fontSize: '11px', fontWeight: 700, padding: '1px 7px',
                  borderRadius: '99px', border: '1px solid #bbf7d0',
                }}>
                  🟢 {activeSessionCount} active now
                </span>
              )}
              {lastRefreshed && (
                <span style={{ marginLeft: '8px', color: '#94a3b8', fontSize: '11px' }}>
                  · Updated {lastRefreshed.toLocaleTimeString('en-PH', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                  })}
                </span>
              )}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => fetchData(true)}
            disabled={isBusy}
            title="Refresh visitor data"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '6px 14px', borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: isBusy ? '#f8fafc' : '#fff',
              color:      isBusy ? '#94a3b8' : '#6366f1',
              fontSize: '12px', fontWeight: 600,
              cursor: isBusy ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <RefreshCw
              size={14}
              style={{ animation: isBusy ? 'vj-spin 0.7s linear infinite' : 'none' }}
            />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </button>

          {activeSessionCount > 0 && (
            <button
              onClick={() => setShowActive(p => !p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 14px', borderRadius: '8px', border: '1px solid',
                borderColor: showActive ? '#22c55e' : '#e2e8f0',
                background:  showActive ? '#f0fdf4' : '#fff',
                color:       showActive ? '#15803d' : '#64748b',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Wifi size={14} />
              {showActive ? 'Showing active only' : 'Show active only'}
            </button>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="vj-controls">
        <div className="vj-search-wrap">
          <Search size={15} className="vj-search-icon" />
          <input
            className="vj-search"
            placeholder="Search by email or visitor ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="vj-select" value={pageFilter} onChange={e => setPage(e.target.value)}>
          <option value="all">All Pages</option>
          {Object.entries(PAGE_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </div>

      {/* Exit notifications */}
      {notifications.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 14px', borderRadius: '10px',
              background: '#fff7ed', border: '1px solid #fed7aa',
              animation: 'vj-slideIn 0.3s ease',
            }}>
              <Bell size={14} style={{ color: '#ea580c', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', color: '#9a3412', fontWeight: 600 }}>
                {n.email || n.shortId}
              </span>
              <span style={{ fontSize: '13px', color: '#c2410c' }}>
                left the site at&nbsp;<strong>{PAGE_LABELS[n.page] || n.page}</strong>
              </span>
              {n.stoppedAt && (
                <span style={{ fontSize: '11px', color: '#fb923c', marginLeft: 'auto' }}>
                  {formatRelative(n.stoppedAt)}
                </span>
              )}
              <button
                onClick={() => setNotifs(p => p.filter(x => x.id !== n.id))}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#fb923c', fontSize: '16px', lineHeight: 1, padding: '0 2px',
                }}
              >×</button>
            </div>
          ))}
        </div>
      )}

      {/* Visitor list */}
      {loading ? (
        <div style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '56px 0', gap: '12px',
        }}>
          <RefreshCw size={22} style={{ animation: 'vj-spin 0.8s linear infinite', color: '#6366f1' }} />
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>Loading visitor data…</span>
        </div>
      ) : fetchError ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444', fontSize: '13px' }}>
          {fetchError}
          <button
            onClick={() => fetchData(true)}
            style={{
              display: 'block', margin: '12px auto 0', padding: '6px 16px',
              borderRadius: '8px', border: '1px solid #fca5a5',
              background: '#fff', color: '#ef4444',
              fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="vj-empty">
          {visitors.length === 0
            ? 'No visitor data yet.'
            : 'No visitors match the selected filters.'
          }
        </div>
      ) : (
        <>
          <div className="vj-list">
            {displayed.map(v => {
              const isOpen = expandedId === v.visitorId;
              const cfg    = STAGE_CONFIG[v.highestStage] || { color: '#6366f1', bg: '#eef2ff' };

              return (
                <div key={v.visitorId} className={`vj-card ${isOpen ? 'open' : ''}`}>

                  {/* Collapsed row */}
                  <button className="vj-card-row" onClick={() => toggleExpand(v.visitorId)}>
                    <div className="vj-card-left">

                      {/* Avatar */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div className="vj-avatar" style={{ background: cfg.bg, color: cfg.color }}>
                          {v.email ? v.email[0].toUpperCase() : v.shortId.slice(-2)}
                        </div>
                        {v.isActive && (
                          <span style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 10, height: 10, borderRadius: '50%',
                            background: '#22c55e', border: '2px solid #fff',
                          }} />
                        )}
                        {!v.isActive && v.stoppedPage && (
                          <span style={{
                            position: 'absolute', bottom: 0, right: 0,
                            width: 10, height: 10, borderRadius: '50%',
                            background: '#94a3b8', border: '2px solid #fff',
                          }} />
                        )}
                      </div>

                      {/* Info */}
                      <div className="vj-card-info">
                        <span className="vj-card-id">{v.email || v.shortId}</span>
                        <span className="vj-card-meta">
                          <Clock size={11} />
                          Last seen {formatRelative(v.lastSeen)}
                          &nbsp;·&nbsp;{v.pages.length} visit{v.pages.length !== 1 ? 's' : ''}
                          &nbsp;·&nbsp;{v.uniquePages} page{v.uniquePages !== 1 ? 's' : ''}
                        </span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '3px' }}>
                          {v.isActive && v.currentPage && (
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '1px 7px',
                              borderRadius: '99px', background: '#dcfce7',
                              color: '#15803d', border: '1px solid #bbf7d0',
                            }}>
                              📍 Now: {PAGE_LABELS[v.currentPage] || v.currentPage}
                            </span>
                          )}
                          {!v.isActive && v.stoppedPage && (
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '1px 7px',
                              borderRadius: '99px', background: '#f1f5f9',
                              color: '#475569', border: '1px solid #cbd5e1',
                            }}>
                              🚪 Left at: {PAGE_LABELS[v.stoppedPage] || v.stoppedPage}
                              {v.stoppedAt ? ` · ${formatRelative(v.stoppedAt)}` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="vj-card-right">
                      <div className="vj-card-stage-wrap">
                        <StagePill stage={v.highestStage} />
                        <StageProgressBar stage={v.highestStage} />
                      </div>
                      {isOpen
                        ? <ChevronUp   size={16} className="vj-chevron" />
                        : <ChevronDown size={16} className="vj-chevron" />
                      }
                    </div>
                  </button>

                  {/* Expanded timeline */}
                  {isOpen && (
                    <div className="vj-timeline">
                      <p className="vj-timeline-heading">
                        Full Page History&nbsp;
                        <span style={{ fontWeight: 400, textTransform: 'none', color: '#64748b' }}>
                          ({v.pages.length} visit{v.pages.length !== 1 ? 's' : ''} across {v.uniquePages} page{v.uniquePages !== 1 ? 's' : ''})
                        </span>
                      </p>

                      {v.pages.map((p, i) => {
                        const stageCfg = STAGE_CONFIG[p.stage] || { color: '#64748b', bg: '#f1f5f9' };
                        const isLatest = i === 0;
                        const dur      = formatDuration(p.timeOnPageSeconds);

                        return (
                          <div key={p._id || i} className="vj-timeline-row">
                            <div
                              className="vj-tl-dot"
                              style={{
                                background: stageCfg.color,
                                boxShadow:  isLatest ? `0 0 0 3px ${stageCfg.color}33` : 'none',
                              }}
                            />
                            <div className="vj-tl-content">
                              <div className="vj-tl-top">
                                <span className="vj-tl-page">
                                  {PAGE_LABELS[p.page] || p.page}
                                  {p.packageName && (
                                    <span className="vj-tl-pkg"> — {p.packageName}</span>
                                  )}
                                </span>
                                <StagePill stage={p.stage} />

                                {isLatest && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: 700, padding: '1px 6px',
                                    borderRadius: '99px', background: '#fef9c3',
                                    color: '#854d0e', border: '1px solid #fde047',
                                  }}>
                                    Latest
                                  </span>
                                )}
                                {p.stoppedHere && (
                                  <span style={{
                                    fontSize: '10px', fontWeight: 700, padding: '1px 6px',
                                    borderRadius: '99px', background: '#f1f5f9',
                                    color: '#475569', border: '1px solid #cbd5e1',
                                    display: 'flex', alignItems: 'center', gap: '3px',
                                  }}>
                                    <WifiOff size={9} /> Left here
                                  </span>
                                )}
                              </div>
                              <div className="vj-tl-meta">
                                <MapPin size={11} /> {p.path}
                                &nbsp;·&nbsp;
                                <Clock size={11} /> {formatRelative(p.createdAt)}
                                {dur && <>&nbsp;·&nbsp;⏱ {dur} on page</>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>


        </>
      )}
    </div>
  );
};

export default VisitorJourney;