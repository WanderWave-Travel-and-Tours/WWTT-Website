const router = require('express').Router();
const Promo = require('../models/promo');

router.post('/add', async (req, res) => {
    try {
        const newPromo = new Promo({
            code: req.body.code,
            description: req.body.description,
            category: req.body.category,
            discountType: req.body.discountType,
            discountValue: req.body.discountValue,
            startDate: req.body.startDate,
            durationType: req.body.durationType,
            validUntil: req.body.validUntil, 
            isActive: true
        });

        const savedPromo = await newPromo.save();
        res.status(200).json({ status: "ok", message: "Promo created successfully!", data: savedPromo });
    } catch (err) {
        res.status(500).json({ status: "error", message: err.message });
    }
});

router.get('/', async (req, res) => {
    try {
        const promos = await Promo.find().sort({ createdAt: -1 });
        res.status(200).json(promos);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.delete('/:id', async (req, res) => {
    try {
        await Promo.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: "ok", message: "Promo deleted." });
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;