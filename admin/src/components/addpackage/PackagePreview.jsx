import React from 'react';
import './PackagePreview.css';

const IconLocation = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const PackagePreview = ({ previewUrl, category, title, destination, price, duration, inclusions, itinerary }) => {
    
    const activeInclusionsCount = inclusions.filter((i) => i.trim()).length;
    const totalActivities = itinerary.reduce(
        (a, d) => a + d.activities.filter((x) => x.trim()).length,
        0
    );
    
    const formattedPrice = price 
        ? Number(price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "0";

    return (
        <div className="apkg-preview">
            <span className="apkg-preview-label">PREVIEW</span>
            <div className="apkg-card">
                <div className="apkg-card-image">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Preview" />
                    ) : (
                        <span>No Image</span>
                    )}
                </div>
                <div className="apkg-card-body">
                    <span className="apkg-card-badge">{category}</span>
                    <h3 className="apkg-card-title">
                        {title || "Package Name"}
                    </h3>
                    <p className="apkg-card-location">
                        <IconLocation />
                        {destination || "Destination"}
                    </p>
                    <div className="apkg-card-divider"></div>
                    <div className="apkg-card-meta">
                        <div>
                            <span>Price</span>
                            <strong>
                                ₱{formattedPrice}
                            </strong>
                        </div>
                        <div>
                            <span>Duration</span>
                            <strong>{duration || "--"}</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div className="apkg-stats">
                <div className="apkg-stat">
                    <strong>{activeInclusionsCount}</strong>
                    <span>Inclusions</span>
                </div>
                <div className="apkg-stat">
                    <strong>{itinerary.length}</strong>
                    <span>Days</span>
                </div>
                <div className="apkg-stat">
                    <strong>{totalActivities}</strong>
                    <span>Activities</span>
                </div>
            </div>
        </div>
    );
};

export default PackagePreview;