const express = require('express');
const { getDashboardKPIs, getSystemAuditLogs } = require('../controllers/adminController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', protect, authorize('HR', 'ADMIN'), getDashboardKPIs);
router.get('/audit-logs', protect, authorize('ADMIN'), getSystemAuditLogs);

module.exports = router;
