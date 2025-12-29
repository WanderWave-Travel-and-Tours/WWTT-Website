const ActivityLog = require('../models/ActivityLog');

/**
 * Main function to create activity log
 */
const logActivity = async ({
    action,
    module,
    user = 'System',
    userId = null,
    severity = 'INFO',
    description,
    ipAddress = 'N/A',
    userAgent = 'N/A',
    details = {}
}) => {
    try {
        const logEntry = new ActivityLog({
            action,
            module,
            user,
            userId,
            severity,
            description,
            ipAddress,
            userAgent,
            details: {
                affectedRecords: details.affectedRecords || 1,
                duration: details.duration || 'N/A',
                method: details.method || 'N/A',
                endpoint: details.endpoint || 'N/A',
                statusCode: details.statusCode || 200,
                recordId: details.recordId || null,
                recordTitle: details.recordTitle || null,
                changes: details.changes || null
            }
        });

        await logEntry.save();
        console.log(`✅ Activity logged: [${module}] ${action} by ${user}`);
        return logEntry;

    } catch (error) {
        console.error('❌ Failed to log activity:', error);
        // Don't throw error - logging shouldn't break the main operation
        return null;
    }
};

/**
 * Extract IP address from request
 */
const getIpAddress = (req) => {
    return req.ip || 
           req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           'N/A';
};

/**
 * Get user agent from request
 */
const getUserAgent = (req) => {
    return req.headers['user-agent'] || 'N/A';
};

/**
 * Get user info from request (from auth middleware)
 */
const getUserInfo = (req) => {
    if (req.admin) {
        return {
            userId: req.admin.id || req.admin._id,
            user: req.admin.email || req.admin.username || 'Admin'
        };
    }
    if (req.user) {
        return {
            userId: req.user.id || req.user._id,
            user: req.user.email || req.user.username || 'User'
        };
    }
    return {
        userId: null,
        user: 'System'
    };
};

/**
 * Middleware to automatically log API requests
 */
const activityLoggerMiddleware = ({ module, action, getDescription }) => {
    return async (req, res, next) => {
        const startTime = Date.now();
        
        // Store original send function
        const originalSend = res.send;
        
        // Override send function to log after response
        res.send = function (data) {
            const duration = `${Date.now() - startTime}ms`;
            const { userId, user } = getUserInfo(req);
            
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const description = typeof getDescription === 'function' 
                    ? getDescription(req, res) 
                    : `${action} operation in ${module}`;
                
                logActivity({
                    action,
                    module,
                    user,
                    userId,
                    severity: 'SUCCESS',
                    description,
                    ipAddress: getIpAddress(req),
                    userAgent: getUserAgent(req),
                    details: {
                        method: req.method,
                        endpoint: req.originalUrl,
                        statusCode: res.statusCode,
                        duration,
                        recordId: req.params.id || null,
                        recordTitle: req.body.title || req.body.name || null
                    }
                });
            }
            
            // Call original send
            originalSend.call(this, data);
        };
        
        next();
    };
};

/**
 * Quick logging functions for common operations
 */
const logLogin = async (req, user) => {
    return logActivity({
        action: 'LOGIN',
        module: 'Auth',
        user: user.email || user.username,
        userId: user._id,
        severity: 'SUCCESS',
        description: `User ${user.email || user.username} logged in successfully`,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        details: {
            method: 'POST',
            endpoint: '/api/auth/login'
        }
    });
};

const logLogout = async (req, user) => {
    return logActivity({
        action: 'LOGOUT',
        module: 'Auth',
        user: user.email || user.username,
        userId: user._id,
        severity: 'INFO',
        description: `User ${user.email || user.username} logged out`,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        details: {
            method: 'POST',
            endpoint: '/api/auth/logout'
        }
    });
};

const logCreate = async (req, module, recordTitle) => {
    const { userId, user } = getUserInfo(req);
    return logActivity({
        action: 'CREATE',
        module,
        user,
        userId,
        severity: 'SUCCESS',
        description: `Created new ${module.toLowerCase()}: ${recordTitle}`,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        details: {
            method: req.method,
            endpoint: req.originalUrl,
            recordTitle
        }
    });
};

const logUpdate = async (req, module, recordId, recordTitle, changes = null) => {
    const { userId, user } = getUserInfo(req);
    return logActivity({
        action: 'UPDATE',
        module,
        user,
        userId,
        severity: 'SUCCESS',
        description: `Updated ${module.toLowerCase()}: ${recordTitle}`,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        details: {
            method: req.method,
            endpoint: req.originalUrl,
            recordId,
            recordTitle,
            changes
        }
    });
};

const logDelete = async (req, module, recordId, recordTitle) => {
    const { userId, user } = getUserInfo(req);
    return logActivity({
        action: 'DELETE',
        module,
        user,
        userId,
        severity: 'WARNING',
        description: `Deleted ${module.toLowerCase()}: ${recordTitle}`,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        details: {
            method: req.method,
            endpoint: req.originalUrl,
            recordId,
            recordTitle
        }
    });
};

const logError = async (req, module, errorMessage) => {
    const { userId, user } = getUserInfo(req);
    return logActivity({
        action: 'ERROR',
        module,
        user,
        userId,
        severity: 'ERROR',
        description: `Error in ${module}: ${errorMessage}`,
        ipAddress: getIpAddress(req),
        userAgent: getUserAgent(req),
        details: {
            method: req.method,
            endpoint: req.originalUrl
        }
    });
};

module.exports = {
    logActivity,
    activityLoggerMiddleware,
    getIpAddress,
    getUserAgent,
    getUserInfo,
    // Quick logging functions
    logLogin,
    logLogout,
    logCreate,
    logUpdate,
    logDelete,
    logError
};