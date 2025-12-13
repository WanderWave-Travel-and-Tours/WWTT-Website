const Hotel = require('../models/hotel');

exports.getAllHotels = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      city,
      location,
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

    const filter = { isActive: true };

    if (city) {
      filter.$or = [
        { city: new RegExp(city, 'i') },
        { location: new RegExp(city, 'i') }
      ];
    }

    if (location) {
      if (!filter.$or) {
        filter.$or = [];
      }
      filter.$or.push(
        { location: new RegExp(location, 'i') },
        { city: new RegExp(location, 'i') }
      );
    }

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

    if (amenities) {
      const amenitiesList = amenities.split(',');
      amenitiesList.forEach(amenity => {
        filter[`amenities.${amenity}`] = true;
      });
    }

    if (search) {
      filter.$text = { $search: search };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const skip = (page - 1) * limit;
    const hotels = await Hotel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

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

exports.createHotel = async (req, res) => {
  try {
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

exports.updateHotel = async (req, res) => {
  try {
    let hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

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

exports.deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

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

exports.getHotelsByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const { limit = 10, page = 1 } = req.query;

    const skip = (page - 1) * limit;

    const hotels = await Hotel.find({ 
      $or: [
        { city: new RegExp(city, 'i') },
        { location: new RegExp(city, 'i') }
      ],
      isActive: true 
    })
      .sort({ rating: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('-__v');

    const total = await Hotel.countDocuments({ 
      $or: [
        { city: new RegExp(city, 'i') },
        { location: new RegExp(city, 'i') }
      ],
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

exports.updateRoomTypes = async (req, res) => {
  try {
    const { roomTypes } = req.body;
    
    const hotel = await Hotel.findById(req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    hotel.roomTypes = roomTypes;
    await hotel.save();
    
    res.status(200).json({
      success: true,
      message: 'Room types updated successfully',
      data: hotel
    });
  } catch (error) {
    console.error('Error updating room types:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating room types',
      error: error.message
    });
  }
};

// --- UPDATED FUNCTION ---
exports.getRoomTypesByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    
    const hotels = await Hotel.find({ 
      $or: [
        { city: new RegExp(location, 'i') },
        { location: new RegExp(location, 'i') }
      ],
      isActive: true 
    });

    if (!hotels || hotels.length === 0) {
      return res.status(200).json({
        success: true,
        location: location,
        count: 0,
        data: []
      });
    }

    const allRoomTypes = [];
    const seenTypes = new Set();
    
    // Sort hotels by price ascending
    hotels.sort((a, b) => a.price - b.price);
    
    hotels.forEach(hotel => {
      if (hotel.roomTypes && hotel.roomTypes.length > 0) {
        
        // Extract images from DB
        const hotelImages = hotel.images && hotel.images.length > 0 
          ? hotel.images.map(img => img.url) 
          : [];

        if (hotel.mainImage && !hotelImages.includes(hotel.mainImage)) {
            hotelImages.unshift(hotel.mainImage);
        }

        hotel.roomTypes.forEach(room => {
          const typeKey = room.type.toUpperCase();
          
          if (!seenTypes.has(typeKey)) {
            seenTypes.add(typeKey);
            allRoomTypes.push({
              type: room.type,
              capacity: room.capacity,
              price: room.price,
              available: room.available,
              description: room.description,
              hotelName: hotel.name, 
              hotelId: hotel._id,
              // Pass images array
              images: hotelImages, 
              hotelImage: hotel.mainImage || (hotelImages.length > 0 ? hotelImages[0] : null),
              
              // --- NEW DB FIELDS PASSED TO FRONTEND ---
              hotelLocation: hotel.location || hotel.city, // Pass precise location
              hotelRating: hotel.rating || 0,              // Pass rating
              amenities: hotel.amenities                   // Pass amenities object
            });
          }
        });
      }
    });

    allRoomTypes.sort((a, b) => a.price - b.price);

    res.status(200).json({
      success: true,
      location: location,
      count: allRoomTypes.length,
      data: allRoomTypes
    });
  } catch (error) {
    console.error('Error fetching room types by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room types',
      error: error.message
    });
  }
};