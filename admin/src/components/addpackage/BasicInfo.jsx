import React from 'react';
import './BasicInfo.css';

const BasicInfo = ({ 
  title, setTitle, 
  destination, setDestination, 
  duration, setDuration, 
  category, setCategory,
  tourType, setTourType,
  minPax, setMinPax
}) => {
  const [isOtherDestination, setIsOtherDestination] = React.useState(false);
  
  const handleDestinationChange = (e) => {
    const value = e.target.value;
    if (value === 'OTHER') {
      setIsOtherDestination(true);
      setDestination('');
    } else {
      setIsOtherDestination(false);
      setDestination(value);
    }
  };

  return (
    <section className="apkg-section">
      <h2 className="apkg-section-title">BASIC INFORMATION</h2>
      <div className="apkg-fields">
        <div className="apkg-field apkg-field--full">
          <label>Package Name</label>
          <input
            type="text"
            placeholder="Enter package name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="apkg-field apkg-field--full">
          <label>Destination</label>
          <select
            value={isOtherDestination ? 'OTHER' : destination}
            onChange={handleDestinationChange}
            required
          >
            <option value="">Select Destination</option>
            <option value="BAGUIO">Baguio</option>
            <option value="BATANES">Batanes</option>
            <option value="BOHOL">Bohol</option>
            <option value="BOLINAO">Bolinao</option>
            <option value="BORACAY">Boracay</option>
            <option value="CEBU">Cebu</option>
            <option value="CORON">Coron</option>
            <option value="DAVAO">Davao</option>
            <option value="EL NIDO">El Nido</option>
            <option value="LA UNION">La Union</option>
            <option value="PUERTO PRINCESA">Puerto Princesa</option>
            <option value="SAGADA">Sagada</option>
            <option value="SIARGAO">Siargao</option>
            <option value="SIQUIJOR">Siquijor</option>
            <option value="OTHER">Other</option>
          </select>
          
          {isOtherDestination && (
            <input
              type="text"
              placeholder="Enter destination (e.g. Tokyo, Japan)"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              style={{ marginTop: '10px' }}
            />
          )}
        </div>

        <div className="apkg-field">
          <label className="apkg-label">Duration *</label>
          <select
            className="apkg-input apkg-select"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          >
            <option value="">Select Duration</option>
            <option value="2D1N">2D1N</option>
            <option value="3D2N">3D2N</option>
            <option value="4D3N">4D3N</option>
            <option value="5D4N">5D4N</option>
          </select>
        </div>

        <div className="apkg-field">
          <label>Tour Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Local Tour">Local Tour</option>
            <option value="International Tour">International Tour</option>
          </select>
        </div>

        {/* ✅ NEW: TOUR TYPE TOGGLE */}
        <div className="apkg-field apkg-field--full">
          <label>Tour Type *</label>
          <div className="apkg-tour-type-toggle">
            <button
              type="button"
              className={`apkg-toggle-btn ${tourType === 'private' ? 'active' : ''}`}
              onClick={() => setTourType('private')}
            >
              <span className="toggle-icon">👤</span>
              Private Tour
            </button>
            <button
              type="button"
              className={`apkg-toggle-btn ${tourType === 'joiners' ? 'active' : ''}`}
              onClick={() => setTourType('joiners')}
            >
              <span className="toggle-icon">👥</span>
              Joiners
            </button>
          </div>
        </div>

        {/* ✅ NEW: MIN PAX FOR JOINERS */}
        {tourType === 'joiners' && (
          <div className="apkg-field apkg-field--full">
            <label>Minimum Pax Required *</label>
            <input
              type="number"
              placeholder="Enter minimum number of joiners (e.g. 4)"
              value={minPax}
              onChange={(e) => setMinPax(e.target.value)}
              required
              min="1"
              max="50"
            />
            <span className="apkg-field-hint">
              This package requires at least {minPax || '___'} joiners to proceed
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default BasicInfo;