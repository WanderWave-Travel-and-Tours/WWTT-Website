const Testimonial = require('../models/testimonial');
const ActivityLog = require('../models/ActivityLog'); // ✅ Siguraduhin tama ang path/case
const fs = require('fs');
const path = require('path');

// 1. CREATE TESTIMONIAL
const addTestimonial = async (req, res) => {
    try {
        const { customerName, source, feedback, userEmail, adminId } = req.body;

        const newTestimonial = new Testimonial({
            customerName,
            source,
            customerImage: req.file ? req.file.filename : "", 
            feedback,
            isArchive: "No"
        });

        const savedTestimonial = await newTestimonial.save();

        // ACTIVITY LOG (CREATE)
        try {
            await ActivityLog.create({
                action: 'CREATE',
                module: 'Testimonials', // ⚠️ REMINDER: Add 'Testimonials' to ActivityLog Enum
                user: userEmail || 'Unknown User',
                userId: adminId || null,
                description: `Added new testimonial from: ${customerName}`,
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
        const { customerName, source, feedback, userEmail, adminId } = req.body;
        
        let updateData = { customerName, source, feedback };

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
            if (userEmail) {
                await ActivityLog.create({
                    action: 'UPDATE',
                    module: 'Testimonials',
                    user: userEmail,
                    userId: adminId || null,
                    description: `Updated testimonial from: ${customerName}`,
                    severity: 'INFO',
                    details: {
                        recordTitle: customerName,
                        recordId: updatedTestimonial._id.toString(),
                        method: 'PUT'
                    }
                });
            }
        } catch (logError) { console.error('Log Error:', logError.message); }

        res.status(200).json(updatedTestimonial);
    } catch (err) {
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
            if (userEmail) {
                await ActivityLog.create({
                    action: actionType,
                    module: 'Testimonials',
                    user: userEmail,
                    userId: adminId || null,
                    description: `${actionType === 'ARCHIVE' ? 'Archived' : 'Restored'} testimonial from: ${updatedTestimonial.customerName}`,
                    severity: severity,
                    details: {
                        recordTitle: updatedTestimonial.customerName,
                        recordId: updatedTestimonial._id.toString(),
                        method: 'PATCH'
                    }
                });
            }
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