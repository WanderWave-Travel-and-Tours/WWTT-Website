import React from 'react';
import './InclusionsList.css';

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

const InclusionsList = ({ inclusions, handleIncChange, addInclusion, removeInclusion, handleInclusionPaste }) => {
    
    const activeInclusionsCount = inclusions.filter((i) => i.trim()).length;

    return (
        <section className="apkg-section">
            <div className="apkg-section-header">
                <h2 className="apkg-section-title">INCLUSIONS</h2>
                <span className="apkg-count">
                    {activeInclusionsCount} items
                </span>
            </div>
            <div className="apkg-list">
                {inclusions.map((inc, i) => (
                    <div key={i} className="apkg-list-item">
                        <span className="apkg-bullet"></span>
                        <input
                            type="text"
                            placeholder="What's included?"
                            value={inc}
                            onChange={(e) => handleIncChange(i, e.target.value)}
                            onPaste={(e) => handleInclusionPaste(i, e)}
                        />
                        {inclusions.length > 1 && (
                            <button
                                type="button"
                                className="apkg-remove"
                                onClick={() => removeInclusion(i)}
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
                onClick={addInclusion}
            >
                <IconAdd />
                Add Item
            </button>
        </section>
    );
};

export default InclusionsList;