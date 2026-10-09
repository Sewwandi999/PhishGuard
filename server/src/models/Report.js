const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['detection-summary', 'threat-analysis', 'user-activity', 'model-performance'],
    required: true
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  format: {
    type: String,
    enum: ['json', 'pdf', 'csv'],
    default: 'json'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for date range queries
reportSchema.index({ 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
reportSchema.index({ generatedBy: 1 });

module.exports = mongoose.model('Report', reportSchema);