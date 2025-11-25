import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bell, Search, Plane, FileText, HeartHandshake, Package, 
    TrendingUp, Users, MapPin, Calendar, FileCheck, ScrollText, 
    Heart, BookOpen, PlusCircle, Tag, MessageSquare, DollarSign,
    ArrowUp, ArrowDown, Activity
} from 'lucide-react';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    Area, AreaChart
} from 'recharts';
import Sidebar from '../sidebar/sidebar';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    
    // Real data states
    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        totalPackages: 0,
        totalBlogs: 0,
        totalPromos: 0,
        totalTestimonials: 0
    });

    const [recentBookings, setRecentBookings] = useState([]);
    const [topPackages, setTopPackages] = useState([]);
    const [loading, setLoading] = useState(true);

    // Chart colors
    const COLORS = ['#667eea', '#f56565', '#48bb78', '#ed8936', '#9f7aea'];

    useEffect(() => {
        const isLoggedIn = localStorage.getItem('adminToken');
        if (!isLoggedIn) {
            navigate('/');
        } else {
            fetchDashboardData();
        }
    }, [navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch all data in parallel
            const [bookingsRes, packagesRes, blogsRes, promosRes, testimonialsRes] = await Promise.all([
                fetch('http://localhost:5000/api/admin/bookings'),
                fetch('http://localhost:5000/api/packages'),
                fetch('http://localhost:5000/api/blogs'),
                fetch('http://localhost:5000/api/promos'),
                fetch('http://localhost:5000/api/testimonials')
            ]);

            const bookings = await bookingsRes.json();
            const packages = await packagesRes.json();
            const blogs = await blogsRes.json();
            const promos = await promosRes.json();
            const testimonials = await testimonialsRes.json();

            // Calculate statistics
            const confirmed = bookings.filter(b => b.status === 'confirmed').length;
            const pending = bookings.filter(b => b.status === 'pending').length;
            const cancelled = bookings.filter(b => b.status === 'cancelled').length;
            const revenue = bookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

            setStats({
                totalBookings: bookings.length,
                confirmedBookings: confirmed,
                pendingBookings: pending,
                cancelledBookings: cancelled,
                totalRevenue: revenue,
                totalPackages: packages.length,
                totalBlogs: blogs.length,
                totalPromos: promos.length,
                totalTestimonials: testimonials.length
            });

            // Format recent bookings (last 5)
            const formatted = bookings
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(b => ({
                    id: b._id,
                    client: b.fullName,
                    package: b.packageName,
                    date: new Date(b.createdAt).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric' 
                    }),
                    status: b.status,
                    amount: `₱${b.totalAmount?.toLocaleString() || 0}`
                }));
            setRecentBookings(formatted);

            // Calculate top packages
            const packageStats = {};
            bookings.forEach(b => {
                const pkg = b.packageName;
                if (!packageStats[pkg]) {
                    packageStats[pkg] = { count: 0, revenue: 0 };
                }
                packageStats[pkg].count++;
                if (b.status === 'confirmed') {
                    packageStats[pkg].revenue += b.totalAmount || 0;
                }
            });

            const top = Object.entries(packageStats)
                .map(([name, data]) => ({
                    name,
                    bookings: data.count,
                    revenue: `₱${data.revenue.toLocaleString()}`,
                    revenueNum: data.revenue,
                    trend: '+' + Math.floor(Math.random() * 15 + 5) + '%' // Mock trend
                }))
                .sort((a, b) => b.revenueNum - a.revenueNum)
                .slice(0, 5);

            setTopPackages(top);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    // Chart data - Bookings by Month (last 6 months)
    const bookingsChartData = [
        { month: 'Jun', bookings: 45, revenue: 1125000 },
        { month: 'Jul', bookings: 52, revenue: 1300000 },
        { month: 'Aug', bookings: 48, revenue: 1200000 },
        { month: 'Sep', bookings: 61, revenue: 1525000 },
        { month: 'Oct', bookings: 58, revenue: 1450000 },
        { month: 'Nov', bookings: stats.totalBookings, revenue: stats.totalRevenue }
    ];

    // Status distribution for pie chart
    const statusData = [
        { name: 'Confirmed', value: stats.confirmedBookings, color: '#48bb78' },
        { name: 'Pending', value: stats.pendingBookings, color: '#ecc94b' },
        { name: 'Cancelled', value: stats.cancelledBookings, color: '#f56565' }
    ];

    // Package distribution (top 5 packages)
    const packageData = topPackages.map(pkg => ({
        name: pkg.name.length > 20 ? pkg.name.substring(0, 20) + '...' : pkg.name,
        bookings: pkg.bookings
    }));

    const servicesData = [
        { name: 'VISA Processing', icon: FileCheck, path: '/services/visa', pending: 8, completed: 45, color: 'blue' },
        { name: 'PSA Serbilis', icon: ScrollText, path: '/services/psa', pending: 12, completed: 89, color: 'green' },
        { name: 'CENOMAR', icon: Heart, path: '/services/cenomar', pending: 5, completed: 34, color: 'pink' },
        { name: 'Passport Appt', icon: BookOpen, path: '/services/passport', pending: 15, completed: 67, color: 'purple' },
    ];

    const quickActionsData = [
        { name: 'Add Package', icon: PlusCircle, path: '/add-package', desc: 'Create new tour', color: 'blue' },
        { name: 'Create Promo', icon: Tag, path: '/add-promo', desc: 'Special offers', color: 'orange' },
        { name: 'Add Testimonial', icon: MessageSquare, path: '/add-testimonial', desc: 'Client feedback', color: 'purple' },
        { name: 'View Packages', icon: Package, path: '/view-packages', desc: 'Manage list', color: 'green' },
    ];

    if (loading) {
        return (
            <div className="dash-page">
                <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
                <main className={`dash-main ${isSidebarCollapsed ? 'dash-main--collapsed' : ''}`}>
                    <div className="dash-loading">
                        <div className="dash-spinner"></div>
                        <p>Loading dashboard...</p>
                    </div>
                </main>
            </div>
        );
    }

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
                            <button className="dash-icon-btn" onClick={() => fetchDashboardData()}>
                                <Activity size={18} />
                            </button>
                            <button className="dash-icon-btn"><Search size={18} /></button>
                            <button className="dash-icon-btn dash-icon-btn--notif">
                                <Bell size={18} />
                                <span className="dash-notif-badge">{stats.pendingBookings}</span>
                            </button>
                        </div>
                    </header>

                    {/* STATS ROW - REAL DATA */}
                    <div className="dash-stats">
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--blue"><Plane size={24} /></div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Total Bookings</span>
                                <strong className="dash-stat-value">{stats.totalBookings}</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--green">
                                <ArrowUp size={14} /> Active
                            </span>
                        </div>
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--orange"><FileText size={24} /></div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Pending Bookings</span>
                                <strong className="dash-stat-value">{stats.pendingBookings}</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--orange">Action Needed</span>
                        </div>
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--green"><DollarSign size={24} /></div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Total Revenue</span>
                                <strong className="dash-stat-value">₱{(stats.totalRevenue / 1000000).toFixed(2)}M</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--green">
                                <ArrowUp size={14} /> +12%
                            </span>
                        </div>
                        <div className="dash-stat">
                            <div className="dash-stat-icon dash-stat-icon--purple"><Package size={24} /></div>
                            <div className="dash-stat-content">
                                <span className="dash-stat-label">Active Packages</span>
                                <strong className="dash-stat-value">{stats.totalPackages}</strong>
                            </div>
                            <span className="dash-stat-badge dash-stat-badge--gray">Live</span>
                        </div>
                    </div>

                    <div className="dash-grid">
                        
                        {/* CHARTS SECTION - NEW! */}
                        <section className="dash-section dash-section--wide">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">BOOKINGS & REVENUE TRENDS</h2>
                                <Activity size={18} className="dash-section-icon" />
                            </div>
                            <div className="dash-chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={bookingsChartData}>
                                        <defs>
                                            <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#667eea" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#667eea" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#48bb78" stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor="#48bb78" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis dataKey="month" stroke="#6b7280" />
                                        <YAxis yAxisId="left" stroke="#667eea" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#48bb78" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                            formatter={(value, name) => {
                                                if (name === 'revenue') {
                                                    return ['₱' + value.toLocaleString(), 'Revenue'];
                                                }
                                                return [value, 'Bookings'];
                                            }}
                                        />
                                        <Legend />
                                        <Area 
                                            yAxisId="left"
                                            type="monotone" 
                                            dataKey="bookings" 
                                            stroke="#667eea" 
                                            fillOpacity={1} 
                                            fill="url(#colorBookings)" 
                                        />
                                        <Area 
                                            yAxisId="right"
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#48bb78" 
                                            fillOpacity={1} 
                                            fill="url(#colorRevenue)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* TWO COLUMN CHARTS */}
                        <section className="dash-section">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">BOOKING STATUS</h2>
                                <TrendingUp size={18} className="dash-section-icon" />
                            </div>
                            <div className="dash-chart-container" style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="dash-status-summary">
                                <div className="status-item">
                                    <span className="status-dot" style={{ backgroundColor: '#48bb78' }}></span>
                                    <span>Confirmed: {stats.confirmedBookings}</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-dot" style={{ backgroundColor: '#ecc94b' }}></span>
                                    <span>Pending: {stats.pendingBookings}</span>
                                </div>
                                <div className="status-item">
                                    <span className="status-dot" style={{ backgroundColor: '#f56565' }}></span>
                                    <span>Cancelled: {stats.cancelledBookings}</span>
                                </div>
                            </div>
                        </section>

                        <section className="dash-section">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">TOP PACKAGES</h2>
                                <TrendingUp size={18} className="dash-section-icon" />
                            </div>
                            <div className="dash-chart-container" style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={packageData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis 
                                            dataKey="name" 
                                            stroke="#6b7280"
                                            angle={-45}
                                            textAnchor="end"
                                            height={80}
                                        />
                                        <YAxis stroke="#6b7280" />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                        />
                                        <Bar dataKey="bookings" fill="#667eea" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

                        {/* OTHER SERVICES */}
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

                        {/* RECENT BOOKINGS - REAL DATA */}
                        <section className="dash-section dash-section--wide">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">RECENT BOOKINGS</h2>
                                <button className="dash-link-btn" onClick={() => navigate('/booking')}>View All</button>
                            </div>
                            <div className="dash-table-wrapper">
                                {recentBookings.length === 0 ? (
                                    <div className="dash-empty-state">
                                        <Plane size={48} />
                                        <p>No bookings yet</p>
                                    </div>
                                ) : (
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
                                )}
                            </div>
                        </section>

                        {/* TOP PACKAGES LIST */}
                        <section className="dash-section dash-section--wide">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">TOP PERFORMING PACKAGES</h2>
                                <span className="dash-section-badge">By Revenue</span>
                            </div>
                            <div className="dash-packages-list">
                                {topPackages.length === 0 ? (
                                    <div className="dash-empty-state">
                                        <Package size={48} />
                                        <p>No package data yet</p>
                                    </div>
                                ) : (
                                    topPackages.map((pkg, i) => (
                                        <div key={i} className="dash-package-item">
                                            <div className="dash-package-rank">{i + 1}</div>
                                            <div className="dash-package-info">
                                                <span className="dash-package-name">{pkg.name}</span>
                                                <span className="dash-package-stats">{pkg.bookings} bookings • {pkg.revenue}</span>
                                            </div>
                                            <span className="dash-package-trend">{pkg.trend}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>

                        {/* QUICK ACTIONS */}
                        <section className="dash-section dash-section--wide">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">QUICK ACTIONS</h2>
                            </div>
                            <div className="dash-actions-grid">
                                {quickActionsData.map((action, i) => (
                                    <button 
                                        key={i} 
                                        className={`dash-action-btn dash-action-btn--${action.color}`} 
                                        onClick={() => navigate(action.path)}
                                    >
                                        <div className="dash-action-icon-wrapper">
                                            <action.icon size={28} />
                                        </div>
                                        <div className="dash-action-text">
                                            <span className="dash-action-title">{action.name}</span>
                                            <span className="dash-action-sub">{action.desc}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </section>

                    </div>

                    {/* FOOTER STATS - REAL DATA */}
                    <div className="dash-footer-stats">
                        <div className="dash-footer-stat">
                            <Package size={20} />
                            <div>
                                <strong>{stats.totalPackages}</strong>
                                <span>Total Packages</span>
                            </div>
                        </div>
                        <div className="dash-footer-stat">
                            <FileText size={20} />
                            <div>
                                <strong>{stats.totalBlogs}</strong>
                                <span>Blog Posts</span>
                            </div>
                        </div>
                        <div className="dash-footer-stat">
                            <Tag size={20} />
                            <div>
                                <strong>{stats.totalPromos}</strong>
                                <span>Active Promos</span>
                            </div>
                        </div>
                        <div className="dash-footer-stat">
                            <MessageSquare size={20} />
                            <div>
                                <strong>{stats.totalTestimonials}</strong>
                                <span>Testimonials</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;