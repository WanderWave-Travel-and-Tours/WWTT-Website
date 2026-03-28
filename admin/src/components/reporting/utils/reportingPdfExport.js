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

        // ── HELPER: section heading (mirrors pdfExport.js style) ──────────
        const drawSectionHeader = (number, title, y) => {
            doc.setFillColor(245, 247, 250);
            doc.rect(14, y, pageWidth - 28, 8, 'F');
            doc.setFillColor(255, 140, 66);    // orange accent
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
        // 1. QUICK STATS OVERVIEW
        // ══════════════════════════════════════════════════════════════════
        drawSectionHeader(1, 'QUICK STATS OVERVIEW', yPos);
        yPos += 12;

        const statsBody = quickStats.map(s => [
            sanitize(s.label),
            sanitize(s.value),
            sanitize(s.change  || '--'),
            sanitize(s.sub     || '--'),
        ]);

        autoTable(doc, {
            startY:   yPos,
            head:     [['Metric', 'Value', 'Change', 'Detail']],
            body:     statsBody,
            theme:    'plain',
            margin:   { left: 14, right: 14 },
            headStyles: {
                fillColor:  [0, 31, 63],
                textColor:  [255, 255, 255],
                fontSize:   10,
                fontStyle:  'bold',
            },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 'auto', fontStyle: 'bold' },
                1: { halign: 'center', cellWidth: 25, fontStyle: 'bold', textColor: [0, 31, 63] },
                2: { halign: 'center', cellWidth: 28 },
                3: { cellWidth: 'auto', textColor: [100, 100, 100], fontSize: 8 },
            },
            didParseCell: (data) => {
                if (data.section !== 'body') return;
                const change   = quickStats[data.row.index]?.change;
                const positive = quickStats[data.row.index]?.positive;
                if (data.column.index === 2 && change && change !== '—') {
                    data.cell.styles.textColor = positive
                        ? [22, 163, 74]    // green
                        : [220, 38, 38];   // red
                }
            },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // ══════════════════════════════════════════════════════════════════
        // 2. PLATFORM SUMMARY
        // ══════════════════════════════════════════════════════════════════
        checkPageBreak(80);
        drawSectionHeader(2, 'PLATFORM SUMMARY', yPos);
        yPos += 12;

        const platformBody = platformSummary.map(p => [
            sanitize(p.platform),
            sanitize(p.followers),
            sanitize(p.reach),
            sanitize(p.engagement),
            sanitize(p.rate),
        ]);

        // Platform color map for cell styling
        const PLATFORM_COLORS = {
            Facebook:  [24, 119, 242],
            Instagram: [225, 48,  108],
            TikTok:    [1,   1,   1  ],
        };

        autoTable(doc, {
            startY:   yPos,
            head:     [['Platform', 'Followers', 'Reach', 'Engagement', 'Eng. Rate']],
            body:     platformBody,
            theme:    'plain',
            margin:   { left: 14, right: 14 },
            headStyles: {
                fillColor: [0, 31, 63],
                textColor: [255, 255, 255],
                fontSize:  10,
                fontStyle: 'bold',
            },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
            alternateRowStyles: { fillColor: [250, 250, 250] },
            columnStyles: {
                0: { cellWidth: 35, fontStyle: 'bold' },
                1: { halign: 'center', cellWidth: 35 },
                2: { halign: 'center', cellWidth: 35 },
                3: { halign: 'center', cellWidth: 35 },
                4: { halign: 'center', cellWidth: 35, fontStyle: 'bold' },
            },
            didParseCell: (data) => {
                if (data.section !== 'body') return;
                const platformName = platformSummary[data.row.index]?.platform;
                const color        = PLATFORM_COLORS[platformName];
                if (data.column.index === 0 && color) {
                    data.cell.styles.textColor = color;
                }
                if (data.column.index === 4 && color) {
                    data.cell.styles.textColor = color;
                }
            },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // ══════════════════════════════════════════════════════════════════
        // 3. MONTHLY REACH DATA (Chart Data)
        // ══════════════════════════════════════════════════════════════════
        checkPageBreak(80);
        drawSectionHeader(3, 'MONTHLY REACH PERFORMANCE', yPos);
        yPos += 12;

        if (chartData.length > 0) {
            const reachBody = chartData.map(row => [
                row.month           || '—',
                (row.Facebook  || 0).toLocaleString(),
                (row.Instagram || 0).toLocaleString(),
                (row.TikTok    || 0).toLocaleString(),
                ((row.Facebook || 0) + (row.Instagram || 0) + (row.TikTok || 0)).toLocaleString(),
            ]);

            autoTable(doc, {
                startY:   yPos,
                head:     [['Month', 'Facebook', 'Instagram', 'TikTok', 'Combined']],
                body:     reachBody,
                theme:    'plain',
                margin:   { left: 14, right: 14 },
                headStyles: {
                    fillColor: [0, 31, 63],
                    textColor: [255, 255, 255],
                    fontSize:  10,
                    fontStyle: 'bold',
                },
                bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                columnStyles: {
                    0: { cellWidth: 22, fontStyle: 'bold' },
                    1: { halign: 'right', cellWidth: 38, textColor: [24, 119, 242] },
                    2: { halign: 'right', cellWidth: 38, textColor: [225, 48, 108] },
                    3: { halign: 'right', cellWidth: 38, textColor: [1, 1, 1] },
                    4: { halign: 'right', cellWidth: 38, fontStyle: 'bold', textColor: [0, 31, 63] },
                },
            });

            yPos = doc.lastAutoTable.finalY + 8;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text(
                'Reach figures represent estimated organic + paid monthly reach per platform.',
                14, yPos,
            );

            yPos += 14;
        } else {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('No chart data available for the selected period.', 14, yPos + 6);
            yPos += 18;
        }

        // ══════════════════════════════════════════════════════════════════
        // 4. PAGE VIEW ANALYTICS
        // ══════════════════════════════════════════════════════════════════
        checkPageBreak(80);
        drawSectionHeader(4, 'PAGE VIEW ANALYTICS', yPos);
        yPos += 12;

        const pv            = filteredPageViewStats;
        const pvTotal       = pv.totalViews        || 0;
        const pvPackages    = pv.packagesPageViews  || 0;
        const pvBooking     = pv.bookingPageViews   || 0;
        const pvFlights     = pv.flightsPageViews   || 0;
        const pvServices    = pv.servicesPageViews  || 0;
        const pvOther       = Math.max(0, pvTotal - pvPackages - pvBooking - pvFlights - pvServices);

        const shareOf = (n) => pvTotal > 0 ? ((n / pvTotal) * 100).toFixed(1) + '%' : '0.0%';

        autoTable(doc, {
            startY:   yPos,
            head:     [['Page', 'Views', 'Share of Total']],
            body: [
                ['Package Deals (/packages)',  String(pvPackages), shareOf(pvPackages)],
                ['Booking Page (/booking)',     String(pvBooking),  shareOf(pvBooking) ],
                ['Flight Search (/flights)',    String(pvFlights),  shareOf(pvFlights) ],
                ['Other Services (/services)', String(pvServices), shareOf(pvServices)],
                ['Other Pages',                String(pvOther),    shareOf(pvOther)   ],
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

        // ── View-to-Book conversion rate ───────────────────────────────────
        const confirmedBookings = filteredBookingCounts.totalConfirmedBookings || 0;

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text(
            'View-to-Book Rate (Confirmed Bookings / Booking Page Views):',
            14, yPos,
        );
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text(viewToBookRate + '%', 133, yPos);

        yPos += 7;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(
            confirmedBookings + ' confirmed booking(s) out of ' + pvBooking + ' Booking Page Views.',
            14, yPos,
        );

        yPos += 14;

        // ══════════════════════════════════════════════════════════════════
        // 5. SOCIAL REFERRAL SUMMARY
        // ══════════════════════════════════════════════════════════════════
        checkPageBreak(80);
        drawSectionHeader(5, 'SOCIAL REFERRAL SUMMARY', yPos);
        yPos += 12;

        // Pull social referral data from quickStats (indices 1-3 are FB, IG, TikTok)
        const socialStats = quickStats.filter(s =>
            ['Facebook → Website', 'Instagram → Website', 'TikTok → Website'].includes(s.label)
        );

        if (socialStats.length > 0) {
            const socialBody = socialStats.map(s => [
                sanitize(s.label),
                sanitize(s.value),
                sanitize(s.change   || '--'),
                s.positive ? 'Positive' : 'Negative',
            ]);

            autoTable(doc, {
                startY:   yPos,
                head:     [['Source', 'Referral Clicks', 'MoM Change', 'Trend']],
                body:     socialBody,
                theme:    'plain',
                margin:   { left: 14, right: 14 },
                headStyles: {
                    fillColor: [0, 31, 63],
                    textColor: [255, 255, 255],
                    fontSize:  10,
                    fontStyle: 'bold',
                },
                bodyStyles: { fontSize: 9, textColor: [60, 60, 60] },
                alternateRowStyles: { fillColor: [250, 250, 250] },
                columnStyles: {
                    0: { cellWidth: 'auto', fontStyle: 'bold' },
                    1: { halign: 'center', cellWidth: 32, fontStyle: 'bold', textColor: [0, 31, 63] },
                    2: { halign: 'center', cellWidth: 30 },
                    3: { halign: 'center', cellWidth: 28 },
                },
                didParseCell: (data) => {
                    if (data.section !== 'body') return;
                    const isPositive = socialStats[data.row.index]?.positive;
                    if (data.column.index === 2) {
                        data.cell.styles.textColor = isPositive
                            ? [22,  163, 74]
                            : [220, 38,  38];
                    }
                    if (data.column.index === 3) {
                        data.cell.styles.textColor = isPositive
                            ? [22,  163, 74]
                            : [220, 38,  38];
                    }
                },
            });

            yPos = doc.lastAutoTable.finalY + 8;
        } else {
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text('No social referral data available.', 14, yPos + 6);
            yPos += 18;
        }

        // ── Period note ────────────────────────────────────────────────────
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(
            'Note: Referral click data is sourced from social analytics integrations and may be approximate.',
            14, yPos,
        );

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