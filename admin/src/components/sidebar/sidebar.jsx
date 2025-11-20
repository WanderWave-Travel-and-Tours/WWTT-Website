import { useNavigate, useLocation } from 'react-router-dom';
import './sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Helper to determine if a menu item is active
    const isActive = (path) => location.pathname === path;
    
    const handleLogout = () => {
        // NOTE: Replaced forbidden alert() with console.log(). 
        // For production, use a custom modal or toast message.
        console.log('Logging out user...');
        localStorage.removeItem('adminToken');
        navigate('/');
    };

    // Custom navigation handler
    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon">
                        <img src="https://storage.googleapis.com/msgsndr/yTzQYPFRZAWXGWiXtIt2/media/691413034dedcf3e7fbc3e80.png" alt="Wanderwave Logo" />
                    </div>
                    <h1 className="sidebar-title">Wanderwave Travels</h1> {/* Added title back */}
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
                        <span className="menu-text">Add Package</span>
                    </li>
                    
                    <li 
                        className={`menu-item ${isActive('/view-packages') ? 'active' : ''}`} 
                        onClick={() => handleNavigate('/view-packages')}
                    >
                        <span className="menu-icon">🏖️</span>
                        <span className="menu-text">View Packages</span>
                    </li>
                    
                    <li className="menu-item">
                        <span className="menu-icon">✈️</span>
                        <span className="menu-text">Bookings</span>
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