const mongoose = require('mongoose');

const datasetSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  label: {
    type: String,
    enum: ['legitimate', 'phishing'],
    required: true
  },
  language: {
    type: String,
    enum: ['english', 'sinhala', 'code-mixed'],
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms'],
    required: true
  },
  source: {
    type: String,
    default: 'manual'
  },
  features: {
    hasUrl: Boolean,
    hasSuspiciousKeywords: Boolean,
    hasPhoneNumber: Boolean,
    urlCount: Number,
    keywords: [String]
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  usedInTraining: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for filtering
datasetSchema.index({ label: 1, language: 1 });
datasetSchema.index({ addedBy: 1 });

module.exports = mongoose.model('Dataset', datasetSchema);