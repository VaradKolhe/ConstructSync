const express = require('express');
const {
  checkIn,
  checkOut,
  getSiteAttendance,
  getLabourHistory,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

// Attendance routes
router.post('/check-in', protect, authorize('SUPERVISOR', 'ADMIN'), checkIn);
router.put('/check-out/:id', protect, authorize('SUPERVISOR', 'ADMIN'), checkOut);
router.get('/site/:siteId', protect, getSiteAttendance);
router.get('/labour/:labourId', protect, getLabourHistory);

module.exports = router;
