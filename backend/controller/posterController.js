const Poster = require('../models/poster');
const ActivityLog = require('../models/ActivityLog'); // IMPORT ACTIVITY LOG MODEL
const fs = require('fs');
const path = require('path');

// Magdagdag ng bagong poster
const addPoster = async (req, res) => {
    try {
        const { title, description, startDate, endDate, status, isArchive, userEmail, adminId } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Please upload an image.' });
        }

        const imageUrl = `uploads/${req.file.filename}`;

        const newPoster = new Poster({
            title,
            description,
            imageUrl, 
            startDate,
            endDate,
            status,
            isArchive: isArchive || 'No'
        });

        await newPoster.save();

        // =========================================================
        // ADDED: CREATE ACTIVITY LOG
        // =========================================================
        try {
            await ActivityLog.create({
                action: 'CREATE',
                module: 'Posters',
                entity: 'Poster',
                entityId: newPoster._id,
                user: userEmail || 'Unknown User',
                description: `Created new poster: ${title}`,
                
                // --- IDAGDAG MO ITO PARA MAGING GREEN (SUCCESS) ---
                severity: 'SUCCESS', 
                // -------------------------------------------------

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

// Kunin ang lahat ng posters (Gagamitin sa Archive fetching)
const getAllPosters = async (req, res) => {
    try {
        const posters = await Poster.find().sort({ createdAt: -1 });
        res.status(200).json(posters);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Kunin ang mga active at hindi naka-archive
const getActivePosters = async (req, res) => {
    try {
        const posters = await Poster.find({ status: 'Active', isArchive: 'No' }).sort({ createdAt: -1 });
        res.status(200).json(posters);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION: Get Single Poster by ID (For Edit Page) ---
const getPosterById = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);
        if (!poster) return res.status(404).json({ message: 'Poster not found' });
        res.status(200).json(poster);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// --- NEW FUNCTION: Update Poster Details ---
const updatePoster = async (req, res) => {
    try {
        const { title, description, startDate, endDate, status } = req.body;
        
        const updateData = {
            title,
            description,
            startDate,
            endDate,
            status
        };

        // Kung may bagong image na inupload, palitan ang imageUrl
        if (req.file) {
            updateData.imageUrl = `uploads/${req.file.filename}`;
            // Optional: Pwede mong i-delete ang old image dito kung gusto mo mag-clean up
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

// Burahin ang poster (Permanent)
const deletePoster = async (req, res) => {
    try {
        const poster = await Poster.findById(req.params.id);
        if (!poster) return res.status(404).json({ message: 'Poster not found' });

        if (poster.imageUrl) {
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

// I-update ang Status o Archive status (Gagamitin sa Restore)
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