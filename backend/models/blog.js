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
        required: true // Cloudinary URL
    },
    imagePublicId: {
        type: String,
        required: true // Needed for deletion in Cloudinary
    },
    status: {
        type: String,
        enum: ['Published', 'Draft', 'Scheduled'],
        default: 'Published'
    },
    scheduledAt: {
        type: Date,
        default: null
    },
    isArchive: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    }
}, 
{
    timestamps: true 
});

module.exports = mongoose.model('Blog', blogSchema);