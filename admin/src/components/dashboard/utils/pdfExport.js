import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const exportToPDF = (stats, trendData, topPackages) => {
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