const express = require('express');
const {
  checkIn,
  bulkCheckIn,
  checkOut,
  bulkCheckOut,
  editAttendance,
  getSiteAttendance,
  getLabourHistory,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

// Attendance routes
router.post('/check-in', protect, authorize('SUPERVISOR', 'ADMIN', 'HR'), checkIn);
router.post('/bulk-check-in', protect, authorize('SUPERVISOR', 'ADMIN', 'HR'), bulkCheckIn);
router.put('/check-out/:id', protect, authorize('SUPERVISOR', 'ADMIN', 'HR'), checkOut);
router.put('/bulk-check-out', protect, authorize('SUPERVISOR', 'ADMIN', 'HR'), bulkCheckOut);
router.put('/:id', protect, authorize('SUPERVISOR', 'ADMIN', 'HR'), editAttendance);
router.get('/site/:siteId', protect, getSiteAttendance);
router.get('/labour/:labourId', protect, getLabourHistory);

module.exports = router;
