const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const SALT_ROUNDS = 10;

const AdminSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true 
    },
    // 🔥 ADD FULLNAME FOR ACTIVITY LOGS
    fullName: {
        type: String,
        default: function() {
            return this.username; // Fallback to username if no fullName
        }
    },
    businessName: {
        type: String,
        default: "Wanderwave Travels"
    },
    businessAddress: {
        type: String,
        default: "" 
    },
    businessLogo: {
        type: String,
        default: ""
    },
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password before saving
AdminSchema.pre('save', async function (next) {
    const admin = this;

    if (!admin.isModified('password')) {
        return next();
    }

    try {
        const hash = await bcrypt.hash(admin.password, SALT_ROUNDS);
        admin.password = hash;
        next();
    } catch (err) {
        next(err); 
    }
});

// Compare password method
AdminSchema.methods.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// 🔥 EXPORT AS 'Admin' MODEL (important for populate)
const AdminModel = mongoose.model("Admin", AdminSchema);
module.exports = AdminModel;