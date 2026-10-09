const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'sms'],
    required: true
  },
  sender: {
    type: String,
    default: 'Unknown'
  },
  result: {
    isPhishing: {
      type: Boolean,
      required: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    }
  },
  features: {
    hasUrl: Boolean,
    hasSuspiciousKeywords: Boolean,
    hasPhoneNumber: Boolean,
    urlCount: Number,
    suspiciousKeywords: [String],
    detectedLanguage: String,
    isCodeMixed: Boolean
  },
  explainability: {
    topFeatures: [{
      feature: String,
      importance: Number,
      impact: String
    }],
    reasoning: String
  },
  processingTime: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
scanSchema.index({ userId: 1, timestamp: -1 });
scanSchema.index({ 'result.isPhishing': 1 });

module.exports = mongoose.model('Scan', scanSchema);