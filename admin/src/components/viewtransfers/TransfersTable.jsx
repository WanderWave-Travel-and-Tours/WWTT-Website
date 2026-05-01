import React from 'react';
import { Eye, Tag, MapPin, Calendar, Car, ToggleLeft, ToggleRight } from 'lucide-react';
import './TransfersTable.css';

const TransfersTable = ({ transfers, onView, onToggleActive }) => {
    return (
        <div className="txt-table-wrapper">
            <div className="txt-table-container">
                <table className="txt-table">
                    <thead>
                        <tr>
                            <th className="txt-col-transfer">TRANSFER</th>
                            <th className="txt-col-category">CATEGORY</th>
                            <th className="txt-col-destination">DESTINATION</th>
                            <th className="txt-col-oneway">ONE WAY</th>
                            <th className="txt-col-roundtrip">ROUNDTRIP</th>
                            <th className="txt-col-status">STATUS</th>
                            <th className="txt-col-date">DATE ADDED</th>
                            <th className="txt-col-actions">ACTIONS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transfers.map((transfer) => (
                            <tr key={transfer._id}>
                                {/* Transfer Name + Image */}
                                <td>
                                    <div className="txt-transfer-cell">
                                        <div className="txt-image-preview">
                                            {transfer.imageUrl ? (
                                                <img
                                                    src={transfer.imageUrl}
                                                    alt={transfer.title}
                                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="txt-no-image">🚗</div>'; }}
                                                />
                                            ) : (
                                                <div className="txt-no-image">🚗</div>
                                            )}
                                        </div>
                                        <span className="txt-transfer-name" title={transfer.title}>
                                            {transfer.title.toUpperCase()}
                                        </span>
                                    </div>
                                </td>

                                {/* Category */}
                                <td>
                                    <div className="txt-meta-cell">
                                        <Tag size={14} className="txt-icon" />
                                        <span>{transfer.category || '—'}</span>
                                    </div>
                                </td>

                                {/* Destination */}
                                <td>
                                    <div className="txt-meta-cell">
                                        <MapPin size={14} className="txt-icon" />
                                        <span>{transfer.packageDestination ? transfer.packageDestination.toUpperCase() : '—'}</span>
                                    </div>
                                </td>

                                {/* One Way Price */}
                                <td>
                                    {transfer.oneWayPrice > 0 ? (
                                        <div className="txt-price-cell">
                                            <span className="txt-price-main">₱{transfer.oneWayPrice?.toLocaleString()}</span>
                                            <span className="txt-price-sub">One Way</span>
                                        </div>
                                    ) : (
                                        <span className="txt-price-na">—</span>
                                    )}
                                </td>

                                {/* Roundtrip Price */}
                                <td>
                                    {transfer.roundtripPrice > 0 ? (
                                        <div className="txt-price-cell">
                                            <span className="txt-price-main">₱{transfer.roundtripPrice?.toLocaleString()}</span>
                                            <span className="txt-price-sub">Roundtrip</span>
                                        </div>
                                    ) : (
                                        <span className="txt-price-na">—</span>
                                    )}
                                </td>

                                {/* Status */}
                                <td>
                                    <span className={`txt-status-badge ${transfer.isActive ? 'active' : 'inactive'}`}>
                                        <span className="txt-status-dot"></span>
                                        {transfer.isActive ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </td>

                                {/* Date Added */}
                                <td>
                                    <div className="txt-date-cell">
                                        <Calendar size={14} className="txt-icon" />
                                        {transfer.displayDate}
                                    </div>
                                </td>

                                {/* Actions */}
                                <td>
                                    <div className="txt-action-group">
                                        <button
                                            className="txt-action-btn txt-view-btn"
                                            onClick={() => onView(transfer)}
                                        >
                                            <Eye size={16} />
                                            <span>View</span>
                                        </button>
                                        <button
                                            className={`txt-action-btn ${transfer.isActive ? 'txt-toggle-btn-active' : 'txt-toggle-btn-inactive'}`}
                                            onClick={() => onToggleActive(transfer._id, transfer.isActive)}
                                        >
                                            {transfer.isActive
                                                ? <><ToggleRight size={16} /><span>Deactivate</span></>
                                                : <><ToggleLeft size={16} /><span>Activate</span></>
                                            }
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}

                        {transfers.length === 0 && (
                            <tr>
                                <td colSpan="8" className="txt-empty-cell">
                                    No transfers found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransfersTable;
