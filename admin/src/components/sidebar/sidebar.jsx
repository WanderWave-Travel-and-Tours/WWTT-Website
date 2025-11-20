import { useNavigate } from 'react-router-dom';
import './sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        alert('Logged out successfully!');
        navigate('/');
    };

    const navigateToAddPackage = () => {
        navigate('/add-package');
    };

    const navigateToViewPackages = () => {
        navigate('/view-packages');
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
                
                <li className="menu-item">✈️ Bookings</li>
                <li className="menu-item">🏨 Users</li>
                <li className="menu-item" onClick={handleLogout}>🚪 Logout</li>
            </ul>
        </div>
    );
};

export default Sidebar;