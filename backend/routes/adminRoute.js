const router = require('express').Router();
const AdminModel = require('../models/admin');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const sanitize = require('mongo-sanitize');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const express = require('express');
const ActivityLog = require('../models/ActivityLog');
const TokenBlacklist = require('../models/TokenBlacklist');

// 🎯 IMPORT ACTIVITY LOGGER
const { 
    logActivity,
    logUpdate,
    getIpAddress, 
    getUserAgent 
} = require('../utils/activityLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'wanderwaveph_admin25';

// ============================================================
// MULTER CONFIGURATION
// ============================================================
const ALLOWED_LOGO_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp'];
const LOGO_MIME_TO_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

const logoFileFilter = (req, file, cb) => {
    if (ALLOWED_LOGO_MIMETYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, PNG, and WebP images are allowed for the business logo.'), false);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Extension derived from verified MIME type — never from client-supplied filename
        const ext = LOGO_MIME_TO_EXT[file.mimetype] || '.jpg';
        cb(null, crypto.randomUUID() + ext);
    }
});

const upload = multer({
    storage,
    fileFilter: logoFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ============================================================
// ENSURE EXPORTS DIRECTORY EXISTS
// ============================================================
const exportsDir = path.join(__dirname, '../uploads/exports');
if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
}

// ============================================================
// MIDDLEWARE: Check if Main Admin
// ============================================================
const isMainAdmin = (req, res, next) => {
    if (!req.isMainAdmin) {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied: Only main admin can perform this action'
        });
    }
    next();
};

// ============================================================
// PUBLIC ROUTES (NO AUTH REQUIRED)
// ============================================================

router.post('/login', async (req, res) => {
    const startTime = Date.now();
    const email = sanitize(req.body.email);
    const password = sanitize(req.body.password);
    const recaptchaToken = req.body.recaptchaToken;

    if (!recaptchaToken) {
        return res.status(400).json({ 
            status: "error", 
            message: "reCAPTCHA verification is required." 
        });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ 
            status: "error", 
            message: "Invalid input types. Credentials must be strings." 
        });
    }

    try {
        const admin = await AdminModel.findOne({ email: email.toLowerCase() });

        if (!admin) {
            console.log(`❌ No admin found with email: ${email}`);

            await logActivity({
                action: 'LOGIN',
                module: 'Auth',
                user: email,
                severity: 'WARNING',
                description: `Failed admin login attempt: Admin account not found - ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 401,
                    duration: `${Date.now() - startTime}ms`
                }
            });

            return res.status(401).json({ 
                status: "error", 
                message: "Invalid email or password" 
            });
        }

        const isMatch = await admin.comparePassword(password); 

        if (!isMatch) {
            console.log(`❌ Password mismatch for email: ${email}`);

            await logActivity({
                action: 'LOGIN',
                module: 'Auth',
                user: email,
                userId: admin._id,
                severity: 'WARNING',
                description: `Failed admin login attempt: Invalid password for ${email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 401,
                    duration: `${Date.now() - startTime}ms`,
                    recordId: admin._id.toString()
                }
            });

            return res.status(401).json({ 
                status: "error", 
                message: "Invalid email or password" 
            });
        }

        // ✅ CHECK IF MAIN ADMIN
        const isMainAdmin = admin.email.toLowerCase() === 'info@wanderwavetravelandtours.com';

        // Generate JWT token (with isMainAdmin flag)
        const token = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email, 
                role: 'admin',
                isMainAdmin: isMainAdmin
            },
            JWT_SECRET, 
            { expiresIn: '8h' }
        );

        // ✅ UPDATE LAST LOGIN
        admin.lastLogin = new Date();
        await admin.save();

        await logActivity({
            action: 'LOGIN',
            module: 'Auth',
            user: admin.email,
            userId: admin._id,
            severity: 'SUCCESS',
            description: `Admin logged in successfully: ${admin.email} (${admin.username})${isMainAdmin ? ' [MAIN ADMIN]' : ''}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                recordId: admin._id.toString(),
                recordTitle: admin.username,
                isMainAdmin: isMainAdmin
            }
        });

        console.log(`✅ Admin login successful: ${admin.email}${isMainAdmin ? ' [MAIN ADMIN]' : ''}`);

        // Set token in HttpOnly cookie so XSS cannot read it from JS
        res.cookie('adminToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 8 * 60 * 60 * 1000
        });

        res.json({
            status: "ok",
            message: "Login Success!",
            token: token,
            data: {
                id: admin._id,
                username: admin.username,
                email: admin.email,
                businessName: admin.businessName,
                businessAddress: admin.businessAddress,
                businessLogo: admin.businessLogo,
                isMainAdmin: isMainAdmin
            }
        });

    } catch (err) {
        console.error("❌ Login Error:", err);

        await logActivity({
            action: 'LOGIN',
            module: 'Auth',
            user: email || 'System',
            severity: 'ERROR',
            description: `Admin login system error: ${err.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        res.status(500).json({ 
            status: "error", 
            message: "Server error during login." 
        });
    }
});

