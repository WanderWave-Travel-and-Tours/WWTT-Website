import React from 'react';
import { Archive, Eye, Calendar, Image as ImageIcon } from 'lucide-react';
import './ImagesTable.css';

const ImagesTable = ({ 
    images, 
    handleViewDetails, 
    handleArchive 
}) => {

    return (
        <div className="imgt-table-wrapper">
            <div className="imgt-table-container">
                <table className="imgt-table">
                    <thead>
                        <tr>
                            <th className="imgt-col-preview">PREVIEW</th>
                            <th className="imgt-col-name">FILE NAME</th>
                            <th className="imgt-col-type">FILE TYPE</th>
                            <th className="imgt-col-date">UPLOAD DATE</th>
                            <th className="imgt-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {images.map((image) => (
                            <tr key={image._id}>
                                {/* PREVIEW */}
                                <td>
                                    <div className="imgt-image-preview">
                                        <img 
                                            src={image.imageUrl} 
                                            alt={image.imageName || 'Gallery image'}
                                            onError={(e) => {
                                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EImage not found%3C/text%3E%3C/svg%3E';
                                            }}
                                        />
                                    </div>
                                </td>

                                {/* FILE NAME */}
                                <td>
                                    <span className="imgt-image-name" title={image.imageName}>{image.imageName || 'Untitled'}</span>
                                </td>

                                {/* FILE TYPE */}
                                <td>
                                    <span className="imgt-file-type">
                                        <ImageIcon size={12} />
                                        {image.imageName?.split('.').pop()?.toUpperCase() || 'IMAGE'}
                                    </span>
                                </td>

                                {/* UPLOAD DATE */}
                                <td>
                                    <div className="imgt-date-added">
                                        <Calendar size={14} />
                                        <span>{image.displayDateAdded}</span>
                                    </div>
                                </td>

                                {/* ACTIONS */}
                                <td>
                                    <div className="imgt-action-group">
                                        {/* View Button */}
                                        <button 
                                            className="imgt-action-btn imgt-view-btn"
                                            onClick={() => handleViewDetails(image)}
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                            <span>View</span>
                                        </button>

                                        {/* Archive Button */}
                                        <button 
                                            className="imgt-action-btn imgt-archive-btn"
                                            onClick={() => handleArchive(image._id, image.imageName)}
                                            title="Archive Image"
                                        >
                                            <Archive size={16} />
                                            <span>Archive</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {/* Empty State */}
                        {images.length === 0 && (
                            <tr>
                                <td colSpan="5" className="imgt-empty-cell">
                                    No images found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ImagesTable;