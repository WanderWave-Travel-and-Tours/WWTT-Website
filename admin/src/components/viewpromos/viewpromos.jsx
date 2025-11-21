import React, { useState } from 'react';
import Sidebar from '../sidebar/sidebar';
import './ViewPromos.css';

const mockPromos = [
    { id: 1, code: 'SUMMER20', discount: 20, validUntil: '2026-08-31', description: '20% off all packages for the summer.', status: 'Active' },
    { id: 2, code: 'WAVE15', discount: 15, validUntil: '2025-12-31', description: '15% off international tours.', status: 'Active' },
    { id: 3, code: 'FLASHDEAL', discount: 50, validUntil: '2025-11-20', description: 'Expired 24-hour flash sale.', status: 'Expired' },
];

const ViewPromos = () => {
    const [promos, setPromos] = useState(mockPromos);
    const activePromos = promos.filter(p => p.status === 'Active').length;

    const handleDelete = (id, code) => {
        if (window.confirm(`Are you sure you want to delete promo code ${code}?`)) {
            setPromos(promos.filter(promo => promo.id !== id));
            alert(`Promo Code ${code} has been deleted.`);
        }
    };

    return (
        <div className="vpromos-page">
            <Sidebar />
            <main className="vpromos-main">
                <div className="vpromos-container">
                    <header className="vpromos-header">
                        <div className="vpromos-header-left">
                            <h1 className="vpromos-title">PROMO CODES</h1>
                            <p className="vpromos-subtitle">
                                Managing {promos.length} promo codes • {activePromos} currently active
                            </p>
                        </div>
                        <button className="vpromos-btn vpromos-btn--add">
                            + Add New Promo
                        </button>
                    </header>

                    {promos.length === 0 ? (
                        <div className="vpromos-empty">
                            <span className="vpromos-empty-icon">🏷️</span>
                            <h3>No promo codes yet</h3>
                            <p>Start by creating your first promo code</p>
                            <button className="vpromos-btn vpromos-btn--add">
                                + Add Promo
                            </button>
                        </div>
                    ) : (
                        <div className="vpromos-table-wrapper">
                            <table className="vpromos-table">
                                <thead>
                                    <tr>
                                        <th>CODE</th>
                                        <th>DISCOUNT</th>
                                        <th>VALID UNTIL</th>
                                        <th>STATUS</th>
                                        <th>DESCRIPTION</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promos.map(promo => (
                                        <tr key={promo.id}>
                                            <td>
                                                <span className="vpromos-code">{promo.code}</span>
                                            </td>
                                            <td>
                                                <span className="vpromos-discount">{promo.discount}%</span>
                                            </td>
                                            <td>
                                                <div className="vpromos-date">
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                        <line x1="16" y1="2" x2="16" y2="6"/>
                                                        <line x1="8" y1="2" x2="8" y2="6"/>
                                                        <line x1="3" y1="10" x2="21" y2="10"/>
                                                    </svg>
                                                    <span>{promo.validUntil}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`vpromos-status vpromos-status--${promo.status.toLowerCase()}`}>
                                                    {promo.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="vpromos-desc">{promo.description}</span>
                                            </td>
                                            <td>
                                                <div className="vpromos-actions">
                                                    <button className="vpromos-action-btn vpromos-action-btn--edit">
                                                        Edit
                                                    </button>
                                                    <button 
                                                        className="vpromos-action-btn vpromos-action-btn--delete"
                                                        onClick={() => handleDelete(promo.id, promo.code)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="vpromos-stats">
                        <div className="vpromos-stat">
                            <strong>{promos.length}</strong>
                            <span>Total Promos</span>
                        </div>
                        <div className="vpromos-stat">
                            <strong>{activePromos}</strong>
                            <span>Active</span>
                        </div>
                        <div className="vpromos-stat">
                            <strong>{promos.length - activePromos}</strong>
                            <span>Expired</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ViewPromos;