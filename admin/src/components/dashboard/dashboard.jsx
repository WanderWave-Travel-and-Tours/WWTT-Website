import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Bell, Search, Plane, FileText, HeartHandshake, Package, 
    TrendingUp, Users, MapPin, Calendar, FileCheck, ScrollText, 
    Heart, BookOpen, PlusCircle, Tag, MessageSquare, DollarSign,
    ArrowUp, ArrowDown, Activity, TrendingDown, Wallet, PiggyBank
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
    const [stats, setStats] = useState({
        totalBookings: 0,
        confirmedBookings: 0,
        pendingBookings: 0,
        cancelledBookings: 0,
        totalRevenue: 0,
        totalPackages: 0,
        totalBlogs: 0,
        totalPromos: 0,
        totalTestimonials: 0,
        totalSellerCost: 0,
        totalMarkup: 0,
        totalSales: 0,
        profitMargin: 0
    });

    const [recentBookings, setRecentBookings] = useState([]);
    const [topPackages, setTopPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trendData, setTrendData] = useState([]);

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
        setLoading(true);
        let bookings = [];
        let packages = [];
        let blogs = [];
        let promos = [];
        let testimonials = [];

        try {
            const bookingsRes = await fetch('http://localhost:5000/api/admin/bookings');
            if (!bookingsRes.ok) throw new Error(`HTTP error! status: ${bookingsRes.status}`);
            bookings = await bookingsRes.json();
            console.log('Fetched bookings:', bookings); 
        } catch (err) {
            console.error('Error fetching bookings:', err);
            bookings = []; 
        }

        try {
            const packagesRes = await fetch('http://localhost:5000/api/packages');
            if (!packagesRes.ok) throw new Error(`HTTP error! status: ${packagesRes.status}`);
            packages = await packagesRes.json();
            console.log('Fetched packages:', packages);
        } catch (err) {
            console.error('Error fetching packages:', err);
            packages = [];
        }

        try {
            const blogsRes = await fetch('http://localhost:5000/api/blogs');
            if (!blogsRes.ok) throw new Error(`HTTP error! status: ${blogsRes.status}`);
            blogs = await blogsRes.json();
            console.log('Fetched blogs:', blogs);
        } catch (err) {
            console.error('Error fetching blogs:', err);
            blogs = [];
        }

        try {
            const promosRes = await fetch('http://localhost:5000/api/promos');
            if (!promosRes.ok) throw new Error(`HTTP error! status: ${promosRes.status}`);
            promos = await promosRes.json();
            console.log('Fetched promos:', promos);
        } catch (err) {
            console.error('Error fetching promos:', err);
            promos = [];
        }

        try {
            const testimonialsRes = await fetch('http://localhost:5000/api/testimonials');
            if (!testimonialsRes.ok) throw new Error(`HTTP error! status: ${testimonialsRes.status}`);
            testimonials = await testimonialsRes.json();
            console.log('Fetched testimonials:', testimonials);
        } catch (err) {
            console.error('Error fetching testimonials:', err);
            testimonials = [];
        }

        try {
            if (!Array.isArray(bookings)) bookings = [];

            const confirmed = bookings.filter(b => b.status === 'confirmed').length;
            const pending = bookings.filter(b => b.status === 'pending').length;
            const cancelled = bookings.filter(b => b.status === 'cancelled').length;
            const revenue = bookings
                .filter(b => b.status === 'confirmed')
                .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

            const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
            const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
            const financialStats = confirmedBookings.reduce((acc, booking) => {
                const pax = (booking.pax?.adult || 1) + (booking.pax?.children || 0) + (booking.pax?.infants || 0);
                if (booking.sellerPrice && booking.markup) {
                    acc.totalSellerCost += booking.sellerPrice * pax;
                    acc.totalMarkup += booking.markup * pax;
                    acc.totalSales += booking.totalAmount || 0;
                }
                return acc;
            }, { totalSellerCost: 0, totalMarkup: 0, totalSales: 0 });

            const profitMargin = financialStats.totalSales > 0 
                ? ((financialStats.totalMarkup / financialStats.totalSales) * 100).toFixed(1)
                : 0;

            setStats({
                totalBookings: bookings.length,
                confirmedBookings: confirmed,
                pendingBookings: pending,
                cancelledBookings: cancelled,
                totalRevenue: revenue,
                totalPackages: Array.isArray(packages) ? packages.length : 0,
                totalBlogs: Array.isArray(blogs) ? blogs.length : 0,
                totalPromos: Array.isArray(promos) ? promos.length : 0,
                totalTestimonials: Array.isArray(testimonials) ? testimonials.length : 0,
                totalSellerCost: financialStats.totalSellerCost,
                totalMarkup: financialStats.totalMarkup,
                totalSales: financialStats.totalSales,
                profitMargin: profitMargin
            });

            const today = new Date();
            const trendData = [];

            for (let i = 5; i >= 0; i--) {
                const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const monthName = date.toLocaleString('default', { month: 'short' });
                const year = date.getFullYear();
                const startOfMonth = new Date(year, date.getMonth(), 1);
                const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

                const confirmedThisMonth = bookings.filter(b => {
                    const created = new Date(b.createdAt);
                    return b.status === 'confirmed' && created >= startOfMonth && created <= endOfMonth;
                });

                const confirmedCount = confirmedThisMonth.length;
                const revenueThisMonth = confirmedThisMonth.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

                trendData.push({
                    month: monthName,
                    bookings: confirmedCount, 
                    revenue: revenueThisMonth
                });
            }

            setTrendData(trendData);

            const formatted = bookings
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map(b => ({
                    id: b._id,
                    client: b.fullName,
                    package: b.packageName,
                    date: new Date(b.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    status: b.status,
                    amount: `₱${(b.totalAmount || 0).toLocaleString()}`
                }));
            setRecentBookings(formatted);

            const packageStats = {};
            bookings.forEach(b => {
                const pkg = b.packageName || 'Unknown';
                if (!packageStats[pkg]) {
                    packageStats[pkg] = { bookings: 0, revenue: 0 };
                }
                packageStats[pkg].bookings += 1;
                packageStats[pkg].revenue += b.totalAmount || 0;
            });

            const sortedPackages = Object.entries(packageStats)
                .sort((a, b) => b[1].revenue - a[1].revenue) 
                .slice(0, 5)
                .map(([name, data]) => ({
                    name,
                    bookings: data.bookings,
                    revenue: `₱${data.revenue.toLocaleString()}`,
                    trend: data.revenue > 0 ? <ArrowUp size={16} color="#10b981" /> : <ArrowDown size={16} color="#ef4444" />
                }));
            setTopPackages(sortedPackages);

        } catch (calcErr) {
            console.error('Error in calculations:', calcErr);
        } finally {
            setLoading(false);
        }
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    const bookingsChartData = [
        { month: 'Jun', bookings: 45, revenue: 1125000 },
        { month: 'Jul', bookings: 52, revenue: 1300000 },
        { month: 'Aug', bookings: 48, revenue: 1200000 },
        { month: 'Sep', bookings: 61, revenue: 1525000 },
        { month: 'Oct', bookings: 58, revenue: 1450000 },
        { month: 'Nov', bookings: stats.totalBookings, revenue: stats.totalRevenue }
    ];

    const statusData = [
        { name: 'Confirmed', value: stats.confirmedBookings, color: '#48bb78' },
        { name: 'Pending', value: stats.pendingBookings, color: '#ecc94b' },
        { name: 'Cancelled', value: stats.cancelledBookings, color: '#f56565' }
    ];

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

                    <section className="dash-section dash-section--wide dash-financial-stats">
                        <div className="dash-section-header">
                            <h2 className="dash-section-title">FINANCIAL OVERVIEW</h2>
                            <span className="dash-section-badge">Confirmed Bookings Only</span>
                        </div>
                        <div className="dash-financial-grid">
                            <div className="dash-financial-card dash-financial-card--cost">
                                <div className="dash-financial-icon">
                                    <Wallet size={28} />
                                </div>
                                <div className="dash-financial-content">
                                    <span className="dash-financial-label">Total Seller Cost</span>
                                    <strong className="dash-financial-value">
                                        ₱{stats.totalSellerCost.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </strong>
                                    <span className="dash-financial-desc">Total cost from suppliers</span>
                                </div>
                            </div>

                            <div className="dash-financial-card dash-financial-card--markup">
                                <div className="dash-financial-icon">
                                    <TrendingUp size={28} />
                                </div>
                                <div className="dash-financial-content">
                                    <span className="dash-financial-label">Total Markup</span>
                                    <strong className="dash-financial-value">
                                        ₱{stats.totalMarkup.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </strong>
                                    <span className="dash-financial-desc">Your profit from bookings</span>
                                </div>
                            </div>

                            <div className="dash-financial-card dash-financial-card--sales">
                                <div className="dash-financial-icon">
                                    <DollarSign size={28} />
                                </div>
                                <div className="dash-financial-content">
                                    <span className="dash-financial-label">Total Sales</span>
                                    <strong className="dash-financial-value">
                                        ₱{stats.totalSales.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        })}
                                    </strong>
                                    <span className="dash-financial-desc">Total revenue generated</span>
                                </div>
                            </div>

                            <div className="dash-financial-card dash-financial-card--margin">
                                <div className="dash-financial-icon">
                                    <PiggyBank size={28} />
                                </div>
                                <div className="dash-financial-content">
                                    <span className="dash-financial-label">Profit Margin</span>
                                    <strong className="dash-financial-value">{stats.profitMargin}%</strong>
                                    <span className="dash-financial-desc">Average markup percentage</span>
                                </div>
                            </div>
                        </div>

                        <div className="dash-financial-breakdown">
                            <div className="dash-breakdown-bar">
                                <div 
                                    className="dash-breakdown-segment dash-breakdown-segment--cost"
                                    style={{ 
                                        width: `${(stats.totalSellerCost / stats.totalSales * 100) || 0}%` 
                                    }}
                                >
                                    <span>Seller Cost</span>
                                </div>
                                <div 
                                    className="dash-breakdown-segment dash-breakdown-segment--profit"
                                    style={{ 
                                        width: `${(stats.totalMarkup / stats.totalSales * 100) || 0}%` 
                                    }}
                                >
                                    <span>Your Profit</span>
                                </div>
                            </div>
                            <div className="dash-breakdown-legend">
                                <div className="dash-breakdown-legend-item">
                                    <span className="dash-legend-dot dash-legend-dot--cost"></span>
                                    <span>Seller Cost: {((stats.totalSellerCost / stats.totalSales * 100) || 0).toFixed(1)}%</span>
                                </div>
                                <div className="dash-breakdown-legend-item">
                                    <span className="dash-legend-dot dash-legend-dot--profit"></span>
                                    <span>Your Profit: {((stats.totalMarkup / stats.totalSales * 100) || 0).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="dash-grid">
                        <section className="dash-section dash-section--wide">
                            <div className="dash-section-header">
                                <h2 className="dash-section-title">BOOKINGS & REVENUE TRENDS</h2>
                                <Activity size={18} className="dash-section-icon" />
                            </div>
                            <div className="dash-chart-container">
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={trendData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="month" stroke="#64748b" />
                                        <YAxis yAxisId="left" stroke="#3b82f6" />
                                        <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                                        <Tooltip formatter={(value) => value.toLocaleString()} />
                                        <Legend />
                                        <Area 
                                            yAxisId="left"
                                            type="monotone" 
                                            dataKey="bookings" 
                                            stroke="#3b82f6" 
                                            fill="#3b82f680" 
                                            name="Bookings"
                                        />
                                        <Area 
                                            yAxisId="right"
                                            type="monotone" 
                                            dataKey="revenue" 
                                            stroke="#10b981" 
                                            fill="#10b98180" 
                                            name="Revenue (₱)"
                                            formatter={(value) => `₱${value.toLocaleString()}`}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </section>

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
                        
                        {/*
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
                        */}

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