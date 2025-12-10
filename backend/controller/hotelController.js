const Hotel = require('../models/hotel');

// @desc    Get all hotels
// @route   GET /api/hotels
// @access  Public
exports.getAllHotels = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      country,
      minPrice,
      maxPrice,
      minRating,
      amenities,
      featured,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (city) filter.city = new RegExp(city, 'i');
    if (country) filter.country = new RegExp(country, 'i');
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    if (featured !== undefined) {
      filter.featured = featured === 'true';
    }

    // Handle amenities filter
    if (amenities) {
      const amenitiesList = amenities.split(',');
      amenitiesList.forEach(amenity => {
        filter[`amenities.${amenity}`] = true;
      });
    }

    // Handle search
    if (search) {
      filter.$text = { $search: search };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const hotels = await Hotel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    // Get total count for pagination
    const total = await Hotel.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: hotels
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotels',
      error: error.message
    });
  }
};

// @desc    Get single hotel by ID
// @route   GET /api/hotels/:id
// @access  Public
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).select('-__v');

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error fetching hotel',
      error: error.message
    });
  }
};

// @desc    Create new hotel
// @route   POST /api/hotels
// @access  Private/Admin
exports.createHotel = async (req, res) => {
  try {
    // Add createdBy from authenticated user if available
    if (req.user) {
      req.body.createdBy = req.user.id;
    }

    const hotel = await Hotel.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: hotel
    });
  } catch (error) {
    console.error('Error creating hotel:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating hotel',
      error: error.message
    });
  }
};

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
exports.updateHotel = async (req, res) => {
  try {
    let hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Update hotel
    hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Hotel updated successfully',
      data: hotel
    });
  } catch (error) {
    console.error('Error updating hotel:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating hotel',
      error: error.message
    });
  }
};

// @desc    Delete hotel (soft delete)
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Soft delete - set isActive to false
    hotel.isActive = false;
    await hotel.save();

    res.status(200).json({
      success: true,
      message: 'Hotel deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('Error deleting hotel:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error deleting hotel',
      error: error.message
    });
  }
};

// @desc    Permanently delete hotel
// @route   DELETE /api/hotels/:id/permanent
// @access  Private/Admin
exports.permanentDeleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    await hotel.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Hotel permanently deleted',
      data: {}
    });
  } catch (error) {
    console.error('Error permanently deleting hotel:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error permanently deleting hotel',
      error: error.message
    });
  }
};

// @desc    Toggle hotel featured status
// @route   PATCH /api/hotels/:id/featured
// @access  Private/Admin
exports.toggleFeatured = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    hotel.featured = !hotel.featured;
    await hotel.save();

    res.status(200).json({
      success: true,
      message: `Hotel ${hotel.featured ? 'featured' : 'unfeatured'} successfully`,
      data: hotel
    });
  } catch (error) {
    console.error('Error toggling featured status:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error toggling featured status',
      error: error.message
    });
  }
};

// @desc    Get featured hotels
// @route   GET /api/hotels/featured
// @access  Public
exports.getFeaturedHotels = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const hotels = await Hotel.find({ 
      featured: true, 
      isActive: true 
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(Number(limit))
      .select('-__v');

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });
  } catch (error) {
    console.error('Error fetching featured hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured hotels',
      error: error.message
    });
  }
};

// @desc    Get hotels by city
// @route   GET /api/hotels/city/:city
// @access  Public
exports.getHotelsByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const hotels = await Hotel.find({ 
      city: new RegExp(city, 'i'),
      isActive: true 
    })
      .sort({ rating: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const total = await Hotel.countDocuments({ 
      city: new RegExp(city, 'i'),
      isActive: true 
    });

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: hotels
    });
  } catch (error) {
    console.error('Error fetching hotels by city:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotels by city',
      error: error.message
    });
  }
};

// @desc    Update hotel rating
// @route   PATCH /api/hotels/:id/rating
// @access  Private
exports.updateRating = async (req, res) => {
  try {
    const { rating } = req.body;

    if (!rating || rating < 0 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 0 and 5'
      });
    }

    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // Calculate new average rating
    const totalRatings = hotel.rating * hotel.totalReviews;
    hotel.totalReviews += 1;
    hotel.rating = (totalRatings + rating) / hotel.totalReviews;

    await hotel.save();

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: hotel
    });
  } catch (error) {
    console.error('Error updating rating:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating rating',
      error: error.message
    });
  }
};

// @desc    Get hotel statistics
// @route   GET /api/hotels/stats
// @access  Private/Admin
exports.getHotelStats = async (req, res) => {
  try {
    const totalHotels = await Hotel.countDocuments({ isActive: true });
    const featuredHotels = await Hotel.countDocuments({ featured: true, isActive: true });
    
    const avgRating = await Hotel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    const avgPrice = await Hotel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);

    const hotelsByCity = await Hotel.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalHotels,
        featuredHotels,
        averageRating: avgRating[0]?.avgRating || 0,
        averagePrice: avgPrice[0]?.avgPrice || 0,
        hotelsByCity
      }
    });
  } catch (error) {
    console.error('Error fetching hotel stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotel statistics',
      error: error.message
    });
  }
};