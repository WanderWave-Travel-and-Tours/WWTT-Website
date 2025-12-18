import React, { useState, useEffect } from 'react';
import Sidebar from '../sidebar/sidebar';
import './viewpackages.css';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:5000/api/packages';

const ViewPackages = () => {
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    const fetchPackages = async () => {
        try {
            // Kinukuha ang data mula sa /all endpoint na naka-filter na sa "No"
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

    useEffect(() => {
        fetchPackages();
    }, []);

    const handleEdit = (packageId) => {
        navigate(`/edit-package`, { state: { packageId: packageId } });
    };

    const handleArchive = async (packageId) => {
        if (window.confirm("Are you sure you want to archive this package? It will be moved to the archive section.")) {
            try {
                // Tinatawag ang archive endpoint
                const response = await fetch(`${API_BASE_URL}/${packageId}/archive`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                const result = await response.json();

                if (result.status === 'ok') {
                    alert("Package archived successfully!");
                    // Tinatanggal ang in-archive na package sa UI state
                    setPackages(prevPackages => prevPackages.filter(pkg => pkg._id !== packageId));
                } else {
                    alert("Failed to archive: " + (result.message || "Unknown error"));
                }
            } catch (err) {
                console.error("Error archiving:", err);
                alert("An error occurred while archiving the package.");
            }
        }
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    // Filter logic para sa search bar
    const filteredPackages = packages.filter(pkg =>
        pkg.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="packages-page">
                <main className={`packages-main ${isSidebarCollapsed ? 'packages-main--collapsed' : ''}`}>
                    <div className="packages-loader">
                        <div className="packages-spinner"></div>
                        <p>Loading active packages...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="packages-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
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
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`packages-main ${isSidebarCollapsed ? 'packages-main--collapsed' : ''}`}>
                <div className="packages-container">
                    <header className="packages-header">
                        <div className="packages-header-left">
                            <h1 className="packages-title">ACTIVE TOUR PACKAGES</h1>
                            <p className="packages-subtitle">Viewing packages with isArchive: "No" ({packages.length} items)</p>
                        </div>
                        <div className="packages-header-right">
                            <div className="packages-search-bar">
                                <input
                                    type="text"
                                    placeholder="Search active packages..."
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    className="packages-search-input"
                                />
                                <svg className="packages-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="11" cy="11" r="8"></circle>
                                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                                </svg>
                            </div>
                            <button className="packages-btn packages-btn--add" onClick={() => navigate('/add-package')}>
                                + Add New Package
                            </button>
                        </div>
                    </header>

                    {filteredPackages.length === 0 ? (
                        <div className="packages-empty">
                            <span className="packages-empty-icon">📦</span>
                            <h3>{searchTerm ? `No active packages found for "${searchTerm}"` : 'No active packages'}</h3>
                            <p>All archived packages are moved to the Archive List.</p>
                        </div>
                    ) : (
                        <div className="packages-grid">
                            {filteredPackages.map((pkg) => (
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
                                                <button 
                                                    className="pkg-btn pkg-btn--delete"
                                                    onClick={() => handleArchive(pkg._id)}
                                                    style={{ backgroundColor: '#dc3545' }} // Ginawang pula para sa Archive action
                                                >
                                                    Archive
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