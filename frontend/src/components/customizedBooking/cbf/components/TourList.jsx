// cbf/components/TourList.jsx
import React from 'react';
import { MapPin, Clock, Check, Plus, Mountain } from 'lucide-react';

/**
 * Renders a scrollable list of tour cards for Step 2.
 * Multiple tours can be selected; clicking a selected tour deselects it.
 *
 * Props:
 *   tours    – Tour[]
 *   selected – Tour[]  (currently selected tours)
 *   onToggle – (tour: Tour) => void
 *   paxCount – string | number
 */
export default function TourList({ tours, selected, onToggle, paxCount }) {
  if (tours.length === 0) {
    return <div className="cbf-empty">No tours available for this destination.</div>;
  }

  return (
    <>
      <div className="cbf-service-list cbf-tour-grid">
        {tours.map(tour => {
          const isSelected = selected.some(t => t._id === tour._id);
          const img        = tour.imageUrl || tour.image;
          const price      = tour.price || 0;

          return (
            <div
              key={tour._id}
              className={`cbf-card-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggle(tour)}
            >
              {/* Image section */}
              <div className="cbf-card-image-wrap">
                {img
                  ? <img src={img} alt={tour.title || tour.name} className="cbf-card-img" />
                  : <div className="cbf-card-img-placeholder"><Mountain size={32} /></div>
                }

                {/* Category badge — top-left */}
                {tour.category && (
                  <span className="cbf-card-category-badge">{tour.category}</span>
                )}

                {/* Title overlay — bottom-left */}
                <span className="cbf-card-img-title">{tour.title || tour.name}</span>

                {/* Check / Plus button — top-right */}
                <button
                  type="button"
                  className={`cbf-card-check-btn ${isSelected ? 'checked' : ''}`}
                  onClick={e => { e.stopPropagation(); onToggle(tour); }}
                  aria-label={isSelected ? 'Deselect tour' : 'Select tour'}
                >
                  {isSelected ? <Check size={14} /> : <Plus size={14} />}
                </button>
              </div>

              {/* Info row below image */}
              <div className="cbf-card-info-row">
                <div className="cbf-card-meta-left">
                  {tour.destination && (
                    <span className="cbf-card-meta-item">
                      <MapPin size={11} /> {tour.destination.split(',')[0]}
                    </span>
                  )}
                  {tour.duration && (
                    <span className="cbf-card-meta-item">
                      <Clock size={11} /> {tour.duration}
                    </span>
                  )}
                  {tour.rating && (
                    <span className="cbf-card-meta-item cbf-card-rating">
                      ★ {tour.rating}
                    </span>
                  )}
                </div>
                <span className="cbf-card-price">
                  ₱{Number(price).toLocaleString()}
                  <span className="cbf-card-price-unit">/pax</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
