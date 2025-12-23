const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    imageName: {  
        type: String,
        required: false,
        default: 'Untitled Image'
    },
    imageUrl: {
        type: String,
        required: true
    },
    // Idinagdag ang isArchive field dito
    isArchive: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);