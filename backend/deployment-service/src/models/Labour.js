const mongoose = require('mongoose');

// Minimal Labour model for population in Deployment Service
const labourSchema = new mongoose.Schema(
  {
    name: String,
    labourId: String,
    skills: [String],
    isActive: Boolean
  },
  { timestamps: false, collection: 'labours' }
);

module.exports = mongoose.model('Labour', labourSchema);
