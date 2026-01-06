const express = require('express');
const router = express.Router();
const SellerRate = require('../models/sellerRate');

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
// GET ALL RATES
// ============================================
router.get('/', async (req, res) => {
  try {
    const { destination, activity, supplier, status } = req.query;
    
    let filter = {};
    
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

    res.json(rates);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ message: 'Error fetching rates', error: error.message });
  }
});

// ============================================
// GET SINGLE RATE BY ID
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const rate = await SellerRate.findById(req.params.id);
    
    if (!rate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    res.json(rate);
  } catch (error) {
    console.error('Error fetching rate:', error);
    res.status(500).json({ message: 'Error fetching rate', error: error.message });
  }
});

// ============================================
// CREATE NEW RATE
// ============================================
router.post('/', async (req, res) => {
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
      status: status || 'active'
    });

    const savedRate = await newRate.save();
    res.status(201).json(savedRate);
  } catch (error) {
    console.error('Error creating rate:', error);
    res.status(400).json({ message: 'Error creating rate', error: error.message });
  }
});

// ============================================
// BULK UPLOAD RATES - FIXED NaN HANDLING
// ============================================
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

    const updatedRate = await SellerRate.findByIdAndUpdate(
      req.params.id,
      {
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
        status,
        lastUpdated: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!updatedRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    res.json(updatedRate);
  } catch (error) {
    console.error('Error updating rate:', error);
    res.status(400).json({ message: 'Error updating rate', error: error.message });
  }
});

// ============================================
// DELETE RATE
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const deletedRate = await SellerRate.findByIdAndDelete(req.params.id);

    if (!deletedRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    res.json({ message: 'Rate deleted successfully', rate: deletedRate });
  } catch (error) {
    console.error('Error deleting rate:', error);
    res.status(500).json({ message: 'Error deleting rate', error: error.message });
  }
});

// ============================================
// ARCHIVE RATE (Soft Delete)
// ============================================
router.patch('/:id/archive', async (req, res) => {
  try {
    const archivedRate = await SellerRate.findByIdAndUpdate(
      req.params.id,
      { status: 'archived', lastUpdated: Date.now() },
      { new: true }
    );

    if (!archivedRate) {
      return res.status(404).json({ message: 'Rate not found' });
    }

    res.json({ message: 'Rate archived successfully', rate: archivedRate });
  } catch (error) {
    console.error('Error archiving rate:', error);
    res.status(500).json({ message: 'Error archiving rate', error: error.message });
  }
});

// ============================================
// GET STATISTICS
// ============================================
router.get('/stats/summary', async (req, res) => {
  try {
    const totalRates = await SellerRate.countDocuments({ status: 'active' });
    
    const avgMarkup = await SellerRate.aggregate([
      { $match: { status: 'active', markupType: 'percentage' } },
      { $group: { _id: null, avgMarkup: { $avg: '$markup' } } }
    ]);

    const destinations = await SellerRate.distinct('destination', { status: 'active' });
    
    const topActivities = await SellerRate.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$activity', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      totalRates,
      avgMarkup: avgMarkup.length > 0 ? avgMarkup[0].avgMarkup : 0,
      totalDestinations: destinations.length,
      topActivities
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;