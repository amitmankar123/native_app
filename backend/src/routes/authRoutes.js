const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  getPreferences,
  updatePreferences,
  getSessions,
  revokeSession,
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimiter');

// Public routes with rate limiting
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

// Protected routes
router.post('/logout', logout);
router.post('/logout-all', protect, logoutAll);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/preferences', protect, getPreferences);
router.put('/preferences', protect, updatePreferences);
router.get('/sessions', protect, getSessions);
router.delete('/sessions/:sessionId', protect, revokeSession);

module.exports = router;
