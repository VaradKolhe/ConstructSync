const express = require('express');
const {
  createReferenceData,
  getAllReferenceData,
  updateReferenceData,
  deleteReferenceData,
} = require('../controllers/referenceDataController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

router.get('/', protect, getAllReferenceData);
router.post('/', protect, authorize('ADMIN'), createReferenceData);
router.put('/:id', protect, authorize('ADMIN'), updateReferenceData);
router.delete('/:id', protect, authorize('ADMIN'), deleteReferenceData);

module.exports = router;
