import React from 'react';
import './TransferBasicInfo.css';

const TransferBasicInfo = ({
  title, setTitle,
  category, setCategory,
  packageDestination, setPackageDestination,
}) => {
  // ── Package destinations (fetched from /api/packages/all) ────────────────
  const [packageDestinations, setPackageDestinations] = React.useState([]);
  const [destSearch, setDestSearch] = React.useState(packageDestination || '');
  const [showDestDropdown, setShowDestDropdown] = React.useState(false);
  const destRef = React.useRef(null);

  React.useEffect(() => {
    fetch('/api/packages/all')
      .then((r) => r.json())
      .then((data) => {
        if (data.status === 'ok') {
          const unique = [...new Set(
            data.data
              .map((p) => p.destination?.trim())
              .filter(Boolean)
          )].sort();
          setPackageDestinations(unique);
        }
      })
      .catch(() => {});
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

        {/* PACKAGE DESTINATION — searchable dropdown from /api/packages/all */}
        <div className="atrn-field" ref={destRef} style={{ position: 'relative' }}>
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