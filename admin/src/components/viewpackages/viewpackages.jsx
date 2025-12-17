import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewpackages.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'https://wanderwaveph-backend.onrender.com/api/packages';

const ViewPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // 1. Sidebar State Management
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // 2. Sidebar Toggle Function
  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

    // Redirection useEffect
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    // Data Fetching useEffect
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

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Filter packages based on the search term (case-insensitive title search)
    const filteredPackages = packages.filter(pkg =>
        pkg.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="packages-page">
               
                <main className={`packages-main ${isSidebarCollapsed ? 'packages-main--collapsed' : ''}`}>
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
                {/* 3A. Pass props to Sidebar in error state */}
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                {/* 3B. Use dynamic class on main content in error state */}
                <main className={`packages-main ${isSidebarCollapsed ? 'packages-main--collapsed' : ''}`}>
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
            {/* 3A. Pass props to Sidebar in main render */}
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            {/* 3B. Use dynamic class on main content in main render */}
            <main className={`packages-main ${isSidebarCollapsed ? 'packages-main--collapsed' : ''}`}>
                <div className="packages-container">
                    <header className="packages-header">
                        <div className="packages-header-left">
                            <h1 className="packages-title">TOUR PACKAGES</h1>
                            <p className="packages-subtitle">Manage your travel packages ({packages.length} total)</p>
                        </div>
                        <div className="packages-header-right">
                            {/* Search Input Field */}
                            <div className="packages-search-bar">
                                <input
                                    type="text"
                                    placeholder="Search by package title..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="packages-search-input"
                                />
                                <svg className="packages-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            {/* Add New Package Button */}
                            <button className="packages-btn packages-btn--add" onClick={() => navigate('/add-package')}>
                                + Add New Package
                            </button>
                        </div>
                    </header>

                    {filteredPackages.length === 0 ? (
                        <div className="packages-empty">
                            <span className="packages-empty-icon">📦</span>
                            <h3>{searchTerm ? `No packages found for "${searchTerm}"` : 'No packages yet'}</h3>
                            <p>{searchTerm ? 'Try a different search term.' : 'Start by adding your first tour package'}</p>
                            {!searchTerm && ( // Only show 'Add Package' button if not in search mode
                                <button className="packages-btn packages-btn--add" onClick={() => navigate('/add-package')}>
                                    + Add Package
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="packages-grid">
                            {filteredPackages.map((pkg) => ( // Use filteredPackages here
                                <div key={pkg._id} className="pkg-card">
                                    <div className="pkg-card-image">
                                        <img 
                                            src={`https://wanderwaveph-backend.onrender.com/uploads/${pkg.image}`} 
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