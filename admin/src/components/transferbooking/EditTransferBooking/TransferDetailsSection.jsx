import React from "react";
import { Car } from "lucide-react";
import { ddStyle } from "./transferBookingUtils";

// ─────────────────────────────────────────────────────────────────────────────
// TransferDetailsSection
// Includes searchable Destination + Activity dropdowns and trip-type select.
// ─────────────────────────────────────────────────────────────────────────────
const TransferDetailsSection = ({
  formData,
  handleChange,
  handleTransferTypeChange,
  isRoundtrip,
  // destination dropdown
  destRef,
  destQuery,
  setDestQuery,
  setFormData,
  destOpen,
  setDestOpen,
  destHi,
  setDestHi,
  handleDestKeyDown,
  handleDestinationSelect,
  filteredDestinations,
  // activity dropdown
  actRef,
  actQuery,
  setActQuery,
  actOpen,
  setActOpen,
  actHi,
  setActHi,
  handleActKeyDown,
  handleActivitySelect,
  filteredActivities,
}) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <Car size={20} className="ea-section-icon" />
      <h3>
        Transfer Details
        <span
          className={`etb-trip-badge ${
            isRoundtrip
              ? "etb-trip-badge--roundtrip"
              : "etb-trip-badge--oneway"
          }`}
        >
          {isRoundtrip ? "ROUNDTRIP" : "ONE WAY"}
        </span>
      </h3>
    </div>

    <div className="ea-fields-grid">

      {/* Destination — searchable dropdown */}
      <div className="ea-input-group">
        <label>Destination</label>
        <div style={{ position: "relative" }} ref={destRef}>
          <input
            type="text"
            className="ea-input"
            value={destQuery}
            placeholder="Search destination..."
            onChange={(e) => {
              setDestQuery(e.target.value);
              setFormData((prev) => ({ ...prev, destination: e.target.value }));
              setDestOpen(true);
              setDestHi(-1);
            }}
            onFocus={() => setDestOpen(true)}
            onKeyDown={handleDestKeyDown}
            autoComplete="off"
          />
          {destOpen && (
            <ul style={ddStyle.list}>
              {filteredDestinations.length === 0 ? (
                <li style={ddStyle.empty}>
                  {destQuery ? "No matching destinations" : "No destinations available"}
                </li>
              ) : (
                filteredDestinations.map((dest, i) => (
                  <li
                    key={dest}
                    style={{
                      ...ddStyle.item(i === destHi),
                      ...(i === filteredDestinations.length - 1 ? { borderBottom: "none" } : {}),
                    }}
                    onMouseDown={() => handleDestinationSelect(dest)}
                    onMouseEnter={() => setDestHi(i)}
                  >
                    {dest}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* Activity / Transfer Name — searchable dropdown filtered by destination */}
      <div className="ea-input-group">
        <label>Activity / Transfer Name</label>
        <div style={{ position: "relative" }} ref={actRef}>
          <input
            type="text"
            className="ea-input"
            value={actQuery}
            placeholder="Search transfer..."
            onChange={(e) => {
              setActQuery(e.target.value);
              setFormData((prev) => ({ ...prev, activityName: e.target.value }));
              setActOpen(true);
              setActHi(-1);
            }}
            onFocus={() => setActOpen(true)}
            onKeyDown={handleActKeyDown}
            autoComplete="off"
            required
          />
          {actOpen && (
            <ul style={ddStyle.list}>
              {filteredActivities.length === 0 ? (
                <li style={ddStyle.empty}>
                  {actQuery ? "No matching transfers" : "No transfers available"}
                </li>
              ) : (
                filteredActivities.map((t, i) => (
                  <li
                    key={t._id}
                    style={{
                      ...ddStyle.item(i === actHi),
                      ...(i === filteredActivities.length - 1 ? { borderBottom: "none" } : {}),
                    }}
                    onMouseDown={() => handleActivitySelect(t)}
                    onMouseEnter={() => setActHi(i)}
                  >
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    {(t.packageDestination || t.category) && (
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>
                        {[t.packageDestination, t.category].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="ea-input-group">
        <label>Transfer Type</label>
        <select
          name="transferType"
          value={formData.transferType}
          onChange={handleTransferTypeChange}
          className="ea-input ea-select"
        >
          <option value="oneway">One Way</option>
          <option value="roundtrip">Roundtrip</option>
        </select>
      </div>
      <div className="ea-input-group">
        <label>Category</label>
        <input
          type="text"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="ea-input"
        />
      </div>
    </div>
  </section>
);

export default TransferDetailsSection;
