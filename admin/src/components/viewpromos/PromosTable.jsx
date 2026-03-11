import React from 'react';
import { Archive, Eye, Calendar, Tag, Percent, FileText } from 'lucide-react';
import './PromosTable.css';

const PromosTable = ({ 
    promos, 
    onView, 
    onArchive 
}) => {

    // Helper to check status
    const getStatus = (validUntil) => {
        const today = new Date();
        const expiryDate = new Date(validUntil);
        return expiryDate < today ? 'Expired' : 'Active';
    };

    // Helper to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="prt-table-wrapper">
            <div className="prt-table-container">
                <table className="prt-table">
                    <thead>
                        <tr>
                            <th className="prt-col-code">CODE</th>
                            <th className="prt-col-category">CATEGORY</th>
                            <th className="prt-col-discount">INTERNATIONAL PRICE</th>
                            <th className="prt-col-discount">LOCAL PRICE</th>
                            <th className="prt-col-date">VALID UNTIL</th>
                            <th className="prt-col-status">STATUS</th>
                            <th className="prt-col-desc">DESCRIPTION</th>
                            <th className="prt-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {promos.map((promo) => {
                            const status = getStatus(promo.validUntil);
                            const isExpired = status === 'Expired';

                            return (
                                <tr key={promo._id}>
                                    {/* CODE */}
                                    <td>
                                        <div className="prt-code-cell">
                                            <span className="prt-code-badge">{promo.code}</span>
                                        </div>
                                    </td>

                                    {/* CATEGORY */}
                                    <td>
                                        <div className="prt-meta-cell">
                                            <Tag size={14} className="prt-icon" />
                                            <span>{promo.category}</span>
                                        </div>
                                    </td>

                                    {/* INTERNATIONAL PRICE */}
                                    <td>
                                        <div className="prt-discount-cell">
                                            <span className="prt-peso-icon prt-icon">₱</span>
                                            <span className="prt-discount-value">
                                                {promo.internationalPrice != null
                                                    ? `₱${Number(promo.internationalPrice).toLocaleString()}`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* LOCAL PRICE */}
                                    <td>
                                        <div className="prt-discount-cell">
                                            <span className="prt-peso-icon prt-icon">₱</span>
                                            <span className="prt-discount-value">
                                                {promo.localPrice != null
                                                    ? `₱${Number(promo.localPrice).toLocaleString()}`
                                                    : 'N/A'}
                                            </span>
                                        </div>
                                    </td>

                                    {/* VALID UNTIL */}
                                    <td>
                                        <div className="prt-date-cell">
                                            <Calendar size={14} className="prt-icon" />
                                            <span>{formatDate(promo.validUntil)}</span>
                                        </div>
                                    </td>

                                    {/* STATUS */}
                                    <td>
                                        <span className={`prt-badge ${isExpired ? 'prt-badge-expired' : 'prt-badge-active'}`}>
                                            {status}
                                        </span>
                                    </td>

                                    {/* DESCRIPTION */}
                                    <td>
                                        <div className="prt-desc-cell">
                                            <FileText size={14} className="prt-icon" />
                                            <span className="prt-desc-text" title={promo.description}>
                                                {promo.description}
                                            </span>
                                        </div>
                                    </td>

                                    {/* ACTIONS */}
                                    <td>
                                        <div className="prt-action-group">
                                            {/* View Button */}
                                            <button 
                                                className="prt-action-btn prt-view-btn"
                                                onClick={() => onView(promo)}
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                                <span>View</span>
                                            </button>

                                            {/* Archive Button */}
                                            <button 
                                                className="prt-action-btn prt-archive-btn"
                                                onClick={() => onArchive(promo._id, promo.code)}
                                                title="Archive Promo"
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
                        {promos.length === 0 && (
                            <tr>
                                <td colSpan="8" className="prt-empty-cell">
                                    No promo codes found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PromosTable;