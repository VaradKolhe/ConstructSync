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
    timeseries: {
      timeField: 'date',
      metaField: 'siteId',
      granularity: 'hours',
    },
  }
);

// Compound index to prevent duplicate attendance for a worker on the same day
// Note: Unique indexes on time-series collections have specific constraints in MongoDB,
// but for our logic, we'll enforce this in the controller or via a standard index if supported.
attendanceSchema.index({ labourId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
