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
  pageViewStats = {
    totalViews: 0,
    packagesPageViews: 0,
    bookingPageViews: 0,
    flightsPageViews: 0,
    servicesPageViews: 0,
    topViewedPackages: [],
    recentViews: [],
    dailyViewsData: [],
  }
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
            <h3 className="rev-pageviews-title">Page View Analytics</h3>
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
              <span className="rev-pv-card-value">{(pageViewStats.totalViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">All pages combined</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--packages">
            <div className="rev-pv-card-icon">
              <ShoppingBag size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Package Deals Page</span>
              <span className="rev-pv-card-value">{(pageViewStats.packagesPageViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">/packages visits</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--booking">
            <div className="rev-pv-card-icon">
              <Package size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Booking Page</span>
              <span className="rev-pv-card-value">{(pageViewStats.bookingPageViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">Package booking views</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--flights">
            <div className="rev-pv-card-icon">
              <Eye size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Flight Search</span>
              <span className="rev-pv-card-value">{(pageViewStats.flightsPageViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">/flights visits</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--services">
            <div className="rev-pv-card-icon">
              <Activity size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">Other Services</span>
              <span className="rev-pv-card-value">{(pageViewStats.servicesPageViews || 0).toLocaleString()}</span>
              <span className="rev-pv-card-sub">/services visits</span>
            </div>
          </div>

          <div className="rev-pv-card rev-pv-card--rate">
            <div className="rev-pv-card-icon">
              <TrendingUp size={22} />
            </div>
            <div className="rev-pv-card-body">
              <span className="rev-pv-card-label">View-to-Book Rate</span>
              <span className="rev-pv-card-value">
                {pageViewStats.packagesPageViews > 0
                  ? ((pageViewStats.bookingPageViews / pageViewStats.packagesPageViews) * 100).toFixed(1)
                  : '0.0'}%
              </span>
              <span className="rev-pv-card-sub">Booking / Packages views</span>
            </div>
          </div>
        </div>

        {/* Top Viewed Packages */}
        {pageViewStats.topViewedPackages && pageViewStats.topViewedPackages.length > 0 && (
          <div className="rev-pv-top-packages">
            <h4 className="rev-pv-sub-title">
              <Eye size={14} /> Most Viewed Packages
            </h4>
            <div className="rev-pv-pkg-list">
              {pageViewStats.topViewedPackages.slice(0, 5).map((pkg, idx) => {
                const maxViews = pageViewStats.topViewedPackages[0]?.views || 1;
                const barWidth = Math.max(8, Math.round((pkg.views / maxViews) * 100));
                return (
                  <div key={idx} className="rev-pv-pkg-row">
                    <span className="rev-pv-pkg-rank">#{idx + 1}</span>
                    <div className="rev-pv-pkg-info">
                      <span className="rev-pv-pkg-name">{pkg.packageName || pkg.label || 'Unknown'}</span>
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

        {/* Daily Views Sparkline */}
        {pageViewStats.dailyViewsData && pageViewStats.dailyViewsData.length > 0 && (
          <div className="rev-pv-daily">
            <h4 className="rev-pv-sub-title">
              <Calendar size={14} /> Views — Last 7 Days
            </h4>
            <div className="rev-pv-daily-bars">
              {pageViewStats.dailyViewsData.map((day, idx) => {
                const maxVal = Math.max(...pageViewStats.dailyViewsData.map(d => d.views), 1);
                const heightPct = Math.max(6, Math.round((day.views / maxVal) * 100));
                return (
                  <div key={idx} className="rev-pv-daily-col">
                    <div className="rev-pv-daily-bar-wrap">
                      <div
                        className="rev-pv-daily-bar"
                        style={{ height: `${heightPct}%` }}
                        title={`${day.date}: ${day.views} views`}
                      />
                    </div>
                    <span className="rev-pv-daily-label">{day.date}</span>
                    <span className="rev-pv-daily-count">{day.views}</span>
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