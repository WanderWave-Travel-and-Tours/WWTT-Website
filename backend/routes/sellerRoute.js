// routes/sellerRoute.js
const express = require('express');
const router = express.Router();
const SellerRate = require('../models/sellerRate');

// 🎯 IMPORT ACTIVITY LOGGER
const { 
    logCreate,
    logUpdate,
    logDelete,
    logActivity,
    getIpAddress, 
    getUserAgent 
} = require('../utils/activityLogger');

// ============================================
// HELPER: Safe parseFloat (prevents NaN)
// ============================================
const safeParseFloat = (value, defaultValue = 0) => {
  if (value === null || value === undefined || value === '' || value === 'NaN') {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
};

// ============================================
// GET ALL RATES (Filtered for isArchive)
// ============================================
router.get('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const { destination, activity, supplier, status } = req.query;
    
    let filter = {
      isArchive: { $ne: 'Yes' }
    };
    
    if (destination) {
      filter.destination = { $regex: destination, $options: 'i' };
    }
    if (activity) {
      filter.activity = { $regex: activity, $options: 'i' };
    }
    if (supplier) {
      filter.supplierName = { $regex: supplier, $options: 'i' };
    }
    if (status) {
      filter.status = status;
    }

    const rates = await SellerRate.find(filter)
      .sort({ dateAdded: -1 });

    // 🎯 LOG FETCH
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin', // Adjust as needed
      severity: 'INFO',
      description: `Fetched active seller rates (count: ${rates.length})`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        duration: `${Date.now() - startTime}ms`,
        query: req.query
      }
    });

    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to fetch rates: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ message: 'Error fetching rates', error: error.message });
  }
});

// ============================================
// GET ARCHIVED RATES (isArchive = "Yes")
// ============================================
router.get('/archived', async (req, res) => {
  const startTime = Date.now();
  try {
    const archivedRates = await SellerRate.find({ isArchive: 'Yes' })
      .sort({ lastUpdated: -1 });

    // 🎯 LOG FETCH
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'INFO',
      description: `Fetched archived seller rates (count: ${archivedRates.length})`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.json({
      success: true,
      count: archivedRates.length,
      rates: archivedRates
    });
  } catch (error) {
    console.error('Error fetching archived rates:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to fetch archived rates: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ 
      success: false,
      message: 'Error fetching archived rates', 
      error: error.message 
    });
  }
});

// ============================================
// GET ALL RATES INCLUDING ARCHIVED
// ============================================
router.get('/all-with-archived', async (req, res) => {
  const startTime = Date.now();
  try {
    const rates = await SellerRate.find({})
      .sort({ lastUpdated: -1 });

    // 🎯 LOG FETCH
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'INFO',
      description: `Fetched all seller rates including archived (count: ${rates.length})`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.json({
      success: true,
      count: rates.length,
      rates: rates
    });
  } catch (error) {
    console.error('Error fetching all rates:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to fetch all rates: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ 
      success: false,
      message: 'Error fetching all rates', 
      error: error.message 
    });
  }
});

