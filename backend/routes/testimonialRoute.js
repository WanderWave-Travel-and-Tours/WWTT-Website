const router = require('express').Router();
const Testimonial = require('../models/testimonial'); // Siguraduhing tama ang path sa model mo
const multer = require('multer');
const path = require('path');

// --- MULTER CONFIG (Image Upload) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });


// --- ROUTES ---

// 1. POST - Create Testimonial
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
});

// 2. GET - Get ALL Testimonials
router.get("/", async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        res.status(200).json(testimonials);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 3. GET - Get SINGLE Testimonial by ID (IMPORTANT FIX FOR EDIT PAGE)
// Ito ang tinatawag ng frontend mo pag nagbubukas ng Edit Page via ID
router.get("/:id", async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        
        if (!testimonial) {
            return res.status(404).json("Testimonial not found");
        }

        res.status(200).json(testimonial);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 4. PUT - Update Testimonial Details (IMPORTANT FIX FOR SAVING)
// Ito ang tinatawag kapag pinindot ang "Update Testimonial" button
router.put("/update/:id", upload.single('customerImage'), async (req, res) => {
    try {
        const { customerName, source, feedback } = req.body;
        
        // Prepare object to update
        let updateData = {
            customerName,
            source,
            feedback
        };

        // Kung may inupload na bagong picture, i-update din ang image field
        if (req.file) {
            updateData.customerImage = req.file.filename;
        }

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true } // Return the updated document
        );

        if (!updatedTestimonial) {
            return res.status(404).json("Testimonial not found");
        }

        res.status(200).json(updatedTestimonial);
    } catch (err) {
        res.status(500).json(err);
    }
});

// 5. PATCH - Archive/Unarchive Status
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

module.exports = router;