import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// Siguraduhin na tama ang path ng logo mo
import logo from '../../../assets/Logo.png';

export const exportWeeklyToPDF = (stats, weeklyData = [], topPackages = [], allPackages = []) => {
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
        doc.text('Weekly Performance & Revenue Report', 14, 28);
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const currentDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
        doc.text('Generated: ' + currentDate, pageWidth - 14, 20, { align: 'right' });
        
        doc.text('Period: Weekly Analytics', pageWidth - 14, 26, { align: 'right' });
        
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(14, 32, pageWidth - 14, 32);
        
        let yPos = 42;
        
        // --- CALCULATE WEEKLY SPECIFIC DATA FROM RAW DATA ---
        const today = new Date();
        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        
        const rawBookings = stats.rawBookings || [];
        const rawInquiries = stats.rawInquiries || [];
        
        // Weekly Bookings filtered by date range
        const weeklyConfirmedBookings = rawBookings.filter(b => 
            b.status === "confirmed" && 
            new Date(b.createdAt) >= startDate && 
            new Date(b.createdAt) <= endDate
        );
        const weeklyPendingBookings = rawBookings.filter(b => 
            b.status === "pending" && 
            new Date(b.createdAt) >= startDate && 
            new Date(b.createdAt) <= endDate
        );
        const weeklyCancelledBookings = rawBookings.filter(b => 
            b.status === "cancelled" && 
            new Date(b.createdAt) >= startDate && 
            new Date(b.createdAt) <= endDate
        );
        const weeklyTotalBookings = weeklyConfirmedBookings.length + weeklyPendingBookings.length + weeklyCancelledBookings.length;
        
        // Weekly Inquiries filtered by date range
        const weeklyCompletedInquiries = rawInquiries.filter(i => 
            i.status === "COMPLETED" && 
            new Date(i.updatedAt) >= startDate && 
            new Date(i.updatedAt) <= endDate
        );
        const weeklyPendingInquiries = rawInquiries.filter(i => 
            i.status !== "COMPLETED" && 
            new Date(i.updatedAt) >= startDate && 
            new Date(i.updatedAt) <= endDate
        );
        
        // === FINANCIAL CALCULATIONS ===
        const totalGrossSales = weeklyData.reduce((sum, d) => sum + (d.bookingsRevenue || 0), 0);
        const servicesRevenue = weeklyData.reduce((sum, d) => sum + (d.inquiriesRevenue || 0), 0);

        let totalSellerCost = 0;
        let totalMarkupProfit = 0;

        console.log('=== WEEKLY PACKAGE MATCHING & FINANCIAL CALCULATION ===');
        console.log('Packages available:', allPackages?.length || 0);
        console.log('Confirmed bookings this week:', weeklyConfirmedBookings.length);

        // === PROCESS EACH CONFIRMED BOOKING ===
        weeklyConfirmedBookings.forEach((booking, idx) => {
            const pkgName = (booking.packageName || '').trim();
            const hotelName = (booking.hotelName || '').trim();
            const pax = (booking.pax?.adult || 0) + (booking.pax?.children || 0) + (booking.pax?.infants || 0) || 1;

            console.log(`\n[Booking ${idx + 1}]`);
            console.log(`  Package Name: "${pkgName}"`);
            console.log(`  Hotel Name: "${hotelName}"`);
            console.log(`  Pax: ${pax}`);

            let matchedPackage = null;

            // 1. Strict exact match first (same as your daily version)
            if (pkgName && allPackages?.length > 0) {
                const pkgKey = pkgName.toLowerCase();
                const hotelKey = hotelName.toLowerCase();

                matchedPackage = allPackages.find(pkg => {
                    const title = (pkg.title || '').trim().toLowerCase();
                    const dest = (pkg.destination || '').trim().toLowerCase();

                    return title === pkgKey && 
                           (!hotelKey || dest === hotelKey);
                });

                if (matchedPackage) {
                    console.log(`  ✓ EXACT MATCH FOUND! → ${matchedPackage.title} (${matchedPackage.destination || 'no dest'})`);
                }
            }

            // 2. Fallback: package name only — mas flexible gamit .includes()
            if (!matchedPackage && pkgName && allPackages?.length > 0) {
                const pkgKey = pkgName.toLowerCase();
                console.log(`  → Fallback: trying package name only (contains match): "${pkgKey}"`);

                matchedPackage = allPackages.find(pkg => {
                    const title = (pkg.title || '').trim().toLowerCase();
                    return title === pkgKey || 
                           title.includes(pkgKey) || 
                           pkgKey.includes(title);
                });

                if (matchedPackage) {
                    console.log(`  ✓ FALLBACK MATCH FOUND → ${matchedPackage.title} (${matchedPackage.destination || 'no dest'})`);
                }
            }

            if (matchedPackage) {
                const sellerPrice = Number(matchedPackage.sellerPrice) || 0;
                const markup = Number(matchedPackage.markup) || 0;

                const cost = sellerPrice * pax;
                const profit = markup * pax;

                totalSellerCost += cost;
                totalMarkupProfit += profit;

                console.log(`    → sellerPrice: ${sellerPrice} × ${pax} = ${cost}`);
                console.log(`    → markup: ${markup} × ${pax} = ${profit}`);
            } else {
                console.warn(`  ✗ NO MATCH FOUND — skipping cost/markup for this booking`);
                console.log('  Available packages for reference (first 5):');
                allPackages?.slice(0, 5).forEach(p => {
                    console.log(`    - ${p.title} (${p.destination || 'no dest'})`);
                });
            }
        });

        const totalNetProfit = totalMarkupProfit + servicesRevenue;

        console.log('\n=== WEEKLY FINAL FINANCIAL SUMMARY ===');
        console.log(`Gross Bookings Revenue:    ₱${totalGrossSales.toLocaleString()}`);
        console.log(`Services Revenue:          ₱${servicesRevenue.toLocaleString()}`);
        console.log(`Total Seller Cost:         ₱${totalSellerCost.toLocaleString()}`);
        console.log(`Total Markup Profit:       ₱${totalMarkupProfit.toLocaleString()}`);
        console.log(`Total Net Profit:          ₱${totalNetProfit.toLocaleString()}`);
        console.log('=======================================\n');

        // Lahat ng sumusunod ay **EXACTLY** ang original layout mo — WALANG BINAGO
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

        // Card 1: Combined Revenue (Bookings + Services)
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
        doc.text('P' + (totalGrossSales + servicesRevenue).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        doc.text('P' + (totalGrossSales || 0).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        doc.text('P' + (servicesRevenue || 0).toLocaleString(), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        doc.text(String(weeklyTotalBookings), xPos + bw/2, yPos + 15, { align: 'center' });
        
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
        
        const totalCombined = (totalGrossSales + servicesRevenue);
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
        doc.text('REVENUE TRAJECTORY (Last 7 Days)', 14, yPos + 5);
        
        const safeWeeklyData = Array.isArray(weeklyData) ? weeklyData.slice(-7) : [];
        
        safeWeeklyData.forEach((data, i) => {
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

        const rcx = pageWidth / 2 + 40; 
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text('STATUS SUMMARY', rcx, yPos + 5);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        doc.setTextColor(72, 187, 120);
        doc.text('Confirmed Bkngs: ' + (weeklyConfirmedBookings.length), rcx + 5, yPos + 13);
        
        doc.setTextColor(234, 179, 8);
        doc.text('Pending Bkngs: ' + (weeklyPendingBookings.length), rcx + 5, yPos + 18);
        
        doc.setTextColor(239, 68, 68);
        doc.text('Cancelled Bkngs: ' + (weeklyCancelledBookings.length), rcx + 5, yPos + 23);
        
        doc.setTextColor(16, 185, 129);
        doc.text('Services Done: ' + (weeklyCompletedInquiries.length), rcx + 5, yPos + 28);
        
        doc.setTextColor(234, 179, 8);
        doc.text('Pending Services: ' + (weeklyPendingInquiries.length), rcx + 5, yPos + 33);

        yPos += 50;
        if (yPos > pageHeight - 60) { 
            doc.addPage(); 
            addWatermark(); 
            yPos = 20; 
        }
        
        // --- 5. TOP PERFORMING PACKAGES ---
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
        
        doc.save(`WanderWave_Weekly_Report_${currentDate.replace(/\//g, '-')}.pdf`);
        
    } catch (error) {
        console.error('PDF Error:', error);
        alert('PDF Export Error: ' + error.message);
    }
};