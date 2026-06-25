// cbf/components/TransferList.jsx
import React, { useState } from 'react';
import { MapPin, Check, Plus, ArrowRight, RefreshCw, Bus } from 'lucide-react';

/**
 * Renders a list of transfer cards for Step 2.
 * The One-Way / Roundtrip toggle is always visible so users can compare
 * prices before selecting. Clicking a type button also selects the card.
 */
export default function TransferList({
  transfers,
  selected,
  transferTypes,
  onToggle,
  onTypeChange,
  paxCount,
}) {
  // Local preview type so the toggle is interactive even before selection
  const [previewTypes, setPreviewTypes] = useState({});

  const getType = (id) => transferTypes[id] || previewTypes[id] || 'oneway';

  const handleTypeClick = (e, transfer, newType) => {
    e.stopPropagation();
    const isSelected = selected.some(t => t._id === transfer._id);
    setPreviewTypes(prev => ({ ...prev, [transfer._id]: newType }));
    onTypeChange(transfer._id, newType);
    if (!isSelected) {
      // Selecting via the type button — the parent will preserve the type
      onToggle(transfer);
    }
  };

  if (transfers.length === 0) {
    return <div className="cbf-empty">No transfers available for this destination.</div>;
  }

  return (
    <div className="cbf-service-list cbf-transfer-grid">
      {transfers.map(transfer => {
        const isSelected = selected.some(t => t._id === transfer._id);
        const type       = getType(transfer._id);
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
                : <div className="cbf-card-img-placeholder"><Bus size={36} /></div>
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

            {/* Info row — destination only, price is in the type row below */}
            <div className="cbf-card-info-row">
              <div className="cbf-card-meta-left">
                {transfer.packageDestination && (
                  <span className="cbf-card-meta-item">
                    <MapPin size={11} /> {transfer.packageDestination.split(',')[0]}
                  </span>
                )}
              </div>
            </div>

            {/* Type toggle row — always visible */}
            <div className="cbf-transfer-type-row" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className={type === 'oneway' ? 'active' : ''}
                onClick={e => handleTypeClick(e, transfer, 'oneway')}
              >
                <ArrowRight size={9} />
                One Way
                {transfer.oneWayPrice > 0 && (
                  <span className="cbf-tt-row-price">
                    ₱{Number(transfer.oneWayPrice).toLocaleString()}
                  </span>
                )}
              </button>

              {transfer.roundtripPrice > 0 && (
                <button
                  type="button"
                  className={type === 'roundtrip' ? 'active' : ''}
                  onClick={e => handleTypeClick(e, transfer, 'roundtrip')}
                >
                  <RefreshCw size={9} />
                  Roundtrip
                  <span className="cbf-tt-row-price">
                    ₱{Number(transfer.roundtripPrice).toLocaleString()}
                  </span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
