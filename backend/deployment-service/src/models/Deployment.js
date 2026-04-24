const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Labour',
      required: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    role: {
      type: String,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    contractEndDate: {
      type: Date,
    },
    redeployReason: {
      type: String,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

// Index to quickly find active deployments for a labourer
deploymentSchema.index({ labourId: 1, status: 1 });

module.exports = mongoose.model('Deployment', deploymentSchema);
