import React from "react";
import { MapPin } from "lucide-react";
import LocationSelect from "../../location/LocationSelect";

// ─────────────────────────────────────────────────────────────────────────────
// RouteSection
// Pickup location (always shown) + dropoff (roundtrip only).
// ─────────────────────────────────────────────────────────────────────────────
const RouteSection = ({ formData, setFormData, isRoundtrip }) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <MapPin size={20} className="ea-section-icon" />
      <h3>Route</h3>
    </div>

    <div className="etb-route-visual">
      <div className="etb-route-dot etb-route-dot--pickup" />
      <div className="etb-route-info">
        <div className="ea-input-group">
          <label>Pickup Location</label>
          <LocationSelect
            value={formData.pickupLocation}
            onChange={(val) =>
              setFormData((prev) => ({ ...prev, pickupLocation: val }))
            }
            placeholder="Enter full pickup address"
            source="transfer"
          />
        </div>
      </div>
    </div>

    {isRoundtrip && (
      <div className="etb-route-visual" style={{ marginTop: "16px" }}>
        <div className="etb-route-dot etb-route-dot--dropoff" />
        <div className="etb-route-info">
          <div className="ea-input-group">
            <label>Dropoff Location</label>
            <LocationSelect
              value={formData.dropoffLocation}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, dropoffLocation: val }))
              }
              placeholder="Enter full dropoff address"
              source="transfer"
            />
          </div>
        </div>
      </div>
    )}
  </section>
);

export default RouteSection;
