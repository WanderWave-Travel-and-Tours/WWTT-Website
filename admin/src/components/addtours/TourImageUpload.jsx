import React from 'react';
import './TourImageUpload.css';

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="8.5" cy="8.5" r="1.5" />
    <path d="M21 15l-5-5L5 21" />
  </svg>
);

const IconPaste = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconChange = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRemove = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TourImageUpload = ({ previewUrl, handleFileChange, clearImage, isPasteActive, activatePasteArea }) => {
  return (
    <section className="atour-section">
      <h2 className="atour-section-title">COVER IMAGE</h2>

      {previewUrl ? (
        <div className="atour-upload-preview-container">
          <div className="atour-upload-preview">
            <img src={previewUrl} alt="Cover" />
            <div className="atour-upload-actions">
              <label className="atour-upload-change-btn">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept="image/*"
                  hidden
                />
                <IconChange />
                Change
              </label>
              <button
                type="button"
                className="atour-upload-paste-btn"
                onClick={activatePasteArea}
              >
                <IconPaste />
                Paste
              </button>
              <button
                type="button"
                className="atour-upload-remove-btn"
                onClick={clearImage}
              >
                <IconRemove />
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="atour-upload-options">
          <label className="atour-upload-click">
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              hidden
              required
            />
            <div className="atour-upload-empty">
              <div className="atour-upload-icon">
                <IconUpload />
              </div>
              <p>Click to upload</p>
              <span>JPG, PNG or WebP</span>
            </div>
          </label>

          <div className="atour-upload-divider">
            <span>OR</span>
          </div>

          <div
            className={`atour-upload-paste ${isPasteActive ? "active" : ""}`}
            onClick={activatePasteArea}
            tabIndex={0}
          >
            <div className="atour-upload-paste-content">
              <div className="atour-upload-icon">
                <IconPaste />
              </div>
              <p>Paste screenshot</p>
              <span>Press Ctrl+V (Windows) or Cmd+V (Mac)</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TourImageUpload;