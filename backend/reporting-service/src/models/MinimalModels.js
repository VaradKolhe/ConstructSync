const mongoose = require('mongoose');

// Attendance Model
const Attendance = mongoose.model('Attendance', new mongoose.Schema({
  labourId: mongoose.Schema.Types.ObjectId,
  siteId: mongoose.Schema.Types.ObjectId,
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
  skillType: String,
  isActive: Boolean
}), 'labours');

// Site Model
const Site = mongoose.model('Site', new mongoose.Schema({
  name: String,
  location: String
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
  isActive: Boolean
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

module.exports = { Attendance, Labour, Site, LabourGroup, User, SystemAuditLog, Deployment };
