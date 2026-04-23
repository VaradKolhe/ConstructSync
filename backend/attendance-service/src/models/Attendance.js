const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    metadata: {
      labourId: { type: mongoose.Schema.Types.ObjectId, required: true },
      siteId: { type: mongoose.Schema.Types.ObjectId, required: true },
    },
    supervisorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    checkInTime: {
      type: Date,
      required: true,
    },
    checkOutTime: {
      type: Date,
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'ABSENT', 'HALF-DAY', 'LEAVE'],
      default: 'PRESENT',
    },
    isAnomaly: {
      type: Boolean,
      default: false,
    },
    anomalyReason: {
      type: String,
    },
  },
  {
    timestamps: true,
    timeseries: {
      timeField: 'date',
      metaField: 'metadata',
      granularity: 'hours',
    },
  }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
