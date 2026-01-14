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
  PhilippinePeso // Updated import
} from "lucide-react";
import "./RevenueAnalytics.css";

const RevenueAnalytics = ({ stats, revenueBreakdown }) => {
  const [viewMode, setViewMode] = useState("daily"); // 'daily' or 'monthly'

  const data = viewMode === "daily" 
    ? revenueBreakdown.daily 
    : revenueBreakdown.monthly;

  // --- NEW: DYNAMIC AVERAGE COMPUTATION ---
  const dynamicAverage = useMemo(() => {
    if (!data || data.length === 0) return 0;
    
    // Kunin ang total revenue sa kasalukuyang "data" na nakikita sa chart
    const totalInView = data.reduce((sum, item) => {
      // Isama pareho ang bookings at inquiries revenue
      return sum + (item.bookingsRevenue || 0) + (item.inquiriesRevenue || 0);
    }, 0);

    // I-divide ang total sa length ng array (bilang ng bars sa chart)
    return totalInView / data.length;
  }, [data]);

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

  return (
    <div className="rev-widget">
      {/* Header */}
      <div className="rev-header">
        <div className="rev-header-left">
          <h2 className="rev-title">Revenue Analytics</h2>
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

            <button
              className={`rev-toggle-btn ${viewMode === "monthly" ? "active" : ""}`}
              onClick={() => setViewMode("monthly")}
            >
              <Activity size={16} />
              Monthly
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

      {/* Summary Cards */}
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
            <span className="rev-card-label">This Month</span>
            <h3 className="rev-card-value">
              ₱{stats.thisMonthRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </h3>
            <span className="rev-card-sublabel">Current month total</span>
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

      {/* Revenue Sources Breakdown */}
      <div className="rev-sources-section">
        <h3 className="rev-sources-title">Revenue Sources</h3>
        <div className="rev-sources-grid">
          <div className="rev-source-item">
            <div className="rev-source-header">
              <span className="rev-source-dot dot-bookings"></span>
              <span className="rev-source-label">Bookings Revenue</span>
            </div>
            <div className="rev-source-value">
              ₱{stats.totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="rev-source-count">{stats.confirmedBookings} confirmed bookings</div>
          </div>

          <div className="rev-source-item">
            <div className="rev-source-header">
              <span className="rev-source-dot dot-inquiries"></span>
              <span className="rev-source-label">Services Revenue</span>
            </div>
            <div className="rev-source-value">
              ₱{stats.totalInquiriesRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
            <div className="rev-source-count">{stats.completedInquiries} completed services</div>
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
              dataKey={viewMode === "daily" ? "date" : "month"} 
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

      {/* Revenue Comparison */}
      <div className="rev-comparison">
        <div className="rev-comparison-item">
          <span className="rev-comparison-label">
            Total Sales ({viewMode.charAt(0).toUpperCase() + viewMode.slice(1)})
          </span>
          <span className="rev-comparison-value">
            ₱{dynamicAverage.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
        </div> 
        <div className="rev-comparison-divider"></div>
        <div className="rev-comparison-item">
          <span className="rev-comparison-label">Bookings Share</span>
          <span className="rev-comparison-value">
            {((stats.totalRevenue / stats.combinedTotalRevenue) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="rev-comparison-divider"></div>
        <div className="rev-comparison-item">
          <span className="rev-comparison-label">Services Share</span>
          <span className="rev-comparison-value">
            {((stats.totalInquiriesRevenue / stats.combinedTotalRevenue) * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default RevenueAnalytics;