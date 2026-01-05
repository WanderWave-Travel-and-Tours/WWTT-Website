const mongoose = require('mongoose');
const AdminModel = require('./models/admin'); // Adjust path to your admin model

// Your MongoDB connection string
const MONGODB_URI = "mongodb+srv://info_db_user:a16kQ68pv4ipugkw@cluster0.r4onuni.mongodb.net/test?appName=Cluster0";

async function createMainAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('✅ Connected to MongoDB');

    // Check if main admin already exists
    const existingMainAdmin = await AdminModel.findOne({ 
      email: 'info@wanderwavetravelandtours.com' 
    });

    if (existingMainAdmin) {
      console.log('⚠️  Main admin already exists!');
      console.log('📧 Email:', existingMainAdmin.email);
      console.log('👤 Username:', existingMainAdmin.username);
      
      // Ask if you want to update password (you can uncomment this)
      /*
      const newPassword = 'YourNewPassword123'; // Change this
      existingMainAdmin.password = newPassword;
      await existingMainAdmin.save();
      console.log('✅ Main admin password updated!');
      */
      
      await mongoose.connection.close();
      return;
    }

    // Create main admin
    const mainAdmin = new AdminModel({
      email: 'info@wanderwavetravelandtours.com',
      username: 'MainAdmin',
      password: 'WanderWave2025!', // ⚠️ CHANGE THIS PASSWORD!
      businessName: 'Wanderwave Travels',
      businessAddress: '',
      businessLogo: '',
      isActive: true
    });

    await mainAdmin.save();

    console.log('✅ Main admin created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:', mainAdmin.email);
    console.log('👤 Username:', mainAdmin.username);
    console.log('🔑 Password: Admin123!');
    console.log('═══════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Change this password after first login!');

    // Close connection
    await mongoose.connection.close();
    console.log('👋 Connection closed');

  } catch (error) {
    console.error('❌ Error creating main admin:', error);
    process.exit(1);
  }
}

// Run the function
createMainAdmin();