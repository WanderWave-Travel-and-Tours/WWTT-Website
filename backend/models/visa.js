const mongoose = require('mongoose');

const visaSchema = new mongoose.Schema({
    country: { type: String, required: true },
    flagCode: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: String, required: true },
    requirements: [
        {
            title: { type: String, required: true },
            items: [{ type: String }]
        }
    ],
    // NEW: Download Forms with file info
    downloadForms: [
        {
            label: { type: String, required: true },
            fileName: { type: String },
            fileUrl: { type: String }
        }
    ],
    // NEW: Steps and Process
    stepsProcess: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Visa', visaSchema);