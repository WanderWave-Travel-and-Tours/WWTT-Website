const router = require('express').Router();
const AdminModel = require('../models/admin'); 
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const sanitize = require('mongo-sanitize');
const jwt = require('jsonwebtoken'); 

// 🎯 IMPORT ACTIVITY LOGGER
const { 
    logActivity,
    logUpdate,
    getIpAddress, 
    getUserAgent 
} = require('../utils/activityLogger');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ============================================================
// ADMIN LOGIN WITH ACTIVITY LOGGING
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

            // 🎯 LOG FAILED ADMIN LOGIN - USER NOT FOUND
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

            // 🎯 LOG FAILED ADMIN LOGIN - WRONG PASSWORD
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

        // Generate JWT token
        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: 'admin' },
            'wanderwaveph_admin25', 
            { expiresIn: '1h' }
        );

        // 🎯 LOG SUCCESSFUL ADMIN LOGIN
        await logActivity({
            action: 'LOGIN',
            module: 'Auth',
            user: admin.email,
            userId: admin._id,
            severity: 'SUCCESS',
            description: `Admin logged in successfully: ${admin.email} (${admin.username})`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                recordId: admin._id.toString(),
                recordTitle: admin.username
            }
        });

        console.log(`✅ Admin login successful: ${admin.email}`);

        res.json({ 
            status: "ok", 
            message: "Login Success!",
            token: token, 
            data: {
                username: admin.username,
                email: admin.email,
                businessName: admin.businessName,
                businessAddress: admin.businessAddress,
                businessLogo: admin.businessLogo
            }
        });

    } catch (err) {
        console.error("❌ Login Error:", err);

        // 🎯 LOG SYSTEM ERROR
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

// ============================================================
// ADMIN LOGOUT WITH ACTIVITY LOGGING
// ============================================================
router.post('/logout', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const adminEmail = req.body.email || 'Admin';
        const adminId = req.body.adminId || null;

        // 🎯 LOG ADMIN LOGOUT
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

        console.log('✅ Admin logged out:', adminEmail);

        res.status(200).json({
            status: "ok",
            message: "Logout successful"
        });

    } catch (error) {
        console.error('❌ Admin logout error:', error);

        // 🎯 LOG LOGOUT ERROR
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

// ============================================================
// GET ADMIN SETTINGS
// ============================================================
router.get('/settings', async (req, res) => {
    try {
        const admin = await AdminModel.findOne(); 

        if (!admin) {
            return res.status(404).json({ status: "error", message: "Admin not found" });
        }

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

// ============================================================
// UPDATE ADMIN SETTINGS WITH ACTIVITY LOGGING
// ============================================================
router.put('/update-settings', upload.single('businessLogo'), async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { businessName, businessAddress } = req.body;
        
        const admin = await AdminModel.findOne();

        if (!admin) {
            return res.status(404).json({ status: "error", message: "Admin not found" });
        }

        // Track changes
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

        // 🎯 LOG SETTINGS UPDATE
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

        // 🎯 LOG UPDATE ERROR
        await logActivity({
            action: 'UPDATE',
            module: 'System',
            user: 'Admin',
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

module.exports = router;