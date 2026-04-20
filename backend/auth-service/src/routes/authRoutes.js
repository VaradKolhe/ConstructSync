const express = require('express');
const {
  register,
  login,
  logout,
  refresh,
  getProfile,
  requestEmailOTP,
  verifyEmail,
  completeOnboarding
} = require('../controllers/authController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

router.post('/register', protect, authorize('ADMIN'), register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.get('/profile', protect, getProfile);

// Onboarding Flow
router.post('/request-otp', protect, requestEmailOTP);
router.post('/verify-email', protect, verifyEmail);
router.post('/complete-onboarding', protect, completeOnboarding);

module.exports = router;
