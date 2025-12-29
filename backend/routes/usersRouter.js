const router = require('express').Router();
const User = require('../models/user'); 

// 🎯 IMPORT ACTIVITY LOGGER
const { 
    logCreate,
    logUpdate,
    logDelete,
    logActivity,
    getIpAddress, 
    getUserAgent 
} = require('../utils/activityLogger');

// ============================================================
// ADD NEW USER WITH ACTIVITY LOGGING
// ============================================================
router.post('/add', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const newUser = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            username: req.body.username,
            password: req.body.password, 
            role: req.body.role || 'user',
            isActive: true,
            isArchive: "No"
        });

        const savedUser = await newUser.save();
        
        const { password, ...other } = savedUser._doc;

        // 🎯 LOG USER CREATION
        await logCreate(req, 'Users', `${savedUser.fullName} (${savedUser.email})`);
        
        console.log('✅ User created successfully:', savedUser.email);
        
        res.status(201).json({ 
            status: "ok", 
            message: "User created successfully!", 
            data: other 
        });

    } catch (err) {
        console.error('❌ User creation error:', err);

        // 🎯 LOG CREATION ERROR
        await logActivity({
            action: 'CREATE',
            module: 'Users',
            user: req.body.email || 'System',
            severity: 'ERROR',
            description: `Failed to create user: ${err.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: err.code === 11000 ? 400 : 500,
                duration: `${Date.now() - startTime}ms`
            }
        });

        if (err.code === 11000) {
            return res.status(400).json({ 
                status: "error", 
                message: "Email already exists." 
            });
        }

        res.status(500).json({ 
            status: "error", 
            message: err.message 
        });
    }
});

// ============================================================
// GET ALL ACTIVE USERS (NOT ARCHIVED)
// ============================================================
router.get('/', async (req, res) => {
    try {
        const users = await User.find({ isArchive: { $ne: "Yes" } })
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.status(200).json(users);
    } catch (err) {
        console.error('❌ Fetch users error:', err);
        res.status(500).json(err);
    }
});

// ============================================================
// ARCHIVE USER WITH ACTIVITY LOGGING
// ============================================================
router.put('/archive/:id', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                status: "error", 
                message: "User not found." 
            });
        }

        const userName = user.fullName;
        const userEmail = user.email;

        const archivedUser = await User.findByIdAndUpdate(
            req.params.id, 
            { isArchive: "Yes" }, 
            { new: true }
        );

        // 🎯 LOG USER ARCHIVE
        await logActivity({
            action: 'ARCHIVE',
            module: 'Users',
            user: 'Admin',
            severity: 'WARNING',
            description: `User archived: ${userName} (${userEmail})`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                recordId: req.params.id,
                recordTitle: userName,
                changes: {
                    isArchive: { from: 'No', to: 'Yes' }
                }
            }
        });

        console.log('✅ User archived:', userEmail);
        
        res.status(200).json({ 
            status: "ok", 
            message: "User archived successfully." 
        });

    } catch (err) {
        console.error('❌ Archive user error:', err);

        // 🎯 LOG ARCHIVE ERROR
        await logActivity({
            action: 'ARCHIVE',
            module: 'Users',
            user: 'Admin',
            severity: 'ERROR',
            description: `Failed to archive user: ${err.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`,
                recordId: req.params.id
            }
        });

        res.status(500).json({ 
            status: "error", 
            message: err.message 
        });
    }
});

// ============================================================
// DELETE USER PERMANENTLY WITH ACTIVITY LOGGING
// ============================================================
router.delete('/:id', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ 
                status: "error", 
                message: "User not found." 
            });
        }

        const userName = user.fullName;
        const userEmail = user.email;

        await User.findByIdAndDelete(req.params.id);

        // 🎯 LOG USER DELETION
        await logDelete(req, 'Users', req.params.id, `${userName} (${userEmail})`);

        console.log('✅ User deleted permanently:', userEmail);
        
        res.status(200).json({ 
            status: "ok", 
            message: "User deleted successfully." 
        });

    } catch (err) {
        console.error('❌ Delete user error:', err);

        // 🎯 LOG DELETE ERROR
        await logActivity({
            action: 'DELETE',
            module: 'Users',
            user: 'Admin',
            severity: 'ERROR',
            description: `Failed to delete user: ${err.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`,
                recordId: req.params.id
            }
        });

        res.status(500).json(err);
    }
});

// ============================================================
// UPDATE USER PROFILE WITH ACTIVITY LOGGING
// ============================================================
router.put('/update-profile/:id', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const userId = req.params.id;
        
        if (userId === "undefined" || !userId) {
            return res.status(400).json({ 
                status: "error", 
                message: "Invalid User ID provided." 
            });
        }

        const { fullName, email, username, isArchive } = req.body;

        // Get old user data for comparison
        const oldUser = await User.findById(userId);

        if (!oldUser) {
            return res.status(404).json({ 
                status: "error", 
                message: "User not found." 
            });
        }

        // Track changes
        const changes = {};
        if (fullName && fullName !== oldUser.fullName) {
            changes.fullName = { from: oldUser.fullName, to: fullName };
        }
        if (email && email !== oldUser.email) {
            changes.email = { from: oldUser.email, to: email };
        }
        if (username && username !== oldUser.username) {
            changes.username = { from: oldUser.username, to: username };
        }
        if (isArchive && isArchive !== oldUser.isArchive) {
            changes.isArchive = { from: oldUser.isArchive, to: isArchive };
        }
        
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fullName, email, username, isArchive }, 
            { new: true, runValidators: true }
        ).select('-password');

        // 🎯 LOG PROFILE UPDATE
        if (Object.keys(changes).length > 0) {
            await logUpdate(
                req, 
                'Users', 
                userId, 
                `${updatedUser.fullName} (${updatedUser.email})`, 
                changes
            );
        }

        console.log('✅ User profile updated:', updatedUser.email);

        res.status(200).json({ 
            status: "ok", 
            data: updatedUser 
        });

    } catch (err) {
        console.error('❌ Update profile error:', err);

        // 🎯 LOG UPDATE ERROR
        await logActivity({
            action: 'UPDATE',
            module: 'Users',
            user: 'Admin',
            severity: 'ERROR',
            description: `Failed to update user profile: ${err.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`,
                recordId: req.params.id
            }
        });

        res.status(500).json({ 
            status: "error", 
            message: "Database error: " + err.message 
        });
    }
});

// ============================================================
// UPDATE USER PASSWORD WITH ACTIVITY LOGGING
// ============================================================
router.put('/update-password/:id', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.params.id).select('+password');

        if (!user) {
            return res.status(404).json({ 
                status: "error", 
                message: "User not found" 
            });
        }

        const isMatch = await user.comparePassword(currentPassword);
        
        if (!isMatch) {
            // 🎯 LOG FAILED PASSWORD UPDATE
            await logActivity({
                action: 'UPDATE',
                module: 'Users',
                user: user.email,
                userId: user._id,
                severity: 'WARNING',
                description: `Failed password update attempt: Incorrect current password for ${user.email}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 400,
                    duration: `${Date.now() - startTime}ms`,
                    recordId: user._id.toString()
                }
            });

            return res.status(400).json({ 
                status: "error", 
                message: "Incorrect current password." 
            });
        }

        user.password = newPassword;
        await user.save();

        // 🎯 LOG SUCCESSFUL PASSWORD UPDATE
        await logActivity({
            action: 'UPDATE',
            module: 'Users',
            user: user.email,
            userId: user._id,
            severity: 'SUCCESS',
            description: `Password updated successfully for ${user.fullName} (${user.email})`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 200,
                duration: `${Date.now() - startTime}ms`,
                recordId: user._id.toString(),
                recordTitle: user.fullName
            }
        });

        console.log('✅ User password updated:', user.email);

        res.status(200).json({ 
            status: "ok", 
            message: "Password updated successfully!" 
        });

    } catch (err) {
        console.error('❌ Password update error:', err);

        // 🎯 LOG PASSWORD UPDATE ERROR
        await logActivity({
            action: 'UPDATE',
            module: 'Users',
            user: 'System',
            severity: 'ERROR',
            description: `Failed to update user password: ${err.message}`,
            ipAddress: getIpAddress(req),
            userAgent: getUserAgent(req),
            details: {
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: 500,
                duration: `${Date.now() - startTime}ms`,
                recordId: req.params.id
            }
        });

        res.status(500).json({ 
            status: "error", 
            message: err.message 
        });
    }
});

