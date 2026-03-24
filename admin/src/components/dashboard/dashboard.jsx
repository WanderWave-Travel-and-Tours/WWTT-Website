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
import { exportMonthlyToPDF } from "./utils/monthlyPdfExport";

import "./dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const TIMEOUT_IN_MS = 15 * 60 * 1000;
  
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedSection, setSelectedSection] = useState('all');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isResetRateModalOpen, setIsResetRateModalOpen] = useState(false);

  const [stats, setStats] = useState({
    totalBookings: 0, confirmedBookings: 0, pendingBookings: 0, cancelledBookings: 0,
    totalRevenue: 0, totalPackages: 0, totalBlogs: 0, totalPromos: 0,
    totalTestimonials: 0, totalSellerCost: 0, totalMarkup: 0, totalSales: 0,
    profitMargin: 0, totalInquiriesRevenue: 0, completedInquiries: 0,
    pendingInquiries: 0, combinedTotalRevenue: 0, todayRevenue: 0, thisMonthRevenue: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [topPackages, setTopPackages] = useState([]);
  const [allPackages, setAllPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendData, setTrendData] = useState([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState({ daily: [], monthly: [] });
  
  const [rawBookings, setRawBookings] = useState([]);
  const [rawInquiries, setRawInquiries] = useState([]);
  const [pageViewStats, setPageViewStats] = useState({
    totalViews: 0,
    packagesPageViews: 0,
    bookingPageViews: 0,
    flightsPageViews: 0,
    servicesPageViews: 0,
    topViewedPackages: [],
    recentViews: [],
    dailyViewsData: [],
  });

  const [bookingCountStats, setBookingCountStats] = useState({
    totalBookingCounts: 0,
    topBookedPackages: [],
    recentBookingCounts: [],
  });
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [revenueViewMode, setRevenueViewMode] = useState("weekly");
  
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [weeklyDate, setWeeklyDate] = useState(new Date().toISOString().split('T')[0]);

  // State for Specific Month Selection (Defaults to current YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed);

  const handleAutoLogout = useCallback(() => {
    console.warn("Admin session expired due to inactivity.");
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
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
      const bookingsRes = await fetch("https://wanderwaveph.onrender.com/api/admin/bookings");
      if (bookingsRes.ok) bookings = await bookingsRes.json();
      
      const packagesRes = await fetch("https://wanderwaveph.onrender.com/api/packages/all");
      if (packagesRes.ok) {
        const pkgData = await packagesRes.json();
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

      const blogsRes = await fetch("https://wanderwaveph.onrender.com/api/blogs");
      if (blogsRes.ok) blogs = await blogsRes.json();

      const promosRes = await fetch("https://wanderwaveph.onrender.com/api/promos");
      if (promosRes.ok) promos = await promosRes.json();

      const testimonialsRes = await fetch("https://wanderwaveph.onrender.com/api/testimonials");
      if (testimonialsRes.ok) testimonials = await testimonialsRes.json();

      const inquiriesRes = await fetch("https://wanderwaveph.onrender.com/api/inquiries");
      if (inquiriesRes.ok) {
        const inquiriesData = await inquiriesRes.json();
        inquiries = inquiriesData.data || inquiriesData || [];
      }

      // ============================================================
      // FETCH PAGE VIEWS + BOOKING COUNTS (single endpoint)
      // ============================================================
      try {
        const pageViewsRes = await fetch("https://wanderwaveph.onrender.com/api/page-views/stats");
        if (pageViewsRes.ok) {
          const pvData = await pageViewsRes.json();
          const pvStats = pvData.data || pvData || {};

          // Build daily views chart data (last 7 days)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const allViews = pvStats.recentViews || [];
          const dailyViewsData = [];
          for (let i = 6; i >= 0; i--) {
            const day = new Date(today);
            day.setDate(day.getDate() - i);
            const dayEnd = new Date(day);
            dayEnd.setHours(23, 59, 59, 999);
            const count = allViews.filter(v => {
              const d = new Date(v.createdAt);
              return d >= day && d <= dayEnd;
            }).length;
            dailyViewsData.push({
              date: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              views: count,
            });
          }

          // Enrich topViewedPackages with full title, destination, duration from allPackages.
          // Priority: match by packageId first (most reliable), then by exact title,
          // then by title-contains for incomplete stored names like "Solo", "min. of 2 pax", "solo/ joiners"
          const pkgLookupById   = packages.reduce((acc, pkg) => { if (pkg._id) acc[String(pkg._id)] = pkg; return acc; }, {});
          const pkgLookupByName = packages.reduce((acc, pkg) => { if (pkg.title) acc[pkg.title] = pkg; return acc; }, {});

          const findPkgMatch = (storedName, storedId) => {
            if (storedId && pkgLookupById[String(storedId)]) return pkgLookupById[String(storedId)];
            if (storedName && pkgLookupByName[storedName])   return pkgLookupByName[storedName];
            // title-contains fallback: find package whose title includes the stored partial name
            if (storedName) {
              const lower = storedName.toLowerCase().trim();
              return packages.find(p => p.title && p.title.toLowerCase().includes(lower)) || null;
            }
            return null;
          };

          const buildDisplayName = (storedName, match) => {
            if (!match) return storedName;
            // If the stored name already contains the duration or destination, it's already complete
            const lower = storedName.toLowerCase();
            const hasDuration    = match.duration    && lower.includes(match.duration.toLowerCase());
            const hasDestination = match.destination && lower.includes(match.destination.toLowerCase());
            if (hasDuration || hasDestination) return storedName;
            // Reconstruct: Duration + Destination + stored partial name
            const parts = [match.duration, match.destination, storedName].filter(Boolean);
            return parts.join(' ');
          };

          const enrichedTopViewedPackages = (pvStats.topViewedPackages || []).map(pkg => {
            const match = findPkgMatch(pkg.packageName, pkg.packageId);
            return {
              ...pkg,
              displayName: buildDisplayName(pkg.packageName, match),
              destination: match?.destination || null,
              duration:    match?.duration    || null,
            };
          });

          setPageViewStats({
            totalViews:        pvStats.totalViews        || 0,
            packagesPageViews: pvStats.packagesPageViews || 0,
            bookingPageViews:  pvStats.bookingPageViews  || 0,
            flightsPageViews:  pvStats.flightsPageViews  || 0,
            servicesPageViews: pvStats.servicesPageViews || 0,
            topViewedPackages: enrichedTopViewedPackages,
            recentViews:       allViews,
            dailyViewsData,
          });

          // ── View-to-Book Rate numerator: total bookings where isArchive = "No" ──
          // Directly filter the already-fetched bookings array.
          // Archived bookings (isArchive = "Yes") are excluded so the rate
          // goes down automatically whenever a booking is archived.
          const nonArchivedBookings = bookings.filter(b => b.isArchive !== 'Yes');

          const recentBookingCountsFromBookings = nonArchivedBookings.map(b => ({
            bookingId:   String(b._id),
            packageId:   b.packageId ? String(b.packageId) : null,
            packageName: b.packageName || null,
            paxCount:    (b.pax?.adult || 0) + (b.pax?.children || 0) + (b.pax?.infants || 0) || 1,
            paymentType: b.paymentType || 'full',
            totalAmount: b.totalAmount || 0,
            createdAt:   b.createdAt,
          }));

          setBookingCountStats({
            totalBookingCounts:  recentBookingCountsFromBookings.length,
            topBookedPackages:   pvStats.topBookedPackages || [],
            recentBookingCounts: recentBookingCountsFromBookings,
          });
        }
      } catch (pvErr) {
        console.warn('⚠️ Page views / booking counts fetch failed:', pvErr);
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

      // ✅ Exclude archived bookings from all stats calculations
      bookings = bookings.filter((b) => b.isArchive !== 'Yes');

      // ✅ Exclude archived promos from stats count
      if (Array.isArray(promos)) {
        promos = promos.filter((p) => p.isArchive !== 'Yes');
      }

      const confirmed = bookings.filter((b) => b.status === "confirmed").length;
      const pending = bookings.filter((b) => b.status === "pending").length;
      const cancelled = bookings.filter((b) => b.status === "cancelled").length;
      
      const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
      const bookingsRevenue = confirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      const packageLookup = packages.reduce((acc, pkg) => {
        acc[pkg.title] = pkg;
        return acc;
      }, {});

      const financialStats = confirmedBookings.reduce((acc, booking) => {
          const paxCount = (booking.pax?.adult || 0) + (booking.pax?.children || 0) + (booking.pax?.infants || 0) || 1;
          const refPackage = packageLookup[booking.packageName];

          if (refPackage) {
            acc.totalSellerCost += (refPackage.sellerPrice || 0) * paxCount;
            acc.totalMarkup += (refPackage.markup || 0) * paxCount;
            acc.totalSales += booking.totalAmount || 0;
          } else if (booking.sellerPrice !== undefined && booking.markup !== undefined) {
            acc.totalSellerCost += (booking.sellerPrice || 0) * paxCount;
            acc.totalMarkup += (booking.markup || 0) * paxCount;
            acc.totalSales += booking.totalAmount || 0;
          } else {
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
        totalBookings: bookings.length,
        confirmedBookings: confirmed,
        pendingBookings: pending,
        cancelledBookings: cancelled,
        totalRevenue: bookingsRevenue,
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
          month: monthName,
          bookings: confirmedThisMonth.length,
          bookingsRevenue: bRev,
          inquiries: completedInquiriesThisMonth.length,
          inquiriesRevenue: iRev,
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
          bookingsRevenue: dBookings,
          inquiriesRevenue: dInquiries,
          totalRevenue: dBookings + dInquiries,
        });
      }

      setRevenueBreakdown({
        daily: dailyBreakdown,
        monthly: trendDataTemp.map(m => ({
          month: m.month,
          bookingsRevenue: m.bookingsRevenue,
          inquiriesRevenue: m.inquiriesRevenue,
          totalRevenue: m.totalRevenue,
        })),
      });

      setRecentBookings(bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5).map((b) => ({
          id: b._id,
          client: b.fullName,
          package: b.packageName,
          date: new Date(b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
          status: b.status,
          amount: `₱${(b.totalAmount || 0).toLocaleString()}`,
        })));

      const packageStats = {};
      bookings.forEach((b) => {
        const pkg = b.packageName || "Unknown";
        if (!packageStats[pkg]) packageStats[pkg] = { bookings: 0, revenue: 0 };
        packageStats[pkg].bookings += 1;
        packageStats[pkg].revenue += b.totalAmount || 0;
      });

      // Helper: find matching package by exact title, then by partial-contains
      const findPkgByName = (storedName) => {
        if (packageLookup[storedName]) return packageLookup[storedName];
        const lower = storedName.toLowerCase().trim();
        return packages.find(p => p.title && p.title.toLowerCase().includes(lower)) || null;
      };

      // Helper: build display name — prepend duration + destination only when
      // the stored name doesn't already contain them (e.g. "3D2N TAIPEI (min of 2 pax)" is already complete)
      const buildTopPkgDisplayName = (storedName, match) => {
        if (!match) return storedName;
        const lower = storedName.toLowerCase();
        const hasDuration    = match.duration    && lower.includes(match.duration.toLowerCase());
        const hasDestination = match.destination && lower.includes(match.destination.toLowerCase());
        if (hasDuration || hasDestination) return storedName;
        const parts = [match.duration, match.destination, storedName].filter(Boolean);
        return parts.join(' ');
      };

      setTopPackages(Object.entries(packageStats).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5).map(([name, data]) => {
          const match = findPkgByName(name);
          return {
            name: buildTopPkgDisplayName(name, match),
            bookings: data.bookings,
            revenue: `₱${data.revenue.toLocaleString()}`,
            revenueValue: data.revenue,
          };
        }));

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

  // Specific Month Analytics Data Calculation
  const specificMonthAnalyticsData = useMemo(() => {
    if (!selectedMonth) return [];
    
    const [year, month] = selectedMonth.split('-');
    const startDate = new Date(year, month - 1, 1);
    
    const now = new Date();
    const isCurrentMonth = parseInt(year) === now.getFullYear() && (parseInt(month) - 1) === now.getMonth();
    
    const endDate = isCurrentMonth ? now : new Date(year, month, 0);
    
    const results = [];
    let current = new Date(startDate);
    
    while (current <= endDate) {
        const weekStart = new Date(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const actualEndLimit = isCurrentMonth ? now : new Date(year, month, 0);
        const absoluteMonthEnd = new Date(year, month, 0);
        
        const actualWeekEnd = weekEnd > actualEndLimit ? new Date(actualEndLimit) : weekEnd;
        if (actualWeekEnd > absoluteMonthEnd) actualWeekEnd.setTime(absoluteMonthEnd.getTime());
        
        weekStart.setHours(0,0,0,0);
        const compareEnd = new Date(actualWeekEnd);
        compareEnd.setHours(23,59,59,999);

        const bRev = rawBookings.filter(b => 
            b.status === "confirmed" && 
            new Date(b.createdAt) >= weekStart && 
            new Date(b.createdAt) <= compareEnd
        ).reduce((s, b) => s + (b.totalAmount || 0), 0);

        const iRev = rawInquiries.filter(i => 
            i.status === "COMPLETED" && 
            new Date(i.updatedAt) >= weekStart && 
            new Date(i.updatedAt) <= compareEnd
        ).reduce((s, i) => s + (i.estimatedPrice || 0), 0);

        const label = `${weekStart.getDate()}-${compareEnd.getDate()} ${weekStart.toLocaleString('default', { month: 'short' })}`;

        results.push({
            date: label,
            bookingsRevenue: bRev,
            inquiriesRevenue: iRev,
            totalRevenue: bRev + iRev
        });

        current.setDate(current.getDate() + 7);
        
        if (current > actualEndLimit) break;
    }

    return results;
  }, [selectedMonth, rawBookings, rawInquiries]);

  const weeklyAnalyticsData = useMemo(() => {
    if (!weeklyDate) return [];
    
    const getWeekRange = (date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(d.setDate(diff));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      weekStart.setHours(0, 0, 0, 0);
      weekEnd.setHours(23, 59, 59, 999);
      
      return { weekStart, weekEnd };
    };

    const { weekStart, weekEnd } = getWeekRange(weeklyDate);
    const results = [];
    let current = new Date(weekStart);

    while (current <= weekEnd) {
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dBookings = rawBookings.filter((b) => 
        b.status === "confirmed" && 
        new Date(b.createdAt) >= current && 
        new Date(b.createdAt) <= dayEnd
      ).reduce((s, b) => s + (b.totalAmount || 0), 0);

      const dInquiries = rawInquiries.filter((i) => 
        i.status === "COMPLETED" && 
        new Date(i.updatedAt) >= current && 
        new Date(i.updatedAt) <= dayEnd
      ).reduce((s, i) => s + (i.estimatedPrice || 0), 0);

      results.push({
        date: current.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        bookingsRevenue: dBookings,
        inquiriesRevenue: dInquiries,
        totalRevenue: dBookings + dInquiries
      });

      current.setDate(current.getDate() + 1);
    }

    return results;
  }, [weeklyDate, rawBookings, rawInquiries]);

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

  const handleResetViewToBookRate = async () => {
    try {
      const res = await fetch("https://wanderwaveph.onrender.com/api/page-views/booking-counts/reset", {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "View-to-Book Rate has been reset.", "Reset Successful");
        // Refresh stats so the rate card updates immediately
        setBookingCountStats({
          totalBookingCounts: 0,
          topBookedPackages: [],
          recentBookingCounts: [],
        });
      } else {
        toast.error(data.message || "Failed to reset.", "Reset Failed");
      }
    } catch (err) {
      console.error("❌ Reset View-to-Book Rate error:", err);
      toast.error("Something went wrong. Please try again.", "Reset Failed");
    } finally {
      setIsResetRateModalOpen(false);
    }
  };

  const handleExportPDF = async () => {
    try {
        console.log('Starting PDF export...');
        console.log('allPackages data:', allPackages);
        console.log('allPackages length:', allPackages?.length || 0);
        
        if ((revenueViewMode === "weekly" || revenueViewMode === "daily" || revenueViewMode === "specificMonth") && (!allPackages || allPackages.length === 0)) {
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
        
        if (revenueViewMode === "daily") {
            console.log('Exporting DAILY with allPackages length:', allPackages?.length);
            exportDailyToPDF(statsWithRawData, dailyAnalyticsData, pdfTopPackages, dailyDate, allPackages, pageViewStats, bookingCountStats);
        } else if (revenueViewMode === "weekly") {
            console.log('Exporting WEEKLY with allPackages length:', allPackages?.length);
            exportWeeklyToPDF(statsWithRawData, weeklyAnalyticsData, pdfTopPackages, weeklyDate, allPackages, pageViewStats, bookingCountStats);
        } else if (revenueViewMode === "specificMonth") {
            console.log('Exporting SPECIFIC MONTH with allPackages length:', allPackages?.length);
            console.log('Selected Month:', selectedMonth);
            console.log('Monthly Data:', specificMonthAnalyticsData);
            exportMonthlyToPDF(statsWithRawData, specificMonthAnalyticsData, pdfTopPackages, selectedMonth, allPackages, pageViewStats, bookingCountStats);
        } else if (revenueViewMode === "custom") {
            console.log('Exporting CUSTOM with allPackages length:', allPackages?.length);
            exportCustomToPDF(statsWithRawData, customAnalyticsData, pdfTopPackages, customRange, allPackages, pageViewStats, bookingCountStats);
        } else {
            console.log('Exporting MONTHLY TREND with allPackages length:', allPackages?.length);
            exportToPDF(statsWithRawData, trendData, pdfTopPackages, allPackages, pageViewStats, bookingCountStats);
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

        await fetch('https://wanderwaveph.onrender.com/api/activity-logs', {
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
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

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
              onWeeklyDateChange={setWeeklyDate}
              onMonthChange={setSelectedMonth}
              monthlyData={specificMonthAnalyticsData}
              customData={customAnalyticsData}
              dailyData={dailyAnalyticsData}
              weeklyData={weeklyAnalyticsData}
              pageViewStats={pageViewStats}
              bookingCountStats={bookingCountStats}
              allPackages={allPackages}
              onResetViewToBookRate={() => setIsResetRateModalOpen(true)}
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

      <CustomConfirmModal 
        isOpen={isExportModalOpen}
        title="Export Dashboard Report"
        message={`Are you sure you want to download the ${revenueViewMode} analytics report as PDF?`}
        onConfirm={handleExportPDF}
        onCancel={() => setIsExportModalOpen(false)}
        type="primary"
      />

      <CustomConfirmModal
        isOpen={isResetRateModalOpen}
        title="Reset View-to-Book Rate"
        message="This will permanently clear all booking count records. Page view stats will not be affected. Are you sure?"
        onConfirm={handleResetViewToBookRate}
        onCancel={() => setIsResetRateModalOpen(false)}
        type="danger"
      />
    </div>
  );
};

export default Dashboard;