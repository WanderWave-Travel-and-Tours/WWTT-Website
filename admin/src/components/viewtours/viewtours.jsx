import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewtours.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/tours';

const ViewTours = () => {
    const [tours, setTours] = useState([]);
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
        const fetchTours = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/all`);
                const result = await response.json();

                if (result.status === 'ok') {
                    setTours(result.data);
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

        fetchTours();
    }, []);

    if (loading) {
        return (
            <div className="tours-page">
                <Sidebar />
                <main className="tours-main">
                    <div className="tours-loader">
                        <div className="tours-spinner"></div>
                        <p>Loading tours...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="tours-page">
                <Sidebar />
                <main className="tours-main">
                    <div className="tours-error">
                        <span className="tours-error-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="tours-page">
            <Sidebar />
            <main className="tours-main">
                <div className="tours-container">
                    <header className="tours-header">
                        <div className="tours-header-left">
                            <h1 className="tours-title">MANAGE TOURS</h1>
                            <p className="tours-subtitle">Overview of your destination offers ({tours.length} total)</p>
                        </div>
                        <button className="tours-btn tours-btn--add" onClick={() => navigate('/add-tour')}>
                            + Add New Tour
                        </button>
                    </header>

                    {tours.length === 0 ? (
                        <div className="tours-empty">
                            <span className="tours-empty-icon">📍</span>
                            <h3>No tours yet</h3>
                            <p>Start by creating your first tour destination</p>
                            <button className="tours-btn tours-btn--add" onClick={() => navigate('/add-tour')}>
                                + Add Tour
                            </button>
                        </div>
                    ) : (
                        <div className="tours-grid">
                            {tours.map((tour) => (
                                <div key={tour._id} className="tour-card">
                                    <div className="tour-card-image">
                                        <img 
                                            src={`http://localhost:5000/uploads/${tour.image}`} 
                                            alt={tour.title} 
                                        />
                                        <span className="tour-card-category">{tour.category}</span>
                                    </div>
                                    
                                    <div className="tour-card-body">
                                        <h3 className="tour-card-title">{tour.title}</h3>
                                        
                                        <div className="tour-card-info">
                                            <div className="tour-info-row">
                                                <span>Destination: {tour.destination}</span>
                                            </div>
                                            <div className="tour-info-row">
                                                <span>Duration: {tour.duration}</span>
                                            </div>
                                        </div>

                                        <div className="tour-card-footer">
                                            <div className="tour-price">
                                                <span className="tour-price-label">PRICE</span>
                                                <span className="tour-price-value">₱{tour.price ? tour.price.toLocaleString() : "0"}</span>
                                            </div>
                                            
                                            <div className="tour-actions">
                                                <button className="tour-btn tour-btn--edit">
                                                    Edit
                                                </button>
                                                <button className="tour-btn tour-btn--delete">
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

export default ViewTours;