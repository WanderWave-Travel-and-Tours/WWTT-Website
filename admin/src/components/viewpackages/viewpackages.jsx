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

    if (loading) {
        return (
            <div className="viewpackages-page-container">
                <Sidebar />
                <div className="main-content">
                    <p>Loading packages...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="viewpackages-page-container">
                <Sidebar />
                <div className="main-content">
                    <p style={{ color: 'red' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="viewpackages-page-container">
            <Sidebar />
            <div className="main-content">
                <div className="packages-header">
                    <h2>🏖️ Current Tour Packages ({packages.length})</h2>
                    <button className="add-package-btn" onClick={() => navigate('/add-package')}>
                        + Add New Package
                    </button>
                </div>

                {packages.length === 0 ? (
                    <p>No packages have been uploaded yet.</p>
                ) : (
                    <div className="packages-list">
                        {packages.map((pkg) => (
                            <div key={pkg._id} className="package-card">
                                <div className="image-container">
                                    <img 
                                        src={`http://localhost:5000/uploads/${pkg.image}`} 
                                        alt={pkg.title} 
                                        className="package-image"
                                    />
                                </div>
                                
                                <div className="package-details">
                                    <p className="package-title-display">{pkg.title}</p> 
                                    
                                    <p>
                                        <span className="detail-item">📍 {pkg.destination}</span>
                                        <span className="detail-item">🏷️ {pkg.category}</span>
                                    </p>
                                    <p>
                                        <span className="detail-item">⏳ {pkg.duration}</span> 
                                        <span className="detail-item price-tag">💰 ₱{pkg.price.toLocaleString()}</span>
                                    </p>
                                    
                                    <div className="package-actions">
                                        <button className="edit-btn">Edit</button>
                                        <button className="delete-btn">Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewPackages;