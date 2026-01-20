const Hotel = require('../models/hotel');

// GET ALL HOTELS
exports.getAllHotels = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 100,
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
      .select('-__v')
      .lean();

    const total = await Hotel.countDocuments(filter);

    console.log(`✅ Fetched ${hotels.length} hotels out of ${total} total`);

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: hotels
    });
  } catch (error) {
    console.error('❌ Error fetching hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotels',
      error: error.message
    });
  }
};

// hotelController.js

// GET ALL ARCHIVED HOTELS
exports.getArchivedHotels = async (req, res) => {
    try {
        // Kinukuha lahat ng hotel na may isArchive: "Yes"
        const archivedHotels = await Hotel.find({ isArchive: "Yes" }).sort({ archivedAt: -1 });
        res.status(200).json({
            success: true,
            count: archivedHotels.length,
            data: archivedHotels
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// RESTORE HOTEL FROM ARCHIVE
exports.restoreHotel = async (req, res) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(
            req.params.id,
            { 
                isArchive: "No", 
                isActive: true, // I-activate ulit para lumabas sa main list
                archivedAt: null 
            },
            { new: true }
        );

        if (!hotel) {
            return res.status(404).json({ success: false, message: "Hotel not found" });
        }

        res.status(200).json({
            success: true,
            message: "Hotel restored successfully",
            data: hotel
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET HOTEL BY ID
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).select('-__v').lean();

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    console.log(`✅ Fetched hotel: ${hotel.name}`);

    res.status(200).json({
      success: true,
      data: hotel
    });
  } catch (error) {
    console.error('❌ Error fetching hotel:', error);
    
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

// CREATE HOTEL
exports.createHotel = async (req, res) => {
  try {
    console.log('📝 Creating new hotel...');
    console.log('Request body keys:', Object.keys(req.body));
    console.log('Hotel name:', req.body.name);
    console.log('Hotel location:', req.body.location);
    console.log('Hotel price:', req.body.price);
    console.log('Has mainImage:', !!req.body.mainImage);
    console.log('Images count:', req.body.images?.length || 0);

    if (req.user) {
      req.body.createdBy = req.user.id;
    }

    // Validation
    if (!req.body.name || !req.body.location) {
      return res.status(400).json({
        success: false,
        message: 'Name and location are required'
      });
    }

    const hotel = await Hotel.create(req.body);

    console.log(`✅ Hotel created successfully: ${hotel.name} (ID: ${hotel._id})`);

    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: hotel
    });
  } catch (error) {
    console.error('❌ Error creating hotel:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A hotel with this name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error creating hotel',
      error: error.message
    });
  }
};

// UPDATE HOTEL (FIXED LOGIC)
exports.updateHotel = async (req, res) => {
  try {
    console.log(`📝 Updating hotel ${req.params.id}...`);

    let hotel = await Hotel.findById(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // 1. Simulan ang update object gamit ang req.body
    let updateData = { ...req.body };

    // 2. Ayusin ang Amenities (Dahil flat strings ito galing FormData)
    // Ang FormData ay nagpapadala ng "amenities[wifi]: true". Kailangan natin itong gawing object.
    if (req.body) {
        const amenities = {};
        Object.keys(req.body).forEach(key => {
            if (key.startsWith('amenities[')) {
                const amenityKey = key.match(/amenities\[(.*?)\]/)[1];
                amenities[amenityKey] = req.body[key] === 'true'; // Convert string 'true' to boolean
            }
        });
        // Kung may nahanap na amenities keys, i-assign sa updateData
        if (Object.keys(amenities).length > 0) {
            updateData.amenities = amenities;
        }
    }

    // 3. Handle MAIN IMAGE Update
    // Kung may bagong inupload na mainImage (nasa req.files['mainImage'])
    if (req.files && req.files['mainImage']) {
        const file = req.files['mainImage'][0];
        updateData.mainImage = file.path; // O file.filename depende sa multer config mo
    }

    // 4. Handle GALLERY IMAGES Update (Deletion + Addition)
    
    // Kunin ang current images galing sa database
    let currentImages = hotel.images || [];

    // A. PROSESO SA PAG-DELETE
    if (req.body.deletedImages) {
        const deletedImages = JSON.parse(req.body.deletedImages); // Parse JSON string from frontend
        
        console.log("🗑️ Deleting images:", deletedImages);

        // Filter out images na nasa deleted list
        currentImages = currentImages.filter(img => {
            // Check kung ang image path ay nasa deleted list
            // Note: Minsan ang img ay object (may _id) o string path. Adjust base sa schema.
            const imgPath = typeof img === 'string' ? img : img.url;
            return !deletedImages.includes(imgPath);
        });

        // (Optional) Kung gusto mong burahin din sa physical folder:
        /*
        deletedImages.forEach(imgData => {
            const filePath = path.join(__dirname, '../uploads', imgData); // Adjust path accordingly
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
        */
    }

    // B. PROSESO SA PAG-ADD NG BAGONG GALLERY IMAGES
    if (req.files && req.files['galleryImages']) {
        const newImages = req.files['galleryImages'].map(file => {
            // Return path or object depending on your Schema
            // Kung String lang sa schema: return file.path;
            // Kung Object sa schema: return { url: file.path };
            return file.path; 
        });
        
        console.log("📸 Adding new images:", newImages);
        currentImages = [...currentImages, ...newImages];
    }

    // I-set ang final images list sa updateData
    updateData.images = currentImages;

    // 5. Perform Update
    // Gumamit tayo ng explicit $set para sa ibang fields at images
    hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    console.log(`✅ Hotel updated: ${hotel.name}`);

    res.status(200).json({
      success: true,
      message: 'Hotel updated successfully',
      data: hotel
    });

  } catch (error) {
    console.error('❌ Error updating hotel:', error);

    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error updating hotel',
      error: error.message
    });
  }
};

// DELETE HOTEL (SOFT DELETE)
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

    console.log(`🗑️ Hotel soft-deleted: ${hotel.name}`);

    res.status(200).json({
      success: true,
      message: 'Hotel deleted successfully',
      data: {}
    });
  } catch (error) {
    console.error('❌ Error deleting hotel:', error);

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

// PERMANENT DELETE
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

    console.log(`🗑️ Hotel permanently deleted: ${hotel.name}`);

    res.status(200).json({
      success: true,
      message: 'Hotel permanently deleted',
      data: {}
    });
  } catch (error) {
    console.error('❌ Error permanently deleting hotel:', error);

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

// TOGGLE FEATURED
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

    console.log(`⭐ Hotel ${hotel.featured ? 'featured' : 'unfeatured'}: ${hotel.name}`);

    res.status(200).json({
      success: true,
      message: `Hotel ${hotel.featured ? 'featured' : 'unfeatured'} successfully`,
      data: hotel
    });
  } catch (error) {
    console.error('❌ Error toggling featured status:', error);

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

// GET FEATURED HOTELS
exports.getFeaturedHotels = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const hotels = await Hotel.find({ 
      featured: true, 
      isActive: true 
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(Number(limit))
      .select('-__v')
      .lean();

    console.log(`✅ Fetched ${hotels.length} featured hotels`);

    res.status(200).json({
      success: true,
      count: hotels.length,
      data: hotels
    });
  } catch (error) {
    console.error('❌ Error fetching featured hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured hotels',
      error: error.message
    });
  }
};