// ============================================
// GET SINGLE RATE BY ID
// ============================================
router.get('/:id', async (req, res) => {
  const startTime = Date.now();
  try {
    const rate = await SellerRate.findById(req.params.id);
    
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    // 🎯 LOG FETCH
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'INFO',
      description: `Fetched single rate: ${rate.activity}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        duration: `${Date.now() - startTime}ms`,
        recordId: req.params.id
      }
    });

    res.json(rate);
  } catch (error) {
    console.error('Error fetching rate:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to fetch rate: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ message: 'Error fetching rate', error: error.message });
  }
});

// ============================================
// CREATE NEW RATE
// ============================================
router.post('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const {
      destination,
      activity,
      supplierName,
      supplierRate,
      markup,
      markupType,
      pax,
      inclusions,
      notes,
      status
    } = req.body;

    const safeSupplierRate = safeParseFloat(supplierRate, 0);
    const safeMarkup = safeParseFloat(markup, 0);

    let sellingPrice;
    if (markupType === 'percentage') {
      sellingPrice = safeSupplierRate + (safeSupplierRate * safeMarkup / 100);
    } else {
      sellingPrice = safeSupplierRate + safeMarkup;
    }

    const newRate = new SellerRate({
      destination,
      activity,
      supplierName,
      supplierRate: safeSupplierRate,
      markup: safeMarkup,
      markupType,
      sellingPrice,
      pax,
      inclusions,
      notes,
      status: status || 'active',
      isArchive: 'No'
    });

    const savedRate = await newRate.save();

    // 🎯 LOG CREATION
    await logCreate(req, 'Seller Rates', `${savedRate.activity} (${savedRate.destination})`);

    console.log('✅ Seller rate created successfully:', savedRate.activity);

    res.status(201).json(savedRate);
  } catch (error) {
    console.error('❌ Seller rate creation error:', error);

    // 🎯 LOG CREATION ERROR
    await logActivity({
      action: 'CREATE',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to create seller rate: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ message: 'Error creating rate', error: error.message });
  }
});

router.post('/bulk', async (req, res) => {
  try {
    const rates = req.body;

    if (!Array.isArray(rates) || rates.length === 0) {
      return res.status(400).json({ message: 'Invalid data format. Expected array of rates.' });
    }

    console.log(`📊 Receiving ${rates.length} rates for bulk upload`);

    // Validate and prepare rates with STRICT NaN checks
    const validRates = [];
    const invalidRates = [];

    rates.forEach((rate, index) => {
      try {
        // CRITICAL: Safe parsing with NaN protection
        const supplierRate = safeParseFloat(rate.supplierRate, 0);
        const markup = safeParseFloat(rate.markup, 0);
        
        // Validation: Must have valid rate > 0
        if (supplierRate === 0) {
          invalidRates.push({ index: index + 1, reason: 'Invalid supplier rate' });
          return;
        }

        // Calculate selling price
        let sellingPrice = safeParseFloat(rate.sellingPrice, 0);
        if (sellingPrice === 0) {
          if (rate.markupType === 'percentage') {
            sellingPrice = supplierRate + (supplierRate * markup / 100);
          } else {
            sellingPrice = supplierRate + markup;
          }
        }

        validRates.push({
          destination: rate.destination || 'Unspecified',
          activity: rate.activity || 'Unspecified',
          supplierName: rate.supplierName || 'Unspecified',
          supplierRate: supplierRate,
          markup: markup,
          markupType: rate.markupType || 'percentage',
          sellingPrice: sellingPrice,
          pax: rate.pax || '',
          inclusions: rate.inclusions || '',
          notes: rate.notes || '',
          status: rate.status || 'active',
          dateAdded: new Date()
        });
      } catch (error) {
        console.error(`Error processing rate ${index + 1}:`, error);
        invalidRates.push({ index: index + 1, reason: error.message });
      }
    });

    if (validRates.length === 0) {
      return res.status(400).json({ 
        message: 'No valid rates to upload', 
        invalidCount: invalidRates.length,
        invalidRates: invalidRates.slice(0, 10) // Show first 10 errors
      });
    }

    console.log(`✅ Valid rates: ${validRates.length}, Invalid: ${invalidRates.length}`);

    const insertedRates = await SellerRate.insertMany(validRates);
    
    res.status(201).json({
      message: `Successfully uploaded ${insertedRates.length} rates`,
      count: insertedRates.length,
      skipped: invalidRates.length,
      rates: insertedRates
    });
  } catch (error) {
    console.error('Error bulk uploading rates:', error);
    res.status(400).json({ message: 'Error uploading rates', error: error.message });
  }
});

// ============================================
// UPDATE RATE
// ============================================
router.put('/:id', async (req, res) => {
  const startTime = Date.now();
  try {
    const rate = await SellerRate.findById(req.params.id);
    
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    const updates = req.body;
    const safeSupplierRate = safeParseFloat(updates.supplierRate || rate.supplierRate, 0);
    const safeMarkup = safeParseFloat(updates.markup || rate.markup, 0);
    const currentMarkupType = updates.markupType || rate.markupType;

    let sellingPrice;
    if (currentMarkupType === 'percentage') {
      sellingPrice = safeSupplierRate + (safeSupplierRate * safeMarkup / 100);
    } else {
      sellingPrice = safeSupplierRate + safeMarkup;
    }

    const updateData = {
      ...updates,
      supplierRate: safeSupplierRate,
      markup: safeMarkup,
      sellingPrice,
      lastUpdated: Date.now()
    };

    const updatedRate = await SellerRate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    // 🎯 LOG UPDATE
    await logUpdate(req, 'Seller Rates', `${rate.activity} (${rate.destination})`, updates);

    console.log('✅ Seller rate updated:', updatedRate.activity);

    res.json(updatedRate);
  } catch (error) {
    console.error('Error updating rate:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'UPDATE',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to update rate: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 400,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(400).json({ message: 'Error updating rate', error: error.message });
  }
});

// ============================================
// DELETE RATE
// ============================================
router.delete('/:id', async (req, res) => {
  const startTime = Date.now();
  try {
    const deletedRate = await SellerRate.findByIdAndDelete(req.params.id);

    if (!deletedRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    // 🎯 LOG DELETE
    await logDelete(req, 'Seller Rates', `${deletedRate.activity} (${deletedRate.destination})`);

    console.log('✅ Seller rate deleted:', deletedRate.activity);

    res.json({ message: 'Rate deleted successfully', rate: deletedRate });
  } catch (error) {
    console.error('Error deleting rate:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'DELETE',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to delete rate: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ message: 'Error deleting rate', error: error.message });
  }
});

// ============================================
// ARCHIVE RATE (Set isArchive = "Yes")
// ============================================
router.patch('/:id/archive', async (req, res) => {
  const startTime = Date.now();
  try {
    const archivedRate = await SellerRate.findByIdAndUpdate(
      req.params.id,
      { 
        isArchive: 'Yes',
        status: 'archived', 
        lastUpdated: Date.now() 
      },
      { new: true }
    );

    if (!archivedRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    // 🎯 LOG ARCHIVE
    await logActivity({
      action: 'ARCHIVE',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'WARNING',
      description: `Seller rate archived: ${archivedRate.activity} (${archivedRate.destination})`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        duration: `${Date.now() - startTime}ms`,
        recordId: req.params.id,
        changes: {
          isArchive: { from: 'No', to: 'Yes' },
          status: { from: archivedRate.status, to: 'archived' }
        }
      }
    });

    res.json({ 
      success: true,
      message: 'Rate archived successfully', 
      rate: archivedRate 
    });
  } catch (error) {
    console.error('Error archiving rate:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'ARCHIVE',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to archive rate: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ 
      success: false,
      message: 'Error archiving rate', 
      error: error.message 
    });
  }
});

// ============================================
// RESTORE RATE (Set isArchive = "No")
// ============================================
router.patch('/:id/restore', async (req, res) => {
  const startTime = Date.now();
  try {
    const restoredRate = await SellerRate.findByIdAndUpdate(
      req.params.id,
      { 
        isArchive: 'No',
        status: 'active', 
        lastUpdated: Date.now() 
      },
      { new: true }
    );

    if (!restoredRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    // 🎯 LOG RESTORE
    await logActivity({
      action: 'RESTORE',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'SUCCESS',
      description: `Seller rate restored: ${restoredRate.activity} (${restoredRate.destination})`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        duration: `${Date.now() - startTime}ms`,
        recordId: req.params.id,
        changes: {
          isArchive: { from: 'Yes', to: 'No' },
          status: { from: restoredRate.status, to: 'active' }
        }
      }
    });

    res.json({ 
      success: true,
      message: 'Rate restored successfully', 
      rate: restoredRate 
    });
  } catch (error) {
    console.error('Error restoring rate:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'RESTORE',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to restore rate: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ 
      success: false,
      message: 'Error restoring rate', 
      error: error.message 
    });
  }
});

// ============================================
// GET STATISTICS
// ============================================
router.get('/stats/summary', async (req, res) => {
  const startTime = Date.now();
  try {
    const statsFilter = { status: 'active', isArchive: { $ne: 'Yes' } };

    const totalRates = await SellerRate.countDocuments(statsFilter);
    
    const avgMarkup = await SellerRate.aggregate([
      { $match: { ...statsFilter, markupType: 'percentage' } },
      { $group: { _id: null, avgMarkup: { $avg: '$markup' } } }
    ]);

    const destinations = await SellerRate.distinct('destination', statsFilter);
    
    const topActivities = await SellerRate.aggregate([
      { $match: statsFilter },
      { $group: { _id: '$activity', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // 🎯 LOG STATS FETCH
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'INFO',
      description: `Fetched seller rates statistics`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 200,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.json({
      totalRates,
      avgMarkup: avgMarkup.length > 0 ? avgMarkup[0].avgMarkup : 0,
      totalDestinations: destinations.length,
      topActivities
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    
    // 🎯 LOG ERROR
    await logActivity({
      action: 'READ',
      module: 'Seller Rates',
      user: 'Admin',
      severity: 'ERROR',
      description: `Failed to fetch statistics: ${error.message}`,
      ipAddress: getIpAddress(req),
      userAgent: getUserAgent(req),
      details: {
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: 500,
        duration: `${Date.now() - startTime}ms`
      }
    });

    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;