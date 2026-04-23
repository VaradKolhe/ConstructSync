const express = require('express');
const {
  createSite,
  updateSite,
  deleteSite,
  assignLabour,
  redeployLabour,
  createGroup,
  getAllGroups,
  assignGroup,
  completeAssignment,
  getAllSites,
  getSiteDeployments,
  getAlerts,
  getLabourDeployment,
} = require('../controllers/deploymentController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

// Site management
router.get('/sites', protect, getAllSites);
router.post('/sites', protect, authorize('ADMIN'), createSite);
router.put('/sites/:id', protect, authorize('ADMIN'), updateSite);
router.delete('/sites/:id', protect, authorize('ADMIN'), deleteSite);

// Assignment management
router.get('/labour/:labourId', protect, getLabourDeployment);
router.post('/assign', protect, authorize('HR', 'ADMIN', 'SUPERVISOR'), assignLabour);
router.post('/redeploy', protect, authorize('HR', 'ADMIN'), redeployLabour);
router.put('/complete/:id', protect, authorize('HR', 'ADMIN', 'SUPERVISOR'), completeAssignment);
router.get('/site/:siteId', protect, getSiteDeployments);
router.get('/alerts', protect, authorize('HR', 'ADMIN'), getAlerts);

// Group management
router.get('/groups', protect, getAllGroups);
router.post('/groups', protect, authorize('HR', 'ADMIN'), createGroup);
router.post('/groups/assign', protect, authorize('HR', 'ADMIN'), assignGroup);

module.exports = router;
