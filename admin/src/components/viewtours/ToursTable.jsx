import React from 'react';
import { Trash2, Eye, Calendar, MapPin, Clock, Tag } from 'lucide-react';
import './ToursTable.css';

const ToursTable = ({ 
    tours, 
    onView, 
    onArchive 
}) => {

    return (
        /* ✅ WRAPPER STRUCTURE */
        <div className="trt-table-wrapper">
            <div className="trt-table-container">
                <table className="trt-table">
                    <thead>
                        <tr>
                            <th className="trt-col-package">TOUR PACKAGE</th> 
                            <th className="trt-col-dest">DESTINATION</th>
                            <th className="trt-col-duration">DURATION/CAT</th>
                            <th className="trt-col-date">DATE ADDED</th> 
                            <th className="trt-col-price">PRICE</th>
                            <th className="trt-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tours.map((tour) => (
                            <tr key={tour._id}>
                                {/* Package Name + Image */}
                                <td>
                                    <div className="trt-package-cell">
                                        <div className="trt-image-preview">
                                            <img 
                                                src={tour.image} 
                                                alt={tour.title} 
                                                onError={(e) => e.target.src="https://via.placeholder.com/150"} 
                                            />
                                        </div>
                                        <span className="trt-package-name" title={tour.title}>
                                            {tour.title.toUpperCase()}
                                        </span>
                                    </div>
                                </td>

                                {/* Destination */}
                                <td>
                                    <div className="trt-meta-cell">
                                        <MapPin size={14} className="trt-icon" />
                                        <span>{tour.destination.toUpperCase()}</span>
                                    </div>
                                </td>

                                {/* Duration & Category */}
                                <td>
                                    <div className="trt-stacked-info">
                                        <div className="trt-meta-row">
                                            <Clock size={13} /> {tour.duration}
                                        </div>
                                        <div className="trt-meta-row sub-text">
                                            <Tag size={13} /> {tour.category}
                                        </div>
                                    </div>
                                </td>

                                {/* Date Added */}
                                <td>
                                    <div className="trt-date-cell">
                                        <Calendar size={14} className="trt-icon" />
                                        {tour.displayDate}
                                    </div>
                                </td>

                                {/* Price */}
                                <td>
                                    <span className="trt-price">₱{tour.price?.toLocaleString()}</span>
                                </td>

                                {/* Actions */}
                                <td>
                                    <div className="trt-action-group">
                                        {/* View Button */}
                                        <button 
                                            className="trt-action-btn trt-view-btn" 
                                            onClick={() => onView(tour)}
                                        >
                                            <Eye size={16} />
                                            <span>View</span>
                                        </button>

                                        {/* Archive Button */}
                                        <button 
                                            className="trt-action-btn trt-archive-btn" 
                                            onClick={() => onArchive(tour._id)}
                                        >
                                            <Trash2 size={16} />
                                            <span>Archive</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        
                        {/* Empty State */}
                        {tours.length === 0 && (
                            <tr>
                                <td colSpan="6" className="trt-empty-cell">
                                    No tours found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ToursTable;