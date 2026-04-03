// src/components/Dashboard/VisitorJourney.jsx
// Drop this anywhere in your dashboard. Pass recentViews from your /stats fetch.
//
// Usage:
//   <VisitorJourney recentViews={pageViewStats.recentViews} />

import React, { useMemo, useState } from 'react';
import { Search, ChevronDown, ChevronUp, MapPin, Clock, Layers } from 'lucide-react';
import './VisitorJourney.css';

// ── Config ─────────────────────────────────────────────────────────────
// Stage order from lowest to highest (matches RevenueAnalytics funnel)
const STAGE_ORDER = ['awareness', 'interest', 'consideration', 'intent', 'conversion'];

const STAGE_CONFIG = {
  awareness:     { label: 'Awareness',     color: '#6366f1', bg: '#eef2ff' },
  interest:      { label: 'Interest',      color: '#3b82f6', bg: '#eff6ff' },
  consideration: { label: 'Consideration', color: '#f59e0b', bg: '#fffbeb' },
  intent:        { label: 'Intent',        color: '#10b981', bg: '#ecfdf5' },
  conversion:    { label: 'Conversion',    color: '#22c55e', bg: '#f0fdf4' },
};

// ── PAGE → STAGE MAPPING ────────────────────────────────────────────────
// This must match exactly how the backend/tracker assigns stages per page.
// Based on the funnel logic in RevenueAnalytics.jsx:
//   awareness     = any visit (home, services, flights, tours)
//   interest      = browsing packages or tours page
//   consideration = viewing a specific package (booking page with packageName)
//   intent        = reached booking page (ready to book)
//   conversion    = completed a booking
const PAGE_TO_STAGE = {
  home:     'awareness',
  services: 'awareness',
  flights:  'awareness',
  tours:    'interest',
  packages: 'interest',
  booking:  'intent',        // default for booking page
  // 'conversion' is set below if packageName is present AND status is confirmed
};

// Derive stage from a single view record (mirrors backend tracker logic)
function deriveStage(view) {
  // If the backend already set a valid stage, trust it
  if (view.stage && STAGE_ORDER.includes(view.stage)) {
    return view.stage;
  }
  // Fallback: derive from page
  const page = view.page || '';
  if (page === 'booking') {
    // If packageName exists → visitor is considering a specific package
    return view.packageName ? 'consideration' : 'intent';
  }
  return PAGE_TO_STAGE[page] || 'awareness';
}

const PAGE_LABELS = {
  home:     'Home',
  packages: 'Package Deals',
  booking:  'Booking',
  flights:  'Flights',
  services: 'Services',
  tours:    'Tours',
};

function formatRelative(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return 'just now';
  if (mins  < 60)  return `${mins}m ago`;
  if (hours < 24)  return `${hours}h ago`;
  if (days  < 7)   return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

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

// ── Current Page Badge ──────────────────────────────────────────────────
function CurrentPageBadge({ page }) {
  const label = PAGE_LABELS[page] || page;
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: '99px',
        background: '#fef9c3',
        color: '#854d0e',
        border: '1px solid #fde047',
        whiteSpace: 'nowrap',
      }}
    >
      📍 Now: {label}
    </span>
  );
}

