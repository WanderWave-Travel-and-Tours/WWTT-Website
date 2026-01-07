// utils/activityLogsPdfExport.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportActivityLogsToPDF = (logs, stats) => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // ========================================
    // HEADER SECTION
    // ========================================
    doc.setFillColor(15, 23, 42); // Navy Blue Background
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVITY LOGS REPORT', pageWidth / 2, 18, { align: 'center' });

    // Subtitle with Date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Generated on ${currentDate}`, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Total Logs: ${logs.length}`, pageWidth / 2, 35, { align: 'center' });

    yPosition = 50;

    // ========================================
    // STATISTICS SECTION
    // ========================================
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVITY STATISTICS', 14, yPosition);
    yPosition += 8;

    // Stats Grid
    const statsData = [
        ['Total Activities', stats[0]?.value || 0],
        ['Create Actions', stats[1]?.value || 0],
        ['Update Actions', stats[2]?.value || 0],
        ['Error Logs', stats[3]?.value || 0]
    ];

    doc.autoTable({
        startY: yPosition,
        head: [['Metric', 'Count']],
        body: statsData,
        theme: 'grid',
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11,
            halign: 'left'
        },
        bodyStyles: {
            fontSize: 10,
            textColor: [51, 65, 85]
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 100, fontStyle: 'bold' },
            1: { cellWidth: 50, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // ========================================
    // ACTIVITY BREAKDOWN BY ACTION TYPE
    // ========================================
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ACTIVITY BREAKDOWN', 14, yPosition);
    yPosition += 8;

    // Count logs by action type
    const actionCounts = {};
    logs.forEach(log => {
        const action = log.action || 'UNKNOWN';
        actionCounts[action] = (actionCounts[action] || 0) + 1;
    });

    const breakdownData = Object.entries(actionCounts).map(([action, count]) => [
        action,
        count,
        `${((count / logs.length) * 100).toFixed(1)}%`
    ]);

    doc.autoTable({
        startY: yPosition,
        head: [['Action Type', 'Count', 'Percentage']],
        body: breakdownData,
        theme: 'grid',
        headStyles: {
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 11
        },
        bodyStyles: {
            fontSize: 10,
            textColor: [51, 65, 85]
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { cellWidth: 40, halign: 'center' },
            2: { cellWidth: 40, halign: 'center' }
        },
        margin: { left: 14, right: 14 }
    });

    // ========================================
    // NEW PAGE FOR LOGS TABLE
    // ========================================
    doc.addPage();
    yPosition = 20;

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DETAILED ACTIVITY LOGS', pageWidth / 2, 18, { align: 'center' });

    yPosition = 40;

    // ========================================
    // LOGS TABLE (ALL LOGS)
    // ========================================
    const tableData = logs.map((log, index) => [
        index + 1,
        log.action || 'N/A',
        log.module || 'N/A',
        log.user || 'N/A',
        log.severity || 'N/A',
        formatDateForPDF(log.timestamp),
        truncateText(log.description || 'No description', 50)
    ]);

    doc.autoTable({
        startY: yPosition,
        head: [['#', 'Action', 'Module', 'User', 'Severity', 'Timestamp', 'Description']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [51, 65, 85],
            cellPadding: 3
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center', fontStyle: 'bold' }, // #
            1: { cellWidth: 25, halign: 'center' }, // Action
            2: { cellWidth: 30, halign: 'center' }, // Module
            3: { cellWidth: 35, halign: 'left' }, // User
            4: { cellWidth: 25, halign: 'center' }, // Severity
            5: { cellWidth: 40, halign: 'center', fontSize: 7 }, // Timestamp
            6: { cellWidth: 'auto', halign: 'left' } // Description
        },
        margin: { left: 10, right: 10 },
        didDrawCell: (data) => {
            // Color code severity
            if (data.column.index === 4 && data.section === 'body') {
                const severity = data.cell.raw;
                let color;
                switch(severity) {
                    case 'ERROR':
                        color = [239, 68, 68]; // Red
                        break;
                    case 'WARNING':
                        color = [245, 158, 11]; // Yellow
                        break;
                    case 'SUCCESS':
                        color = [16, 185, 129]; // Green
                        break;
                    default:
                        color = [59, 130, 246]; // Blue
                }
                doc.setFillColor(...color);
                doc.setTextColor(255, 255, 255);
                doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text(
                    severity,
                    data.cell.x + data.cell.width / 2,
                    data.cell.y + data.cell.height / 2 + 1,
                    { align: 'center', baseline: 'middle' }
                );
            }
        },
        didDrawPage: (data) => {
            // Footer with page numbers
            const pageCount = doc.internal.getNumberOfPages();
            const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
            
            doc.setFontSize(9);
            doc.setTextColor(100, 116, 139);
            doc.setFont('helvetica', 'normal');
            
            // Page number
            doc.text(
                `Page ${currentPage} of ${pageCount}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
            
            // Footer line
            doc.setDrawColor(226, 232, 240);
            doc.line(14, pageHeight - 15, pageWidth - 14, pageHeight - 15);
            
            // Company info
            doc.setFontSize(8);
            doc.text(
                'Activity Logs Management System © 2025',
                14,
                pageHeight - 10
            );
        }
    });

    // ========================================
    // SAVE PDF
    // ========================================
    const filename = `Activity_Logs_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    
    console.log(`✅ PDF exported successfully: ${filename}`);
};

// ========================================
// HELPER FUNCTIONS
// ========================================

const formatDateForPDF = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return 'Invalid Date';
    }
};

const truncateText = (text, maxLength) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};