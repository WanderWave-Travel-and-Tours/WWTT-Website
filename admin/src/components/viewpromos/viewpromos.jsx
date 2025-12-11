import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './ViewPromos.css';

const ViewPromos = () => {
    // --- SIDEBAR TOGGLE LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR TOGGLE LOGIC END ---

    const [promos, setPromos] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // New state for current page
    const itemsPerPage = 10; // Constant for items per page

    const fetchPromos = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/promos');
            if (!response.ok) {
                throw new Error('Failed to fetch promos');
            }
            const data = await response.json();
            setPromos(data);
            setCurrentPage(1); // Reset to page 1 on new data fetch
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
                    // Update state and re-check if the current page is now empty
                    const updatedPromos = promos.filter(promo => promo._id !== id);
                    setPromos(updatedPromos);
                    alert(`Promo Code ${code} has been deleted.`);
                    
                    // Adjust page if current page is empty after deletion and not the first page
                    const maxPage = Math.ceil(updatedPromos.length / itemsPerPage);
                    if (currentPage > maxPage && maxPage > 0) {
                        setCurrentPage(maxPage);
                    }
                } else {
                    alert("Failed to delete promo.");
                }
            } catch (error) {
                console.error("Error deleting:", error);
                alert("Server error.");
            }
        }
    };
    
    // --- PAGINATION LOGIC START ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPromos = promos.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(promos.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Create array for pagination buttons
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }
    // --- PAGINATION LOGIC END ---

    const activePromos = promos.filter(p => getStatus(p.validUntil) === 'Active').length;
    
    // Dynamically set the main content class
    const mainClass = `vpromos-main ${isSidebarCollapsed ? 'vpromos-main--collapsed' : ''}`;

    return (
        <div className="vpromos-page">
         <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            <main className={mainClass}>
                <div className="vpromos-container">
                    <header className="vpromos-header">
                        <div className="vpromos-header-left">
                            <h1 className="vpromos-title">PROMO CODES</h1>
                            <p className="vpromos-subtitle">
                                Managing {promos.length} promo codes • {activePromos} currently active
                            </p>
                        </div>
                        <button className="vpromos-btn vpromos-btn--add" onClick={() => window.location.href='/add-promo'}>
                            + Add New Promo
                        </button>
                    </header>
                    {promos.length > 0 && (
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
                    )}
                    
                    {promos.length === 0 ? (
                        <div className="vpromos-empty">
                            <span className="vpromos-empty-icon">🏷️</span>
                            <h3>No promo codes yet</h3>
                            <p>Start by creating your first promo code</p>
                            <button className="vpromos-btn vpromos-btn--add" onClick={() => window.location.href='/add-promo'}>
                                + Add Promo
                            </button>
                        </div>
                    ) : (
                        <div className="vpromos-table-wrapper">
                            <table className="vpromos-table">
                                <thead>
                                    <tr>
                                        <th>CODE</th>
                                        <th>CATEGORY</th>
                                        <th>DISCOUNT</th>
                                        <th>VALID UNTIL</th>
                                        <th>STATUS</th>
                                        <th>DESCRIPTION</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Map over currentPromos instead of all promos */}
                                    {currentPromos.map(promo => {
                                        const status = getStatus(promo.validUntil);
                                        return (
                                            <tr key={promo._id}>
                                                <td>
                                                    <span className="vpromos-code">{promo.code}</span>
                                                </td>
                                                <td>
                                                    {promo.category}
                                                </td>
                                                <td>
                                                    <span className="vpromos-discount">
                                                        {promo.discountType === 'Percentage' 
                                                            ? `${promo.discountValue}%` 
                                                            : `₱${promo.discountValue.toLocaleString()}`
                                                        }
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="vpromos-date">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                                            <line x1="16" y1="2" x2="16" y2="6"/>
                                                            <line x1="8" y1="2" x2="8" y2="6"/>
                                                            <line x1="3" y1="10" x2="21" y2="10"/>
                                                        </svg>
                                                        <span>{formatDate(promo.validUntil)}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`vpromos-status vpromos-status--${status.toLowerCase()}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="vpromos-desc">{promo.description}</span>
                                                </td>
                                                <td>
                                                    <div className="vpromos-actions">
                                                        <button 
                                                            className="vpromos-action-btn vpromos-action-btn--delete"
                                                            onClick={() => handleDelete(promo._id, promo.code)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            
                            {/* PAGINATION NAVIGATION */}
                            {totalPages > 1 && (
                                <nav className="pagination-nav">
                                    <ul className="pagination-list">
                                        <li>
                                            <button
                                                className="pagination-btn"
                                                onClick={() => paginate(currentPage - 1)}
                                                disabled={currentPage === 1}
                                            >
                                                Previous
                                            </button>
                                        </li>
                                        {pageNumbers.map(number => (
                                            <li key={number}>
                                                <button
                                                    onClick={() => paginate(number)}
                                                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                                                >
                                                    {number}
                                                </button>
                                            </li>
                                        ))}
                                        <li>
                                            <button
                                                className="pagination-btn"
                                                onClick={() => paginate(currentPage + 1)}
                                                disabled={currentPage === totalPages}
                                            >
                                                Next
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                            {/* END PAGINATION NAVIGATION */}
                        </div>
                    )}


                </div>
            </main>
        </div>
    );
};

export default ViewPromos;