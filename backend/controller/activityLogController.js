const ActivityLog = require('../models/ActivityLog');

// ===================================================================
// 1. CREATE ACTIVITY LOG
// ===================================================================
const createActivityLog = async (req, res) => {
    try {
        const {
            action,
            module,
            entity,
            entityId,
            user,
            userId,
            adminId,
            severity,
            description,
            ipAddress,
            userAgent,
            details
        } = req.body;

        const newLog = new ActivityLog({
            action,
            module,
            entity,
            entityId,
            user,
            userId,
            adminId,
            severity: severity || 'INFO',
            description,
            ipAddress: ipAddress || req.ip || 'N/A',
            userAgent: userAgent || req.get('user-agent') || 'N/A',
            details: details || {}
        });

        await newLog.save();

        console.log('✅ Activity log created:', newLog._id);

        res.status(201).json({
            success: true,
            message: 'Activity log created successfully',
            data: newLog
        });

    } catch (error) {
        console.error('❌ Error creating activity log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create activity log',
            error: error.message
        });
    }
};

// ===================================================================
// 2. GET ALL ACTIVITY LOGS (FIXED FOR FRONTEND) ✅
// ===================================================================
const getAllActivityLogs = async (req, res) => {
    try {
        const { action, module, severity, startDate, endDate, limit = 1000 } = req.query;

        console.log('🔍 Fetching activity logs with filters:', { action, module, severity });

        let filter = {};

        if (action && action !== 'ALL') {
            filter.action = action;
        }

        if (module && module !== 'ALL Modules') {
            filter.module = module;
        }

        if (severity && severity !== 'ALL Severity') {
            filter.severity = severity;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const logs = await ActivityLog.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        console.log('✅ Activity Logs Found:', logs.length);

        // ✅ RETURN ARRAY DIRECTLY - This matches your frontend expectation!
        res.json(logs);

    } catch (error) {
        console.error('❌ Get activity logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

// ===================================================================
// 3. GET ACTIVITY STATISTICS
// ===================================================================
const getActivityStats = async (req, res) => {
    try {
        const totalActivities = await ActivityLog.countDocuments();

        const createActions = await ActivityLog.countDocuments({ action: 'CREATE' });
        const updateActions = await ActivityLog.countDocuments({ action: 'UPDATE' });
        const deleteActions = await ActivityLog.countDocuments({ action: 'DELETE' });
        const loginActions = await ActivityLog.countDocuments({ action: 'LOGIN' });
        
        const successLogs = await ActivityLog.countDocuments({ severity: 'SUCCESS' });
        const errorLogs = await ActivityLog.countDocuments({ severity: 'ERROR' });
        const warningLogs = await ActivityLog.countDocuments({ severity: 'WARNING' });
        const infoLogs = await ActivityLog.countDocuments({ severity: 'INFO' });

        // Get logs from last 24 hours
        const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentLogs = await ActivityLog.countDocuments({
            createdAt: { $gte: last24Hours }
        });

        // Get top modules
        const topModules = await ActivityLog.aggregate([
            {
                $group: {
                    _id: '$module',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        // Get top users
        const topUsers = await ActivityLog.aggregate([
            {
                $group: {
                    _id: '$user',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        console.log('📊 Activity stats calculated');

        res.json({
            success: true,
            stats: {
                total: totalActivities,
                actions: {
                    create: createActions,
                    update: updateActions,
                    delete: deleteActions,
                    login: loginActions
                },
                severity: {
                    success: successLogs,
                    error: errorLogs,
                    warning: warningLogs,
                    info: infoLogs
                },
                recent24h: recentLogs,
                topModules: topModules,
                topUsers: topUsers
            }
        });

    } catch (error) {
        console.error('❌ Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ===================================================================
// 4. DELETE ACTIVITY LOG BY ID
// ===================================================================
const deleteActivityLog = async (req, res) => {
    try {
        const { id } = req.params;

        const log = await ActivityLog.findByIdAndDelete(id);

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Activity log not found'
            });
        }

        console.log('🗑️ Activity log deleted:', id);

        res.json({
            success: true,
            message: 'Activity log deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete activity log error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ===================================================================
// 5. CLEANUP OLD LOGS (Delete logs older than X days)
// ===================================================================
const cleanupOldLogs = async (req, res) => {
    try {
        const { days = 90 } = req.query; // Default: delete logs older than 90 days

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await ActivityLog.deleteMany({
            createdAt: { $lt: cutoffDate }
        });

        console.log(`🧹 Cleaned up ${result.deletedCount} old logs`);

        res.json({
            success: true,
            message: `Deleted ${result.deletedCount} logs older than ${days} days`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('❌ Cleanup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ===================================================================
// 6. GET LOGS BY MODULE
// ===================================================================
const getLogsByModule = async (req, res) => {
    try {
        const { module } = req.params;

        const logs = await ActivityLog.find({ module })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: logs.length,
            data: logs
        });

    } catch (error) {
        console.error('❌ Get logs by module error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ===================================================================
// 7. GET LOGS BY USER
// ===================================================================
const getLogsByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const logs = await ActivityLog.find({ userId })
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({
            success: true,
            count: logs.length,
            data: logs
        });

    } catch (error) {
        console.error('❌ Get logs by user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ===================================================================
// 8. CLEAR ALL LOGS (USE WITH CAUTION!)
// ===================================================================
const clearAllLogs = async (req, res) => {
    try {
        const result = await ActivityLog.deleteMany({});

        console.log(`🧹 Cleared all ${result.deletedCount} activity logs`);

        res.json({
            success: true,
            message: `Cleared ${result.deletedCount} activity logs`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('❌ Clear all logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ===================================================================
// EXPORTS
// ===================================================================
module.exports = {
    createActivityLog,
    getAllActivityLogs,
    getActivityStats,
    deleteActivityLog,
    cleanupOldLogs,
    getLogsByModule,
    getLogsByUser,
    clearAllLogs
};