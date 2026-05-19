// cbf/components/SelectedPanel.jsx
import React from 'react';
import { Trash2, Plus } from 'lucide-react';
import { fmt, fmtDate } from './utils';

/**
 * Shows selected tours & transfers as cards with a summary footer.
 * Rendered at the bottom of Step 2 whenever at least one item is selected.
 *
 * Props:
 *   selectedTours     – Tour[]
 *   selectedTransfers – Transfer[]
 *   transferTypes     – { [id]: 'oneway' | 'roundtrip' }
 *   tourDates         – { [tourId]: 'YYYY-MM-DD' }
 *   paxCount          – string | number
 *   grandTotal        – number
 *   firstChoice       – null | 'tour' | 'transfer'
 *   secondPhase       – boolean
 *   onToggleTour      – (tour) => void
 *   onToggleTransfer  – (transfer) => void
 *   onAddSecond       – () => void  (triggers "add second service" flow)
 */
export default function SelectedPanel({
  selectedTours,
  selectedTransfers,
  transferTypes,
  tourDates,
  paxCount,
  grandTotal,
  firstChoice,
  secondPhase,
  onToggleTour,
  onToggleTransfer,
  onAddSecond,
}) {
  const pax = parseInt(paxCount) || 1;

  return (
    <div className="cbf-selected-panel">

      {/* ── Panel header ── */}
      <div className="cbf-sp-header">
        <div className="cbf-sp-header-left">
          <span className="cbf-sp-your-trip">YOUR TRIP</span>
          <h3 className="cbf-sp-title">Selections</h3>
        </div>
        <span className="cbf-sel-count-badge">
          {selectedTours.length + selectedTransfers.length} item
          {selectedTours.length + selectedTransfers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Tour cards ── */}
      {selectedTours.map(t => {
        const tourTotal = (t.price || 0) * pax;
        return (
          <div key={t._id} className="cbf-sel-card">
            <div
              className="cbf-sel-card-img"
              style={{ backgroundImage: `url(${t.imageUrl || t.image || ''})` }}
            >
              <div className="cbf-sel-card-img-overlay" />
              <span className="cbf-sel-card-badge cbf-sel-badge-tour">
                {t.category || 'Tour Package'}
              </span>
              <button
                type="button"
                className="cbf-sel-card-remove"
                onClick={() => onToggleTour(t)}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="cbf-sel-card-body">
              <div className="cbf-sel-card-body-left">
                <span className="cbf-sel-card-name">{t.title || t.name}</span>
                <span className="cbf-sel-card-sub">
                  ₱{Number(t.price || 0).toLocaleString()} × {pax} pax
                  {t.duration ? ` · ${t.duration}` : ''}
                  {tourDates[t._id] ? ` · 📅 ${fmtDate(tourDates[t._id])}` : ''}
                </span>
              </div>
              <div className="cbf-sel-card-body-price">
                <span className="cbf-sel-body-price-label">PRICE</span>
                <span className="cbf-sel-body-price-val">₱{fmt(tourTotal)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Transfer cards ── */}
      {selectedTransfers.map(t => {
        const ttype  = transferTypes[t._id] || 'oneway';
        const tprice = ttype === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
        return (
          <div key={t._id} className="cbf-sel-card">
            <div
              className="cbf-sel-card-img"
              style={{ backgroundImage: `url(${t.imageUrl || ''})` }}
            >
              <div className="cbf-sel-card-img-overlay" />
              <span className="cbf-sel-card-badge cbf-sel-badge-transfer">Transfer</span>
              <button
                type="button"
                className="cbf-sel-card-remove"
                onClick={() => onToggleTransfer(t)}
              >
                <Trash2 size={13} />
              </button>
            </div>
            <div className="cbf-sel-card-body">
              <div className="cbf-sel-card-body-left">
                <span className="cbf-sel-card-name">{t.title}</span>
                <span className="cbf-sel-card-sub">
                  {ttype === 'roundtrip' ? 'Roundtrip' : 'One Way'}
                  {t.category ? ` · ${t.category}` : ''}
                </span>
              </div>
              <div className="cbf-sel-card-body-price">
                <span className="cbf-sel-body-price-label">PRICE</span>
                <span className="cbf-sel-body-price-val">₱{fmt(tprice)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Summary ── */}
      <div className="cbf-sel-summary">
        <div className="cbf-sel-summary-label">SUMMARY</div>

        {selectedTours.map(t => (
          <div key={t._id} className="cbf-sel-summary-row">
            <span className="cbf-sel-summary-dot cbf-dot-tour" />
            <span className="cbf-sel-summary-name">{t.title || t.name}</span>
            <span className="cbf-sel-summary-price">
              ₱{fmt((t.price || 0) * pax)}
            </span>
          </div>
        ))}

        {selectedTransfers.map(t => {
          const ttype  = transferTypes[t._id] || 'oneway';
          const tprice = ttype === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
          return (
            <div key={t._id} className="cbf-sel-summary-row">
              <span className="cbf-sel-summary-dot cbf-dot-transfer" />
              <span className="cbf-sel-summary-name">{t.title}</span>
              <span className="cbf-sel-summary-price">₱{fmt(tprice)}</span>
            </div>
          );
        })}

        <div className="cbf-sel-total-row">
          <span className="cbf-sel-total-label">Total Due</span>
          <strong className="cbf-sel-total-amount">₱{fmt(grandTotal)}</strong>
        </div>
      </div>

      {/* ── Add second service type ── */}
      {firstChoice && !secondPhase && selectedTours.length > 0 && selectedTransfers.length === 0 && (
        <button type="button" className="cbf-add-service-btn" onClick={onAddSecond}>
          <Plus size={14} /> Add Transfers
        </button>
      )}
      {firstChoice && !secondPhase && selectedTransfers.length > 0 && selectedTours.length === 0 && (
        <button type="button" className="cbf-add-service-btn" onClick={onAddSecond}>
          <Plus size={14} /> Add Tours
        </button>
      )}
    </div>
  );
}
