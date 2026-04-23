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
    
    // ✅ Markup Type Field
    markupType: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        default: 'fixed' 
    },
    
    markup: { type: Number, default: 0 }, 
    price: { type: Number, required: true },
    duration: { type: String, required: true },
    category: { type: String, enum: ['Local', 'International', 'Internation Tour'], default: 'Local' },
    
    // ✅ Tour Type — flexible string to support tag-based values:
    // e.g. "Solo", "Min of 2 pax", "Solo/Joiners", "With Free City Tour",
    //      "With City Tour", "Min of 2 pax (Exclusive Tour)", or any custom value.
    // Legacy values "private" and "joiners" are still accepted for backward compatibility.
    tourType: { 
        type: String, 
        default: 'Solo'
    },
    pax: { 
        type: Number, 
        default: null,
        validate: {
            validator: function(value) {
                if (this.tourType === 'private') {
                    return value != null && value >= 1;
                }
                return true;
            },
            message: 'Pax is required for private tours and must be at least 1'
        }
    },
    minPax: { 
        type: Number, 
        default: null,
        validate: {
            validator: function(value) {
                if (this.tourType === 'joiners') {
                    return value != null && value >= 1;
                }
                return true;
            },
            message: 'Minimum pax is required for joiner tours and must be at least 1'
        }
    },

    // ✅ Pax Pricing Fields
    // soloPaxPrice  — custom selling price set by admin for a 1-person (solo) booking
    // multiplePaxPrice — custom selling price set by admin for a group/multiple-person booking
    // null means no custom price was set for that booking type
    soloPaxPrice: { type: Number, default: null, set: (v) => (v === '' || v === undefined) ? null : Number(v) },
    multiplePaxPrice: { type: Number, default: null, set: (v) => (v === '' || v === undefined) ? null : Number(v) },
    
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

// ✅ PRE-SAVE HOOK: Calculate price based on markupType, clear opposing pax fields
PackageSchema.pre('save', function(next) {
    // Calculate final price based on markup type
    if (this.markupType === 'percentage') {
        const markupAmount = (this.sellerPrice * this.markup) / 100;
        this.price = this.sellerPrice + markupAmount;
    } else {
        this.price = this.sellerPrice + this.markup;
    }
    
    // ✅ Clear pax if tour type is joiners (legacy compat)
    if (this.tourType === 'joiners') {
        this.pax = null;
    }
    
    // ✅ Clear minPax if tour type is private (legacy compat)
    if (this.tourType === 'private') {
        this.minPax = null;
    }
    
    next();
});

const PackageModel = mongoose.model("packages", PackageSchema);
module.exports = PackageModel;