// ── Main Component ──────────────────────────────────────────────────────
const VisitorJourney = ({ recentViews = [] }) => {
  const [search, setSearch]       = useState('');
  const [expandedId, setExpanded] = useState(null);
  const [stageFilter, setStage]   = useState('all');
  const [pageFilter, setPage]     = useState('all');

  // Group views by visitorId ─────────────────────────────────────────
  const visitors = useMemo(() => {
    const map = {};

    recentViews.forEach(v => {
      const id = v.visitorId || 'unknown';
      if (!map[id]) {
        map[id] = {
          visitorId:  id,
          shortId:    'V-' + id.slice(0, 6).toUpperCase(),
          email:      v.email || null,
          pages:      [],
          lastSeen:   v.createdAt,
          firstSeen:  v.createdAt,
        };
      }
      const vis = map[id];

      // Track first/last seen
      if (new Date(v.createdAt) > new Date(vis.lastSeen))  vis.lastSeen  = v.createdAt;
      if (new Date(v.createdAt) < new Date(vis.firstSeen)) vis.firstSeen = v.createdAt;

      // Derive correct stage from page (fixes wrong stage bug)
      const derivedStage = deriveStage(v);

      vis.pages.push({
        page:        v.page,
        path:        v.path,
        label:       v.label,
        stage:       derivedStage,            // ← use derived, not raw v.stage
        packageName: v.packageName || null,
        createdAt:   v.createdAt,
      });

      // Email — pick it up if any view has it
      if (v.email && !vis.email) vis.email = v.email;
    });

    return Object.values(map).map(v => {
      // Sort pages newest first
      v.pages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Current page = the most recent page visit
      v.currentPage = v.pages[0]?.page || null;
      v.currentPageTime = v.pages[0]?.createdAt || null;

      // Highest stage = highest stage index across all pages
      const stageIdx = v.pages.reduce((best, p) => {
        const idx = STAGE_ORDER.indexOf(p.stage);
        return idx > best ? idx : best;
      }, -1);

      v.highestStage = stageIdx >= 0 ? STAGE_ORDER[stageIdx] : 'awareness';
      v.stageIndex   = stageIdx;

      // Is visitor currently active? (last seen within 15 minutes)
      const minsAgo = (Date.now() - new Date(v.lastSeen).getTime()) / 60000;
      v.isActive = minsAgo <= 15;

      return v;
    })
    // Sort: active first, then most recently seen
    .sort((a, b) => {
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      return new Date(b.lastSeen) - new Date(a.lastSeen);
    });
  }, [recentViews]);

  // Filters ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return visitors.filter(v => {
      const matchStage = stageFilter === 'all' || v.highestStage === stageFilter;
      const matchPage  = pageFilter  === 'all' || v.pages.some(p => p.page === pageFilter);
      const matchSearch = !search.trim() ||
        v.shortId.toLowerCase().includes(search.toLowerCase()) ||
        (v.email && v.email.toLowerCase().includes(search.toLowerCase()));
      return matchStage && matchPage && matchSearch;
    });
  }, [visitors, stageFilter, pageFilter, search]);

  // Count active visitors
  const activeCount = visitors.filter(v => v.isActive).length;

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id);

  return (
    <div className="vj-root">
      {/* Header */}
      <div className="vj-header">
        <div className="vj-header-left">
          <Layers size={18} className="vj-header-icon" />
          <div>
            <h3 className="vj-title">Visitor Journey Tracker</h3>
            <p className="vj-subtitle">
              {visitors.length} unique visitor{visitors.length !== 1 ? 's' : ''} tracked
              {activeCount > 0 && (
                <span style={{
                  marginLeft: '8px',
                  background: '#dcfce7',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: '99px',
                  border: '1px solid #bbf7d0',
                }}>
                  🟢 {activeCount} active now
                </span>
              )}
            </p>
          </div>
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

        <select className="vj-select" value={stageFilter} onChange={e => setStage(e.target.value)}>
          <option value="all">All Stages</option>
          {STAGE_ORDER.map(s => (
            <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
          ))}
        </select>

        <select className="vj-select" value={pageFilter} onChange={e => setPage(e.target.value)}>
          <option value="all">All Pages</option>
          {Object.entries(PAGE_LABELS).map(([val, lbl]) => (
            <option key={val} value={val}>{lbl}</option>
          ))}
        </select>
      </div>

      {/* Stage Summary Chips */}
      <div className="vj-stage-summary">
        {STAGE_ORDER.map(s => {
          const count = visitors.filter(v => v.highestStage === s).length;
          const cfg   = STAGE_CONFIG[s];
          return (
            <button
              key={s}
              className={`vj-stage-chip ${stageFilter === s ? 'active' : ''}`}
              style={stageFilter === s ? { background: cfg.color, color: '#fff', borderColor: cfg.color } : {}}
              onClick={() => setStage(prev => prev === s ? 'all' : s)}
            >
              <span className="vj-chip-dot" style={{ background: cfg.color }} />
              {cfg.label}
              <span className="vj-chip-count">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Visitor List */}
      {filtered.length === 0 ? (
        <div className="vj-empty">No visitors found for the selected filters.</div>
      ) : (
        <div className="vj-list">
          {filtered.map(v => {
            const isOpen = expandedId === v.visitorId;
            const cfg    = STAGE_CONFIG[v.highestStage] || {};
            return (
              <div key={v.visitorId} className={`vj-card ${isOpen ? 'open' : ''}`}>

                {/* Row summary */}
                <button className="vj-card-row" onClick={() => toggleExpand(v.visitorId)}>
                  <div className="vj-card-left">
                    {/* Active indicator dot on avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div className="vj-avatar" style={{ background: cfg.bg, color: cfg.color }}>
                        {v.email ? v.email[0].toUpperCase() : v.shortId.slice(-2)}
                      </div>
                      {v.isActive && (
                        <span style={{
                          position: 'absolute',
                          bottom: 0,
                          right: 0,
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          background: '#22c55e',
                          border: '2px solid #fff',
                        }} />
                      )}
                    </div>

                    <div className="vj-card-info">
                      <span className="vj-card-id">
                        {v.email || v.shortId}
                      </span>
                      <span className="vj-card-meta">
                        <Clock size={11} />
                        Last seen {formatRelative(v.lastSeen)}
                        &nbsp;·&nbsp;
                        {v.pages.length} page{v.pages.length !== 1 ? 's' : ''}
                      </span>
                      {/* Current page badge — shown when active or recently visited */}
                      {v.currentPage && (
                        <span style={{ marginTop: '2px' }}>
                          <CurrentPageBadge page={v.currentPage} />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="vj-card-right">
                    <div className="vj-card-stage-wrap">
                      <StagePill stage={v.highestStage} />
                      <StageProgressBar stage={v.highestStage} />
                    </div>
                    {isOpen ? <ChevronUp size={16} className="vj-chevron" /> : <ChevronDown size={16} className="vj-chevron" />}
                  </div>
                </button>

                {/* Expanded: full page timeline */}
                {isOpen && (
                  <div className="vj-timeline">
                    <p className="vj-timeline-heading">Pages Visited</p>
                    {v.pages.map((p, i) => {
                      const stageCfg = STAGE_CONFIG[p.stage] || { color: '#64748b', bg: '#f1f5f9' };
                      const isCurrent = i === 0; // most recent = index 0 (sorted newest first)
                      return (
                        <div key={i} className="vj-timeline-row">
                          <div
                            className="vj-tl-dot"
                            style={{
                              background: stageCfg.color,
                              // pulse ring on current page
                              boxShadow: isCurrent ? `0 0 0 3px ${stageCfg.color}33` : 'none',
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
                              {isCurrent && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '99px',
                                  background: '#fef9c3',
                                  color: '#854d0e',
                                  border: '1px solid #fde047',
                                }}>
                                  Latest Visit
                                </span>
                              )}
                            </div>
                            <div className="vj-tl-meta">
                              <MapPin size={11} /> {p.path}
                              &nbsp;·&nbsp;
                              <Clock size={11} /> {formatRelative(p.createdAt)}
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
      )}
    </div>
  );
};

export default VisitorJourney;