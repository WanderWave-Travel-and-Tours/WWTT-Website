import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/Logo.png';

// jsPDF's built-in Helvetica only covers latin-1 — strip/replace
// any Unicode characters that would render as garbage glyphs.
const sanitize = (str) =>
    String(str ?? '')
        .replace(/→/g, '>')          // arrow  →  >
        .replace(/←/g, '<')          // arrow  ←  <
        .replace(/–/g,  '-')         // en dash
        .replace(/—/g,  '--')        // em dash
        .replace(/[^\x00-\xFF]/g, '?'); // catch-all for remaining non-latin-1

/**
 * exportReportingToPDF
 *
 * Generates a Social Media Analytics PDF report that mirrors the design
 * language of the existing pdfExport.js (WanderWave Executive Report):
 *   - Watermark
 *   - Navy/orange header
 *   - Orange-accented section headers
 *   - Consistent autoTable styles
 *
 * @param {Object} params
 * @param {Array}  params.quickStats            - Quick stat cards (label, value, change, positive, sub)
 * @param {Array}  params.platformSummary       - Platform cards (platform, followers, reach, engagement, rate, color)
 * @param {Array}  params.chartData             - Monthly reach rows (month, Facebook, Instagram, TikTok)
 * @param {Object} params.filteredPageViewStats - { totalViews, packagesPageViews, bookingPageViews, flightsPageViews, servicesPageViews }
 * @param {Object} params.filteredBookingCounts - { totalConfirmedBookings }
 * @param {string} params.viewToBookRate        - e.g. "4.2"
 * @param {string} params.activePeriod          - e.g. "weekly"
 * @param {string} params.periodLabel           - Human-readable label e.g. "Weekly: Mar 22 – Mar 28"
 */
