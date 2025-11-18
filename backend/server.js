const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//Models
const AdminModel = require('./models/admin');
const PackageModel = require('./models/package');

mongoose.connect(process.env.MONGODB_URI) 
    .then(() => console.log("✅ DATABASE CONNECTED! Ready to Login."))
    .catch((err) => {
        console.error("❌ Database Connection Error:", err);
        console.error("⚠️  Check your .env file or IP Whitelist.");
    });

app.get('/', (req, res) => {
  res.send('WanderWave API is running!');
});

// Routes
const flightRoutes = require('./routes/flightRoute');
const packageRoutes = require('./routes/packageRoute');
app.use('/api/packages', packageRoutes);
app.use('/api/flights', flightRoutes);

app.get('/', (req, res) => {
  res.send('WanderWave API is running!');
});

app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const admin = await AdminModel.findOne({ username });

        if (admin) {
            if (admin.password === password) {
                res.json({ status: "ok", message: "Login Success!" });
            } else {
                res.status(401).json({ status: "error", message: "Mali ang password" });
            }
        } else {
            res.status(404).json({ status: "error", message: "Walang ganyang admin user" });
        }
    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

app.post('/api/packages/add', upload.single('image'), async (req, res) => {
    try {
        const { title, destination, price, duration, category } = req.body;
        const imageFilename = req.file ? req.file.filename : null;

        const newPackage = new PackageModel({
            title,
            destination,
            price,
            duration,
            category,
            image: imageFilename
        });

        await newPackage.save();
        res.json({ status: "ok", message: "Package added successfully!" });

    } catch (err) {
        res.status(500).json({ status: "error", error: err.message });
    }
});
// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});