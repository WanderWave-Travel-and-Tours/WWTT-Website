const Testimonial = require('../models/Testimonial');
const ActivityLog = require('../models/ActivityLog'); // Ensure path is correct
const fs = require('fs');
const path = require('path');

// 1. CREATE TESTIMONIAL
const addTestimonial = async (req, res) => {
    try {
        const { customerName, source, feedback, rating, userEmail, adminId } = req.body;

        // ✅ FIX: Explicitly convert rating to Number, default to 5 if missing
        const ratingValue = rating ? Number(rating) : 5;

        const newTestimonial = new Testimonial({
            customerName,
            source,
            customerImage: req.file ? req.file.filename : "", 
            feedback,
            rating: ratingValue, // ✅ Save as Number
            isArchive: "No"
        });

        const savedTestimonial = await newTestimonial.save();

        // ACTIVITY LOG (CREATE)
        try {
            let logUserId = null;
            if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
                logUserId = adminId;
            }

            await ActivityLog.create({
                action: 'CREATE',
                module: 'Testimonials',
                user: userEmail || 'Unknown User',
                userId: logUserId,
                description: `Added new testimonial from: ${customerName} (Rating: ${ratingValue})`,
                severity: 'SUCCESS',
                details: {
                    recordTitle: customerName,
                    recordId: savedTestimonial._id.toString(),
                    method: 'POST'
                }
            });
            console.log('✅ Activity Log saved for Add Testimonial');
        } catch (logError) {
            console.error('⚠️ Failed to save activity log:', logError.message);
        }

        res.status(200).json(savedTestimonial);
    } catch (err) {
        console.error('Error adding testimonial:', err);
        res.status(500).json(err);
    }
};

// 2. GET ALL
const getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.find();
        res.status(200).json(testimonials);
    } catch (err) {
        res.status(500).json(err);
    }
};

// 3. GET SINGLE
const getTestimonialById = async (req, res) => {
    try {
        const testimonial = await Testimonial.findById(req.params.id);
        if (!testimonial) return res.status(404).json("Testimonial not found");
        res.status(200).json(testimonial);
    } catch (err) {
        res.status(500).json(err);
    }
};

// 4. UPDATE
const updateTestimonial = async (req, res) => {
    try {
        const { customerName, source, feedback, rating, userEmail, adminId, changes } = req.body;
        
        // ✅ FIX: Include rating in the updateData object
        let updateData = { customerName, source, feedback };
        
        // Check if rating exists and is not undefined
        if (rating !== undefined && rating !== null && rating !== "") {
            updateData.rating = Number(rating);
        }

        if (req.file) {
            updateData.customerImage = req.file.filename;
        }

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        if (!updatedTestimonial) return res.status(404).json("Testimonial not found");

        // ACTIVITY LOG (UPDATE)
        try {
            let logDescription = `Updated testimonial from: ${updatedTestimonial.customerName}`;
            
            if (changes) {
                try {
                    const parsedChanges = JSON.parse(changes);
                    // Handle if it's an array of strings or object keys
                    if (Array.isArray(parsedChanges) && parsedChanges.length > 0) {
                        logDescription += `. Changes: ${parsedChanges.join(', ')}`;
                    } else if (typeof parsedChanges === 'object') {
                        const keys = Object.keys(parsedChanges);
                        if (keys.length > 0) logDescription += `. Fields: ${keys.join(', ')}`;
                    }
                } catch (e) {
                    logDescription += ` details updated.`;
                }
            }

            let logUserId = null;
            if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
                logUserId = adminId;
            }

            await ActivityLog.create({
                action: 'UPDATE',
                module: 'Testimonials',
                user: userEmail || 'Unknown User',
                userId: logUserId,
                description: logDescription,
                severity: 'SUCCESS',
                details: {
                    recordTitle: updatedTestimonial.customerName,
                    recordId: updatedTestimonial._id.toString(),
                    method: 'PUT'
                }
            });
            console.log('✅ Activity Log saved for Update Testimonial');
        } catch (logError) { console.error('Log Error:', logError.message); }

        res.status(200).json(updatedTestimonial);
    } catch (err) {
        console.error('Error updating testimonial:', err);
        res.status(500).json(err);
    }
};

// 5. ARCHIVE / RESTORE
const archiveTestimonial = async (req, res) => {
    try {
        const { isArchive, userEmail, adminId } = req.body;

        const updatedTestimonial = await Testimonial.findByIdAndUpdate(
            req.params.id,
            { isArchive: isArchive }, 
            { new: true }
        );

        if (!updatedTestimonial) return res.status(404).json("Testimonial not found");

        const actionType = isArchive === 'Yes' ? 'ARCHIVE' : 'RESTORE';
        const severity = isArchive === 'Yes' ? 'WARNING' : 'SUCCESS';

        // ACTIVITY LOG (ARCHIVE)
        try {
            let logUserId = null;
            if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
                logUserId = adminId;
            }

            await ActivityLog.create({
                action: actionType,
                module: 'Testimonials',
                user: userEmail || 'Unknown User',
                userId: logUserId,
                description: `${actionType === 'ARCHIVE' ? 'Archived' : 'Restored'} testimonial from: ${updatedTestimonial.customerName}`,
                severity: severity,
                details: {
                    recordTitle: updatedTestimonial.customerName,
                    recordId: updatedTestimonial._id.toString(),
                    method: 'PATCH'
                }
            });
        } catch (logError) { console.error('Log Error:', logError.message); }

        res.status(200).json(updatedTestimonial);
    } catch (err) {
        res.status(500).json(err);
    }
};

module.exports = {
    addTestimonial,
    getAllTestimonials,
    getTestimonialById,
    updateTestimonial,
    archiveTestimonial
};