router.post('/logout', authMiddleware, async (req, res) => {
    const startTime = Date.now();

    try {
        const adminEmail = req.user.email;
        const adminId = req.user._id;

        // Revoke the token so it cannot be replayed after logout
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.decode(token);
        if (decoded && decoded.exp) {
            await TokenBlacklist.create({
                token,
                expiresAt: new Date(decoded.exp * 1000)
            }).catch(() => {});
        }

        await logActivity({
            action: 'LOGOUT',
            module: 'Auth',
            user: adminEmail,
            userId: adminId,
            severity: 'INFO',
            description: `Admin logged out: ${adminEmail}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`
            }
        });

        // Clear the HttpOnly cookie
        res.clearCookie('adminToken', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict' });

        console.log('✅ Admin logged out:', adminEmail);

        res.status(200).json({
            status: "ok",
            message: "Logout successful"
        });

    } catch (error) {
        console.error('❌ Admin logout error:', error);

        await logActivity({
            action: 'LOGOUT',
            module: 'Auth',
            user: 'System',
            severity: 'ERROR',
            description: `Admin logout error: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        res.status(500).json({
            status: "error",
            message: "Logout failed."
        });
    }
});

// ✅ VERIFY TOKEN ENDPOINT
router.get('/verify', authMiddleware, async (req, res) => {
    try {
        res.json({
            status: 'ok',
            message: 'Token is valid',
            data: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                isMainAdmin: req.isMainAdmin
            }
        });
    } catch (error) {
        res.status(401).json({
            status: 'error',
            message: 'Token verification failed'
        });
    }
});

// ============================================================
// PROTECTED ROUTES - ADMIN SETTINGS
// ============================================================

router.get('/settings', authMiddleware, async (req, res) => {
    try {
        const admin = req.user;

        res.json({
            status: "ok",
            data: {
                username: admin.username,
                email: admin.email,
                businessName: admin.businessName,
                businessAddress: admin.businessAddress,
                businessLogo: admin.businessLogo
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

router.put('/update-settings', authMiddleware, upload.single('businessLogo'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { businessName, businessAddress } = req.body;
        const admin = req.user;

        const changes = {};
        if (businessName && businessName !== admin.businessName) {
            changes.businessName = { from: admin.businessName, to: businessName };
            admin.businessName = businessName;
        }
        if (businessAddress && businessAddress !== admin.businessAddress) {
            changes.businessAddress = { from: admin.businessAddress, to: businessAddress };
            admin.businessAddress = businessAddress;
        }
        if (req.file) {
            changes.businessLogo = { from: admin.businessLogo, to: req.file.filename };
            admin.businessLogo = req.file.filename;
        }

        await admin.save();

        if (Object.keys(changes).length > 0) {
            await logUpdate(
                req, 
                'System', 
                admin._id.toString(), 
                'Admin Settings', 
                changes
            );
        }

        console.log('✅ Admin settings updated');

        res.json({ 
            status: "ok", 
            message: "Settings updated successfully!", 
            data: {
                businessName: admin.businessName,
                businessAddress: admin.businessAddress,
                businessLogo: admin.businessLogo,
                email: admin.email
            }
        });

    } catch (err) {
        console.error("Update Error:", err);

        await logActivity({
            action: 'UPDATE',
            module: 'System',
            user: req.user.email,
            severity: 'ERROR',
            description: `Failed to update admin settings: ${err.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        res.status(500).json({ status: "error", message: err.message });
    }
});

// ============================================================
// MAIN ADMIN ONLY ROUTES - ADMIN MANAGEMENT
// ============================================================

router.get('/list', authMiddleware, isMainAdmin, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const admins = await AdminModel.find(
            {}, 
            'email username createdAt isActive lastLogin'
        ).sort({ createdAt: -1 });

        console.log('📋 Fetched admins:', admins.length);

        await logActivity({
            action: 'VIEW',
            module: 'Admin Management',
            user: req.user.email,
            userId: req.user._id,
            severity: 'INFO',
            description: `Main admin viewed admin list (${admins.length} admins)`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                totalAdmins: admins.length
            }
        });

        res.json({
            status: 'ok',
            admins: admins.map(admin => ({
                id: admin._id,
                email: admin.email,
                username: admin.username,
                createdAt: admin.createdAt,
                isActive: admin.isActive,
                lastLogin: admin.lastLogin
            }))
        });
    } catch (error) {
        console.error('❌ Error fetching admins:', error);

        await logActivity({
            action: 'VIEW',
            module: 'Admin Management',
            user: req.user.email,
            userId: req.user._id,
            severity: 'ERROR',
            description: `Failed to fetch admin list: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to fetch admins'
        });
    }
});

router.post('/create', authMiddleware, isMainAdmin, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { email, username, password } = req.body;

        if (!email || !username || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                status: 'error',
                message: 'Password must be at least 6 characters'
            });
        }

        const existingAdmin = await AdminModel.findOne({ 
            email: email.toLowerCase() 
        });

        if (existingAdmin) {
            return res.status(400).json({
                status: 'error',
                message: 'Email already exists'
            });
        }

        const existingUsername = await AdminModel.findOne({ username });

        if (existingUsername) {
            return res.status(400).json({
                status: 'error',
                message: 'Username already exists'
            });
        }

        const newAdmin = new AdminModel({
            email: email.toLowerCase(),
            username: username,
            password: password,
            isActive: true
        });

        await newAdmin.save();

        console.log('✅ New admin created:', {
            id: newAdmin._id,
            email: newAdmin.email,
            username: newAdmin.username
        });

        await logActivity({
            action: 'CREATE',
            module: 'Admin Management',
            user: req.user.email,
            userId: req.user._id,
            severity: 'SUCCESS',
            description: `Main admin created new admin account: ${newAdmin.email} (${newAdmin.username})`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                recordId: newAdmin._id.toString(),
                recordTitle: newAdmin.username,
                newAdminEmail: newAdmin.email
            }
        });

        res.json({
            status: 'ok',
            message: 'Admin created successfully',
            adminId: newAdmin._id
        });
    } catch (error) {
        console.error('❌ Error creating admin:', error);

        await logActivity({
            action: 'CREATE',
            module: 'Admin Management',
            user: req.user.email,
            userId: req.user._id,
            severity: 'ERROR',
            description: `Failed to create admin: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to create admin'
        });
    }
});

