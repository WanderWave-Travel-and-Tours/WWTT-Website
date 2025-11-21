import React, { useState } from 'react'; 
import { useNavigate, useLocation } from 'react-router-dom';
import './sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const isActive = (path) => location.pathname === path;
    
    const handleLogout = () => {
        console.log('Logging out user...');
        localStorage.removeItem('adminToken');
        navigate('/');
    };

    const handleNavigate = (path) => {
        navigate(path);
    };

    const navigateToAddPackage = () => { navigate('/add-package'); };
    const navigateToViewPackages = () => { navigate('/view-packages'); };
    const navigateToAddPromo = () => { navigate('/add-promo'); };
    const navigateToViewPromos = () => { navigate('/view-promos'); };
    const navigateToAddTestimonial = () => { navigate('/add-testimonial'); };
    const navigateToViewTestimonials = () => { navigate('/view-testimonials'); };

    const toggleServices = () => {
        setIsServicesOpen(!isServicesOpen);
    };


    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon">
                        <img src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691413034dedcf3e7fbc3e80.png" alt="Wanderwave Logo" />
                    </div>
                    <h1 className="sidebar-title">Wanderwave Travels</h1>
                    <p className="sidebar-subtitle">Admin Panel</p>
                </div>
            </div>

            <nav className="sidebar-nav">
                <ul className="menu">
                    <li 
                        className={`menu-item ${isActive('/dashboard') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/dashboard')}
                    >
                        <span className="menu-icon">🏠</span>
                        <span className="menu-text">Dashboard</span>
                    </li>
                    
                    <li 
                        className={`menu-item primary ${isActive('/add-package') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/add-package')}
                    >
                        <span className="menu-icon">➕</span>
                        <span className="menu-text" onClick={navigateToAddPackage}>Add Package</span>
                    </li>
                    
                    <li 
                        className={`menu-item ${isActive('/view-packages') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/view-packages')}
                    >
                        <span className="menu-icon">🏖️</span>
                        <span className="menu-text" onClick={navigateToViewPackages}>View Packages</span>
                    </li>

                    <li 
                        className={`menu-item ${isActive('/add-promo') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/add-promo')}
                    >
                        <span className="menu-icon">🏷️</span>
                        <span className="menu-text" onClick={navigateToAddPromo}>Add Promo</span>
                    </li>
                    
                    <li className="menu-item" onClick={navigateToViewPromos}>
                        📋 List of Promos
                    </li>

                    <li 
                        className={`menu-item ${isActive('/add-testimonial') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/add-testimonial')}
                    >
                        <span className="menu-icon">✍️</span>
                        <span className="menu-text" onClick={navigateToAddTestimonial}>Add Testimonial</span>
                    </li>
                    
                    <li className="menu-item" onClick={navigateToViewTestimonials}>
                        ⭐ Testimonials
                    </li>

                    <li 
                        className="menu-item services-parent" 
                        onClick={toggleServices}
                        onMouseEnter={() => setIsServicesOpen(true)} 
                        onMouseLeave={() => setIsServicesOpen(false)}
                    >
                        <div className="services-header">
                            <span>🛠️ Other Services</span>
                            <span className="arrow">{isServicesOpen ? '▲' : '▼'}</span>
                        </div>
                        
                        {isServicesOpen && (
                            <ul className="sub-menu">
                                <li className="sub-menu-item" onClick={(e) => { e.stopPropagation(); navigate('/services/visa'); }}>
                                    🛂 VISA Processing
                                </li>
                                <li className="sub-menu-item" onClick={(e) => { e.stopPropagation(); navigate('/services/psa'); }}>
                                    📄 PSA Serbilis
                                </li>
                                <li className="sub-menu-item" onClick={(e) => { e.stopPropagation(); navigate('/services/cenomar'); }}>
                                    💍 CENOMAR
                                </li>
                                <li className="sub-menu-item" onClick={(e) => { e.stopPropagation(); navigate('/services/passport'); }}>
                                    📘 Passport Appointment
                                </li>
                            </ul>
                        )}
                    </li>

                    
                    <li className="menu-item">
                        <span className="menu-icon">👥</span>
                        <span className="menu-text">Users</span>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={handleLogout}>
                    <span className="menu-icon">🚪</span>
                    <span className="menu-text">Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;