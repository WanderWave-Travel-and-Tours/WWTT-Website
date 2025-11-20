import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../sidebar/sidebar';
import './dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    return (
        <div className="dashboard-container">
            <Sidebar />

            {/* Main Content: This is the div that is now pushed away from the sidebar by the CSS margin-left */}
            <div className="main-content">
                <div className="header">
                    <h2>Welcome back, Admin! 👋</h2>
                </div>

                <div className="content">
                    {/* Data Cards */}
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
                    <div className="card">
                        <h3>Packages Listed</h3>
                        <h1>28</h1>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;