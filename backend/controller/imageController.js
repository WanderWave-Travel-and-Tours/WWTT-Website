const Image = require('../models/image');
const { cloudinary } = require('../config/cloudinary');

const addImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image.' });
        }

        const imageName = req.body.title || req.file.originalname;

        const newImage = new Image({
            imageName,
            imageUrl: req.file.path, // Cloudinary URL
            imagePublicId: req.file.filename,
            isArchive: 'No'
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

const archiveImage = async (req, res) => {
    try {
        const { id } = req.params;
        const newStatus = req.body.isArchive || 'Yes';
        
        const updatedImage = await Image.findByIdAndUpdate(
            id, 
            { isArchive: newStatus }, 
            { new: true }
        );

        if (!updatedImage) {
            return res.status(404).json({ message: 'Image not found' });
        }

        const actionMessage = newStatus === 'Yes' ? 'archived' : 'restored';
        console.log(`📦 Image ${actionMessage}:`, updatedImage._id);

        res.status(200).json({ 
            message: `Image ${actionMessage} successfully`, 
            image: updatedImage 
        });
    } catch (error) {
        console.error('❌ Error updating image archive status:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = {
    addImage,
    getAllImages,
    archiveImage
};