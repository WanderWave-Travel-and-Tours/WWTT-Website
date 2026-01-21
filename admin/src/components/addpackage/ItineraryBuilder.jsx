import React from 'react';
import './ItineraryBuilder.css';

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

const ItineraryBuilder = ({ itinerary, handleDayTitle, addAct, removeAct, handleAct, handleActivityPaste, addDay, removeDay }) => {
    return (
        <section className="apkg-section">
            <div className="apkg-section-header">
                <h2 className="apkg-section-title">ITINERARY</h2>
                <span className="apkg-count">{itinerary.length} days</span>
            </div>
            <div className="apkg-timeline">
                {itinerary.map((day, dayIdx) => (
                    <div key={day.day} className="apkg-day">
                        <div className="apkg-day-marker">
                            <span className="apkg-day-num">{day.day}</span>
                            {dayIdx < itinerary.length - 1 && (
                                <div className="apkg-day-line"></div>
                            )}
                        </div>
                        <div className="apkg-day-content">
                            <div className="apkg-day-header">
                                <input
                                    type="text"
                                    className="apkg-day-title"
                                    placeholder={dayIdx === 0 ? "e.g. Arrival" : "Day title"}
                                    // Remove the "Day N: " prefix for user input field value
                                    value={day.title.replace(`Day ${day.day}: `, "")}
                                    onChange={(e) => handleDayTitle(dayIdx, e.target.value)}
                                    required
                                />
                                {itinerary.length > 1 && (
                                    <button
                                        type="button"
                                        className="apkg-day-remove"
                                        onClick={() => removeDay(dayIdx)}
                                    >
                                        Delete
                                    </button>
                                )}
                            </div>
                            <div className="apkg-activities">
                                {day.activities.map((act, actIdx) => (
                                    <div key={actIdx} className="apkg-activity">
                                        <input
                                            type="text"
                                            placeholder="Add activity"
                                            value={act}
                                            onChange={(e) =>
                                                handleAct(dayIdx, actIdx, e.target.value)
                                            }
                                            onPaste={(e) => 
                                                handleActivityPaste ? handleActivityPaste(dayIdx, actIdx, e) : null
                                            }
                                        />
                                        {day.activities.length > 1 && (
                                            <button
                                                type="button"
                                                className="apkg-remove apkg-remove--sm"
                                                onClick={() => removeAct(dayIdx, actIdx)}
                                            >
                                                <IconRemove />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    className="apkg-add-activity"
                                    onClick={() => addAct(dayIdx)}
                                >
                                    + Activity
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button
                type="button"
                className="apkg-add-btn"
                onClick={addDay}
            >
                <IconAdd />
                Add Day
            </button>
        </section>
    );
};

export default ItineraryBuilder;