import React from 'react';
import './TourBasicInfo.css';

const TourBasicInfo = ({ title, setTitle, destination, setDestination, duration, setDuration, category, setCategory }) => {
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
      </div>
    </section>
  );
};

export default TourBasicInfo;