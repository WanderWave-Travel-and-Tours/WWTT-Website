import React from "react";
import { 
  Plane, FileText, DollarSign, Package, 
  Map, Tag, MessageSquare, Users, 
  ArrowUp, AlertCircle 
} from "lucide-react";
import "./StatsCards.css";

const StatsCards = ({ stats }) => {
  const safeStats = stats || {};

  const statsData = [
    {
      icon: DollarSign,
      color: "green",
      label: "Total Revenue",
      value: `₱${(safeStats.totalRevenue / 1000000).toFixed(2)}M`,
      trend: "+12%"
    },
    {
      icon: Plane,
      color: "blue",
      label: "Total Bookings",
      value: safeStats.totalBookings || 0,
      trend: "+5"
    },
    {
      icon: FileText,
      color: "orange",
      label: "Pending Bookings",
      value: safeStats.pendingBookings || 0,
      alert: true
    },
    {
      icon: Users,
      color: "cyan",
      label: "Total Clients",
      value: safeStats.totalClients || 0,
    },
    {
      icon: Map,
      color: "indigo",
      label: "Total Tours",
      value: safeStats.totalTours || 0,
    },
    {
      icon: Package,
      color: "purple",
      label: "Active Packages",
      value: safeStats.totalPackages || 0,
    },
    {
      icon: Tag,
      color: "pink",
      label: "Active Promos",
      value: safeStats.activePromos || 0,
    },
    {
      icon: MessageSquare,
      color: "yellow",
      label: "Testimonials",
      value: safeStats.totalTestimonials || 0,
    },
  ];

  return (
    <div className="stats-container">
      {statsData.map((stat, index) => (
        <div key={index} className="stat-card-wide">
          <div className={`stat-icon-box box-${stat.color}`}>
            <stat.icon size={28} strokeWidth={2.5} />
          </div>
          
          <div className="stat-details">
            <span className="stat-label-text">{stat.label}</span>
            <div className="stat-number-row">
              <h3 className="stat-number">{stat.value}</h3>
              
              {stat.trend && (
                <span className="stat-badge badge-success">
                  <ArrowUp size={12} /> {stat.trend}
                </span>
              )}
              {stat.alert && (
                <span className="stat-badge badge-warning">
                  <AlertCircle size={12} /> Action
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;