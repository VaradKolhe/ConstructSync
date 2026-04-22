const mongoose = require('mongoose');

const labourSchema = new mongoose.Schema(
  {
    labourId: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of Birth is required'],
    },
    gender: {
      type: String,
      enum: ['MALE', 'FEMALE', 'OTHER'],
      required: [true, 'Gender is required'],
    },
    phone: {
      type: String,
      required: [true, 'Contact Number is required'],
    },
    emergencyContact: {
      type: String,
      required: [true, 'Emergency Contact is required'],
    },
    address: {
      type: String,
      required: [true, 'Home Address is required'],
    },
    skills: {
      type: [String],
      required: [true, 'At least one skill is required'],
    },
    aadhaarNumber: {
      type: String,
      required: [true, 'Aadhaar/ID Number is required'],
      unique: true,
      trim: true,
    },
    // Optional Fields
    profilePhoto: {
      type: String,
    },
    bankDetails: {
      accountHolder: { type: String, required: [true, 'Account holder name is required'] },
      accountNumber: { type: String, required: [true, 'Bank account number is required'] },
      bankName: { type: String, required: [true, 'Bank identifier is required'] },
      ifscCode: { type: String, required: [true, 'IFSC routing code is required'] },
    },
    employmentHistory: [
      {
        company: String,
        role: String,
        duration: String,
      },
    ],
    // Status and Control
    status: {
      type: String,
      enum: ['AVAILABLE', 'ASSIGNED'],
      default: 'AVAILABLE',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastEditor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    editHistory: [
      {
        editorName: String,
        timestamp: { type: Date, default: Date.now },
        changes: Object,
      },
    ],
  },
  { timestamps: true }
);

// FR-1.2: Generate unique Labour ID (format: LBR-YYYYMMDD-XXXX)
labourSchema.pre('save', async function () {
  if (this.isNew && !this.labourId) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Find the latest labourer created today to increment XXXX
    const count = await mongoose.model('Labour').countDocuments({
      labourId: { $regex: `^LBR-${dateStr}-` }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    this.labourId = `LBR-${dateStr}-${sequence}`;
  }
});

module.exports = mongoose.model('Labour', labourSchema);
