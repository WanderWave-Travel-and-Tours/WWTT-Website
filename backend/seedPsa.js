const mongoose = require('mongoose');
const PSA = require('./psa'); // Adjust path if needed

// MongoDB connection string - UPDATE THIS
const MONGODB_URI = 'mongodb+srv://info_db_user:a16kQ68pv4ipugkw@cluster0.r4onuni.mongodb.net/test?appName=Cluster0';

const psaDocuments = [
  {
    documentType: "Birth Certificate",
    description: "PSA Birth Certificate request and delivery",
    price: "350",
    requirements: [
      {
        title: "Birth Certificate Requirements",
        items: [
          "Valid Government-Issued ID",
          "Full name of the person on the birth certificate",
          "Date of birth",
          "Place of birth (City/Municipality and Province)",
          "Full name of father",
          "Full name of mother (including maiden name)"
        ]
      }
    ],
    downloadForms: [
      {
        label: "PSA Birth Certificate Application Form",
        fileName: "psa-birth-certificate-form.pdf",
        fileUrl: ""
      }
    ],
    stepsProcess: [
      "Submit your request online or walk-in",
      "Provide valid ID and complete details",
      "Pay the processing fee",
      "Wait for 3-5 business days for processing",
      "Receive your PSA Birth Certificate"
    ]
  }
];

async function seedPSA() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing PSA documents
    await PSA.deleteMany({});
    console.log('Cleared existing PSA documents');

    // Insert new documents
    const result = await PSA.insertMany(psaDocuments);
    console.log(`Successfully seeded ${result.length} PSA document`);

    console.log('\nSeeded document:');
    result.forEach(doc => {
      console.log(`- ${doc.documentType} (₱${doc.price})`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error seeding PSA documents:', error);
    process.exit(1);
  }
}

seedPSA();