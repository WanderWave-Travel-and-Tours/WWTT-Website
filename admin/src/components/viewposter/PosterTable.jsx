import React from 'react';
import { Archive, Eye, Calendar, EyeOff, FileText } from 'lucide-react';
import './PosterTable.css';

const PostersTable = ({ 
    posters, 
    toggleStatus, 
    handleViewDetails, 
    handleArchive 
}) => {

    const formatDate = (dateString) => {
        if (!dateString) return '--';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    };

    return (
        <div className="pst-table-wrapper">
            <div className="pst-table-container">
                <table className="pst-table">
                    <thead>
                        <tr>
                            <th className="pst-col-preview">PREVIEW</th>
                            <th className="pst-col-title">TITLE</th>
                            <th className="pst-col-desc">DESCRIPTION</th>
                            <th className="pst-col-date">DATE ADDED</th>
                            <th className="pst-col-start">START DATE</th>
                            <th className="pst-col-end">END DATE</th>
                            <th className="pst-col-status">STATUS</th>
                            <th className="pst-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {posters.map((poster) => (
                            <tr key={poster._id}>
                                {/* PREVIEW */}
                                <td>
                                    <div className="pst-image-preview">
                                        <img 
                                            src={`/${poster.imageUrl}`} 
                                            alt={poster.title}
                                            onError={(e) => e.target.src="https://via.placeholder.com/150"}
                                        />
                                    </div>
                                </td>

                                {/* TITLE */}
                                <td>
                                    <span className="pst-poster-title" title={poster.title}>{poster.title}</span>
                                </td>

                                {/* DESCRIPTION */}
                                <td>
                                    <div className="pst-desc-cell">
                                        <FileText size={14} className="pst-icon" />
                                        <span className="pst-desc-text" title={poster.description}>
                                            {poster.description || 'No description provided'}
                                        </span>
                                    </div>
                                </td>

                                {/* DATE ADDED */}
                                <td>
                                    <div className="pst-date-added">
                                        <Calendar size={14} />
                                        <span>{poster.displayDateAdded}</span>
                                    </div>
                                </td>

                                {/* START DATE */}
                                <td>
                                    <div className="pst-date-cell">
                                        <Calendar size={14} className="pst-icon" />
                                        <span>{poster.startDate ? formatDate(poster.startDate) : '--'}</span>
                                    </div>
                                </td>

                                {/* END DATE */}
                                <td>
                                    <div className="pst-date-cell">
                                        <Calendar size={14} className="pst-icon" />
                                        <span>{poster.endDate ? formatDate(poster.endDate) : '--'}</span>
                                    </div>
                                </td>

                                {/* STATUS (Clickable) */}
                                <td>
                                    <span 
                                        className={`pst-status pst-status--${poster.status.toLowerCase()}`}
                                        onClick={() => toggleStatus(poster._id, poster.status)}
                                        title="Click to toggle status"
                                    >
                                        {poster.status === 'Active' ? <Eye size={12} /> : <EyeOff size={12} />}
                                        {poster.status}
                                    </span>
                                </td>

                                {/* ACTIONS */}
                                <td>
                                    <div className="pst-action-group">
                                        {/* View Button */}
                                        <button 
                                            className="pst-action-btn pst-view-btn"
                                            onClick={() => handleViewDetails(poster)}
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                            <span>View</span>
                                        </button>

                                        {/* Archive Button */}
                                        <button 
                                            className="pst-action-btn pst-archive-btn"
                                            onClick={() => handleArchive(poster._id, poster.title)}
                                            title="Archive Poster"
                                        >
                                            <Archive size={16} />
                                            <span>Archive</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Empty State */}
                        {posters.length === 0 && (
                            <tr>
                                <td colSpan="8" className="pst-empty-cell">
                                    No posters found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PostersTable;