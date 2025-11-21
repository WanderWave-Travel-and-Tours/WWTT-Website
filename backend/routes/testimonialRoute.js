const router = require('express').Router();
const Testimonial = require('../models/testimonial');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

router.post("/", upload.single('customerImage'), async (req, res) => {
    try {
        const newTestimonial = new Testimonial({
            customerName: req.body.customerName,
            source: req.body.source,
            customerImage: req.file ? req.file.filename : "", 
            feedback: req.body.feedback
        });

        const savedTestimonial = await newTestimonial.save();
        res.status(200).json(savedTestimonial);
    } catch (err) {
        res.status(500).json(err);
    }
});

router.get("/", async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        res.status(200).json(testimonials);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router;