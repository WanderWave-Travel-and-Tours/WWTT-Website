const Deal = require('../models/deal');
const { cloudinary } = require('../config/cloudinary');

const addDeal = async (req, res) => {
    try {
        const { title, description, price, discountedPrice, status } = req.body;
        if (!req.file) return res.status(400).json({ message: 'Image required' });

        const newDeal = new Deal({ 
            title, 
            description, 
            price, 
            discountedPrice, 
            imageUrl: req.file.path,
            imagePublicId: req.file.filename,
            status 
        });
        await newDeal.save();
        res.status(201).json({ message: 'Deal added!', deal: newDeal });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAllDeals = async (req, res) => {
    try {
        const deals = await Deal.find().sort({ createdAt: -1 });
        res.status(200).json(deals);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteDeal = async (req, res) => {
    try {
        const deal = await Deal.findById(req.params.id);
        if (!deal) return res.status(404).json({ message: 'Deal not found' });

        // Delete from Cloudinary
        if (deal.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(deal.imagePublicId);
            } catch (err) {
                console.error('Failed to delete image:', err);
            }
        }

        await Deal.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Deal deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { addDeal, getAllDeals, deleteDeal };