// controllers/favoritesController.js

const mongoose = require('mongoose'); // IMPORT MO ANG MONGOOSE DITO
const Favorite = require('../models/favorites'); 
const { Schema } = mongoose; // Import Schema for type checking (if needed, but isValid is enough)

// --- POST: Add or Remove Favorite ---
exports.toggleFavorite = async (req, res) => {
    // Kukunin ang user_id mula sa authenticated user token (req.user.id)
    const userId = req.user.id; 
    const { promo_id } = req.body;

    if (!promo_id) {
        return res.status(400).json({ status: "error", message: "Promo ID is required in the request body." });
    }

    // --- FIX DITO: Tiyakin na balido ang format ng promo_id ---
    if (!mongoose.Types.ObjectId.isValid(promo_id)) {
        console.error("Invalid Promo ID format received:", promo_id);
        return res.status(400).json({ 
            status: "error", 
            message: "Invalid Promo ID format. It must be a valid MongoDB ObjectId." 
        });
    }
    // ------------------------------------------------------------------

    try {
        // 1. Hanapin kung na-save na ang favorite
        // userId ay dapat balido dahil galing ito sa authenticated token.
        const existingFavorite = await Favorite.findOne({ user_id: userId, promo_id: promo_id });

        if (existingFavorite) {
            // Kung mayroon na, i-delete (Toggle Off)
            await Favorite.deleteOne({ _id: existingFavorite._id });
            return res.status(200).json({ status: "ok", message: "Promo removed from favorites.", isFavorited: false });
        } else {
            // Kung wala, i-save (Toggle On)
            const newFavorite = new Favorite({
                user_id: userId,
                promo_id: promo_id
            });

            await newFavorite.save();
            return res.status(201).json({ status: "ok", message: "Promo added to favorites!", isFavorited: true, data: newFavorite });
        }

    } catch (err) {
        // Mas pino na error handling (hal. para sa Duplicate Key Error)
        if (err.code === 11000) {
             return res.status(409).json({ status: "error", message: "Duplicate favorite entry detected (User already favorited this promo)." });
        }
        
        // Pangkalahatang error
        console.error("Error in toggleFavorite:", err);
        res.status(500).json({ 
            status: "error", 
            message: "An unexpected error occurred while processing the favorite update.",
            details: err.message // Optional: for debugging
        });
    }
};


// --- GET: Fetch All Favorites for the User (with Promo Details) ---
exports.getFavoritesByUser = async (req, res) => {
    // Tandaan: Dapat ang user_id ay galing sa authenticated user token (req.user.id)
    const userId = req.user.id; 
    
    // --- Opsyonal na check para sa userId ---
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ 
            status: "error", 
            message: "Invalid user authentication token." 
        });
    }
    // ----------------------------------------

    try {
        // Gamitin ang populate() para i-fetch ang buong promo document
        const favorites = await Favorite.find({ user_id: userId })
            .populate({
                path: 'promo_id', // Ang field na may reference sa Promo collection
                model: 'Promo'    // Ang model na gagamitin para sa lookup
                // Kung gusto mong mag-select ng specific fields lang, gamitin ang select: 'field1 field2'
            })
            // I-sort mula sa pinakabago ang pagkaka-add sa favorites
            .sort({ timestamp: -1 }); 

        // I-format ang output para listahan na lang ng promo ang makuha
        const favoritePromos = favorites.map(fav => fav.promo_id).filter(promo => promo !== null);

        res.status(200).json({ status: "ok", data: favoritePromos });

    } catch (err) {
        console.error("Error in getFavoritesByUser:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
};

// --- DELETE: Remove Favorite by ID (Alternative: gamitin ang toggleFavorite) ---
exports.removeFavoriteById = async (req, res) => {
    const userId = req.user.id; // User ID mula sa token
    const favoriteId = req.params.id; // ID ng Favorite document
    
    // --- FIX DITO: Tiyakin na balido ang format ng favoriteId ---
    if (!mongoose.Types.ObjectId.isValid(favoriteId)) {
        return res.status(400).json({ 
            status: "error", 
            message: "Invalid Favorite ID format in URL parameter." 
        });
    }
    // -------------------------------------------------------------

    try {
        // Tiyakin na ang favorite na ide-delete ay pagmamay-ari ng user na naka-login
        const deletedFavorite = await Favorite.findOneAndDelete({ 
            _id: favoriteId, 
            user_id: userId 
        });

        if (!deletedFavorite) {
            return res.status(404).json({ status: "error", message: "Favorite not found or not authorized to delete." });
        }

        res.status(200).json({ status: "ok", message: "Favorite deleted successfully." });
    } catch (err) {
        console.error("Error in removeFavoriteById:", err);
        res.status(500).json({ status: "error", message: err.message });
    }
};