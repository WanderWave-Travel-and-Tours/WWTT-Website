const mongoose = require('mongoose');
const router = require('express').Router();

// SCHEMA DEFINITION
const PromoSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    discountType: { type: String, required: true },
    discountValue: { type: Number, required: true },
    startDate: { type: Date, required: true },
    durationType: { type: String, enum: ['Weekly', 'Monthly', 'Yearly'], required: true }, // Ensure this matches frontend
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    isArchive: { type: String, enum: ['No', 'Yes'], default: 'No' }
}, { timestamps: true });

const Promo = mongoose.models.Promo || mongoose.model('Promo', PromoSchema);

// ROUTES

// 1. CREATE
router.post('/add', async (req, res) => {
    try {
        const newPromo = new Promo({ ...req.body, isArchive: "No" });
        const savedPromo = await newPromo.save();
        res.status(200).json({ status: "ok", data: savedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// 2. READ: Get Specific Promo by ID (CRITICAL FOR EDIT PAGE)
router.get('/:id', async (req, res) => {
    try {
        const promo = await Promo.findById(req.params.id);
        if (!promo) return res.status(404).json({ message: "Promo not found" });
        res.status(200).json(promo);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 3. READ: View Active Promos
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

// 5. UPDATE: General Update (Fixes editing issue)
// UPDATE ARCHIVE STATUS (Ito ang fix sa 404)
// URL: PUT https://wanderwaveph-backend.onrender.com/api/promos/:id
router.put('/:id', async (req, res) => {
    try {
        const updatedPromo = await Promo.findByIdAndUpdate(
            req.params.id,
            { $set: req.body }, 
            { new: true }
        );
        if (!updatedPromo) return res.status(404).json({ message: "Promo not found" });
        res.status(200).json({ status: "ok", data: updatedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;