import React from 'react';
import './BasicInfo.css';

const BasicInfo = ({ title, setTitle, destination, setDestination, duration, setDuration, category, setCategory }) => {
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
          <input
            type="text"
            placeholder="e.g. Boracay, Philippines"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
          />
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
          <label>Tour Type</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="Local Tour">Local Tour</option>
            <option value="International Tour">International Tour</option>
          </select>
        </div>
      </div>
    </section>
  );
};

export default BasicInfo;