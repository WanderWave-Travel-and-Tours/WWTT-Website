const router = require('express').Router();
const Package = require('../models/package');
const fs = require('fs');
const multer = require('multer'); 
const path = require('path');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/all', async (req, res) => {
    try {
        const packages = await Package.find().sort({ _id: -1 });

        return res.status(200).json({
            status: 'ok',
            data: packages,
        });

    } catch (error) {
        console.error('Error fetching packages:', error);
        return res.status(500).json({
            status: 'error',
            error: 'Failed to retrieve packages from the database.',
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const packageId = req.params.id;
        const pkg = await Package.findById(packageId);

        if (!pkg) {
            return res.status(404).json({ status: 'error', error: 'Package not found.' });
        }

        return res.status(200).json({ status: 'ok', data: pkg });
    } catch (error) {
        console.error('Error fetching package by ID:', error);
        return res.status(500).json({ status: 'error', error: 'Failed to retrieve package data.' });
    }
});

router.put('/edit/:id', upload.single('image'), async (req, res) => {
    try {
        const packageId = req.params.id;
        const { title, destination, price, duration, category, existingImage } = req.body;
        
        let updateData = {
            title,
            destination,
            price,
            duration,
            category,
        };

        if (req.file) {
            updateData.image = req.file.filename;

            if (existingImage && existingImage !== 'placeholder.png') { 
                const oldImagePath = path.join(__dirname, '../uploads', existingImage);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
        } else {
            updateData.image = existingImage;
        }

        const updatedPackage = await Package.findByIdAndUpdate(
            packageId,
            updateData,
            { new: true, runValidators: true } 
        );

        if (!updatedPackage) {
            return res.status(404).json({ status: 'error', error: 'Package not found for update.' });
        }

        res.json({ status: 'ok', message: 'Package updated successfully!' });

    } catch (err) {
        console.error('Error updating package:', err);
        res.status(500).json({ status: 'error', error: err.message });
    }
});

module.exports = router;