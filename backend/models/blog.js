const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, unique: true }, 
    
    author: { type: String, required: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
    
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    
    status: {
        type: String,
        enum: ['Published', 'Draft', 'Scheduled'],
        default: 'Published'
    },
    scheduledAt: { type: Date, default: null },
    isArchive: { type: String, enum: ['Yes', 'No'], default: 'No' },
    metaDescription: { type: String },
    seoScore: { type: Number },
    keywords: { type: [String], default: [] },
    
    externalId: { type: String }, 
    seoData: { type: mongoose.Schema.Types.Mixed } 
}, 
{
    timestamps: true 
});

module.exports = mongoose.model('Blog', blogSchema);