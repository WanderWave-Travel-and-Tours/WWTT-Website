const Image = require('../models/image');
const fs = require('fs');
const path = require('path');

const addImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image.' });
        }

        const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        const imageName = req.body.title || req.file.originalname;  // ← FIXED

        const newImage = new Image({
            imageName,  // ← FIXED: changed from title to imageName
            imageUrl
        });

        await newImage.save();
        console.log('✅ Image saved to database:', newImage);
        res.status(201).json({ message: 'Image uploaded successfully!', image: newImage });

    } catch (error) {
        console.error('❌ Error uploading image:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const getAllImages = async (req, res) => {
    try {
        const images = await Image.find().sort({ createdAt: -1 });
        console.log('📸 Fetched images:', images.length);
        res.status(200).json(images);
    } catch (error) {
        console.error('❌ Error fetching images:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const deleteImage = async (req, res) => {
    try {
        const image = await Image.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        if (image.imageUrl) {
            const filename = image.imageUrl.split('/').pop();
            const filePath = path.join(__dirname, '../uploads', filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log('🗑️ File deleted:', filename);
            }
        }

        await Image.findByIdAndDelete(req.params.id);
        console.log('✅ Image deleted from database');
        res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting image:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    addImage,
    getAllImages,
    deleteImage
};