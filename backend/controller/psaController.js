const PSA = require('../models/psa');

const getPSADocuments = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const docs = await PSA.find({ serviceId, isActive: true });
    
    res.json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (error) {
    console.error('Get PSA documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPSADocuments };