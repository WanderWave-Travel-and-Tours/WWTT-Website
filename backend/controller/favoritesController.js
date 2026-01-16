// backend/controller/favoritesController.js - COMPLETE CODE
const Favorite = require('../models/favorite');
const { 
    logCreate,
    logDelete,
    logActivity,
    getIpAddress, 
    getUserAgent 
} = require('../utils/activityLogger');

// ============================================================
// TOGGLE FAVORITE (ADD OR REMOVE)
// ============================================================
const toggleFavorite = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { promo_id, user_id, package_title, package_location } = req.body;

        console.log('🎯 Toggle Favorite Request:', { promo_id, user_id, package_title });

        if (!promo_id || !user_id) {
            return res.status(400).json({ 
                status: "error", 
                message: "Package ID and User ID are required." 
            });
        }

        // Check if favorite already exists
        const existingFavorite = await Favorite.findOne({ 
            user_id, 
            promo_id 
        });

        if (existingFavorite) {
            // REMOVE FROM FAVORITES
            await Favorite.findByIdAndDelete(existingFavorite._id);

            // Get all remaining favorites for this user
            const userFavorites = await Favorite.find({ user_id }).sort({ createdAt: -1 });
            const favoriteIds = userFavorites.map(fav => fav.promo_id);

            // 🎯 LOG FAVORITE REMOVAL
            try {
                await logDelete(req, 'Favorites', existingFavorite._id, `Package ${promo_id}`);
            } catch (logError) {
                console.warn('⚠️ Failed to log activity:', logError.message);
            }

            console.log('✅ Package removed from favorites:', promo_id);

            return res.status(200).json({
                status: "ok",
                message: "Package removed from wishlist.",
                action: "removed",
                data: {
                    favorites: favoriteIds,
                    favoriteCount: favoriteIds.length
                }
            });
        } else {
            // ADD TO FAVORITES
            const newFavorite = new Favorite({
                user_id,
                promo_id,
                package_title: package_title || null,
                package_location: package_location || null
            });

            await newFavorite.save();

            // Get all favorites for this user
            const userFavorites = await Favorite.find({ user_id }).sort({ createdAt: -1 });
            const favoriteIds = userFavorites.map(fav => fav.promo_id);

            // 🎯 LOG FAVORITE ADDITION
            try {
                await logCreate(req, 'Favorites', `Package ${package_title || promo_id}`);
            } catch (logError) {
                console.warn('⚠️ Failed to log activity:', logError.message);
            }

            console.log('✅ Package added to favorites:', promo_id);

            return res.status(200).json({
                status: "ok",
                message: "Package added to wishlist!",
                action: "added",
                data: {
                    favorites: favoriteIds,
                    favoriteCount: favoriteIds.length
                }
            });
        }

    } catch (err) {
        console.error('❌ Toggle favorite error:', err);

        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({
                status: "error",
                message: "Package already in favorites."
            });
        }

        // 🎯 LOG ERROR
        try {
            await logActivity({
                action: 'UPDATE',
                module: 'Favorites',
                user: req.body.user_id || 'System',
                severity: 'ERROR',
                description: `Failed to toggle favorite: ${err.message}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 500,
                    duration: `${Date.now() - startTime}ms`
                }
            });
        } catch (logError) {
            console.warn('⚠️ Failed to log error activity:', logError.message);
        }

        res.status(500).json({ 
            status: "error", 
            message: "Failed to update favorites. Please try again." 
        });
    }
};

// ============================================================
// GET USER FAVORITES
// ============================================================
const getUserFavorites = async (req, res) => {
    try {
        const { userId } = req.params;

        console.log('📥 Fetching favorites for user:', userId);

        if (!userId) {
            return res.status(400).json({ 
                status: "error", 
                message: "User ID is required." 
            });
        }

        const favorites = await Favorite.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .lean();

        console.log(`✅ Fetched ${favorites.length} favorites for user:`, userId);

        res.status(200).json({
            status: "ok",
            count: favorites.length,
            data: favorites
        });

    } catch (err) {
        console.error('❌ Get favorites error:', err);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to fetch favorites." 
        });
    }
};

// ============================================================
// CHECK IF PACKAGE IS FAVORITED
// ============================================================
const checkFavorite = async (req, res) => {
    try {
        const { userId, promoId } = req.params;

        const favorite = await Favorite.findOne({ 
            user_id: userId, 
            promo_id: promoId 
        }).lean();

        res.status(200).json({
            status: "ok",
            isFavorite: !!favorite
        });

    } catch (err) {
        console.error('❌ Check favorite error:', err);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to check favorite status." 
        });
    }
};

// ============================================================
// DELETE ALL FAVORITES FOR A USER
// ============================================================
const clearAllFavorites = async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { userId } = req.params;

        console.log('🗑️ Clearing all favorites for user:', userId);

        const result = await Favorite.deleteMany({ user_id: userId });

        // 🎯 LOG CLEAR ALL FAVORITES
        try {
            await logActivity({
                action: 'DELETE',
                module: 'Favorites',
                user: userId,
                severity: 'INFO',
                description: `Cleared all favorites for user: ${userId}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 200,
                    duration: `${Date.now() - startTime}ms`,
                    affectedRecords: result.deletedCount
                }
            });
        } catch (logError) {
            console.warn('⚠️ Failed to log activity:', logError.message);
        }

        console.log(`✅ Cleared ${result.deletedCount} favorites for user:`, userId);

        res.status(200).json({
            status: "ok",
            message: "All favorites cleared successfully.",
            deletedCount: result.deletedCount
        });

    } catch (err) {
        console.error('❌ Clear favorites error:', err);

        // 🎯 LOG ERROR
        try {
            await logActivity({
                action: 'DELETE',
                module: 'Favorites',
                user: req.params.userId || 'System',
                severity: 'ERROR',
                description: `Failed to clear favorites: ${err.message}`,
                ipAddress: getIpAddress(req),
                userAgent: getUserAgent(req),
                details: {
                    method: req.method,
                    endpoint: req.originalUrl,
                    statusCode: 500,
                    duration: `${Date.now() - startTime}ms`
                }
            });
        } catch (logError) {
            console.warn('⚠️ Failed to log error activity:', logError.message);
        }

        res.status(500).json({ 
            status: "error", 
            message: "Failed to clear favorites." 
        });
    }
};

// ============================================================
// GET FAVORITE COUNT FOR USER
// ============================================================
const getFavoriteCount = async (req, res) => {
    try {
        const { userId } = req.params;

        const count = await Favorite.countDocuments({ user_id: userId });

        res.status(200).json({
            status: "ok",
            count: count
        });

    } catch (err) {
        console.error('❌ Get favorite count error:', err);
        res.status(500).json({ 
            status: "error", 
            message: "Failed to get favorite count." 
        });
    }
};

module.exports = {
    toggleFavorite,
    getUserFavorites,
    checkFavorite,
    clearAllFavorites,
    getFavoriteCount
};