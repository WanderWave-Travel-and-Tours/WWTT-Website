import React from "react";
import { Package } from "lucide-react";
import { ddStyle } from "../constants";

const TourDetailsSection = ({
  formData,
  handleChange,
  // Destination dropdown
  destRef, destQuery, setDestQuery, setFormData,
  destOpen, setDestOpen, destHi, setDestHi,
  filteredDestinations, handleDestinationSelect, handleDestKeyDown,
  setPkgQuery,
  // Package dropdown
  pkgRef, pkgQuery, setPkgQuery: _setPkgQuery,
  pkgOpen, setPkgOpen, pkgHi, setPkgHi,
  filteredTours, handlePackageSelect, handlePkgKeyDown,
}) => (
  <section className="ea-section">
    <div className="ea-section-header">
      <Package size={20} className="ea-section-icon" />
      <h3>Tour Package Details</h3>
    </div>

    <div className="ea-fields-grid">

      {/* ── Destination ── */}
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
              setFormData((prev) => ({
                ...prev,
                destination: e.target.value,
                packageName: "",
                duration:    "",
              }));
              setPkgQuery("");
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
                  {destQuery
                    ? "No matching destinations — you can still type a custom one"
                    : "No destinations available"}
                </li>
              ) : (
                filteredDestinations.map((d, i) => (
                  <li
                    key={d}
                    style={{
                      ...ddStyle.item(i === destHi),
                      ...(i === filteredDestinations.length - 1
                        ? { borderBottom: "none" }
                        : {}),
                    }}
                    onMouseDown={() => handleDestinationSelect(d)}
                    onMouseEnter={() => setDestHi(i)}
                  >
                    <div style={{ fontWeight: 600 }}>📍 {d}</div>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* ── Package Name ── */}
      <div className="ea-input-group">
        <label>Package Name</label>
        <div style={{ position: "relative" }} ref={pkgRef}>
          <input
            type="text"
            className="ea-input"
            value={pkgQuery}
            placeholder={
              formData.destination
                ? "Search packages for this destination..."
                : "Select a destination first..."
            }
            onChange={(e) => {
              setPkgQuery(e.target.value);
              setFormData((prev) => ({
                ...prev,
                packageName: e.target.value,
              }));
              setPkgOpen(true);
              setPkgHi(-1);
            }}
            onFocus={() => setPkgOpen(true)}
            onKeyDown={handlePkgKeyDown}
            autoComplete="off"
            required
          />
          {pkgOpen && (
            <ul style={ddStyle.list}>
              {filteredTours.length === 0 ? (
                <li style={ddStyle.empty}>
                  {formData.destination
                    ? pkgQuery
                      ? "No matching packages — you can still type a custom name"
                      : `No packages for "${formData.destination}"`
                    : "Select a destination to filter packages"}
                </li>
              ) : (
                filteredTours.map((t, i) => (
                  <li
                    key={t._id}
                    style={{
                      ...ddStyle.item(i === pkgHi),
                      ...(i === filteredTours.length - 1
                        ? { borderBottom: "none" }
                        : {}),
                    }}
                    onMouseDown={() => handlePackageSelect(t)}
                    onMouseEnter={() => setPkgHi(i)}
                  >
                    <div style={{ fontWeight: 600 }}>{t.title}</div>
                    {(t.destination || t.duration || t.category) && (
                      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "2px" }}>
                        {[t.destination, t.duration, t.category].filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
      </div>

      {/* ── Duration ── */}
      <div className="ea-input-group">
        <label>Duration</label>
        <input
          type="text"
          name="duration"
          value={formData.duration}
          onChange={handleChange}
          className="ea-input"
          placeholder="e.g. 3D 2N"
        />
      </div>

      {/* ── Tour Type ── */}
      <div className="ea-input-group">
        <label>Tour Type</label>
        <select
          name="tourType"
          value={formData.tourType || ""}
          onChange={handleChange}
          className="ea-input ea-select"
        >
          <option value="">— Select —</option>
          <option value="private">Private</option>
          <option value="joiners">Joiners</option>
        </select>
      </div>

    </div>

    {/* ── PAX block ── */}
    <div className="etbk-pax-block">
      <div className="etbk-pax-label">Passengers (PAX)</div>
      <div className="etbk-pax-grid">
        <div className="etbk-pax-item">
          <label>Adults</label>
          <input
            type="number"
            name="paxAdult"
            value={formData.paxAdult}
            onChange={handleChange}
            className="ea-input"
            min="1"
          />
        </div>
        <div className="etbk-pax-item">
          <label>Children</label>
          <input
            type="number"
            name="paxChildren"
            value={formData.paxChildren}
            onChange={handleChange}
            className="ea-input"
            min="0"
          />
        </div>
        <div className="etbk-pax-item">
          <label>Infants</label>
          <input
            type="number"
            name="paxInfants"
            value={formData.paxInfants}
            onChange={handleChange}
            className="ea-input"
            min="0"
          />
        </div>
      </div>
    </div>

    {/* ── Booking Status ── */}
    <div className="etbk-status-row">
      <div
        className={`etbk-status-dot etbk-status-dot--${formData.status || "pending"}`}
      />
      <select
        name="status"
        value={formData.status}
        onChange={handleChange}
        className="ea-input ea-select"
        style={{ flex: 1 }}
      >
        <option value="pending">Pending</option>
        <option value="confirmed">Confirmed</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>
    </div>
  </section>
);

export default TourDetailsSection;
