const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
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
      enum: ['PRESENT', 'ABSENT', 'LATE'],
      default: 'PRESENT',
    },
  },
  {
    timestamps: true,
    autoCreate: false, // Prevent automatic collection creation
    autoIndex: false,  // Prevent automatic index creation
    timeseries: {
      timeField: 'date',
      metaField: 'siteId',
      granularity: 'hours',
    },
  }
);

// Compound index to help with queries (Note: unique: true is not supported on non-meta fields in TS collections)
attendanceSchema.index({ labourId: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
