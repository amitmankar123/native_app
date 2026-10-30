const User = require('../models/User');
const {
  registerUser,
  authenticateUser,
  refreshSessionToken,
  revokeSession,
  revokeAllUserSessions,
  createPasswordResetToken,
  resetPasswordWithToken,
  getPreferencesByUserId,
  updatePreferences: updateUserPreferences,
  getUserSessions,
  revokeSessionById,
} = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    const result = await registerUser({ name, email, password, mobile });
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const deviceInfo = req.headers['user-agent'] || 'Mobile Device';
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const result = await authenticateUser({ email, password, deviceInfo, ipAddress });
    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
      });
    }

    const deviceInfo = req.headers['user-agent'] || 'Mobile Device';
    const ipAddress = req.ip || req.connection.remoteAddress || '127.0.0.1';

    const tokens = await refreshSessionToken({ refreshToken, deviceInfo, ipAddress });
    res.status(200).json({
      success: true,
      message: 'Token rotated and refreshed successfully',
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeSession(refreshToken);
    }
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Session revoked.',
    });
  } catch (error) {
    next(error);
  }
};

const logoutAll = async (req, res, next) => {
  try {
    await revokeAllUserSessions(req.user._id || req.user.id);
    res.status(200).json({
      success: true,
      message: 'All active sessions have been terminated.',
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required',
      });
    }

    const result = await createPasswordResetToken(email);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long',
      });
    }

    const result = await resetPasswordWithToken(token, newPassword);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select('-password_hash');
    const preferences = await getPreferencesByUserId(userId);

    res.status(200).json({
      success: true,
      data: {
        user,
        preferences,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { name, mobile, profile_image, currency, monthly_salary } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (mobile !== undefined) updateFields.mobile = mobile.trim();
    if (profile_image !== undefined) updateFields.profile_image = profile_image;
    if (currency !== undefined) updateFields.currency = currency;
    if (monthly_salary !== undefined) updateFields.monthly_salary = parseInt(monthly_salary, 10);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true }
    ).select('-password_hash');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const preferences = await getPreferencesByUserId(userId);
    res.status(200).json({
      success: true,
      data: preferences,
    });
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const updated = await updateUserPreferences(userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const sessions = await getUserSessions(userId);
    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

const revokeSessionController = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const { sessionId } = req.params;
    const result = await revokeSessionById(userId, sessionId);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  revokeSession: revokeSessionController,
};
