const Poster = require('../models/poster');

// 1. ADD POSTER 
const addPoster = async (req, res) => {
    try {
        const { title, description, startDate, endDate, status } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image.' });
        }

        // UPDATED: Save relative path only (e.g., "uploads/filename.jpg")
        // Para flexible kahit magbago ang domain (localhost vs live)
        const imageUrl = `uploads/${req.file.filename}`;

        const newPoster = new Poster({
            title,
            description,
            imageUrl, 
            startDate,
            endDate,
            status
        });

        await newPoster.save();

        res.status(201).json({ message: 'Poster added successfully!', poster: newPoster });

    } catch (error) {
        console.error('Error adding poster:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// 2. GET ALL POSTERS
const getAllPosters = async (req, res) => {
    try {
        const posters = await Poster.find().sort({ createdAt: -1 });
        res.status(200).json(posters);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 3. GET ACTIVE POSTERS
const getActivePosters = async (req, res) => {
    try {
        const activePosters = await Poster.find({ status: 'Active' }).select('imageUrl');
        // Ibinabalik lang natin ang relative path string
        const urls = activePosters.map(p => p.imageUrl);
        res.status(200).json(urls);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// 4. DELETE & 5. UPDATE (Keep logic same but ensure paths are handled correctly)
const deletePoster = async (req, res) => { /* ... Keep existing delete logic ... */ };
const updatePosterStatus = async (req, res) => { /* ... Keep existing update logic ... */ };

// Re-export all (Make sure to include delete/update if you implemented them)
// Pansamantala, heto ang export ng modified functions:
const fs = require('fs');
const path = require('path');

// Re-implement delete for completeness with relative path
const deletePosterFixed = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);
        if (!poster) return res.status(404).json({ message: 'Poster not found' });

        if (poster.imageUrl) {
            // Remove 'uploads/' prefix to get filename for deletion
            const filename = poster.imageUrl.replace('uploads/', '');
            const filePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await Poster.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Poster deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Status Update
const updatePosterStatusFixed = async (req, res) => {
    try {
        const { status } = req.body;
        const poster = await Poster.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.status(200).json(poster);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addPoster,
    getAllPosters,
    getActivePosters,
    deletePoster: deletePosterFixed,
    updatePosterStatus: updatePosterStatusFixed
};