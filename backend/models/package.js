const mongoose = require('mongoose');

const ItineraryItemSchema = new mongoose.Schema({
    day: { type: Number, required: true }, 
    title: { type: String, required: true }, 
    activities: [{ type: String }]
});

const PackageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    destination: { type: String, required: true },
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    category: { type: String, enum: ['Local', 'International'], default: 'Local' },
    image: { type: String },
    inclusions: [{ type: String }],
    itinerary: [ItineraryItemSchema] 
});

const PackageModel = mongoose.model("packages", PackageSchema);
module.exports = PackageModel;