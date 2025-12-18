import React from 'react';
import './HotelPreview.css';

// Kinuha ang IconLocation para parehong-pareho ang itsura sa Tour
const IconLocation = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const HotelPreview = ({ hotelDetails, previewUrl, type }) => {
    // Binibilang ang valid amenities
    const activeAmenitiesCount = Object.values(hotelDetails.amenities).filter(Boolean).length;
    
    // Formatting ng price para may commas (e.g. 2,500.00)
    const formattedPrice = hotelDetails.price 
        ? Number(hotelDetails.price).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : "0.00";

    return (
        <div className="apkg-preview"> {/* Ginamit ang apkg-prefix para sa exact Tour match */}
            <span className="apkg-preview-label">PREVIEW</span>
            <div className="apkg-card">
                <div className="apkg-card-image">
                    {previewUrl ? (
                        <img src={previewUrl} alt="Hotel Preview" />
                    ) : (
                        <span>Hotel Image</span>
                    )}
                </div>
                <div className="apkg-card-body">
                    <span className="apkg-card-badge">{type}</span>
                    <h3 className="apkg-card-title">
                        {hotelDetails.name || "Hotel Name"}
                    </h3>
                    <p className="apkg-card-location">
                        <IconLocation />
                        {hotelDetails.destination || "Destination"}
                    </p>
                    <div className="apkg-card-divider"></div>
                    <div className="apkg-card-meta">
                        <div>
                            <span>Rate</span>
                            <strong>₱{formattedPrice}</strong>
                        </div>
                        <div>
                            <span>Capacity</span>
                            <strong>{hotelDetails.maxCapacity || "4"} Pax</strong>
                        </div>
                    </div>
                </div>
            </div>
            <div className="apkg-stats">
                <div className="apkg-stat">
                    <strong>{activeAmenitiesCount}</strong>
                    <span>Amenities</span>
                </div>
                <div className="apkg-stat">
                    <strong>1</strong>
                    <span>Night</span>
                </div>
            </div>
        </div>
    );
};

export default HotelPreview;