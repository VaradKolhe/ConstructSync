const express = require('express');
const {
  createSite,
  assignLabour,
  completeAssignment,
  getAllSites,
  getSiteDeployments,
} = require('../controllers/deploymentController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

// Site management
router.get('/sites', protect, getAllSites);
router.post('/sites', protect, authorize('ADMIN'), createSite);

// Assignment management
router.post('/assign', protect, authorize('SUPERVISOR', 'ADMIN'), assignLabour);
router.put('/complete/:id', protect, authorize('SUPERVISOR', 'ADMIN'), completeAssignment);
router.get('/site/:siteId', protect, getSiteDeployments);

module.exports = router;
