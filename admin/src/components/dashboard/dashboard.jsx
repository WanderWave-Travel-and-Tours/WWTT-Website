import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../sidebar/sidebar";
import DashboardHeader from "./components/DashboardHeader";
import StatsCards from "./components/StatsCards";
import FinancialOverview from "./components/FinancialOverview";
import ChartsSection from "./components/ChartsSection";
import RecentBookings from "./components/RecentBookings";
import TopPackages from "./components/TopPackages";
import RevenueAnalytics from "./components/RevenueAnalytics";

// Import Toast and Modal
import { useToast } from "../toast/ToastManager";
import CustomConfirmModal from "../confirmationModal/CustomConfirmModal";

// MGA PDF EXPORT UTILS
import { exportToPDF } from "./utils/pdfExport";
import { exportWeeklyToPDF } from "./utils/weeklyPdfExport";
import { exportCustomToPDF } from "./utils/customPdfExport";
import { exportDailyToPDF } from "./utils/dailyPdfExport";
import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast(); // Initialize toast
  const TIMEOUT_IN_MS = 15 * 60 * 1000;
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedSection, setSelectedSection] = useState('all');
  
  // Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [stats, setStats] = useState({
    totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0,
    totalRevenue: 0, totalPackages: 0, totalBlogs: 0, totalPromos: 0,
    totalTestimonials: 0, totalSellerCost: 0, totalMarkup: 0, totalSales: 0,
    profitMargin: 0, totalInquiriesRevenue: 0, completedInquiries: 0,
    pendingInquiries: 0, combinedTotalRevenue: 0, todayRevenue: 0, thisMonthRevenue: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [topPackages, setTopPackages] = useState([]);
  // ✅ NEW: State to store all packages for reference and PDF calculation
  const [allPackages, setAllPackages] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState({ daily: [], monthly: [] });
  
  const [rawBookings, setRawBookings] = useState([]);
  const [rawInquiries, setRawInquiries] = useState([]);
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [revenueViewMode, setRevenueViewMode] = useState("weekly"); 
  
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleAutoLogout = useCallback(() => {
    console.warn("Admin session expired due to inactivity.");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    
    // Replaced default alert with Toast
    toast.error("Security Alert: Your session has expired due to inactivity. Please log in again.", "Session Expired");
    
    navigate("/admin"); 
  }, [navigate, toast]);

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
      
      const packagesRes = await fetch("https://wanderwaveph-backend.onrender.com/api/packages/all");
      if (packagesRes.ok) {
        const pkgData = await packagesRes.json();
        // Handle different response formats
        let packagesArray = [];
        if (Array.isArray(pkgData)) {
          packagesArray = pkgData;
        } else if (pkgData.data && Array.isArray(pkgData.data)) {
          packagesArray = pkgData.data;
        } else if (pkgData.status === 'ok' && Array.isArray(pkgData.data)) {
          packagesArray = pkgData.data;
        }
        packages = packagesArray;
        setAllPackages(packagesArray);
        console.log('✅ Packages loaded successfully:', packagesArray.length);
      } else {
        console.error('❌ Packages fetch failed:', packagesRes.status);
      }

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
      
      setRawBookings(bookings);
      setRawInquiries(inquiries);

    } catch (err) {
      console.error("Error fetching data:", err);
      toast.error("Failed to load dashboard data. Please check your connection.", "Fetch Error");
    }

    try {
      if (!Array.isArray(bookings)) bookings = [];
      if (!Array.isArray(inquiries)) inquiries = [];

      const confirmed = bookings.filter((b) => b.status === "confirmed").length;
      const pending = bookings.filter((b) => b.status === "pending").length;
      const cancelled = bookings.filter((b) => b.status === "cancelled").length;
      
      const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
      const bookingsRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      // ✅ FIX: Create a map of packages for faster lookup by title to get sellerPrice and markup
      const packageLookup = packages.reduce((acc, pkg) => {
        acc[pkg.title] = pkg;
        return acc;
      }, {});

      // ✅ RE-CALCULATED FINANCIAL STATS: Cross-referencing Booking with Package Collection
      const financialStats = confirmedBookings.reduce((acc, booking) => {
          // Calculate total passengers as multiplier
          const paxCount = (booking.pax?.adult || 0) + (booking.pax?.children || 0) + (booking.pax?.infants || 0) || 1;
          
          // Search for the package data from the collection
          const refPackage = packageLookup[booking.packageName];

          if (refPackage) {
            // Priority 1: Use actual data from Packages Collection
            acc.totalSellerCost += (refPackage.sellerPrice || 0) * paxCount;
            acc.totalMarkup += (refPackage.markup || 0) * paxCount;
            acc.totalSales += booking.totalAmount || 0;
          } else if (booking.sellerPrice !== undefined && booking.markup !== undefined) {
            // Priority 2: Fallback to stored price in booking if package was deleted from collection
            acc.totalSellerCost += (booking.sellerPrice || 0) * paxCount;
            acc.totalMarkup += (booking.markup || 0) * paxCount;
            acc.totalSales += booking.totalAmount || 0;
          } else {
            // Fallback for old data: Treat totalAmount as the only known value
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
        totalMarkup: financialStats.totalMarkup, // This correctly maps to Net Profit
        totalSales: financialStats.totalSales,
        profitMargin: profitMargin,
        totalInquiriesRevenue: inquiriesRevenue,
        completedInquiries: completedInquiries.length,
        pendingInquiries: pendingInquiriesCount,
        combinedTotalRevenue: combinedRevenue,
        todayRevenue: todayTotalRevenue,
        thisMonthRevenue: monthTotalRevenue,
      });

      const trendDataTemp = [];
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

        trendDataTemp.push({
          month: monthName, bookings: confirmedThisMonth.length, bookingsRevenue: bRev,
          inquiries: completedInquiriesThisMonth.length, inquiriesRevenue: iRev,
          totalRevenue: bRev + iRev,
        });
      }
      setTrendData(trendDataTemp);

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
          }).reduce((s, b) => s + (b.totalAmount || 0), 0);

        const dInquiries = completedInquiries.filter((i) => {
            const updated = new Date(i.updatedAt);
            return updated >= date && updated < nextDay;
          }).reduce((s, i) => s + (i.estimatedPrice || 0), 0);

        dailyBreakdown.push({
          date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          bookingsRevenue: dBookings, inquiriesRevenue: dInquiries,
          totalRevenue: dBookings + dInquiries,
        });
      }

      setRevenueBreakdown({
        daily: dailyBreakdown,
        monthly: trendDataTemp.map(m => ({
          month: m.month, bookingsRevenue: m.bookingsRevenue,
          inquiriesRevenue: m.inquiriesRevenue, totalRevenue: m.totalRevenue,
        })),
      });

      setRecentBookings(bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map((b) => ({
          id: b._id, client: b.fullName, package: b.packageName,
          date: new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: b.status, amount: `₱${(b.totalAmount || 0).toLocaleString()}`,
        })));

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

  const dailyAnalyticsData = useMemo(() => {
    if (!dailyDate) return [];
    const targetDate = new Date(dailyDate);
    targetDate.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bRev = rawBookings.filter(b => 
      b.status === "confirmed" && 
      new Date(b.createdAt) >= targetDate && 
      new Date(b.createdAt) <= dayEnd
    ).reduce((s, b) => s + (b.totalAmount || 0), 0);

    const iRev = rawInquiries.filter(i => 
      i.status === "COMPLETED" && 
      new Date(i.updatedAt) >= targetDate && 
      new Date(i.updatedAt) <= dayEnd
    ).reduce((s, i) => s + (i.estimatedPrice || 0), 0);

    return [{
      date: targetDate.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      bookingsRevenue: bRev,
      inquiriesRevenue: iRev,
      totalRevenue: bRev + iRev
    }];
  }, [dailyDate, rawBookings, rawInquiries]);

  const customAnalyticsData = useMemo(() => {
    if (!customRange.start || !customRange.end) return [];
    const start = new Date(customRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(customRange.end);
    end.setHours(23, 59, 59, 999);

    const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const isWeekly = diffInDays > 30;

    const results = [];
    let current = new Date(start);

    if (isWeekly) {
      while (current <= end) {
        const weekEnd = new Date(current);
        weekEnd.setDate(current.getDate() + 6);
        const actualEnd = weekEnd > end ? new Date(end) : weekEnd;
        const label = `${current.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${actualEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        const bRev = rawBookings.filter(b => b.status === "confirmed" && new Date(b.createdAt) >= current && new Date(b.createdAt) <= actualEnd).reduce((s, b) => s + (b.totalAmount || 0), 0);
        const iRev = rawInquiries.filter(i => i.status === "COMPLETED" && new Date(i.updatedAt) >= current && new Date(i.updatedAt) <= actualEnd).reduce((s, i) => s + (i.estimatedPrice || 0), 0);
        results.push({ date: label, bookingsRevenue: bRev, inquiriesRevenue: iRev, totalRevenue: bRev + iRev });
        current.setDate(current.getDate() + 7);
      }
    } else {
      while (current <= end) {
        const dStr = current.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);
        const bRev = rawBookings.filter(b => b.status === "confirmed" && new Date(b.createdAt) >= current && new Date(b.createdAt) <= dayEnd).reduce((s, b) => s + (b.totalAmount || 0), 0);
        const iRev = rawInquiries.filter(i => i.status === "COMPLETED" && new Date(i.updatedAt) >= current && new Date(i.updatedAt) <= dayEnd).reduce((s, i) => s + (i.estimatedPrice || 0), 0);
        results.push({ date: dStr, bookingsRevenue: bRev, inquiriesRevenue: iRev, totalRevenue: bRev + iRev });
        current.setDate(current.getDate() + 1);
      }
    }
    return results;
  }, [customRange, rawBookings, rawInquiries]);

  const handleExportPDF = async () => {
    try {
        console.log('Starting PDF export...');
        console.log('allPackages data:', allPackages);
        console.log('allPackages length:', allPackages?.length || 0);
        
        // Safety check before export
        if (revenueViewMode === "weekly" && (!allPackages || allPackages.length === 0)) {
            toast.warning("No packages loaded yet. Seller cost & markup will be 0 in the report.", "Package Data Missing");
        }

        const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
        const adminName = adminData.username || adminData.email || 'Admin';
        const adminId = adminData._id || null;
        
        const pdfTopPackages = topPackages.map((pkg) => ({
            ...pkg, 
            revenue: typeof pkg.revenue === 'string' ? pkg.revenue.replace('₱', 'P') : pkg.revenue
        }));
        
        const statsWithRawData = {
            ...stats,
            rawBookings: rawBookings,
            rawInquiries: rawInquiries
        };
        
        // ✅ FIXED: Now passing allPackages correctly to ALL export functions
        if (revenueViewMode === "daily") {
            console.log('Exporting DAILY with allPackages length:', allPackages?.length);
            exportDailyToPDF(statsWithRawData, dailyAnalyticsData, pdfTopPackages, dailyDate, allPackages);
        } else if (revenueViewMode === "weekly") {
            console.log('Exporting WEEKLY with allPackages length:', allPackages?.length);
            exportWeeklyToPDF(stats, revenueBreakdown.daily, pdfTopPackages, allPackages); // <-- FIXED HERE
        } else if (revenueViewMode === "custom") {
            console.log('Exporting CUSTOM with allPackages length:', allPackages?.length);
            exportCustomToPDF(stats, customAnalyticsData, pdfTopPackages, customRange, allPackages);
        } else {
            console.log('Exporting MONTHLY with allPackages length:', allPackages?.length);
            exportToPDF(stats, trendData, pdfTopPackages, allPackages);
        }
        
        toast.success("Dashboard report has been exported successfully.", "Export Success");
        
        const timestamp = new Date().toISOString().split('T')[0];
        const pdfFileName = `Dashboard_Report_${timestamp}_${Date.now()}.pdf`;
        
        const activityLogData = {
            action: 'EXPORT',
            module: 'System',
            entity: 'Dashboard Report',
            user: adminName,
            userId: adminId,
            adminId: adminId,
            severity: 'SUCCESS',
            description: `Admin "${adminName}" exported dashboard report as PDF (${revenueViewMode})`,
            details: {
                recordTitle: 'Dashboard Analytics Report',
                exportFormat: 'PDF',
                reportType: revenueViewMode,
                sections: selectedSection === 'all' ? 'All Sections' : selectedSection,
                fileName: pdfFileName,
                exportedAt: new Date().toISOString(),
                affectedRecords: 1,
                method: 'EXPORT',
                endpoint: '/dashboard/export-pdf',
                downloadSuccess: true
            }
        };

        await fetch('http://localhost:5000/api/activity-logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(activityLogData)
        });

    } catch (error) {
        console.error('Error in PDF export process:', error);
        toast.error("Failed to export PDF. Please try again.", "Export Failed");
    } finally {
        setIsExportModalOpen(false);
    }
  };

  const handleSectionFilter = (section) => {
    setSelectedSection(section);
  };

  const shouldShowSection = (sectionName) => {
    if (selectedSection === 'all') return true;
    return selectedSection === sectionName;
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
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar}  />

      <main className={`dash-main ${isSidebarCollapsed ? "dash-main--collapsed" : ""}`}>
        <div className="dash-container">
          <DashboardHeader 
            stats={stats} 
            onDownloadPDF={() => setIsExportModalOpen(true)}
            selectedSection={selectedSection}
            onSectionFilter={handleSectionFilter}
          />

          <StatsCards stats={stats} />

          {shouldShowSection('revenue-analytics') && (
            <RevenueAnalytics 
              stats={stats} 
              revenueBreakdown={revenueBreakdown} 
              onCustomRangeChange={(start, end) => setCustomRange({ start, end })}
              onViewModeChange={setRevenueViewMode} 
              onDailyDateChange={setDailyDate} 
              customData={customAnalyticsData}
              dailyData={dailyAnalyticsData} 
            />
          )}

          {shouldShowSection('financial-performance') && (
            <FinancialOverview stats={stats} />
          )}

          {(shouldShowSection('combined-revenue') || shouldShowSection('booking-status')) && (
            <ChartsSection 
              trendData={trendData} 
              stats={stats} 
              topPackages={topPackages}
              showCombinedRevenue={shouldShowSection('combined-revenue')}
              showBookingStatus={shouldShowSection('booking-status')}
            />
          )}

          {(shouldShowSection('recent-bookings') || shouldShowSection('top-packages')) && (
            <div className="dash-grid">
              {shouldShowSection('recent-bookings') && (
                <RecentBookings bookings={recentBookings} onViewAll={() => navigate("/booking")} />
              )}
              {shouldShowSection('top-packages') && (
                <TopPackages packages={topPackages} />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal for Export */}
      <CustomConfirmModal 
        isOpen={isExportModalOpen}
        title="Export Dashboard Report"
        message={`Are you sure you want to download the ${revenueViewMode} analytics report as PDF?`}
        onConfirm={handleExportPDF}
        onCancel={() => setIsExportModalOpen(false)}
        type="primary"
      />
    </div>
  );
};

export default Dashboard;