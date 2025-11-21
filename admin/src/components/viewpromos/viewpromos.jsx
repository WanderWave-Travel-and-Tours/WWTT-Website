import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewpromos.css';

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
        <div className="admin-layout">
            <Sidebar />

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
        </div>
    );
};

export default ViewPromos;