import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, Plane, FileText, HeartHandshake, Package } from 'lucide-react';
import Sidebar from '../sidebar/sidebar';
import './dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('adminToken');
    if (!isLoggedIn) {
      navigate('/');
    }
  }, [navigate]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        toggleSidebar={toggleSidebar} 
      />
      
      <main className={`main-content fade-in ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <header className="top-bar">
          <div className="welcome-msg">
            <h2>Welcome back, Admin! 👋</h2>
            <p>Here's what's happening with your travel agency today.</p>
          </div>
          <div className="header-icons">
             <button className="icon-circle"><Bell size={20} /></button>
             <button className="icon-circle"><Search size={20} /></button>
          </div>
        </header>

        <div className="stats-grid">
          
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper blue">
                 <Plane size={24} />
              </div>
              <span className="percent-badge green">+12%</span>
            </div>
            <p className="stat-title">Total Bookings</p>
            <h3 className="stat-value">12</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper orange">
                 <FileText size={24} />
              </div>
              <span className="percent-badge orange">Action Needed</span>
            </div>
            <p className="stat-title">Pending Inquiries</p>
            <h3 className="stat-value">5</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper green">
                 <HeartHandshake size={24} />
              </div>
              <span className="percent-badge green">+5.2%</span>
            </div>
            <p className="stat-title">Total Sales</p>
            <h3 className="stat-value">₱ 150,000</h3>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon-wrapper purple">
                 <Package size={24} />
              </div>
               <span className="percent-badge gray">Active</span>
            </div>
            <p className="stat-title">Packages Listed</p>
            <h3 className="stat-value">28</h3>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;