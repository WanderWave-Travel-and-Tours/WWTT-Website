const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../uploads/exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
    console.log('✅ Exports directory created:', exportsDir);
}

// ===================================================================
// 📤 UPLOAD PDF FILE ENDPOINT
// ===================================================================
router.post('/upload-pdf', async (req, res) => {
    try {
        const { fileName, fileData, fileType } = req.body;

        if (!fileName || !fileData) {
            return res.status(400).json({
                success: false,
                error: 'Missing fileName or fileData'
            });
        }

        console.log('📤 Uploading PDF file:', fileName);

        // Extract base64 data (remove data:application/pdf;base64, prefix)
        const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '');
        
        // Generate unique filename with timestamp
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
        
        // File path
        const filePath = path.join(exportsDir, uniqueFileName);
        
        // Write file to disk
        fs.writeFileSync(filePath, base64Data, 'base64');
        
        // Create URL for accessing the file
        const fileUrl = `/uploads/exports/${uniqueFileName}`;
        
        console.log('✅ PDF file saved successfully:', filePath);
        
        res.status(200).json({
            success: true,
            message: 'PDF uploaded successfully',
            data: {
                fileName: uniqueFileName,
                originalName: fileName,
                fileUrl: fileUrl,
                filePath: filePath,
                uploadedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error uploading PDF:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to upload PDF',
            message: error.message
        });
    }
});

// ===================================================================
// 📥 DOWNLOAD PDF FILE ENDPOINT
// ===================================================================
router.get('/download-pdf/:fileName', (req, res) => {
    try {
        const { fileName } = req.params;
        const filePath = path.join(exportsDir, fileName);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

        console.log('📥 Downloading PDF file:', fileName);

        // Send file
        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('❌ Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        error: 'Failed to download file'
                    });
                }
            }
        });

    } catch (error) {
        console.error('❌ Error in download endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to download file',
            message: error.message
        });
    }
});

// ===================================================================
// 📝 CREATE NEW ACTIVITY LOG
// ===================================================================
router.post('/', async (req, res) => {
    try {
        const {
            action, module, entity, entityId, user, userId, adminId,
            severity, description, ipAddress, userAgent, details
        } = req.body;

        // Validate required fields
        if (!action || !module || !user || !description) {
            return res.status(400).json({ 
                error: 'Missing required fields: action, module, user, description'
            });
        }

        // Create new activity log
        const activityLog = new ActivityLog({
            action,
            module,
            entity: entity || 'System',
            entityId: entityId || null,
            user,
            userId: userId || null,
            adminId: adminId || null,
            severity: severity || 'INFO',
            description,
            ipAddress: ipAddress || req.ip || 'N/A',
            userAgent: userAgent || req.get('user-agent') || 'N/A',
            details: details || {}
        });

        await activityLog.save();
        console.log('✅ Activity log created:', activityLog._id);

        res.status(201).json({
            success: true,
            message: 'Activity log created successfully',
            data: activityLog
        });

    } catch (error) {
        console.error('❌ Error creating activity log:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: Object.values(error.errors).map(err => err.message)
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Failed to create activity log',
            message: error.message
        });
    }
});

// ===================================================================
// 📋 GET ALL ACTIVITY LOGS
// ===================================================================
router.get('/', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 1000,
            action,
            module,
            severity,
            user,
            startDate,
            endDate,
            search
        } = req.query;

        // Build query filter
        const filter = {};

        if (action && action !== 'ALL') {
            filter.action = action;
        }

        if (module && module !== 'ALL Modules') {
            filter.module = module;
        }

        if (severity && severity !== 'ALL Severity') {
            filter.severity = severity;
        }

        if (user) {
            filter.user = { $regex: user, $options: 'i' };
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        if (search) {
            filter.$or = [
                { description: { $regex: search, $options: 'i' } },
                { user: { $regex: search, $options: 'i' } },
                { entity: { $regex: search, $options: 'i' } }
            ];
        }

        // Execute query
        const logs = await ActivityLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        console.log(`📊 Fetched ${logs.length} activity logs`);

        res.status(200).json(logs);

    } catch (error) {
        console.error('❌ Error fetching activity logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity logs',
            message: error.message
        });
    }
});

