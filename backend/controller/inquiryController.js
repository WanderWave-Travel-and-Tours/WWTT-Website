const Inquiry = require('../models/inquiry');
const Service = require('../models/service');

// Create new inquiry
const createInquiry = async (req, res) => {
  try {
    const { 
      serviceId, 
      serviceName, 
      fullName, 
      email, 
      message,
      visaCountry,
      visaId,
      estimatedPrice 
    } = req.body;

    // Validate required fields
    if (!serviceName || !fullName || !email || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Please provide all required fields' 
      });
    }

    // Create inquiry
    const inquiry = await Inquiry.create({
      serviceId: serviceId || null,
      serviceName,
      fullName,
      email,
      message,
      visaCountry: visaCountry || null,
      visaId: visaId || null,
      estimatedPrice: estimatedPrice || 0
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully! We will contact you within 24 hours.',
      data: inquiry
    });

  } catch (error) {
    console.error('Create inquiry error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error. Please try again.' 
    });
  }
};

// Get all inquiries (Admin)
const getAllInquiries = async (req, res) => {
  try {
    const { status, serviceName, page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (serviceName) query.serviceName = new RegExp(serviceName, 'i');

    const inquiries = await Inquiry.find(query)
      .populate('serviceId', 'title description icon')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Inquiry.countDocuments(query);

    res.json({
      success: true,
      data: inquiries,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });

  } catch (error) {
    console.error('Get inquiries error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get single inquiry (Admin)
const getInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id)
      .populate('serviceId', 'title description price')
      .populate('visaId', 'country description price');

    if (!inquiry) {
      return res.status(404).json({ 
        success: false,
        message: 'Inquiry not found' 
      });
    }

    res.json({
      success: true,
      data: inquiry
    });

  } catch (error) {
    console.error('Get inquiry error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Update inquiry status (Admin)
const updateInquiryStatus = async (req, res) => {
  try {
    const { status, adminNotes, contactedBy } = req.body;

    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ 
        success: false,
        message: 'Inquiry not found' 
      });
    }

    const updateData = {
      status,
      adminNotes,
      updatedAt: Date.now()
    };

    if (status === 'CONTACTED' && !inquiry.contactedAt) {
      updateData.contactedAt = Date.now();
      updateData.contactedBy = contactedBy;
    }

    const updatedInquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Inquiry updated successfully',
      data: updatedInquiry
    });

  } catch (error) {
    console.error('Update inquiry error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Delete inquiry (Admin)
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({ 
        success: false,
        message: 'Inquiry not found' 
      });
    }

    res.json({
      success: true,
      message: 'Inquiry deleted successfully'
    });

  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get inquiries by email (for user to check their inquiries)
const getInquiriesByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    
    const inquiries = await Inquiry.find({ email })
      .populate('serviceId', 'title description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: inquiries.length,
      data: inquiries
    });

  } catch (error) {
    console.error('Get inquiries by email error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

// Get inquiry statistics (Admin Dashboard)
const getInquiryStats = async (req, res) => {
  try {
    const totalInquiries = await Inquiry.countDocuments();
    const pendingInquiries = await Inquiry.countDocuments({ status: 'PENDING' });
    const completedInquiries = await Inquiry.countDocuments({ status: 'COMPLETED' });
    
    // Inquiries by service
    const byService = await Inquiry.aggregate([
      {
        $group: {
          _id: '$serviceName',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Inquiries by status
    const byStatus = await Inquiry.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent inquiries (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentInquiries = await Inquiry.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    });

    res.json({
      success: true,
      data: {
        total: totalInquiries,
        pending: pendingInquiries,
        completed: completedInquiries,
        recent: recentInquiries,
        byService,
        byStatus
      }
    });

  } catch (error) {
    console.error('Get inquiry stats error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

module.exports = {
  createInquiry,
  getAllInquiries,
  getInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiriesByEmail,
  getInquiryStats
};