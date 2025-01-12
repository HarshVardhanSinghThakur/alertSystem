const mongoose = require('mongoose');

const failedRequestSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    enum: ['Invalid token','Invalid header type', 'Unauthorized access', 'Too many requests',"Internal server error"]
  },
  headers: {
    type: Map,
    of: String
  },
  endpoint: {
    type: String,
    required: true
  },
  alertSent: {
    type: Boolean,
    default: false
  }
});

failedRequestSchema.index({ ip: 1, timestamp: -1 });
module.exports = mongoose.model('FailedRequest', failedRequestSchema);