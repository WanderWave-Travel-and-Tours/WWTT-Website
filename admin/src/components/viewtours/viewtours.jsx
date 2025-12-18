import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewtours.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/tours';
const API_BASE_URL = 'http://localhost:5000/api/tours';

const ViewTours = () => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const [tours, setTours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // Check if admin is logged in
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    // Fetch all active tours (isArchive: "No")
    const fetchTours = async () => {
        try {
            setLoading(true);
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

    useEffect(() => {
        fetchTours();
    }, []);

    // Archive Tour
    const handleArchive = async (id) => {
        if (!window.confirm('Are you sure you want to archive this tour? It will no longer appear in the list.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/archive/${id}`, {
                method: 'PATCH',
            });
            const result = await response.json();

            if (response.ok && result.status === 'ok') {
                // Remove the archived tour from state (so it disappears immediately)
                setTours(prevTours => prevTours.filter(tour => tour._id !== id));
                alert('Tour archived successfully!');
            } else {
                alert('Error archiving tour: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Archive error:', err);
            alert('Failed to archive tour. Check your connection.');
        }
    };

    // Delete Tour (permanent)
    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY delete this tour? This cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
                method: 'DELETE',
            });
            const result = await response.json();

            if (response.ok && result.status === 'ok') {
                setTours(prevTours => prevTours.filter(tour => tour._id !== id));
                alert('Tour deleted permanently!');
            } else {
                alert('Error deleting tour: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete tour.');
        }
    };

    // Placeholder for Edit (pwede mo i-route sa edit page later)
    const handleEdit = (id) => {
        navigate(`/edit-tour/${id}`); // Example route, adjust as needed
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this tour?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/delete/${id}`, {
                    method: 'DELETE',
                });
                const result = await response.json();
                
                if (result.status === 'ok') {
                    setTours(tours.filter(tour => tour._id !== id));
                    alert('✅ Tour deleted successfully!');
                } else {
                    alert('❌ Error deleting tour');
                }
            } catch (err) {
                console.error('Delete error:', err);
                alert('❌ Error connecting to server');
            }
        }
    };

    if (loading) {
        return (
            <div className="viewtours-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
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
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
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
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            <main className={`viewtours-main ${isSidebarCollapsed ? "viewtours-main--collapsed" : ""}`}>
                <div className="viewtours-container">
                    <header className="viewtours-header">
                        <div className="viewtours-header-left">
                            <h1 className="viewtours-title">TOUR LISTS</h1>
                            <p className="viewtours-subtitle">Manage your travel packages ({tours.length} active)</p>
                        </div>
                        <button className="viewtours-btn viewtours-btn--add" onClick={() => navigate('/add-tour')}>
                            + Add New Tour
                        </button>
                    </header>

                    {tours.length === 0 ? (
                        <div className="viewtours-empty">
                            <span className="viewtours-empty-icon">📍</span>
                            <h3>No active tours</h3>
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
                                            src={`http://localhost:5000/uploads/${tour.image}`} 
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
                                                <button 
                                                    className="viewtours-btn-action viewtours-btn-action--edit"
                                                    onClick={() => handleEdit(tour._id)}
                                                >
                                                <button 
                                                    className="viewtours-btn-action viewtours-btn-action--edit"
                                                    onClick={() => navigate(`/edit-tour/${tour._id}`)}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    className="viewtours-btn-action viewtours-btn-action--delete"
                                                    onClick={() => handleDelete(tour._id)}
                                                >
                                                <button 
                                                    className="viewtours-btn-action viewtours-btn-action--archive"
                                                    onClick={() => handleArchive(tour._id)}
                                                >
                                                    Archive
                                                </button>
                                                <button 
                                                    className="viewtours-btn-action viewtours-btn-action--delete"
                                                    onClick={() => handleDelete(tour._id)}
                                                >
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