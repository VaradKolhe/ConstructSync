const express = require('express');
const {
  getAttendanceReport,
  getPayrollSummary,
  exportPayrollExcel,
  exportPdfReport,
  getReportLogs,
} = require('../controllers/reportingController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

// JSON Reports
router.get('/attendance', protect, authorize('HR', 'ADMIN'), getAttendanceReport);
router.get('/payroll', protect, authorize('HR', 'ADMIN'), getPayrollSummary);

// Export Reports
router.get('/export/excel', protect, authorize('HR', 'ADMIN'), exportPayrollExcel);
router.get('/export/pdf', protect, authorize('HR', 'ADMIN'), exportPdfReport);

// Logs
router.get('/logs', protect, authorize('ADMIN'), getReportLogs);

module.exports = router;
