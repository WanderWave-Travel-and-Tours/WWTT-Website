const router = require('express').Router();
const User = require('../models/user');
const verifyUserJWT = require('../middleware/verifyUserJWT');

// Default-deny: every route in this file requires a valid user JWT.
// userId is NEVER accepted from URL params or request body —
// it is derived exclusively from req.user._id (verified JWT payload).
router.use(verifyUserJWT);

// ============================================================
// GET USER WISHLIST
// ============================================================
router.get('/', async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('favorites');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const favoriteIds = user.favorites || [];

        const PackageModel = require('../models/package');
        const Tour = require('../models/tour');
        let Transfer;
        try {
            Transfer = require('../models/transfer');
        } catch (e) {
            Transfer = null;
        }

        const queries = [
            PackageModel.find({ _id: { $in: favoriteIds } })
                .select('_id title name destination location price image duration soloPaxPrice multiplePaxPrice inclusions rating reviews package_code category')
                .lean(),
            Tour.find({ _id: { $in: favoriteIds } })
                .select('_id title destination price image duration tourType minPax category inclusions')
                .lean(),
        ];

        if (Transfer) {
            queries.push(
                Transfer.find({ _id: { $in: favoriteIds } })
                    .select('_id title packageDestination imageUrl oneWayPrice roundtripPrice oneWayMarkup roundtripMarkup category pax maxPax capacity')
                    .lean()
            );
        }

        const results = await Promise.all(queries);
        const [packages, tours, transfers = []] = results;

        const lookup = {};
        packages.forEach(pkg => { lookup[pkg._id.toString()] = { doc: pkg, type: 'package' }; });
        tours.forEach(tour => { lookup[tour._id.toString()] = { doc: tour, type: 'tour' }; });
        transfers.forEach(transfer => { lookup[transfer._id.toString()] = { doc: transfer, type: 'transfer' }; });

        const wishlistItems = favoriteIds
            .map(id => {
                const entry = lookup[id.toString()];
                if (!entry) return null;
                const { doc, type } = entry;
                const location = type === 'transfer'
                    ? (doc.packageDestination || 'Unknown')
                    : (doc.destination || doc.location || 'Unknown');
                return {
                    promo_id: doc._id.toString(),
                    package_title: doc.title || doc.name || 'Untitled',
                    package_location: location,
                    itemType: type,
                    packageDetails: doc,
                };
            })
            .filter(Boolean);

        res.status(200).json({ status: 'ok', data: wishlistItems });

    } catch (error) {
        console.error('❌ Error fetching wishlist:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================
// CHECK IF A SPECIFIC ITEM IS IN THE USER'S FAVORITES
// Only itemId comes from the URL; userId from JWT.
// ============================================================
router.get('/check/:itemId', async (req, res) => {
    try {
        const userId = req.user._id;
        const { itemId } = req.params;

        const user = await User.findById(userId).select('favorites');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const isFavorite = (user.favorites || []).some(id => id.toString() === itemId);
        res.status(200).json({ status: 'ok', isFavorite });

    } catch (error) {
        console.error('❌ Error checking favorite status:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================
// TOGGLE FAVORITE (add or remove)
// Ignores any user_id / userId in body — identity from JWT only.
// ============================================================
router.post('/', async (req, res) => {
    try {
        const userId = req.user._id;
        const { promo_id, package_title, package_location } = req.body;
        const packageId = promo_id || req.body.packageId;

        if (!packageId) {
            return res.status(400).json({
                status: 'error',
                message: 'packageId (or promo_id) is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const isFavorited = user.favorites &&
            user.favorites.some(id => id.toString() === String(packageId));

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            isFavorited
                ? { $pull: { favorites: packageId } }
                : { $addToSet: { favorites: packageId } },
            { new: true }
        );

        res.status(200).json({
            status: 'ok',
            isFavorited: !isFavorited,
            data: updatedUser.favorites,
            package_title,
            package_location,
        });

    } catch (error) {
        console.error('❌ Toggle favorite error:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================
// REMOVE SPECIFIC ITEM
// ============================================================
router.delete('/remove', async (req, res) => {
    try {
        const userId = req.user._id;
        const { packageId } = req.body;

        if (!packageId) {
            return res.status(400).json({ status: 'error', message: 'packageId is required' });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { favorites: packageId } },
            { new: true }
        ).select('favorites');

        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        res.status(200).json({ status: 'ok', data: user.favorites });

    } catch (error) {
        console.error('❌ Error removing favorite:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ============================================================
// TOGGLE VIA /toggle
// ============================================================
router.post('/toggle', async (req, res) => {
    try {
        const userId = req.user._id;
        const { packageId } = req.body;

        if (!packageId) {
            return res.status(400).json({ status: 'error', message: 'packageId is required' });
        }

        const user = await User.findById(userId).select('favorites');
        if (!user) {
            return res.status(404).json({ status: 'error', message: 'User not found' });
        }

        const isFavorited = user.favorites && user.favorites.map(String).includes(String(packageId));

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            isFavorited
                ? { $pull: { favorites: packageId } }
                : { $addToSet: { favorites: packageId } },
            { new: true }
        ).select('favorites');

        res.status(200).json({
            status: 'ok',
            isFavorited: !isFavorited,
            data: updatedUser.favorites,
        });

    } catch (error) {
        console.error('❌ Error toggling favorite:', error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

module.exports = router;
