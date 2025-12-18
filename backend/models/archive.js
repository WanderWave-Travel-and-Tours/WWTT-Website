const mongoose = require('mongoose');

const ArchiveSchema = new mongoose.Schema({
    originalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' },
    title: String,
    destination: String,
    sellerPrice: Number,
    markup: Number,
    price: Number,
    duration: String,
    category: String,
    image: String,
    inclusions: Array,
    itinerary: Array,
    archivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Archive', ArchiveSchema);