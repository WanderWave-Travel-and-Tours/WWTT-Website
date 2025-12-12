const Passport = require('../models/passport');

const getPassports = async (req, res) => {
  try {
    const passports = await Passport.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: passports });
  } catch (error) {
    console.error('Error fetching passports:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const getPassport = async (req, res) => {
  try {
    const passport = await Passport.findById(req.params.id);
    
    if (!passport) {
      return res.status(404).json({ success: false, message: 'Passport not found' });
    }
    
    res.json({ success: true, data: passport });
  } catch (error) {
    console.error('Error fetching passport:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create new passport requirement
// @route   POST /api/passports
// @access  Private/Admin
const createPassport = async (req, res) => {
  try {
    const {
      serviceName,
      description,
      price,
      icon,
      requirements,
      additionalDocuments,
      stepsProcess,
      processingTypes,
      applicationTypes,
      dfaLocations
    } = req.body;

    const passport = await Passport.create({
      serviceName,
      description,
      price,
      icon,
      requirements,
      additionalDocuments,
      stepsProcess,
      processingTypes,
      applicationTypes,
      dfaLocations
    });

    res.status(201).json({ success: true, data: passport });
  } catch (error) {
    console.error('Error creating passport:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update passport requirement
// @route   PUT /api/passports/:id
// @access  Private/Admin
const updatePassport = async (req, res) => {
  try {
    const {
      serviceName,
      description,
      price,
      icon,
      requirements,
      additionalDocuments,
      stepsProcess,
      processingTypes,
      applicationTypes,
      dfaLocations,
      isActive
    } = req.body;

    const passport = await Passport.findByIdAndUpdate(
      req.params.id,
      {
        serviceName,
        description,
        price,
        icon,
        requirements,
        additionalDocuments,
        stepsProcess,
        processingTypes,
        applicationTypes,
        dfaLocations,
        isActive,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!passport) {
      return res.status(404).json({ success: false, message: 'Passport not found' });
    }

    res.json({ success: true, data: passport });
  } catch (error) {
    console.error('Error updating passport:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete passport requirement
// @route   DELETE /api/passports/:id
// @access  Private/Admin
const deletePassport = async (req, res) => {
  try {
    const passport = await Passport.findByIdAndDelete(req.params.id);

    if (!passport) {
      return res.status(404).json({ success: false, message: 'Passport not found' });
    }

    res.json({ success: true, message: 'Passport deleted successfully' });
  } catch (error) {
    console.error('Error deleting passport:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const initializePassport = async (req, res) => {
  try {
    // Check if passport data already exists
    const existingPassport = await Passport.findOne();
    
    if (existingPassport) {
      return res.json({ 
        success: true, 
        message: 'Passport data already exists', 
        data: existingPassport 
      });
    }

    // Create default passport data with YOUR SPECIFIC REQUIREMENTS
    const defaultPassport = await Passport.create({
      serviceName: 'Passport Appointment',
      description: 'Book your Philippine Passport Appointment',
      price: 1500,
      icon: '🛂',
      // Dito natin ilalagay ang requirements na binigay mo
      requirements: [
        {
          title: 'Passport Requirements',
          items: [
            'Original and photocopy of your PSA Birth Certificate.',
            'If the birth certificate is unclear, a transcribed copy from the Local Civil Registrar or the local copy of the birth certificate may be required.',
            'Valid government-issued ID: Bring an original and a photocopy of at least one valid ID.',
            'For married women: If using your spouse\'s surname, bring the original and a photocopy of your PSA Marriage Certificate.'
          ]
        }
      ],
      // Dito naman ang Additional Documents
      additionalDocuments: [
        {
          title: 'Additional Documents',
          items: [
            'For married women using their maiden name: A PSA Marriage Certificate is not required.',
            'For those born abroad: A Report of Birth from a Philippine embassy or consulate is needed.',
            'For lost or stolen passports: You may need a notarized affidavit of loss and/or a police report.',
            'Other supporting documents: The consular officer may require additional documents to verify your identity and/or citizenship.'
          ]
        }
      ],
      stepsProcess: [
        'Prepare all required documents',
        'Submit inquiry request through WanderWave',
        'Receive appointment schedule confirmation',
        'Pay the processing fee',
        'Attend your scheduled appointment at DFA'
      ],
      processingTypes: [
        {
          type: 'REGULAR',
          price: 1500,
          processingTime: '10-15 working days'
        },
        {
          type: 'EXPEDITE',
          price: 2500,
          processingTime: '5-7 working days'
        }
      ],
      applicationTypes: ['NEW', 'RENEWAL', 'LOST', 'DAMAGED'],
      dfaLocations: [
        { name: 'DFA Aseana', address: 'Aseana Business Park, Parañaque', isActive: true },
        { name: 'DFA Megamall', address: 'SM Megamall, Mandaluyong', isActive: true },
        { name: 'DFA Robinsons Galleria', address: 'Robinsons Galleria, Quezon City', isActive: true },
        { name: 'DFA Manila', address: 'Portunondo St., Manila', isActive: true }
      ]
    });

    res.status(201).json({ 
      success: true, 
      message: 'Default passport data initialized with correct requirements', 
      data: defaultPassport 
    });
  } catch (error) {
    console.error('Error initializing passport:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  getPassports,
  getPassport,
  createPassport,
  updatePassport,
  deletePassport,
  initializePassport
};