import React from 'react';
import { Archive, Eye, MapPin, Users, Home, CheckCircle, Calendar } from 'lucide-react';
import './HotelsTable.css';

const HotelsTable = ({ 
    hotels, 
    handleViewDetails, 
    handleArchive,
    getImageUrl,
    formatPrice
}) => {

    return (
        <div className="ht-table-wrapper">
            <div className="ht-table-container">
                <table className="ht-table">
                    <thead>
                        <tr>
                            <th className="ht-col-preview">PREVIEW</th>
                            <th className="ht-col-name">HOTEL NAME</th>
                            <th className="ht-col-location">LOCATION</th>
                            <th className="ht-col-capacity">CAPACITY</th>
                            <th className="ht-col-date">DATE ADDED</th>
                            <th className="ht-col-price">PRICE</th>
                            <th className="ht-col-amenities">AMENITIES</th>
                            <th className="ht-col-status">STATUS</th>
                            <th className="ht-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {hotels.map((hotel) => {
                            const amenitiesCount = hotel.amenities 
                                ? Object.values(hotel.amenities).filter(Boolean).length 
                                : 0;
                            
                            const imageUrl = getImageUrl(hotel);

                            return (
                                <tr key={hotel._id}>
                                    {/* PREVIEW */}
                                    <td>
                                        <div className="ht-image-preview">
                                            {imageUrl ? (
                                                <img 
                                                    src={imageUrl} 
                                                    alt={hotel.name}
                                                    onError={(e) => { 
                                                        e.target.onerror = null; 
                                                        e.target.src = 'https://via.placeholder.com/400x250?text=No+Image'; 
                                                    }}
                                                />
                                            ) : (
                                                <div className="ht-no-image">
                                                    <Home size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* NAME */}
                                    <td>
                                        <div className="ht-name-cell">
                                            <span className="ht-hotel-name" title={hotel.name}>{hotel.name}</span>
                                            {hotel.featured && (
                                                <span className="ht-featured-badge">⭐ Featured</span>
                                            )}
                                        </div>
                                    </td>

                                    {/* LOCATION */}
                                    <td>
                                        <div className="ht-location-cell">
                                            <MapPin size={14} className="ht-icon" />
                                            <span>{hotel.location || hotel.city || 'N/A'}</span>
                                        </div>
                                    </td>

                                    {/* CAPACITY */}
                                    <td>
                                        <span className="ht-capacity-badge">
                                            <Users size={12} />
                                            {hotel.maxCapacity || 4} Pax
                                        </span>
                                    </td>

                                    {/* DATE ADDED */}
                                    <td>
                                        <div className="ht-date-added">
                                            <Calendar size={14} />
                                            <span>{hotel.displayDateAdded}</span>
                                        </div>
                                    </td>

                                    {/* PRICE */}
                                    <td>
                                        <span className="ht-price-value">{formatPrice(hotel.price || 0)}</span>
                                    </td>

                                    {/* AMENITIES */}
                                    <td>
                                        <span className="ht-amenities-badge">
                                            <CheckCircle size={12} />
                                            {amenitiesCount} Amenities
                                        </span>
                                    </td>

                                    {/* STATUS */}
                                    <td>
                                        <span className={`ht-status ht-status--${hotel.isActive ? 'active' : 'inactive'}`}>
                                            <Home size={12} />
                                            {hotel.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>

                                    {/* ACTIONS */}
                                    <td>
                                        <div className="ht-action-group">
                                            {/* View Button */}
                                            <button 
                                                className="ht-action-btn ht-view-btn"
                                                onClick={() => handleViewDetails(hotel)}
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                                <span>View</span>
                                            </button>

                                            {/* Archive Button */}
                                            <button 
                                                className="ht-action-btn ht-archive-btn"
                                                onClick={() => handleArchive(hotel._id, hotel.name)}
                                                title="Archive Hotel"
                                            >
                                                <Archive size={16} />
                                                <span>Archive</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}

                        {/* Empty State */}
                        {hotels.length === 0 && (
                            <tr>
                                <td colSpan="9" className="ht-empty-cell">
                                    No hotels found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HotelsTable;