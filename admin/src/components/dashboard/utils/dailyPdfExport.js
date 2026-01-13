import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/Logo.png';

export const exportDailyToPDF = (stats, dailyData = [], topPackages = [], selectedDate = "", rawBookings = [], rawInquiries = []) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
        // --- CORPORATE COLORS ---
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
        
        // --- CALCULATE DATA FOR SELECTED DATE ---
        const reportDate = selectedDate || new Date().toISOString().split('T')[0];
        const targetDate = new Date(reportDate);
        targetDate.setHours(0, 0, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(23, 59, 59, 999);

        // Filter bookings and inquiries for selected date
        const selectedDateBookings = rawBookings.filter(b => 
            b.status === "confirmed" && 
            new Date(b.createdAt) >= targetDate && 
            new Date(b.createdAt) <= dayEnd
        );

        const selectedDateInquiries = rawInquiries.filter(i => 
            i.status === "COMPLETED" && 
            new Date(i.updatedAt) >= targetDate && 
            new Date(i.updatedAt) <= dayEnd
        );

        // Calculate metrics for selected date
        const dailyBookingsRevenue = selectedDateBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const dailyInquiriesRevenue = selectedDateInquiries.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
        const dailyTotalRevenue = dailyBookingsRevenue + dailyInquiriesRevenue;
        const dailyBookingsCount = selectedDateBookings.length;
        const dailyServicesCount = selectedDateInquiries.length;

        // Financial metrics for selected date
        const dailyFinancials = selectedDateBookings.reduce((acc, booking) => {
            const pax = (booking.pax?.adult || 1) + (booking.pax?.children || 0) + (booking.pax?.infants || 0);
            if (booking.sellerPrice && booking.markup) {
                acc.totalSellerCost += booking.sellerPrice * pax;
                acc.totalMarkup += booking.markup * pax;
                acc.totalSales += booking.totalAmount || 0;
            }
            return acc;
        }, { totalSellerCost: 0, totalMarkup: 0, totalSales: 0 });

        // Top packages for selected date
        const dailyPackageStats = {};
        selectedDateBookings.forEach((b) => {
            const pkg = b.packageName || "Unknown";
            if (!dailyPackageStats[pkg]) dailyPackageStats[pkg] = { bookings: 0, revenue: 0 };
            dailyPackageStats[pkg].bookings += 1;
            dailyPackageStats[pkg].revenue += b.totalAmount || 0;
        });

        const dailyTopPackages = Object.entries(dailyPackageStats)
            .sort((a, b) => b[1].revenue - a[1].revenue)
            .slice(0, 5)
            .map(([name, data]) => ({
                name,
                bookings: data.bookings,
                revenue: `PHP ${data.revenue.toLocaleString()}`,
                revenueValue: data.revenue
            }));

        // --- HEADER SECTION ---
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(navyBlue[0], navyBlue[1], navyBlue[2]);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('WANDERWAVE TRAVEL', 14, 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Daily Performance & Revenue Report', 14, 28);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Generated: ' + new Date().toLocaleDateString(), pageWidth - 14, 20, { align: 'right' });
        doc.text('Period: Daily Analytics (' + reportDate + ')', pageWidth - 14, 26, { align: 'right' });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);
        
        let yPos = 42;
        
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
        doc.text('DAILY REVENUE', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246); 
        doc.text('P' + (dailyTotalRevenue || 0).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        doc.text('P' + (dailyBookingsRevenue || 0).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        doc.text('P' + (dailyInquiriesRevenue || 0).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        doc.text(String(dailyBookingsCount || 0), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        doc.text(String(dailyServicesCount || 0), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        
        const totalCombined = dailyTotalRevenue || 0;
        const safeTotal = totalCombined === 0 ? 1 : totalCombined;
        const bookingsShare = ((dailyBookingsRevenue || 0) / safeTotal * 100).toFixed(1);
        const servicesShare = ((dailyInquiriesRevenue || 0) / safeTotal * 100).toFixed(1);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Revenue Source', 'Amount (PHP)', 'Volume', 'Share']],
            body: [
                ['Package Bookings', (dailyBookingsRevenue || 0).toLocaleString(), (dailyBookingsCount || 0) + ' bookings', bookingsShare + '%'],
                ['Travel Services', (dailyInquiriesRevenue || 0).toLocaleString(), (dailyServicesCount || 0) + ' services', servicesShare + '%'],
                ['TOTAL', totalCombined.toLocaleString(), ((dailyBookingsCount || 0) + (dailyServicesCount || 0)) + ' total', '100%']
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
        doc.text('3. FINANCIAL OVERVIEW (Bookings)', 20, yPos + 5.5);
        yPos += 12;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Amount (PHP)', 'Note']],
            body: [
                ['Total Gross Sales', (dailyFinancials.totalSales || 0).toLocaleString(), 'Total value of confirmed bookings'],
                ['Total Seller Cost', (dailyFinancials.totalSellerCost || 0).toLocaleString(), 'Payable to suppliers/partners'],
                ['Net Profit (Markup)', (dailyFinancials.totalMarkup || 0).toLocaleString(), 'Net Earnings from bookings']
            ],
            theme: 'plain',
            margin: { left: 14, right: 14 }, 
            headStyles: { fillColor: navyBlue, textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            columnStyles: {
                0: { cellWidth: 50, fontStyle: 'bold' },
                1: { halign: 'right', cellWidth: 40 },
                2: { cellWidth: 'auto', textColor: [100, 100, 100], fontSize: 8 } 
            },
            didParseCell: function(data) {
                if (data.row.index === 2 && data.section === 'body') {
                    data.cell.styles.fillColor = greenBg; 
                    if (data.column.index === 1) {
                        data.cell.styles.textColor = greenText;
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        if (yPos > pageHeight - 80) {
            doc.addPage();
            addWatermark(); 
            yPos = 20;
        }
        
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
        
        // Left Side: Revenue Trajectory
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('REVENUE TRAJECTORY (Selected Date)', 14, yPos + 5);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.setFont('helvetica', 'bold');
        doc.text(reportDate + ':', 18, yPos + 12);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(59, 130, 246);
        doc.text('B: P' + (dailyBookingsRevenue || 0).toLocaleString(), 42, yPos + 12);
        
        doc.setTextColor(16, 185, 129);
        doc.text('S: P' + (dailyInquiriesRevenue || 0).toLocaleString(), 70, yPos + 12);
        
        doc.setTextColor(139, 92, 246);
        doc.setFont('helvetica', 'bold');
        doc.text('T: P' + (dailyTotalRevenue || 0).toLocaleString(), 18, yPos + 17);
        
        // Right Side: Status Breakdown for Selected Date
        const rcx = (pageWidth / 2) + 20;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('STATUS BREAKDOWN', rcx, yPos + 5);
        
        doc.setFontSize(9);
        doc.setTextColor(59, 130, 246);
        doc.text('BOOKINGS:', rcx + 5, yPos + 13);
        
        const totalDailyB = dailyBookingsCount || 0;
        const dailyCP = totalDailyB > 0 ? ((dailyBookingsCount / totalDailyB) * 100).toFixed(0) : 0;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Confirmed: ' + (dailyBookingsCount || 0) + ' (' + dailyCP + '%)', rcx + 7, yPos + 19);
        doc.setTextColor(234, 179, 8);
        doc.text('Pending: 0 (0%)', rcx + 7, yPos + 24);
        doc.setTextColor(239, 68, 68);
        doc.text('Cancelled: 0', rcx + 7, yPos + 29);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('SERVICES:', rcx + 5, yPos + 37);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Completed: ' + (dailyServicesCount || 0), rcx + 7, yPos + 43);
        doc.setTextColor(234, 179, 8);
        doc.text('Pending: 0', rcx + 7, yPos + 48);
        
        yPos += 55;
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
            body: dailyTopPackages.length > 0 
                ? dailyTopPackages.map(p => [p.name, String(p.bookings), p.revenue])
                : [['No packages booked on this date', '0', 'PHP 0']],
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
        
        doc.save(`WanderWave_Daily_Report_${reportDate}.pdf`);
        
    } catch (error) {
        console.error('PDF Error:', error);
        alert('PDF Export Error: ' + error.message);
    }
};