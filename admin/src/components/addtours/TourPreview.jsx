import React from 'react';
import './TourPreview.css';

const IconLocation = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const TourPreview = ({ url, cat, title, dest, price, dur, incs, tourType, minPax }) => {
    
    const activeInclusionsCount = incs.filter((i) => i.trim()).length;
    
    const formattedPrice = price 
        ? Number(price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "0";

    return (
        <div className="apkg-preview">
            <span className="apkg-preview-label">PREVIEW</span>
            <div className="apkg-card">
                <div className="apkg-card-image">
                    {url ? (
                        <img src={url} alt="Preview" />
                    ) : (
                        <span>No Image</span>
                    )}
                </div>
                <div className="apkg-card-body">
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span className="apkg-card-badge">{cat}</span>
                        {/* ✅ NEW: Tour Type Badge */}
                        {tourType && (
                            <span className="apkg-card-badge" style={{ 
                                backgroundColor: tourType === 'joiners' ? '#10b981' : '#3b82f6',
                                fontSize: '11px'
                            }}>
                                {tourType === 'joiners' ? `👥 Joiners` : `👤 Private`}
                            </span>
                        )}
                    </div>
                    <h3 className="apkg-card-title">
                        {title || "Tour Name"}
                    </h3>
                    <p className="apkg-card-location">
                        <IconLocation />
                        {dest || "Destination"}
                    </p>
                    
                    {/* ✅ NEW: Show Min Pax for Joiners */}
                    {tourType === 'joiners' && minPax && (
                        <p style={{ 
                            fontSize: '12px', 
                            color: '#10b981', 
                            marginTop: '4px',
                            fontWeight: '500'
                        }}>
                            Minimum {minPax} pax required
                        </p>
                    )}
                    
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
                            <strong>{dur || "--"}</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div className="apkg-stats">
                <div className="apkg-stat">
                    <strong>{activeInclusionsCount}</strong>
                    <span>Inclusions</span>
                </div>
            </div>
        </div>
    );
};

export default TourPreview;