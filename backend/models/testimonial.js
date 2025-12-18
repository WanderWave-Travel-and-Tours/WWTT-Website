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
    // Binago sa "No" ang default value
    isArchive: {
        type: String,
        default: "No"
    }
}, { timestamps: true }); 

module.exports = mongoose.model('Testimonial', TestimonialSchema);