const router = require('express').Router();
const Promo = require('../models/promo');

// CREATE: Add new promo
router.post('/add', async (req, res) => {
    try {
        const newPromo = new Promo({
            ...req.body,
            isArchive: "No"
        });
        const savedPromo = await newPromo.save();
        res.status(200).json({ status: "ok", data: savedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

// READ: Kunin lahat ng Promo (ginagamit ng Archive at View)
router.get('/all', async (req, res) => {
    try {
        const promos = await Promo.find().sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

// READ: View Promos (Filter default isArchive: "No")
router.get('/', async (req, res) => {
    try {
        const promos = await Promo.find({ isArchive: "No" }).sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

// UPDATE ARCHIVE STATUS (Ito ang fix sa 404)
// URL: PUT http://localhost:5000/api/promos/:id
router.put('/:id', async (req, res) => {
    try {
        const updatedPromo = await Promo.findByIdAndUpdate(
            req.params.id,
            { isArchive: req.body.isArchive },
            { new: true }
        );
        if (!updatedPromo) return res.status(404).json({ message: "Promo not found" });
        res.status(200).json({ status: "ok", data: updatedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

module.exports = router;