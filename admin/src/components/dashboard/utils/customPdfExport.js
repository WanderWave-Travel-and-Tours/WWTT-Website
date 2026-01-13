import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Siguraduhin na tama ang path ng logo mo
import logo from '../../../assets/Logo.png';

// BINAGO: Pangalan ng function (exportCustomToPDF) at nagdagdag ng range parameter
export const exportCustomToPDF = (stats, dailyData = [], topPackages = [], range = { start: "", end: "" }) => {
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
        
        // --- HEADER SECTION ---
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('WANDERWAVE TRAVEL', 14, 20);
        
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Custom Performance & Revenue Report', 14, 28);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        doc.text('Generated: ' + currentDate, pageWidth - 14, 20, { align: 'right' });
        
        // Ipakita ang selected date range kung available
        const rangeText = range.start && range.end ? `${range.start} to ${range.end}` : 'Custom Analytics';
        doc.text('Period: ' + rangeText, pageWidth - 14, 26, { align: 'right' });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);
        
        let yPos = 42;
        
        // --- 1. EXECUTIVE SUMMARY (Cards) ---
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
        
        const drawCard = (title, value, color) => {
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.5);
            doc.rect(xPos, yPos, bw, 20);
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(title, xPos + bw/2, yPos + 7, { align: 'center' });
            doc.setFontSize(10); 
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(color[0], color[1], color[2]);
            doc.text(value, xPos + bw/2, yPos + 15, { align: 'center' });
            xPos += bw + gap;
        };

        drawCard('TODAY REVENUE', 'P' + (stats?.todayRevenue || 0).toLocaleString(), [139, 92, 246]);
        drawCard('THIS MONTH', 'P' + (stats?.thisMonthRevenue || 0).toLocaleString(), [59, 130, 246]);
        drawCard('TOTAL REVENUE', 'P' + ((stats?.combinedTotalRevenue || 0) / 1000000).toFixed(2) + 'M', [16, 185, 129]);
        drawCard('BOOKINGS', String(stats?.confirmedBookings || 0), [0, 31, 63]);
        drawCard('SERVICES DONE', String(stats?.completedInquiries || 0), [0, 31, 63]);

        yPos += 28;
        
        // --- 2. REVENUE BREAKDOWN ---
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('2. REVENUE BREAKDOWN', 20, yPos + 5.5);
        yPos += 12;
        
        const totalCombined = (stats?.totalRevenue || 0) + (stats?.totalInquiriesRevenue || 0);
        const bookingsShare = totalCombined > 0 ? (((stats?.totalRevenue || 0) / totalCombined) * 100).toFixed(1) : 0;
        const servicesShare = totalCombined > 0 ? (((stats?.totalInquiriesRevenue || 0) / totalCombined) * 100).toFixed(1) : 0;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Revenue Source', 'Amount (PHP)', 'Volume', 'Share']],
            body: [
                ['Package Bookings', (stats?.totalRevenue || 0).toLocaleString(), (stats?.confirmedBookings || 0) + ' bookings', bookingsShare + '%'],
                ['Travel Services', (stats?.totalInquiriesRevenue || 0).toLocaleString(), (stats?.completedInquiries || 0) + ' services', servicesShare + '%'],
                ['TOTAL', totalCombined.toLocaleString(), ((stats?.confirmedBookings || 0) + (stats?.completedInquiries || 0)) + ' total', '100%']
            ],
            theme: 'plain',
            margin: { left: 14, right: 14 },
            headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 'auto', fontStyle: 'bold' },
                1: { halign: 'right', cellWidth: 40 },
                2: { halign: 'center', cellWidth: 40, fontSize: 8, textColor: [100, 100, 100] },
                3: { halign: 'center', cellWidth: 30, fontStyle: 'bold' }
            },
            didParseCell: (data) => {
                if (data.row.index === 2 && data.section === 'body') {
                    data.cell.styles.fillColor = [245, 247, 250];
                    data.cell.styles.fontStyle = 'bold';
                    if (data.column.index === 1) data.cell.styles.textColor = [139, 92, 246];
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        
        // --- 3. FINANCIAL OVERVIEW ---
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
                ['Total Gross Sales', (stats?.totalSales || 0).toLocaleString(), 'Total value of confirmed bookings'],
                ['Total Seller Cost', (stats?.totalSellerCost || 0).toLocaleString(), 'Payable to suppliers/partners'],
                ['Net Profit (Markup)', (stats?.totalMarkup || 0).toLocaleString(), 'Net Earnings from bookings']
            ],
            theme: 'plain',
            margin: { left: 14, right: 14 },
            headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { textColor: [100, 100, 100], fontSize: 8 } },
            didParseCell: (data) => {
                if (data.row.index === 2 && data.section === 'body') {
                    data.cell.styles.fillColor = [236, 253, 245];
                    if (data.column.index === 1) data.cell.styles.textColor = [72, 187, 120];
                }
            }
        });
        
        yPos = doc.lastAutoTable.finalY + 15;
        if (yPos > pageHeight - 60) { doc.addPage(); addWatermark(); yPos = 20; }
        
        // --- 4. PERFORMANCE ANALYTICS ---
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('4. PERFORMANCE ANALYTICS (Trend Data)', 20, yPos + 5.5);
        yPos += 12;

        doc.setFontSize(10);
        doc.text('REVENUE TRAJECTORY', 14, yPos + 5);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        const safeDailyData = Array.isArray(dailyData) ? dailyData.slice(-7) : [];
        
        safeDailyData.forEach((data, i) => {
            const br = 'P' + (data.bookingsRevenue || 0).toLocaleString();
            const sr = 'P' + (data.inquiriesRevenue || 0).toLocaleString();
            const tr = 'P' + (data.totalRevenue || 0).toLocaleString();
            
            doc.setTextColor(60, 60, 60);
            doc.setFont('helvetica', 'bold');
            doc.text(data.date + ':', 18, yPos + 12 + (i * 5));
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(59, 130, 246);
            doc.text('B:' + br, 40, yPos + 12 + (i * 5));
            doc.setTextColor(16, 185, 129);
            doc.text('S:' + sr, 75, yPos + 12 + (i * 5));
            doc.setTextColor(139, 92, 246);
            doc.text('T:' + tr, 110, yPos + 12 + (i * 5));
        });

        const rcx = pageWidth / 2 + 30;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('STATUS SUMMARY', rcx, yPos + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(72, 187, 120);
        doc.text('Confirmed Bkngs: ' + (stats?.confirmedBookings || 0), rcx + 5, yPos + 13);
        doc.setTextColor(234, 179, 8);
        doc.text('Pending Bkngs: ' + (stats?.pendingBookings || 0), rcx + 5, yPos + 18);
        doc.setTextColor(16, 185, 129);
        doc.text('Services Done: ' + (stats?.completedInquiries || 0), rcx + 5, yPos + 23);

        yPos += 50;
        if (yPos > pageHeight - 60) { doc.addPage(); addWatermark(); yPos = 20; }
        
        // --- 5. TOP PERFORMING PACKAGES (UPDATED DESIGN) ---
        doc.setFillColor(245, 247, 250);
        doc.rect(14, yPos, pageWidth - 28, 8, 'F');
        doc.setFillColor(255, 140, 66);
        doc.rect(14, yPos, 3, 8, 'F');
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(12); // Ginawang 12 para tumugma sa Section 1
        doc.setFont('helvetica', 'bold'); // Ginawang bold
        doc.text('5. TOP PERFORMING PACKAGES', 20, yPos + 5.5);
        yPos += 12;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Package Name', 'Bookings', 'Revenue Generated']],
            body: (Array.isArray(topPackages) ? topPackages : []).slice(0, 5).map(p => [
                p.name, 
                String(p.bookings), 
                'P' + (p.revenue || 0).toLocaleString()
            ]),
            theme: 'plain',
            margin: { left: 14, right: 14 },
            headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'center' }, 2: { halign: 'right', fontStyle: 'bold' } }
        });
        
        // --- FOOTER ---
        const pc = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pc; i++) {
            doc.setPage(i);
            const fy = pageHeight - 10;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Confidential Internal Document | WanderWave Travel', pageWidth / 2, fy, { align: 'center' });
            doc.text('Page ' + i + ' of ' + pc, pageWidth - 14, fy, { align: 'right' });
        }
        
        doc.save(`WanderWave_Custom_Report_${currentDate.replace(/\//g, '-')}.pdf`);
        
    } catch (error) {
        console.error('PDF Error:', error);
        alert('PDF Export Error: ' + error.message);
    }
};