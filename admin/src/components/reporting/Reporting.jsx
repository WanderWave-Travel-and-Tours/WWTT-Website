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
  Users,
  Eye,
  Heart,
  Zap,
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
  LabelList,          // ← NEW: para sa numbers on top ng bars
} from 'recharts';
import { exportReportingToPDF } from './utils/reportingPdfExport';
import './Reporting.css';



// ─── CHART DATA (social media — replace with real API when ready) ──────────────

// All 12 months of data — getChartData() will slice up to current month
const ALL_MONTHLY_REACH = [
  { month: 'Jan', Facebook: 12400, Instagram: 9800,  TikTok: 15200 },
  { month: 'Feb', Facebook: 14100, Instagram: 11500, TikTok: 18400 },
  { month: 'Mar', Facebook: 13200, Instagram: 12200, TikTok: 22100 },
  { month: 'Apr', Facebook: 15800, Instagram: 14000, TikTok: 26500 },
  { month: 'May', Facebook: 17200, Instagram: 15600, TikTok: 31200 },
  { month: 'Jun', Facebook: 16400, Instagram: 13900, TikTok: 28900 },
  { month: 'Jul', Facebook: 19100, Instagram: 17200, TikTok: 35400 },
  { month: 'Aug', Facebook: 18500, Instagram: 16400, TikTok: 33100 },
  { month: 'Sep', Facebook: 20200, Instagram: 18100, TikTok: 38600 },
  { month: 'Oct', Facebook: 21800, Instagram: 19400, TikTok: 41200 },
  { month: 'Nov', Facebook: 23100, Instagram: 20700, TikTok: 44500 },
  { month: 'Dec', Facebook: 24600, Instagram: 22300, TikTok: 47800 },
];

const ALL_MONTHLY_ENGAGEMENT = [
  { month: 'Jan', Facebook: 3200,  Instagram: 5100,  TikTok: 8400  },
  { month: 'Feb', Facebook: 3900,  Instagram: 6200,  TikTok: 9800  },
  { month: 'Mar', Facebook: 3600,  Instagram: 6800,  TikTok: 12200 },
  { month: 'Apr', Facebook: 4500,  Instagram: 7400,  TikTok: 14500 },
  { month: 'May', Facebook: 5100,  Instagram: 8200,  TikTok: 17100 },
  { month: 'Jun', Facebook: 4800,  Instagram: 7600,  TikTok: 15800 },
  { month: 'Jul', Facebook: 5600,  Instagram: 9100,  TikTok: 19400 },
  { month: 'Aug', Facebook: 5300,  Instagram: 8700,  TikTok: 18200 },
  { month: 'Sep', Facebook: 6100,  Instagram: 10200, TikTok: 22400 },
  { month: 'Oct', Facebook: 6800,  Instagram: 11100, TikTok: 24700 },
  { month: 'Nov', Facebook: 7400,  Instagram: 12000, TikTok: 27100 },
  { month: 'Dec', Facebook: 8100,  Instagram: 13200, TikTok: 29800 },
];

const ALL_MONTHLY_FOLLOWERS = [
  { month: 'Jan', Facebook: 4200,  Instagram: 3100,  TikTok: 6500  },
  { month: 'Feb', Facebook: 4600,  Instagram: 3800,  TikTok: 8200  },
  { month: 'Mar', Facebook: 5100,  Instagram: 4200,  TikTok: 10400 },
  { month: 'Apr', Facebook: 5800,  Instagram: 5000,  TikTok: 13600 },
  { month: 'May', Facebook: 6400,  Instagram: 5700,  TikTok: 16900 },
  { month: 'Jun', Facebook: 6900,  Instagram: 6100,  TikTok: 19200 },
  { month: 'Jul', Facebook: 7800,  Instagram: 7000,  TikTok: 23100 },
  { month: 'Aug', Facebook: 8400,  Instagram: 7600,  TikTok: 25800 },
  { month: 'Sep', Facebook: 9100,  Instagram: 8300,  TikTok: 28900 },
  { month: 'Oct', Facebook: 9900,  Instagram: 9100,  TikTok: 32400 },
  { month: 'Nov', Facebook: 10700, Instagram: 9900,  TikTok: 36100 },
  { month: 'Dec', Facebook: 11600, Instagram: 10800, TikTok: 40200 },
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
    rateNum:    6.2,
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
    rateNum:    10.4,
  },
  {
    platform:   'TikTok',
    icon:       null,
    color:      '#69C9D0',
    bg:         '#f0f0f0',
    followers:  '23,100',
    reach:      '35,400',
    engagement: '19,400',
    rate:       '9.8%',
    rateNum:    9.8,
  },
];

