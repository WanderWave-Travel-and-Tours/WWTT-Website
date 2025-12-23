// KUNIN ANG ISANG TESTIMONIAL GAMIT ANG ID
const getTestimonialById = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }
        res.json(testimonial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE ANG TESTIMONIAL
const updateTestimonial = async (req, res) => {
    try {
        const { customerName, source, feedback } = req.body;
        let updateData = { customerName, source, feedback };

        // Kung may bagong image na inupload via Multer
        if (req.file) {
            updateData.customerImage = req.file.path; // O kung ano man ang variable name niyo
        }

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true } // Ibalik ang updated na data
        );

        if (!updatedTestimonial) {
            return res.status(404).json({ message: 'Testimonial not found' });
        }

        res.json(updatedTestimonial);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Export functions (Siguraduhin na kasama ito sa dulo ng file)
module.exports = {
    // ... existing functions ...
    getTestimonialById,
    updateTestimonial
};