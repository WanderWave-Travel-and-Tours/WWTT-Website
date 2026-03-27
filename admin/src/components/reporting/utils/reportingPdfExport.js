import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../assets/Logo.png';

/**
 * exportReportingToPDF
 * Social Media & Analytics PDF — WanderWave Reporting page.
 */
export const exportReportingToPDF = ({
    quickStats = [],
    platformSummary = [],
    chartData = [],
    activeChart = 'reach',
    filteredPageViewStats = {},
    filteredBookingCounts = {},
    viewToBookRate = '0.0',
    activePeriod = 'weekly',
    periodLabel = 'This Week',
}) => {
    try {
        const doc        = new jsPDF();
        const pageWidth  = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // ── WATERMARK ────────────────────────────────────────────────────────
        const addWatermark = () => {
            try {
                const size = 120;
                doc.saveGraphicsState();
                doc.setGState(new doc.GState({ opacity: 0.08 }));
                doc.addImage(logo, 'PNG', (pageWidth - size) / 2, (pageHeight - size) / 2, size, size);
                doc.restoreGraphicsState();
            } catch (e) { /* skip if no logo */ }
        };

        addWatermark();

        // ── SECTION HEADER HELPER ────────────────────────────────────────────
        let yPos = 0;
        const addSectionHeader = (num, title) => {
            if (yPos > pageHeight - 60) {
                doc.addPage();
                addWatermark();
                yPos = 20;
            }
            doc.setFillColor(245, 247, 250);
            doc.rect(14, yPos, pageWidth - 28, 9, 'F');
            doc.setFillColor(255, 140, 66);
            doc.rect(14, yPos, 3, 9, 'F');
            doc.setTextColor(0, 31, 63);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(num + '. ' + title, 20, yPos + 6.2);
            yPos += 14;
        };

        // ── HEADER BANNER (dark navy + gold accent) ──────────────────────────
        doc.setFillColor(0, 31, 63);
        doc.rect(0, 0, pageWidth, 36, 'F');

        doc.setFillColor(255, 193, 7);
        doc.rect(0, 36, pageWidth, 2.5, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('WANDERWAVE TRAVEL', 14, 16);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(180, 210, 255);
        doc.text('Social Media & Analytics Report', 14, 25);

        doc.setTextColor(200, 220, 255);
        doc.setFontSize(8);
        const currentDate = new Date().toLocaleDateString('en-US', {
            month: '2-digit', day: '2-digit', year: 'numeric',
        });
        doc.text('Generated: ' + currentDate, pageWidth - 14, 15, { align: 'right' });
        doc.text('Period: ' + periodLabel,     pageWidth - 14, 23, { align: 'right' });

        // Period type pill
        const pSlug = activePeriod === 'daily'   ? 'Daily Report'
                    : activePeriod === 'weekly'  ? 'Weekly Report'
                    : activePeriod === 'monthly' ? 'Monthly Report'
                    : activePeriod === 'trend'   ? 'Trend (6 Mo)'
                    : 'Custom Range';
        const pillW = 40;
        doc.setFillColor(255, 193, 7);
        doc.roundedRect(pageWidth - 14 - pillW, 27.5, pillW, 7, 2, 2, 'F');
        doc.setTextColor(0, 31, 63);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        doc.text(pSlug, pageWidth - 14 - pillW / 2, 32.5, { align: 'center' });

        yPos = 48;

        // ── 1. EXECUTIVE SUMMARY ─────────────────────────────────────────────
        addSectionHeader('1', 'EXECUTIVE SUMMARY');

        // NOTE: jsPDF built-in helvetica does NOT render Unicode arrows (->).
        // All labels must be plain ASCII only.
        const getStat = (label) => quickStats.find(s => s.label === label) || {};

        const summaryCards = [
            {
                line1: 'WEBSITE',    line2: 'VISITS',
                value: getStat('Website Visits').value || '0',
                aR: 59,  aG: 130, aB: 246,
                bgR: 235, bgG: 244, bgB: 255,
            },
            {
                line1: 'FACEBOOK',   line2: 'REFERRALS',
                value: getStat('Facebook \u2192 Website').value || '---',
                aR: 24,  aG: 119, aB: 242,
                bgR: 231, bgG: 240, bgB: 253,
            },
            {
                line1: 'INSTAGRAM',  line2: 'REFERRALS',
                value: getStat('Instagram \u2192 Website').value || '---',
                aR: 225, aG:  48, aB: 108,
                bgR: 253, bgG: 232, bgB: 239,
            },
            {
                line1: 'TIKTOK',     line2: 'REFERRALS',
                value: getStat('TikTok \u2192 Website').value || '---',
                aR: 30,  aG:  30, aB:  30,
                bgR: 240, bgG: 240, bgB: 240,
            },
            {
                line1: 'VIEW-TO-BOOK', line2: 'RATE',
                value: getStat('Page Views \u2192 Booking').value || (viewToBookRate + '%'),
                aR: 139, aG:  92, aB: 246,
                bgR: 245, bgG: 240, bgB: 255,
            },
        ];

        const cardW   = (pageWidth - 28 - 4 * 3) / 5;
        const cardH   = 34;
        const cardGap = 3;
        let cx = 14;

        summaryCards.forEach((card) => {
            // Card background
            doc.setFillColor(card.bgR, card.bgG, card.bgB);
            doc.roundedRect(cx, yPos, cardW, cardH, 2.5, 2.5, 'F');

            // Top accent bar (full-width, rounded top only via overlap trick)
            doc.setFillColor(card.aR, card.aG, card.aB);
            doc.roundedRect(cx, yPos, cardW, 4, 2, 2, 'F');
            doc.rect(cx, yPos + 2, cardW, 2, 'F'); // fill bottom half square

            // Subtle border
            doc.setDrawColor(card.aR, card.aG, card.aB);
            doc.setLineWidth(0.4);
            doc.roundedRect(cx, yPos, cardW, cardH, 2.5, 2.5, 'S');

            // Label line 1
            doc.setFontSize(6.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(70, 70, 70);
            doc.text(card.line1, cx + cardW / 2, yPos + 11, { align: 'center' });

            // Label line 2
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(130, 130, 130);
            doc.text(card.line2, cx + cardW / 2, yPos + 16.5, { align: 'center' });

            // Value
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(card.aR, card.aG, card.aB);
            doc.text(String(card.value), cx + cardW / 2, yPos + 28, { align: 'center' });

            cx += cardW + cardGap;
        });

        yPos += cardH + 14;

        // ── 2. PAGE VIEW BREAKDOWN ───────────────────────────────────────────
        addSectionHeader('2', 'PAGE VIEW BREAKDOWN');

        const pv         = filteredPageViewStats;
        const pvTotal    = pv.totalViews        || 0;
        const pvPackages = pv.packagesPageViews  || 0;
        const pvBooking  = pv.bookingPageViews   || 0;
        const pvFlights  = pv.flightsPageViews   || 0;
        const pvServices = pv.servicesPageViews  || 0;

        const pct = (n) => pvTotal > 0 ? ((n / pvTotal) * 100).toFixed(1) + '%' : '0%';

        const pvRows = [
            { label: 'Package Deals (/packages)', count: pvPackages, color: [59, 130, 246]   },
            { label: 'Booking Page (/booking)',   count: pvBooking,  color: [139, 92, 246]  },
            { label: 'Flight Search (/flights)',  count: pvFlights,  color: [16, 185, 129]  },
            { label: 'Other Services (/services)',count: pvServices, color: [245, 158, 11]  },
        ];

        const maxPv = Math.max(pvPackages, pvBooking, pvFlights, pvServices, 1);

        autoTable(doc, {
            startY: yPos,
            head: [['Page', 'Views', 'Share', 'Volume']],
            body: [
                ...pvRows.map((r) => [r.label, r.count.toLocaleString(), pct(r.count), '']),
                ['TOTAL ALL PAGES', pvTotal.toLocaleString(), '100%', ''],
            ],
            theme: 'plain',
            margin: { left: 14, right: 14 },
            headStyles: {
                fillColor: [0, 31, 63], textColor: [255, 255, 255],
                fontSize: 9, fontStyle: 'bold', cellPadding: 4,
            },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60], cellPadding: 3.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 25, fontStyle: 'bold' },
                2: { halign: 'center', cellWidth: 22 },
                3: { cellWidth: 50 },
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.row.index === 4) {
                    data.cell.styles.fillColor = [0, 31, 63];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = 'bold';
                }
            },
            didDrawCell: function (data) {
                if (data.section !== 'body' || data.column.index !== 3 || data.row.index === 4) return;
                const color  = pvRows[data.row.index]?.color || [100, 100, 100];
                const barH   = 5;
                const maxBarW = data.cell.width - 6;
                const barW   = (pvRows[data.row.index].count / maxPv) * maxBarW;
                doc.setFillColor(...color);
                doc.roundedRect(
                    data.cell.x + 3,
                    data.cell.y + (data.cell.height - barH) / 2,
                    Math.max(barW, 1), barH, 1.5, 1.5, 'F',
                );
            },
        });

        yPos = doc.lastAutoTable.finalY + 8;

        // View-to-Book callout box
        doc.setFillColor(245, 240, 255);
        doc.roundedRect(14, yPos, pageWidth - 28, 18, 3, 3, 'F');
        doc.setDrawColor(139, 92, 246);
        doc.setLineWidth(0.5);
        doc.roundedRect(14, yPos, pageWidth - 28, 18, 3, 3, 'S');

        // Purple left accent
        doc.setFillColor(139, 92, 246);
        doc.roundedRect(14, yPos, 3.5, 18, 1.5, 1.5, 'F');
        doc.rect(16, yPos, 1.5, 18, 'F');

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        doc.text('View-to-Book Rate  (Confirmed Bookings / Booking Page Views)', 21, yPos + 7.5);

        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 92, 246);
        doc.text(viewToBookRate + '%', pageWidth - 18, yPos + 8, { align: 'right' });

        const bookCount = filteredBookingCounts?.totalConfirmedBookings || 0;
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(120, 90, 180);
        doc.text(
            bookCount + ' confirmed booking(s) out of ' + pvBooking.toLocaleString() + ' booking page view(s) in this period.',
            21, yPos + 14.5,
        );

        yPos += 26;

        // ── 3. PLATFORM SUMMARY ──────────────────────────────────────────────
        addSectionHeader('3', 'PLATFORM SUMMARY');

        const platColors = [
            [24,  119, 242],   // Facebook
            [225,  48, 108],   // Instagram
            [30,   30,  30],   // TikTok
        ];
        const platBgs = [
            [231, 240, 253],
            [253, 232, 239],
            [240, 240, 240],
        ];

        const platW   = (pageWidth - 28 - 2 * 5) / 3;
        const platH   = 48;
        const platGap = 5;

        platformSummary.forEach((p, i) => {
            const px = 14 + i * (platW + platGap);
            const [cR, cG, cB] = platColors[i];
            const [bgR, bgG, bgB] = platBgs[i];

            // Card background
            doc.setFillColor(bgR, bgG, bgB);
            doc.roundedRect(px, yPos, platW, platH, 3, 3, 'F');

            // Top colored band
            doc.setFillColor(cR, cG, cB);
            doc.roundedRect(px, yPos, platW, 5, 2, 2, 'F');
            doc.rect(px, yPos + 3, platW, 2, 'F');

            // Border
            doc.setDrawColor(cR, cG, cB);
            doc.setLineWidth(0.4);
            doc.roundedRect(px, yPos, platW, platH, 3, 3, 'S');

            // Platform name
            doc.setFontSize(10.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(cR, cG, cB);
            doc.text(p.platform, px + platW / 2, yPos + 14, { align: 'center' });

            // Thin divider
            doc.setDrawColor(cR, cG, cB);
            doc.setLineWidth(0.3);
            doc.setLineDashPattern([2, 2], 0);
            doc.line(px + 10, yPos + 16.5, px + platW - 10, yPos + 16.5);
            doc.setLineDashPattern([], 0);

            // 4 metrics in 2x2 grid
            const metrics = [
                ['Followers',  p.followers],
                ['Reach',      p.reach],
                ['Engagement', p.engagement],
                ['Eng. Rate',  p.rate],
            ];
            const cw = platW / 2;
            metrics.forEach(([lbl, val], mi) => {
                const mx = px + (mi % 2) * cw + cw / 2;
                const my = yPos + 24 + Math.floor(mi / 2) * 14;

                doc.setFontSize(6);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(140, 140, 140);
                doc.text(lbl.toUpperCase(), mx, my, { align: 'center' });

                doc.setFontSize(9.5);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(mi === 3 ? cR : 30, mi === 3 ? cG : 30, mi === 3 ? cB : 30);
                doc.text(String(val), mx, my + 7, { align: 'center' });
            });
        });

        yPos += platH + 14;

        // ── 4. SOCIAL MEDIA PERFORMANCE TABLE ───────────────────────────────
        const chartLabel = activeChart.charAt(0).toUpperCase() + activeChart.slice(1);
        addSectionHeader('4', 'SOCIAL MEDIA ' + chartLabel.toUpperCase() + ' — ' + periodLabel);

        const chartBody = (chartData || []).map((row) => {
            const fb = row.Facebook  || 0;
            const ig = row.Instagram || 0;
            const tt = row.TikTok    || 0;
            return [
                row.month || row.date || '',
                fb.toLocaleString(),
                ig.toLocaleString(),
                tt.toLocaleString(),
                (fb + ig + tt).toLocaleString(),
            ];
        });

        const totFB = chartData.reduce((s, r) => s + (r.Facebook  || 0), 0);
        const totIG = chartData.reduce((s, r) => s + (r.Instagram || 0), 0);
        const totTT = chartData.reduce((s, r) => s + (r.TikTok    || 0), 0);

        chartBody.push([
            'TOTAL',
            totFB.toLocaleString(),
            totIG.toLocaleString(),
            totTT.toLocaleString(),
            (totFB + totIG + totTT).toLocaleString(),
        ]);

        const lastChartRow = chartBody.length - 1;

        autoTable(doc, {
            startY: yPos,
            head: [['Period', 'Facebook', 'Instagram', 'TikTok', 'Combined Total']],
            body: chartBody,
            theme: 'plain',
            margin: { left: 14, right: 14 },
            headStyles: {
                fillColor: [0, 31, 63], textColor: [255, 255, 255],
                fontSize: 9.5, fontStyle: 'bold', cellPadding: 4,
            },
            bodyStyles: { fontSize: 9, textColor: [60, 60, 60], cellPadding: 3.5 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
                0: { cellWidth: 'auto', fontStyle: 'bold' },
                1: { halign: 'center', cellWidth: 33 },
                2: { halign: 'center', cellWidth: 33 },
                3: { halign: 'center', cellWidth: 33 },
                4: { halign: 'center', cellWidth: 38, fontStyle: 'bold' },
            },
            didParseCell: function (data) {
                if (data.section !== 'body') return;
                if (data.column.index === 1) data.cell.styles.textColor = [24,  119, 242];
                if (data.column.index === 2) data.cell.styles.textColor = [225,  48, 108];
                if (data.column.index === 3) data.cell.styles.textColor = [30,   30,  30];
                if (data.column.index === 4) data.cell.styles.textColor = [0,    31,  63];

                if (data.row.index === lastChartRow) {
                    data.cell.styles.fillColor = [0, 31, 63];
                    data.cell.styles.textColor = [255, 255, 255];
                    data.cell.styles.fontStyle = 'bold';
                    if (data.column.index === 4) data.cell.styles.textColor = [255, 193, 7];
                }
            },
        });

        yPos = doc.lastAutoTable.finalY + 8;

        // Data source note box
        doc.setFillColor(255, 249, 230);
        doc.roundedRect(14, yPos, pageWidth - 28, 12, 2, 2, 'F');
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.4);
        doc.roundedRect(14, yPos, pageWidth - 28, 12, 2, 2, 'S');

        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(130, 85, 0);
        doc.text(
            'Note: Social media figures are based on historical mock data. Connect a live social API for real-time numbers.',
            pageWidth / 2, yPos + 8, { align: 'center' },
        );

        // ── FOOTER (all pages) ───────────────────────────────────────────────
        const fy = pageHeight - 7;
        const pc = doc.internal.getNumberOfPages();

        for (let i = 1; i <= pc; i++) {
            doc.setPage(i);

            doc.setFillColor(0, 31, 63);
            doc.rect(0, pageHeight - 16, pageWidth, 16, 'F');

            doc.setFillColor(255, 193, 7);
            doc.rect(0, pageHeight - 16, pageWidth, 1.5, 'F');

            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(180, 210, 255);
            doc.text('Confidential Internal Document  |  WanderWave Travel & Tours', pageWidth / 2, fy, { align: 'center' });

            doc.setTextColor(255, 193, 7);
            doc.setFont('helvetica', 'bold');
            doc.text('Page ' + i + ' of ' + pc, pageWidth - 14, fy, { align: 'right' });
        }

        // ── SAVE ─────────────────────────────────────────────────────────────
        const periodSlug = activePeriod.charAt(0).toUpperCase() + activePeriod.slice(1);
        doc.save('WanderWave_Social_Report_' + periodSlug + '_' + new Date().toISOString().split('T')[0] + '.pdf');

    } catch (error) {
        console.error('PDF Export Error:', error);
        alert('PDF Export Error: ' + error.message);
    }
};