const express = require('express');
const { 
  getDashboardKPIs, 
  getSystemAuditLogs,
  getSystemSettings,
  updateSystemSetting
} = require('../controllers/adminController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, authorize('HR', 'ADMIN', 'SUPERVISOR'), getDashboardKPIs);
router.get('/audit-logs', protect, authorize('ADMIN'), getSystemAuditLogs);

// System Settings
router.get('/settings', protect, authorize('ADMIN'), getSystemSettings);
router.put('/settings', protect, authorize('ADMIN'), updateSystemSetting);

module.exports = router;
