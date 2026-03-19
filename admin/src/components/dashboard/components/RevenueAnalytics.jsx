import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  TrendingUp, 
  Calendar, 
  Activity, 
  PhilippinePeso,
  Filter,
  ChevronDown,
  Clock,
  CalendarDays,
  Eye,
  ShoppingBag,
  BarChart2,
  Package
} from "lucide-react";
import "./RevenueAnalytics.css";

const RevenueAnalytics = ({ 
  stats, 
  revenueBreakdown, 
  onCustomRangeChange, 
  customData, 
  onViewModeChange,
  onDailyDateChange, 
  dailyData,
  onMonthChange, 
  monthlyData,
  onResetViewToBookRate,
  pageViewStats = {
    totalViews: 0,
    packagesPageViews: 0,
    bookingPageViews: 0,
    flightsPageViews: 0,
    servicesPageViews: 0,
    topViewedPackages: [],
    recentViews: [],
    dailyViewsData: [],
  },
  bookingCountStats = {
    totalBookingCounts: 0,
    topBookedPackages: [],
    recentBookingCounts: [],
  },
  allPackages = [],
}) => {
  const [viewMode, setViewMode] = useState("weekly"); 
  const [dateInputs, setDateInputs] = useState({ start: "", end: "" });
  const [selectedDailyDate, setSelectedDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const [isDailyDropdownOpen, setIsDailyDropdownOpen] = useState(false);
  const [isCustomDropdownOpen, setIsCustomDropdownOpen] = useState(false);
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  
  const dailyDropdownRef = useRef(null);
  const customDropdownRef = useRef(null);
  const monthDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dailyDropdownRef.current && !dailyDropdownRef.current.contains(event.target)) {
        setIsDailyDropdownOpen(false);
      }
      if (customDropdownRef.current && !customDropdownRef.current.contains(event.target)) {
        setIsCustomDropdownOpen(false);
      }
      if (monthDropdownRef.current && !monthDropdownRef.current.contains(event.target)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (onViewModeChange) {
      onViewModeChange(viewMode);
    }
  }, [viewMode, onViewModeChange]);

  const handleDailyDateChange = (e) => {
    const newDate = e.target.value;
    setSelectedDailyDate(newDate);
  };

  const applyDailyFilter = () => {
    setViewMode("daily");
    if (onDailyDateChange) {
      onDailyDateChange(selectedDailyDate);
    }
    setIsDailyDropdownOpen(false);
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const applyMonthFilter = () => {
    setViewMode("specificMonth");
    if (onMonthChange) {
      onMonthChange(selectedMonth);
    }
    setIsMonthDropdownOpen(false);
  };

  const handleApplyCustomRange = () => {
    if (dateInputs.start && dateInputs.end) {
      setViewMode("custom");
      onCustomRangeChange(dateInputs.start, dateInputs.end);
      setIsCustomDropdownOpen(false); 
    } else {
      alert("Please select both start and end dates.");
    }
  };

  const data = viewMode === "daily" 
    ? dailyData 
    : viewMode === "weekly" 
      ? revenueBreakdown.daily 
      : viewMode === "specificMonth"
        ? monthlyData
        : viewMode === "monthly" 
          ? revenueBreakdown.monthly 
          : customData;

  // FIXED: Total Sales computation - now uses the current filtered data
  const totalSalesInView = useMemo(() => {
    if (!data || data.length === 0) return 0;
    
    const total = data.reduce((sum, item) => {
      return sum + (item.totalRevenue || 0);
    }, 0);

    return total;
  }, [data]);

  // FIXED: Filtered Revenue Sources based on current view
  const filteredRevenueData = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        bookingsRevenue: 0,
        bookingsCount: 0,
        inquiriesRevenue: 0,
        inquiriesCount: 0
      };
    }

    const bookingsRev = data.reduce((sum, item) => sum + (item.bookingsRevenue || 0), 0);
    const inquiriesRev = data.reduce((sum, item) => sum + (item.inquiriesRevenue || 0), 0);

    // Count bookings and inquiries from the data if available
    const bookingsCount = data.reduce((sum, item) => sum + (item.bookings || 0), 0);
    const inquiriesCount = data.reduce((sum, item) => sum + (item.inquiries || 0), 0);

    return {
      bookingsRevenue: bookingsRev,
      bookingsCount: bookingsCount || stats.confirmedBookings,
      inquiriesRevenue: inquiriesRev,
      inquiriesCount: inquiriesCount || stats.completedInquiries
    };
  }, [data, stats]);

  // FIXED: This Month Revenue - should show selected month's total when specificMonth is active
  const displayedMonthRevenue = useMemo(() => {
    if (viewMode === "specificMonth" && monthlyData && monthlyData.length > 0) {
      return monthlyData.reduce((sum, item) => sum + (item.totalRevenue || 0), 0);
    }
    return stats.thisMonthRevenue;
  }, [viewMode, monthlyData, stats.thisMonthRevenue]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rev-custom-tooltip">
          <p className="rev-tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p 
              key={index} 
              style={{ color: entry.color }} 
              className="rev-tooltip-item"
            >
              {entry.name}: ₱{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getChartTitle = () => {
    if (viewMode === 'specificMonth') {
      const [year, month] = selectedMonth.split('-');
      const date = new Date(year, month - 1);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    return "Revenue Analytics";
  };

  // FIXED: Display label based on current view mode
  const getViewModeLabel = () => {
    switch(viewMode) {
      case 'daily': return 'Daily';
      case 'weekly': return 'Weekly';
      case 'specificMonth': return 'Monthly';
      case 'monthly': return '6 Months';
      case 'custom': return 'Custom Range';
      default: return 'Weekly';
    }
  };

  // ============================================================
  // SHARED DATE WINDOW — single source of truth used by BOTH
  // filteredPageViewStats and filteredBookingCounts so the
  // numerator (confirmed bookings) and denominator (booking page
  // views) of View-to-Book rate always cover the exact same period
  // ============================================================
  const analyticsDateWindow = useMemo(() => {
    const now = new Date();
    if (viewMode === 'daily') {
      const start = new Date(selectedDailyDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(selectedDailyDate); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (viewMode === 'weekly') {
      const start = new Date(now); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (viewMode === 'specificMonth') {
      const [year, month] = selectedMonth.split('-');
      const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
      const end   = new Date(year, month,     0, 23, 59, 59, 999);
      return { start, end };
    }
    if (viewMode === 'monthly') {
      const start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
      const end   = new Date(now); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    if (viewMode === 'custom' && dateInputs.start && dateInputs.end) {
      const start = new Date(dateInputs.start); start.setHours(0, 0, 0, 0);
      const end   = new Date(dateInputs.end);   end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    return { start: new Date(0), end: new Date() };
  }, [viewMode, selectedDailyDate, selectedMonth, dateInputs]);

  // ============================================================
  // FILTERED PAGE VIEW STATS — filtered using shared date window
  // ============================================================
  const filteredPageViewStats = useMemo(() => {
    const allViews = pageViewStats.recentViews || [];
    const { start, end } = analyticsDateWindow;

    const filtered = allViews.filter(v => {
      const d = new Date(v.createdAt);
      return d >= start && d <= end;
    });

    const totalViews        = filtered.length;
    const packagesPageViews = filtered.filter(v => v.page === 'packages').length;
    const bookingPageViews  = filtered.filter(v => v.page === 'booking').length;
    const flightsPageViews  = filtered.filter(v => v.page === 'flights').length;
    const servicesPageViews = filtered.filter(v => v.page === 'services').length;

    // Build lookups from allPackages for enrichment
    const pkgLookupById   = allPackages.reduce((acc, pkg) => { if (pkg._id) acc[String(pkg._id)] = pkg; return acc; }, {});
    const pkgLookupByName = allPackages.reduce((acc, pkg) => { if (pkg.title) acc[pkg.title] = pkg; return acc; }, {});

    const findPkgMatch = (storedName, storedId) => {
      if (storedId && pkgLookupById[String(storedId)]) return pkgLookupById[String(storedId)];
      if (storedName && pkgLookupByName[storedName])   return pkgLookupByName[storedName];
      if (storedName) {
        const lower = storedName.toLowerCase().trim();
        return allPackages.find(p => p.title && p.title.toLowerCase().includes(lower)) || null;
      }
      return null;
    };

    // Top viewed packages from booking views in this window
    const pkgCounts = {};
    filtered
      .filter(v => v.page === 'booking' && v.packageName)
      .forEach(v => {
        const key = v.packageName;
        if (!pkgCounts[key]) pkgCounts[key] = { count: 0, packageId: v.packageId || null };
        pkgCounts[key].count += 1;
      });

    const buildDisplayName = (storedName, match) => {
      if (!match) return storedName;
      const lower = storedName.toLowerCase();
      const hasDuration    = match.duration    && lower.includes(match.duration.toLowerCase());
      const hasDestination = match.destination && lower.includes(match.destination.toLowerCase());
      if (hasDuration || hasDestination) return storedName;
      const parts = [match.duration, match.destination, storedName].filter(Boolean);
      return parts.join(' ');
    };

    const topViewedPackages = Object.entries(pkgCounts)
      .map(([packageName, data]) => {
        const match = findPkgMatch(packageName, data.packageId);
        return {
          packageName,
          views:       data.count,
          displayName: buildDisplayName(packageName, match),
          destination: match?.destination || null,
          duration:    match?.duration    || null,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Build daily chart data within the window (max 31 bars)
    const dayMap = {};
    filtered.forEach(v => {
      const d = new Date(v.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dayMap[key] = (dayMap[key] || 0) + 1;
    });

    const dailyViewsData = [];
    const cursor = new Date(start); cursor.setHours(0, 0, 0, 0);
    const windowEnd = new Date(end); windowEnd.setHours(0, 0, 0, 0);
    let iterations = 0;
    while (cursor <= windowEnd && iterations < 31) {
      const key = cursor.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyViewsData.push({ date: key, views: dayMap[key] || 0 });
      cursor.setDate(cursor.getDate() + 1);
      iterations++;
    }

    // For 6-month trend, group into months
    let chartData = dailyViewsData;
    if (viewMode === 'monthly') {
      const monthMap = {};
      filtered.forEach(v => {
        const d = new Date(v.createdAt);
        const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        monthMap[key] = (monthMap[key] || 0) + 1;
      });
      chartData = Object.entries(monthMap)
        .map(([date, views]) => ({ date, views }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return {
      totalViews,
      packagesPageViews,
      bookingPageViews,
      flightsPageViews,
      servicesPageViews,
      topViewedPackages,
      dailyViewsData: chartData,
    };
  }, [analyticsDateWindow, pageViewStats.recentViews, viewMode, allPackages]);

  // ============================================================
  // BOOKING COUNTS for View-to-Book Rate
  // Numerator = ALL non-archived bookings (no date filter).
  // isArchive = "Yes" bookings are already excluded in dashboard.jsx
  // before being passed in via bookingCountStats.recentBookingCounts.
  // ============================================================
  const filteredBookingCounts = useMemo(() => {
    const allCounts = bookingCountStats.recentBookingCounts || [];

    const totalConfirmedBookings = allCounts.length;

    const pkgCounts = {};
    allCounts.forEach(c => {
      if (!c.packageName) return;
      pkgCounts[c.packageName] = (pkgCounts[c.packageName] || 0) + 1;
    });
    const topConfirmedPackages = Object.entries(pkgCounts)
      .map(([packageName, bookingCounts]) => ({ packageName, bookingCounts }))
      .sort((a, b) => b.bookingCounts - a.bookingCounts)
      .slice(0, 10);

    return { totalConfirmedBookings, topConfirmedPackages };
  }, [bookingCountStats.recentBookingCounts]);

  return (
    <div className="rev-widget">
      {/* Header */}
      <div className="rev-header">
        <div className="rev-header-left">
          <h2 className="rev-title">{viewMode === 'specificMonth' ? getChartTitle() : "Revenue Analytics"}</h2> 
          <p className="rev-subtitle">
            Comprehensive revenue tracking from bookings and services
          </p>
        </div>
        
        {/* Toggle Buttons & Dropdowns */}
        <div className="rev-controls-group">
          <div className="rev-toggle-group">
            
            {/* DAILY DROPDOWN */}
            <div className="rev-dropdown-container" ref={dailyDropdownRef}>
              <button
                className={`rev-toggle-btn ${viewMode === "daily" ? "active" : ""}`}
                onClick={() => setIsDailyDropdownOpen(!isDailyDropdownOpen)}
              >
                <Clock size={16} />
                Daily
                <ChevronDown size={14} className={`rev-chevron ${isDailyDropdownOpen ? 'open' : ''}`} />
              </button>

              {isDailyDropdownOpen && (
                <div className="rev-dropdown-menu">
                  <div className="rev-dropdown-header">Select Specific Date</div>
                  <div className="rev-calendar-inputs">
                    <div className="calendar-field">
                      <label>Date</label>
                      <input 
                        type="date" 
                        value={selectedDailyDate}
                        onChange={handleDailyDateChange}
                      />
                    </div>
                  </div>
                  <button className="rev-dropdown-apply" onClick={applyDailyFilter}>
                    View Daily
                  </button>
                </div>
              )}
            </div>

            <button
              className={`rev-toggle-btn ${viewMode === "weekly" ? "active" : ""}`}
              onClick={() => setViewMode("weekly")}
            >
              <Calendar size={16} />
              Weekly
            </button>

            {/* MONTHLY DROPDOWN */}
            <div className="rev-dropdown-container" ref={monthDropdownRef}>
              <button
                className={`rev-toggle-btn ${viewMode === "specificMonth" ? "active" : ""}`}
                onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
              >
                <CalendarDays size={16} />
                Monthly
                <ChevronDown size={14} className={`rev-chevron ${isMonthDropdownOpen ? 'open' : ''}`} />
              </button>

              {isMonthDropdownOpen && (
                <div className="rev-dropdown-menu">
                  <div className="rev-dropdown-header">Select Month</div>
                  <div className="rev-calendar-inputs">
                    <div className="calendar-field">
                      <label>Month</label>
                      <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={handleMonthChange}
                        max={new Date().toISOString().slice(0, 7)}
                      />
                    </div>
                  </div>
                  <button className="rev-dropdown-apply" onClick={applyMonthFilter}>
                    View Month
                  </button>
                </div>
              )}
            </div>

            <button
              className={`rev-toggle-btn ${viewMode === "monthly" ? "active" : ""}`}
              onClick={() => setViewMode("monthly")}
            >
              <Activity size={16} />
              Trend (6 Mo)
            </button>
            
            {/* Custom Range Dropdown */}
            <div className="rev-dropdown-container" ref={customDropdownRef}>
              <button
                className={`rev-toggle-btn rev-custom-btn ${viewMode === "custom" ? "active" : ""}`}
                onClick={() => setIsCustomDropdownOpen(!isCustomDropdownOpen)}
              >
                <Filter size={16} />
                Custom Range
                <ChevronDown size={14} className={`rev-chevron ${isCustomDropdownOpen ? 'open' : ''}`} />
              </button>

              {isCustomDropdownOpen && (
                <div className="rev-dropdown-menu">
                  <div className="rev-dropdown-header">Select Date Range</div>
                  <div className="rev-calendar-inputs">
                    <div className="calendar-field">
                      <label>From</label>
                      <input 
                        type="date" 
                        value={dateInputs.start}
                        onChange={(e) => setDateInputs({...dateInputs, start: e.target.value})}
                      />
                    </div>
                    <div className="calendar-field">
                      <label>To</label>
                      <input 
                        type="date" 
                        value={dateInputs.end}
                        onChange={(e) => setDateInputs({...dateInputs, end: e.target.value})}
                      />
                    </div>
                  </div>
                  <button className="rev-dropdown-apply" onClick={handleApplyCustomRange}>
                    Apply Range
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards - FIXED DATA SOURCES */}
      <div className="rev-summary-grid">
        <div className="rev-summary-card card-blue">
          <div className="rev-card-icon">
            <PhilippinePeso size={24} /> 
          </div>
          <div className="rev-card-content">
            <span className="rev-card-label">Today's Revenue</span>
            <h3 className="rev-card-value">
              ₱{stats.todayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h3>
            <span className="rev-card-sublabel">All sources combined</span>
          </div>
        </div>

        <div className="rev-summary-card card-green">
          <div className="rev-card-icon">
            <TrendingUp size={24} />
          </div>
          <div className="rev-card-content">
            <span className="rev-card-label">
              {viewMode === 'specificMonth' ? 'Selected Month' : 'This Month'}
            </span>
            <h3 className="rev-card-value">
              ₱{displayedMonthRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h3>
            <span className="rev-card-sublabel">
              {viewMode === 'specificMonth' ? 'Month total' : 'Current month total'}
            </span>
          </div>
        </div>

        <div className="rev-summary-card card-purple">
          <div className="rev-card-icon">
            <PhilippinePeso size={24} />
          </div>
          <div className="rev-card-content">
            <span className="rev-card-label">Total Revenue</span>
            <h3 className="rev-card-value">
              ₱{stats.combinedTotalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h3>
            <span className="rev-card-sublabel">All-time combined</span>
          </div>
        </div>
      </div>

      {/* Revenue Sources Breakdown - FIXED: Now shows filtered data */}
      <div className="rev-sources-section">
        <h3 className="rev-sources-title">Revenue Sources ({getViewModeLabel()})</h3>
        <div className="rev-sources-grid">
          <div className="rev-source-item">
            <div className="rev-source-header">
              <span className="rev-source-dot dot-bookings"></span>
              <span className="rev-source-label">Bookings Revenue</span>
            </div>
            <div className="rev-source-value">
              ₱{filteredRevenueData.bookingsRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="rev-source-count">From selected period</div>
          </div>

          <div className="rev-source-item">
            <div className="rev-source-header">
              <span className="rev-source-dot dot-inquiries"></span>
              <span className="rev-source-label">Services Revenue</span>
            </div>
            <div className="rev-source-value">
              ₱{filteredRevenueData.inquiriesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="rev-source-count">From selected period</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="rev-chart-container">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <defs>
              <linearGradient id="bookingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.4}/>
              </linearGradient>
              <linearGradient id="inquiriesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.4}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey={viewMode === "monthly" ? "month" : "date"} 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}} 
              dy={10} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{fill: '#64748b', fontSize: 12}}
              tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Bar 
              dataKey="bookingsRevenue" 
              fill="url(#bookingsGradient)" 
              radius={[8, 8, 0, 0]}
              name="Bookings Revenue"
            />
            <Bar 
              dataKey="inquiriesRevenue" 
              fill="url(#inquiriesGradient)" 
              radius={[8, 8, 0, 0]}
              name="Services Revenue"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue Comparison - FIXED: Now shows filtered data */}
      <div className="rev-comparison">
        <div className="rev-comparison-item">
          <span className="rev-comparison-label">
            Total Sales ({getViewModeLabel()})
          </span>
          <span className="rev-comparison-value">
            ₱{totalSalesInView.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div> 
        <div className="rev-comparison-divider"></div>
        <div className="rev-comparison-item">
          <span className="rev-comparison-label">Bookings Share</span>
          <span className="rev-comparison-value">
            {totalSalesInView > 0 ? ((filteredRevenueData.bookingsRevenue / totalSalesInView) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div className="rev-comparison-divider"></div>
        <div className="rev-comparison-item">
          <span className="rev-comparison-label">Services Share</span>
          <span className="rev-comparison-value">
            {totalSalesInView > 0 ? ((filteredRevenueData.inquiriesRevenue / totalSalesInView) * 100).toFixed(1) : 0}%
          </span>
        </div>
      </div>

      {/* ─── PAGE VIEWS ANALYTICS SECTION ─── */}
      <div className="rev-pageviews-section">
        <div className="rev-pageviews-header">
          <div className="rev-pageviews-title-wrap">
            <Eye size={18} className="rev-pageviews-icon" />
            <h3 className="rev-pageviews-title">
              Page View Analytics
              <span className="rev-pageviews-period">— {getViewModeLabel()}</span>
            </h3>
          </div>
          <span className="rev-pageviews-badge">Live Tracking</span>
        </div>

        {/* Summary row */}
        <div className="rev-pageviews-summary">
          <div className="rev-pv-card rev-pv-card--total">
            <div className="rev-pv-card-icon">
              <BarChart2 size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Total Page Views</span>
              <span className="rev-pv-card-value">{(filteredPageViewStats.totalViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">All pages combined</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--packages">
            <div className="rev-pv-card-icon">
              <ShoppingBag size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Package Deals Page</span>
              <span className="rev-pv-card-value">{(filteredPageViewStats.packagesPageViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">Packages Visits</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--booking">
            <div className="rev-pv-card-icon">
              <Package size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Booking Page</span>
              <span className="rev-pv-card-value">{(filteredPageViewStats.bookingPageViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">Package Booking Views</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--flights">
            <div className="rev-pv-card-icon">
              <Eye size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Flight Search</span>
              <span className="rev-pv-card-value">{(filteredPageViewStats.flightsPageViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">Flights Visits</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--services">
            <div className="rev-pv-card-icon">
              <Activity size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Other Services</span>
              <span className="rev-pv-card-value">{(filteredPageViewStats.servicesPageViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">Other Services Visits</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--rate">
            <div className="rev-pv-card-icon">
              <TrendingUp size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">View-to-Book Rate</span>
              <span className="rev-pv-card-value">
                {filteredPageViewStats.bookingPageViews > 0
                  ? ((filteredBookingCounts.totalConfirmedBookings / filteredPageViewStats.bookingPageViews) * 100).toFixed(1)
                  : '0.0'}%
              </span>
              <span className="rev-pv-card-sub">
                {filteredBookingCounts.totalConfirmedBookings} Booked out of {filteredPageViewStats.bookingPageViews} Booking Page Views
              </span>
              {onResetViewToBookRate && (
                <button
                  className="rev-pv-reset-btn"
                  onClick={onResetViewToBookRate}
                  title="Reset View-to-Book Rate"
                >
                  Reset Rate
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Top Viewed Packages */}
        {filteredPageViewStats.topViewedPackages && filteredPageViewStats.topViewedPackages.length > 0 && (
          <div className="rev-pv-top-packages">
            <h4 className="rev-pv-sub-title">
              <Eye size={14} /> Most Viewed Packages
            </h4>
            <div className="rev-pv-pkg-list">
              {filteredPageViewStats.topViewedPackages.slice(0, 5).map((pkg, idx) => {
                const maxViews = filteredPageViewStats.topViewedPackages[0]?.views || 1;
                const barWidth = Math.max(8, Math.round((pkg.views / maxViews) * 100));
                return (
                  <div key={idx} className="rev-pv-pkg-row">
                    <span className="rev-pv-pkg-rank">#{idx + 1}</span>
                    <div className="rev-pv-pkg-info">
                      <span className="rev-pv-pkg-name">{pkg.displayName || pkg.packageName || pkg.label || 'Unknown'}</span>
                      <div className="rev-pv-pkg-bar-wrap">
                        <div
                          className="rev-pv-pkg-bar"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <span className="rev-pv-pkg-count">{(pkg.views || 0).toLocaleString()} views</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueAnalytics;