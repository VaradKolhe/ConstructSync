const mongoose = require('mongoose');

const referenceDataSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['SKILL_TYPE', 'DEPARTMENT_CODE'],
    },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReferenceData', referenceDataSchema, 'referencedatas');
