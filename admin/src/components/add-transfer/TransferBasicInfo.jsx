import React from 'react';
import './TransferBasicInfo.css';

import { API_ROOT as API_BASE } from '../../config/apiBase';

const TransferBasicInfo = ({
  title, setTitle,
  category, setCategory,
  packageDestination, setPackageDestination,
  pax, setPax,
}) => {
  const [packageDestinations, setPackageDestinations] = React.useState([]);
  const [destSearch, setDestSearch] = React.useState(packageDestination || '');
  const [showDestDropdown, setShowDestDropdown] = React.useState(false);
  const destRef = React.useRef(null);

  // ✅ FIX: Fetch from /destinations/all (Destination model, not packages)
  //         API_BASE already includes /api, so no need to repeat it here.
  //         Response shape: { status: 'ok', data: [{ name, country, ... }] }
  //         Only active destinations (isArchive: 'No') are returned by this endpoint.
  React.useEffect(() => {
    fetch(`${API_BASE}/destinations/all`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (data?.status === 'ok' && Array.isArray(data?.data)) {
          // Extract the `name` field from each Destination document
          const names = data.data
            .map((d) => d.name?.trim())
            .filter(Boolean);
          setPackageDestinations(names);
        }
      })
      .catch((err) => {
        console.error('❌ Failed to fetch destinations:', err.message);
      });
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (destRef.current && !destRef.current.contains(e.target)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredDestinations = packageDestinations.filter((d) =>
    d.toLowerCase().includes(destSearch.toLowerCase())
  );

  const handleDestInputChange = (e) => {
    const val = e.target.value;
    setDestSearch(val);
    setPackageDestination(val);
    setShowDestDropdown(true);
  };

  const handleDestSelect = (dest) => {
    setPackageDestination(dest);
    setDestSearch(dest);
    setShowDestDropdown(false);
  };

  return (
    <section className="atrn-section">
      <h2 className="atrn-section-title">BASIC INFORMATION</h2>
      <div className="atrn-fields">

        {/* TRANSFER TITLE */}
        <div className="atrn-field atrn-field--full">
          <label>Transfer Title</label>
          <input
            type="text"
            placeholder="e.g. NAIA to BGC Transfer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* TRANSFER CATEGORY */}
        <div className="atrn-field">
          <label>Transfer Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Local Transfer">Local Transfer</option>
            <option value="International Transfer">International Transfer</option>
          </select>
        </div>

        {/* PAX (Number of Passengers) */}
        <div className="atrn-field">
          <label>No. of Passengers (Pax)</label>
          <input
            type="number"
            placeholder="e.g. 4"
            min="1"
            value={pax}
            onChange={(e) => setPax(e.target.value)}
          />
        </div>

        {/* PACKAGE DESTINATION — searchable dropdown from /api/destinations/all */}
        <div className="atrn-field atrn-field--full" ref={destRef} style={{ position: 'relative' }}>
          <label>Package Destination</label>
          <input
            type="text"
            placeholder="Type to search destination..."
            value={destSearch}
            onChange={handleDestInputChange}
            onFocus={() => setShowDestDropdown(true)}
            autoComplete="off"
          />
          {showDestDropdown && filteredDestinations.length > 0 && (
            <ul className="atrn-dest-dropdown">
              {filteredDestinations.map((dest) => (
                <li
                  key={dest}
                  className={`atrn-dest-option${packageDestination === dest ? ' active' : ''}`}
                  onMouseDown={() => handleDestSelect(dest)}
                >
                  {dest}
                </li>
              ))}
            </ul>
          )}
          {showDestDropdown && destSearch && filteredDestinations.length === 0 && (
            <ul className="atrn-dest-dropdown">
              <li className="atrn-dest-option atrn-dest-option--empty">No destinations found</li>
            </ul>
          )}
        </div>

      </div>
    </section>
  );
};

export default TransferBasicInfo;