import React, { useState } from 'react';
import {
    X, MapPin, Tag, CreditCard, Edit, CheckCircle,
    HelpCircle, Car, ToggleLeft, ToggleRight, Image
} from 'lucide-react';
import { useToast } from '../toast/ToastManager';
import './TransferDetailModal.css';

// --- CUSTOM CONFIRMATION MODAL ---
const CustomConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, type = "primary" }) => {
    if (!isOpen) return null;
    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 11000
        }}>
            <div style={{
                backgroundColor: 'white', padding: '2rem', borderRadius: '12px',
                maxWidth: '400px', width: '90%', textAlign: 'center',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                <div style={{ marginBottom: '1rem' }}>
                    <HelpCircle size={48} color={type === 'danger' ? '#ef4444' : '#3b82f6'} style={{ margin: '0 auto' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem', color: '#1e293b' }}>{title}</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem', lineHeight: '1.5' }}>{message}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                    <button
                        onClick={onCancel}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', fontWeight: '500' }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', backgroundColor: type === 'danger' ? '#ef4444' : '#3b82f6', color: 'white', cursor: 'pointer', fontWeight: '500' }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

const TransferDetailModal = ({ transfer, close, onToggleActive, navigate }) => {
    const toast = useToast();

    const [confirmConfig, setConfirmConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        onConfirm: () => {},
        type: "primary"
    });

    if (!transfer) return null;

    const askConfirmation = (title, message, onConfirm, type = "primary") => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(prev => ({ ...prev, isOpen: false }));
            },
            type
        });
    };

    const handleToggleClick = () => {
        const isCurrentlyActive = transfer.isActive;
        askConfirmation(
            isCurrentlyActive ? "Deactivate Transfer" : "Activate Transfer",
            isCurrentlyActive
                ? `Are you sure you want to deactivate "${transfer.title}"? It will be hidden from listings.`
                : `Are you sure you want to activate "${transfer.title}"? It will be visible in listings.`,
            async () => {
                try {
                    await onToggleActive(transfer._id, transfer.isActive);
                    close();
                } catch (error) {
                    toast.error("Failed to update transfer status.");
                }
            },
            isCurrentlyActive ? "danger" : "primary"
        );
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
        <>
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
                        <button
                            className={transfer.isActive ? 'tdxm-btn-toggle-active' : 'tdxm-btn-toggle-inactive'}
                            onClick={handleToggleClick}
                        >
                            {transfer.isActive
                                ? <><ToggleRight size={16} /> Deactivate</>
                                : <><ToggleLeft size={16} /> Activate</>
                            }
                        </button>
                    </div>

                </div>
            </div>

            <CustomConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                type={confirmConfig.type}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
            />
        </>
    );
};

export default TransferDetailModal;
