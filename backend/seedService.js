const mongoose = require('mongoose');
const Service = require('./models/service');
require('dotenv').config();

const services = [
  // LOCAL SERVICES
  {
    name: 'El Nido Tour',
    category: 'LOCAL',
    description: 'Experience the breathtaking beauty of El Nido with island hopping tours',
    icon: 'beach',
    featured: true
  },
  
  // INTERNATIONAL SERVICES
  {
    name: 'Airline Booking',
    category: 'INTERNATIONAL',
    description: 'Book international and domestic flights at competitive prices',
    icon: 'flight'
  },
  {
    name: 'Hotel Booking',
    category: 'INTERNATIONAL',
    description: 'Reserve hotels and accommodations worldwide',
    icon: 'hotel'
  },
  {
    name: 'Tour Arrangements',
    category: 'INTERNATIONAL',
    description: 'Customized international tour packages',
    icon: 'tour'
  },
  {
    name: 'Ferry Booking',
    category: 'INTERNATIONAL',
    description: 'Book ferry tickets for island destinations',
    icon: 'ferry'
  },
  
  // DOCUMENTATION
  {
    name: 'Passport Processing',
    category: 'DOCUMENTATION',
    description: 'Assistance with passport application and renewal',
    icon: 'passport'
  },
  {
    name: 'PSA Birth Certificate',
    category: 'DOCUMENTATION',
    description: 'PSA birth certificate request and delivery',
    icon: 'certificate'
  },
  {
    name: 'Marriage Certificate Processing',
    category: 'DOCUMENTATION',
    description: 'Marriage certificate application and authentication',
    icon: 'marriage'
  },
  {
    name: 'CENOMAR Request',
    category: 'DOCUMENTATION',
    description: 'Certificate of No Marriage Record processing',
    icon: 'document'
  },
  {
    name: 'Visa Assistance',
    category: 'DOCUMENTATION',
    description: 'Visa application support for various countries',
    icon: 'visa',
    featured: true
  },
  
  // OTHERS
  {
    name: 'Travel Insurance',
    category: 'OTHERS',
    description: 'Comprehensive travel insurance coverage',
    icon: 'insurance'
  },
  {
    name: 'Bills Payment',
    category: 'OTHERS',
    description: 'Pay utility bills and other services',
    icon: 'payment'
  }
];

const seedServices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing services
    await Service.deleteMany({});
    console.log('Cleared existing services');
    
    // Insert new services
    await Service.insertMany(services);
    console.log('Services seeded successfully');
    
    process.exit();
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedServices();