const mongoose = require('mongoose');
const Service = require('./models/service');
const Visa = require('./models/visa');
require('dotenv').config();

const seedAllServices = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Service.deleteMany({});
    await Visa.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // ========== SERVICES ==========
    const services = [
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
        order: 1
      },
      {
        title: "Hotel Booking",
        description: "Affordable stays and luxury accommodations worldwide.",
        icon: "Hotel",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&auto=format&fit=crop&q=60",
        category: "TRAVEL",
        hasSubCollection: false,
        requirements: [
          "Valid ID of the primary guest (Passport or other Gov't ID).",
          "Booking Confirmation/Voucher (if assistance is for an existing reservation)."
        ],
        price: 3499.99,
        order: 2
      },
      {
        title: "Tour Arrangements",
        description: "Complete tour packages for solo or group travelers.",
        icon: "Map",
        image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=60",
        category: "TRAVEL",
        hasSubCollection: false,
        requirements: [
          "Valid ID (often a copy of Passport for international tours).",
          "Signed Booking Form or Agreement.",
          "Confirmed Travel Dates/Itinerary."
        ],
        price: 5999.99,
        order: 3
      },
      {
        title: "Ferry Booking",
        description: "Convenient sea travel ticket reservations.",
        icon: "Ship",
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=60",
        category: "TRAVEL",
        hasSubCollection: false,
        requirements: [
          "Valid ID of the passenger(s).",
          "Booking Confirmation (if assistance is for an existing reservation)."
        ],
        price: 1999.99,
        order: 4
      },
      {
        title: "Passport Assist",
        description: "New application and renewal processing assistance.",
        icon: "BookUser",
        image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=60",
        category: "DOCUMENTATION",
        hasSubCollection: false,
        requirements: [
          "Confirmed Online Appointment Slip (DFA).",
          "Personal Appearance (Mandatory).",
          "Original PSA-issued Birth Certificate (on security paper).",
          "One (1) Acceptable Primary ID with 1 photocopy.",
          "PSA-issued Marriage Certificate (Original & photocopy) if married female using spouse's surname."
        ],
        price: 2500.00,
        order: 5
      },
      {
        title: "PSA Birth Cert",
        description: "Hassle-free request for PSA authenticated documents.",
        icon: "Baby",
        image: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=60",
        category: "DOCUMENTATION",
        hasSubCollection: false,
        requirements: [
          "Requestor's Valid ID (to be presented upon receipt).",
          "Complete Personal Details of Subject (Full name, DoB, Parents' names).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative)."
        ],
        price: 350.00,
        order: 6
      },
      {
        title: "Marriage Cert",
        description: "PSA Marriage Certificate processing support.",
        icon: "HeartHandshake",
        image: "https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&auto=format&fit=crop&q=60",
        category: "DOCUMENTATION",
        hasSubCollection: false,
        requirements: [
          "Requestor's Valid ID.",
          "Complete Personal Details of Couple (Full names, Date of Marriage, Location).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative)."
        ],
        price: 350.00,
        order: 7
      },
      {
        title: "CENOMAR",
        description: "Certificate of No Marriage (CENOMAR) requests.",
        icon: "FileCheck",
        image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&auto=format&fit=crop&q=60",
        category: "DOCUMENTATION",
        hasSubCollection: false,
        requirements: [
          "Requestor's Valid ID.",
          "Complete Personal Details of Subject (Full name, Date of Birth, Place of Birth).",
          "Authorization Letter and Valid IDs of both parties (if requested by a representative)."
        ],
        price: 350.00,
        order: 8
      },
      {
        title: "Visa Assistance",
        description: "Expert guidance for tourist and travel visa applications.",
        icon: "Globe",
        image: "https://images.unsplash.com/photo-1473163928189-364b2c4e1135?w=600&auto=format&fit=crop&q=60",
        category: "DOCUMENTATION",
        hasSubCollection: true,
        subCollectionName: "visas",
        requirements: [
          "Valid Passport (usually 6 months validity beyond travel date).",
          "Duly Accomplished Visa Application Form.",
          "Passport-size Photo(s) (specifications vary by embassy).",
          "Proof of Financial Capacity (Bank Certificate/Statement, ITR).",
          "Proof of Travel (Flight/Hotel Reservations, Itinerary).",
          "Proof of Strong Ties to Home Country (Employment/Business/School docs)."
        ],
        price: 4999.99,
        order: 9
      },
      {
        title: "Travel Insurance",
        description: "Comprehensive coverage for safe and worry-free trips.",
        icon: "ShieldCheck",
        image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&auto=format&fit=crop&q=60",
        category: "FINANCIAL",
        hasSubCollection: false,
        requirements: [
          "Valid ID or Passport.",
          "Confirmed Travel Dates/Itinerary."
        ],
        price: 1500.00,
        order: 10
      },
      {
        title: "Bills Payment",
        description: "One-stop shop for paying your utilities and bills.",
        icon: "Receipt",
        image: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=600&auto=format&fit=crop&q=60",
        category: "FINANCIAL",
        hasSubCollection: false,
        requirements: [
          "Actual Billing Statement or Account Details.",
          "Exact Payment Amount."
        ],
        price: 50.00,
        order: 11
      }
    ];

    const createdServices = await Service.insertMany(services);
    console.log(`✅ ${createdServices.length} services created`);

    // Find Visa Assistance service
    const visaService = createdServices.find(s => s.title === "Visa Assistance");

    // ========== VISA SUB-COLLECTION (only for Visa Assistance) ==========
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
              "2x2 white background photo (2 pieces)",
              "Proof of financial capacity",
              "Certificate of Employment or Business Registration",
              "Bank Certificate and Bank Statement (last 6 months)",
              "ITR (Income Tax Return)",
              "Confirmed flight booking",
              "Hotel reservation or sponsor's documents"
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
              "Application form with photo",
              "Certificate of Employment",
              "Bank Certificate",
              "ITR (Income Tax Return)",
              "Confirmed flight and hotel booking"
            ]
          }
        ]
      },
      {
        serviceId: visaService._id,
        country: "AUSTRALIA",
        flagCode: "AU",
        description: "AUSTRALIA VISA ASSISTANCE",
        price: 4200.00,
        requirements: [
          {
            title: "Basic Requirements",
            items: [
              "Valid passport",
              "Online application form",
              "Recent passport photo",
              "Financial documents",
              "Employment proof",
              "Travel itinerary"
            ]
          }
        ]
      }
    ];

    await Visa.insertMany(visas);
    console.log(`✅ ${visas.length} visas created`);

    console.log('\n📊 Summary:');
    console.log(`   Total Services: ${createdServices.length}`);
    console.log(`   - PSA Birth Cert: SEPARATE SERVICE`);
    console.log(`   - Marriage Cert: SEPARATE SERVICE`);
    console.log(`   - CENOMAR: SEPARATE SERVICE`);
    console.log(`   - Visa Assistance: HAS SUB-COLLECTION (${visas.length} visas)`);

    process.exit();
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedAllServices();