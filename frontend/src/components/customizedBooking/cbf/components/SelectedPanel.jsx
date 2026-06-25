// cbf/components/SelectedPanel.jsx
import React from 'react';
import { X, Mountain, Bus } from 'lucide-react';
import { fmt } from '../utils';

/**
 * Compact selection bar — appears above the service grid.
 * Shows each selected item as a chip with a remove button, plus a total.
 */
export default function SelectedPanel({
  selectedTours,
  selectedTransfers,
  transferTypes,
  paxCount,
  grandTotal,
  onToggleTour,
  onToggleTransfer,
}) {
  const pax = parseInt(paxCount) || 1;

  const allSelected = [
    ...selectedTours.map(t => ({
      id: t._id,
      type: 'tour',
      name: t.title || t.name,
      img:  t.imageUrl || t.image || null,
      price: (t.price || 0) * pax,
      onRemove: () => onToggleTour(t),
    })),
    ...selectedTransfers.map(t => {
      const ttype  = transferTypes[t._id] || 'oneway';
      const tprice = ttype === 'roundtrip' ? (t.roundtripPrice || 0) : (t.oneWayPrice || 0);
      return {
        id: t._id,
        type: 'transfer',
        name: t.title,
        img:  t.imageUrl || null,
        price: tprice,
        subLabel: ttype === 'roundtrip' ? 'Roundtrip' : 'One Way',
        onRemove: () => onToggleTransfer(t),
      };
    }),
  ];

  return (
    <div className="cbf-selbar">
      <div className="cbf-selbar-inner">
        {allSelected.map(item => (
          <div key={item.id} className={`cbf-selbar-chip cbf-chip-${item.type}`}>
            {/* Thumbnail */}
            {item.img
              ? <img src={item.img} alt={item.name} className="cbf-chip-thumb" />
              : <span className="cbf-chip-icon-wrap">
                  {item.type === 'tour'
                    ? <Mountain size={13} />
                    : <Bus size={13} />}
                </span>
            }

            {/* Name + price */}
            <div className="cbf-chip-info">
              <span className="cbf-chip-name">{item.name}</span>
              <span className="cbf-chip-price">₱{fmt(item.price)}</span>
            </div>

            {/* Remove */}
            <button
              type="button"
              className="cbf-chip-remove"
              onClick={item.onRemove}
              aria-label={`Remove ${item.name}`}
            >
              <X size={11} />
            </button>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="cbf-selbar-total">
        <span className="cbf-selbar-total-label">Total</span>
        <strong className="cbf-selbar-total-val">₱{fmt(grandTotal)}</strong>
      </div>
    </div>
  );
}