// ===================================================================
// 🔍 GET SINGLE ACTIVITY LOG BY ID
// ===================================================================
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const log = await ActivityLog.findById(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                error: 'Activity log not found'
            });
        }

        res.status(200).json({
            success: true,
            data: log
        });

    } catch (error) {
        console.error('❌ Error fetching activity log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch activity log',
            message: error.message
        });
    }
});

// ===================================================================
// 📊 GET ACTIVITY STATISTICS
// ===================================================================
router.get('/stats/summary', async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalLogs, todayLogs, errorLogs, actionStats] = await Promise.all([
            ActivityLog.countDocuments(),
            ActivityLog.countDocuments({ createdAt: { $gte: today } }),
            ActivityLog.countDocuments({ severity: 'ERROR' }),
            ActivityLog.aggregate([
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalLogs,
                todayLogs,
                errorLogs,
                actionStats: actionStats.reduce((acc, stat) => {
                    acc[stat._id] = stat.count;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('❌ Error fetching statistics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
});

// ===================================================================
// 📁 GET LOGS BY MODULE
// ===================================================================
router.get('/module/:module', async (req, res) => {
    try {
        const { module } = req.params;
        const { limit = 100 } = req.query;

        const logs = await ActivityLog.find({ module })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json({
            success: true,
            data: logs,
            count: logs.length
        });

    } catch (error) {
        console.error('❌ Error fetching logs by module:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch logs by module'
        });
    }
});

// ===================================================================
// 👤 GET LOGS BY USER
// ===================================================================
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 100 } = req.query;

        const logs = await ActivityLog.find({ 
            $or: [
                { userId: userId },
                { adminId: userId }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.status(200).json({
            success: true,
            data: logs,
            count: logs.length
        });

    } catch (error) {
        console.error('❌ Error fetching logs by user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch logs by user'
        });
    }
});

// ===================================================================
// 🗑️ DELETE SINGLE ACTIVITY LOG
// ===================================================================
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const log = await ActivityLog.findByIdAndDelete(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                error: 'Activity log not found'
            });
        }

        // Delete associated PDF file if exists
        if (log.details && log.details.filePath) {
            try {
                if (fs.existsSync(log.details.filePath)) {
                    fs.unlinkSync(log.details.filePath);
                    console.log('🗑️ Associated PDF file deleted:', log.details.filePath);
                }
            } catch (fileError) {
                console.error('⚠️ Could not delete associated file:', fileError);
            }
        }

        console.log(`🗑️ Activity log deleted: ${id}`);

        res.status(200).json({
            success: true,
            message: 'Activity log deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting activity log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete activity log'
        });
    }
});

// ===================================================================
// 🧹 CLEANUP OLD LOGS
// ===================================================================
router.delete('/cleanup/old', async (req, res) => {
    try {
        const { days = 90 } = req.query;
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await ActivityLog.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        console.log(`🧹 Cleaned up ${result.deletedCount} old logs (older than ${days} days)`);

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} old logs`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('❌ Error cleaning up old logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cleanup old logs'
        });
    }
});

// ===================================================================
// ⚠️ CLEAR ALL LOGS (DANGEROUS)
// ===================================================================
router.delete('/clear/all', async (req, res) => {
    try {
        const result = await ActivityLog.deleteMany({});

        console.log(`⚠️ ALL LOGS CLEARED: ${result.deletedCount} logs deleted`);

        res.status(200).json({
            success: true,
            message: `All logs cleared: ${result.deletedCount} logs deleted`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('❌ Error clearing all logs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear all logs'
        });
    }
});

module.exports = router;