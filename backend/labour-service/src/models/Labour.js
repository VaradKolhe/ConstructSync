const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema(
  {
    labourId: {
      type: String,
      required: [true, 'Labour ID is required'],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Labour name is required'],
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
    },
    address: {
      type: String,
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED'],
      default: 'AVAILABLE',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Labour', labourSchema);
