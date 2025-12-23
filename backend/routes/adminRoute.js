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

// ✅ FIXED: Login with EMAIL
router.post('/login', async (req, res) => {
    console.log('📥 Login request body:', req.body); // Debug log
    
    // ✅ FIX: Check if values exist BEFORE sanitizing
    const emailRaw = req.body.email;
    const passwordRaw = req.body.password;
    const recaptchaToken = req.body.recaptchaToken;

    // Validate that email and password exist
    if (!emailRaw || !passwordRaw) {
        console.log('❌ Missing email or password');
        return res.status(400).json({ 
            status: "error", 
            message: "Email and password are required." 
        });
    }

    if (!recaptchaToken) {
        console.log('❌ Missing reCAPTCHA token');
        return res.status(400).json({ 
            status: "error", 
            message: "reCAPTCHA verification is required." 
        });
    }

    // ✅ Sanitize AFTER validation
    const email = sanitize(emailRaw.toString().toLowerCase());
    const password = sanitize(passwordRaw.toString());

    console.log('🔍 Sanitized email:', email);
    console.log('🔍 Email type:', typeof email);
    console.log('🔍 Password type:', typeof password);

    // Extra type check (should pass now)
    if (typeof email !== 'string' || typeof password !== 'string') {
        console.log('❌ Type check failed after sanitization');
        return res.status(400).json({ 
            status: "error", 
            message: "Invalid input types. Credentials must be strings." 
        });
    }

    try {
        console.log(`🔍 Searching for admin with email: ${email}`);
        
        // Find admin by EMAIL
        const admin = await AdminModel.findOne({ email: email });

        if (!admin) {
            console.log(`❌ No admin found with email: ${email}`);
            return res.status(401).json({ 
                status: "error", 
                message: "Invalid email or password" 
            });
        }

        console.log(`✅ Admin found: ${admin.email}`);

        const isMatch = await admin.comparePassword(password); 

        if (isMatch) {
            const token = jwt.sign(
                { id: admin._id, email: admin.email, role: 'admin' },
                'wanderwaveph_admin25', 
                { expiresIn: '1h' }
            );

            console.log(`✅ Login successful for: ${admin.email}`);

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
        } else {
            console.log(`❌ Password mismatch for: ${email}`);
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
                email: admin.email
            }
        });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;