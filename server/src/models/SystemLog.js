const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_login',
      'user_logout',
      'user_register',
      'scan_performed',
      'dataset_added',
      'dataset_deleted',
      'report_generated',
      'user_created',
      'user_updated',
      'user_deleted',
      'system_error'
    ]
  },
  details: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  status: {
    type: String,
    enum: ['success', 'failure', 'warning'],
    default: 'success'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient log queries
systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ userId: 1, timestamp: -1 });
systemLogSchema.index({ action: 1 });

// Auto-delete old logs after 90 days (optional)
systemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('SystemLog', systemLogSchema);