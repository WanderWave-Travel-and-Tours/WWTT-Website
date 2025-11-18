import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        alert('Logged out successfully!');
        navigate('/');
    };

    const navigateToAddPackage = () => {
        navigate('/add-package');
    };

    return (
        <div className="dashboard-container">
            <div className="sidebar">
                <h3 style={{color: 'white'}}>Wanderwave Admin</h3> 
                <ul className="menu">
                    <li className="menu-item" onClick={() => navigate('/dashboard')}>🏠 Dashboard</li> 
                    <li className="new-menu-item" onClick={navigateToAddPackage}>
                        ➕ Add Package
                    </li>
                    <li className="menu-item">✈️ Bookings</li>
                    <li className="menu-item">🏨 Users</li>
                    <li className="menu-item" onClick={handleLogout}>🚪 Logout</li>
                </ul>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="header">
                    <h2>Welcome back, Admin! 👋</h2>
                </div>
                
                <div className="content">
                    <div className="card">
                        <h3>Total Bookings</h3>
                        <h1>12</h1>
                    </div>
                    <div className="card"> 
                        <h3>Pending Inquiries</h3>
                        <h1>5</h1>
                    </div>
                    <div className="card">
                        <h3>Total Sales</h3>
                        <h1>₱ 150,000</h1>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;