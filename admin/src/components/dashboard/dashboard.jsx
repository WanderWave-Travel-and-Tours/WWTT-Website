import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Plane, FileText, HeartHandshake, Package, TrendingUp, Users, MapPin, Calendar, FileCheck, ScrollText, Heart, BookOpen } from 'lucide-react';
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

    const recentBookings = [
        { id: 1, client: 'Juan Dela Cruz', package: 'Batanes Tour', date: 'Nov 20, 2025', status: 'Confirmed', amount: '₱25,000' },
        { id: 2, client: 'Maria Santos', package: 'Palawan Adventure', date: 'Nov 19, 2025', status: 'Pending', amount: '₱18,500' },
        { id: 3, client: 'Jose Rizal', package: 'Boracay Getaway', date: 'Nov 18, 2025', status: 'Confirmed', amount: '₱22,000' },
        { id: 4, client: 'Ana Reyes', package: 'Cebu Explorer', date: 'Nov 17, 2025', status: 'Cancelled', amount: '₱15,000' },
    ];

    const topPackages = [
        { name: 'Batanes Tour', bookings: 45, revenue: '₱1,125,000', trend: '+12%' },
        { name: 'Palawan Adventure', bookings: 38, revenue: '₱703,000', trend: '+8%' },
        { name: 'Boracay Getaway', bookings: 32, revenue: '₱704,000', trend: '+5%' },
    ];

    const recentInquiries = [
        { id: 1, name: 'Pedro Garcia', subject: 'Visa Processing Time', time: '2 hours ago', status: 'New' },
        { id: 2, name: 'Luna Martinez', subject: 'Group Discount Inquiry', time: '5 hours ago', status: 'New' },
        { id: 3, name: 'Carlos Tan', subject: 'Payment Options', time: '1 day ago', status: 'Replied' },
    ];

    const servicesData = [
        { name: 'VISA Processing', icon: FileCheck, path: '/services/visa', pending: 8, completed: 45, color: 'blue' },
        { name: 'PSA Serbilis', icon: ScrollText, path: '/services/psa', pending: 12, completed: 89, color: 'green' },
        { name: 'CENOMAR', icon: Heart, path: '/services/cenomar', pending: 5, completed: 34, color: 'pink' },
        { name: 'Passport Appt', icon: BookOpen, path: '/services/passport', pending: 15, completed: 67, color: 'purple' },
    ];

    return (
        <div className="dash-page">
            <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
            
            <main className={`dash-main ${isSidebarCollapsed ? 'dash-main--collapsed' : ''}`}>
                <div className="dash-container">
                    <header className="dash-header">
                        <div className="dash-header-left">
                            <h1 className="dash-title">DASHBOARD</h1>
                            <p className="dash-subtitle">Welcome back, Admin! Here's what's happening today.</p>
                        </div>
                        <div className="dash-header-actions">
                            <button className="dash-icon-btn"><Search size={18} /></button>
                            <button className="dash-icon-btn dash-icon-btn--notif">
                                <Bell size={18} />
                                <span className="dash-notif-badge">3</span>
                            </button>
                        </div>
                    </header>

                    <div className="dash-stats">
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--blue"><Plane size={24} /></div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Total Bookings</span>
                                <strong className="dash-stat-value">128</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--green">+12%</span>
                        </div>
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--orange"><FileText size={24} /></div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Pending Inquiries</span>
                                <strong className="dash-stat-value">5</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--orange">Action Needed</span>
                        </div>
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--green"><HeartHandshake size={24} /></div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Total Sales</span>
                                <strong className="dash-stat-value">₱2.5M</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--green">+5.2%</span>
                        </div>
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--purple"><Package size={24} /></div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Active Packages</span>
                                <strong className="dash-stat-value">28</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--gray">Active</span>
                        </div>
                    </div>

                    <div className="dash-grid">
                        <section className="dash-section dash-section--wide">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">OTHER SERVICES</h2>
                                <span className="dash-section-badge">4 Services</span>
                            </div>
                            <div className="dash-services-grid">
                                {servicesData.map((svc, i) => (
                                    <div key={i} className={`dash-service-card dash-service-card--${svc.color}`} onClick={() => navigate(svc.path)}>
                                        <div className="dash-service-icon">
                                            <svc.icon size={24} />
                                        </div>
                                        <div className="dash-service-info">
                                            <span className="dash-service-name">{svc.name}</span>
                                            <div className="dash-service-stats">
                                                <span className="dash-service-pending">{svc.pending} pending</span>
                                                <span className="dash-service-completed">{svc.completed} completed</span>
                                            </div>
                                        </div>
                                        <span className="dash-service-arrow">→</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="dash-section dash-section--wide">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">RECENT BOOKINGS</h2>
                                <button className="dash-link-btn" onClick={() => navigate('/view-bookings')}>View All</button>
                            </div>
                            <div className="dash-table-wrapper">
                                <table className="dash-table">
                                    <thead>
                                        <tr>
                                            <th>CLIENT</th>
                                            <th>PACKAGE</th>
                                            <th>DATE</th>
                                            <th>AMOUNT</th>
                                            <th>STATUS</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentBookings.map((b) => (
                                            <tr key={b.id}>
                                                <td><span className="dash-client">{b.client}</span></td>
                                                <td>{b.package}</td>
                                                <td>{b.date}</td>
                                                <td><span className="dash-amount">{b.amount}</span></td>
                                                <td><span className={`dash-status dash-status--${b.status.toLowerCase()}`}>{b.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className="dash-section">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">TOP PACKAGES</h2>
                                <TrendingUp size={18} className="dash-section-icon" />
                            </div>
                            <div className="dash-packages-list">
                                {topPackages.map((pkg, i) => (
                                    <div key={i} className="dash-package-item">
                                        <div className="dash-package-rank">{i + 1}</div>
                                        <div className="dash-package-info">
                                            <span className="dash-package-name">{pkg.name}</span>
                                            <span className="dash-package-stats">{pkg.bookings} bookings • {pkg.revenue}</span>
                                        </div>
                                        <span className="dash-package-trend">{pkg.trend}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="dash-section">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">RECENT INQUIRIES</h2>
                                <button className="dash-link-btn" onClick={() => navigate('/view-inquiries')}>View All</button>
                            </div>
                            <div className="dash-inquiries-list">
                                {recentInquiries.map((inq) => (
                                    <div key={inq.id} className="dash-inquiry-item">
                                        <div className="dash-inquiry-avatar">{inq.name.charAt(0)}</div>
                                        <div className="dash-inquiry-info">
                                            <span className="dash-inquiry-name">{inq.name}</span>
                                            <span className="dash-inquiry-subject">{inq.subject}</span>
                                        </div>
                                        <div className="dash-inquiry-meta">
                                            <span className={`dash-inquiry-status dash-inquiry-status--${inq.status.toLowerCase()}`}>{inq.status}</span>
                                            <span className="dash-inquiry-time">{inq.time}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="dash-section">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">QUICK ACTIONS</h2>
                            </div>
                            <div className="dash-quick-actions">
                                <button className="dash-action-card" onClick={() => navigate('/add-package')}>
                                    <Package size={20} />
                                    <span>Add Package</span>
                                </button>
                                <button className="dash-action-card" onClick={() => navigate('/add-promo')}>
                                    <span className="dash-action-emoji">🏷️</span>
                                    <span>Create Promo</span>
                                </button>
                                <button className="dash-action-card" onClick={() => navigate('/add-testimonial')}>
                                    <Users size={20} />
                                    <span>Add Testimonial</span>
                                </button>
                                <button className="dash-action-card" onClick={() => navigate('/view-packages')}>
                                    <MapPin size={20} />
                                    <span>View Packages</span>
                                </button>
                            </div>
                        </section>
                    </div>

                    <div className="dash-footer-stats">
                        <div className="dash-footer-stat">
                            <Calendar size={20} />
                            <div>
                                <strong>15</strong>
                                <span>Upcoming Tours</span>
                            </div>
                        </div>
                        <div className="dash-footer-stat">
                            <Users size={20} />
                            <div>
                                <strong>342</strong>
                                <span>Total Customers</span>
                            </div>
                        </div>
                        <div className="dash-footer-stat">
                            <MapPin size={20} />
                            <div>
                                <strong>12</strong>
                                <span>Destinations</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;