// GET HOTELS BY CITY
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
      .select('-__v')
      .lean();

    const total = await Hotel.countDocuments({ 
      $or: [
        { city: new RegExp(city, 'i') },
        { location: new RegExp(city, 'i') }
      ],
      isActive: true 
    });

    console.log(`✅ Fetched ${hotels.length} hotels for city: ${city}`);

    res.status(200).json({
      success: true,
      count: hotels.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: hotels
    });
  } catch (error) {
    console.error('❌ Error fetching hotels by city:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotels by city',
      error: error.message
    });
  }
};

// UPDATE RATING
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

    console.log(`⭐ Rating updated for: ${hotel.name}`);

    res.status(200).json({
      success: true,
      message: 'Rating updated successfully',
      data: hotel
    });
  } catch (error) {
    console.error('❌ Error updating rating:', error);

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

// GET HOTEL STATS
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

    const stats = {
      totalHotels,
      featuredHotels,
      averageRating: avgRating[0]?.avgRating || 0,
      averagePrice: avgPrice[0]?.avgPrice || 0,
      hotelsByCity
    };

    console.log('📊 Hotel stats:', stats);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching hotel stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hotel statistics',
      error: error.message
    });
  }
};

// UPDATE ROOM TYPES
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

    console.log(`🛏️ Room types updated for: ${hotel.name}`);
    
    res.status(200).json({
      success: true,
      message: 'Room types updated successfully',
      data: hotel
    });
  } catch (error) {
    console.error('❌ Error updating room types:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating room types',
      error: error.message
    });
  }
};

// GET ROOM TYPES BY LOCATION
exports.getRoomTypesByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    
    console.log(`🔍 Searching for hotels in location: ${location}`);

    const hotels = await Hotel.find({ 
      $or: [
        { city: new RegExp(location, 'i') },
        { location: new RegExp(location, 'i') }
      ],
      isActive: true 
    }).lean();

    console.log(`✅ Found ${hotels.length} hotels in ${location}`);

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
    
    hotels.sort((a, b) => (a.price || 0) - (b.price || 0));
    
    hotels.forEach(hotel => {
      if (hotel.roomTypes && hotel.roomTypes.length > 0) {
        
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
              images: hotelImages,
              hotelImage: hotel.mainImage || (hotelImages.length > 0 ? hotelImages[0] : null),
              hotelLocation: hotel.location || hotel.city,
              hotelRating: hotel.rating || 0,
              amenities: hotel.amenities || {}
            });
          }
        });
      }
    });

    allRoomTypes.sort((a, b) => a.price - b.price);

    console.log(`✅ Returning ${allRoomTypes.length} unique room types`);

    res.status(200).json({
      success: true,
      location: location,
      count: allRoomTypes.length,
      data: allRoomTypes
    });
  } catch (error) {
    console.error('❌ Error fetching room types by location:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching room types',
      error: error.message
    });
  }
};