// ============================================================
// GET ARCHIVED USERS
// ============================================================
router.get('/archived', async (req, res) => {
    try {
        const archivedUsers = await User.find({ isArchive: "Yes" })
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.status(200).json(archivedUsers);
    } catch (err) {
        console.error('❌ Fetch archived users error:', err);
        res.status(500).json({ 
            status: "error", 
            message: err.message 
        });
    }
});

// ============================================================
// GET ALL USERS (INCLUDING ARCHIVED)
// ============================================================
router.get('/all-with-archived', async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.status(200).json(users);
    } catch (err) {
        console.error('❌ Fetch all users error:', err);
        res.status(500).json(err);
    }
});

// ============================================================
// CHECK IF EMAIL EXISTS
// ============================================================
router.get('/check-email', async (req, res) => {
    try {
        const email = req.query.email;
        
        if (!email) {
            return res.status(400).json({ 
                status: "error", 
                message: "Email parameter is required." 
            });
        }

        const user = await User.findOne({ email: email });

        if (user) {
            return res.status(200).json({ 
                status: "ok", 
                exists: true, 
                data: user 
            });
        } else {
            return res.status(200).json({ 
                status: "ok", 
                exists: false, 
                message: "Email not found." 
            });
        }
    } catch (err) {
        console.error("Error checking email:", err);
        res.status(500).json({ 
            status: "error", 
            message: err.message 
        });
    }
});

module.exports = router;