router.delete('/delete/:id', authMiddleware, isMainAdmin, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const adminId = req.params.id;

        const admin = await AdminModel.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                status: 'error',
                message: 'Admin not found'
            });
        }

        if (admin.email.toLowerCase() === 'info@wanderwavetravelandtours.com') {
            return res.status(403).json({
                status: 'error',
                message: 'Cannot delete main admin account'
            });
        }

        await AdminModel.findByIdAndDelete(adminId);

        console.log('🗑️ Admin deleted:', admin.email);

        await logActivity({
            action: 'DELETE',
            module: 'Admin Management',
            user: req.user.email,
            userId: req.user._id,
            severity: 'WARNING',
            description: `Main admin deleted admin account: ${admin.email} (${admin.username})`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                recordId: adminId,
                recordTitle: admin.username,
                deletedAdminEmail: admin.email
            }
        });

        res.json({
            status: 'ok',
            message: 'Admin deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting admin:', error);

        await logActivity({
            action: 'DELETE',
            module: 'Admin Management',
            user: req.user.email,
            userId: req.user._id,
            severity: 'ERROR',
            description: `Failed to delete admin: ${error.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        res.status(500).json({
            status: 'error',
            message: 'Failed to delete admin'
        });
    }
});

// ============================================================
// ACTIVITY LOG ROUTES - PDF MANAGEMENT
// ============================================================

router.post('/activity-logs/upload-pdf', async (req, res) => {
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

router.get('/activity-logs/download-pdf/:fileName', (req, res) => {
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

// ============================================================
// ACTIVITY LOG ROUTES - CRUD OPERATIONS
// ============================================================

router.post('/activity-logs', async (req, res) => {
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

router.get('/activity-logs', async (req, res) => {
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

        // Populate admin info
        query = query
            .populate({
                path: 'userId',
                select: 'username email fullName',
                model: AdminModel
            })
            .populate({
                path: 'adminId',
                select: 'username email fullName',
                model: AdminModel
            });

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

router.get('/activity-logs/:id', async (req, res) => {
    try {
        const { id } = req.params;

        let query = ActivityLog.findById(id)
            .populate({
                path: 'userId',
                select: 'username email fullName',
                model: AdminModel
            })
            .populate({
                path: 'adminId',
                select: 'username email fullName',
                model: AdminModel
            });

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

router.get('/activity-logs/stats/summary', async (req, res) => {
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

router.get('/activity-logs/module/:module', async (req, res) => {
    try {
        const { module } = req.params;
        const { limit = 100 } = req.query;

        let query = ActivityLog.find({ module })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .populate('userId', 'username email fullName')
            .populate('adminId', 'username email fullName');

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

router.get('/activity-logs/user/:userId', async (req, res) => {
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
            .limit(parseInt(limit))
            .populate('userId', 'username email fullName')
            .populate('adminId', 'username email fullName');

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

router.delete('/activity-logs/:id', async (req, res) => {
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

router.delete('/activity-logs/cleanup/old', async (req, res) => {
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

router.delete('/activity-logs/clear/all', async (req, res) => {
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