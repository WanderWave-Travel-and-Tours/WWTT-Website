import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar'; // I-import ang Sidebar
import './dashboard.css'; // Siguraduhin na ang natitirang CSS lang ng dashboard ang nandito

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    // Tinanggal na ang handleLogout at navigateToAddPackage dahil nasa Sidebar.jsx na sila

    return (
        <div className="dashboard-container">
            {/* Callout/Gamitin na ang Sidebar component */}
            <Sidebar />

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