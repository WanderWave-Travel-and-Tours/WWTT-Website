const mongoose = require('mongoose');
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Promo = require('../models/promo'); 
const ActivityLog = require('../models/ActivityLog');


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); 
    }
});

const upload = multer({ storage: storage });

router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const promoData = {
            ...req.body,
            isArchive: "No",
            image: req.file ? req.file.filename : "" 
        };

        const newPromo = new Promo(promoData);
        const savedPromo = await newPromo.save();

        try {
            const { userEmail, adminId } = req.body;
            
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

        res.status(200).json({ status: "ok", data: savedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const promo = await Promo.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: "Promo not found" });
        res.status(200).json(promo);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get('/', async (req, res) => {
    try {
        const promos = await Promo.find({ isArchive: "No" }).sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get('/all', async (req, res) => {
    try {
        const promos = await Promo.find().sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

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

        res.status(200).json({ status: "ok", data: updatedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

router.post('/claim/:id', async (req, res) => {
    try {
        const promo = await Promo.findById(req.params.id);
        
        if (!promo) {
            return res.status(404).json({ message: "Promo not found" });
        }
        
        if (!promo.isActive || promo.isArchive === 'Yes') {
            return res.status(400).json({ message: "Promo is no longer active" });
        }
        
        if (new Date() > new Date(promo.validUntil)) {
            return res.status(400).json({ message: "Promo has expired" });
        }
        
        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({ message: "Promo limit reached" });
        }
        
        promo.usedCount += 1;
        await promo.save();
        
        res.status(200).json({ 
            message: "Promo claimed successfully",
            promo 
        });
        
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/validate/:code', async (req, res) => {
    try {
        const { code } = req.params;
        
        const promo = await Promo.findOne({ 
            code: code.toUpperCase(),
            isArchive: 'No'
        });

        if (!promo) {
            return res.status(404).json({ 
                valid: false, 
                message: 'Promo code not found' 
            });
        }

        // Check if active
        if (!promo.isActive) {
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code is no longer active' 
            });
        }

        // Check if expired
        const today = new Date();
        const validUntil = new Date(promo.validUntil);
        if (today > validUntil) {
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code has expired' 
            });
        }

        // Check usage limit
        if (promo.usageLimit && promo.usedCount >= promo.usageLimit) {
            return res.status(400).json({ 
                valid: false, 
                message: 'This promo code has reached its usage limit' 
            });
        }

        res.status(200).json({ 
            valid: true, 
            promo: {
                _id: promo._id,
                code: promo.code,
                description: promo.description,
                discountType: promo.discountType,
                discountValue: promo.discountValue,
                usageLimit: promo.usageLimit,
                usedCount: promo.usedCount
            }
        });

    } catch (err) {
        res.status(500).json({ 
            valid: false, 
            message: err.message 
        });
    }
});

module.exports = router;