import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Plane,
  FileText,
  HeartHandshake,
  Package,
  TrendingUp,
  Users,
  MapPin,
  Calendar,
  FileCheck,
  ScrollText,
  Heart,
  BookOpen,
  PlusCircle,
  Tag,
  MessageSquare,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Activity,
  TrendingDown,
  Wallet,
  PiggyBank,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import Sidebar from "../sidebar/sidebar";
import "./Dashboard.css";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
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

  const COLORS = ["#667eea", "#f56565", "#48bb78", "#ed8936", "#9f7aea"];

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
      console.log("Fetched bookings:", bookings);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      bookings = [];
    }

    try {
      const packagesRes = await fetch("http://localhost:5000/api/packages");
      if (!packagesRes.ok)
        throw new Error(`HTTP error! status: ${packagesRes.status}`);
      packages = await packagesRes.json();
      console.log("Fetched packages:", packages);
    } catch (err) {
      console.error("Error fetching packages:", err);
      packages = [];
    }

    try {
      const blogsRes = await fetch("http://localhost:5000/api/blogs");
      if (!blogsRes.ok)
        throw new Error(`HTTP error! status: ${blogsRes.status}`);
      blogs = await blogsRes.json();
      console.log("Fetched blogs:", blogs);
    } catch (err) {
      console.error("Error fetching blogs:", err);
      blogs = [];
    }

    try {
      const promosRes = await fetch("http://localhost:5000/api/promos");
      if (!promosRes.ok)
        throw new Error(`HTTP error! status: ${promosRes.status}`);
      promos = await promosRes.json();
      console.log("Fetched promos:", promos);
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
      console.log("Fetched testimonials:", testimonials);
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
          trend:
            data.revenue > 0 ? (
              <ArrowUp size={16} color="#10b981" />
            ) : (
              <ArrowDown size={16} color="#ef4444" />
            ),
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

  const bookingsChartData = [
    { month: "Jun", bookings: 45, revenue: 1125000 },
    { month: "Jul", bookings: 52, revenue: 1300000 },
    { month: "Aug", bookings: 48, revenue: 1200000 },
    { month: "Sep", bookings: 61, revenue: 1525000 },
    { month: "Oct", bookings: 58, revenue: 1450000 },
    {
      month: "Nov",
      bookings: stats.totalBookings,
      revenue: stats.totalRevenue,
    },
  ];

  const statusData = [
    { name: "Confirmed", value: stats.confirmedBookings, color: "#48bb78" },
    { name: "Pending", value: stats.pendingBookings, color: "#ecc94b" },
    { name: "Cancelled", value: stats.cancelledBookings, color: "#f56565" },
  ];

  const packageData = topPackages.map((pkg) => ({
    name: pkg.name.length > 20 ? pkg.name.substring(0, 20) + "..." : pkg.name,
    bookings: pkg.bookings,
  }));

  const servicesData = [
    {
      name: "VISA Processing",
      icon: FileCheck,
      path: "/services/visa",
      pending: 8,
      completed: 45,
      color: "blue",
    },
    {
      name: "PSA Serbilis",
      icon: ScrollText,
      path: "/services/psa",
      pending: 12,
      completed: 89,
      color: "green",
    },
    {
      name: "CENOMAR",
      icon: Heart,
      path: "/services/cenomar",
      pending: 5,
      completed: 34,
      color: "pink",
    },
    {
      name: "Passport Appt",
      icon: BookOpen,
      path: "/services/passport",
      pending: 15,
      completed: 67,
      color: "purple",
    },
  ];

  const quickActionsData = [
    {
      name: "Add Package",
      icon: PlusCircle,
      path: "/add-package",
      desc: "Create new tour",
      color: "blue",
    },
    {
      name: "Create Promo",
      icon: Tag,
      path: "/add-promo",
      desc: "Special offers",
      color: "orange",
    },
    {
      name: "Add Testimonial",
      icon: MessageSquare,
      path: "/add-testimonial",
      desc: "Client feedback",
      color: "purple",
    },
    {
      name: "View Packages",
      icon: Package,
      path: "/view-packages",
      desc: "Manage list",
      color: "green",
    },
  ];

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

const exportToPDF = () => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // ===== HEADER =====
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        // Company Name
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('WANDERWAVE TRAVEL', 14, 20);
        
        // Subtitle
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Executive Performance Report', 14, 28);
        
        // Date on right
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        doc.text('Generated: ' + currentDate, pageWidth - 14, 20, { align: 'right' });
        doc.text('Period: Last 6 Months', pageWidth - 14, 26, { align: 'right' });
        
        // Line separator
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);
        
        let yPos = 42;
        
        // ===== 1. EXECUTIVE SUMMARY =====
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('1. EXECUTIVE SUMMARY', 20, yPos + 5.5);
        
        yPos += 12;
        
        // Summary boxes
        const summaryBoxWidth = 44;
        const summaryGap = 3;
        
        // Box 1 - Total Revenue
        let xPos = 14;
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(xPos, yPos, summaryBoxWidth, 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('TOTAL REVENUE', xPos + summaryBoxWidth / 2, yPos + 8, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 31, 63);
        doc.text('P' + (stats.totalRevenue / 1000000).toFixed(2) + 'M', xPos + summaryBoxWidth / 2, yPos + 16, { align: 'center' });
        
        // Box 2 - Total Bookings
        xPos += summaryBoxWidth + summaryGap;
        doc.rect(xPos, yPos, summaryBoxWidth, 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('TOTAL BOOKINGS', xPos + summaryBoxWidth / 2, yPos + 8, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 31, 63);
        doc.text(String(stats.totalBookings), xPos + summaryBoxWidth / 2, yPos + 16, { align: 'center' });
        
        // Box 3 - Profit Margin
        xPos += summaryBoxWidth + summaryGap;
        doc.rect(xPos, yPos, summaryBoxWidth, 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('PROFIT MARGIN', xPos + summaryBoxWidth / 2, yPos + 8, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 31, 63);
        doc.text(stats.profitMargin + '%', xPos + summaryBoxWidth / 2, yPos + 16, { align: 'center' });
        
        // Box 4 - Active Packages
        xPos += summaryBoxWidth + summaryGap;
        doc.rect(xPos, yPos, summaryBoxWidth, 20);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('ACTIVE PACKAGES', xPos + summaryBoxWidth / 2, yPos + 8, { align: 'center' });
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 31, 63);
        doc.text(String(stats.totalPackages), xPos + summaryBoxWidth / 2, yPos + 16, { align: 'center' });
        
        yPos += 28;
        
        // ===== 2. FINANCIAL OVERVIEW =====
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('2. FINANCIAL OVERVIEW', 20, yPos + 5.5);
        
        yPos += 12;
        
        // Financial Table
        const financialData = [
            ['Total Gross Sales', stats.totalSales.toLocaleString('en-US', { minimumFractionDigits: 0 }), 'Total value of confirmed bookings'],
            ['Total Seller Cost', stats.totalSellerCost.toLocaleString('en-US', { minimumFractionDigits: 0 }), 'Payable to suppliers/partners'],
            ['Net Profit (Markup)', stats.totalMarkup.toLocaleString('en-US', { minimumFractionDigits: 0 }), 'Net Earnings']
        ];
        
        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Amount (PHP)', 'Note']],
            body: financialData,
            theme: 'plain',
            headStyles: { 
                fillColor: [0, 31, 63],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [60, 60, 60]
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            columnStyles: {
                0: { cellWidth: 60, fontStyle: 'bold' },
                1: { halign: 'right', cellWidth: 40 },
                2: { textColor: [100, 100, 100], fontSize: 8 }
            },
            margin: { left: 14, right: 14 },
            didParseCell: function(data) {
                if (data.row.index === 2 && data.section === 'body') {
                    data.cell.styles.fillColor = [236, 253, 245];
                    if (data.column.index === 1) {
                        data.cell.styles.textColor = [72, 187, 120];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // ===== 3. PERFORMANCE ANALYTICS =====
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('3. PERFORMANCE ANALYTICS', 20, yPos + 5.5);
        
        yPos += 12;
        
        // Revenue Trajectory
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('REVENUE TRAJECTORY', 14, yPos + 5);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        trendData.forEach((data, index) => {
            doc.text(data.month + ': P' + data.revenue.toLocaleString(), 18, yPos + 12 + (index * 5));
        });
        
        // Booking Composition
        const rightColX = pageWidth / 2 + 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('BOOKING COMPOSITION', rightColX, yPos + 5);
        
        const confirmedPercent = stats.totalBookings > 0 ? ((stats.confirmedBookings / stats.totalBookings) * 100).toFixed(0) : 0;
        const pendingPercent = stats.totalBookings > 0 ? ((stats.pendingBookings / stats.totalBookings) * 100).toFixed(0) : 0;
        const cancelledPercent = stats.totalBookings > 0 ? ((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(0) : 0;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(72, 187, 120);
        doc.text('Confirmed ' + confirmedPercent + '%', rightColX + 5, yPos + 15);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('(' + stats.confirmedBookings + ' bookings)', rightColX + 5, yPos + 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 179, 8);
        doc.text('Pending ' + pendingPercent + '%', rightColX + 5, yPos + 28);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('(' + stats.pendingBookings + ' bookings)', rightColX + 5, yPos + 33);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(239, 68, 68);
        doc.text('Cancelled ' + cancelledPercent + '%', rightColX + 5, yPos + 41);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('(' + stats.cancelledBookings + ' bookings)', rightColX + 5, yPos + 46);
        
        yPos += 55;
        
        // ===== 4. TOP PERFORMING PACKAGES =====
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('4. TOP PERFORMING PACKAGES', 20, yPos + 5.5);
        
        yPos += 12;
        
        // Packages Table
        const packagesData = topPackages.map(pkg => [
            pkg.name,
            String(pkg.bookings),
            pkg.revenue
        ]);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Package Name', 'Bookings', 'Revenue Generated']],
            body: packagesData,
            theme: 'plain',
            headStyles: { 
                fillColor: [0, 31, 63],
                textColor: [255, 255, 255],
                fontSize: 10,
                fontStyle: 'bold'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: [60, 60, 60]
            },
            alternateRowStyles: {
                fillColor: [250, 250, 250]
            },
            columnStyles: {
                1: { halign: 'center', cellWidth: 30 },
                2: { halign: 'right', cellWidth: 50, fontStyle: 'bold' }
            },
            margin: { left: 14, right: 14 }
        });
        
        // Footer
        const footerY = pageHeight - 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Confidential Internal Document | WanderWave Travel & Tours', pageWidth / 2, footerY, { align: 'center' });
        
        // Save
        doc.save('WanderWave_Executive_Report_' + new Date().toISOString().split('T')[0] + '.pdf');
        
    } catch (error) {
        console.error('Error generating PDF:', error);
        alert('Error generating PDF: ' + error.message);
    }
};

  return (
    <div className="dash-page">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className={`dash-main ${
          isSidebarCollapsed ? "dash-main--collapsed" : ""
        }`}
      >
        <div className="dash-container">
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
                onClick={exportToPDF}
                title="Export to PDF"
              >
                <Download size={18} />
              </button>
              <button
                className="dash-icon-btn"
                onClick={exportToPDF}
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

          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-icon dash-stat-icon--blue">
                <Plane size={24} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-label">Total Bookings</span>
                <strong className="dash-stat-value">
                  {stats.totalBookings}
                </strong>
              </div>
              <span className="dash-stat-badge dash-stat-badge--green">
                <ArrowUp size={14} /> Active
              </span>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-icon dash-stat-icon--orange">
                <FileText size={24} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-label">Pending Bookings</span>
                <strong className="dash-stat-value">
                  {stats.pendingBookings}
                </strong>
              </div>
              <span className="dash-stat-badge dash-stat-badge--orange">
                Action Needed
              </span>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-icon dash-stat-icon--green">
                <DollarSign size={24} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-label">Total Revenue</span>
                <strong className="dash-stat-value">
                  ₱{(stats.totalRevenue / 1000000).toFixed(2)}M
                </strong>
              </div>
              <span className="dash-stat-badge dash-stat-badge--green">
                <ArrowUp size={14} /> +12%
              </span>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-icon dash-stat-icon--purple">
                <Package size={24} />
              </div>
              <div className="dash-stat-content">
                <span className="dash-stat-label">Active Packages</span>
                <strong className="dash-stat-value">
                  {stats.totalPackages}
                </strong>
              </div>
              <span className="dash-stat-badge dash-stat-badge--gray">
                Live
              </span>
            </div>
          </div>

          <section className="dash-section dash-section--wide dash-financial-stats">
            <div className="dash-section-header">
              <h2 className="dash-section-title">FINANCIAL OVERVIEW</h2>
              <span className="dash-section-badge">
                Confirmed Bookings Only
              </span>
            </div>
            <div className="dash-financial-grid">
              <div className="dash-financial-card dash-financial-card--cost">
                <div className="dash-financial-icon">
                  <Wallet size={28} />
                </div>
                <div className="dash-financial-content">
                  <span className="dash-financial-label">
                    Total Seller Cost
                  </span>
                  <strong className="dash-financial-value">
                    ₱
                    {stats.totalSellerCost.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <span className="dash-financial-desc">
                    Total cost from suppliers
                  </span>
                </div>
              </div>

              <div className="dash-financial-card dash-financial-card--markup">
                <div className="dash-financial-icon">
                  <TrendingUp size={28} />
                </div>
                <div className="dash-financial-content">
                  <span className="dash-financial-label">Total Markup</span>
                  <strong className="dash-financial-value">
                    ₱
                    {stats.totalMarkup.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <span className="dash-financial-desc">
                    Your profit from bookings
                  </span>
                </div>
              </div>

              <div className="dash-financial-card dash-financial-card--sales">
                <div className="dash-financial-icon">
                  <DollarSign size={28} />
                </div>
                <div className="dash-financial-content">
                  <span className="dash-financial-label">Total Sales</span>
                  <strong className="dash-financial-value">
                    ₱
                    {stats.totalSales.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                  <span className="dash-financial-desc">
                    Total revenue generated
                  </span>
                </div>
              </div>

              <div className="dash-financial-card dash-financial-card--margin">
                <div className="dash-financial-icon">
                  <PiggyBank size={28} />
                </div>
                <div className="dash-financial-content">
                  <span className="dash-financial-label">Profit Margin</span>
                  <strong className="dash-financial-value">
                    {stats.profitMargin}%
                  </strong>
                  <span className="dash-financial-desc">
                    Average markup percentage
                  </span>
                </div>
              </div>
            </div>

            <div className="dash-financial-breakdown">
              <div className="dash-breakdown-bar">
                <div
                  className="dash-breakdown-segment dash-breakdown-segment--cost"
                  style={{
                    width: `${
                      (stats.totalSellerCost / stats.totalSales) * 100 || 0
                    }%`,
                  }}
                >
                  <span>Seller Cost</span>
                </div>
                <div
                  className="dash-breakdown-segment dash-breakdown-segment--profit"
                  style={{
                    width: `${
                      (stats.totalMarkup / stats.totalSales) * 100 || 0
                    }%`,
                  }}
                >
                  <span>Your Profit</span>
                </div>
              </div>
              <div className="dash-breakdown-legend">
                <div className="dash-breakdown-legend-item">
                  <span className="dash-legend-dot dash-legend-dot--cost"></span>
                  <span>
                    Seller Cost:{" "}
                    {(
                      (stats.totalSellerCost / stats.totalSales) * 100 || 0
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="dash-breakdown-legend-item">
                  <span className="dash-legend-dot dash-legend-dot--profit"></span>
                  <span>
                    Your Profit:{" "}
                    {(
                      (stats.totalMarkup / stats.totalSales) * 100 || 0
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="dash-grid">
            <section className="dash-section dash-section--wide">
              <div className="dash-section-header">
                <h2 className="dash-section-title">
                  BOOKINGS & REVENUE TRENDS
                </h2>
                <Activity size={18} className="dash-section-icon" />
              </div>
              <div className="dash-chart-container">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#64748b" />
                    <YAxis yAxisId="left" stroke="#3b82f6" />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#10b981"
                    />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="bookings"
                      stroke="#3b82f6"
                      fill="#3b82f680"
                      name="Bookings"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      fill="#10b98180"
                      name="Revenue (₱)"
                      formatter={(value) => `₱${value.toLocaleString()}`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="dash-section">
              <div className="dash-section-header">
                <h2 className="dash-section-title">BOOKING STATUS</h2>
                <TrendingUp size={18} className="dash-section-icon" />
              </div>
              <div className="dash-chart-container" style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="dash-status-summary">
                <div className="status-item">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: "#48bb78" }}
                  ></span>
                  <span>Confirmed: {stats.confirmedBookings}</span>
                </div>
                <div className="status-item">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: "#ecc94b" }}
                  ></span>
                  <span>Pending: {stats.pendingBookings}</span>
                </div>
                <div className="status-item">
                  <span
                    className="status-dot"
                    style={{ backgroundColor: "#f56565" }}
                  ></span>
                  <span>Cancelled: {stats.cancelledBookings}</span>
                </div>
              </div>
            </section>

            <section className="dash-section">
              <div className="dash-section-header">
                <h2 className="dash-section-title">TOP PACKAGES</h2>
                <TrendingUp size={18} className="dash-section-icon" />
              </div>
              <div className="dash-chart-container" style={{ height: "300px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={packageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      stroke="#6b7280"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar
                      dataKey="bookings"
                      fill="#667eea"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="dash-section dash-section--wide">
              <div className="dash-section-header">
                <h2 className="dash-section-title">RECENT BOOKINGS</h2>
                <button
                  className="dash-link-btn"
                  onClick={() => navigate("/booking")}
                >
                  View All
                </button>
              </div>
              <div className="dash-table-wrapper">
                {recentBookings.length === 0 ? (
                  <div className="dash-empty-state">
                    <Plane size={48} />
                    <p>No bookings yet</p>
                  </div>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>CLIENT</th>
                        <th>PACKAGE</th>
                        <th>DATE</th>
                        <th>AMOUNT</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <span className="dash-client">{b.client}</span>
                          </td>
                          <td>{b.package}</td>
                          <td>{b.date}</td>
                          <td>
                            <span className="dash-amount">{b.amount}</span>
                          </td>
                          <td>
                            <span
                              className={`dash-status dash-status--${b.status.toLowerCase()}`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="dash-section dash-section--wide">
              <div className="dash-section-header">
                <h2 className="dash-section-title">TOP PERFORMING PACKAGES</h2>
                <span className="dash-section-badge">By Revenue</span>
              </div>
              <div className="dash-packages-list">
                {topPackages.length === 0 ? (
                  <div className="dash-empty-state">
                    <Package size={48} />
                    <p>No package data yet</p>
                  </div>
                ) : (
                  topPackages.map((pkg, i) => (
                    <div key={i} className="dash-package-item">
                      <div className="dash-package-rank">{i + 1}</div>
                      <div className="dash-package-info">
                        <span className="dash-package-name">{pkg.name}</span>
                        <span className="dash-package-stats">
                          {pkg.bookings} bookings • {pkg.revenue}
                        </span>
                      </div>
                      <span className="dash-package-trend">{pkg.trend}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="dash-section dash-section--wide">
              <div className="dash-section-header">
                <h2 className="dash-section-title">QUICK ACTIONS</h2>
              </div>
              <div className="dash-actions-grid">
                {quickActionsData.map((action, i) => (
                  <button
                    key={i}
                    className={`dash-action-btn dash-action-btn--${action.color}`}
                    onClick={() => navigate(action.path)}
                  >
                    <div className="dash-action-icon-wrapper">
                      <action.icon size={28} />
                    </div>
                    <div className="dash-action-text">
                      <span className="dash-action-title">{action.name}</span>
                      <span className="dash-action-sub">{action.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <div className="dash-footer-stats">
            <div className="dash-footer-stat">
              <Package size={20} />
              <div>
                <strong>{stats.totalPackages}</strong>
                <span>Total Packages</span>
              </div>
            </div>
            <div className="dash-footer-stat">
              <FileText size={20} />
              <div>
                <strong>{stats.totalBlogs}</strong>
                <span>Blog Posts</span>
              </div>
            </div>
            <div className="dash-footer-stat">
              <Tag size={20} />
              <div>
                <strong>{stats.totalPromos}</strong>
                <span>Active Promos</span>
              </div>
            </div>
            <div className="dash-footer-stat">
              <MessageSquare size={20} />
              <div>
                <strong>{stats.totalTestimonials}</strong>
                <span>Testimonials</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
