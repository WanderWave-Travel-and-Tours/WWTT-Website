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
    
    // ✅ Markup Type Field (NEW)
    markupType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        default: 'fixed' 
    },
    
    markup: { type: Number, default: 0 }, 
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    category: { type: String, enum: ['Local', 'International', 'Internation Tour'], default: 'Local' },
    
    // ✅ Tour Type Fields
    tourType: { 
        type: String, 
        enum: ['private', 'joiners'], 
        default: 'private' 
    },
    pax: { 
        type: Number, 
        default: null,
        validate: {
            validator: function(value) {
                // Only validate if tourType is private
                if (this.tourType === 'private') {
                    return value != null && value >= 1;
                }
                return true; // No validation for joiners
            },
            message: 'Pax is required for private tours and must be at least 1'
        }
    },
    minPax: { 
        type: Number, 
        default: null,
        validate: {
            validator: function(value) {
                // Only validate if tourType is joiners
                if (this.tourType === 'joiners') {
                    return value != null && value >= 1;
                }
                return true; // No validation for private tours
            },
            message: 'Minimum pax is required for joiner tours and must be at least 1'
        }
    },
    
    image: { type: String },
    imagePublicId: {
        type: String,
        default: ''
    },
    inclusions: [{ type: String }],
    itinerary: [ItineraryItemSchema],
    
    // ✅ Archive Fields
    isArchive: { 
        type: String, 
        enum: ['Yes', 'No'],
        default: 'No' 
    },
    archivedAt: { 
        type: Date, 
        default: null 
    }
    
}, { timestamps: true });

// ✅ UPDATED PRE-SAVE HOOK: Calculate price based on markupType
PackageSchema.pre('save', function(next) {
    // Calculate final price based on markup type
    if (this.markupType === 'percentage') {
        // If percentage, calculate the markup amount then add to seller price
        const markupAmount = (this.sellerPrice * this.markup) / 100;
        this.price = this.sellerPrice + markupAmount;
    } else {
        // If fixed, just add markup directly
        this.price = this.sellerPrice + this.markup;
    }
    
    // ✅ Clear pax if tour type is joiners
    if (this.tourType === 'joiners') {
        this.pax = null;
    }
    
    // ✅ Clear minPax if tour type is private
    if (this.tourType === 'private') {
        this.minPax = null;
    }
    
    next();
});

const PackageModel = mongoose.model("packages", PackageSchema);
module.exports = PackageModel;