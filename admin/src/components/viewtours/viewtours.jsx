import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewtours.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com/api/tours';

const ViewTours = () => {
    // --- SIDEBAR LOGIC START ---
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };
    // --- SIDEBAR LOGIC END ---

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
            <div className="viewtours-page">
                {/* Sidebar updated */}
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                {/* main updated */}
                <main className={`viewtours-main ${isSidebarCollapsed ? "viewtours-main--collapsed" : ""}`}>
                    <div className="viewtours-loader">
                        <div className="viewtours-spinner"></div>
                        <p>Loading tours...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="viewtours-page">
                {/* Sidebar updated */}
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                {/* main updated */}
                <main className={`viewtours-main ${isSidebarCollapsed ? "viewtours-main--collapsed" : ""}`}>
                    <div className="viewtours-error">
                        <span className="viewtours-error-icon">⚠️</span>
                        <p>{error}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="viewtours-page">
            {/* Sidebar updated */}
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            {/* main updated */}
            <main className={`viewtours-main ${isSidebarCollapsed ? "viewtours-main--collapsed" : ""}`}>
                <div className="viewtours-container">
                    <header className="viewtours-header">
                        <div className="viewtours-header-left">
                            <h1 className="viewtours-title">TOUR LISTS</h1>
                            <p className="viewtours-subtitle">Manage your travel packages ({tours.length} total)</p>
                        </div>
                        <button className="viewtours-btn viewtours-btn--add" onClick={() => navigate('/add-tour')}>
                            + Add New Package
                        </button>
                    </header>

                    {tours.length === 0 ? (
                        <div className="viewtours-empty">
                            <span className="viewtours-empty-icon">📍</span>
                            <h3>No tours yet</h3>
                            <p>Start by creating your first tour destination</p>
                            <button className="viewtours-btn viewtours-btn--add" onClick={() => navigate('/add-tour')}>
                                + Add Tour
                            </button>
                        </div>
                    ) : (
                        <div className="viewtours-grid">
                            {tours.map((tour) => (
                                <div key={tour._id} className="viewtours-card">
                                    <div className="viewtours-card-image">
                                        <img 
                                            src={`https://wanderwaveph-backend.onrender.com/uploads/${tour.image}`} 
                                            alt={tour.title} 
                                        />
                                        <span className="viewtours-card-category">{tour.category}</span>
                                    </div>
                                    
                                    <div className="viewtours-card-body">
                                        <h3 className="viewtours-card-title">{tour.title.toUpperCase()}</h3>
                                        
                                        <div className="viewtours-card-info">
                                            <div className="viewtours-info-row">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                                    <circle cx="12" cy="10" r="3"/>
                                                </svg>
                                                <span>{tour.destination.toUpperCase()}</span>
                                            </div>
                                            <div className="viewtours-info-row">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <polyline points="12 6 12 12 16 14"/>
                                                </svg>
                                                <span>{tour.duration.toUpperCase()}</span>
                                            </div>
                                        </div>

                                        <div className="viewtours-card-footer">
                                            <div className="viewtours-price">
                                                <span className="viewtours-price-label">PRICE</span>
                                                <span className="viewtours-price-value">₱{tour.price ? tour.price.toLocaleString() : "0"}</span>
                                            </div>
                                            
                                            <div className="viewtours-actions">
                                                <button className="viewtours-btn-action viewtours-btn-action--edit">
                                                    Edit
                                                </button>
                                                <button className="viewtours-btn-action viewtours-btn-action--delete">
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