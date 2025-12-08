const mongoose = require('mongoose');

const psaSchema = new mongoose.Schema({
  documentType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: String,
    required: true
  },
  requirements: [
    {
      title: { type: String, required: true },
      items: [{ type: String }]
    }
  ],
  downloadForms: [
    {
      label: { type: String, required: true },
      fileName: { type: String },
      fileUrl: { type: String }
    }
  ],
  stepsProcess: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('PSA', psaSchema);