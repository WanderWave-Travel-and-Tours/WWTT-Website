// models/favorites.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FavoritesSchema = new Schema({
    // user_id: Reference sa 'User' collection
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'User', // Dapat i-match ang model name na 'User' mula sa user.js
        required: true
    },

    // promo_id: Reference sa 'Tour' collection (ginamit para sa tours)
    // NOTE: Pinalitan ang ref mula 'Promo' → 'Tour' para ma-save ang Tour IDs
    promo_id: {
        type: Schema.Types.ObjectId,
        ref: 'Tour', // ✅ FIX: dapat 'Tour' hindi 'Promo' para gumana ang tour favorites
        required: true
    },

    // ✅ FIX: Dinagdag ang package_title at package_location na fields
    // Ipinapadala ito ng favoritesController.js at tourCard.jsx pero wala dito dati
    package_title: {
        type: String,
        default: null
    },

    package_location: {
        type: String,
        default: null
    },

    // timestamp: Para malaman kung kailan ito na-save. Gagamitin natin ang built-in 'timestamps'
    // Pero idadagdag pa rin natin ang isang field para sa eksplisit na tracking.
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true }); // Tiyakin na naka-enable ang built-in timestamps

// INDEX: Siguraduhin na ang kumbinasyon ng user_id at promo_id ay unique
// Para hindi pwedeng i-favorite ng user ang isang promo nang dalawang beses (Prevent Duplicate).
FavoritesSchema.index({ user_id: 1, promo_id: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', FavoritesSchema);