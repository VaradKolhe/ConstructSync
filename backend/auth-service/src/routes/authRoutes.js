const express = require('express');
const {
  register,
  login,
  logout,
  refresh,
  getProfile,
  requestEmailOTP,
  verifyEmail,
  completeOnboarding,
  getAllUsers,
  updateUser,
  updateProfile,
  forgotPassword,
  resetPassword,
  killSession
} = require('../controllers/authController');
const { protect, authorize } = require('../../../common/middleware/authMiddleware');

const router = express.Router();

router.post('/register', protect, authorize('ADMIN'), register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.post('/refresh', refresh);
router.get('/profile', protect, getProfile);
router.put('/update-profile', protect, updateProfile);

// Password Recovery
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resettoken', resetPassword);

// Admin User Management
router.get('/users', protect, authorize('ADMIN'), getAllUsers);
router.put('/users/:id', protect, authorize('ADMIN'), updateUser);
router.post('/users/:id/kill-session', protect, authorize('ADMIN'), killSession);

// Onboarding Flow
router.post('/request-otp', protect, requestEmailOTP);
router.post('/verify-email', protect, verifyEmail);
router.post('/complete-onboarding', protect, completeOnboarding);

module.exports = router;
