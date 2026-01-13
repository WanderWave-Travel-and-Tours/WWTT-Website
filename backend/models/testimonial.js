const mongoose = require('mongoose');

const TestimonialSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true
    },
    source: {
        type: String, 
        required: true
    },
    customerImage: {
        type: String, 
        default: ""
    },
    feedback: {
        type: String,
        required: true
    },
    // ✅ RATING FIELD (Supports Floats like 4.5)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
        default: 5
    },
    // Default is "No" (Active)
    isArchive: {
        type: String,
        default: "No"
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Testimonial', TestimonialSchema);