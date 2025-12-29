const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); 
const SALT_ROUNDS = 10;

const AdminSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    // ✅ ADD EMAIL FIELD FOR LOGIN
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
    // ✅ ADD TIMESTAMPS
    lastLogin: {
        type: Date,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
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

const AdminModel = mongoose.model("admins", AdminSchema);
module.exports = AdminModel;