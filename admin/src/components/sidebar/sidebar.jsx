import React, { useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import './sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const [isServicesOpen, setIsServicesOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        alert('Logged out successfully!');
        navigate('/');
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
            <h3 style={{color: 'white'}}>Wanderwave Admin</h3>
            <ul className="menu">
                <li className="menu-item" onClick={() => navigate('/dashboard')}>🏠 Dashboard</li>
                
                <li className="new-menu-item" onClick={navigateToAddPackage}>
                    ➕ Add Package
                </li>
                
                <li className="menu-item" onClick={navigateToViewPackages}>
                    🏖️ View Packages
                </li>

                <li className="new-menu-item" onClick={navigateToAddPromo}>
                    🏷️ Add Promo
                </li>

                <li className="menu-item" onClick={navigateToViewPromos}>
                    📋 List of Promos
                </li>

                <li className="new-menu-item" onClick={navigateToAddTestimonial}>
                    ✍️ Add Testimonial
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
                
                <li className="menu-item">🏨 Users</li>
                <li className="menu-item" onClick={handleLogout}>🚪 Logout</li>
            </ul>
        </div>
    );
};

export default Sidebar;