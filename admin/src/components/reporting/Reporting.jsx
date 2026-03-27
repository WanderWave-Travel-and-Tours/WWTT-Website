import React, { useState, useEffect, useMemo, useRef } from 'react';
import Sidebar from '../sidebar/sidebar.jsx';
import {
  BarChart2,
  Globe,
  Facebook,
  Instagram,
  ArrowUpRight,
  ArrowDownRight,
  MousePointerClick,
  Download,
  ChevronDown,
  Clock,
  Calendar,
  TrendingUp,
  SlidersHorizontal,
  CalendarDays,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { exportReportingToPDF } from './utils/reportingPdfExport';
import './Reporting.css';

// ─── CHART DATA (social media — replace with real API when ready) ──────────────

const MONTHLY_REACH = [
  { month: 'Jan', Facebook: 12400, Instagram: 9800,  TikTok: 15200 },
  { month: 'Feb', Facebook: 14100, Instagram: 11500, TikTok: 18400 },
  { month: 'Mar', Facebook: 13200, Instagram: 12200, TikTok: 22100 },
  { month: 'Apr', Facebook: 15800, Instagram: 14000, TikTok: 26500 },
  { month: 'May', Facebook: 17200, Instagram: 15600, TikTok: 31200 },
  { month: 'Jun', Facebook: 16400, Instagram: 13900, TikTok: 28900 },
  { month: 'Jul', Facebook: 19100, Instagram: 17200, TikTok: 35400 },
];

const MONTHLY_ENGAGEMENT = [
  { month: 'Jan', Facebook: 3200,  Instagram: 5100,  TikTok: 8400  },
  { month: 'Feb', Facebook: 3900,  Instagram: 6200,  TikTok: 9800  },
  { month: 'Mar', Facebook: 3600,  Instagram: 6800,  TikTok: 12200 },
  { month: 'Apr', Facebook: 4500,  Instagram: 7400,  TikTok: 14500 },
  { month: 'May', Facebook: 5100,  Instagram: 8200,  TikTok: 17100 },
  { month: 'Jun', Facebook: 4800,  Instagram: 7600,  TikTok: 15800 },
  { month: 'Jul', Facebook: 5600,  Instagram: 9100,  TikTok: 19400 },
];

const MONTHLY_FOLLOWERS = [
  { month: 'Jan', Facebook: 4200,  Instagram: 3100,  TikTok: 6500  },
  { month: 'Feb', Facebook: 4600,  Instagram: 3800,  TikTok: 8200  },
  { month: 'Mar', Facebook: 5100,  Instagram: 4200,  TikTok: 10400 },
  { month: 'Apr', Facebook: 5800,  Instagram: 5000,  TikTok: 13600 },
  { month: 'May', Facebook: 6400,  Instagram: 5700,  TikTok: 16900 },
  { month: 'Jun', Facebook: 6900,  Instagram: 6100,  TikTok: 19200 },
  { month: 'Jul', Facebook: 7800,  Instagram: 7000,  TikTok: 23100 },
];

const STAT_IMAGES = {
  websiteVisits:   'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
  facebook:        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80',
  instagram:       'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
  tiktok:          'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=600&q=80',
  pageToBooking:   'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&q=80',
};

// Mock referral data — replace with real social analytics API
const SOCIAL_MOCK = {
  facebook:  { value: '8.9K',  change: '+15.4%', positive: true  },
  instagram: { value: '6.7K',  change: '+9.8%',  positive: true  },
  tiktok:    { value: '5.2K',  change: '-2.1%',  positive: false },
};

const PLATFORM_SUMMARY = [
  {
    platform:   'Facebook',
    icon:       Facebook,
    color:      '#1877F2',
    bg:         '#e7f0fd',
    followers:  '7,800',
    reach:      '19,100',
    engagement: '5,600',
    rate:       '6.2%',
  },
  {
    platform:   'Instagram',
    icon:       Instagram,
    color:      '#E1306C',
    bg:         '#fde8ef',
    followers:  '7,000',
    reach:      '17,200',
    engagement: '9,100',
    rate:       '10.4%',
  },
  {
    platform:   'TikTok',
    icon:       null,
    color:      '#010101',
    bg:         '#f0f0f0',
    followers:  '23,100',
    reach:      '35,400',
    engagement: '19,400',
    rate:       '9.8%',
  },
];

const CHART_TABS = [
  { key: 'reach',      label: 'Reach'      },
  { key: 'engagement', label: 'Engagement' },
  { key: 'followers',  label: 'Followers'  },
];

const PERIOD_TABS = [
  { key: 'daily',   label: 'Daily',        Icon: Clock,             hasChevron: true  },
  { key: 'weekly',  label: 'Weekly',       Icon: Calendar,          hasChevron: false },
  { key: 'monthly', label: 'Monthly',      Icon: CalendarDays,      hasChevron: true  },
  { key: 'trend',   label: 'Trend (6 Mo)', Icon: TrendingUp,        hasChevron: false },
  { key: 'custom',  label: 'Custom Range', Icon: SlidersHorizontal, hasChevron: true  },
];

// ─── TIKTOK ICON ──────────────────────────────────────────────────────────────
const TikTokIcon = ({ size = 20, color = '#010101' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z"/>
  </svg>
);

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rp-tooltip">
        <p className="rp-tooltip-label">{label}</p>
        {payload.map((entry) => (
          <p key={entry.name} className="rp-tooltip-item">
            <span className="rp-tooltip-dot" style={{ background: entry.color }} />
            {entry.name}: <strong>{entry.value.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── FORMAT HELPER ────────────────────────────────────────────────────────────
const formatCount = (n) => {
  if (n === null || n === undefined) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const Reporting = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePeriod, setActivePeriod] = useState('weekly');
  const [activeChart, setActiveChart]   = useState('reach');

  // ── Dropdown visibility ───────────────────────────────────────────────────
  const [isDailyOpen,   setIsDailyOpen]   = useState(false);
  const [isMonthlyOpen, setIsMonthlyOpen] = useState(false);
  const [isCustomOpen,  setIsCustomOpen]  = useState(false);

  const [selectedDailyDate, setSelectedDailyDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  const dailyRef   = useRef(null);
  const monthlyRef = useRef(null);
  const customRef  = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dailyRef.current   && !dailyRef.current.contains(e.target))   setIsDailyOpen(false);
      if (monthlyRef.current && !monthlyRef.current.contains(e.target)) setIsMonthlyOpen(false);
      if (customRef.current  && !customRef.current.contains(e.target))  setIsCustomOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Page View API state ───────────────────────────────────────────────────
  const [pageViewStats, setPageViewStats] = useState({
    recentViews:         [],
    totalViews:          0,
    packagesPageViews:   0,
    bookingPageViews:    0,
    flightsPageViews:    0,
    servicesPageViews:   0,
    topViewedPackages:   [],
  });
  // ── Active bookings — sourced directly from the Booking model ──────────
  // recentActiveBookings mirrors exactly what the admin sees in the Bookings
  // table (isArchive !== 'Yes'), so the count is always the ground truth.
  const [recentActiveBookings, setRecentActiveBookings] = useState([]);
  const [pvLoading, setPvLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pvRes, bookRes] = await Promise.all([
          fetch('/api/page-views/stats'),
          fetch('/api/bookings/active'),
        ]);
        const [pvJson, bookJson] = await Promise.all([pvRes.json(), bookRes.json()]);

        if (pvJson.status === 'ok') {
          const d = pvJson.data;
          setPageViewStats({
            recentViews:       d.recentViews      || [],
            totalViews:        d.totalViews        || 0,
            packagesPageViews: d.packagesPageViews || 0,
            bookingPageViews:  d.bookingPageViews  || 0,
            flightsPageViews:  d.flightsPageViews  || 0,
            servicesPageViews: d.servicesPageViews || 0,
            topViewedPackages: d.topViewedPackages || [],
          });
        }

        if (bookJson.success) {
          setRecentActiveBookings(bookJson.bookings || []);
        }
      } catch (err) {
        console.error('Failed to fetch reporting stats:', err);
      } finally {
        setPvLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ── Date window — mirrors RevenueAnalytics logic exactly ─────────────────
  const analyticsDateWindow = useMemo(() => {
    const now = new Date();
    if (activePeriod === 'daily') {
      const start = new Date(selectedDailyDate); start.setHours(0,  0,  0,  0);
      const end   = new Date(selectedDailyDate); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (activePeriod === 'weekly') {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (activePeriod === 'monthly') {
      const [year, month] = selectedMonth.split('-');
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end   = new Date(year, month,     0, 23, 59, 59, 999);
      return { start, end };
    }
    if (activePeriod === 'trend') {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (activePeriod === 'custom' && customDates.start && customDates.end) {
      const start = new Date(customDates.start); start.setHours(0,  0,  0,  0);
      const end   = new Date(customDates.end);   end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    return { start: new Date(0), end: new Date() };
  }, [activePeriod, selectedDailyDate, selectedMonth, customDates]);

  // ── Filtered page view stats (same logic as RevenueAnalytics) ────────────
  const filteredPageViewStats = useMemo(() => {
    const allViews = pageViewStats.recentViews || [];
    const { start, end } = analyticsDateWindow;

    const filtered = allViews.filter(v => {
      const d = new Date(v.createdAt);
      return d >= start && d <= end;
    });

    return {
      totalViews:        filtered.length,
      packagesPageViews: filtered.filter(v => v.page === 'packages').length,
      bookingPageViews:  filtered.filter(v => v.page === 'booking').length,
      flightsPageViews:  filtered.filter(v => v.page === 'flights').length,
      servicesPageViews: filtered.filter(v => v.page === 'services').length,
    };
  }, [analyticsDateWindow, pageViewStats.recentViews]);

  // Filtered booking counts — sourced from actual Booking records.
  // recentActiveBookings comes from /api/bookings/active (isArchive !== 'Yes'),
  // so this always matches exactly what the admin sees in the Bookings table.
  const filteredBookingCounts = useMemo(() => {
    const { start, end } = analyticsDateWindow;

    const filtered = recentActiveBookings.filter(b => {
      const d = new Date(b.createdAt);
      return d >= start && d <= end;
    });

    return { totalConfirmedBookings: filtered.length };
  }, [recentActiveBookings, analyticsDateWindow]);

  // ── View-to-Book rate ─────────────────────────────────────────────────────
  const viewToBookRate = useMemo(() => {
    const { bookingPageViews } = filteredPageViewStats;
    const { totalConfirmedBookings } = filteredBookingCounts;
    if (!bookingPageViews) return '0.0';
    return ((totalConfirmedBookings / bookingPageViews) * 100).toFixed(1);
  }, [filteredPageViewStats, filteredBookingCounts]);

  // ── Quick stats built from live data ─────────────────────────────────────
  const quickStats = [
    {
      label:    'Website Visits',
      value:    pvLoading ? '…' : formatCount(filteredPageViewStats.totalViews),
      change:   null,
      positive: true,
      icon:     Globe,
      image:    STAT_IMAGES.websiteVisits,
      sub:      pvLoading ? 'Loading…' : `${filteredPageViewStats.totalViews.toLocaleString()} total views`,
    },
    {
      label:    'Facebook → Website',
      value:    SOCIAL_MOCK.facebook.value,
      change:   SOCIAL_MOCK.facebook.change,
      positive: SOCIAL_MOCK.facebook.positive,
      icon:     Facebook,
      image:    STAT_IMAGES.facebook,
    },
    {
      label:    'Instagram → Website',
      value:    SOCIAL_MOCK.instagram.value,
      change:   SOCIAL_MOCK.instagram.change,
      positive: SOCIAL_MOCK.instagram.positive,
      icon:     Instagram,
      image:    STAT_IMAGES.instagram,
    },
    {
      label:    'TikTok → Website',
      value:    SOCIAL_MOCK.tiktok.value,
      change:   SOCIAL_MOCK.tiktok.change,
      positive: SOCIAL_MOCK.tiktok.positive,
      icon:     null,
      image:    STAT_IMAGES.tiktok,
    },
    {
      label:    'Page Views → Booking',
      value:    pvLoading ? '…' : `${viewToBookRate}%`,
      change:   null,
      positive: true,
      icon:     MousePointerClick,
      image:    STAT_IMAGES.pageToBooking,
      sub:      pvLoading
        ? 'Loading…'
        : `${filteredBookingCounts.totalConfirmedBookings} Booked out of ${filteredPageViewStats.bookingPageViews} Booking Page Views`,
    },
  ];

  const toggleSidebar = () => setIsCollapsed(prev => !prev);
  const sidebarWidth  = isCollapsed ? 88 : 280;

  const getChartData = () => {
    const count  = activePeriod === 'daily'   ? 3
                 : activePeriod === 'trend'   ? 6
                 : 7;
    const source = activeChart === 'engagement' ? MONTHLY_ENGAGEMENT
                 : activeChart === 'followers'  ? MONTHLY_FOLLOWERS
                 : MONTHLY_REACH;
    return source.slice(-count);
  };

  // ── Period label (for PDF header & badge) ────────────────────────────────
  const periodLabel = useMemo(() => {
    if (activePeriod === 'daily') {
      const d = new Date(selectedDailyDate + 'T00:00:00');
      return 'Daily: ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (activePeriod === 'weekly') {
      const now   = new Date();
      const start = new Date(now); start.setDate(start.getDate() - 6);
      const fmt   = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `Weekly: ${fmt(start)} – ${fmt(now)}`;
    }
    if (activePeriod === 'monthly') {
      const [year, month] = selectedMonth.split('-');
      const d = new Date(year, month - 1, 1);
      return 'Monthly: ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (activePeriod === 'trend') {
      return 'Trend: Last 6 Months';
    }
    if (activePeriod === 'custom' && customDates.start && customDates.end) {
      const fmt = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `Custom: ${fmt(customDates.start)} – ${fmt(customDates.end)}`;
    }
    return 'All Time';
  }, [activePeriod, selectedDailyDate, selectedMonth, customDates]);

  // ── PDF Export ────────────────────────────────────────────────────────────
  const handleExportPDF = () => {
    exportReportingToPDF({
      quickStats,
      platformSummary:      PLATFORM_SUMMARY,
      chartData:            getChartData(),
      activeChart,
      filteredPageViewStats,
      filteredBookingCounts,
      viewToBookRate,
      activePeriod,
      periodLabel,
    });
  };

  return (
    <div className="rp-layout">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main className="rp-main" style={{ marginLeft: sidebarWidth }}>

        {/* ── PAGE HEADER ── */}
        <div className="rp-page-header">
          <div className="rp-page-header-left">
            <h1 className="rp-page-title">SOCIAL MEDIA REPORTING</h1>
            <p className="rp-page-subtitle">Facebook · Instagram · TikTok performance overview</p>
          </div>
          <div className="rp-page-header-right">
            <button className="rp-all-sections-btn">
              <BarChart2 size={16} />
              All Platforms
              <ChevronDown size={15} />
            </button>
            <button
              className="rp-icon-btn"
              title={`Download ${periodLabel} report`}
              onClick={handleExportPDF}
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* ── QUICK STATS ── */}
        <section className="rp-section">
          <h2 className="rp-section-title">Quick Stats <span className="rp-badge">This Month</span></h2>
          <div className="rp-stats-grid">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  className="rp-stat-card"
                  key={stat.label}
                  style={{ backgroundImage: `url(${stat.image})` }}
                >
                  <div className="rp-stat-card-overlay" />
                  <div className="rp-stat-card-top">
                    <div className="rp-stat-icon-wrap">
                      {stat.icon === null
                        ? <TikTokIcon size={15} color="#fff" />
                        : <Icon size={15} color="#fff" />}
                    </div>
                    <span className="rp-stat-label">{stat.label}</span>
                  </div>
                  <div className="rp-stat-card-bottom">
                    <div>
                      <p className="rp-stat-value">{stat.value}</p>
                      {stat.sub && <p className="rp-stat-sub">{stat.sub}</p>}
                    </div>
                    {stat.change && (
                      <div className={`rp-stat-change ${stat.positive ? 'positive' : 'negative'}`}>
                        {stat.positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {stat.change}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── PLATFORM SUMMARY ── */}
        <section className="rp-section">
          <h2 className="rp-section-title">Platform Summary</h2>
          <div className="rp-platform-grid">
            {PLATFORM_SUMMARY.map((p) => {
              const Icon = p.icon;
              return (
                <div className="rp-platform-card" key={p.platform}>
                  <div className="rp-platform-header" style={{ borderLeftColor: p.color }}>
                    <div className="rp-platform-icon-wrap" style={{ background: p.bg }}>
                      {p.platform === 'TikTok'
                        ? <TikTokIcon size={20} color={p.color} />
                        : <Icon size={20} color={p.color} />}
                    </div>
                    <span className="rp-platform-name" style={{ color: p.color }}>{p.platform}</span>
                  </div>
                  <div className="rp-platform-metrics">
                    <div className="rp-metric">
                      <span className="rp-metric-label">Followers</span>
                      <span className="rp-metric-value">{p.followers}</span>
                    </div>
                    <div className="rp-metric">
                      <span className="rp-metric-label">Reach</span>
                      <span className="rp-metric-value">{p.reach}</span>
                    </div>
                    <div className="rp-metric">
                      <span className="rp-metric-label">Engagement</span>
                      <span className="rp-metric-value">{p.engagement}</span>
                    </div>
                    <div className="rp-metric">
                      <span className="rp-metric-label">Eng. Rate</span>
                      <span className="rp-metric-value" style={{ color: p.color }}>{p.rate}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── BAR CHARTS ── */}
        <section className="rp-section">

          <div className="rp-chart-controls">
            {/* Left: Reach / Engagement / Followers */}
            <div className="rp-chart-tabs">
              {CHART_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`rp-chart-tab ${activeChart === tab.key ? 'active' : ''}`}
                  onClick={() => setActiveChart(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right: Period bar with dropdowns */}
            <div className="rp-period-bar">

              {/* Daily — with date picker dropdown */}
              <div className="rp-period-dropdown" ref={dailyRef}>
                <button
                  className={`rp-period-btn ${activePeriod === 'daily' ? 'active' : ''}`}
                  onClick={() => { setIsDailyOpen(o => !o); setIsMonthlyOpen(false); setIsCustomOpen(false); }}
                >
                  <Clock size={14} />
                  Daily
                  <ChevronDown size={13} className={isDailyOpen ? 'rp-chevron-open' : ''} />
                </button>
                {isDailyOpen && (
                  <div className="rp-period-menu">
                    <p className="rp-period-menu-title">Select Date</p>
                    <input
                      type="date"
                      className="rp-period-date-input"
                      value={selectedDailyDate}
                      onChange={e => setSelectedDailyDate(e.target.value)}
                    />
                    <button className="rp-period-apply" onClick={() => { setActivePeriod('daily'); setIsDailyOpen(false); }}>
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Weekly */}
              <button
                className={`rp-period-btn ${activePeriod === 'weekly' ? 'active' : ''}`}
                onClick={() => setActivePeriod('weekly')}
              >
                <Calendar size={14} />
                Weekly
              </button>

              {/* Monthly — with month picker dropdown */}
              <div className="rp-period-dropdown" ref={monthlyRef}>
                <button
                  className={`rp-period-btn ${activePeriod === 'monthly' ? 'active' : ''}`}
                  onClick={() => { setIsMonthlyOpen(o => !o); setIsDailyOpen(false); setIsCustomOpen(false); }}
                >
                  <CalendarDays size={14} />
                  Monthly
                  <ChevronDown size={13} className={isMonthlyOpen ? 'rp-chevron-open' : ''} />
                </button>
                {isMonthlyOpen && (
                  <div className="rp-period-menu">
                    <p className="rp-period-menu-title">Select Month</p>
                    <input
                      type="month"
                      className="rp-period-date-input"
                      value={selectedMonth}
                      max={new Date().toISOString().slice(0, 7)}
                      onChange={e => setSelectedMonth(e.target.value)}
                    />
                    <button className="rp-period-apply" onClick={() => { setActivePeriod('monthly'); setIsMonthlyOpen(false); }}>
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {/* Trend (6 Mo) */}
              <button
                className={`rp-period-btn ${activePeriod === 'trend' ? 'active' : ''}`}
                onClick={() => setActivePeriod('trend')}
              >
                <TrendingUp size={14} />
                Trend (6 Mo)
              </button>

              {/* Custom Range — with date range dropdown */}
              <div className="rp-period-dropdown" ref={customRef}>
                <button
                  className={`rp-period-btn ${activePeriod === 'custom' ? 'active' : ''}`}
                  onClick={() => { setIsCustomOpen(o => !o); setIsDailyOpen(false); setIsMonthlyOpen(false); }}
                >
                  <SlidersHorizontal size={14} />
                  Custom Range
                  <ChevronDown size={13} className={isCustomOpen ? 'rp-chevron-open' : ''} />
                </button>
                {isCustomOpen && (
                  <div className="rp-period-menu rp-period-menu--wide">
                    <p className="rp-period-menu-title">Date Range</p>
                    <div className="rp-period-range-row">
                      <div className="rp-period-range-field">
                        <label>From</label>
                        <input
                          type="date"
                          className="rp-period-date-input"
                          value={customDates.start}
                          onChange={e => setCustomDates(d => ({ ...d, start: e.target.value }))}
                        />
                      </div>
                      <div className="rp-period-range-field">
                        <label>To</label>
                        <input
                          type="date"
                          className="rp-period-date-input"
                          value={customDates.end}
                          onChange={e => setCustomDates(d => ({ ...d, end: e.target.value }))}
                        />
                      </div>
                    </div>
                    <button
                      className="rp-period-apply"
                      onClick={() => {
                        if (customDates.start && customDates.end) {
                          setActivePeriod('custom');
                          setIsCustomOpen(false);
                        } else {
                          alert('Please select both start and end dates.');
                        }
                      }}
                    >
                      Apply Range
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Facebook Chart */}
          <div className="rp-chart-card">
            <div className="rp-chart-card-header">
              <div className="rp-chart-platform-badge" style={{ background: '#e7f0fd' }}>
                <Facebook size={16} color="#1877F2" />
                <span style={{ color: '#1877F2' }}>Facebook</span>
              </div>
              <p className="rp-chart-card-subtitle">Monthly {activeChart} performance</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={getChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280', fontFamily: "'Plus Jakarta Sans', sans-serif" }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Facebook" fill="#1877F2" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Instagram Chart */}
          <div className="rp-chart-card">
            <div className="rp-chart-card-header">
              <div className="rp-chart-platform-badge" style={{ background: '#fde8ef' }}>
                <Instagram size={16} color="#E1306C" />
                <span style={{ color: '#E1306C' }}>Instagram</span>
              </div>
              <p className="rp-chart-card-subtitle">Monthly {activeChart} performance</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={getChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280', fontFamily: "'Plus Jakarta Sans', sans-serif" }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Instagram" fill="#E1306C" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* TikTok Chart */}
          <div className="rp-chart-card">
            <div className="rp-chart-card-header">
              <div className="rp-chart-platform-badge" style={{ background: '#f0f0f0' }}>
                <TikTokIcon size={16} color="#010101" />
                <span style={{ color: '#010101' }}>TikTok</span>
              </div>
              <p className="rp-chart-card-subtitle">Monthly {activeChart} performance</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={getChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280', fontFamily: "'Plus Jakarta Sans', sans-serif" }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="TikTok" fill="#010101" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Combined Chart */}
          <div className="rp-chart-card rp-chart-card--combined">
            <div className="rp-chart-card-header">
              <div className="rp-chart-platform-badge" style={{ background: '#f3f4f6' }}>
                <BarChart2 size={16} color="#001F3F" />
                <span style={{ color: '#001F3F' }}>All Platforms Combined</span>
              </div>
              <p className="rp-chart-card-subtitle">Side-by-side comparison</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280', fontFamily: "'Plus Jakarta Sans', sans-serif" }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px', fontFamily: "'Plus Jakarta Sans', sans-serif" }} />
                <Bar dataKey="Facebook"  fill="#1877F2" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Instagram" fill="#E1306C" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="TikTok"    fill="#010101" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </section>
      </main>
    </div>
  );
};

export default Reporting;