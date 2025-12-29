import React from "react";
import { 
  Plane, FileText, Package, 
  Map, Tag, MessageSquare, Users, 
  ArrowUp, AlertCircle, Briefcase, CheckCircle,
  PhilippinePeso 
} from "lucide-react";
import "./StatsCards.css";

const StatsCards = ({ stats }) => {
  const safeStats = stats || {};

  const statsData = [
    {
      icon: PhilippinePeso,
      color: "green",
      label: "Combined Revenue",
      value: `₱${(safeStats.combinedTotalRevenue / 1000000).toFixed(2)}M`,
      trend: safeStats.combinedTotalRevenue > 0 ? "+Active" : null
    },
    {
      icon: Plane,
      color: "blue",
      label: "Total Bookings",
      value: safeStats.totalBookings || 0,
      trend: safeStats.confirmedBookings > 0 ? `${safeStats.confirmedBookings} confirmed` : null
    },
    {
      icon: Briefcase,
      color: "purple",
      label: "Services Completed",
      value: safeStats.completedInquiries || 0,
      trend: safeStats.pendingInquiries > 0 ? `${safeStats.pendingInquiries} pending` : null
    },
    {
      icon: FileText,
      color: "orange",
      label: "Pending Items",
      value: (safeStats.pendingBookings || 0) + (safeStats.pendingInquiries || 0),
      alert: true
    },
    {
      icon: CheckCircle,
      color: "cyan",
      label: "Today's Revenue",
      value: `₱${((safeStats.todayRevenue || 0) / 1000).toFixed(1)}k`,
    },
    {
      icon: Package,
      color: "indigo",
      label: "Active Packages",
      value: safeStats.totalPackages || 0,
    },
    {
      icon: Tag,
      color: "pink",
      label: "Active Promos",
      value: safeStats.totalPromos || 0,
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