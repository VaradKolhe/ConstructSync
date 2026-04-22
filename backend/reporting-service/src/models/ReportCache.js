const mongoose = require('mongoose');

const reportCacheSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: true,
      unique: true,
    },
    reportType: {
      type: String,
      required: true,
    },
    format: {
      type: String,
      required: true,
      enum: ['PDF', 'EXCEL'],
    },
    fileBuffer: {
      type: Buffer,
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 86400, // 24 hours in seconds
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReportCache', reportCacheSchema);
