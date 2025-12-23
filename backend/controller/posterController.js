const Poster = require('../models/poster');
const { cloudinary } = require('../config/cloudinary');

const addPoster = async (req, res) => {
    try {
        const { title, description, startDate, endDate, status, isArchive } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image.' });
        }

        const newPoster = new Poster({
            title,
            description,
            imageUrl: req.file.path,
            imagePublicId: req.file.filename,
            startDate,
            endDate,
            status,
            isArchive: isArchive || 'No'
        });

        await newPoster.save();
        res.status(201).json({ message: 'Poster added successfully!', poster: newPoster });

    } catch (error) {
        console.error('Error adding poster:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAllPosters = async (req, res) => {
    try {
        const posters = await Poster.find().sort({ createdAt: -1 });
        res.status(200).json(posters);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getActivePosters = async (req, res) => {
    try {
        const posters = await Poster.find({ status: 'Active', isArchive: 'No' }).sort({ createdAt: -1 });
        res.status(200).json(posters);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const getPosterById = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);
        if (!poster) return res.status(404).json({ message: 'Poster not found' });
        res.status(200).json(poster);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updatePoster = async (req, res) => {
    try {
        const { title, description, startDate, endDate, status, imagePublicId } = req.body;
        
        const updateData = {
            title,
            description,
            startDate,
            endDate,
            status
        };

        if (req.file) {
            // Delete old image
            if (imagePublicId) {
                try {
                    await cloudinary.uploader.destroy(imagePublicId);
                } catch (err) {
                    console.error('Failed to delete old image:', err);
                }
            }
            updateData.imageUrl = req.file.path;
            updateData.imagePublicId = req.file.filename;
        }

        const updatedPoster = await Poster.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedPoster) return res.status(404).json({ message: 'Poster not found' });
        
        res.status(200).json({ status: "ok", data: updatedPoster });
    } catch (error) {
        console.error('Error updating poster:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const deletePoster = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);
        if (!poster) return res.status(404).json({ message: 'Poster not found' });

        // Delete from Cloudinary
        if (poster.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(poster.imagePublicId);
            } catch (err) {
                console.error('Failed to delete image:', err);
            }
        }

        await Poster.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Poster deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const updatePosterStatus = async (req, res) => {
    try {
        const { status, isArchive } = req.body;
        const updateData = {};
        
        if (status) updateData.status = status;
        if (isArchive) updateData.isArchive = isArchive;

        const poster = await Poster.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true }
        );

        if (!poster) return res.status(404).json({ message: 'Poster not found' });
        
        res.status(200).json(poster);
    } catch (error) {
        console.error('Error updating poster status:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addPoster,
    getAllPosters,
    getActivePosters,
    getPosterById,
    updatePoster,
    deletePoster,
    updatePosterStatus
};