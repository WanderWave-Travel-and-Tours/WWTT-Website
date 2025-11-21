import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './ViewPackages.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/packages';

const ViewPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/all`);
                const result = await response.json();

                if (result.status === 'ok') {
                    setPackages(result.data);
                } else {
                    setError('Error: ' + (result.error || 'Failed to fetch data.'));
                }
            } catch (err) {
                console.error('Fetch error:', err);
                setError('Network error: Could not connect to the server.');
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const handleEdit = (packageId) => {
        navigate(`/edit-package`, { state: { packageId: packageId } });
    };

    if (loading) {
        return (
            <div className="packages-page">
                <Sidebar />
                <main className="packages-main">
                    <div className="packages-loader">
                        <div className="packages-spinner"></div>
                        <p>Loading packages...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="packages-page">
                <Sidebar />
                <main className="packages-main">
                    <div className="packages-error">
                        <span className="packages-error-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="packages-page">
            <Sidebar />
            <main className="packages-main">
                <div className="packages-container">
                    <header className="packages-header">
                        <div className="packages-header-left">
                            <h1 className="packages-title">TOUR PACKAGES</h1>
                            <p className="packages-subtitle">Manage your travel packages ({packages.length} total)</p>
                        </div>
                        <button className="packages-btn packages-btn--add" onClick={() => navigate('/add-package')}>
                            + Add New Package
                        </button>
                    </header>

                    {packages.length === 0 ? (
                        <div className="packages-empty">
                            <span className="packages-empty-icon">📦</span>
                            <h3>No packages yet</h3>
                            <p>Start by adding your first tour package</p>
                            <button className="packages-btn packages-btn--add" onClick={() => navigate('/add-package')}>
                                + Add Package
                            </button>
                        </div>
                    ) : (
                        <div className="packages-grid">
                            {packages.map((pkg) => (
                                <div key={pkg._id} className="pkg-card">
                                    <div className="pkg-card-image">
                                        <img 
                                            src={`http://localhost:5000/uploads/${pkg.image}`} 
                                            alt={pkg.title} 
                                        />
                                        <span className="pkg-card-category">{pkg.category}</span>
                                    </div>
                                    
                                    <div className="pkg-card-body">
                                        <h3 className="pkg-card-title">{pkg.title}</h3>
                                        
                                        <div className="pkg-card-info">
                                            <div className="pkg-info-row">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                                                    <circle cx="12" cy="10" r="3"/>
                                                </svg>
                                                <span>{pkg.destination}</span>
                                            </div>
                                            <div className="pkg-info-row">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <polyline points="12 6 12 12 16 14"/>
                                                </svg>
                                                <span>{pkg.duration}</span>
                                            </div>
                                        </div>

                                        <div className="pkg-card-footer">
                                            <div className="pkg-price">
                                                <span className="pkg-price-label">PRICE</span>
                                                <span className="pkg-price-value">₱{pkg.price.toLocaleString()}</span>
                                            </div>
                                            
                                            <div className="pkg-actions">
                                                <button 
                                                    className="pkg-btn pkg-btn--edit" 
                                                    onClick={() => handleEdit(pkg._id)}
                                                >
                                                    Edit
                                                </button>
                                                <button className="pkg-btn pkg-btn--delete">
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default ViewPackages;