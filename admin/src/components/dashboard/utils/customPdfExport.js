import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/Logo.png';

export const exportCustomToPDF = (stats, customData = [], topPackages = [], customRange = { start: "", end: "" }, allPackages = [], pageViewStats = {}) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        const navyBlue = [0, 31, 63];
        const accentOrange = [255, 140, 66];
        const lightGrayBg = [245, 247, 250];
        const greenText = [72, 187, 120];
        const greenBg = [236, 253, 245];

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
        doc.text('Custom Date Range Performance & Revenue Report', 14, 28);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const startDate = customRange.start || new Date().toISOString().split('T')[0];
        const endDate = customRange.end || new Date().toISOString().split('T')[0];
        doc.text('Generated: ' + new Date().toLocaleDateString(), pageWidth - 14, 20, { align: 'right' });
        doc.text('Period: ' + startDate + ' to ' + endDate, pageWidth - 14, 26, { align: 'right' });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);
        
        let yPos = 42;
        
        // --- CALCULATE CUSTOM RANGE SPECIFIC DATA FROM RAW DATA ---
        const rangeStart = new Date(startDate);
        rangeStart.setHours(0, 0, 0, 0);
        const rangeEnd = new Date(endDate);
        rangeEnd.setHours(23, 59, 59, 999);
        
        const rawBookings = stats.rawBookings || [];
        const rawInquiries = stats.rawInquiries || [];
        
        // Custom Range Bookings filtered by date
        const rangeConfirmedBookings = rawBookings.filter(b => 
            b.status === "confirmed" && 
            new Date(b.createdAt) >= rangeStart && 
            new Date(b.createdAt) <= rangeEnd
        );
        const rangePendingBookings = rawBookings.filter(b => 
            b.status === "pending" && 
            new Date(b.createdAt) >= rangeStart && 
            new Date(b.createdAt) <= rangeEnd
        );
        const rangeCancelledBookings = rawBookings.filter(b => 
            b.status === "cancelled" && 
            new Date(b.createdAt) >= rangeStart && 
            new Date(b.createdAt) <= rangeEnd
        );
        const rangeTotalBookings = rangeConfirmedBookings.length + rangePendingBookings.length + rangeCancelledBookings.length;
        
        // Custom Range Inquiries filtered by date
        const rangeCompletedInquiries = rawInquiries.filter(i => 
            i.status === "COMPLETED" && 
            new Date(i.updatedAt) >= rangeStart && 
            new Date(i.updatedAt) <= rangeEnd
        );
        const rangePendingInquiries = rawInquiries.filter(i => 
            i.status !== "COMPLETED" && 
            new Date(i.updatedAt) >= rangeStart && 
            new Date(i.updatedAt) <= rangeEnd
        );
        
        // Custom Range Top Packages
        const rangePackageStats = {};
        rangeConfirmedBookings.forEach((b) => {
            const pkg = b.packageName || "Unknown";
            if (!rangePackageStats[pkg]) rangePackageStats[pkg] = { bookings: 0, revenue: 0 };
            rangePackageStats[pkg].bookings += 1;
            rangePackageStats[pkg].revenue += b.totalAmount || 0;
        });
        const rangeTopPackages = Object.entries(rangePackageStats)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 5)
            .map(([name, data]) => ({
                name,
                bookings: data.bookings,
                revenue: `P${data.revenue.toLocaleString()}`,
                revenueValue: data.revenue
            }));
        
        // === FINANCIAL CALCULATIONS ===
        const bookingsRevenue = rangeConfirmedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const servicesRevenue = rangeCompletedInquiries.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
        const totalGrossSales = bookingsRevenue;
        const totalCombinedRevenue = bookingsRevenue + servicesRevenue;

        let totalSellerCost = 0;
        let totalMarkupProfit = 0;

        console.log('=== CUSTOM RANGE PDF FINANCIAL CALCULATION ===');
        console.log('Date Range:', startDate, 'to', endDate);
        console.log('allPackages received:', allPackages);
        console.log('allPackages count:', allPackages ? allPackages.length : 0);
        console.log('Total Confirmed Bookings:', rangeConfirmedBookings.length);

        // === PROCESS EACH CONFIRMED BOOKING ===
        rangeConfirmedBookings.forEach((booking, idx) => {
            const bookingPackageName = booking.packageName;
            const bookingHotelName = booking.hotelName;
            const paxCount = (booking.pax?.adult || 0) + (booking.pax?.children || 0) + (booking.pax?.infants || 0) || 1;
            
            console.log(`\n[Booking ${idx + 1}]`);
            console.log(`  Package Name (from booking): "${bookingPackageName}"`);
            console.log(`  Hotel Name (from booking): "${bookingHotelName}"`);
            console.log(`  Pax: ${paxCount}`);
            
            let matchedPackage = null;
            
            if (bookingPackageName && bookingHotelName && allPackages.length > 0) {
                const packageNameKey = bookingPackageName.trim().toLowerCase();
                const hotelNameKey = bookingHotelName.trim().toLowerCase();
                
                matchedPackage = allPackages.find(pkg => {
                    const pkgTitleMatch = pkg.title && pkg.title.trim().toLowerCase() === packageNameKey;
                    const pkgDestMatch = pkg.destination && pkg.destination.trim().toLowerCase() === hotelNameKey;
                    return pkgTitleMatch && pkgDestMatch;
                });
                
                if (matchedPackage) {
                    console.log(`  ✓ EXACT MATCH FOUND using packageName + hotelName`);
                    console.log(`    Matched Package ID: ${matchedPackage._id}`);
                }
            }
            
            if (!matchedPackage && bookingPackageName && allPackages.length > 0) {
                const packageNameKey = bookingPackageName.trim().toLowerCase();
                matchedPackage = allPackages.find(pkg => 
                    pkg.title && pkg.title.trim().toLowerCase() === packageNameKey
                );
                
                if (matchedPackage) {
                    console.log(`  ✓ MATCH FOUND using packageName only`);
                    console.log(`    Matched Package ID: ${matchedPackage._id}`);
                }
            }

            if (matchedPackage) {
                const sellerPrice = matchedPackage.sellerPrice || 0;
                const markup = matchedPackage.markup || 0;
                
                const costForThisBooking = sellerPrice * paxCount;
                const markupForThisBooking = markup * paxCount;
                
                totalSellerCost += costForThisBooking;
                totalMarkupProfit += markupForThisBooking;
                
                console.log(`    Calculation: ${sellerPrice} × ${paxCount} pax = ${costForThisBooking} (seller cost)`);
                console.log(`    Calculation: ${markup} × ${paxCount} pax = ${markupForThisBooking} (markup profit)`);
            } else {
                console.error(`  ✗✗✗ NO MATCHING PACKAGE FOUND ✗✗✗`);
            }
        });

        const totalNetProfit = totalMarkupProfit + servicesRevenue;

        console.log(`\n=== FINAL CALCULATION ===`);
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

        // Card 1: Combined Revenue
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.5);
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('TOTAL REVENUE', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246); 
        doc.text('P' + totalCombinedRevenue.toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
        // Card 2: Bookings Revenue
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('BOOKINGS', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246); 
        doc.text('P' + totalGrossSales.toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
        // Card 3: Services Revenue
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('SERVICES', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129); 
        doc.text('P' + servicesRevenue.toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
        // Card 4: Bookings Count
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('BOOKINGS COUNT', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.text(String(rangeTotalBookings), xPos + bw/2, yPos + 15, { align: 'center' });
        
        // Card 5: Services Done
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text('SERVICES DONE', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.text(String(rangeCompletedInquiries.length), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        
        const totalCombined = totalCombinedRevenue;
        const safeTotal = totalCombined === 0 ? 1 : totalCombined;
        const bookingsShare = totalCombined === 0 ? 0 : (totalGrossSales / safeTotal * 100).toFixed(1);
        const servicesShare = totalCombined === 0 ? 0 : (servicesRevenue / safeTotal * 100).toFixed(1);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Revenue Source', 'Amount (PHP)', 'Volume', 'Share']],
            body: [
                ['Package Bookings', totalGrossSales.toLocaleString(), rangeConfirmedBookings.length + ' bookings', bookingsShare + '%'],
                ['Travel Services', servicesRevenue.toLocaleString(), rangeCompletedInquiries.length + ' services', servicesShare + '%'],
                ['TOTAL', totalCombined.toLocaleString(), (rangeConfirmedBookings.length + rangeCompletedInquiries.length) + ' total', '100%']
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
        
        // 3.1 Overall Financial Overview
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
        doc.text(`REVENUE TRAJECTORY (${startDate} to ${endDate})`, 14, yPos + 5);
        yPos += 10;
        
        // Display custom data in table format
        if (customData && customData.length > 0) {
            const trajectoryData = customData.slice(0, 10).map(d => [
                d.date,
                'P' + d.bookingsRevenue.toLocaleString(),
                'P' + d.inquiriesRevenue.toLocaleString(),
                'P' + d.totalRevenue.toLocaleString()
            ]);
            
            autoTable(doc, {
                startY: yPos,
                head: [['Date/Period', 'Bookings', 'Services', 'Total']],
                body: trajectoryData,
                theme: 'plain',
                margin: { left: 14, right: 14 },
                headStyles: { fillColor: navyBlue, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 8, textColor: [60, 60, 60] },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { halign: 'right', cellWidth: 35, textColor: [59, 130, 246] },
                    2: { halign: 'right', cellWidth: 35, textColor: [16, 185, 129] },
                    3: { halign: 'right', cellWidth: 35, fontStyle: 'bold', textColor: [139, 92, 246] }
                }
            });
            
            yPos = doc.lastAutoTable.finalY + 15;
        }
        
        if (yPos > pageHeight - 60) {
            doc.addPage();
            addWatermark();
            yPos = 20;
        }
        
        const rcx = 14;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('STATUS BREAKDOWN', rcx, yPos + 5);
        yPos += 10;
        
        doc.setFontSize(9);
        doc.setTextColor(59, 130, 246);
        doc.text('BOOKINGS:', rcx + 5, yPos + 3);
        
        const totalRangeB = rangeTotalBookings || 1;
        const rangeCp = totalRangeB === 0 ? 0 : ((rangeConfirmedBookings.length) / totalRangeB * 100).toFixed(0);
        const rangePp = totalRangeB === 0 ? 0 : ((rangePendingBookings.length) / totalRangeB * 100).toFixed(0);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Confirmed: ' + (rangeConfirmedBookings.length) + ' (' + rangeCp + '%)', rcx + 7, yPos + 9);
        doc.setTextColor(234, 179, 8);
        doc.text('Pending: ' + (rangePendingBookings.length) + ' (' + rangePp + '%)', rcx + 7, yPos + 14);
        doc.setTextColor(239, 68, 68);
        doc.text('Cancelled: ' + (rangeCancelledBookings.length), rcx + 7, yPos + 19);
        
        yPos += 25;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('SERVICES:', rcx + 5, yPos + 3);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Completed: ' + (rangeCompletedInquiries.length), rcx + 7, yPos + 9);
        doc.setTextColor(234, 179, 8);
        doc.text('Pending: ' + (rangePendingInquiries.length), rcx + 7, yPos + 14);
        
        yPos += 25;
        if (yPos > pageHeight - 60) {
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
            body: rangeTopPackages.map(p => [p.name, String(p.bookings), p.revenue]),
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
        const pvTotal    = pv.totalViews        || 0;
        const pvPackages = pv.packagesPageViews  || 0;
        const pvBooking  = pv.bookingPageViews   || 0;
        const pvFlights  = pv.flightsPageViews   || 0;
        const pvServices = pv.servicesPageViews  || 0;
        const pvRate     = pvPackages > 0 ? ((pvBooking / pvPackages) * 100).toFixed(1) : '0.0';
        const pvTop      = pv.topViewedPackages  || [];

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
                    p.packageName || 'Unknown',
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
        
        doc.save(`WanderWave_Custom_Report_${startDate}_to_${endDate}.pdf`);
        
    } catch (error) { 
        console.error('PDF Error:', error);
        alert('PDF Export Error: ' + error.message);
    }
};