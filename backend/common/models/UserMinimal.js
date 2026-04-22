const mongoose = global.mongooseInstance || require('mongoose');

const userMinimalSchema = new mongoose.Schema({
  email: String,
  role: String,
  isActive: {
    type: Boolean,
    default: true
  },
  refreshToken: String
}, { collection: 'users' });

// Use existing model if already defined, otherwise create it
module.exports = mongoose.models.User || mongoose.model('User', userMinimalSchema);
