import React from 'react';
import './TourBasicInfo.css';

const TourBasicInfo = ({ 
  title, setTitle, 
  destination, setDestination, 
  duration, setDuration, 
  category, setCategory,
  tourType, setTourType,
  minPax, setMinPax
}) => {
  return (
    <section className="apkg-section">
      <h2 className="apkg-section-title">BASIC INFORMATION</h2>
      <div className="apkg-fields">
        <div className="apkg-field apkg-field--full">
          <label>Tour Name</label>
          <input
            type="text"
            placeholder="Enter tour name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="apkg-field apkg-field--full">
          <label>Destination</label>
          <input
            type="text"
            placeholder="e.g. Boracay, Philippines"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
        </div>
        <div className="apkg-field">
          <label>Duration</label>
          <input
            type="text"
            placeholder="e.g. 1 Day / 8 Hours"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            required
          />
        </div>
        <div className="apkg-field">
          <label>Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Local">Local</option>
            <option value="International">International</option>
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
              This tour requires at least {minPax || '___'} joiners to proceed
            </span>
          </div>
        )}
      </div>
    </section>
  );
};

export default TourBasicInfo;