// Platform filter tabs config
const PLATFORM_TABS = [
  { key: 'Facebook',  label: 'Facebook',  Icon: Facebook,  color: '#1877F2', bg: '#e7f0fd' },
  { key: 'Instagram', label: 'Instagram', Icon: Instagram, color: '#E1306C', bg: '#fde8ef' },
  { key: 'TikTok',    label: 'TikTok',    Icon: null,      color: '#010101', bg: '#f0f0f0' },
];

// ─── TIKTOK ICON ──────────────────────────────────────────────────────────────
const TikTokIcon = ({ size = 20, color = '#010101' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z"/>
  </svg>
);

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

const formatCount = (n) => {
  if (n === null || n === undefined) return '—';
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

// ─── ENGAGEMENT RING SVG ──────────────────────────────────────────────────────
const EngagementRing = ({ rate, color }) => {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(rate / 20, 1); // cap at 20% for visual scale
  const dash = pct * circumference;

  return (
    <div className="rp-ps-ring-wrap">
      <svg viewBox="0 0 64 64" className="rp-ps-ring-svg">
        {/* track */}
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="5"
        />
        {/* filled arc */}
        <circle
          cx="32" cy="32" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          transform="rotate(-90 32 32)"
        />
      </svg>
      <div className="rp-ps-ring-inner">
        <span className="rp-ps-ring-value">{rate}%</span>
        <span className="rp-ps-ring-label">ENG.</span>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
const Reporting = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activePeriod, setActivePeriod] = useState('weekly');
  const [activePlatform, setActivePlatform] = useState('Facebook'); // default Facebook

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

  // ── Site visit (social referral) state ────────────────────────────────────
  const [siteVisitStats, setSiteVisitStats] = useState({
    recentVisits: [],
    byPlatform: { facebook: 0, instagram: 0, tiktok: 0 },
  });
  const [svLoading, setSvLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [pvRes, bookRes, svRes] = await Promise.all([
          fetch('/api/page-views/stats'),
          fetch('/api/bookings/active'),
          fetch('/api/site-visits/stats'),
        ]);
        const [pvJson, bookJson, svJson] = await Promise.all([pvRes.json(), bookRes.json(), svRes.json()]);

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

        if (svJson.status === 'ok') {
          setSiteVisitStats({
            recentVisits: svJson.data.recentVisits || [],
            byPlatform:   svJson.data.byPlatform   || { facebook: 0, instagram: 0, tiktok: 0 },
          });
        }
      } catch (err) {
        console.error('Failed to fetch reporting stats:', err);
      } finally {
        setPvLoading(false);
        setSvLoading(false);
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

  // ── Filtered social (site-visit) counts — date-range aware ───────────────
  const filteredSocialVisits = useMemo(() => {
    const { start, end } = analyticsDateWindow;
    const all = siteVisitStats.recentVisits;

    const inRange = all.filter(v => {
      const d = new Date(v.createdAt);
      return d >= start && d <= end;
    });

    return {
      facebook:  inRange.filter(v => v.platform === 'facebook').length,
      instagram: inRange.filter(v => v.platform === 'instagram').length,
      tiktok:    inRange.filter(v => v.platform === 'tiktok').length,
    };
  }, [siteVisitStats.recentVisits, analyticsDateWindow]);

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
      value:    svLoading ? '…' : formatCount(filteredSocialVisits.facebook),
      change:   null,
      positive: true,
      icon:     Facebook,
      image:    STAT_IMAGES.facebook,
    },
    {
      label:    'Instagram → Website',
      value:    svLoading ? '…' : formatCount(filteredSocialVisits.instagram),
      change:   null,
      positive: true,
      icon:     Instagram,
      image:    STAT_IMAGES.instagram,
    },
    {
      label:    'TikTok → Website',
      value:    svLoading ? '…' : formatCount(filteredSocialVisits.tiktok),
      change:   null,
      positive: true,
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

  const getChartData = () => {
    // currentMonthIdx: 0 = Jan, so slice up to (currentMonthIdx + 1) to include current month
    const currentMonthIdx = new Date().getMonth(); // 0-based
    const upToNow = ALL_MONTHLY_REACH.slice(0, currentMonthIdx + 1);

    const count = activePeriod === 'daily'  ? 3
                : activePeriod === 'trend'  ? 6
                : 7;

    // For the combined chart we always use REACH data keyed by platform
    return upToNow.slice(-count);
  };

  // Separate helper for single-platform chart — same slice logic
  const getSingleChartData = () => {
    const currentMonthIdx = new Date().getMonth();
    const count = activePeriod === 'daily'  ? 3
                : activePeriod === 'trend'  ? 6
                : 7;
    return ALL_MONTHLY_REACH.slice(0, currentMonthIdx + 1).slice(-count);
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
      filteredPageViewStats,
      filteredBookingCounts,
      viewToBookRate,
      activePeriod,
      periodLabel,
    });
  };

  // ── Active platform config (for chart rendering) ──────────────────────────
  const activePlatformConfig = PLATFORM_TABS.find(p => p.key === activePlatform);
  const activePlatformSummary = PLATFORM_SUMMARY.find(p => p.platform === activePlatform);

  return (
    <div className="rp-layout">
      <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

      <main className={`rp-main ${isCollapsed ? 'rp-main--collapsed' : ''}`}>
        <div className="rp-container">

          {/* PAGE HEADER — yellow buttons changed to #001f3f */}
          <div className="rp-page-header">
            <div className="rp-page-title-block">
              <h1 className="rp-page-title">SOCIAL MEDIA REPORTING</h1>
              <p className="rp-page-subtitle">Facebook · Instagram · TikTok performance overview</p>
            </div>
            <div className="rp-page-header-right">
              {/* ALL PLATFORMS button */}
              <button 
                className="rp-btn"
                style={{ backgroundColor: '#001f3f', color: '#ffffff', borderColor: '#001f3f' }}
              >
                <BarChart2 size={16} />
                All Platforms
                <ChevronDown size={15} />
              </button>
              {/* Download button */}
              <button
                className="rp-btn-icon"
                title={`Download ${periodLabel} report`}
                onClick={handleExportPDF}
                style={{ backgroundColor: '#001f3f', color: '#ffffff' }}
              >
                <Download size={18} />
              </button>
            </div>
          </div>

        {/* ── QUICK STATS ── */}
        <section className="rp-section">
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

        {/* ── PLATFORM SUMMARY — DARK COMMAND CENTER DESIGN ── */}
        <section className="rp-section">
          <h2 className="rp-section-title">Platform Summary</h2>

          <div className="rp-ps-grid">
            {PLATFORM_SUMMARY.map((p) => {
              const Icon = p.icon;
              const gradientMap = {
                Facebook: 'linear-gradient(135deg, #1877F2 0%, #0d5ed9 60%, #0a4ab5 100%)',
                Instagram: 'linear-gradient(135deg, #f58529 0%, #dd2a7b 50%, #8134af 100%)',
                TikTok: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
              };
              return (
                <div
                  className="rp-ps-card"
                  key={p.platform}
                  style={{ '--pc': p.color }}
                >
                  {/* Colored gradient header band */}
                  <div
                    className="rp-ps-header-band"
                    style={{ background: gradientMap[p.platform] }}
                  >
                    {/* Top row: icon + name + engagement ring */}
                    <div className="rp-ps-top">
                      <div className="rp-ps-identity">
                        <div className="rp-ps-icon-wrap">
                          {p.platform === 'TikTok'
                            ? <TikTokIcon size={22} color="#ffffff" />
                            : <Icon size={22} color="#ffffff" />}
                        </div>
                        <div>
                          <div className="rp-ps-name">{p.platform}</div>
                          <div className="rp-ps-sub">Performance Overview</div>
                        </div>
                      </div>

                      <EngagementRing rate={p.rateNum} color="rgba(255,255,255,0.9)" />
                    </div>
                  </div>

                  {/* White card body */}
                  <div className="rp-ps-body">
                    {/* Divider line */}
                    <div className="rp-ps-divider" />

                    {/* Stats row */}
                    <div className="rp-ps-stats">
                      <div className="rp-ps-stat">
                        <div className="rp-ps-stat-icon" style={{ color: p.color }}>
                          <Users size={13} />
                        </div>
                        <div className="rp-ps-stat-label">Followers</div>
                        <div className="rp-ps-stat-value">{p.followers}</div>
                        <div className="rp-ps-bar">
                          <div className="rp-ps-bar-fill" style={{ background: p.color, width: '48%' }} />
                        </div>
                      </div>

                      <div className="rp-ps-stat-sep" />

                      <div className="rp-ps-stat">
                        <div className="rp-ps-stat-icon" style={{ color: p.color }}>
                          <Eye size={13} />
                        </div>
                        <div className="rp-ps-stat-label">Reach</div>
                        <div className="rp-ps-stat-value">{p.reach}</div>
                        <div className="rp-ps-bar">
                          <div className="rp-ps-bar-fill" style={{ background: p.color, width: '72%' }} />
                        </div>
                      </div>

                      <div className="rp-ps-stat-sep" />

                      <div className="rp-ps-stat">
                        <div className="rp-ps-stat-icon" style={{ color: p.color }}>
                          <Heart size={13} />
                        </div>
                        <div className="rp-ps-stat-label">Engagement</div>
                        <div className="rp-ps-stat-value">{p.engagement}</div>
                        <div className="rp-ps-bar">
                          <div className="rp-ps-bar-fill" style={{ background: p.color, width: '60%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom sparkline bars */}
                  <div className="rp-ps-spark">
                    {[40, 55, 45, 70, 60, 80, 65, 90, 75, 85, 70, 95].map((h, i) => (
                      <div
                        key={i}
                        className="rp-ps-spark-bar"
                        style={{ height: `${h}%`, background: i >= 9 ? p.color : `${p.color}44` }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* BAR CHARTS SECTION */}
        <section className="rp-section">

          <div className="rp-chart-controls">
            {/* SOCIAL MEDIA FILTER TABS */}
            <div className="rp-chart-tabs">
              {PLATFORM_TABS.map((pt) => (
                <button
                  key={pt.key}
                  className={`rp-chart-tab ${activePlatform === pt.key ? 'active' : ''}`}
                  onClick={() => setActivePlatform(pt.key)}
                  style={
                    activePlatform === pt.key
                      ? { background: pt.color, borderColor: pt.color, color: '#fff' }
                      : {}
                  }
                >
                  {pt.key === 'TikTok' ? (
                    <TikTokIcon size={13} color={activePlatform === pt.key ? '#fff' : '#64748b'} />
                  ) : (
                    <pt.Icon size={13} color={activePlatform === pt.key ? '#fff' : '#64748b'} />
                  )}
                  {pt.label}
                </button>
              ))}
            </div>

            {/* PERIOD BUTTONS — #001f3f theme */}
            <div className="rp-period-bar">
              {/* ── DAILY DROPDOWN ── */}
              <div className="rp-period-dropdown" ref={dailyRef}>
                <button
                  className={`rp-period-btn ${activePeriod === 'daily' ? 'active' : ''}`}
                  style={activePeriod === 'daily' ? { backgroundColor: '#001f3f', color: '#fff' } : {}}
                  onClick={() => { setIsDailyOpen(o => !o); setIsMonthlyOpen(false); setIsCustomOpen(false); }}
                >
                  <Clock size={14} />
                  Daily
                  <ChevronDown size={13} className={isDailyOpen ? 'rp-chevron-open' : ''} />
                </button>
                {isDailyOpen && (
                  <div className="rp-period-menu">
                    <p className="rp-period-menu-title">Select Day</p>
                    <input
                      type="date"
                      className="rp-period-date-input"
                      value={selectedDailyDate}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={e => {
                        setSelectedDailyDate(e.target.value);
                        setActivePeriod('daily');
                        setIsDailyOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ── WEEKLY (no dropdown) ── */}
              <button
                className={`rp-period-btn ${activePeriod === 'weekly' ? 'active' : ''}`}
                style={activePeriod === 'weekly' ? { backgroundColor: '#001f3f', color: '#fff' } : {}}
                onClick={() => setActivePeriod('weekly')}
              >
                <Calendar size={14} />
                Weekly
              </button>

              {/* ── MONTHLY DROPDOWN ── */}
              <div className="rp-period-dropdown" ref={monthlyRef}>
                <button
                  className={`rp-period-btn ${activePeriod === 'monthly' ? 'active' : ''}`}
                  style={activePeriod === 'monthly' ? { backgroundColor: '#001f3f', color: '#fff' } : {}}
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
                      onChange={e => {
                        setSelectedMonth(e.target.value);
                        setActivePeriod('monthly');
                        setIsMonthlyOpen(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* ── TREND (no dropdown) ── */}
              <button
                className={`rp-period-btn ${activePeriod === 'trend' ? 'active' : ''}`}
                style={activePeriod === 'trend' ? { backgroundColor: '#001f3f', color: '#fff' } : {}}
                onClick={() => setActivePeriod('trend')}
              >
                <TrendingUp size={14} />
                Trend (6 Mo)
              </button>

              {/* ── CUSTOM RANGE DROPDOWN ── */}
              <div className="rp-period-dropdown" ref={customRef}>
                <button
                  className={`rp-period-btn ${activePeriod === 'custom' ? 'active' : ''}`}
                  style={activePeriod === 'custom' ? { backgroundColor: '#001f3f', color: '#fff' } : {}}
                  onClick={() => { setIsCustomOpen(o => !o); setIsDailyOpen(false); setIsMonthlyOpen(false); }}
                >
                  <SlidersHorizontal size={14} />
                  Custom Range
                  <ChevronDown size={13} className={isCustomOpen ? 'rp-chevron-open' : ''} />
                </button>
                {isCustomOpen && (
                  <div className="rp-period-menu rp-period-menu--wide">
                    <p className="rp-period-menu-title">Custom Range</p>
                    <div className="rp-period-range-row">
                      <div className="rp-period-range-field">
                        <label>Start</label>
                        <input
                          type="date"
                          className="rp-period-date-input"
                          value={customDates.start}
                          max={customDates.end || new Date().toISOString().split('T')[0]}
                          onChange={e => setCustomDates(d => ({ ...d, start: e.target.value }))}
                        />
                      </div>
                      <div className="rp-period-range-field">
                        <label>End</label>
                        <input
                          type="date"
                          className="rp-period-date-input"
                          value={customDates.end}
                          min={customDates.start}
                          max={new Date().toISOString().split('T')[0]}
                          onChange={e => setCustomDates(d => ({ ...d, end: e.target.value }))}
                        />
                      </div>
                      <button
                        className="rp-period-apply"
                        onClick={() => { setActivePeriod('custom'); setIsCustomOpen(false); }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* KEY METRICS CARD */}
          {activePlatformSummary && (
            <div 
              className="rp-key-metrics-card" 
              style={{ 
                '--platform-color': activePlatformConfig.color, 
                '--platform-bg': activePlatformConfig.bg 
              }}
            >
              <div className="rp-key-metrics-header">
                <div className="rp-key-metrics-badge" style={{ background: activePlatformConfig.bg }}>
                  {activePlatform === 'TikTok' ? (
                    <TikTokIcon size={15} color={activePlatformConfig.color} />
                  ) : (
                    <activePlatformConfig.Icon size={15} color={activePlatformConfig.color} />
                  )}
                  <span style={{ color: activePlatformConfig.color }}>{activePlatform}</span>
                </div>
                <span className="rp-key-metrics-eyebrow">KEY METRICS</span>
              </div>

              <div className="rp-key-metrics-grid">
                <div className="rp-km-tile">
                  <div className="rp-km-top">
                    <div className="rp-km-icon-wrap" style={{ background: activePlatformConfig.bg }}>
                      <Users size={15} color={activePlatformConfig.color} />
                    </div>
                    <span className="rp-km-label">FOLLOWERS</span>
                  </div>
                  <span className="rp-km-value">{activePlatformSummary.followers}</span>
                  <div className="rp-km-accent-bar" style={{ background: activePlatformConfig.color }} />
                </div>

                <div className="rp-km-tile">
                  <div className="rp-km-top">
                    <div className="rp-km-icon-wrap" style={{ background: activePlatformConfig.bg }}>
                      <Eye size={15} color={activePlatformConfig.color} />
                    </div>
                    <span className="rp-km-label">REACH</span>
                  </div>
                  <span className="rp-km-value">{activePlatformSummary.reach}</span>
                  <div className="rp-km-accent-bar" style={{ background: activePlatformConfig.color }} />
                </div>

                <div className="rp-km-tile">
                  <div className="rp-km-top">
                    <div className="rp-km-icon-wrap" style={{ background: activePlatformConfig.bg }}>
                      <Heart size={15} color={activePlatformConfig.color} />
                    </div>
                    <span className="rp-km-label">ENGAGEMENT</span>
                  </div>
                  <span className="rp-km-value">{activePlatformSummary.engagement}</span>
                  <div className="rp-km-accent-bar" style={{ background: activePlatformConfig.color }} />
                </div>

                <div className="rp-km-tile rp-km-tile--highlight" style={{ '--tile-color': activePlatformConfig.color, '--tile-bg': activePlatformConfig.bg }}>
                  <div className="rp-km-top">
                    <div className="rp-km-icon-wrap" style={{ background: 'rgba(255,255,255,0.65)' }}>
                      <Zap size={15} color={activePlatformConfig.color} />
                    </div>
                    <span className="rp-km-label" style={{ color: activePlatformConfig.color, opacity: 0.75 }}>ENG. RATE</span>
                  </div>
                  <span className="rp-km-value rp-km-value--rate" style={{ color: activePlatformConfig.color }}>
                    {activePlatformSummary.rate}
                  </span>
                  <div className="rp-km-accent-bar" style={{ background: activePlatformConfig.color }} />
                </div>
              </div>
            </div>
          )}

          {/* SINGLE PLATFORM CHART (with nice labels) - ONE ONLY */}
          <div className="rp-chart-card">
            <div className="rp-chart-card-header">
              <div className="rp-chart-platform-badge" style={{ background: activePlatformConfig.bg }}>
                {activePlatform === 'TikTok' ? (
                  <TikTokIcon size={16} color={activePlatformConfig.color} />
                ) : (
                  <activePlatformConfig.Icon size={16} color={activePlatformConfig.color} />
                )}
                <span style={{ color: activePlatformConfig.color }}>{activePlatform}</span>
              </div>
              <p className="rp-chart-card-subtitle">Monthly reach performance</p>
            </div>
            
            <ResponsiveContainer width="100%" height={280}>
              <BarChart 
                data={getSingleChartData()} 
                margin={{ top: 40, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Plus Jakarta Sans, sans-serif' }} 
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Plus Jakarta Sans, sans-serif' }} 
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} 
                />
                <Tooltip content={<CustomTooltip />} />
                
                <Bar 
                  dataKey={activePlatform} 
                  fill={activePlatformConfig.color} 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={58}
                  isAnimationActive={true}
                >
                  <LabelList 
                    dataKey={activePlatform} 
                    position="top" 
                    fill="#001f3f" 
                    fontSize={13} 
                    fontWeight={700}
                    formatter={formatCount}
                    offset={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* COMBINED CHART */}
          <div className="rp-chart-card rp-chart-card--combined">
            <div className="rp-chart-card-header">
              <div className="rp-chart-platform-badge" style={{ background: '#f3f4f6' }}>
                <BarChart2 size={16} color="#001f3f" />
                <span style={{ color: '#001f3f' }}>All Platforms Combined</span>
              </div>
              <p className="rp-chart-card-subtitle">Side-by-side comparison</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={getChartData()} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '13px', paddingTop: '12px' }} />
                <Bar dataKey="Facebook" fill="#1877F2" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Instagram" fill="#E1306C" radius={[4, 4, 0, 0]} maxBarSize={32} />
                <Bar dataKey="TikTok" fill="#010101" radius={[4, 4, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </section>
        </div>{/* end rp-container */}
      </main>
    </div>
  );
};

export default Reporting;