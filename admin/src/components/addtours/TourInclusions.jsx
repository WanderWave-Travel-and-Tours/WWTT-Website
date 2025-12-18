import React from 'react';
import './TourInclusions.css';

// Kinuha ang icons mula sa InclusionsList.jsx para sa parehong UI
const IconAdd = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
);

const IconRemove = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
);

const TourInclusions = ({ incs, onChange, onAdd, onRem }) => {
    
    // Binibilang ang valid items para sa count badge gaya ng sa package
    const activeInclusionsCount = incs.filter((i) => i.trim()).length;

    return (
        <section className="apkg-section">
            <div className="apkg-section-header">
                <h2 className="apkg-section-title">INCLUSIONS</h2>
                <span className="apkg-count">
                    {activeInclusionsCount} items
                </span>
            </div>
            <div className="apkg-list">
                {incs.map((inc, i) => (
                    <div key={i} className="apkg-list-item">
                        <span className="apkg-bullet"></span>
                        <input
                            type="text"
                            placeholder="What's included?"
                            value={inc}
                            onChange={(e) => onChange(i, e.target.value)}
                        />
                        {incs.length > 1 && (
                            <button
                                type="button"
                                className="apkg-remove"
                                onClick={() => onRem(i)}
                            >
                                <IconRemove />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <button
                type="button"
                className="apkg-add-btn"
                onClick={onAdd}
            >
                <IconAdd />
                Add Item
            </button>
        </section>
    );
};

export default TourInclusions;