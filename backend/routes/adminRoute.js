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

        // ✅ CHECK IF MAIN ADMIN
        const isMainAdmin = admin.email.toLowerCase() === 'info@wanderwavetravelandtours.com';

        // Generate JWT token (with isMainAdmin flag)
        const token = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email, 
                role: 'admin',
                isMainAdmin: isMainAdmin // ✅ ADD THIS
            },
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
                isMainAdmin: isMainAdmin // ✅ ADD THIS TO LOGS
            }
        });

        console.log(`✅ Admin login successful: ${admin.email}${isMainAdmin ? ' [MAIN ADMIN]' : ''}`);

        res.json({ 
            status: "ok", 
            message: "Login Success!",
            token: token, 
            data: {
                id: admin._id, // ✅ ADD THIS
                username: admin.username,
                email: admin.email,
                businessName: admin.businessName,
                businessAddress: admin.businessAddress,
                businessLogo: admin.businessLogo,
                isMainAdmin: isMainAdmin // ✅ ADD THIS
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

// ============================================================
// MIDDLEWARE: Verify JWT Token
// ============================================================
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ 
            status: 'error', 
            message: 'No token provided' 
        });
    }

    try {
        const decoded = jwt.verify(token, 'wanderwaveph_admin25');
        req.adminId = decoded.id;
        req.adminEmail = decoded.email;
        req.isMainAdmin = decoded.isMainAdmin;
        next();
    } catch (error) {
        return res.status(401).json({ 
            status: 'error', 
            message: 'Invalid token' 
        });
    }
};

// ============================================================
// MIDDLEWARE: Check if Main Admin
// ============================================================
const isMainAdmin = (req, res, next) => {
    if (req.adminEmail?.toLowerCase() !== 'info@wanderwavetravelandtours.com') {
        return res.status(403).json({
            status: 'error',
            message: 'Access denied: Only main admin can perform this action'
        });
    }
    next();
};

// ============================================================
// LIST ALL ADMINS (Main Admin Only)
// ============================================================
router.get('/list', verifyToken, isMainAdmin, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const admins = await AdminModel.find(
            {}, 
            'email username createdAt isActive lastLogin'
        ).sort({ createdAt: -1 });

        console.log('📋 Fetched admins:', admins.length);

        // 🎯 LOG ADMIN LIST VIEW
        await logActivity({
            action: 'VIEW',
            module: 'Admin Management',
            user: req.adminEmail,
            userId: req.adminId,
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

        // 🎯 LOG ERROR
        await logActivity({
            action: 'VIEW',
            module: 'Admin Management',
            user: req.adminEmail,
            userId: req.adminId,
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

// ============================================================
// CREATE NEW ADMIN (Main Admin Only)
// ============================================================
router.post('/create', verifyToken, isMainAdmin, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { email, username, password } = req.body;

        // Validation
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

        // Check if email already exists
        const existingAdmin = await AdminModel.findOne({ 
            email: email.toLowerCase() 
        });

        if (existingAdmin) {
            return res.status(400).json({
                status: 'error',
                message: 'Email already exists'
            });
        }

        // Check if username already exists
        const existingUsername = await AdminModel.findOne({ username });

        if (existingUsername) {
            return res.status(400).json({
                status: 'error',
                message: 'Username already exists'
            });
        }

        // Create new admin
        const newAdmin = new AdminModel({
            email: email.toLowerCase(),
            username: username,
            password: password, // Will be hashed by pre-save hook
            isActive: true
        });

        await newAdmin.save();

        console.log('✅ New admin created:', {
            id: newAdmin._id,
            email: newAdmin.email,
            username: newAdmin.username
        });

        // 🎯 LOG ADMIN CREATION
        await logActivity({
            action: 'CREATE',
            module: 'Admin Management',
            user: req.adminEmail,
            userId: req.adminId,
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

        // 🎯 LOG ERROR
        await logActivity({
            action: 'CREATE',
            module: 'Admin Management',
            user: req.adminEmail,
            userId: req.adminId,
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

// ============================================================
// DELETE ADMIN (Main Admin Only)
// ============================================================
router.delete('/delete/:id', verifyToken, isMainAdmin, async (req, res) => {
    const startTime = Date.now();
    
    try {
        const adminId = req.params.id;

        // Get admin details before deletion
        const admin = await AdminModel.findById(adminId);

        if (!admin) {
            return res.status(404).json({
                status: 'error',
                message: 'Admin not found'
            });
        }

        // ✅ Prevent deleting main admin
        if (admin.email.toLowerCase() === 'info@wanderwavetravelandtours.com') {
            return res.status(403).json({
                status: 'error',
                message: 'Cannot delete main admin account'
            });
        }

        // Delete admin
        await AdminModel.findByIdAndDelete(adminId);

        console.log('🗑️ Admin deleted:', admin.email);

        // 🎯 LOG ADMIN DELETION
        await logActivity({
            action: 'DELETE',
            module: 'Admin Management',
            user: req.adminEmail,
            userId: req.adminId,
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

        // 🎯 LOG ERROR
        await logActivity({
            action: 'DELETE',
            module: 'Admin Management',
            user: req.adminEmail,
            userId: req.adminId,
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

module.exports = router;