import React from "react";
import { Package, FileText, Tag, MessageSquare } from "lucide-react";
import "./FooterStats.css";

const FooterStats = ({ stats }) => {
  const footerStatsData = [
    {
      icon: Package,
      value: stats.totalPackages,
      label: "Total Packages",
    },
    {
      icon: FileText,
      value: stats.totalBlogs,
      label: "Blog Posts",
    },
    {
      icon: Tag,
      value: stats.totalPromos,
      label: "Active Promos",
    },
    {
      icon: MessageSquare,
      value: stats.totalTestimonials,
      label: "Testimonials",
    },
  ];

  return (
    <div className="dash-footer-stats">
      {footerStatsData.map((stat, index) => (
        <div key={index} className="dash-footer-stat">
          <stat.icon size={20} />
          <div>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FooterStats;