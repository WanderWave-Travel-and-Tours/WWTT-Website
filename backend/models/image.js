const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    imageName: {  // ✅ CORRECT
        type: String,
        required: false,
        default: 'Untitled Image'
    },
    imageUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);