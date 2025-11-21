const router = require('express').Router();
const AdminModel = require('../models/admin'); 
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');

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
    const { username, password } = req.body; 

    try {
        const admin = await AdminModel.findOne({ username });

        if (!admin) {
            return res.status(401).json({ status: "error", message: "Invalid credentials" });
        }

        const isMatch = await admin.comparePassword(password); 

        if (isMatch) {
            res.json({ 
                status: "ok", 
                message: "Login Success!",
                data: {
                    username: admin.username,
                    businessName: admin.businessName,
                    businessAddress: admin.businessAddress,
                    businessLogo: admin.businessLogo
                }
            });
        } else {
            res.status(401).json({ status: "error", message: "Invalid credentials" });
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ status: "error", message: "Server error during login." });
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
                businessLogo: admin.businessLogo
            }
        });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;