const Service = require('../models/service');

// Get all services
const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isActive: true }).sort({ category: 1, name: 1 });
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get services by category
const getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const services = await Service.find({ 
      category: category.toUpperCase(), 
      isActive: true 
    });
    
    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    console.error('Get services by category error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single service
const getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create service (Admin only)
const createService = async (req, res) => {
  try {
    const service = await Service.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update service (Admin only)
const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json({
      success: true,
      message: 'Service updated successfully',
      data: service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete service (Admin only)
const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllServices,
  getServicesByCategory,
  getService,
  createService,
  updateService,
  deleteService
};