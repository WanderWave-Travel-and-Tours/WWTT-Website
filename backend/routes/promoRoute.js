const mongoose = require('mongoose');
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Promo = require('../models/promo'); 
const ActivityLog = require('../models/ActivityLog'); // IMPORT ACTIVITY LOG MODEL

// MULTER CONFIGURATION (Image Upload)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

// ROUTES

// 1. CREATE (With Image Upload & Activity Log)
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const promoData = {
            ...req.body,
            isArchive: "No",
            image: req.file ? req.file.filename : "" 
        };

        const newPromo = new Promo(promoData);
        const savedPromo = await newPromo.save();

        // ==========================================
        // INSERT ACTIVITY LOG HERE
        // ==========================================
        try {
            const { userEmail, adminId } = req.body;
            
            // Sanitize ID
            let logUserId = null;
            if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
                logUserId = adminId;
            }

            await ActivityLog.create({
                action: 'CREATE',
                module: 'Promos',
                user: userEmail || 'System Admin',
                userId: logUserId,
                severity: 'SUCCESS',
                description: `Created new promo code: ${savedPromo.code}`,
                details: {
                    recordTitle: savedPromo.code,
                    recordId: savedPromo._id,
                    method: 'POST',
                    endpoint: '/api/promos/add'
                }
            });
            console.log('✅ Activity Log recorded for New Promo');
        } catch (logError) {
            console.error('❌ Error logging activity:', logError);
        }
        // ==========================================

        res.status(200).json({ status: "ok", data: savedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 2. READ: Get Specific Promo by ID
router.get('/:id', async (req, res) => {
    try {
        const promo = await Promo.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: "Promo not found" });
        res.status(200).json(promo);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 3. READ: View Active Promos (Not Archived)
router.get('/', async (req, res) => {
    try {
        const promos = await Promo.find({ isArchive: "No" }).sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 4. READ: All Promos
router.get('/all', async (req, res) => {
    try {
        const promos = await Promo.find().sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 5. UPDATE: Edit Promo (With Image Upload & Activity Log)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        let updateData = { ...req.body };

        if (req.file) {
            updateData.image = req.file.filename;
        }

        const updatedPromo = await Promo.findByIdAndUpdate(
            req.params.id,
            { $set: updateData }, 
            { new: true }
        );

        if (!updatedPromo) return res.status(404).json({ message: "Promo not found" });

        // ==========================================
        // INSERT ACTIVITY LOG HERE (UPDATE)
        // ==========================================
        try {
            const { userEmail, adminId } = req.body;
            
            let logUserId = null;
            if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
                logUserId = adminId;
            }

            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Promos',
                user: userEmail || 'System Admin',
                userId: logUserId,
                severity: 'SUCCESS',
                description: `Updated promo code: ${updatedPromo.code}`,
                details: {
                    recordTitle: updatedPromo.code,
                    recordId: updatedPromo._id,
                    method: 'PUT',
                    endpoint: `/api/promos/${req.params.id}`
                }
            });
            console.log('✅ Activity Log recorded for Update Promo');
        } catch (logError) {
            console.error('❌ Error logging activity:', logError);
        }
        // ==========================================

        res.status(200).json({ status: "ok", data: updatedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;