const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    author: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    imageUrl: {
        type: String,
        required: true // Cover image is required
    },
    status: {
        type: String,
        enum: ['Published', 'Draft', 'Scheduled'], // ✅ Added 'Scheduled'
        default: 'Published'
    },
    scheduledAt: {
        type: Date, // ✅ New field for schedule date
        default: null
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    isArchive: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    }
}, 
{
    timestamps: true // Auto adds createdAt and updatedAt
});

module.exports = mongoose.model('Blog', blogSchema);