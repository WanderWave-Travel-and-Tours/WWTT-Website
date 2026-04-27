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

// ─────────────────────────────────────────────────────────────
//  EMPTY TIP TEMPLATE
// ─────────────────────────────────────────────────────────────
const emptyForm = () => ({
  name: '',
  country: '',
  destinationGreeting: '',
  emergencyNumber: '911 (Philippines)',
  isArchive: 'No',
  isInternational: false,
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

      {/* Destination Type Toggle */}
      <div className="cp-form-field">
        <label className="cp-form-label">
          <Globe size={12} /> Destination Type
        </label>
        <div className="cp-type-toggle" style={{ width: 'fit-content' }}>
          <button
            type="button"
            className={`cp-type-btn ${!form.isInternational ? 'cp-type-btn--active' : ''}`}
            onClick={() => set('isInternational', false)}
          >
            <MapPin size={13} /> Local
          </button>
          <button
            type="button"
            className={`cp-type-btn ${form.isInternational ? 'cp-type-btn--active' : ''}`}
            onClick={() => set('isInternational', true)}
          >
            <Globe size={13} /> International
          </button>
        </div>
        <span className="cp-form-hint">
          Local = within the Philippines. International = outside the Philippines.
        </span>
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
//  MODAL  (Detail + Edit) — floating centered modal
// ─────────────────────────────────────────────────────────────
const Drawer = ({ destination, onClose, onUpdated }) => {
  const [mode, setMode]     = useState('view'); // 'view' | 'edit'
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState(null);

  // ✅ Snapshot of destination data taken at the moment Edit is clicked.
  // This is completely isolated from the `destination` prop so parent re-renders
  // (e.g. setSelected after save) cannot overwrite what the user typed.
  const [snapshot, setSnapshot] = useState(null);

  if (!destination) return null;
  const s = statusColor(destination.isArchive);

  const openEdit = () => {
    // Take a deep snapshot of current destination data
    setSnapshot({
      _editTs:             Date.now(), // forces DestinationForm to remount fresh every edit session
      name:                destination.name,
      country:             destination.country || '',
      destinationGreeting: destination.destinationGreeting || '',
      emergencyNumber:     destination.emergencyNumber ?? '', // ?? not || so empty string is preserved
      isArchive:           destination.isArchive || 'No',
      isInternational:     destination.isInternational === true,
      tips:                destination.tips?.length > 0
                             ? destination.tips.map((t) => ({ text: t.text }))
                             : [],
    });
    setError(null);
    setMode('edit');
  };

  const cancelEdit = () => {
    setSnapshot(null);
    setError(null);
    setMode('view');
  };

  const handleSave = async (form) => {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name:                form.name.trim(),
        country:             form.country?.trim() || '',
        destinationGreeting: form.destinationGreeting?.trim() || '',
        emergencyNumber:     form.emergencyNumber?.trim() ?? '',
        isInternational:     form.isInternational === true,
        isArchive:           form.isArchive || 'No',
        tips:                (form.tips || []).filter(t => t.text?.trim() !== ''),
      };
      const { data } = await axios.put(
        `${API_BASE}/destinations/edit/${destination._id}`,
        payload
      );
      const saved = data.data || data;
      onUpdated(saved);
      setSnapshot(null);
      setMode('view');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Save failed. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="cp-drawer-overlay" onClick={onClose} />
      <div className="cp-modal">
        {/* Modal Header */}
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

        {/* Modal Body */}
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
                <button className="cp-btn-edit" onClick={openEdit}>
                  <Edit3 size={14} /> Edit Destination
                </button>
              </div>
            </>
          ) : (
            // ✅ key=snapshot ensures DestinationForm mounts exactly once per edit session
            // and never re-mounts due to parent re-renders — snapshot is set once in openEdit()
            snapshot && (
              <DestinationForm
                key={JSON.stringify({ id: destination._id, ts: snapshot._editTs })}
                initial={snapshot}
                onSave={handleSave}
                onCancel={cancelEdit}
                saving={saving}
                error={error}
              />
            )
          )}
        </div>
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
//  ADD MODAL — floating centered modal
// ─────────────────────────────────────────────────────────────
const AddModal = ({ onClose, onCreated }) => {
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState(null);

  const handleSave = async (form) => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.post(`${API_BASE}/destinations/add`, form);
      const created = data.data || data;
      onCreated(created);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create destination.');
      setSaving(false);
    }
  };

  return (
    <>
      <div className="cp-drawer-overlay" onClick={onClose} />
      <div className="cp-modal">
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
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
//  GRID CARD — image background + location icon + name ONLY
//  (no greeting shown on card)
// ─────────────────────────────────────────────────────────────
const DEFAULT_DEST_IMG = 'https://assets.cdn.filesafe.space/yTzQYPFRZAWXGWiXtIt2/media/69eecdb605d4199001dc799e.png';

const DestCard = ({ dest, onClick }) => {
  const imgSrc = dest.imageUrl || DEFAULT_DEST_IMG;

  return (
    <button className="cp-dest-card" onClick={() => onClick(dest)}>
      {/* Image Background — full card, no body below */}
      <div
        className="cp-dest-card-img"
        style={{ backgroundImage: `url(${imgSrc})` }}
      >
        <div className="cp-dest-card-overlay">
          <div className="cp-dest-card-header">
            <MapPin size={16} color="#fff" strokeWidth={2.5} />
            <span className="cp-dest-card-name">{dest.name}</span>
          </div>
        </div>
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

  // Filter
  const [search, setSearch]             = useState('');

  // Drawer / modal
  const [selected, setSelected]         = useState(null);
  const [showAdd, setShowAdd]           = useState(false);

  // ── Fetch all destinations ─────────────────────────────
  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const { data } = await axios.get(`${API_BASE}/destinations`);
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
    return (
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      (d.country || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  // ── Stats derived from all destinations ───────────────
  const total = destinations.length;

  // ── Handlers ──────────────────────────────────────────
  const handleUpdated = (updated) => {
    setDestinations((prev) =>
      prev.map((d) => (d._id === updated._id ? updated : d))
    );
    // ✅ Update selected so the view modal shows fresh data immediately
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
              <Plus size={15} />
              <span>Add Destination</span>
            </button>
          </header>

          {/* ── Stats / Summary Section ── */}
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
          </div>

          {/* ── Filters ── */}
          <div className="cp-filters">
            {/* Search Bar */}
            <div className="cp-search-wrap">
              <Search size={15} className="cp-search-icon" />
              <input
                className="cp-search"
                placeholder="Search destinations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  className="cp-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* ── Error Banner ── */}
          {fetchError && (
            <div className="cp-alert cp-alert--error">
              <AlertCircle size={14} /> {fetchError}
            </div>
          )}

          {/* ── Loading / Grid ── */}
          {loading ? (
            <div className="cp-loading">
              <Loader2 size={24} className="cp-spin" />
              <span>Loading destinations…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="cp-table-wrap">
              <div className="cp-empty">
                {search
                  ? `No destinations match "${search}".`
                  : 'No destinations yet. Add one to get started.'
                }
              </div>
            </div>
          ) : (
            /* ── GRID VIEW ── */
            <div className="cp-dest-grid">
              {filtered.map((dest) => (
                <DestCard key={dest._id} dest={dest} onClick={setSelected} />
              ))}
            </div>
          )}

        </div>
      </main>

      {/* ── Detail / Edit Modal ── */}
      {selected && (
        <Drawer
          key={selected._id}
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