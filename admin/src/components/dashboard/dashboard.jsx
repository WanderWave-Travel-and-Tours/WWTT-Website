import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import DashboardHeader from "./components/DashboardHeader";
import StatsCards from "./components/StatsCards";
import FinancialOverview from "./components/FinancialOverview";
import ChartsSection from "./components/ChartsSection";
import RecentBookings from "./components/RecentBookings";
import TopPackages from "./components/TopPackages";
import QuickActions from "./components/QuickActions";
import FooterStats from "./components/FooterStats";
import { exportToPDF } from "./utils/pdfExport";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const TIMEOUT_IN_MS = 15 * 60 * 1000; // 15 Minutes
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    totalPackages: 0,
    totalBlogs: 0,
    totalPromos: 0,
    totalTestimonials: 0,
    totalSellerCost: 0,
    totalMarkup: 0,
    totalSales: 0,
    profitMargin: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [topPackages, setTopPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);

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

    activityEvents.forEach(event => {
        window.addEventListener(event, resetTimer);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer);
      });
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
    let bookings = [];
    let packages = [];
    let blogs = [];
    let promos = [];
    let testimonials = [];

    try {
      const bookingsRes = await fetch(
        "http://localhost:5000/api/admin/bookings"
      );
      if (!bookingsRes.ok)
        throw new Error(`HTTP error! status: ${bookingsRes.status}`);
      bookings = await bookingsRes.json();
    } catch (err) {
      console.error("Error fetching bookings:", err);
      bookings = [];
    }

    try {
      const packagesRes = await fetch("http://localhost:5000/api/packages");
      if (!packagesRes.ok)
        throw new Error(`HTTP error! status: ${packagesRes.status}`);
      packages = await packagesRes.json();
    } catch (err) {
      console.error("Error fetching packages:", err);
      packages = [];
    }

    try {
      const blogsRes = await fetch("http://localhost:5000/api/blogs");
      if (!blogsRes.ok)
        throw new Error(`HTTP error! status: ${blogsRes.status}`);
      blogs = await blogsRes.json();
    } catch (err) {
      console.error("Error fetching blogs:", err);
      blogs = [];
    }

    try {
      const promosRes = await fetch("http://localhost:5000/api/promos");
      if (!promosRes.ok)
        throw new Error(`HTTP error! status: ${promosRes.status}`);
      promos = await promosRes.json();
    } catch (err) {
      console.error("Error fetching promos:", err);
      promos = [];
    }

    try {
      const testimonialsRes = await fetch(
        "http://localhost:5000/api/testimonials"
      );
      if (!testimonialsRes.ok)
        throw new Error(`HTTP error! status: ${testimonialsRes.status}`);
      testimonials = await testimonialsRes.json();
    } catch (err) {
      console.error("Error fetching testimonials:", err);
      testimonials = [];
    }

    try {
      if (!Array.isArray(bookings)) bookings = [];

      const confirmed = bookings.filter((b) => b.status === "confirmed").length;
      const pending = bookings.filter((b) => b.status === "pending").length;
      const cancelled = bookings.filter((b) => b.status === "cancelled").length;
      const revenue = bookings
        .filter((b) => b.status === "confirmed")
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const confirmedBookings = bookings.filter(
        (b) => b.status === "confirmed"
      );
      const totalRevenue = confirmedBookings.reduce(
        (sum, b) => sum + (b.totalAmount || 0),
        0
      );
      const financialStats = confirmedBookings.reduce(
        (acc, booking) => {
          const pax =
            (booking.pax?.adult || 1) +
            (booking.pax?.children || 0) +
            (booking.pax?.infants || 0);
          if (booking.sellerPrice && booking.markup) {
            acc.totalSellerCost += booking.sellerPrice * pax;
            acc.totalMarkup += booking.markup * pax;
            acc.totalSales += booking.totalAmount || 0;
          }
          return acc;
        },
        { totalSellerCost: 0, totalMarkup: 0, totalSales: 0 }
      );

      const profitMargin =
        financialStats.totalSales > 0
          ? (
              (financialStats.totalMarkup / financialStats.totalSales) *
              100
            ).toFixed(1)
          : 0;

      setStats({
        totalBookings: bookings.length,
        confirmedBookings: confirmed,
        pendingBookings: pending,
        cancelledBookings: cancelled,
        totalRevenue: revenue,
        totalPackages: Array.isArray(packages) ? packages.length : 0,
        totalBlogs: Array.isArray(blogs) ? blogs.length : 0,
        totalPromos: Array.isArray(promos) ? promos.length : 0,
        totalTestimonials: Array.isArray(testimonials)
          ? testimonials.length
          : 0,
        totalSellerCost: financialStats.totalSellerCost,
        totalMarkup: financialStats.totalMarkup,
        totalSales: financialStats.totalSales,
        profitMargin: profitMargin,
      });

      const today = new Date();
      const trendData = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthName = date.toLocaleString("default", { month: "short" });
        const year = date.getFullYear();
        const startOfMonth = new Date(year, date.getMonth(), 1);
        const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

        const confirmedThisMonth = bookings.filter((b) => {
          const created = new Date(b.createdAt);
          return (
            b.status === "confirmed" &&
            created >= startOfMonth &&
            created <= endOfMonth
          );
        });

        const confirmedCount = confirmedThisMonth.length;
        const revenueThisMonth = confirmedThisMonth.reduce(
          (sum, b) => sum + (b.totalAmount || 0),
          0
        );

        trendData.push({
          month: monthName,
          bookings: confirmedCount,
          revenue: revenueThisMonth,
        });
      }

      setTrendData(trendData);

      const formatted = bookings
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((b) => ({
          id: b._id,
          client: b.fullName,
          package: b.packageName,
          date: new Date(b.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: b.status,
          amount: `₱${(b.totalAmount || 0).toLocaleString()}`,
        }));
      setRecentBookings(formatted);

      const packageStats = {};
      bookings.forEach((b) => {
        const pkg = b.packageName || "Unknown";
        if (!packageStats[pkg]) {
          packageStats[pkg] = { bookings: 0, revenue: 0 };
        }
        packageStats[pkg].bookings += 1;
        packageStats[pkg].revenue += b.totalAmount || 0;
      });

      const sortedPackages = Object.entries(packageStats)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 5)
        .map(([name, data]) => ({
          name,
          bookings: data.bookings,
          revenue: `₱${data.revenue.toLocaleString()}`,
          revenueValue: data.revenue,
        }));
      setTopPackages(sortedPackages);
    } catch (calcErr) {
      console.error("Error in calculations:", calcErr);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleExportPDF = () => {
    const pdfTopPackages = topPackages.map((pkg) => ({
      ...pkg,
      revenue: typeof pkg.revenue === 'string' 
        ? pkg.revenue.replace('₱', 'PHP ') 
        : pkg.revenue
    }));

    exportToPDF(stats, trendData, pdfTopPackages);
  };

  if (loading) {
    return (
      <div className="dash-page">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          toggleSidebar={toggleSidebar}
        />
        <main
          className={`dash-main ${
            isSidebarCollapsed ? "dash-main--collapsed" : ""
          }`}
        >
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
 
      <main
        className={`dash-main ${
          isSidebarCollapsed ? "dash-main--collapsed" : ""
        }`}
      >
        <div className="dash-container">
          <DashboardHeader
            stats={stats}
            onExportPDF={handleExportPDF}
          />

          <StatsCards stats={stats} />

          <FinancialOverview stats={stats} />

          <ChartsSection
            trendData={trendData}
            stats={stats}
            topPackages={topPackages}
          />

          <div className="dash-grid">
            <RecentBookings
              bookings={recentBookings}
              onViewAll={() => navigate("/booking")}
            />

            <TopPackages packages={topPackages} />

            <QuickActions navigate={navigate} />
          </div>

          <FooterStats stats={stats} />
        </div>
      </main>
    </div>
  );
};

export default Dashboard;