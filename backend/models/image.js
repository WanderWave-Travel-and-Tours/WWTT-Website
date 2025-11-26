const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    title: {
        type: String,
        required: false 
    },
    imageUrl: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Image', imageSchema);