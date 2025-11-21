import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Plane, FileText, HeartHandshake, Package } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        }
    }, [navigate]);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className="dash-page">
            <Sidebar 
                isCollapsed={isSidebarCollapsed} 
                toggleSidebar={toggleSidebar} 
            />
            
            <main className={`dash-main ${isSidebarCollapsed ? 'dash-main--collapsed' : ''}`}>
                <div className="dash-container">
                    <header className="dash-header">
                        <div className="dash-header-left">
                            <h1 className="dash-title">DASHBOARD</h1>
                            <p className="dash-subtitle">Welcome back, Admin! Here's what's happening today.</p>
                        </div>
                        <div className="dash-header-actions">
                            <button className="dash-icon-btn">
                                <Search size={18} />
                            </button>
                            <button className="dash-icon-btn dash-icon-btn--notif">
                                <Bell size={18} />
                                <span className="dash-notif-badge">3</span>
                            </button>
                        </div>
                    </header>

                    <div className="dash-stats">
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--blue">
                                <Plane size={24} />
                            </div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Total Bookings</span>
                                <strong className="dash-stat-value">12</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--green">+12%</span>
                        </div>

                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--orange">
                                <FileText size={24} />
                            </div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Pending Inquiries</span>
                                <strong className="dash-stat-value">5</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--orange">Action Needed</span>
                        </div>

                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--green">
                                <HeartHandshake size={24} />
                            </div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Total Sales</span>
                                <strong className="dash-stat-value">₱150,000</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--green">+5.2%</span>
                        </div>

                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--purple">
                                <Package size={24} />
                            </div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Packages Listed</span>
                                <strong className="dash-stat-value">28</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--gray">Active</span>
                        </div>
                    </div>

                    <div className="dash-grid">
                        <section className="dash-section">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">RECENT BOOKINGS</h2>
                                <button className="dash-link-btn">View All</button>
                            </div>
                            <div className="dash-table-wrapper">
                                <table className="dash-table">
                                    <thead>
                                        <tr>
                                            <th>CLIENT</th>
                                            <th>PACKAGE</th>
                                            <th>DATE</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><span className="dash-client">Juan Dela Cruz</span></td>
                                            <td>Batanes Tour</td>
                                            <td>Nov 20, 2025</td>
                                            <td><span className="dash-status dash-status--completed">Confirmed</span></td>
                                        </tr>
                                        <tr>
                                            <td><span className="dash-client">Maria Santos</span></td>
                                            <td>Palawan Adventure</td>
                                            <td>Nov 19, 2025</td>
                                            <td><span className="dash-status dash-status--pending">Pending</span></td>
                                        </tr>
                                        <tr>
                                            <td><span className="dash-client">Jose Rizal</span></td>
                                            <td>Boracay Getaway</td>
                                            <td>Nov 18, 2025</td>
                                            <td><span className="dash-status dash-status--completed">Confirmed</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="dash-section">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">QUICK ACTIONS</h2>
                            </div>
                            <div className="dash-quick-actions">
                                <button className="dash-action-card" onClick={() => navigate('/add-package')}>
                                    <span className="dash-action-icon">📦</span>
                                    <span className="dash-action-text">Add Package</span>
                                </button>
                                <button className="dash-action-card" onClick={() => navigate('/add-promo')}>
                                    <span className="dash-action-icon">🏷️</span>
                                    <span className="dash-action-text">Create Promo</span>
                                </button>
                                <button className="dash-action-card" onClick={() => navigate('/view-bookings')}>
                                    <span className="dash-action-icon">📋</span>
                                    <span className="dash-action-text">View Bookings</span>
                                </button>
                                <button className="dash-action-card" onClick={() => navigate('/view-inquiries')}>
                                    <span className="dash-action-icon">💬</span>
                                    <span className="dash-action-text">Inquiries</span>
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;