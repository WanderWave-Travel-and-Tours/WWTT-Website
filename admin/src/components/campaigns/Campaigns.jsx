import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  MapPin,
  Globe,
  Plus,
  Search,
  LayoutGrid,
  List,
  Edit3,
  Archive,
  RotateCcw,
  ChevronRight,
  Phone,
  MessageSquare,
  Lightbulb,
  X,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import './Campaigns.css';
import Sidebar from '../sidebar/sidebar';

const API_BASE = import.meta.env?.VITE_API_URL || '';

// ─────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────
const statusColor = (isArchive) =>
  isArchive === 'Yes'
    ? { bg: '#fef2f2', color: '#ef4444', dot: '#ef4444' }
    : { bg: '#dcfce7', color: '#16a34a', dot: '#16a34a' };

const TipBadge = ({ count }) => (
  <span className="cp-tip-badge">
    <Lightbulb size={10} />
    {count} tip{count !== 1 ? 's' : ''}
  </span>
);

// ─────────────────────────────────────────────────────────────
//  EMPTY TIP TEMPLATE
// ─────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name: '',
  country: '',
  destinationGreeting: '',
  emergencyNumber: '911 (Philippines)',
  isArchive: 'No',
  tips: [{ text: '' }],
});

// ─────────────────────────────────────────────────────────────
//  DESTINATION FORM  (used in both Add and Edit mode)
// ─────────────────────────────────────────────────────────────
const DestinationForm = ({ initial, onSave, onCancel, saving, error }) => {
  const [form, setForm] = useState(initial || emptyForm());

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const setTip = (idx, val) =>
    setForm((f) => {
      const tips = [...f.tips];
      tips[idx] = { text: val };
      return { ...f, tips };
    });

  const addTip = () => {
    if (form.tips.length < 5)
      setForm((f) => ({ ...f, tips: [...f.tips, { text: '' }] }));
  };

  const removeTip = (idx) =>
    setForm((f) => ({ ...f, tips: f.tips.filter((_, i) => i !== idx) }));

  return (
    <div className="cp-form-body">
      {error && (
        <div className="cp-alert cp-alert--error">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Row 1 */}
      <div className="cp-form-row">
        <div className="cp-form-field">
          <label className="cp-form-label">
            <MapPin size={12} /> Destination Name *
          </label>
          <input
            className="cp-form-input"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g. Palawan"
          />
        </div>
        <div className="cp-form-field">
          <label className="cp-form-label">
            <Globe size={12} /> Country / Region
          </label>
          <input
            className="cp-form-input"
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            placeholder="e.g. Philippines"
          />
        </div>
      </div>

      {/* Greeting */}
      <div className="cp-form-field">
        <label className="cp-form-label">
          <MessageSquare size={12} /> Destination Greeting
        </label>
        <textarea
          className="cp-form-input cp-form-textarea"
          value={form.destinationGreeting}
          onChange={(e) => set('destinationGreeting', e.target.value)}
          placeholder="e.g. Enjoy the crystal-clear waters and limestone cliffs of Palawan"
          rows={2}
        />
        <span className="cp-form-hint">
          Injected into the hero subtext of the personalized travel email.
        </span>
      </div>

      {/* Emergency + Archive */}
      <div className="cp-form-row">
        <div className="cp-form-field">
          <label className="cp-form-label">
            <Phone size={12} /> Emergency Number
          </label>
          <input
            className="cp-form-input"
            value={form.emergencyNumber}
            onChange={(e) => set('emergencyNumber', e.target.value)}
            placeholder="e.g. 911 (Philippines)"
          />
        </div>
        <div className="cp-form-field">
          <label className="cp-form-label">Status</label>
          <select
            className="cp-form-select"
            value={form.isArchive}
            onChange={(e) => set('isArchive', e.target.value)}
          >
            <option value="No">Active</option>
            <option value="Yes">Archived</option>
          </select>
        </div>
      </div>

      {/* Tips */}
      <div className="cp-form-field">
        <div className="cp-tips-header">
          <label className="cp-form-label">
            <Lightbulb size={12} /> Travel Tips
            <span className="cp-tips-count">({form.tips.length}/5)</span>
          </label>
          {form.tips.length < 5 && (
            <button type="button" className="cp-tips-add" onClick={addTip}>
              <Plus size={12} /> Add Tip
            </button>
          )}
        </div>
        {form.tips.map((tip, i) => (
          <div key={i} className="cp-tip-row">
            <span className="cp-tip-num">{i + 1}</span>
            <input
              className="cp-form-input cp-tip-input"
              value={tip.text}
              onChange={(e) => setTip(i, e.target.value)}
              placeholder={`Tip ${i + 1}…`}
            />
            <button
              type="button"
              className="cp-tip-remove"
              onClick={() => removeTip(i)}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {form.tips.length === 0 && (
          <p className="cp-form-hint">No tips yet. Click "Add Tip" to add up to 5.</p>
        )}
      </div>

      {/* Footer */}
      <div className="cp-form-footer">
        <button className="cp-btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button
          className="cp-btn-save"
          onClick={() => onSave(form)}
          disabled={saving || !form.name.trim()}
        >
          {saving ? <Loader2 size={14} className="cp-spin" /> : <Save size={14} />}
          {saving ? 'Saving…' : 'Save Destination'}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  DRAWER  (Detail + Edit)
// ─────────────────────────────────────────────────────────────
const Drawer = ({ destination, onClose, onUpdated }) => {
  const [mode, setMode]       = useState('view'); // 'view' | 'edit'
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState(null);

  if (!destination) return null;
  const s = statusColor(destination.isArchive);

  const handleSave = async (form) => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.put(
        `${API_BASE}/api/destinations/${destination._id}`,
        form
      );
      onUpdated(data.data || data);
      setMode('view');
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="cp-drawer-overlay" onClick={onClose} />
      <aside className="cp-drawer">
        {/* Drawer Header */}
        <div className="cp-drawer-head">
          <div className="cp-drawer-head-left">
            <div className="cp-drawer-icon">
              <MapPin size={18} color="#001F3F" />
            </div>
            <div>
              <h3 className="cp-drawer-name">{destination.name}</h3>
              {destination.country && (
                <span className="cp-drawer-country">
                  <Globe size={11} /> {destination.country}
                </span>
              )}
            </div>
          </div>
          <div className="cp-drawer-head-right">
            <span
              className="cp-status-badge"
              style={{ background: s.bg, color: s.color }}
            >
              <span
                className="cp-status-dot"
                style={{ background: s.dot }}
              />
              {destination.isArchive === 'Yes' ? 'Archived' : 'Active'}
            </span>
            <button className="cp-drawer-close" onClick={onClose}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="cp-drawer-body">
          {mode === 'view' ? (
            <>
              {/* Greeting */}
              {destination.destinationGreeting && (
                <div className="cp-detail-section">
                  <span className="cp-detail-label">
                    <MessageSquare size={12} /> Greeting
                  </span>
                  <p className="cp-detail-text cp-detail-greeting">
                    "{destination.destinationGreeting}"
                  </p>
                </div>
              )}

              {/* Emergency */}
              <div className="cp-detail-section">
                <span className="cp-detail-label">
                  <Phone size={12} /> Emergency Number
                </span>
                <p className="cp-detail-text">{destination.emergencyNumber || '—'}</p>
              </div>

              {/* Tips */}
              <div className="cp-detail-section">
                <span className="cp-detail-label">
                  <Lightbulb size={12} /> Travel Tips
                </span>
                {destination.tips?.length > 0 ? (
                  <ol className="cp-detail-tips">
                    {destination.tips.map((t, i) => (
                      <li key={i} className="cp-detail-tip-item">
                        <span className="cp-detail-tip-num">{i + 1}</span>
                        <span>{t.text}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="cp-detail-empty">No travel tips added yet.</p>
                )}
              </div>

              {/* Timestamps */}
              <div className="cp-detail-section cp-detail-meta">
                <span className="cp-detail-meta-item">
                  Created:{' '}
                  {new Date(destination.createdAt).toLocaleDateString('en-PH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </span>
                <span className="cp-detail-meta-item">
                  Updated:{' '}
                  {new Date(destination.updatedAt).toLocaleDateString('en-PH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </span>
              </div>

              {/* Edit CTA */}
              <div className="cp-drawer-view-footer">
                <button
                  className="cp-btn-edit"
                  onClick={() => setMode('edit')}
                >
                  <Edit3 size={14} /> Edit Destination
                </button>
              </div>
            </>
          ) : (
            <DestinationForm
              initial={{
                name: destination.name,
                country: destination.country || '',
                destinationGreeting: destination.destinationGreeting || '',
                emergencyNumber: destination.emergencyNumber || '911 (Philippines)',
                isArchive: destination.isArchive || 'No',
                tips: destination.tips?.length > 0
                  ? destination.tips.map((t) => ({ text: t.text }))
                  : [],
              }}
              onSave={handleSave}
              onCancel={() => { setMode('view'); setError(null); }}
              saving={saving}
              error={error}
            />
          )}
        </div>
      </aside>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
//  ADD MODAL
// ─────────────────────────────────────────────────────────────
const AddModal = ({ onClose, onCreated }) => {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  const handleSave = async (form) => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE}/api/destinations`, form);
      onCreated(data.data || data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create destination.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="cp-drawer-overlay" onClick={onClose} />
      <aside className="cp-drawer">
        <div className="cp-drawer-head">
          <div className="cp-drawer-head-left">
            <div className="cp-drawer-icon">
              <Plus size={18} color="#001F3F" />
            </div>
            <div>
              <h3 className="cp-drawer-name">New Destination</h3>
              <span className="cp-drawer-country">Fill in the details below</span>
            </div>
          </div>
          <button className="cp-drawer-close" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <div className="cp-drawer-body">
          <DestinationForm
            initial={emptyForm()}
            onSave={handleSave}
            onCancel={onClose}
            saving={saving}
            error={error}
          />
        </div>
      </aside>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
//  GRID CARD
// ─────────────────────────────────────────────────────────────
const DestCard = ({ dest, onClick }) => {
  const s = statusColor(dest.isArchive);
  return (
    <button className="cp-dest-card" onClick={() => onClick(dest)}>
      <div className="cp-dest-card-top">
        <div className="cp-dest-card-icon">
          <MapPin size={20} color="#001F3F" />
        </div>
        <span
          className="cp-status-badge cp-status-badge--sm"
          style={{ background: s.bg, color: s.color }}
        >
          <span className="cp-status-dot" style={{ background: s.dot }} />
          {dest.isArchive === 'Yes' ? 'Archived' : 'Active'}
        </span>
      </div>
      <div className="cp-dest-card-body">
        <h4 className="cp-dest-card-name">{dest.name}</h4>
        {dest.country && (
          <span className="cp-dest-card-country">
            <Globe size={11} /> {dest.country}
          </span>
        )}
        {dest.destinationGreeting && (
          <p className="cp-dest-card-greeting">"{dest.destinationGreeting}"</p>
        )}
      </div>
      <div className="cp-dest-card-footer">
        <TipBadge count={dest.tips?.length || 0} />
        <span className="cp-dest-card-arrow">
          <ChevronRight size={14} />
        </span>
      </div>
    </button>
  );
};

// ─────────────────────────────────────────────────────────────
//  MAIN PAGE
// ─────────────────────────────────────────────────────────────
const Campaigns = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [fetchError, setFetchError]     = useState(null);

  // View + filter
  const [viewMode, setViewMode]         = useState('list'); // 'list' | 'grid'
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Drawer / modal
  const [selected, setSelected]         = useState(null);
  const [showAdd, setShowAdd]           = useState(false);

  // ── Fetch all destinations ─────────────────────────────
  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/api/destinations`);
      const list = Array.isArray(data) ? data : (data.data || []);
      setDestinations(list);
    } catch (err) {
      setFetchError('Could not load destinations. Check your API connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDestinations(); }, [fetchDestinations]);

  // ── Filter logic ───────────────────────────────────────
  const filtered = destinations.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.country || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && d.isArchive === 'No') ||
      (statusFilter === 'archived' && d.isArchive === 'Yes');
    return matchSearch && matchStatus;
  });

  const total    = destinations.length;
  const active   = destinations.filter((d) => d.isArchive === 'No').length;
  const archived = destinations.filter((d) => d.isArchive === 'Yes').length;

  // ── Handlers ──────────────────────────────────────────
  const handleUpdated = (updated) => {
    setDestinations((prev) =>
      prev.map((d) => (d._id === updated._id ? updated : d))
    );
    setSelected(updated);
  };

  const handleCreated = (created) => {
    setDestinations((prev) => [created, ...prev]);
  };

  return (
    <div className="cp-layout">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={() => setIsCollapsed(v => !v)} />
      <main
        className="cp-main"
        style={{ marginLeft: isCollapsed ? '88px' : '280px' }}
      >
        <div className="cp-container">

          {/* ── Header ── */}
          <header className="cp-header">
            <div className="cp-header-left">
              <div className="cp-header-icon-wrap">
                <MapPin size={22} color="#001F3F" />
              </div>
              <div>
                <h1 className="cp-title">Destinations</h1>
                <p className="cp-subtitle">
                  Manage travel destinations and their email personalization content.
                </p>
              </div>
            </div>
            <button className="cp-btn-new" onClick={() => setShowAdd(true)}>
              <Plus size={15} /> Add Destination
            </button>
          </header>

          {/* ── Summary Cards ── */}
          <div className="cp-summary-grid">
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--active">
                <MapPin size={18} />
              </div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">Total</span>
                <span className="cp-summary-value">{total}</span>
                <span className="cp-summary-sub">destinations</span>
              </div>
            </div>
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--budget">
                <Globe size={18} />
              </div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">Active</span>
                <span className="cp-summary-value">{active}</span>
                <span className="cp-summary-sub">live destinations</span>
              </div>
            </div>
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--spent">
                <Archive size={18} />
              </div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">Archived</span>
                <span className="cp-summary-value">{archived}</span>
                <span className="cp-summary-sub">hidden from packages</span>
              </div>
            </div>
            <div className="cp-summary-card">
              <div className="cp-summary-icon cp-icon--reach">
                <Lightbulb size={18} />
              </div>
              <div className="cp-summary-body">
                <span className="cp-summary-label">With Tips</span>
                <span className="cp-summary-value">
                  {destinations.filter((d) => d.tips?.length > 0).length}
                </span>
                <span className="cp-summary-sub">have travel tips</span>
              </div>
            </div>
          </div>

          {/* ── Filters + View Toggle ── */}
          <div className="cp-filters">
            <div className="cp-search-wrap">
              <Search size={14} className="cp-search-icon" />
              <input
                className="cp-search"
                placeholder="Search by name or country…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="cp-filter-group">
              <select
                className="cp-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="cp-view-toggle">
              <button
                className={`cp-view-btn ${viewMode === 'list' ? 'cp-view-btn--active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <List size={15} />
              </button>
              <button
                className={`cp-view-btn ${viewMode === 'grid' ? 'cp-view-btn--active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <LayoutGrid size={15} />
              </button>
            </div>
          </div>

          {/* ── Error Banner ── */}
          {fetchError && (
            <div className="cp-alert cp-alert--error">
              <AlertCircle size={14} /> {fetchError}
            </div>
          )}

          {/* ── Loading ── */}
          {loading ? (
            <div className="cp-loading">
              <Loader2 size={24} className="cp-spin" />
              <span>Loading destinations…</span>
            </div>
          ) : viewMode === 'list' ? (
            /* ── LIST VIEW ── */
            <div className="cp-table-wrap">
              <table className="cp-table">
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>Country</th>
                    <th>Greeting</th>
                    <th>Emergency</th>
                    <th>Tips</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="cp-empty">
                          No destinations found.{' '}
                          {search || statusFilter !== 'all'
                            ? 'Try adjusting your filters.'
                            : 'Click "Add Destination" to get started.'}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((dest) => {
                      const s = statusColor(dest.isArchive);
                      return (
                        <tr
                          key={dest._id}
                          className="cp-dest-row"
                          onClick={() => setSelected(dest)}
                        >
                          <td>
                            <div className="cp-dest-name-cell">
                              <div className="cp-dest-row-icon">
                                <MapPin size={13} color="#001F3F" />
                              </div>
                              <span className="cp-cell-name">{dest.name}</span>
                            </div>
                          </td>
                          <td>
                            <span className="cp-cell-mono">
                              {dest.country || <span style={{ color: '#d1d5db' }}>—</span>}
                            </span>
                          </td>
                          <td>
                            <span className="cp-dest-greeting-cell">
                              {dest.destinationGreeting
                                ? `"${dest.destinationGreeting.slice(0, 55)}${dest.destinationGreeting.length > 55 ? '…' : ''}"`
                                : <span style={{ color: '#d1d5db' }}>—</span>
                              }
                            </span>
                          </td>
                          <td>
                            <span className="cp-cell-mono" style={{ fontSize: '0.8rem' }}>
                              {dest.emergencyNumber || '—'}
                            </span>
                          </td>
                          <td>
                            <TipBadge count={dest.tips?.length || 0} />
                          </td>
                          <td>
                            <span
                              className="cp-status-badge"
                              style={{ background: s.bg, color: s.color }}
                            >
                              <span className="cp-status-dot" style={{ background: s.dot }} />
                              {dest.isArchive === 'Yes' ? 'Archived' : 'Active'}
                            </span>
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <button
                              className="cp-actions-btn"
                              onClick={() => setSelected(dest)}
                              title="View & Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── GRID VIEW ── */
            filtered.length === 0 ? (
              <div className="cp-table-wrap">
                <div className="cp-empty">
                  No destinations found.{' '}
                  {search || statusFilter !== 'all'
                    ? 'Try adjusting your filters.'
                    : 'Click "Add Destination" to get started.'}
                </div>
              </div>
            ) : (
              <div className="cp-dest-grid">
                {filtered.map((dest) => (
                  <DestCard key={dest._id} dest={dest} onClick={setSelected} />
                ))}
              </div>
            )
          )}

        </div>
      </main>

      {/* ── Detail / Edit Drawer ── */}
      {selected && (
        <Drawer
          destination={selected}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {/* ── Add Destination Modal ── */}
      {showAdd && (
        <AddModal
          onClose={() => setShowAdd(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
};

export default Campaigns;