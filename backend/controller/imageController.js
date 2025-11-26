const Image = require('../models/image');
const fs = require('fs');
const path = require('path');

const addImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image.' });
        }

        // Simplified: Image URL lang ang kailangan
        const imageUrl = `uploads/${req.file.filename}`;
        // Optional title, defaults to filename if empty
        const title = req.body.title || req.file.originalname; 

        const newImage = new Image({
            title,
            imageUrl
        });

        await newImage.save();
        res.status(201).json({ message: 'Image uploaded successfully!', image: newImage });

    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

const getAllImages = async (req, res) => {
    try {
        const images = await Image.find().sort({ createdAt: -1 });
        res.status(200).json(images);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const deleteImage = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) return res.status(404).json({ message: 'Image not found' });

        if (image.imageUrl) {
            const filename = image.imageUrl.replace('uploads/', '');
            const filePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await Image.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Image deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addImage,
    getAllImages,
    deleteImage
};