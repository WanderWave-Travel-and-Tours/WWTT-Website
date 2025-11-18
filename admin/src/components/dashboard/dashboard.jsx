// admin/src/components/Dashboard.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const navigate = useNavigate();

    // Check kung may "token" (kung naka-login ba talaga)
    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/'); // Ibabalik sa login pag wala
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('adminToken'); // Burahin ang susi
        alert('Logged out successfully!');
        navigate('/'); // Balik sa Login
    };

    return (
        <div style={styles.container}>
            {/* Sidebar Fake */}
            <div style={styles.sidebar}>
                <h3 style={{color: 'white'}}>Wanderwave Admin</h3>
                <ul style={styles.menu}>
                    <li style={styles.menuItem}>🏠 Dashboard</li>
                    <li style={styles.menuItem}>✈️ Bookings</li>
                    <li style={styles.menuItem}>🏨 Users</li>
                    <li style={styles.menuItem} onClick={handleLogout}>🚪 Logout</li>
                </ul>
            </div>

            {/* Main Content */}
            <div style={styles.main}>
                <div style={styles.header}>
                    <h2>Welcome back, Admin! 👋</h2>
                </div>
                
                <div style={styles.content}>
                    <div style={styles.card}>
                        <h3>Total Bookings</h3>
                        <h1>12</h1>
                    </div>
                    <div style={styles.card}>
                        <h3>Pending Inquiries</h3>
                        <h1>5</h1>
                    </div>
                    <div style={styles.card}>
                        <h3>Total Sales</h3>
                        <h1>₱ 150,000</h1>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Simple styling para magmukhang Admin Panel
const styles = {
    container: { display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' },
    sidebar: { width: '250px', backgroundColor: '#1a1a2e', padding: '20px', color: 'white' },
    menu: { listStyle: 'none', padding: 0, marginTop: '30px' },
    menuItem: { padding: '15px 10px', cursor: 'pointer', borderBottom: '1px solid #333' },
    main: { flex: 1, backgroundColor: '#f4f7f6', display: 'flex', flexDirection: 'column' },
    header: { padding: '20px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    content: { padding: '20px', display: 'flex', gap: '20px' },
    card: { flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }
};

export default Dashboard;