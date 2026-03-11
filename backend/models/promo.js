const mongoose = require('mongoose');

// ✅ NEW SCHEMA: Pricing breakdown for Local and International
const PromoPriceSchema = new mongoose.Schema({
    local: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    international: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    }
}, { _id: false });

const PromoSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: { type: String, required: true },
    category: { type: String, required: true },
    discountType: { type: String, required: true },
    // ✅ REPLACED: discountValue → pricing (local + international)
    pricing: {
        type: PromoPriceSchema,
        required: true
    },
    startDate: { 
        type: Date, 
        required: true 
    },
    durationType: { 
        type: String, 
        enum: ['Weekly', 'Monthly', 'Yearly'], 
        required: true 
    },
    validUntil: { 
        type: Date, 
        required: true 
    },
    image: {
        type: String,
        default: ''
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    usageLimit: {
        type: Number,
        default: null, 
        min: 0,
        required: true
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    isActive: { type: Boolean, default: true },
    isArchive: { 
        type: String, 
        enum: ['No', 'Yes'], 
        default: 'No' 
    },
    // ✅ Target Packages
    targetPackages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'packages'
    }]
}, { timestamps: true });

module.exports = mongoose.model('Promo', PromoSchema);