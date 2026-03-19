import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/Logo.png';

export const exportWeeklyToPDF = (stats, weeklyData = [], topPackages = [], selectedDate = "", allPackages = [], pageViewStats = {}) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        const navyBlue = [0, 31, 63];
        const accentOrange = [255, 140, 66];
        const lightGrayBg = [245, 247, 250];
        const greenText = [72, 187, 120];
        const greenBg = [236, 253, 245];

        // === CALCULATE WEEK RANGE (SUNDAY TO SATURDAY) ===
        const getWeekRange = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            // Calculate days to subtract to get to Sunday (0)
            const diffToSunday = day;
            
            const weekStart = new Date(d);
            weekStart.setDate(weekStart.getDate() - diffToSunday);
            weekStart.setHours(0, 0, 0, 0);
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            
            return { weekStart, weekEnd };
        };

        const { weekStart, weekEnd } = getWeekRange(selectedDate);
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        const addWatermark = () => {
            try {
                const size = 120;
                const x = (pageWidth - size) / 2;
                const y = (pageHeight - size) / 2;
                
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.1 }));
                doc.addImage(logo, 'PNG', x, y, size, size);
                doc.restoreGraphicsState();
            } catch (e) {
                console.log('Watermark skipped:', e.message);
            }
        };
        
        addWatermark();
        
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('WANDERWAVE TRAVEL', 14, 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Weekly Performance & Revenue Report', 14, 28);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Generated: ' + new Date().toLocaleDateString(), pageWidth - 14, 20, { align: 'right' });
        doc.text('Period: Weekly Analytics (' + weekStartStr + ' to ' + weekEndStr + ')', pageWidth - 14, 26, { align: 'right' });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);
        
        let yPos = 42;
        
        // === CALCULATE WEEKLY DATA FROM RAW DATA ===
        const rawBookings = stats.rawBookings || [];
        const rawInquiries = stats.rawInquiries || [];
        
        const weeklyConfirmedBookings = rawBookings.filter(b => 
            b.status === "confirmed" && 
            new Date(b.createdAt) >= weekStart && 
            new Date(b.createdAt) <= weekEnd
        );
        const weeklyPendingBookings = rawBookings.filter(b => 
            b.status === "pending" && 
            new Date(b.createdAt) >= weekStart && 
            new Date(b.createdAt) <= weekEnd
        );
        const weeklyCancelledBookings = rawBookings.filter(b => 
            b.status === "cancelled" && 
            new Date(b.createdAt) >= weekStart && 
            new Date(b.createdAt) <= weekEnd
        );
        const weeklyTotalBookings = weeklyConfirmedBookings.length + weeklyPendingBookings.length + weeklyCancelledBookings.length;
        
        const weeklyCompletedInquiries = rawInquiries.filter(i => 
            i.status === "COMPLETED" && 
            new Date(i.updatedAt) >= weekStart && 
            new Date(i.updatedAt) <= weekEnd
        );
        const weeklyPendingInquiries = rawInquiries.filter(i => 
            i.status !== "COMPLETED" && 
            new Date(i.updatedAt) >= weekStart && 
            new Date(i.updatedAt) <= weekEnd
        );
        
        const weeklyPackageStats = {};
        weeklyConfirmedBookings.forEach((b) => {
            const pkg = b.packageName || "Unknown";
            if (!weeklyPackageStats[pkg]) weeklyPackageStats[pkg] = { bookings: 0, revenue: 0 };
            weeklyPackageStats[pkg].bookings += 1;
            weeklyPackageStats[pkg].revenue += b.totalAmount || 0;
        });
        const weeklyTopPackages = Object.entries(weeklyPackageStats)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 5)
            .map(([name, data]) => ({
                name,
                bookings: data.bookings,
                revenue: `P${data.revenue.toLocaleString()}`,
                revenueValue: data.revenue
            }));
        
        const weeklyTotalRevenue = (weeklyData || []).reduce((sum, day) => sum + (day.totalRevenue || 0), 0);
        const weeklyBookingsRevenue = (weeklyData || []).reduce((sum, day) => sum + (day.bookingsRevenue || 0), 0);
        const weeklyInquiriesRevenue = (weeklyData || []).reduce((sum, day) => sum + (day.inquiriesRevenue || 0), 0);
        
        const totalGrossSales = weeklyBookingsRevenue || 0;
        const servicesRevenue = weeklyInquiriesRevenue || 0;

        let totalSellerCost = 0;
        let totalMarkupProfit = 0;

        console.log('=== WEEKLY PDF FINANCIAL CALCULATION ===');
        console.log('Week Range: ' + weekStartStr + ' (Sunday) to ' + weekEndStr + ' (Saturday)');
        console.log('allPackages count:', allPackages ? allPackages.length : 0);

        weeklyConfirmedBookings.forEach((booking, idx) => {
            const bookingPackageName = booking.packageName;
            const bookingHotelName = booking.hotelName;
            const paxCount = (booking.pax?.adult || 0) + (booking.pax?.children || 0) + (booking.pax?.infants || 0) || 1;
            
            let matchedPackage = null;
            
            if (bookingPackageName && bookingHotelName && allPackages.length > 0) {
                const packageNameKey = bookingPackageName.trim().toLowerCase();
                const hotelNameKey = bookingHotelName.trim().toLowerCase();
                
                matchedPackage = allPackages.find(pkg => {
                    const pkgTitleMatch = pkg.title && pkg.title.trim().toLowerCase() === packageNameKey;
                    const pkgDestMatch = pkg.destination && pkg.destination.trim().toLowerCase() === hotelNameKey;
                    return pkgTitleMatch && pkgDestMatch;
                });
            }
            
            if (!matchedPackage && bookingPackageName && allPackages.length > 0) {
                const packageNameKey = bookingPackageName.trim().toLowerCase();
                matchedPackage = allPackages.find(pkg => 
                    pkg.title && pkg.title.trim().toLowerCase() === packageNameKey
                );
            }

            if (matchedPackage) {
                const sellerPrice = matchedPackage.sellerPrice || 0;
                const markup = matchedPackage.markup || 0;
                const costForThisBooking = sellerPrice * paxCount;
                const markupForThisBooking = markup * paxCount;
                
                totalSellerCost += costForThisBooking;
                totalMarkupProfit += markupForThisBooking;
            }
        });

        const totalNetProfit = totalMarkupProfit + servicesRevenue;

        console.log(`Total Seller Cost: ${totalSellerCost}`);
        console.log(`Total Markup Profit: ${totalMarkupProfit}`);
        console.log(`Services Revenue: ${servicesRevenue}`);
        console.log(`Total Net Profit: ${totalNetProfit}`);

        // --- 1. EXECUTIVE SUMMARY (5-Card Layout) ---
        doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('1. EXECUTIVE SUMMARY', 20, yPos + 5.5);
        yPos += 12;
        
        const bw = 34.5, gap = 2.375;
        let xPos = 14;

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('WEEKLY REVENUE', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246); 
        doc.text('P' + (weeklyTotalRevenue || 0).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('BOOKINGS', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246); 
        doc.text('P' + (totalGrossSales || 0).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('SERVICES', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); 
        doc.text('P' + (servicesRevenue || 0).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('BOOKINGS COUNT', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.text(String(weeklyTotalBookings), xPos + bw/2, yPos + 15, { align: 'center' });
        
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('SERVICES DONE', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.text(String(weeklyCompletedInquiries.length), xPos + bw/2, yPos + 15, { align: 'center' });
        
        yPos += 28;
        
        // --- 2. REVENUE BREAKDOWN ---
        doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('2. REVENUE BREAKDOWN', 20, yPos + 5.5);
        yPos += 12;
        
        const totalCombined = weeklyTotalRevenue;
        const safeTotal = totalCombined === 0 ? 1 : totalCombined;
        const bookingsShare = totalCombined === 0 ? 0 : (totalGrossSales / safeTotal * 100).toFixed(1);
        const servicesShare = totalCombined === 0 ? 0 : (servicesRevenue / safeTotal * 100).toFixed(1);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Revenue Source', 'Amount (PHP)', 'Volume', 'Share']],
            body: [
                ['Package Bookings', totalGrossSales.toLocaleString(), (weeklyConfirmedBookings.length) + ' bookings', bookingsShare + '%'],
                ['Travel Services', servicesRevenue.toLocaleString(), (weeklyCompletedInquiries.length) + ' services', servicesShare + '%'],
                ['TOTAL', totalCombined.toLocaleString(), (weeklyConfirmedBookings.length + weeklyCompletedInquiries.length) + ' total', '100%']
            ],
            theme: 'plain',
            margin: { left: 14, right: 14 }, 
            headStyles: { fillColor: navyBlue, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 'auto', fontStyle: 'bold' },
                1: { halign: 'right', cellWidth: 40 },
                2: { halign: 'center', cellWidth: 40, fontSize: 8, textColor: [100, 100, 100] },
                3: { halign: 'center', cellWidth: 30, fontStyle: 'bold' }
            },
            didParseCell: function(data) {
                if (data.row.index === 2 && data.section === 'body') {
                    data.cell.styles.fillColor = lightGrayBg;
                    data.cell.styles.fontStyle = 'bold';
                    if (data.column.index === 1) data.cell.styles.textColor = [139, 92, 246];
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // --- 3. FINANCIAL OVERVIEW ---
        doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('3. FINANCIAL OVERVIEW', 20, yPos + 5.5);
        yPos += 12;
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('3.1 Overall (Combined Bookings & Services)', 18, yPos + 5);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('Total Gross Sales:', 22, yPos);
        doc.setTextColor(72, 187, 120);
        doc.setFont('helvetica', 'bold');
        doc.text('P' + (totalGrossSales + servicesRevenue).toLocaleString(), 60, yPos);
        
        yPos += 7;
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Seller Cost:', 22, yPos);
        doc.setTextColor(239, 68, 68);
        doc.setFont('helvetica', 'bold');
        doc.text('P' + totalSellerCost.toLocaleString(), 60, yPos);
        
        yPos += 7;
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Net Profit:', 22, yPos);
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text('P' + totalNetProfit.toLocaleString(), 60, yPos);
        
        const combinedGross = totalGrossSales + servicesRevenue;
        const combinedMargin = combinedGross > 0 ? ((totalNetProfit / combinedGross) * 100).toFixed(1) : 0;
        
        yPos += 7;
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Profit Margin:', 22, yPos);
        doc.setTextColor(139, 92, 246);
        doc.setFont('helvetica', 'bold');
        doc.text(combinedMargin + '%', 60, yPos);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('(Bookings: P' + totalGrossSales.toLocaleString() + ' + Services: P' + servicesRevenue.toLocaleString() + ')', 22, yPos + 5);
        yPos += 15;
        
        // 3.2 Financial Overview (Bookings)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('3.2 Bookings', 18, yPos + 5);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('Total Gross Sales:', 22, yPos);
        doc.setTextColor(72, 187, 120);
        doc.setFont('helvetica', 'bold');
        doc.text('P' + totalGrossSales.toLocaleString(), 60, yPos);
        yPos += 7;
        
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Seller Cost:', 22, yPos);
        doc.setTextColor(239, 68, 68);
        doc.setFont('helvetica', 'bold');
        doc.text('P' + totalSellerCost.toLocaleString(), 60, yPos);
        yPos += 7;
        
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Total Markup Profit:', 22, yPos);
        doc.setTextColor(16, 185, 129);
        doc.setFont('helvetica', 'bold');
        doc.text('P' + totalMarkupProfit.toLocaleString(), 60, yPos);
        yPos += 7;
        
        const profitMargin = totalGrossSales > 0 ? ((totalMarkupProfit / totalGrossSales) * 100).toFixed(1) : 0;
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'normal');
        doc.text('Profit Margin:', 22, yPos);
        doc.setTextColor(139, 92, 246);
        doc.setFont('helvetica', 'bold');
        doc.text(profitMargin + '%', 60, yPos);
        yPos += 15;
        
        // 3.3 Financial Overview (Services)
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('3.3 Services', 18, yPos + 5);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('Total Gross Sales:', 22, yPos);
        doc.setTextColor(72, 187, 120);
        doc.setFont('helvetica', 'bold');
        doc.text('P' + servicesRevenue.toLocaleString(), 60, yPos);
        yPos += 15;
        
        // Force new page for section 4
        doc.addPage();
        addWatermark(); 
        yPos = 20;
        
        // --- 4. PERFORMANCE ANALYTICS ---
        doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('4. PERFORMANCE ANALYTICS', 20, yPos + 5.5);
        yPos += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('REVENUE TRAJECTORY (Weekly Breakdown - Sunday to Selected Date)', 14, yPos + 5);
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const selectedDateObj = new Date(selectedDate);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        let dayCounter = 0;
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(weekStart);
            dayDate.setDate(dayDate.getDate() + i);
            
            if (dayDate > selectedDateObj) break;
            
            const dayEnd = new Date(dayDate);
            dayEnd.setHours(23, 59, 59, 999);
            
            const bRev = rawBookings.filter(b =>
                b.status === "confirmed" &&
                new Date(b.createdAt) >= dayDate &&
                new Date(b.createdAt) <= dayEnd
            ).reduce((s, b) => s + (b.totalAmount || 0), 0);

            const iRev = rawInquiries.filter(i =>
                i.status === "COMPLETED" &&
                new Date(i.updatedAt) >= dayDate &&
                new Date(i.updatedAt) <= dayEnd
            ).reduce((s, i) => s + (i.estimatedPrice || 0), 0);
            
            const dateStr = dayDate.toISOString().split('T')[0];
            const dayLabel = dayNames[dayDate.getDay()];
            
            const br = 'P' + bRev.toLocaleString();
            const sr = 'P' + iRev.toLocaleString();
            const tr = 'P' + (bRev + iRev).toLocaleString();
            
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'bold');
            doc.text(`${dayLabel} (${dateStr}):`, 18, yPos + 12 + (dayCounter * 5));
            
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(59, 130, 246);
            doc.text('B: ' + br, 42, yPos + 12 + (dayCounter * 5));
            
            doc.setTextColor(16, 185, 129);
            doc.text('S: ' + sr, 70, yPos + 12 + (dayCounter * 5));
            
            dayCounter++;
        }
        
        yPos += 50;
        
        // --- STATUS BREAKDOWN ---
        doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('STATUS BREAKDOWN', 20, yPos + 5.5);
        yPos += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('BOOKINGS:', 18, yPos);
        
        const totalWeeklyB = weeklyTotalBookings || 1;
        const weeklyCp = totalWeeklyB === 0 ? 0 : ((weeklyConfirmedBookings.length) / totalWeeklyB * 100).toFixed(0);
        const weeklyPp = totalWeeklyB === 0 ? 0 : ((weeklyPendingBookings.length) / totalWeeklyB * 100).toFixed(0);
        
        yPos += 7;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Confirmed: ' + (weeklyConfirmedBookings.length) + ' (' + weeklyCp + '%)', 22, yPos);
        
        yPos += 6;
        doc.setTextColor(234, 179, 8);
        doc.text('Pending: ' + (weeklyPendingBookings.length) + ' (' + weeklyPp + '%)', 22, yPos);
        
        yPos += 6;
        doc.setTextColor(239, 68, 68);
        doc.text('Cancelled: ' + (weeklyCancelledBookings.length), 22, yPos);
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('SERVICES:', 18, yPos);
        
        yPos += 7;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Completed: ' + (weeklyCompletedInquiries.length), 22, yPos);
        
        yPos += 6;
        doc.setTextColor(234, 179, 8);
        doc.text('Pending: ' + (weeklyPendingInquiries.length), 22, yPos);
        
        yPos += 15;
        if (yPos > pageHeight - 80) {
            doc.addPage();
            addWatermark(); 
            yPos = 20;
        }
        
        // --- 5. TOP PERFORMING PACKAGES ---
        doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('5. TOP PERFORMING PACKAGES', 20, yPos + 5.5);
        yPos += 12;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Package Name', 'Bookings', 'Revenue Generated']],
            body: weeklyTopPackages.map(p => [p.name, String(p.bookings), p.revenue]),
            theme: 'plain',
            margin: { left: 14, right: 14 },
            headStyles: { fillColor: navyBlue, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            columnStyles: {
                0: { cellWidth: 'auto' }, 
                1: { halign: 'center', cellWidth: 30 },
                2: { halign: 'right', cellWidth: 50, fontStyle: 'bold' }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 8;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text('Legend: B = Bookings Revenue | S = Services Revenue | T = Total Combined Revenue', 14, yPos);

        // --- 6. PAGE VIEW ANALYTICS ---
        yPos += 12;
        if (yPos > pageHeight - 80) {
            doc.addPage();
            addWatermark();
            yPos = 20;
        }

        doc.setFillColor(lightGrayBg[0], lightGrayBg[1], lightGrayBg[2]);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(accentOrange[0], accentOrange[1], accentOrange[2]);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('6. PAGE VIEW ANALYTICS', 20, yPos + 5.5);
        yPos += 12;

        const pv = pageViewStats || {};
        const pvTotal     = pv.totalViews         || 0;
        const pvPackages  = pv.packagesPageViews   || 0;
        const pvBooking   = pv.bookingPageViews    || 0;
        const pvFlights   = pv.flightsPageViews    || 0;
        const pvServices  = pv.servicesPageViews   || 0;
        const pvRate      = pvPackages > 0 ? ((pvBooking / pvPackages) * 100).toFixed(1) : '0.0';
        const pvTop       = pv.topViewedPackages   || [];

        autoTable(doc, {
            startY: yPos,
            head: [['Page', 'Views', 'Share of Total']],
            body: [
                ['Package Deals (/packages)', String(pvPackages), pvTotal > 0 ? ((pvPackages / pvTotal) * 100).toFixed(1) + '%' : '0%'],
                ['Booking Page (/booking)',   String(pvBooking),  pvTotal > 0 ? ((pvBooking  / pvTotal) * 100).toFixed(1) + '%' : '0%'],
                ['Flight Search (/flights)',  String(pvFlights),  pvTotal > 0 ? ((pvFlights  / pvTotal) * 100).toFixed(1) + '%' : '0%'],
                ['Other Services (/services)',String(pvServices), pvTotal > 0 ? ((pvServices / pvTotal) * 100).toFixed(1) + '%' : '0%'],
                ['TOTAL ALL PAGES',           String(pvTotal),    '100%'],
            ],
            theme: 'plain',
            margin: { left: 14, right: 14 },
            headStyles: { fillColor: navyBlue, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
                2: { halign: 'center', cellWidth: 35 },
            },
            didParseCell: function(data) {
                if (data.row.index === 4 && data.section === 'body') {
                    data.cell.styles.fillColor = lightGrayBg;
                    data.cell.styles.fontStyle = 'bold';
                    if (data.column.index === 1) data.cell.styles.textColor = [139, 92, 246];
                }
            }
        });

        yPos = doc.lastAutoTable.finalY + 8;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('View-to-Book Rate (Booking views / Package views):', 14, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text(pvRate + '%', 120, yPos);
        yPos += 10;

        if (pvTop.length > 0) {
            doc.addPage();
            addWatermark();
            yPos = 20;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 41, 59);
            doc.text('Most Viewed Packages (Booking Page)', 14, yPos);
            yPos += 4;

            autoTable(doc, {
                startY: yPos,
                head: [['Rank', 'Package Name', 'Views']],
                body: pvTop.slice(0, 10).map((p, i) => [
                    '#' + (i + 1),
                    p.displayName || p.packageName || 'Unknown',
                    String(p.views || 0),
                ]),
                theme: 'plain',
                margin: { left: 14, right: 14 },
                headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
                alternateRowStyles: { fillColor: [240, 249, 255] },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: [100, 100, 100] },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 25, halign: 'center', fontStyle: 'bold', textColor: [14, 165, 233] },
                },
            });
            yPos = doc.lastAutoTable.finalY + 8;
        }
        
        const fy = pageHeight - 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text('Confidential Internal Document | WanderWave Travel', pageWidth / 2, fy, { align: 'center' });
        
        const pc = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pc; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Page ' + i + ' of ' + pc, pageWidth - 14, fy, { align: 'right' });
        }
        
        doc.save(`WanderWave_Weekly_Report_${weekStartStr}_to_${weekEndStr}.pdf`);
        
    } catch (error) { 
        console.error('PDF Error:', error);
        alert('PDF Export Error: ' + error.message);
    }
};