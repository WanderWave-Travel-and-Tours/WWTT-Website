const mongoose = require('mongoose');

const promoSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: ''
    },
    discountType: {
        type: String,
        enum: ['Fixed Amount (Peso)', 'Percentage'],
        default: 'Fixed Amount (Peso)'
    },
    durationType: {
        type: String,
        enum: ['Weekly', 'Monthly', 'Yearly'],
        default: 'Weekly'
    },
    startDate: {
        type: String,
        default: null
    },
    validUntil: {
        type: String,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isArchive: {
        type: String,
        enum: ['Yes', 'No'],
        default: 'No'
    },
    image: {
        type: String,
        default: ''
    },
    imagePublicId: {
        type: String,
        default: ''
    },
    pricing: {
        local: { type: Number, default: 0 },
        international: { type: Number, default: 0 }
    },
    targetPackages: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'packages'
        }
    ],

    // ✅ NEW: Promo Type
    // 'promo'   → regular public promo, appears in PromoSection carousel
    // 'voucher' → one-time use per logged-in user, NEVER appears in public carousel
    promoType: {
        type: String,
        enum: ['promo', 'voucher'],
        default: 'promo',
        required: true
    }

}, { timestamps: true });

const Promo = mongoose.model('Promo', promoSchema);
module.exports = Promo;