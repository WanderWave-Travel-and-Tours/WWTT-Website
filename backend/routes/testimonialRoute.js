const router = require('express').Router();
const Testimonial = require('../models/testimonial'); //
const multer = require('multer'); //
const path = require('path'); //

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
}); //

const upload = multer({ storage: storage }); //

// POST - Create Testimonial
router.post("/", upload.single('customerImage'), async (req, res) => {
    try {
        const newTestimonial = new Testimonial({
            customerName: req.body.customerName,
            source: req.body.source,
            customerImage: req.file ? req.file.filename : "", 
            feedback: req.body.feedback
            // isArchive is "No" by default
        });

        const savedTestimonial = await newTestimonial.save();
        res.status(200).json(savedTestimonial);
    } catch (err) {
        res.status(500).json(err);
    }
}); //

// GET - Get all Testimonials
router.get("/", async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        res.status(200).json(testimonials);
    } catch (err) {
        res.status(500).json(err);
    }
}); //

// MODIFIED/ADDED: PATCH - Update isArchive status
// Ito ang reresolba sa 404 error mo kanina
router.patch("/:id", async (req, res) => {
    try {
        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { isArchive: req.body.isArchive },
            { new: true }
        );

        if (!updatedTestimonial) {
            return res.status(404).json("Testimonial not found");
        }

        res.status(200).json(updatedTestimonial);
    } catch (err) {
        res.status(500).json(err);
    }
});

module.exports = router; //