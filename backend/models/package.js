const mongoose = require('mongoose');

const ItineraryItemSchema = new mongoose.Schema({
    day: { type: Number, required: true }, 
    title: { type: String, required: true }, 
    activities: [{ type: String }]
});

const PackageSchema = new mongoose.Schema({
    title: { type: String, required: true },
    destination: { type: String, required: true },
    sellerPrice: { type: Number, required: true },
    markup: { type: Number, default: 0 }, 
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    category: { type: String, enum: ['Local', 'International', 'Internation Tour'], default: 'Local' },
    image: { type: String },
    inclusions: [{ type: String }],
    itinerary: [ItineraryItemSchema],
    // Eto ang default definition
    isArchive: { type: String, default: 'No' } 
});

PackageSchema.pre('save', function(next) {
    this.price = this.sellerPrice + this.markup;
    next();
});

const PackageModel = mongoose.model("packages", PackageSchema);
module.exports = PackageModel;