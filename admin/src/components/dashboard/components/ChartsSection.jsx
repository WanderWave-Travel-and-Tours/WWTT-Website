import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Activity, TrendingUp, Package } from "lucide-react";
import "./ChartsSection.css";

const ChartsSection = ({ trendData, stats, topPackages }) => {
  const statusData = [
    { name: "Confirmed", value: stats?.confirmedBookings || 0, color: "#10b981" }, // Emerald Green
    { name: "Pending", value: stats?.pendingBookings || 0, color: "#f59e0b" },   // Amber
    { name: "Cancelled", value: stats?.cancelledBookings || 0, color: "#ef4444" }, // Red
  ];

  const packageData = topPackages?.map((pkg) => ({
    name: pkg.name.length > 15 ? pkg.name.substring(0, 15) + "..." : pkg.name,
    fullName: pkg.name,
    bookings: pkg.bookings,
  })) || [];

  // Custom Tooltip para mas malinis tignan
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="tooltip-item">
              {entry.name}: {entry.name.includes("Revenue") ? `₱${entry.value.toLocaleString()}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dash-grid">
      {/* SECTION 1: TRENDS (Full Width) - NOW WITH COMBINED REVENUE */}
      <section className="dash-section dash-section--wide">
        <div className="dash-section-header">
          <div>
            <h2 className="dash-section-title">Combined Revenue Trends</h2>
            <p className="dash-section-subtitle">Bookings + Services revenue over 6 months</p>
          </div>
          <div className="icon-wrapper">
            <Activity size={20} />
          </div>
        </div>
        
        <div className="dash-chart-container">
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTotalRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBookingsRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorInquiriesRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              {/* Total Revenue Line (Main) */}
              <Area
                type="monotone"
                dataKey="totalRevenue"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorTotalRevenue)"
                name="Total Revenue (₱)"
              />
              
              {/* Bookings Revenue */}
              <Area
                type="monotone"
                dataKey="bookingsRevenue"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorBookingsRevenue)"
                name="Bookings Revenue (₱)"
              />
              
              {/* Inquiries Revenue */}
              <Area
                type="monotone"
                dataKey="inquiriesRevenue"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorInquiriesRevenue)"
                name="Services Revenue (₱)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SECTION 2: STATUS PIE CHART */}
      <section className="dash-section">
        <div className="dash-section-header">
           <div>
            <h2 className="dash-section-title">Booking Status</h2>
            <p className="dash-section-subtitle">Distribution by status</p>
          </div>
          <div className="icon-wrapper warning">
            <TrendingUp size={20} />
          </div>
        </div>
        
        <div className="dash-chart-container pie-container">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Centered Total or Label inside Pie (Optional visual) */}
          <div className="pie-center-text">
            <span className="pie-total">{stats?.confirmedBookings + stats?.pendingBookings + stats?.cancelledBookings || 0}</span>
            <span className="pie-label">Total</span>
          </div>
        </div>

        <div className="dash-status-summary">
          {statusData.map((item, index) => (
            <div className="status-item" key={index}>
              <span className="status-dot" style={{ backgroundColor: item.color }}></span>
              <span className="status-name">{item.name}</span>
              <span className="status-value">{item.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3: TOP PACKAGES BAR CHART */}
      <section className="dash-section">
        <div className="dash-section-header">
           <div>
            <h2 className="dash-section-title">Top Packages</h2>
            <p className="dash-section-subtitle">Most popular destinations</p>
          </div>
          <div className="icon-wrapper info">
            <Package size={20} />
          </div>
        </div>

        <div className="dash-chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={packageData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                tick={{fontSize: 12, fill: '#475569'}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="bookings" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default ChartsSection;