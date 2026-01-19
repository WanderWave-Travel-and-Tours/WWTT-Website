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
    
    // ✅ Tour Type Fields
    tourType: { 
        type: String, 
        enum: ['private', 'joiners'], 
        default: 'private' 
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
    } // ✅ NEW: Timestamp when package is archived
    
}, { timestamps: true }); // ✅ ENSURES createdAt & updatedAt are created

PackageSchema.pre('save', function(next) {
    this.price = this.sellerPrice + this.markup;
    
    // Clear minPax if tour type is private
    if (this.tourType === 'private') {
        this.minPax = null;
    }
    
    next();
});

const PackageModel = mongoose.model("packages", PackageSchema);
module.exports = PackageModel;