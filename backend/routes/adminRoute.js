const router = require('express').Router();
const AdminModel = require('../models/admin'); 
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const sanitize = require('mongo-sanitize');
const jwt = require('jsonwebtoken'); 

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ✅ UPDATED: Login with EMAIL instead of USERNAME
router.post('/login', async (req, res) => {
    const email = sanitize(req.body.email);  // ✅ Changed from username to email
    const password = sanitize(req.body.password);
    const recaptchaToken = req.body.recaptchaToken;  // ✅ Fixed: was req.body only

    if (!recaptchaToken) {
        return res.status(400).json({ 
            status: "error", 
            message: "reCAPTCHA verification is required." 
        });
    }

    // ✅ Validate email and password
    if (typeof email !== 'string' || typeof password !== 'string') {
        return res.status(400).json({ 
            status: "error", 
            message: "Invalid input types. Credentials must be strings." 
        });
    }

    try {
        // ✅ Find admin by EMAIL instead of username
        const admin = await AdminModel.findOne({ email: email.toLowerCase() });

        if (!admin) {
            console.log(`❌ No admin found with email: ${email}`);
            return res.status(401).json({ 
                status: "error", 
                message: "Invalid email or password" 
            });
        }

        const isMatch = await admin.comparePassword(password); 

        if (isMatch) {
            const token = jwt.sign(
                { id: admin._id, email: admin.email, role: 'admin' },  // ✅ Include email in token
                'wanderwaveph_admin25', 
                { expiresIn: '1h' }
            );

            console.log(`✅ Admin login successful: ${admin.email}`);

            res.json({ 
                status: "ok", 
                message: "Login Success!",
                token: token, 
                data: {
                    username: admin.username,  // Keep username for display
                    email: admin.email,        // ✅ Include email in response
                    businessName: admin.businessName,
                    businessAddress: admin.businessAddress,
                    businessLogo: admin.businessLogo
                }
            });
        } else {
            console.log(`❌ Password mismatch for email: ${email}`);
            res.status(401).json({ 
                status: "error", 
                message: "Invalid email or password" 
            });
        }
    } catch (err) {
        console.error("❌ Login Error:", err);
        res.status(500).json({ 
            status: "error", 
            message: "Server error during login." 
        });
    }
});

// ✅ UPDATED: Include email in settings response
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
                email: admin.email,  // ✅ Include email
                businessName: admin.businessName,
                businessAddress: admin.businessAddress,
                businessLogo: admin.businessLogo
            }
        });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

router.put('/update-settings', upload.single('businessLogo'), async (req, res) => {
    try {
        const { businessName, businessAddress } = req.body;
        
        const admin = await AdminModel.findOne();

        if (!admin) {
            return res.status(404).json({ status: "error", message: "Admin not found" });
        }

        if (businessName) admin.businessName = businessName;
        if (businessAddress) admin.businessAddress = businessAddress;

        if (req.file) {
            admin.businessLogo = req.file.filename;
        }

        await admin.save();

        res.json({ 
            status: "ok", 
            message: "Settings updated successfully!", 
            data: {
                businessName: admin.businessName,
                businessAddress: admin.businessAddress,
                businessLogo: admin.businessLogo,
                email: admin.email  // ✅ Include email
            }
        });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;