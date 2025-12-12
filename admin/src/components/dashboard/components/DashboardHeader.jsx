import React from "react";
import { Bell, Search, Download } from "lucide-react";
import "./DashboardHeader.css";

const DashboardHeader = ({ stats, onExportPDF }) => {
  return (
    <header className="dash-header">
      <div className="dash-header-left">
        <h1 className="dash-title">DASHBOARD</h1>
        <p className="dash-subtitle">
          Welcome back, Admin! Here's what's happening today.
        </p>
      </div>
      <div className="dash-header-actions">
        <button
          className="dash-icon-btn"
          onClick={onExportPDF}
          title="Export to PDF"
        >
          <Download size={18} />
        </button>
        <button className="dash-icon-btn">
          <Search size={18} />
        </button>
        <button className="dash-icon-btn dash-icon-btn--notif">
          <Bell size={18} />
          <span className="dash-notif-badge">
            {stats.pendingBookings}
          </span>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;