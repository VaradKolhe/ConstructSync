const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema(
  {
    labourId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    siteId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
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
