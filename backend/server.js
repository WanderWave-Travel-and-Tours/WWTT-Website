const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

//Models
const AdminModel = require('./models/admin');

mongoose.connect(process.env.MONGODB_URI) 
    .then(() => console.log("✅ DATABASE CONNECTED! Ready to Login."))
    .catch((err) => {
        console.error("❌ Database Connection Error:", err);
        console.error("⚠️  Check your .env file or IP Whitelist.");
    });

// Routes
app.get('/', (req, res) => {
  res.send('WanderWave API is running!');
});

// Routes
const flightRoutes = require('./routes/flightRoute');
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

// Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});