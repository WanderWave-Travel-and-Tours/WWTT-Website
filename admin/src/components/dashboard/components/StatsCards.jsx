import React from "react";
import { 
  Plane, FileText, Package, 
  Map, Tag, MessageSquare, Users, 
  ArrowUp, AlertCircle, Briefcase, CheckCircle,
  PhilippinePeso 
} from "lucide-react";
import "./StatsCards.css";

// Background images - TOURIST DESTINATIONS/SPOTS AROUND THE WORLD
const CARD_BACKGROUNDS = {
  revenue: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop', // Paris Eiffel Tower
  bookings: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop', // Mountain landscape
  services: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop', // Beach/tropical
  pending: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop', // City skyline
  today: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop', // Road trip
  packages: 'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&h=600&fit=crop', // Bali temple
  promos: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=600&fit=crop', // Maldives beach
  testimonials: 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&h=600&fit=crop' // Greece Santorini
};

const StatsCards = ({ stats }) => {
  const safeStats = stats || {};

  const statsData = [
    {
      icon: PhilippinePeso,
      color: "green",
      label: "Combined Revenue",
      value: `₱${(safeStats.combinedTotalRevenue / 1000000).toFixed(2)}M`,
      trend: safeStats.combinedTotalRevenue > 0 ? "+Active" : null,
      bgImage: CARD_BACKGROUNDS.revenue
    },
    {
      icon: Plane,
      color: "blue",
      label: "Total Bookings",
      value: safeStats.totalBookings || 0,
      trend: safeStats.confirmedBookings > 0 ? `${safeStats.confirmedBookings} confirmed` : null,
      bgImage: CARD_BACKGROUNDS.bookings
    },
    {
      icon: Briefcase,
      color: "purple",
      label: "Services Completed",
      value: safeStats.completedInquiries || 0,
      trend: safeStats.pendingInquiries > 0 ? `${safeStats.pendingInquiries} pending` : null,
      bgImage: CARD_BACKGROUNDS.services
    },
    {
      icon: FileText,
      color: "orange",
      label: "Pending Items",
      value: (safeStats.pendingBookings || 0) + (safeStats.pendingInquiries || 0),
      alert: true,
      bgImage: CARD_BACKGROUNDS.pending
    },
    {
      icon: CheckCircle,
      color: "cyan",
      label: "Today's Revenue",
      value: `₱${((safeStats.todayRevenue || 0) / 1000).toFixed(1)}k`,
      bgImage: CARD_BACKGROUNDS.today
    },
    {
      icon: Package,
      color: "indigo",
      label: "Active Packages",
      value: safeStats.totalPackages || 0,
      bgImage: CARD_BACKGROUNDS.packages
    },
    {
      icon: Tag,
      color: "pink",
      label: "Active Promos",
      value: safeStats.totalPromos || 0,
      bgImage: CARD_BACKGROUNDS.promos
    },
    {
      icon: MessageSquare,
      color: "yellow",
      label: "Testimonials",
      value: safeStats.totalTestimonials || 0,
      bgImage: CARD_BACKGROUNDS.testimonials
    },
  ];

  return (
    <div className="stats-container">
      {statsData.map((stat, index) => (
        <div 
          key={index} 
          className="stat-card-wide"
          style={{ backgroundImage: `url(${stat.bgImage})` }}
        >
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
          
          <div className="stat-icon-box">
            <stat.icon size={28} strokeWidth={2.5} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;