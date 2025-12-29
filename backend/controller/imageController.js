const Image = require('../models/image');
const ActivityLog = require('../models/ActivityLog'); // ✅ IMPORT ADDED
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');

// 1. ADD IMAGE (UPLOAD)
const addImage = async (req, res) => {
    try {
        // Kunin ang user data mula sa request body
        const { title, userEmail, adminId } = req.body; 

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
        console.log('✅ Image saved to database:', newImage._id);

        // 👇👇👇 ACTIVITY LOG START (UPLOAD) 👇👇👇
        try {
            await ActivityLog.create({
                action: 'CREATE', // Pwede ring 'UPLOAD' kung nasa enum mo na
                module: 'Gallery', // ⚠️ Siguraduhing nasa ActivityLog Model enum ang 'Gallery'
                user: userEmail || 'Unknown User',
                userId: adminId || null,
                description: `Uploaded new image to gallery: ${imageName}`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: imageName,
                    recordId: newImage._id.toString(),
                    method: 'POST'
                }
            });
            console.log('✅ Activity Log saved for Image Upload');
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }
        // 👆👆👆 ACTIVITY LOG END 👆👆👆

        res.status(201).json({ message: 'Image uploaded successfully!', image: newImage });

    } catch (error) {
        console.error('❌ Error uploading image:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// 2. GET ALL IMAGES
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
        const logAction = newStatus === 'Yes' ? 'ARCHIVE' : 'RESTORE'; // Siguraduhing nasa enum ang 'RESTORE'
        console.log(`📦 Image ${actionMessage}:`, updatedImage._id);

        // 👇👇👇 ACTIVITY LOG START (ARCHIVE/RESTORE) 👇👇👇
        try {
            if (userEmail) {
                await ActivityLog.create({
                    action: logAction, 
                    module: 'Gallery',
                    user: userEmail,
                    userId: adminId || null,
                    description: `${actionMessage.charAt(0).toUpperCase() + actionMessage.slice(1)} gallery image: ${updatedImage.imageName}`,
                    severity: newStatus === 'Yes' ? 'WARNING' : 'SUCCESS',
                    details: {
                        recordTitle: updatedImage.imageName,
                        recordId: updatedImage._id.toString(),
                        method: 'PATCH'
                    }
                });
                console.log(`✅ Activity Log saved for Image ${logAction}`);
            }
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }
        // 👆👆👆 ACTIVITY LOG END 👆👆👆

        res.status(200).json({ 
            message: `Image ${actionMessage} successfully`, 
            image: updatedImage 
        });
    } catch (error) {
        console.error('❌ Error updating image archive status:', error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

// Export functions only (HINDI router)
module.exports = {
    addImage,
    getAllImages,
    archiveImage
};