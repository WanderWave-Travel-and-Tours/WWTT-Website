import React, { useState } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewpromos.css';

// Sample Data for demonstration
const mockPromos = [
    { id: 1, code: 'SUMMER20', discount: 20, validUntil: '2026-08-31', description: '20% off all packages for the summer.', status: 'Active' },
    { id: 2, code: 'WAVE15', discount: 15, validUntil: '2025-12-31', description: '15% off international tours.', status: 'Active' },
    { id: 3, code: 'FLASHDEAL', discount: 50, validUntil: '2025-11-20', description: 'Expired 24-hour flash sale.', status: 'Expired' },
];

const ViewPromos = () => {
    const [promos, setPromos] = useState(mockPromos);
    const activePromos = promos.filter(p => p.status === 'Active').length;

    // Function to handle deleting a promo (mock functionality)
    const handleDelete = (id, code) => {
        if (window.confirm(`Are you sure you want to delete promo code ${code}?`)) {
            setPromos(promos.filter(promo => promo.id !== id));
            alert(`Promo Code ${code} has been deleted.`);
        }
    };

    return (
        <div className="admin-layout">
            <Sidebar />

            <div className="view-promos-content">
                <h1>🏷️ View All Promo Codes</h1>
                <p className="promo-summary">
                    Currently managing **{promos.length}** promo codes, with **{activePromos}** currently active.
                </p>

                <div className="promo-table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Promo Code</th>
                                <th>Discount</th>
                                <th>Valid Until</th>
                                <th>Status</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map(promo => (
                                <tr key={promo.id} className={promo.status === 'Expired' ? 'expired-row' : ''}>
                                    <td>{promo.id}</td>
                                    <td className="promo-code-cell">**{promo.code}**</td>
                                    <td>{promo.discount}%</td>
                                    <td>{promo.validUntil}</td>
                                    <td>
                                        <span className={`status-badge ${promo.status.toLowerCase()}`}>
                                            {promo.status}
                                        </span>
                                    </td>
                                    <td>{promo.description}</td>
                                    <td>
                                        <button 
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(promo.id, promo.code)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {promos.length === 0 && (
                    <p className="no-promos">No promo codes found.</p>
                )}
            </div>
        </div>
    );
};

export default ViewPromos;