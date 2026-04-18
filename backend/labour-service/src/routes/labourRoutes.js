const express = require('express');
const {
  createLabour,
  getAllLabours,
  getLabourById,
  updateLabour,
  deleteLabour,
} = require('../controllers/labourController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

// Publicly authenticated (all roles can view)
router.get('/', protect, getAllLabours);
router.get('/:id', protect, getLabourById);

// Restricted (HR and ADMIN only)
router.post('/', protect, authorize('HR', 'ADMIN'), createLabour);
router.put('/:id', protect, authorize('HR', 'ADMIN'), updateLabour);
router.delete('/:id', protect, authorize('ADMIN'), deleteLabour);

module.exports = router;
