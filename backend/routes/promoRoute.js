const mongoose = require('mongoose');
const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const Promo = require('../models/promo'); // Siguraduhin tama ang path sa model mo

// MULTER CONFIGURATION (Image Upload)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Siguraduhin may 'uploads' folder ka sa root ng backend
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
    }
});

const upload = multer({ storage: storage });

// ROUTES

// 1. CREATE (With Image Upload)
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const promoData = {
            ...req.body,
            isArchive: "No",
            image: req.file ? req.file.filename : "" // Save filename kung may inupload
        };

        const newPromo = new Promo(promoData);
        const savedPromo = await newPromo.save();
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

// 5. UPDATE: Edit Promo (With Image Upload)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        let updateData = { ...req.body };

        // Kung may bagong image na inupload, i-update ang image field
        if (req.file) {
            updateData.image = req.file.filename;
        }

        const updatedPromo = await Promo.findByIdAndUpdate(
            req.params.id,
            { $set: updateData }, 
            { new: true }
        );

        if (!updatedPromo) return res.status(404).json({ message: "Promo not found" });
        res.status(200).json({ status: "ok", data: updatedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;