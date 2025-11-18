const router = require('express').Router();
const Package = require('../models/package');

router.get('/all', async (req, res) => {
    try {
        const packages = await Package.find().sort({ _id: -1 });

        return res.status(200).json({
            status: 'ok',
            data: packages,
        });

    } catch (error) {
        console.error('Error fetching packages:', error);
        return res.status(500).json({
            status: 'error',
            error: 'Failed to retrieve packages from the database.',
        });
    }
});

module.exports = router;