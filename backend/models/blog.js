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
        enum: ['Published', 'Draft'],
        default: 'Published'
    }
}, {
    timestamps: true // Auto adds createdAt and updatedAt
});

module.exports = mongoose.model('Blog', blogSchema);