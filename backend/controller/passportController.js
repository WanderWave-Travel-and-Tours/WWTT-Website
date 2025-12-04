const Passport = require('../models/passport');

const getPassportServices = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const services = await Passport.find({ serviceId, isActive: true });
    
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Get passport services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getPassportServices };