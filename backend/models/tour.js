const mongoose = require('mongoose');

const tourSchema = new mongoose.Schema({
  title: { type: String, required: true },
  destination: { type: String, required: true },
  duration: { type: String, required: true },
  category: { type: String, enum: ['Local', 'International'], default: 'Local' },
  sellerPrice: { type: Number, required: true },
  markup: { type: Number, required: true },
  price: { type: Number, required: true }, 
  inclusions: { type: [String], default: [] },
  image: { type: String, required: true },
  // Bagong field na may default na "No"
  isArchive: { type: String, enum: ['Yes', 'No'], default: 'No' }
}, { timestamps: true });

module.exports = mongoose.model('Tour', tourSchema); 