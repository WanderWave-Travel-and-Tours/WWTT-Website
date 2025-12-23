const Tour = require('../models/tour');
const fs = require('fs');
const path = require('path');

// Create a new tour
exports.createTour = async (req, res) => {
  try {
    console.log('Received body:', req.body);
    console.log('Received file:', req.file);

    const { 
      title, 
      destination, 
      duration, 
      category, 
      sellerPrice, 
      markup, 
      inclusions,
      itinerary, // ADDED: itinerary support
      isArchive
    } = req.body;

    // Validate required fields
    if (!title || !destination || !duration || !category || !sellerPrice || !markup) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Missing required fields' 
      });
    }

    // Validate image upload
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Image is required' 
      });
    }

    // Validate category
    if (!['Local', 'International'].includes(category)) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Invalid category. Must be "Local" or "International"' 
      });
    }

    // Parse inclusions if it's a string
    let parsedInclusions = [];
    if (inclusions) {
      try {
        parsedInclusions = typeof inclusions === 'string' 
          ? JSON.parse(inclusions) 
          : inclusions;
      } catch (e) {
        parsedInclusions = [inclusions];
      }
    }

    // ADDED: Parse itinerary if it's a string
    let parsedItinerary = [];
    if (itinerary) {
      try {
        parsedItinerary = typeof itinerary === 'string' 
          ? JSON.parse(itinerary) 
          : itinerary;
      } catch (e) {
        console.error('Error parsing itinerary:', e);
        parsedItinerary = [];
      }
    }

    // Parse and validate numbers
    const sPrice = parseFloat(sellerPrice);
    const mkup = parseFloat(markup);

    if (isNaN(sPrice) || isNaN(mkup) || sPrice < 0 || mkup < 0) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Invalid price or markup values' 
      });
    }

    // Calculate total price
    const totalPrice = sPrice + mkup;

    // Create new tour
    const newTour = new Tour({
      title: title.trim(),
      destination: destination.trim(),
      duration: duration.trim(),
      category: category.trim(),
      sellerPrice: sPrice,
      markup: mkup,
      price: totalPrice,
      inclusions: parsedInclusions,
      itinerary: parsedItinerary, // ADDED: itinerary field
      image: req.file.filename,
      isArchive: isArchive || 'No'
    });

    // Save to database
    await newTour.save();
    
    console.log('Tour saved successfully:', newTour);

    res.status(201).json({ 
      status: 'ok', 
      message: 'Tour created successfully',
      data: newTour 
    });

  } catch (error) {
    console.error('Error creating tour:', error);
    
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        status: 'error',
        error: 'Validation failed',
        details: errors
      });
    }

    res.status(500).json({ 
      status: 'error',
      error: error.message || 'Internal server error' 
    });
  }
};

// Get all tours
exports.getAllTours = async (req, res) => {
  try {
    const tours = await Tour.find().sort({ createdAt: -1 });
    
    res.status(200).json({ 
      status: 'ok', 
      count: tours.length,
      data: tours 
    });
  } catch (error) {
    console.error('Error fetching tours:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message || 'Error fetching tours' 
    });
  }
};

// Get single tour by ID
exports.getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id);
    
    if (!tour) {
      return res.status(404).json({ 
        status: 'error',
        error: 'Tour not found' 
      });
    }

    res.status(200).json({ 
      status: 'ok', 
      data: tour 
    });
  } catch (error) {
    console.error('Error fetching tour:', error);
    res.status(500).json({ 
      status: 'error',
      error: error.message || 'Error fetching tour' 
    });
  }
};

// Update tour - IMPROVED VERSION
exports.updateTour = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      destination, 
      duration, 
      category, 
      sellerPrice, 
      markup, 
      inclusions,
      itinerary, // ADDED: itinerary support
      existingImage, // ADDED: for handling existing image
      isArchive
    } = req.body;

    console.log('Update tour request:', { id, body: req.body, file: req.file });

    const existingTour = await Tour.findById(id);
    if (!existingTour) {
      return res.status(404).json({ 
        status: 'error',
        error: 'Tour not found' 
      });
    }

    // Parse inclusions
    let parsedInclusions = existingTour.inclusions;
    if (inclusions) {
      try {
        parsedInclusions = typeof inclusions === 'string' 
          ? JSON.parse(inclusions) 
          : inclusions;
      } catch (e) {
        parsedInclusions = [inclusions];
      }
    }

    // ADDED: Parse itinerary
    let parsedItinerary = existingTour.itinerary || [];
    if (itinerary) {
      try {
        parsedItinerary = typeof itinerary === 'string' 
          ? JSON.parse(itinerary) 
          : itinerary;
      } catch (e) {
        console.error('Error parsing itinerary:', e);
        parsedItinerary = existingTour.itinerary || [];
      }
    }

    const sPrice = parseFloat(sellerPrice) || existingTour.sellerPrice;
    const mkup = parseFloat(markup) || existingTour.markup;
    const totalPrice = sPrice + mkup;

    const updateData = {
      title: title || existingTour.title,
      destination: destination || existingTour.destination,
      duration: duration || existingTour.duration,
      category: category || existingTour.category,
      sellerPrice: sPrice,
      markup: mkup,
      price: totalPrice,
      inclusions: parsedInclusions,
      itinerary: parsedItinerary, // ADDED: itinerary field
      isArchive: isArchive || existingTour.isArchive
    };

    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      const oldImagePath = path.join(__dirname, '..', 'uploads', existingTour.image);
      if (fs.existsSync(oldImagePath)) {
        try {
          fs.unlinkSync(oldImagePath);
          console.log('Old image deleted:', existingTour.image);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
      updateData.image = req.file.filename;
    } else {
      // Keep existing image
      updateData.image = existingImage || existingTour.image;
    }

    const updatedTour = await Tour.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    console.log('Tour updated successfully:', updatedTour);

    res.status(200).json({ 
      status: 'ok', 
      message: 'Tour updated successfully',
      data: updatedTour 
    });

  } catch (error) {
    console.error('Error updating tour:', error);
    
    // Clean up uploaded file if update fails
    if (req.file) {
      const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error cleaning up file:', err);
        }
      }
    }
    
    res.status(500).json({ 
      status: 'error',
      error: error.message || 'Error updating tour' 
    });
  }
};

// Archive tour
exports.archiveTour = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTour = await Tour.findByIdAndUpdate(
      id, 
      { isArchive: 'Yes' }, 
      { new: true }
    );

    if (!updatedTour) {
      return res.status(404).json({ 
        status: 'error', 
        error: 'Tour not found' 
      });
    }

    res.json({ 
      status: 'ok', 
      message: 'Tour archived successfully',
      data: updatedTour 
    });
  } catch (err) {
    console.error('Error archiving tour:', err);
    res.status(500).json({ 
      status: 'error', 
      error: err.message 
    });
  }
};