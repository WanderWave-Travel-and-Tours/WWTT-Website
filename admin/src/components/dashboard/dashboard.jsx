import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import DashboardHeader from "./components/DashboardHeader";
import StatsCards from "./components/StatsCards";
import FinancialOverview from "./components/FinancialOverview";
import ChartsSection from "./components/ChartsSection";
import RecentBookings from "./components/RecentBookings";
import TopPackages from "./components/TopPackages";
import RevenueAnalytics from "./components/RevenueAnalytics";
import { exportToPDF } from "./utils/pdfExport";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const TIMEOUT_IN_MS = 15 * 60 * 1000; // 15 Minutes
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // State initialization
  const [stats, setStats] = useState({
    totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0,
    totalRevenue: 0, totalPackages: 0, totalBlogs: 0, totalPromos: 0,
    totalTestimonials: 0, totalSellerCost: 0, totalMarkup: 0, totalSales: 0,
    profitMargin: 0, totalInquiriesRevenue: 0, completedInquiries: 0,
    pendingInquiries: 0, combinedTotalRevenue: 0, todayRevenue: 0, thisMonthRevenue: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [topPackages, setTopPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState({ daily: [], monthly: [] });

  // Sidebar Toggle matching Archive.jsx behavior
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleAutoLogout = useCallback(() => {
    console.warn("Admin session expired due to inactivity.");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    alert("⚠️ Security Alert: Your session has expired due to inactivity. Please log in again.");
    navigate("/admin"); 
  }, [navigate]);

  useEffect(() => {
    let timeoutId;
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleAutoLogout, TIMEOUT_IN_MS);
    };
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    resetTimer();
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [handleAutoLogout]);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminToken");
    if (!isLoggedIn) {
      navigate("/");
    } else {
      fetchDashboardData();
    }
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    let bookings = [], packages = [], blogs = [], promos = [], testimonials = [], inquiries = [];

    try {
      const bookingsRes = await fetch("http://localhost:5000/api/admin/bookings");
      if (bookingsRes.ok) bookings = await bookingsRes.json();
      
      const packagesRes = await fetch("http://localhost:5000/api/packages");
      if (packagesRes.ok) packages = await packagesRes.json();

      const blogsRes = await fetch("http://localhost:5000/api/blogs");
      if (blogsRes.ok) blogs = await blogsRes.json();

      const promosRes = await fetch("http://localhost:5000/api/promos");
      if (promosRes.ok) promos = await promosRes.json();

      const testimonialsRes = await fetch("http://localhost:5000/api/testimonials");
      if (testimonialsRes.ok) testimonials = await testimonialsRes.json();

      const inquiriesRes = await fetch("http://localhost:5000/api/inquiries");
      if (inquiriesRes.ok) {
        const inquiriesData = await inquiriesRes.json();
        inquiries = inquiriesData.data || inquiriesData || [];
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    }

    try {
      // Calculation Logic Preserved
      if (!Array.isArray(bookings)) bookings = [];
      if (!Array.isArray(inquiries)) inquiries = [];

      const confirmed = bookings.filter((b) => b.status === "confirmed").length;
      const pending = bookings.filter((b) => b.status === "pending").length;
      const cancelled = bookings.filter((b) => b.status === "cancelled").length;
      
      const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
      const bookingsRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const financialStats = confirmedBookings.reduce((acc, booking) => {
          const pax = (booking.pax?.adult || 1) + (booking.pax?.children || 0) + (booking.pax?.infants || 0);
          if (booking.sellerPrice && booking.markup) {
            acc.totalSellerCost += booking.sellerPrice * pax;
            acc.totalMarkup += booking.markup * pax;
            acc.totalSales += booking.totalAmount || 0;
          }
          return acc;
        }, { totalSellerCost: 0, totalMarkup: 0, totalSales: 0 });

      const completedInquiries = inquiries.filter((i) => i.status === "COMPLETED");
      const pendingInquiriesCount = inquiries.filter((i) => i.status !== "COMPLETED").length;
      const inquiriesRevenue = completedInquiries.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

      const combinedRevenue = bookingsRevenue + inquiriesRevenue;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayBookingsRevenue = confirmedBookings.filter((b) => {
          const created = new Date(b.createdAt);
          return created >= today && created < tomorrow;
        }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const todayInquiriesRevenue = completedInquiries.filter((i) => {
          const updated = new Date(i.updatedAt);
          return updated >= today && updated < tomorrow;
        }).reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

      const todayTotalRevenue = todayBookingsRevenue + todayInquiriesRevenue;

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);

      const monthBookingsRevenue = confirmedBookings.filter((b) => {
          const created = new Date(b.createdAt);
          return created >= startOfMonth && created <= endOfMonth;
        }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const monthInquiriesRevenue = completedInquiries.filter((i) => {
          const updated = new Date(i.updatedAt);
          return updated >= startOfMonth && updated <= endOfMonth;
        }).reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

      const monthTotalRevenue = monthBookingsRevenue + monthInquiriesRevenue;

      const profitMargin = financialStats.totalSales > 0
          ? ((financialStats.totalMarkup / financialStats.totalSales) * 100).toFixed(1) : 0;

      setStats({
        totalBookings: bookings.length, confirmedBookings: confirmed, pendingBookings: pending,
        cancelledBookings: cancelled, totalRevenue: bookingsRevenue,
        totalPackages: Array.isArray(packages) ? packages.length : 0,
        totalBlogs: Array.isArray(blogs) ? blogs.length : 0,
        totalPromos: Array.isArray(promos) ? promos.length : 0,
        totalTestimonials: Array.isArray(testimonials) ? testimonials.length : 0,
        totalSellerCost: financialStats.totalSellerCost,
        totalMarkup: financialStats.totalMarkup,
        totalSales: financialStats.totalSales,
        profitMargin: profitMargin,
        totalInquiriesRevenue: inquiriesRevenue,
        completedInquiries: completedInquiries.length,
        pendingInquiries: pendingInquiriesCount,
        combinedTotalRevenue: combinedRevenue,
        todayRevenue: todayTotalRevenue,
        thisMonthRevenue: monthTotalRevenue,
      });

      // Trend Data Logic
      const trendData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear();
        const start = new Date(year, date.getMonth(), 1);
        const end = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

        const confirmedThisMonth = bookings.filter((b) => {
          const created = new Date(b.createdAt);
          return b.status === "confirmed" && created >= start && created <= end;
        });

        const completedInquiriesThisMonth = inquiries.filter((i) => {
          const updated = new Date(i.updatedAt);
          return i.status === "COMPLETED" && updated >= start && updated <= end;
        });

        const bRev = confirmedThisMonth.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const iRev = completedInquiriesThisMonth.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

        trendData.push({
          month: monthName, bookings: confirmedThisMonth.length, bookingsRevenue: bRev,
          inquiries: completedInquiriesThisMonth.length, inquiriesRevenue: iRev,
          totalRevenue: bRev + iRev,
        });
      }
      setTrendData(trendData);

      // Revenue Breakdown Logic
      const dailyBreakdown = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const dBookings = confirmedBookings.filter((b) => {
            const created = new Date(b.createdAt);
            return created >= date && created < nextDay;
          }).reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        const dInquiries = completedInquiries.filter((i) => {
            const updated = new Date(i.updatedAt);
            return updated >= date && updated < nextDay;
          }).reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);

        dailyBreakdown.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          bookingsRevenue: dBookings, inquiriesRevenue: dInquiries,
          totalRevenue: dBookings + dInquiries,
        });
      }

      setRevenueBreakdown({
        daily: dailyBreakdown,
        monthly: trendData.map(m => ({
          month: m.month, bookingsRevenue: m.bookingsRevenue,
          inquiriesRevenue: m.inquiriesRevenue, totalRevenue: m.totalRevenue,
        })),
      });

      // Recent Bookings Formatting
      setRecentBookings(bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map((b) => ({
          id: b._id, client: b.fullName, package: b.packageName,
          date: new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: b.status, amount: `₱${(b.totalAmount || 0).toLocaleString()}`,
        })));

      // Top Packages Formatting
      const packageStats = {};
      bookings.forEach((b) => {
        const pkg = b.packageName || "Unknown";
        if (!packageStats[pkg]) packageStats[pkg] = { bookings: 0, revenue: 0 };
        packageStats[pkg].bookings += 1;
        packageStats[pkg].revenue += b.totalAmount || 0;
      });

      setTopPackages(Object.entries(packageStats).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([name, data]) => ({
          name, bookings: data.bookings, revenue: `₱${data.revenue.toLocaleString()}`, revenueValue: data.revenue,
        })));

    } catch (calcErr) {
      console.error("Error in calculations:", calcErr);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    const pdfTopPackages = topPackages.map((pkg) => ({
      ...pkg, revenue: typeof pkg.revenue === 'string' ? pkg.revenue.replace('₱', 'PHP ') : pkg.revenue
    }));
    exportToPDF(stats, trendData, pdfTopPackages);
  };

  if (loading) {
    return (
      <div className="dash-page">
        <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
        <main className={`dash-main ${isSidebarCollapsed ? "dash-main--collapsed" : ""}`}>
          <div className="dash-loading">
            <div className="dash-spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
 
      {/* Structure strictly follows Archive.jsx:
         dash-main handles the margins/padding.
         dash-container holds the content.
      */}
      <main className={`dash-main ${isSidebarCollapsed ? "dash-main--collapsed" : ""}`}>
        <div className="dash-container">
          <DashboardHeader stats={stats} onExportPDF={handleExportPDF} />

          <StatsCards stats={stats} />

          <RevenueAnalytics stats={stats} revenueBreakdown={revenueBreakdown} />

          <FinancialOverview stats={stats} />

          <ChartsSection trendData={trendData} stats={stats} topPackages={topPackages} />

          {/* Grid for Bottom Section */}
          <div className="dash-grid">
            <RecentBookings bookings={recentBookings} onViewAll={() => navigate("/booking")} />
            <TopPackages packages={topPackages} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;