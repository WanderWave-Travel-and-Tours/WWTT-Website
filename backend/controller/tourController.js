const Tour = require('../models/tour');
const ActivityLog = require('../models/ActivityLog'); // IMPORT ACTIVITY LOG MODEL

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
      itinerary,
      tourType,     
      minPax,       
      isArchive,
      userEmail,
      adminId
    } = req.body;

    // Validate required fields
    if (!title || !destination || !duration || !category || !sellerPrice || !markup) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Missing required fields' 
      });
    }

    if (tourType === 'joiners' && (!minPax || parseInt(minPax) < 1)) {
      return res.status(400).json({ 
        status: 'error',
        error: 'Minimum pax is required for joiner tours' 
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

    // Parse itinerary if it's a string
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
    const tourData = {
      title: title.trim(),
      destination: destination.trim(),
      duration: duration.trim(),
      category: category.trim(),
      sellerPrice: sPrice,
      markup: mkup,
      price: totalPrice,
      inclusions: parsedInclusions,
      itinerary: parsedItinerary,
      image: req.file.path, // ✅ Cloudinary returns full URL in path
      tourType: tourType || 'private', 
      isArchive: isArchive || 'No'
    };

    if (tourType === 'joiners' && minPax) {
      tourData.minPax = parseInt(minPax);
    }

    const newTour = new Tour(tourData);
    await newTour.save();
    
    try {
      let logUserId = null;
      if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
          logUserId = adminId;
      }

      await ActivityLog.create({
          action: 'CREATE',
          module: 'Tours', 
          user: userEmail || 'System Admin',
          userId: logUserId,
          severity: 'SUCCESS',
          description: `Created a new tour: ${title}`,
          details: {
              recordTitle: title,
              recordId: newTour._id,
              method: 'POST',
              endpoint: '/api/tours/add'
          }
      });
      console.log('✅ Activity Log recorded for New Tour');
    } catch (logError) {
      console.error('❌ Error logging activity:', logError);
    }

    console.log('Tour saved successfully:', newTour);

    res.status(201).json({ 
      status: 'ok', 
      message: 'Tour created successfully',
      data: newTour 
    });

  } catch (error) {
    console.error('Error creating tour:', error);
    
    // ✅ No need to delete files - Cloudinary handles storage

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

// Update tour
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
      itinerary,
      existingImage,
      isArchive,
      // Added for Logging
      userEmail,
      adminId,
      changes
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

    // Parse itinerary
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
      itinerary: parsedItinerary,
      isArchive: isArchive || existingTour.isArchive
    };

    // Handle image update
    // Handle image update
    if (req.file) {
      // ✅ Cloudinary handles old image cleanup automatically
      updateData.image = req.file.path; // Cloudinary returns full URL in path
    } else {
      // Keep existing image
      updateData.image = existingImage || existingTour.image;
    }

    const updatedTour = await Tour.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    // =========================================================
    // INSERT ACTIVITY LOG HERE (AFTER UPDATING)
    // =========================================================
    try {
      // Format the description based on tracked changes
      let logDescription = `Updated tour: ${updatedTour.title}`;
      
      if (changes) {
          // Frontend sends changes as a JSON string via FormData
          try {
              const parsedChanges = JSON.parse(changes);
              if (Array.isArray(parsedChanges) && parsedChanges.length > 0) {
                  logDescription += `. Changes: ${parsedChanges.join(', ')}`;
              }
          } catch (e) {
              // Fallback if parsing fails
              logDescription += ` details updated.`;
          }
      }

      // Sanitize ID
      let logUserId = null;
      if (adminId && adminId !== 'null' && adminId !== 'undefined' && adminId !== '') {
          logUserId = adminId;
      }

      await ActivityLog.create({
          action: 'UPDATE',
          module: 'Tours',
          entity: 'Tour',
          entityId: updatedTour._id,
          user: userEmail || 'Unknown User',
          userId: logUserId,
          description: logDescription,
          severity: 'SUCCESS',
          details: {
            recordTitle: updatedTour.title,
            recordId: updatedTour._id,
            method: 'PUT',
            endpoint: `/api/tours/update/${id}`
          }
      });
      console.log('✅ Activity Log recorded for Update Tour');

    } catch (logError) {
      console.error('❌ Failed to save activity log for tour update:', logError);
    }
    // =========================================================

    console.log('Tour updated successfully:', updatedTour);

    res.status(200).json({ 
      status: 'ok', 
      message: 'Tour updated successfully',
      data: updatedTour 
    });

  } catch (error) {
    console.error('Error updating tour:', error);
    
    // ✅ No need to clean up files - Cloudinary handles storage
    
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