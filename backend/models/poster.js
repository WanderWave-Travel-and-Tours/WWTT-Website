const mongoose = require('mongoose');

const posterSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: false
    },
    endDate: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Scheduled'],
        default: 'Active'
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    // New field added here
    isArchive: {
        type: String,
        enum: ['No', 'Yes'],
        default: 'No'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Poster', posterSchema);