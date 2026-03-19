import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Import logo as module
import logo from '../../../assets/Logo.png';

export const exportToPDF = (stats, trendData, topPackages, allPackages = [], pageViewStats = {}) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        
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
        
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('WANDERWAVE TRAVEL', 14, 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Executive Performance Report', 14, 28);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        doc.text('Generated: ' + currentDate, pageWidth - 14, 20, { align: 'right' });
        doc.text('Period: Last 6 Months', pageWidth - 14, 26, { align: 'right' });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);
        
        let yPos = 42;
        
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
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
        doc.text('COMBINED REVENUE', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text('P' + ((stats.combinedTotalRevenue || 0) / 1000000).toFixed(2) + 'M', xPos + bw/2, yPos + 15, { align: 'center' });
        
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('BOOKINGS', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text('P' + ((stats.totalRevenue || 0) / 1000000).toFixed(2) + 'M', xPos + bw/2, yPos + 15, { align: 'center' });
        
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('SERVICES', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('P' + ((stats.totalInquiriesRevenue || 0) / 1000000).toFixed(2) + 'M', xPos + bw/2, yPos + 15, { align: 'center' });
        
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('BOOKINGS COUNT', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 31, 63);
        doc.text(String(stats.totalBookings || 0), xPos + bw/2, yPos + 15, { align: 'center' });
        
        xPos += bw + gap;
        doc.rect(xPos, yPos, bw, 20);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('SERVICES DONE', xPos + bw/2, yPos + 7, { align: 'center' });
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 31, 63);
        doc.text(String(stats.completedInquiries || 0), xPos + bw/2, yPos + 15, { align: 'center' });
        
        yPos += 28;
        
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('2. REVENUE BREAKDOWN', 20, yPos + 5.5);
        yPos += 12;
        
        const totalCombined = (stats.totalRevenue || 0) + (stats.totalInquiriesRevenue || 0);
        const bookingsShare = totalCombined > 0 ? (((stats.totalRevenue || 0) / totalCombined) * 100).toFixed(1) : 0;
        const servicesShare = totalCombined > 0 ? (((stats.totalInquiriesRevenue || 0) / totalCombined) * 100).toFixed(1) : 0;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Revenue Source', 'Amount (PHP)', 'Volume', 'Share']],
            body: [
                ['Package Bookings', (stats.totalRevenue || 0).toLocaleString(), (stats.confirmedBookings || 0) + ' bookings', bookingsShare + '%'],
                ['Travel Services', (stats.totalInquiriesRevenue || 0).toLocaleString(), (stats.completedInquiries || 0) + ' services', servicesShare + '%'],
                ['TOTAL', totalCombined.toLocaleString(), ((stats.confirmedBookings || 0) + (stats.completedInquiries || 0)) + ' total', '100%']
            ],
            theme: 'plain',
            // Siguraduhin na ang margin ay pareho sa header (14)
            margin: { left: 14, right: 14 }, 
            headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 'auto', fontStyle: 'bold' }, // Gawing 'auto' para mag-adjust sa text
                1: { halign: 'right', cellWidth: 40 },
                2: { halign: 'center', cellWidth: 40, fontSize: 8, textColor: [100, 100, 100] },
                3: { halign: 'center', cellWidth: 30, fontStyle: 'bold' }
            },
            margin: { left: 14, right: 14 },
            didParseCell: function(data) {
                if (data.row.index === 2 && data.section === 'body') {
                    data.cell.styles.fillColor = [245, 247, 250];
                    data.cell.styles.fontStyle = 'bold';
                    if (data.column.index === 1) data.cell.styles.textColor = [139, 92, 246];
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('3. FINANCIAL OVERVIEW (Bookings)', 20, yPos + 5.5);
        yPos += 12;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Amount (PHP)', 'Note']],
            body: [
                ['Total Gross Sales', (stats.totalSales || 0).toLocaleString(), 'Total value of confirmed bookings'],
                ['Total Seller Cost', (stats.totalSellerCost || 0).toLocaleString(), 'Payable to suppliers/partners'],
                ['Net Profit (Markup)', (stats.totalMarkup || 0).toLocaleString(), 'Net Earnings from bookings']
            ],
            theme: 'plain',
            margin: { left: 14, right: 14 }, // Pantay dapat sa 14
            headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            columnStyles: {
                0: { cellWidth: 50, fontStyle: 'bold' },
                1: { halign: 'right', cellWidth: 40 },
                2: { cellWidth: 'auto', textColor: [100, 100, 100], fontSize: 8 } // 'auto' para kainin ang tira na space
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
        if (yPos > pageHeight - 80) {
            doc.addPage();
            addWatermark(); 
            yPos = 20;
        }
        
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('4. PERFORMANCE ANALYTICS', 20, yPos + 5.5);
        yPos += 12;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('COMBINED REVENUE TRAJECTORY', 14, yPos + 5);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        trendData.forEach((data, i) => {
            const br = data.bookingsRevenue ? 'P' + (data.bookingsRevenue/1000).toFixed(0) + 'k' : 'P0';
            const sr = data.inquiriesRevenue ? 'P' + (data.inquiriesRevenue/1000).toFixed(0) + 'k' : 'P0';
            const tr = data.totalRevenue ? 'P' + (data.totalRevenue/1000).toFixed(0) + 'k' : 'P0';
            
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'bold');
            doc.text(data.month + ':', 18, yPos + 12 + (i * 5));
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(59, 130, 246);
            doc.text('B:' + br, 32, yPos + 12 + (i * 5));
            doc.setTextColor(16, 185, 129);
            doc.text('S:' + sr, 50, yPos + 12 + (i * 5));
            doc.setTextColor(139, 92, 246);
            doc.setFont('helvetica', 'bold');
            doc.text('T:' + tr, 68, yPos + 12 + (i * 5));
        });
        
        const rcx = pageWidth / 2 + 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('STATUS BREAKDOWN', rcx, yPos + 5);
        
        doc.setFontSize(9);
        doc.setTextColor(59, 130, 246);
        doc.text('BOOKINGS:', rcx + 5, yPos + 13);
        
        const cp = stats.totalBookings > 0 ? ((stats.confirmedBookings / stats.totalBookings) * 100).toFixed(0) : 0;
        const pp = stats.totalBookings > 0 ? ((stats.pendingBookings / stats.totalBookings) * 100).toFixed(0) : 0;
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Confirmed: ' + (stats.confirmedBookings || 0) + ' (' + cp + '%)', rcx + 7, yPos + 19);
        doc.setTextColor(234, 179, 8);
        doc.text('Pending: ' + (stats.pendingBookings || 0) + ' (' + pp + '%)', rcx + 7, yPos + 24);
        doc.setTextColor(239, 68, 68);
        doc.text('Cancelled: ' + (stats.cancelledBookings || 0), rcx + 7, yPos + 29);
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(16, 185, 129);
        doc.text('SERVICES:', rcx + 5, yPos + 37);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Completed: ' + (stats.completedInquiries || 0), rcx + 7, yPos + 43);
        doc.setTextColor(234, 179, 8);
        doc.text('Pending: ' + (stats.pendingInquiries || 0), rcx + 7, yPos + 48);
        
        yPos += 55;
        if (yPos > pageHeight - 60) {
            doc.addPage();
            addWatermark(); 
            yPos = 20;
        }
        
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('5. TOP PERFORMING PACKAGES', 20, yPos + 5.5);
        yPos += 12;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Package Name', 'Bookings', 'Revenue Generated']],
            body: topPackages.map(p => [p.name, String(p.bookings), p.revenue]),
            theme: 'plain',
            margin: { left: 14, right: 14 },
            headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            columnStyles: {
                0: { cellWidth: 'auto' }, // Hahaba ito base sa pangalan ng package
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
            
            // Re-add watermark on new page
            try {
                const size = 120;
                const x = (pageWidth - size) / 2;
                const y = (pageHeight - size) / 2;
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.1 }));
                doc.addImage(logo, 'PNG', x, y, size, size);
                doc.restoreGraphicsState();
            } catch (e) {}

            yPos = 20;
        }

        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
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
            headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 30, fontStyle: 'bold' },
                2: { halign: 'center', cellWidth: 35 },
            },
            didParseCell: function(data) {
                if (data.row.index === 4 && data.section === 'body') {
                    data.cell.styles.fillColor = [245, 247, 250];
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
        doc.text('Confidential Internal Document | WanderWave Travel & Tours', pageWidth / 2, fy, { align: 'center' });
        
        const pc = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pc; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Page ' + i + ' of ' + pc, pageWidth - 14, fy, { align: 'right' });
        }
        
        doc.save('WanderWave_Executive_Report_' + new Date().toISOString().split('T')[0] + '.pdf');
        
    } catch (error) {
        console.error('PDF Error:', error);
        alert('PDF Error: ' + error.message);
    }
};