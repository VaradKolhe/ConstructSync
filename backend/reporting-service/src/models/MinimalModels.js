const mongoose = global.mongooseInstance || require('mongoose');

// Attendance Model
const Attendance = mongoose.model('Attendance', new mongoose.Schema({
  metadata: {
    labourId: mongoose.Schema.Types.ObjectId,
    siteId: mongoose.Schema.Types.ObjectId,
  },
  date: Date,
  status: String,
  totalHours: Number,
  checkInTime: Date,
  checkOutTime: Date
}), 'attendances');

// Labour Model
const Labour = mongoose.model('Labour', new mongoose.Schema({
  name: String,
  labourId: String,
  skills: [String],
  monthlySalary: Number,
  isActive: Boolean
}), 'labours');

// Site Model
const Site = mongoose.model('Site', new mongoose.Schema({
  name: String,
  location: String,
  supervisorId: mongoose.Schema.Types.ObjectId,
  status: String
}), 'sites');

// Labour Group Model
const LabourGroup = mongoose.model('LabourGroup', new mongoose.Schema({
  name: String,
  members: [mongoose.Schema.Types.ObjectId]
}), 'labourgroups');

// User Model (for dashboard logins)
const User = mongoose.model('User', new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  lastLogin: Date,
  isActive: Boolean,
  refreshToken: String
}), 'users');

// System Audit Log Model
const SystemAuditLog = mongoose.model('SystemAuditLog', new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  action: String,
  module: String,
  details: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  timestamp: { type: Date, default: Date.now }
}), 'system_audit_logs');

// Deployment Model
const Deployment = mongoose.model('Deployment', new mongoose.Schema({
  labourId: mongoose.Schema.Types.ObjectId,
  siteId: mongoose.Schema.Types.ObjectId,
  status: String,
  startDate: Date,
  endDate: Date
}), 'deployments');

// System Setting Model
const SystemSetting = mongoose.model('SystemSetting', new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: mongoose.Schema.Types.Mixed,
  description: String,
  updatedBy: mongoose.Schema.Types.ObjectId,
  lastUpdated: { type: Date, default: Date.now }
}), 'system_settings');

module.exports = { Attendance, Labour, Site, LabourGroup, User, SystemAuditLog, Deployment, SystemSetting };
