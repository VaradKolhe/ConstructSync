const mongoose = require('mongoose');

const attendanceAuditSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Attendance',
      required: true,
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    modifiedAt: {
      type: Date,
      default: Date.now,
    },
    changes: {
      previous: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
      updated: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
      },
    },
    action: {
      type: String,
      enum: ['EDIT', 'CHECK_OUT'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AttendanceAudit', attendanceAuditSchema);
