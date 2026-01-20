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
    // ✅ FIX: Rating Field setup correctly
    rating: {
        type: Number,
        default: 5,
        min: 0,
        max: 5
    },
    isArchive: {
        type: String,
        default: "No"
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Testimonial', TestimonialSchema);