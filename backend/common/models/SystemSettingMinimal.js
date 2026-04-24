const mongoose = global.mongooseInstance || require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  value: mongoose.Schema.Types.Mixed,
  lastUpdated: { type: Date, default: Date.now }
}, { collection: 'system_settings' });

module.exports = mongoose.models.SystemSetting || mongoose.model('SystemSetting', systemSettingSchema);
