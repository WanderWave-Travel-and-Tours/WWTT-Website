const mongoose = require('mongoose');

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
    discountValue: { type: Number, required: true },
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
    
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Promo', PromoSchema);