import React from 'react';
import './PackagePreview.css';

const IconLocation = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const PackagePreview = ({ 
    previewUrl, category, title, destination, price, duration, 
    inclusions, itinerary, tourType, pax, minPax,
    // ✅ Pax pricing props
    soloPaxPrice,
    multiplePaxPrice
}) => {
    
    const activeInclusionsCount = inclusions.filter((i) => i.trim()).length;
    const totalActivities = itinerary.reduce(
        (a, d) => a + d.activities.filter((x) => x.trim()).length,
        0
    );
    
    const formattedPrice = price 
        ? Number(price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "0";

    const hasPaxPricing = soloPaxPrice || multiplePaxPrice;

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
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <span className="apkg-card-badge">{category}</span>
                        {/* ✅ Tour Type Badge */}
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
                        {duration && title
                            ? `${duration} ${title}`
                            : duration && !title
                            ? `${duration} Package Name`
                            : title || "Package Name"}
                    </h3>
                    <p className="apkg-card-location">
                        <IconLocation />
                        {destination || "Destination"}
                    </p>
                    
                    {/* ✅ Show Pax for Private Tours */}
                    {tourType === 'private' && pax && (
                        <p style={{ 
                            fontSize: '12px', 
                            color: '#3b82f6', 
                            marginTop: '4px',
                            fontWeight: '500'
                        }}>
                            Good for {pax} person{parseInt(pax) > 1 ? 's' : ''}
                        </p>
                    )}
                    
                    {/* ✅ Show Min Pax for Joiners */}
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

                    {/* ✅ Pax Pricing Preview */}
                    {hasPaxPricing && (
                        <div style={{
                            marginTop: '10px',
                            padding: '10px 12px',
                            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                        }}>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                color: '#001F3F',
                                letterSpacing: '1.5px',
                                textTransform: 'uppercase'
                            }}>
                                Pax Pricing
                            </span>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {soloPaxPrice && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        padding: '5px 10px',
                                        flex: '1',
                                        minWidth: '100px'
                                    }}>
                                        <span style={{ fontSize: '13px' }}>👤</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>SOLO</span>
                                            <span style={{ 
                                                fontSize: '13px', 
                                                fontWeight: '900', 
                                                color: '#001F3F',
                                                fontFamily: "'Arial Black', sans-serif"
                                            }}>
                                                ₱{Number(soloPaxPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {multiplePaxPrice && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        background: '#fff',
                                        border: '1px solid #e2e8f0',
                                        borderRadius: '6px',
                                        padding: '5px 10px',
                                        flex: '1',
                                        minWidth: '100px'
                                    }}>
                                        <span style={{ fontSize: '13px' }}>👥</span>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600' }}>MULTIPLE</span>
                                            <span style={{ 
                                                fontSize: '13px', 
                                                fontWeight: '900', 
                                                color: '#001F3F',
                                                fontFamily: "'Arial Black', sans-serif"
                                            }}>
                                                ₱{Number(multiplePaxPrice).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="apkg-card-divider"></div>
                    <div className="apkg-card-meta">
                        <div>
                            <span>Base Price</span>
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