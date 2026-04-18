const express = require('express');
const { getAttendanceReport, getPayrollSummary } = require('../controllers/reportingController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

// Only HR and ADMIN should have access to full reports
router.get('/attendance', protect, authorize('HR', 'ADMIN'), getAttendanceReport);
router.get('/payroll', protect, authorize('HR', 'ADMIN'), getPayrollSummary);

module.exports = router;
