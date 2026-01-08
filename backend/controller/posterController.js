const Poster = require('../models/poster');
const ActivityLog = require('../models/ActivityLog'); // IMPORT ACTIVITY LOG MODEL
const fs = require('fs');
const path = require('path');
const { cloudinary } = require('../config/cloudinary');

const addPoster = async (req, res) => {
    try {
        const { title, description, startDate, endDate, status, isArchive, userEmail, adminId } = req.body;

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

        // =========================================================
        // CREATE ACTIVITY LOG (ADD)
        // =========================================================
        try {
            await ActivityLog.create({
                action: 'CREATE',
                module: 'Posters',
                entity: 'Poster',
                entityId: newPoster._id,
                user: userEmail || 'Unknown User',
                description: `Created new poster: ${title}`,
                severity: 'SUCCESS',
                adminId: adminId || null
            });
            console.log('Activity Log saved for Add Poster');
        } catch (logError) {
            console.error('Failed to save activity log:', logError);
        }

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

// =========================================================
// UPDATED: UPDATE POSTER WITH ACTIVITY LOGS
// =========================================================
const updatePoster = async (req, res) => {
    try {
        // Extract extra fields for logging: userEmail, adminId, changes
        const { title, description, startDate, endDate, status, imagePublicId, userEmail, adminId, changes } = req.body;
        
        const updateData = {
            title,
            description,
            startDate,
            endDate,
            status
        };

        // Handle Image Update
        if (req.file) {
            // Delete old image from Cloudinary if exists
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

        // Perform the Update
        const updatedPoster = await Poster.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedPoster) return res.status(404).json({ message: 'Poster not found' });

        // =========================================================
        // ADDED: CREATE ACTIVITY LOG (UPDATE)
        // =========================================================
        try {
            // Format the description based on tracked changes
            let logDescription = `Updated poster: ${updatedPoster.title}`;
            
            if (changes) {
                // Frontend sends changes as a JSON string via FormData
                try {
                    const parsedChanges = JSON.parse(changes);
                    if (Array.isArray(parsedChanges) && parsedChanges.length > 0) {
                        logDescription += `. Changes: ${parsedChanges.join(', ')}`;
                    }
                } catch (e) {
                    // Fallback if parsing fails (e.g. simple string)
                    logDescription += ` details updated.`;
                }
            }

            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Posters',
                entity: 'Poster',
                entityId: updatedPoster._id,
                user: userEmail || 'Unknown User',
                description: logDescription,
                severity: 'SUCCESS', // Green status
                adminId: adminId || null
            });
            console.log('Activity Log saved for Update Poster');

        } catch (logError) {
            console.error('Failed to save activity log for update:', logError);
            // Don't stop the response just because log failed
        }
        
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