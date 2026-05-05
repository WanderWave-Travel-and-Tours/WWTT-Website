import React from 'react';
import {
    X, MapPin, Tag, CreditCard, Edit, CheckCircle,
    Car, Trash2, Image
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import './TransferDetailModal.css';

const TransferDetailModal = ({ transfer, close, onArchive, navigate }) => {
    const toast = useToast();

    if (!transfer) return null;

    const handleArchiveClick = () => {
        onArchive(transfer._id);
    };

    const handleEditClick = () => {
        navigate(`/edit-transfer/${transfer._id}`);
        toast.info("Opening editor...");
    };

    const formatPrice = (price) =>
        price && price > 0 ? `₱${price.toLocaleString()}` : '—';

    const formatMarkup = (value, type) => {
        if (!value || value === 0) return '—';
        return type === 'percent' ? `${value}%` : `₱${value.toLocaleString()}`;
    };

    return (
        <div className="tdxm-overlay" onClick={close}>
            <div className="tdxm-content" onClick={e => e.stopPropagation()}>

                {/* HEADER */}
                <div className="tdxm-header">
                    <div className="tdxm-header-left">
                        <h2 className="tdxm-main-title">Transfer Details</h2>
                        <div className="tdxm-ref-tag">REF: #{transfer._id.slice(-8).toUpperCase()}</div>
                    </div>
                    <div className="tdxm-header-right">
                        <div className={`tdxm-status-pill ${transfer.isActive ? 'active' : 'inactive'}`}>
                            <CheckCircle size={14} />
                            <span>{transfer.isActive ? 'ACTIVE' : 'INACTIVE'}</span>
                        </div>
                        <button className="tdxm-close-x" onClick={close}><X size={18} /></button>
                    </div>
                </div>

                {/* BODY */}
                <div className="tdxm-body">

                    {/* IMAGE */}
                    <div className="tdxm-section-card dashed-border">
                        {transfer.imageUrl ? (
                            <img
                                src={transfer.imageUrl}
                                className="tdxm-transfer-image"
                                alt={transfer.title}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                                }}
                            />
                        ) : (
                            <div className="tdxm-no-image">
                                <Image size={48} strokeWidth={1} />
                                <span>No Image Available</span>
                            </div>
                        )}
                    </div>

                    {/* TRANSFER INFORMATION */}
                    <div className="tdxm-section-card">
                        <h3 className="tdxm-section-title">TRANSFER INFORMATION</h3>
                        <div className="tdxm-info-grid">
                            <div className="tdxm-info-box">
                                <div className="tdxm-box-icon blue"><Car size={18} /></div>
                                <div className="tdxm-box-content">
                                    <label>TITLE</label>
                                    <p>{transfer.title.toUpperCase()}</p>
                                </div>
                            </div>
                            <div className="tdxm-info-box">
                                <div className="tdxm-box-icon yellow"><Tag size={18} /></div>
                                <div className="tdxm-box-content">
                                    <label>CATEGORY</label>
                                    <p>{transfer.category || '—'}</p>
                                </div>
                            </div>
                            <div className="tdxm-info-box">
                                <div className="tdxm-box-icon green"><MapPin size={18} /></div>
                                <div className="tdxm-box-content">
                                    <label>DESTINATION</label>
                                    <p>{transfer.packageDestination ? transfer.packageDestination.toUpperCase() : '—'}</p>
                                </div>
                            </div>
                            <div className="tdxm-info-box">
                                <div className="tdxm-box-icon orange"><CreditCard size={18} /></div>
                                <div className="tdxm-box-content">
                                    <label>STATUS</label>
                                    <p>{transfer.isActive ? 'Active' : 'Inactive'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* PRICING BREAKDOWN */}
                    <div className="tdxm-section-card">
                        <h3 className="tdxm-section-title">PRICING BREAKDOWN</h3>
                        <table className="tdxm-pricing-table">
                            <thead>
                                <tr>
                                    <th>TYPE</th>
                                    <th>SUPPLIER RATE</th>
                                    <th>MARKUP</th>
                                    <th>SELLING PRICE</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>One Way</strong></td>
                                    <td>{formatPrice(transfer.oneWaySupplierRate)}</td>
                                    <td>{formatMarkup(transfer.oneWayMarkupValue, transfer.oneWayMarkupType)}</td>
                                    <td><span className="tdxm-price-highlight">{formatPrice(transfer.oneWayPrice)}</span></td>
                                </tr>
                                <tr>
                                    <td><strong>Roundtrip</strong></td>
                                    <td>{formatPrice(transfer.roundtripSupplierRate)}</td>
                                    <td>{formatMarkup(transfer.roundtripMarkupValue, transfer.roundtripMarkupType)}</td>
                                    <td><span className="tdxm-price-highlight">{formatPrice(transfer.roundtripPrice)}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="tdxm-footer">
                    <button className="tdxm-btn-close" onClick={close}>Close</button>
                    <button className="tdxm-btn-edit" onClick={handleEditClick}>
                        <Edit size={16} /> Edit
                    </button>
                    <button className="tdxm-btn-danger" onClick={handleArchiveClick}>
                        <Trash2 size={16} /> Archive
                    </button>
                </div>

            </div>
        </div>
    );
};

export default TransferDetailModal;