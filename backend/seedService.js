const mongoose = require('mongoose');
const Service = require('./models/service');
const Visa = require('./models/visa');
const PSA = require('./models/psa');
const Passport = require('./models/passport');
require('dotenv').config();

const seedAllServices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Service.deleteMany({});
    await Visa.deleteMany({});
    await PSA.deleteMany({});
    await Passport.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ========== SERVICES (Parent) ==========
    const services = [
      {
        title: "Visa Assistance",
        description: "Expert guidance for tourist and travel visa applications.",
        icon: "Globe",
        image: "https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=600&auto=format&fit=crop&q=60",
        category: "DOCUMENTATION",
        hasSubCollection: true,
        subCollectionName: "visas",
        order: 1
      },
      {
        title: "PSA Documents",
        description: "Hassle-free PSA authenticated documents.",
        icon: "FileCheck",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&auto=format&fit=crop&q=60",
        category: "DOCUMENTATION",
        hasSubCollection: true,
        subCollectionName: "psas",
        order: 2
      },
      {
        title: "Passport Services",
        description: "New application and renewal processing assistance.",
        icon: "BookUser",
        image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=60",
        category: "DOCUMENTATION",
        hasSubCollection: true,
        subCollectionName: "passports",
        order: 3
      },
      {
        title: "Airline Booking",
        description: "Domestic & International flights at the best rates.",
        icon: "Plane",
        image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=600&auto=format&fit=crop&q=60",
        category: "TRAVEL",
        hasSubCollection: false,
        requirements: [
          "Valid ID (Passport for international; any acceptable Gov't ID for domestic).",
          "Target travel dates and cities/airports.",
          "Confirmation/Voucher from the airline (if booking assistance is for existing ticket)."
        ],
        price: 2999.99,
        order: 4
      }
    ];

    const createdServices = await Service.insertMany(services);
    console.log(`✅ ${createdServices.length} services created`);

    // Find service IDs
    const visaService = createdServices.find(s => s.title === "Visa Assistance");
    const psaService = createdServices.find(s => s.title === "PSA Documents");
    const passportService = createdServices.find(s => s.title === "Passport Services");

    // ========== VISA SUB-COLLECTION ==========
    const visas = [
      {
        serviceId: visaService._id,
        country: "JAPAN",
        flagCode: "JP",
        description: "JAPAN VISA ASSISTANCE (IF REQUESTING FOR MULTIPLE-ENTRY)",
        price: 3749.00,
        requirements: [
          {
            title: "Basic Requirements",
            items: [
              "Valid passport (at least 6 months validity)",
              "Duly accomplished visa application form",
              "2x2 white background photo (2 pieces)"
            ]
          }
        ]
      },
      {
        serviceId: visaService._id,
        country: "KOREA",
        flagCode: "KR",
        description: "KOREA VISA ASSISTANCE",
        price: 3500.00,
        requirements: [
          {
            title: "Basic Requirements",
            items: [
              "Valid passport",
              "Application form",
              "Recent photo"
            ]
          }
        ]
      }
    ];

    await Visa.insertMany(visas);
    console.log(`✅ ${visas.length} visas created`);

    // ========== PSA SUB-COLLECTION ==========
    const psaDocs = [
      {
        serviceId: psaService._id,
        documentType: "Birth Certificate",
        description: "PSA Birth Certificate request and delivery",
        price: 350.00,
        processingTime: "3-5 business days",
        requirements: [
          "Requestor's Valid ID (to be presented upon receipt).",
          "Complete Personal Details of Subject (Full name, DoB, Parents' names).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative)."
        ]
      },
      {
        serviceId: psaService._id,
        documentType: "Marriage Certificate",
        description: "PSA Marriage Certificate processing",
        price: 350.00,
        processingTime: "3-5 business days",
        requirements: [
          "Requestor's Valid ID.",
          "Complete Personal Details of Couple (Full names, Date of Marriage, Location).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative)."
        ]
      },
      {
        serviceId: psaService._id,
        documentType: "CENOMAR",
        description: "Certificate of No Marriage Record",
        price: 350.00,
        processingTime: "3-5 business days",
        requirements: [
          "Requestor's Valid ID.",
          "Complete Personal Details of Subject (Full name, Date of Birth, Place of Birth).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative)."
        ]
      }
    ];

    await PSA.insertMany(psaDocs);
    console.log(`✅ ${psaDocs.length} PSA documents created`);

    // ========== PASSPORT SUB-COLLECTION ==========
    const passports = [
      {
        serviceId: passportService._id,
        serviceType: "New Application",
        description: "New passport application assistance",
        price: 2500.00,
        processingTime: "10-15 business days",
        requirements: [
          "Confirmed Online Appointment Slip (DFA).",
          "Personal Appearance (Mandatory).",
          "Original PSA-issued Birth Certificate (on security paper).",
          "One (1) Acceptable Primary ID with 1 photocopy."
        ]
      },
      {
        serviceId: passportService._id,
        serviceType: "Renewal",
        description: "Passport renewal processing",
        price: 2200.00,
        processingTime: "7-10 business days",
        requirements: [
          "Confirmed Online Appointment Slip (DFA).",
          "Personal Appearance (Mandatory).",
          "Old Passport."
        ]
      },
      {
        serviceId: passportService._id,
        serviceType: "Lost/Damaged",
        description: "Lost or damaged passport replacement",
        price: 2800.00,
        processingTime: "15-20 business days",
        requirements: [
          "Confirmed Online Appointment Slip (DFA).",
          "Personal Appearance (Mandatory).",
          "Affidavit of Loss (notarized).",
          "Police Report.",
          "Original PSA-issued Birth Certificate."
        ]
      }
    ];

    await Passport.insertMany(passports);
    console.log(`✅ ${passports.length} passport services created`);

    console.log('\n📊 Summary:');
    console.log(`   Services: ${createdServices.length}`);
    console.log(`   Visas: ${visas.length}`);
    console.log(`   PSA Documents: ${psaDocs.length}`);
    console.log(`   Passport Services: ${passports.length}`);

    process.exit();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedAllServices();