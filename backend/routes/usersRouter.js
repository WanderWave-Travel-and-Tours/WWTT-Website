const router = require('express').Router();
// Changed to require('../models/user') to match the likely file name
const User = require('../models/user'); 

// --- POST: Add New User ---
router.post('/add', async (req, res) => {
    try {
        const newUser = new User({
            fullName: req.body.fullName,
            email: req.body.email,
            username: req.body.username,
            password: req.body.password, 
            role: req.body.role || 'user',
            isActive: true
        });

        const savedUser = await newUser.save();
        
        const { password, ...other } = savedUser._doc;
        
        res.status(201).json({ status: "ok", message: "User created successfully!", data: other });
    } catch (err) {
        if (err.code === 11000) {
            // Note: The provided model does not have a 'username' field, 
            // only 'email' is unique. This check might need adjustment.
            return res.status(400).json({ status: "error", message: "Email already exists." });
        }
        res.status(500).json({ status: "error", message: err.message });
    }
});

// --- GET: Fetch All Users ---
router.get('/', async (req, res) => {
    try {
        // This is the endpoint hit by your React app
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- DELETE: Delete User by ID ---
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        
        if (!deletedUser) {
            return res.status(404).json({ status: "error", message: "User not found." });
        }
        
        res.status(200).json({ status: "ok", message: "User deleted successfully." });
    } catch (err) {
        res.status(500).json(err);
    }
});

// --- GET: Check if email exists (NEW ENDPOINT) ---
router.get('/check-email', async (req, res) => {
    try {
        const email = req.query.email;
        if (!email) {
            return res.status(400).json({ status: "error", message: "Email parameter is required." });
        }

        const user = await User.findOne({ email: email });

        if (user) {
            return res.status(200).json({ status: "ok", exists: true, data: user });
        } else {
            return res.status(200).json({ status: "ok", exists: false, message: "Email not found." });
        }
    } catch (err) {
        // Log the error for server-side debugging
        console.error("Error checking email:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;