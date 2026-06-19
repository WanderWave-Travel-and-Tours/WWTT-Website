const router = require('express').Router();
const User = require('../models/user');
const authMiddleware = require('../middleware/auth');
const verifyUserJWT = require('../middleware/verifyUserJWT');
const { authLimiter } = require('../middleware/rateLimiters');

const {
    logCreate,
    logUpdate,
    logDelete,
    logActivity,
    getIpAddress,
    getUserAgent
} = require('../utils/activityLogger');

// ============================================================
// ADD NEW USER (ADMIN ONLY)
// ============================================================
router.post('/add', authMiddleware, async (req, res) => {
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

        await logCreate(req, 'Users', `${savedUser.fullName} (${savedUser.email})`);

        console.log('✅ User created successfully:', savedUser.email);

        res.status(201).json({
            status: "ok",
            message: "User created successfully!",
            data: other
        });

    } catch (err) {
        console.error('❌ User creation error:', err);

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
// GET ALL ACTIVE USERS — ADMIN ONLY, FIELD-RESTRICTED
// FIX 2: Added authMiddleware + explicit field selection
// ============================================================
router.get('/', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({ isArchive: { $ne: "Yes" } })
            .select('fullName email role isActive createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json(users);
    } catch (err) {
        console.error('❌ Fetch users error:', err);
        res.status(500).json(err);
    }
});

// ============================================================
// ARCHIVE USER — ADMIN ONLY
// ============================================================
router.put('/archive/:id', authMiddleware, async (req, res) => {
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

        await User.findByIdAndUpdate(
            req.params.id,
            { isArchive: "Yes" },
            { new: true }
        );

        await logActivity({
            action: 'ARCHIVE',
            module: 'Users',
            user: req.adminEmail || 'Admin',
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
                changes: { isArchive: { from: 'No', to: 'Yes' } }
            }
        });

        console.log('✅ User archived:', userEmail);

        res.status(200).json({
            status: "ok",
            message: "User archived successfully."
        });

    } catch (err) {
        console.error('❌ Archive user error:', err);

        await logActivity({
            action: 'ARCHIVE',
            module: 'Users',
            user: req.adminEmail || 'Admin',
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
// DELETE USER PERMANENTLY — ADMIN ONLY
// ============================================================
router.delete('/:id', authMiddleware, async (req, res) => {
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

        await logDelete(req, 'Users', req.params.id, `${userName} (${userEmail})`);

        console.log('✅ User deleted permanently:', userEmail);

        res.status(200).json({
            status: "ok",
            message: "User deleted successfully."
        });

    } catch (err) {
        console.error('❌ Delete user error:', err);

        await logActivity({
            action: 'DELETE',
            module: 'Users',
            user: req.adminEmail || 'Admin',
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
// UPDATE OWN PROFILE — USER SELF-SERVICE (JWT required)
// FIX 4: No :id param; identity derived from verified JWT
// ============================================================
router.put('/update-profile', verifyUserJWT, async (req, res) => {
    const startTime = Date.now();

    try {
        const userId = req.user._id;

        const { fullName, email, username } = req.body;

        const oldUser = await User.findById(userId);
        if (!oldUser) {
            return res.status(404).json({
                status: "error",
                message: "User not found."
            });
        }

        const changes = {};
        if (fullName && fullName !== oldUser.fullName) changes.fullName = { from: oldUser.fullName, to: fullName };
        if (email && email !== oldUser.email) changes.email = { from: oldUser.email, to: email };
        if (username && username !== oldUser.username) changes.username = { from: oldUser.username, to: username };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fullName, email, username },
            { new: true, runValidators: true }
        ).select('-password');

        if (Object.keys(changes).length > 0) {
            await logUpdate(
                req,
                'Users',
                userId.toString(),
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

        await logActivity({
            action: 'UPDATE',
            module: 'Users',
            user: req.user?.email || 'Unknown',
            severity: 'ERROR',
            description: `Failed to update user profile: ${err.message}`,
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
            message: "Database error: " + err.message
        });
    }
});

// ============================================================
// UPDATE ANY USER PROFILE — ADMIN ONLY (e.g., archive restore)
// FIX 4: Separated from user self-update; admin-auth required
// ============================================================
router.put('/update-profile/:id', authMiddleware, async (req, res) => {
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

        const oldUser = await User.findById(userId);
        if (!oldUser) {
            return res.status(404).json({
                status: "error",
                message: "User not found."
            });
        }

        const changes = {};
        if (fullName && fullName !== oldUser.fullName) changes.fullName = { from: oldUser.fullName, to: fullName };
        if (email && email !== oldUser.email) changes.email = { from: oldUser.email, to: email };
        if (username && username !== oldUser.username) changes.username = { from: oldUser.username, to: username };
        if (isArchive && isArchive !== oldUser.isArchive) changes.isArchive = { from: oldUser.isArchive, to: isArchive };

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { fullName, email, username, isArchive },
            { new: true, runValidators: true }
        ).select('-password');

        if (Object.keys(changes).length > 0) {
            await logUpdate(
                req,
                'Users',
                userId,
                `${updatedUser.fullName} (${updatedUser.email})`,
                changes
            );
        }

        console.log('✅ User profile updated (admin):', updatedUser.email);

        res.status(200).json({
            status: "ok",
            data: updatedUser
        });

    } catch (err) {
        console.error('❌ Update profile error:', err);

        await logActivity({
            action: 'UPDATE',
            module: 'Users',
            user: req.adminEmail || 'Admin',
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
// UPDATE OWN PASSWORD — USER SELF-SERVICE
// FIX 1: No :id param; identity derived exclusively from JWT.
// Rate-limited. Requires currentPassword verification.
// ============================================================
router.put('/update-password', authLimiter, verifyUserJWT, async (req, res) => {
    const startTime = Date.now();

    try {
        const { currentPassword, newPassword } = req.body;

        // Derive user from JWT — never from params or body
        const user = await User.findById(req.user._id).select('+password');

        if (!user) {
            return res.status(404).json({
                status: "error",
                message: "User not found"
            });
        }

        const isMatch = await user.comparePassword(currentPassword);

        if (!isMatch) {
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
                    statusCode: 401,
                    duration: `${Date.now() - startTime}ms`,
                    recordId: user._id.toString()
                }
            });

            return res.status(401).json({
                status: "error",
                message: "Incorrect current password."
            });
        }

        // Assign new password — the pre-save hook will hash it
        user.password = newPassword;
        await user.save();

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

        await logActivity({
            action: 'UPDATE',
            module: 'Users',
            user: req.user?.email || 'Unknown',
            severity: 'ERROR',
            description: `Failed to update user password: ${err.message}`,
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
            message: err.message
        });
    }
});

// ============================================================
// GET ARCHIVED USERS — ADMIN ONLY
// ============================================================
router.get('/archived', authMiddleware, async (req, res) => {
    try {
        const archivedUsers = await User.find({ isArchive: "Yes" })
            .select('fullName email role isActive isArchive createdAt')
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
// GET ALL USERS INCLUDING ARCHIVED — ADMIN ONLY
// ============================================================
router.get('/all-with-archived', authMiddleware, async (req, res) => {
    try {
        const users = await User.find({})
            .select('fullName email role isActive isArchive createdAt');

        res.status(200).json(users);
    } catch (err) {
        console.error('❌ Fetch all users error:', err);
        res.status(500).json(err);
    }
});

// ============================================================
// CHECK IF EMAIL EXISTS (public — used during signup flow)
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

        const user = await User.findOne({ email: email }).select('email');

        if (user) {
            return res.status(200).json({ status: "ok", exists: true });
        }

        return res.status(200).json({ status: "ok", exists: false, message: "Email not found." });

    } catch (err) {
        console.error("Error checking email:", err);
        res.status(500).json({
            status: "error",
            message: err.message
        });
    }
});

module.exports = router;
