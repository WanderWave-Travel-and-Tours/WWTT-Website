import React from 'react';
import { Trash2, Eye, Calendar, MapPin, Clock, Tag } from 'lucide-react';
import './PackagesTable.css';

const PackagesTable = ({ 
    packages, 
    getImageUrl, 
    handleImageError, 
    onView, 
    onArchive 
}) => {

    return (
        <div className="pkt-table-wrapper">
            <div className="pkt-table-container">
                <table className="pkt-table">
                    <thead>
                        <tr>
                            <th className="pkt-col-num">#</th> 
                            <th className="pkt-col-package">PACKAGE</th> 
                            <th className="pkt-col-dest">DESTINATION</th>
                            <th className="pkt-col-duration">DURATION & TYPE</th>
                            <th className="pkt-col-date">DATE ADDED</th> 
                            <th className="pkt-col-price">PRICE</th>
                            <th className="pkt-col-status">STATUS</th> 
                            <th className="pkt-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {packages.map((pkg, index) => (
                            <tr key={pkg._id}>
                                {/* Numbering */}
                                <td className="pkt-number-cell">
                                    {index + 1}
                                </td>

                                {/* Package Name + Image */}
                                <td>
                                    <div className="pkt-package-cell">
                                        <div className="pkt-image-preview">
                                            <img 
                                                src={getImageUrl(pkg.image)} 
                                                alt={pkg.title}
                                                onError={(e) => handleImageError(e, pkg)}
                                            />
                                        </div>
                                        <span className="pkt-package-name" title={pkg.title}>
                                            {pkg.title}
                                        </span>
                                    </div>
                                </td>

                                {/* Destination */}
                                <td>
                                    <div className="pkt-meta-cell">
                                        <MapPin size={14} className="pkt-icon" />
                                        <span>{pkg.destination}</span>
                                    </div>
                                </td>

                                {/* Duration & Type */}
                                <td>
                                    <div className="pkt-stacked-info">
                                        <div className="pkt-meta-row">
                                            <Clock size={13} /> {pkg.duration}
                                        </div>
                                        <div className="pkt-meta-row sub-text">
                                            <Tag size={13} /> {pkg.category}
                                        </div>
                                    </div>
                                </td>

                                {/* Date Added */}
                                <td>
                                    <div className="pkt-date-cell">
                                        <Calendar size={14} className="pkt-icon" />
                                        {pkg.displayDate}
                                    </div>
                                </td>

                                {/* Price */}
                                <td>
                                    <span className="pkt-price">₱{pkg.price.toLocaleString()}</span>
                                </td>

                                {/* Status */}
                                <td>
                                    <span className="pkt-badge pkt-badge-active">
                                        Active
                                    </span>
                                </td>

                                {/* Actions */}
                                <td>
                                    <div className="pkt-action-group">
                                        {/* View Button */}
                                        <button 
                                            className="pkt-action-btn pkt-view-btn" 
                                            onClick={() => onView(pkg)}
                                        >
                                            <Eye size={16} />
                                            <span>View</span>
                                        </button>

                                        {/* Archive Button */}
                                        <button 
                                            className="pkt-action-btn pkt-archive-btn" 
                                            onClick={() => onArchive(pkg._id)}
                                        >
                                            <Trash2 size={16} />
                                            <span>Archive</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        
                        {/* Empty State */}
                        {packages.length === 0 && (
                            <tr>
                                <td colSpan="8" className="pkt-empty-cell">
                                    No packages found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PackagesTable;