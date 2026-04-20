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
  ShoppingBag,
  Package,
  Map,
  Activity,
  Sprout,
  Megaphone,
  Layers,
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
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { exportReportingToPDF } from './utils/reportingPdfExport';
import VisitorJourney from '../dashboard/components/VisitorJourney';
import '../dashboard/components/RevenueAnalytics.css';
import './Reporting.css';



// ─── API BASE URL ─────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || '';

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

  // ── Site Visit Section — own period/platform state ────────────────────────
  const [svActivePeriod, setSvActivePeriod] = useState('weekly');
  const [svActivePlatform, setSvActivePlatform] = useState('facebook');
  const [svPieCampaignFilter,  setSvPieCampaignFilter]  = useState('total');  // 'total' | 'organic' | 'ads'
  const [svLineCampaignFilter, setSvLineCampaignFilter] = useState('total');  // 'total' | 'organic' | 'ads'
  const [svIsDailyOpen,   setSvIsDailyOpen]   = useState(false);
  const [svIsMonthlyOpen, setSvIsMonthlyOpen] = useState(false);
  const [svIsCustomOpen,  setSvIsCustomOpen]  = useState(false);
  const [svSelectedDailyDate, setSvSelectedDailyDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [svSelectedMonth, setSvSelectedMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [svCustomDates, setSvCustomDates] = useState({ start: '', end: '' });

  const svDailyRef   = useRef(null);
  const svMonthlyRef = useRef(null);
  const svCustomRef  = useRef(null);

  // Close sv dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (svDailyRef.current   && !svDailyRef.current.contains(e.target))   setSvIsDailyOpen(false);
      if (svMonthlyRef.current && !svMonthlyRef.current.contains(e.target)) setSvIsMonthlyOpen(false);
      if (svCustomRef.current  && !svCustomRef.current.contains(e.target))  setSvIsCustomOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
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
    platformRows: [],     // ← NEW
    totalVisits:  0,      // ← NEW
  });
  const [svLoading, setSvLoading] = useState(true);

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

  // ── Site Visit date window — shared with Page View Analytics ─────────────
  const svDateWindow = useMemo(() => {
    const now = new Date();
    if (svActivePeriod === 'daily') {
      const start = new Date(svSelectedDailyDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(svSelectedDailyDate); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (svActivePeriod === 'weekly') {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (svActivePeriod === 'monthly') {
      const [year, month] = svSelectedMonth.split('-');
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end   = new Date(year, month, 0, 23, 59, 59, 999);
      return { start, end };
    }
    if (svActivePeriod === '6months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (svActivePeriod === 'custom' && svCustomDates.start && svCustomDates.end) {
      const start = new Date(svCustomDates.start); start.setHours(0, 0, 0, 0);
      const end   = new Date(svCustomDates.end);   end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    return { start: new Date(0), end: new Date() };
  }, [svActivePeriod, svSelectedDailyDate, svSelectedMonth, svCustomDates]);

  // ── Fetch stats — placed after svDateWindow so the dep array is valid ─────
  useEffect(() => {
    const fetchStats = async () => {
      setPvLoading(true);
      setSvLoading(true);
      try {
        // Build query params for site-visits only (date-aware)
        const svParams = new URLSearchParams();
        const { start, end } = svDateWindow;
        if (start) svParams.append('start', start.toISOString().split('T')[0]);
        if (end)   svParams.append('end',   end.toISOString().split('T')[0]);

        const svUrl = svParams.toString()
          ? `${API_BASE}/api/site-visits/stats?${svParams.toString()}`
          : `${API_BASE}/api/site-visits/stats`;

        const [pvRes, bookRes, svRes] = await Promise.all([
          fetch(`${API_BASE}/api/page-views/stats`),
          fetch(`${API_BASE}/api/bookings/active`),
          fetch(svUrl),
        ]);

        const [pvJson, bookJson, svJson] = await Promise.all([
          pvRes.json(),
          bookRes.json(),
          svRes.json(),
        ]);

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

        // ── SITE VISIT STATS (now date-aware + detailed breakdown) ──
        if (svJson.status === 'ok') {
          const data = svJson.data;
          setSiteVisitStats({
            recentVisits: data.recentVisits || [],
            byPlatform:   data.byPlatform   || { facebook: 0, instagram: 0, tiktok: 0 },
            platformRows: data.platformRows || [],
            totalVisits:  data.totalVisits  || 0,
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
  }, [svDateWindow]);   // ← important: refetches when period changes

  // ── Filtered page view stats — driven by the shared sv date toggle ────────
  const filteredPageViewStats = useMemo(() => {
    const allViews = pageViewStats.recentViews || [];
    const { start, end } = svDateWindow;

    const filtered = allViews.filter(v => {
      const d = new Date(v.createdAt);
      return d >= start && d <= end;
    });

    // Stage breakdown
    const stageOrder = ['awareness', 'interest', 'consideration', 'intent', 'conversion'];
    const stageCounts = {};
    stageOrder.forEach(s => { stageCounts[s] = 0; });
    filtered.forEach(v => {
      if (v.stage && stageCounts[v.stage] !== undefined) stageCounts[v.stage]++;
    });
    const stageBreakdown = stageOrder.map(stage => ({ stage, count: stageCounts[stage] }));

    // Top viewed packages
    const pkgCounts = {};
    filtered.filter(v => v.page === 'booking' && v.packageName).forEach(v => {
      const key = v.packageName;
      if (!pkgCounts[key]) pkgCounts[key] = { count: 0 };
      pkgCounts[key].count += 1;
    });
    const topViewedPackages = Object.entries(pkgCounts)
      .map(([packageName, data]) => ({ packageName, views: data.count, displayName: packageName }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      totalViews:        filtered.length,
      packagesPageViews: filtered.filter(v => v.page === 'packages').length,
      bookingPageViews:  filtered.filter(v => v.page === 'booking').length,
      flightsPageViews:  filtered.filter(v => v.page === 'flights').length,
      servicesPageViews: filtered.filter(v => v.page === 'services').length,
      toursPageViews:    filtered.filter(v => v.page === 'tours').length,
      stageBreakdown,
      topViewedPackages,
    };
  }, [svDateWindow, pageViewStats.recentViews]);

  // Filtered booking counts — sourced from actual Booking records.
  // recentActiveBookings comes from /api/bookings/active (isArchive !== 'Yes'),
  // so this always matches exactly what the admin sees in the Bookings table.
  const filteredBookingCounts = useMemo(() => {
    const { start, end } = svDateWindow;

    const filtered = recentActiveBookings.filter(b => {
      const d = new Date(b.createdAt);
      return d >= start && d <= end;
    });

    return { totalConfirmedBookings: filtered.length };
  }, [recentActiveBookings, svDateWindow]);

  // ── Platform + Campaign Type Breakdown (Organic vs Ads) ─────────────────────
  const platformBreakdown = useMemo(() => {
    const breakdown = {
      facebook:  { organic: 0, ads: 0, total: 0 },
      instagram: { organic: 0, ads: 0, total: 0 },
      tiktok:    { organic: 0, ads: 0, total: 0 },
    };

    siteVisitStats.platformRows.forEach((row) => {
      const plat = row._id.platform;
      const camp = row._id.campaignType; // 'organic', 'ads', or null
      const count = row.count || 0;

      if (plat in breakdown) {
        breakdown[plat].total += count;

        if (camp === 'organic') {
          breakdown[plat].organic += count;
        } else if (camp === 'ads') {
          breakdown[plat].ads += count;
        }
        // null campaignType → only counted in total, not organic or ads
      }
    });

    return breakdown;
  }, [siteVisitStats.platformRows]);

  // ── Overall totals ────────────────────────────────────────────────────────
  const overallBreakdown = useMemo(() => {
    let organic = 0;
    let ads = 0;

    Object.values(platformBreakdown).forEach((p) => {
      organic += p.organic;
      ads += p.ads;
    });

    return {
      organic,
      ads,
      total: organic + ads,
    };
  }, [platformBreakdown]);

  // ── Filtered social (site-visit) counts — date-range aware ───────────────
  const filteredSocialVisits = useMemo(() => ({
    facebook:  platformBreakdown.facebook.total,
    instagram: platformBreakdown.instagram.total,
    tiktok:    platformBreakdown.tiktok.total,
  }), [platformBreakdown]);

  // ── Pie chart data — filtered by sv period + campaign filter ───────────────
  const svPieData = useMemo(() => {
    const key = svPieCampaignFilter; // 'total' | 'organic' | 'ads'
    return [
      { name: 'Facebook',  value: platformBreakdown.facebook[key],  color: '#1877F2' },
      { name: 'Instagram', value: platformBreakdown.instagram[key], color: '#E1306C' },
      { name: 'TikTok',    value: platformBreakdown.tiktok[key],    color: '#010101' },
    ];
  }, [platformBreakdown, svPieCampaignFilter]);

  // ── Line graph date window — excludes daily (line graph ignores daily toggle) ─
  const svLineWindow = useMemo(() => {
    const now = new Date();
    if (svActivePeriod === 'weekly') {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end, mode: 'weekly' };
    }
    if (svActivePeriod === 'monthly') {
      const [year, month] = svSelectedMonth.split('-');
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end   = new Date(year, month, 0, 23, 59, 59, 999);
      return { start, end, mode: 'monthly' };
    }
    if (svActivePeriod === '6months') {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end, mode: '6months' };
    }
    if (svActivePeriod === 'custom' && svCustomDates.start && svCustomDates.end) {
      const start = new Date(svCustomDates.start); start.setHours(0, 0, 0, 0);
      const end   = new Date(svCustomDates.end);   end.setHours(23, 59, 59, 999);
      const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const mode = diffDays > 60 ? '6months' : diffDays > 14 ? 'monthly' : 'weekly';
      return { start, end, mode };
    }
    // daily or fallback → use last 7 days but don't react to daily date picker
    const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
    const end   = new Date(now); end.setHours(23, 59, 59, 999);
    return { start, end, mode: 'weekly' };
  }, [svActivePeriod, svSelectedMonth, svCustomDates]);  // NOTE: svSelectedDailyDate intentionally excluded

  // ── Line graph data — ALL 3 platforms simultaneously ─────────────────────
  const svLineData = useMemo(() => {
    const { start, end, mode } = svLineWindow;
    const all = siteVisitStats.recentVisits;

    // Filter by date window
    let inRange = all.filter(v => {
      const d = new Date(v.createdAt);
      return d >= start && d <= end;
    });

    // Apply campaign type filter — per platform (each platform only counts its own campaignType)
    const matchesCampaign = (v) => {
      if (svLineCampaignFilter === 'total') return true;
      return v.campaignType === svLineCampaignFilter;
    };

    // ── MONTHLY mode: bucket per calendar week within the month ──────────────
    if (mode === 'monthly') {
      // Build week boundaries: Mon–Sun within the month
      const weeks = [];
      const cur = new Date(start);
      while (cur <= end) {
        const weekStart = new Date(cur);
        const weekEnd = new Date(cur);
        weekEnd.setDate(weekEnd.getDate() + 6);
        if (weekEnd > end) weekEnd.setTime(end.getTime());
        weeks.push({
          label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          from: new Date(weekStart),
          to: new Date(weekEnd),
        });
        cur.setDate(cur.getDate() + 7);
      }

      return weeks.map(({ label, from, to }) => {
        const slice = inRange.filter(v => {
          const d = new Date(v.createdAt);
          return d >= from && d <= to;
        });
        return {
          date: label,
          facebook:  slice.filter(v => v.platform === 'facebook'  && matchesCampaign(v)).length,
          instagram: slice.filter(v => v.platform === 'instagram' && matchesCampaign(v)).length,
          tiktok:    slice.filter(v => v.platform === 'tiktok'    && matchesCampaign(v)).length,
        };
      });
    }

    // ── 6MONTHS mode: bucket per calendar month ───────────────────────────────
    if (mode === '6months') {
      const months = [];
      const cur = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cur <= end) {
        const mStart = new Date(cur.getFullYear(), cur.getMonth(), 1, 0, 0, 0, 0);
        const mEnd   = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
        months.push({
          label: cur.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          sortKey: cur.getFullYear() * 100 + cur.getMonth(),
          from: mStart,
          to: mEnd,
        });
        cur.setMonth(cur.getMonth() + 1);
      }

      return months
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ label, from, to }) => {
          const slice = inRange.filter(v => {
            const d = new Date(v.createdAt);
            return d >= from && d <= to;
          });
          return {
            date: label,
            facebook:  slice.filter(v => v.platform === 'facebook'  && matchesCampaign(v)).length,
            instagram: slice.filter(v => v.platform === 'instagram' && matchesCampaign(v)).length,
            tiktok:    slice.filter(v => v.platform === 'tiktok'    && matchesCampaign(v)).length,
          };
        });
    }

    // ── WEEKLY (default): bucket per day ─────────────────────────────────────
    const days = [];
    const cur = new Date(start);
    while (cur <= end) {
      const label = cur.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayStart = new Date(cur); dayStart.setHours(0, 0, 0, 0);
      const dayEnd   = new Date(cur); dayEnd.setHours(23, 59, 59, 999);
      const slice = inRange.filter(v => {
        const d = new Date(v.createdAt);
        return d >= dayStart && d <= dayEnd;
      });
      days.push({
        date: label,
        facebook:  slice.filter(v => v.platform === 'facebook'  && matchesCampaign(v)).length,
        instagram: slice.filter(v => v.platform === 'instagram' && matchesCampaign(v)).length,
        tiktok:    slice.filter(v => v.platform === 'tiktok'    && matchesCampaign(v)).length,
      });
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [siteVisitStats.recentVisits, svLineWindow, svLineCampaignFilter]);

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

  // ── Period label (for PDF header & badge) — driven by the sv date toggle ──
  const periodLabel = useMemo(() => {
    if (svActivePeriod === 'daily') {
      const d = new Date(svSelectedDailyDate + 'T00:00:00');
      return 'Daily: ' + d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
    if (svActivePeriod === 'weekly') {
      const now   = new Date();
      const start = new Date(now); start.setDate(start.getDate() - 6);
      const fmt   = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `Weekly: ${fmt(start)} – ${fmt(now)}`;
    }
    if (svActivePeriod === 'monthly') {
      const [year, month] = svSelectedMonth.split('-');
      const d = new Date(year, month - 1, 1);
      return 'Monthly: ' + d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (svActivePeriod === '6months') {
      return 'Trend: Last 6 Months';
    }
    if (svActivePeriod === 'custom' && svCustomDates.start && svCustomDates.end) {
      const fmt = (s) => new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `Custom: ${fmt(svCustomDates.start)} – ${fmt(svCustomDates.end)}`;
    }
    return 'All Time';
  }, [svActivePeriod, svSelectedDailyDate, svSelectedMonth, svCustomDates]);

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
      svPieData,
      platformBreakdown,
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

        {/* ── SITE VISIT ANALYTICS — Social Referral Traffic ── */}
        <section className="rp-section">
          <h2 className="rp-section-title">Site Visit Analytics <span className="rp-section-subtitle-inline">— Social Referral Traffic</span></h2>

          {/* Controls: period toggles — new clean pill navigator */}
          <div className="rp-pt-wrap">
            {/* ── Pill row ── */}
            <div className="rp-pt-bar">
              <span className="rp-pt-label"><Clock size={13} /> Period</span>
              <div className="rp-pt-pills">
                {[
                  { key: 'weekly',  icon: <Calendar size={13} />,          label: 'Weekly'   },
                  { key: 'monthly', icon: <CalendarDays size={13} />,      label: 'Monthly'  },
                  { key: '6months', icon: <TrendingUp size={13} />,        label: '6 Months' },
                  { key: 'custom',  icon: <SlidersHorizontal size={13} />, label: 'Custom'   },
                ].map(p => (
                  <button
                    key={p.key}
                    className={`rp-pt-pill ${svActivePeriod === p.key ? 'rp-pt-pill--active' : ''}`}
                    onClick={() => setSvActivePeriod(p.key)}
                  >
                    {p.icon}{p.label}
                  </button>
                ))}
              </div>

              {/* Monthly inline navigator */}
              {svActivePeriod === 'monthly' && (() => {
                const [y, m] = svSelectedMonth.split('-').map(Number);
                const today = new Date();
                const isMax = y === today.getFullYear() && m === today.getMonth() + 1;
                const isMin = y === 2020 && m === 1;
                const goPrev = () => {
                  const d = new Date(y, m - 2, 1);
                  setSvSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                };
                const goNext = () => {
                  const d = new Date(y, m, 1);
                  setSvSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
                };
                const monthLabel = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <div className="rp-pt-month-nav">
                    <button className="rp-pt-nav-arrow" onClick={goPrev} disabled={isMin}>&#8249;</button>
                    <span className="rp-pt-month-label">{monthLabel}</span>
                    <button className="rp-pt-nav-arrow" onClick={goNext} disabled={isMax}>&#8250;</button>
                  </div>
                );
              })()}
            </div>

            {/* Custom range row */}
            {svActivePeriod === 'custom' && (
              <div className="rp-pt-custom-row">
                <div className="rp-pt-custom-field">
                  <label className="rp-pt-custom-label">From</label>
                  <input
                    type="date"
                    className="rp-pt-date-input"
                    value={svCustomDates.start}
                    max={svCustomDates.end || new Date().toISOString().split('T')[0]}
                    onChange={e => setSvCustomDates(d => ({ ...d, start: e.target.value }))}
                  />
                </div>
                <span className="rp-pt-custom-sep">→</span>
                <div className="rp-pt-custom-field">
                  <label className="rp-pt-custom-label">To</label>
                  <input
                    type="date"
                    className="rp-pt-date-input"
                    value={svCustomDates.end}
                    min={svCustomDates.start}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setSvCustomDates(d => ({ ...d, end: e.target.value }))}
                  />
                </div>
                {svCustomDates.start && svCustomDates.end && (
                  <span className="rp-pt-custom-confirm">
                    ✓ {new Date(svCustomDates.start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' – '}
                    {new Date(svCustomDates.end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Charts row: Pie + Line side by side */}
          <div className="rp-sv-charts-row">

            {/* PIE CHART — platform share comparison */}
            <div className="rp-chart-card rp-sv-pie-card">
              <div className="rp-line-header">
                <div className="rp-chart-platform-badge" style={{ background: '#f3f4f6', flexShrink: 0 }}>
                  <BarChart2 size={16} color="#001f3f" />
                  <span style={{ color: '#001f3f' }}>Platform Share</span>
                </div>
                {/* Campaign Type Toggle */}
                <div className="rp-sv-campaign-tabs" style={{ flexShrink: 0 }}>
                  {[
                    { key: 'total',   label: 'Total',   Icon: Layers },
                    { key: 'organic', label: 'Organic', Icon: Sprout },
                    { key: 'ads',     label: 'Ads',     Icon: Megaphone },
                  ].map(ct => (
                    <button
                      key={ct.key}
                      className={`rp-sv-campaign-tab rp-header-btn ${svPieCampaignFilter === ct.key ? 'active' : ''}`}
                      onClick={() => setSvPieCampaignFilter(ct.key)}
                      style={svPieCampaignFilter === ct.key ? { background: '#001f3f', borderColor: '#001f3f', color: '#fff' } : {}}
                    >
                      <ct.Icon size={12} color={svPieCampaignFilter === ct.key ? '#fff' : '#64748b'} />
                      {ct.label}
                    </button>
                  ))}
                </div>
              </div>
              {svLoading ? (
                <div className="rp-loading"><div className="rp-spinner" /><p className="rp-loading-text">Loading…</p></div>
              ) : svPieData.every(d => d.value === 0) ? (
                <div className="rp-empty"><p>No visits recorded for this period.</p></div>
              ) : (
                <div className="rp-sv-pie-wrap">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={svPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {svPieData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name) => [value.toLocaleString() + ' visits', name]}
                        contentStyle={{ fontFamily: 'Plus Jakarta Sans, sans-serif', borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Legend */}
                  <div className="rp-sv-pie-legend">
                    {svPieData.map(d => {
                      const total = svPieData.reduce((a, b) => a + b.value, 0);
                      const pct = total ? ((d.value / total) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={d.name} className="rp-sv-legend-item">
                          <span className="rp-sv-legend-dot" style={{ background: d.color }} />
                          <span className="rp-sv-legend-name">{d.name}</span>
                          <span className="rp-sv-legend-val">{d.value.toLocaleString()}</span>
                          <span className="rp-sv-legend-pct">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* LINE GRAPH — all platforms traffic trend */}
            <div className="rp-chart-card rp-sv-line-card">
              {/* Header: two rows on small screens */}
              <div className="rp-line-header">
                {/* Title badge */}
                <div className="rp-chart-platform-badge" style={{ background: '#f3f4f6', flexShrink: 0 }}>
                  <TrendingUp size={16} color="#001f3f" />
                  <span style={{ color: '#001f3f' }}>Traffic Trend</span>
                </div>
                {/* Platform pills + campaign filter — wrap together on zoom */}
                <div className="rp-line-header-filters">
                  {/* Platform pills */}
                  <div className="rp-sv-platform-tabs">
                    {[
                      { key: 'facebook',  label: 'Facebook',  color: '#1877F2', Icon: Facebook },
                      { key: 'instagram', label: 'Instagram', color: '#E1306C', Icon: Instagram },
                      { key: 'tiktok',    label: 'TikTok',    color: '#010101', Icon: null },
                    ].map(pt => (
                      <span
                        key={pt.key}
                        className="rp-sv-platform-tab rp-header-btn active"
                        style={{ background: pt.color, borderColor: pt.color, color: '#fff', cursor: 'default' }}
                      >
                        {pt.key === 'tiktok'
                          ? <TikTokIcon size={13} color="#fff" />
                          : <pt.Icon size={13} color="#fff" />}
                        {pt.label}
                      </span>
                    ))}
                  </div>
                  {/* Campaign filter */}
                  <div className="rp-sv-campaign-tabs" style={{ flexShrink: 0 }}>
                    {[
                      { key: 'total',   label: 'Total',   Icon: Layers },
                      { key: 'organic', label: 'Organic', Icon: Sprout },
                      { key: 'ads',     label: 'Ads',     Icon: Megaphone },
                    ].map(ct => (
                      <button
                        key={ct.key}
                        className={`rp-sv-campaign-tab rp-header-btn ${svLineCampaignFilter === ct.key ? 'active' : ''}`}
                        onClick={() => setSvLineCampaignFilter(ct.key)}
                        style={svLineCampaignFilter === ct.key ? { background: '#001f3f', borderColor: '#001f3f', color: '#fff' } : {}}
                      >
                        <ct.Icon size={12} color={svLineCampaignFilter === ct.key ? '#fff' : '#64748b'} />
                        {ct.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {svLoading ? (
                <div className="rp-loading"><div className="rp-spinner" /><p className="rp-loading-text">Loading…</p></div>
              ) : svLineData.length === 0 ? (
                <div className="rp-empty"><p>No data for selected platform and period.</p></div>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={svLineData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Plus Jakarta Sans, sans-serif' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} width={32} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        const platformColors = { facebook: '#1877F2', instagram: '#E1306C', tiktok: '#010101' };
                        const platformLabels = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };
                        return (
                          <div className="rp-tooltip">
                            <p className="rp-tooltip-label">{label}</p>
                            {payload.map(entry => (
                              <p key={entry.dataKey} className="rp-tooltip-item">
                                <span className="rp-tooltip-dot" style={{ background: platformColors[entry.dataKey] }} />
                                {platformLabels[entry.dataKey]}
                                {svLineCampaignFilter !== 'total' ? ` (${svLineCampaignFilter})` : ''}: <strong>{entry.value}</strong>
                              </p>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="facebook"
                      stroke="#1877F2"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#1877F2' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="instagram"
                      stroke="#E1306C"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#E1306C' }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="tiktok"
                      stroke="#010101"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#010101' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                </div>
              )}
            </div>

          </div>

          {/* ── CAMPAIGN TYPE BREAKDOWN (Organic vs Ads) ── */}
          <div className="rp-breakdown-section">
            <div className="rp-breakdown-section-header">
              <div className="rp-breakdown-title-wrap">
                <div className="rp-breakdown-title-icon">
                  <Layers size={16} color="#001f3f" />
                </div>
                <h3 className="rp-breakdown-title">Organic vs Paid Ads Breakdown</h3>
              </div>
              <span className="rp-breakdown-period-badge">{periodLabel}</span>
            </div>

            <div className="rp-breakdown-grid">
              {[
                { key: 'facebook',  label: 'Facebook',  color: '#1877F2', Icon: Facebook },
                { key: 'instagram', label: 'Instagram', color: '#E1306C', Icon: Instagram },
                { key: 'tiktok',    label: 'TikTok',    color: '#010101', Icon: null },
              ].map(({ key, label, color, Icon }) => {
                const b = platformBreakdown[key];
                const maxVal = Math.max(b.organic, b.ads, 1);
                const organicPct = Math.round((b.organic / maxVal) * 100);
                const adsPct = Math.round((b.ads / maxVal) * 100);
                const totalPct = b.total > 0
                  ? Math.round((b.total / Math.max(siteVisitStats.totalVisits, 1)) * 100)
                  : 0;
                return (
                  <div key={key} className="rp-breakdown-card">
                    {/* Colored top accent */}
                    <div className="rp-breakdown-accent" style={{ background: color }} />
                    <div className="rp-breakdown-header" style={{ borderLeftColor: color }}>
                      <div className="rp-breakdown-header-icon" style={{ background: color + '18' }}>
                        {Icon ? <Icon size={18} color={color} /> : <TikTokIcon size={18} color={color} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <span className="rp-breakdown-platform-name" style={{ color }}>{label}</span>
                        <div className="rp-breakdown-share-bar-wrap">
                          <div className="rp-breakdown-share-bar" style={{ width: `${totalPct}%`, background: color }} />
                        </div>
                      </div>
                      <span className="rp-breakdown-total-badge" style={{ background: color + '15', color }}>
                        {formatCount(b.total)} total
                      </span>
                    </div>
                    <div className="rp-breakdown-body">
                      {/* Organic row */}
                      <div className="rp-breakdown-row">
                        <div className="rp-breakdown-type-wrap">
                          <div className="rp-breakdown-type-icon" style={{ background: '#f0fdf4' }}>
                            <Sprout size={13} color="#16a34a" />
                          </div>
                          <span className="rp-breakdown-type">Organic</span>
                        </div>
                        <div className="rp-breakdown-right">
                          <div className="rp-breakdown-mini-bar-wrap">
                            <div className="rp-breakdown-mini-bar" style={{ width: `${organicPct}%`, background: '#16a34a' }} />
                          </div>
                          <span className="rp-breakdown-value" style={{ color: '#16a34a' }}>{formatCount(b.organic)}</span>
                        </div>
                      </div>
                      {/* Paid Ads row */}
                      <div className="rp-breakdown-row">
                        <div className="rp-breakdown-type-wrap">
                          <div className="rp-breakdown-type-icon" style={{ background: '#fffbeb' }}>
                            <Megaphone size={13} color="#f59e0b" />
                          </div>
                          <span className="rp-breakdown-type">Paid Ads</span>
                        </div>
                        <div className="rp-breakdown-right">
                          <div className="rp-breakdown-mini-bar-wrap">
                            <div className="rp-breakdown-mini-bar" style={{ width: `${adsPct}%`, background: '#f59e0b' }} />
                          </div>
                          <span className="rp-breakdown-value" style={{ color: '#d97706' }}>{formatCount(b.ads)}</span>
                        </div>
                      </div>
                      {/* Total row */}
                      <div className="rp-breakdown-total">
                        <div className="rp-breakdown-type-wrap">
                          <div className="rp-breakdown-type-icon" style={{ background: color + '12' }}>
                            <Layers size={13} color={color} />
                          </div>
                          <span className="rp-breakdown-type" style={{ fontWeight: 700 }}>Total Visits</span>
                        </div>
                        <span className="rp-breakdown-value total" style={{ color }}>{formatCount(b.total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Overall Totals — enhanced */}
            <div className="rp-overall-breakdown">
              <div className="rp-overall-item">
                <div className="rp-overall-icon-wrap" style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}>
                  <Sprout size={22} color="#16a34a" />
                </div>
                <span className="rp-overall-label">Total Organic</span>
                <span className="rp-overall-value" style={{ color: '#16a34a' }}>{formatCount(overallBreakdown.organic)}</span>
                <span className="rp-overall-sub">across all platforms</span>
                <div className="rp-overall-pill" style={{ background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}>
                  <Sprout size={11} /> Organic Traffic
                </div>
              </div>
              <div className="rp-overall-divider" />
              <div className="rp-overall-item">
                <div className="rp-overall-icon-wrap" style={{ background: 'linear-gradient(135deg, #fef9c3, #fde68a)' }}>
                  <Megaphone size={22} color="#d97706" />
                </div>
                <span className="rp-overall-label">Total Paid Ads</span>
                <span className="rp-overall-value" style={{ color: '#d97706' }}>{formatCount(overallBreakdown.ads)}</span>
                <span className="rp-overall-sub">across all platforms</span>
                <div className="rp-overall-pill" style={{ background: '#fffbeb', color: '#d97706', borderColor: '#fde68a' }}>
                  <Megaphone size={11} /> Paid Traffic
                </div>
              </div>
              <div className="rp-overall-divider" />
              <div className="rp-overall-item rp-overall-item--grand">
                <div className="rp-overall-icon-wrap" style={{ background: 'linear-gradient(135deg, #dbeafe, #93c5fd)' }}>
                  <Layers size={22} color="#001f3f" />
                </div>
                <span className="rp-overall-label">Grand Total</span>
                <span className="rp-overall-value grand">{formatCount(overallBreakdown.total)}</span>
                <span className="rp-overall-sub">across all platforms</span>
                <div className="rp-overall-pill" style={{ background: '#eff6ff', color: '#001f3f', borderColor: '#93c5fd' }}>
                  <Layers size={11} /> All Traffic
                </div>
              </div>
            </div>
          </div>

        </section>


        {/* ── PAGE VIEW ANALYTICS ── */}
        <section className="rp-section">
          <div className="rp-pv-section">
            <div className="rp-pv-header">
              <div className="rp-pv-title-wrap">
                <Eye size={18} className="rp-pv-icon" />
                <h3 className="rp-pv-title">
                  PAGE VIEW ANALYTICS
                  <span className="rp-pv-period"> — {periodLabel}</span>
                </h3>
              </div>
              <span className="rp-pv-live-badge">● LIVE TRACKING</span>
            </div>

            {/* Stat cards grid */}
            <div className="rp-pv-grid">
              <div className="rp-pv-card">
                <div className="rp-pv-card-icon-wrap rp-pv-icon--total"><BarChart2 size={20} /></div>
                <div className="rp-pv-card-body">
                  <span className="rp-pv-card-label">TOTAL PAGE VIEWS</span>
                  <span className="rp-pv-card-value">{(filteredPageViewStats.totalViews || 0).toLocaleString()}</span>
                  <span className="rp-pv-card-sub">All pages combined</span>
                </div>
              </div>

              <div className="rp-pv-card">
                <div className="rp-pv-card-icon-wrap rp-pv-icon--packages"><ShoppingBag size={20} /></div>
                <div className="rp-pv-card-body">
                  <span className="rp-pv-card-label">PACKAGE DEALS PAGE</span>
                  <span className="rp-pv-card-value">{(filteredPageViewStats.packagesPageViews || 0).toLocaleString()}</span>
                  <span className="rp-pv-card-sub">Packages Visits</span>
                </div>
              </div>

              <div className="rp-pv-card">
                <div className="rp-pv-card-icon-wrap rp-pv-icon--booking"><Package size={20} /></div>
                <div className="rp-pv-card-body">
                  <span className="rp-pv-card-label">BOOKING PAGE</span>
                  <span className="rp-pv-card-value">{(filteredPageViewStats.bookingPageViews || 0).toLocaleString()}</span>
                  <span className="rp-pv-card-sub">Package Booking Views</span>
                </div>
              </div>

              <div className="rp-pv-card">
                <div className="rp-pv-card-icon-wrap rp-pv-icon--flights"><Eye size={20} /></div>
                <div className="rp-pv-card-body">
                  <span className="rp-pv-card-label">FLIGHT SEARCH</span>
                  <span className="rp-pv-card-value">{(filteredPageViewStats.flightsPageViews || 0).toLocaleString()}</span>
                  <span className="rp-pv-card-sub">Flights Visits</span>
                </div>
              </div>

              <div className="rp-pv-card">
                <div className="rp-pv-card-icon-wrap rp-pv-icon--services"><Activity size={20} /></div>
                <div className="rp-pv-card-body">
                  <span className="rp-pv-card-label">OTHER SERVICES</span>
                  <span className="rp-pv-card-value">{(filteredPageViewStats.servicesPageViews || 0).toLocaleString()}</span>
                  <span className="rp-pv-card-sub">Other Services Visits</span>
                </div>
              </div>

              <div className="rp-pv-card rp-pv-card--tours-highlight">
                <div className="rp-pv-card-icon-wrap rp-pv-icon--tours"><Map size={20} /></div>
                <div className="rp-pv-card-body">
                  <span className="rp-pv-card-label">TOUR PACKAGES</span>
                  <span className="rp-pv-card-value">{(filteredPageViewStats.toursPageViews || 0).toLocaleString()}</span>
                  <span className="rp-pv-card-sub">Tour Page Visits</span>
                </div>
              </div>

              <div className="rp-pv-card">
                <div className="rp-pv-card-icon-wrap rp-pv-icon--rate"><TrendingUp size={20} /></div>
                <div className="rp-pv-card-body">
                  <span className="rp-pv-card-label">VIEW-TO-BOOK RATE</span>
                  <span className="rp-pv-card-value rp-pv-rate-value">
                    {filteredPageViewStats.bookingPageViews > 0
                      ? ((filteredBookingCounts.totalConfirmedBookings / filteredPageViewStats.bookingPageViews) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                  <span className="rp-pv-card-sub">
                    {filteredBookingCounts.totalConfirmedBookings} Booked out of {filteredPageViewStats.bookingPageViews} Booking Page Views
                  </span>
                </div>
              </div>
            </div>

            {/* Top Viewed Packages */}
            {filteredPageViewStats.topViewedPackages && filteredPageViewStats.topViewedPackages.length > 0 && (
              <div className="rp-pv-top-packages">
                <h4 className="rp-pv-sub-title">
                  <Eye size={14} /> MOST VIEWED PACKAGES
                </h4>
                <div className="rp-pv-pkg-list">
                  {filteredPageViewStats.topViewedPackages.slice(0, 5).map((pkg, idx) => {
                    const maxViews = filteredPageViewStats.topViewedPackages[0]?.views || 1;
                    const barWidth = Math.max(8, Math.round((pkg.views / maxViews) * 100));
                    return (
                      <div key={idx} className="rp-pv-pkg-row">
                        <span className="rp-pv-pkg-rank">#{idx + 1}</span>
                        <div className="rp-pv-pkg-info">
                          <span className="rp-pv-pkg-name">{pkg.displayName || pkg.packageName || 'Unknown'}</span>
                          <div className="rp-pv-pkg-bar-wrap">
                            <div className="rp-pv-pkg-bar" style={{ width: `${barWidth}%` }} />
                          </div>
                        </div>
                        <span className="rp-pv-pkg-count">{(pkg.views || 0).toLocaleString()} views</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>


        {/* ── VISITOR JOURNEY TRACKER ── */}
        <section className="rp-section">
          <VisitorJourney recentViews={pageViewStats.recentViews} />
        </section>

        </div>{/* end rp-container */}
      </main>
    </div>
  );
};

export default Reporting;