export const exportReportingToPDF = ({
    quickStats            = [],
    platformSummary       = [],
    chartData             = [],
    filteredPageViewStats = {},
    filteredBookingCounts = {},
    viewToBookRate        = '0.0',
    activePeriod          = 'weekly',
    periodLabel           = 'All Time',
    svPieData             = [],
}) => {
    try {
        const doc       = new jsPDF();
        const pageWidth  = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // ── WATERMARK ──────────────────────────────────────────────────────
        const addWatermark = () => {
            try {
                const size = 120;
                const x    = (pageWidth  - size) / 2;
                const y    = (pageHeight - size) / 2;
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.1 }));
                doc.addImage(logo, 'PNG', x, y, size, size);
                doc.restoreGraphicsState();
            } catch (e) {
                console.log('Watermark skipped:', e.message);
            }
        };

        addWatermark();

        // ── PAGE HEADER ────────────────────────────────────────────────────
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 35, 'F');

        doc.setTextColor(0, 31, 63);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('WANDERWAVE TRAVEL', 14, 20);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text('Social Media Analytics Report', 14, 28);

        const currentDate = new Date().toLocaleDateString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
        });
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text('Generated: ' + currentDate, pageWidth - 14, 20, { align: 'right' });
        doc.text('Period: '    + sanitize(periodLabel),  pageWidth - 14, 26, { align: 'right' });

        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);

        let yPos = 42;

        // ── HELPER: section heading ────────────────────────────────────────
        const drawSectionHeader = (number, title, y) => {
            doc.setFillColor(245, 247, 250);
            doc.rect(14, y, pageWidth - 28, 8, 'F');
            doc.setFillColor(255, 140, 66);
            doc.rect(14, y, 3, 8, 'F');
            doc.setTextColor(0, 31, 63);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(number + '. ' + title, 20, y + 5.5);
        };

        // ── HELPER: page-break guard ───────────────────────────────────────
        const checkPageBreak = (requiredSpace = 60) => {
            if (yPos > pageHeight - requiredSpace) {
                doc.addPage();
                addWatermark();
                yPos = 20;
            }
        };

        // ══════════════════════════════════════════════════════════════════
        // 1. PAGE VIEW ANALYTICS
        // ══════════════════════════════════════════════════════════════════
        drawSectionHeader(1, 'PAGE VIEW ANALYTICS', yPos);
        yPos += 12;

        const pv            = filteredPageViewStats;
        const pvTotal       = pv.totalViews        || 0;
        const pvPackages    = pv.packagesPageViews  || 0;
        const pvBooking     = pv.bookingPageViews   || 0;
        const pvFlights     = pv.flightsPageViews   || 0;
        const pvServices    = pv.servicesPageViews  || 0;
        const pvTours       = pv.toursPageViews     || 0;

        const shareOf = (n) => pvTotal > 0 ? ((n / pvTotal) * 100).toFixed(1) + '%' : '0.0%';

        autoTable(doc, {
            startY:   yPos,
            head:     [['Page', 'Views', 'Share of Total']],
            body: [
                ['Package Deals (/packages)',  String(pvPackages), shareOf(pvPackages)],
                ['Booking Page (/booking)',     String(pvBooking),  shareOf(pvBooking) ],
                ['Flight Search (/flights)',    String(pvFlights),  shareOf(pvFlights) ],
                ['Other Services (/services)', String(pvServices), shareOf(pvServices)],
                ['Tour Packages (/tours)',      String(pvTours),    shareOf(pvTours)   ],
                ['TOTAL ALL PAGES',            String(pvTotal),    '100%'             ],
            ],
            theme:  'plain',
            margin: { left: 14, right: 14 },
            headStyles: {
                fillColor: [0, 31, 63],
                textColor: [255, 255, 255],
                fontSize:  10,
                fontStyle: 'bold',
            },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
                2: { halign: 'center', cellWidth: 35 },
            },
            didParseCell: (data) => {
                if (data.section === 'body' && data.row.index === 5) {
                    data.cell.styles.fillColor  = [245, 247, 250];
                    data.cell.styles.fontStyle  = 'bold';
                    if (data.column.index === 1) {
                        data.cell.styles.textColor = [139, 92, 246];
                    }
                }
            },
        });

        yPos = doc.lastAutoTable.finalY + 10;

        // View-to-Book rate line
        const confirmedBookings = filteredBookingCounts.totalConfirmedBookings || 0;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('View-to-Book Rate (Confirmed Bookings / Booking Page Views):', 14, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text(viewToBookRate + '%', 133, yPos);
        yPos += 7;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(confirmedBookings + ' confirmed booking(s) out of ' + pvBooking + ' Booking Page Views.', 14, yPos);
        yPos += 14;

        // Most Viewed Packages
        if (pv.topViewedPackages && pv.topViewedPackages.length > 0) {
            checkPageBreak(60);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 31, 63);
            doc.text('Most Viewed Packages', 14, yPos);
            yPos += 6;

            const pkgBody = pv.topViewedPackages.slice(0, 5).map((pkg, i) => [
                '#' + (i + 1),
                sanitize(pkg.displayName || pkg.packageName || 'Unknown'),
                String(pkg.views || 0),
            ]);

            autoTable(doc, {
                startY:   yPos,
                head:     [['Rank', 'Package Name', 'Views']],
                body:     pkgBody,
                theme:    'plain',
                margin:   { left: 14, right: 14 },
                headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                columnStyles: {
                    0: { cellWidth: 15, halign: 'center', fontStyle: 'bold', textColor: [0, 31, 63] },
                    1: { cellWidth: 'auto' },
                    2: { cellWidth: 25, halign: 'center', fontStyle: 'bold', textColor: [99, 102, 241] },
                },
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // ══════════════════════════════════════════════════════════════════
        // 2. SITE VISIT OVERVIEW (Pie Chart Data — Overall)
        // ══════════════════════════════════════════════════════════════════
        checkPageBreak(80);
        drawSectionHeader(2, 'SITE VISIT OVERVIEW — Social Referral Traffic', yPos);
        yPos += 12;

        const svTotal = svPieData.reduce((a, b) => a + (b.value || 0), 0);

        autoTable(doc, {
            startY: yPos,
            head:   [['Platform', 'Visits', 'Share']],
            body:   [
                ...svPieData.map(d => [
                    sanitize(d.name),
                    String(d.value || 0),
                    svTotal > 0 ? ((d.value / svTotal) * 100).toFixed(1) + '%' : '0.0%',
                ]),
                ['TOTAL', String(svTotal), '100%'],
            ],
            theme:  'plain',
            margin: { left: 14, right: 14 },
            headStyles: { fillColor: [0, 31, 63], textColor: [255, 255, 255], fontSize: 10, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 'auto', fontStyle: 'bold' },
                1: { halign: 'center', cellWidth: 30, fontStyle: 'bold', textColor: [0, 31, 63] },
                2: { halign: 'center', cellWidth: 30 },
            },
            didParseCell: (data) => {
                if (data.section !== 'body') return;
                const PLATFORM_COLORS = { Facebook: [24, 119, 242], Instagram: [225, 48, 108], TikTok: [1, 1, 1] };
                const name = svPieData[data.row.index]?.name;
                const color = PLATFORM_COLORS[name];
                if (data.column.index === 0 && color) data.cell.styles.textColor = color;
                // Last row (TOTAL) bold
                if (data.row.index === svPieData.length) {
                    data.cell.styles.fillColor = [245, 247, 250];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
        });

        yPos = doc.lastAutoTable.finalY + 15;



        // ══════════════════════════════════════════════════════════════════
        // FOOTER (last page)
        // ══════════════════════════════════════════════════════════════════
        const fy = pageHeight - 15;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(
            'Confidential Internal Document | WanderWave Travel & Tours',
            pageWidth / 2, fy, { align: 'center' },
        );

        // Page numbers on every page
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text('Page ' + i + ' of ' + totalPages, pageWidth - 14, fy, { align: 'right' });
        }

        // ── Save ───────────────────────────────────────────────────────────
        const safePeriod = periodLabel.replace(/[^a-zA-Z0-9_\-]/g, '_').replace(/__+/g, '_');
        doc.save('WanderWave_SocialMedia_Report_' + safePeriod + '_' + new Date().toISOString().split('T')[0] + '.pdf');

    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('PDF Export Error: ' + error.message);
    }
};