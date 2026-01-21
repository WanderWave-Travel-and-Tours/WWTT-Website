const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const path = require('path');
const fs = require('fs');

// Try to import Admin model, but don't fail if it doesn't exist
let Admin = null;
try {
    Admin = require('../models/admin');
} catch (err) {
    try {
        Admin = require('../models/admin');
    } catch (err2) {
        console.log('⚠️ Admin model not found, user population will be skipped');
    }
}

// Ensure exports directory exists
const exportsDir = path.join(__dirname, '../uploads/exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
}

// ===================================================================
// 📤 UPLOAD PDF FILE ENDPOINT
// ===================================================================
router.post('/upload-pdf', async (req, res) => {
    try {
        const { fileName, fileData } = req.body;

        if (!fileName || !fileData) {
            return res.status(400).json({
                success: false,
                error: 'Missing fileName or fileData'
            });
        }

        const base64Data = fileData.replace(/^data:application\/pdf;base64,/, '');
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
        const uniqueFileName = `${timestamp}_${sanitizedFileName}`;
        const filePath = path.join(exportsDir, uniqueFileName);
        
        fs.writeFileSync(filePath, base64Data, 'base64');
        const fileUrl = `/uploads/exports/${uniqueFileName}`;
        
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

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'File not found'
            });
        }

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

        if (!action || !module || !user || !description) {
            return res.status(400).json({ 
                error: 'Missing required fields: action, module, user, description'
            });
        }

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
// 📋 GET ALL ACTIVITY LOGS (WITH OPTIONAL USER POPULATION)
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

        let query = ActivityLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        // Only populate if Admin model exists
        if (Admin) {
            query = query
                .populate({
                    path: 'userId',
                    select: 'username email fullName',
                    model: Admin
                })
                .populate({
                    path: 'adminId',
                    select: 'username email fullName',
                    model: Admin
                });
        }

        const logs = await query.lean();

        // Enhance logs with user info
        const enhancedLogs = logs.map(log => {
            const userInfo = log.userId || log.adminId;
            
            return {
                ...log,
                adminInfo: userInfo ? {
                    id: userInfo._id,
                    username: userInfo.username || null,
                    email: userInfo.email || null,
                    fullName: userInfo.fullName || userInfo.username || null
                } : null
            };
        });

        res.status(200).json(enhancedLogs);

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

        let query = ActivityLog.findById(id);

        if (Admin) {
            query = query
                .populate({
                    path: 'userId',
                    select: 'username email fullName',
                    model: Admin
                })
                .populate({
                    path: 'adminId',
                    select: 'username email fullName',
                    model: Admin
                });
        }

        const log = await query;

        if (!log) {
            return res.status(404).json({
                success: false,
                error: 'Activity log not found'
            });
        }

        const userInfo = log.userId || log.adminId;
        const enhancedLog = {
            ...log.toObject(),
            adminInfo: userInfo ? {
                id: userInfo._id,
                username: userInfo.username || null,
                email: userInfo.email || null,
                fullName: userInfo.fullName || userInfo.username || null
            } : null
        };

        res.status(200).json({
            success: true,
            data: enhancedLog
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

        let query = ActivityLog.find({ module })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        if (Admin) {
            query = query
                .populate('userId', 'username email fullName')
                .populate('adminId', 'username email fullName');
        }

        const logs = await query.lean();

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

        let query = ActivityLog.find({ 
            $or: [
                { userId: userId },
                { adminId: userId }
            ]
        })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        if (Admin) {
            query = query
                .populate('userId', 'username email fullName')
                .populate('adminId', 'username email fullName');
        }

        const logs = await query.lean();

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

        if (log.details && log.details.filePath) {
            try {
                if (fs.existsSync(log.details.filePath)) {
                    fs.unlinkSync(log.details.filePath);
                }
            } catch (fileError) {
                console.error('⚠️ Could not delete associated file:', fileError);
            }
        }

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
// ⚠️ CLEAR ALL LOGS
// ===================================================================
router.delete('/clear/all', async (req, res) => {
    try {
        const result = await ActivityLog.deleteMany({});

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