const mongoose = require('mongoose');

// ✅ Sub-schema for destination tips
const TipSchema = new mongoose.Schema({
    text: { type: String, required: true }
}, { _id: false });

const DestinationSchema = new mongoose.Schema({

    // ─── Core Identity ───────────────────────────────────────────────
    // The canonical destination name — must be unique (case-insensitive enforced via index).
    // Used to match against packages.destination via case-insensitive lookup.
    name: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },

    // Country or region (e.g. "Philippines", "Japan")
    country: { 
        type: String, 
        default: '' 
    },

    // ─── Email Personalization Fields ─────────────────────────────────
    // These fields are sent in the webhook payload to GHL to power
    // the personalized "while you're traveling" email template.

    // Short greeting injected into the hero subtext of the email.
    // e.g. "Enjoy the crystal-clear waters and limestone cliffs"
    destinationGreeting: { 
        type: String, 
        default: '' 
    },

    // Up to 5 destination-specific travel tips shown inside the info card.
    // Stored as an array so the route can map them to tip1…tip5 for the webhook payload.
    tips: {
        type: [TipSchema],
        validate: {
            validator: (arr) => arr.length <= 5,
            message: 'A destination can have at most 5 tips.'
        },
        default: []
    },

    // Local emergency number for this destination.
    // e.g. "911 (Philippines)", "110 (Japan)"
    emergencyNumber: { 
        type: String, 
        default: '911 (Philippines)' 
    },

    // ─── Destination Type ─────────────────────────────────────────────
    // true  = International destination (outside Philippines)
    // false = Local destination (within Philippines)
    isInternational: {
        type: Boolean,
        default: false
    },

    // ─── Archive Fields ───────────────────────────────────────────────
    isArchive: { 
        type: String, 
        enum: ['Yes', 'No'], 
        default: 'No' 
    },
    archivedAt: { 
        type: Date, 
        default: null 
    }

}, { timestamps: true });

// ✅ Case-insensitive unique index on name
DestinationSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

// ✅ INSTANCE METHOD: Returns the webhook-ready payload object.
// Call this whenever you need to forward destination data to GHL.
//
// Output shape:
// {
//   destination:          "Palawan",
//   destination_greeting: "Enjoy the crystal-clear waters...",
//   destination_tip1:     "...",
//   destination_tip2:     "...",   ← only present if tips[1] exists
//   ...
//   emergency_number:     "911 (Philippines)"
// }
DestinationSchema.methods.toWebhookPayload = function () {
    const payload = {
        destination:          this.name,
        destination_greeting: this.destinationGreeting,
        emergency_number:     this.emergencyNumber,
    };

    // Map array tips → tip1, tip2 … tip5
    for (let i = 0; i < this.tips.length; i++) {
        payload[`destination_tip${i + 1}`] = this.tips[i].text;
    }

    // Fill remaining tip slots with empty string so GHL template doesn't break
    for (let i = this.tips.length; i < 5; i++) {
        payload[`destination_tip${i + 1}`] = '';
    }

    return payload;
};

const DestinationModel = mongoose.model('destinations', DestinationSchema);
module.exports = DestinationModel;