import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './ViewPromos.css';

const ViewPromos = () => {
    const [promos, setPromos] = useState([]);

    const fetchPromos = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/promos');
            if (!response.ok) {
                throw new Error('Failed to fetch promos');
            }
            const data = await response.json();
            setPromos(data);
        } catch (error) {
            console.error("Error loading promos:", error);
        }
    };

    useEffect(() => {
        fetchPromos();
    }, []);

    const getStatus = (validUntil) => {
        const today = new Date();
        const expiryDate = new Date(validUntil);
        return expiryDate < today ? 'Expired' : 'Active';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDelete = async (id, code) => {
        if (window.confirm(`Are you sure you want to delete promo code ${code}?`)) {
            try {
                const response = await fetch(`http://localhost:5000/api/promos/${id}`, {
                    method: 'DELETE',
                });

                if (response.ok) {
                    setPromos(promos.filter(promo => promo._id !== id));
                    alert(`Promo Code ${code} has been deleted.`);
                } else {
                    alert("Failed to delete promo.");
                }
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Server error.");
            }
        }
    };

    const activePromosCount = promos.filter(p => getStatus(p.validUntil) === 'Active').length;

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

            <div className="view-promos-content">
                <h1>🏷️ View All Promo Codes</h1>
                <p className="promo-summary">
                    Currently managing <strong>{promos.length}</strong> promo codes, with <strong>{activePromosCount}</strong> currently active.
                </p>

                <div className="promo-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Promo Code</th>
                                <th>Category</th>
                                <th>Discount</th>
                                <th>Duration Type</th>
                                <th>Valid Until</th>
                                <th>Status</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map(promo => {
                                const status = getStatus(promo.validUntil);
                                return (
                                    <tr key={promo._id} className={status === 'Expired' ? 'expired-row' : ''}>
                                        
                                        <td className="promo-code-cell"><strong>{promo.code}</strong></td>
                                        
                                        <td>{promo.category}</td>
                                        
                                        <td style={{ color: '#2ecc71', fontWeight: 'bold' }}>
                                            {promo.discountType === 'Percentage' 
                                                ? `${promo.discountValue}%` 
                                                : `₱${promo.discountValue.toLocaleString()}`
                                            }
                                        </td>

                                        <td>{promo.durationType}</td>

                                        <td>{formatDate(promo.validUntil)}</td>
                                        
                                        <td>
                                            <span className={`status-badge ${status.toLowerCase()}`}>
                                                {status}
                                            </span>
                                        </td>
                                        
                                        <td className="desc-cell">{promo.description}</td>
                                        
                                        <td>
                                            <button 
                                                className="action-btn delete-btn"
                                                onClick={() => handleDelete(promo._id, promo.code)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {promos.length === 0 && (
                    <p className="no-promos">No promo codes found. Go create one!</p>
                )}
            </div>
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