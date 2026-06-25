// cbf/components/TransferList.jsx
import React from 'react';
import { MapPin, Check, Plus, ArrowRight, RefreshCw } from 'lucide-react';

/**
 * Renders a list of transfer cards for Step 2.
 * Each card shows one-way / roundtrip toggle when selected.
 *
 * Props:
 *   transfers     – Transfer[]
 *   selected      – Transfer[]
 *   transferTypes – { [id]: 'oneway' | 'roundtrip' }
 *   onToggle      – (transfer) => void
 *   onTypeChange  – (id, type) => void
 *   paxCount      – string | number
 */
export default function TransferList({
  transfers,
  selected,
  transferTypes,
  onToggle,
  onTypeChange,
  paxCount,
}) {
  if (transfers.length === 0) {
    return <div className="cbf-empty">No transfers available for this destination.</div>;
  }

  return (
    <>
      <div className="cbf-service-list">
        {transfers.map(transfer => {
          const isSelected = selected.some(t => t._id === transfer._id);
          const type       = transferTypes[transfer._id] || 'oneway';
          const img        = transfer.imageUrl;

          return (
            <div
              key={transfer._id}
              className={`cbf-card-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggle(transfer)}
            >
              {/* Image section */}
              <div className="cbf-card-image-wrap">
                {img
                  ? <img src={img} alt={transfer.title} className="cbf-card-img" />
                  : <div className="cbf-card-img-placeholder">🚐</div>
                }

                {transfer.category && (
                  <span className="cbf-card-category-badge">{transfer.category}</span>
                )}

                <span className="cbf-card-img-title">{transfer.title}</span>

                <button
                  type="button"
                  className={`cbf-card-check-btn ${isSelected ? 'checked' : ''}`}
                  onClick={e => { e.stopPropagation(); onToggle(transfer); }}
                  aria-label={isSelected ? 'Deselect transfer' : 'Select transfer'}
                >
                  {isSelected ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </div>

              {/* Info row */}
              <div className="cbf-card-info-row">
                <div className="cbf-card-meta-left">
                  {transfer.packageDestination && (
                    <span className="cbf-card-meta-item">
                      <MapPin size={11} /> {transfer.packageDestination.split(',')[0]}
                    </span>
                  )}
                  {!isSelected && (
                    <span className="cbf-transfer-price-preview">
                      From ₱{Number(transfer.oneWayPrice || 0).toLocaleString()}
                    </span>
                  )}
                </div>
                {!isSelected && transfer.oneWayPrice > 0 && (
                  <span className="cbf-card-price">
                    ₱{Number(transfer.oneWayPrice).toLocaleString()}
                    <span className="cbf-card-price-unit"> OW</span>
                  </span>
                )}
              </div>

              {/* One Way / Roundtrip toggle — shown when selected */}
              {isSelected && (
                <div
                  className="cbf-transfer-type-select"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={`cbf-tt-btn ${type === 'oneway' ? 'active' : ''}`}
                    onClick={e => { e.stopPropagation(); onTypeChange(transfer._id, 'oneway'); }}
                  >
                    <ArrowRight size={13} /> One Way
                    {transfer.oneWayPrice > 0 && (
                      <span className="cbf-tt-price">
                        ₱{Number(transfer.oneWayPrice).toLocaleString()}
                      </span>
                    )}
                  </button>

                  {transfer.roundtripPrice > 0 && (
                    <button
                      type="button"
                      className={`cbf-tt-btn ${type === 'roundtrip' ? 'active' : ''}`}
                      onClick={e => { e.stopPropagation(); onTypeChange(transfer._id, 'roundtrip'); }}
                    >
                      <RefreshCw size={13} /> Roundtrip
                      <span className="cbf-tt-price">
                        ₱{Number(transfer.roundtripPrice).toLocaleString()}
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
