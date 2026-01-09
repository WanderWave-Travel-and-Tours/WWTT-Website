const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  inquiryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inquiry',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  // ❌ TANGGALIN ANG filePath - hindi naman ito ginagamit sa controller
  // filePath: {
  //   type: String,
  //   required: true
  // },
  fileSize: {
    type: Number,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  section: {
    type: String,
    default: 'General Documents'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  filePublicId: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('Document', documentSchema);