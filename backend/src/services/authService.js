const crypto = require('crypto');
const User = require('../models/User');
const UserPreferences = require('../models/UserPreferences');
const Session = require('../models/Session');
const PasswordReset = require('../models/PasswordReset');
const { hashPassword, verifyPassword } = require('../utils/password');
const {
  signAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_EXPIRY_DAYS,
} = require('../utils/jwt');

/**
 * Register a new user in MongoDB
 */
async function registerUser({ name, email, password, mobile }) {
  const normalizedEmail = email.trim().toLowerCase();

  // Check duplicate
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    const error = new Error('An account with this email already exists');
    error.status = 409;
    throw error;
  }

  const passwordHash = await hashPassword(password);

  // Create user
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    mobile: mobile?.trim() || null,
    password_hash: passwordHash,
    currency: 'INR',
    monthly_salary: 1500000,
  });

  // Initialize default preferences
  const preferences = await UserPreferences.create({
    user: user._id,
  });

  // Generate tokens & session
  const accessToken = signAccessToken({ id: user._id.toString(), email: normalizedEmail, name: name.trim() });
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86400000);

  const session = await Session.create({
    user: user._id,
    token_hash: tokenHash,
    device_info: 'Mobile App',
    ip_address: '127.0.0.1',
    expires_at: expiresAt,
  });

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profile_image: user.profile_image,
      currency: user.currency,
      monthly_salary: user.monthly_salary,
      createdAt: user.createdAt,
    },
    preferences,
    accessToken,
    refreshToken: rawRefreshToken,
    sessionId: session._id.toString(),
  };
}

/**
 * Authenticate existing user
 */
async function authenticateUser({ email, password, deviceInfo = 'Mobile Device', ipAddress = '127.0.0.1' }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    const error = new Error('Invalid email or password');
    error.status = 401;
    throw error;
  }

  const accessToken = signAccessToken({ id: user._id.toString(), email: user.email, name: user.name });
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86400000);

  const session = await Session.create({
    user: user._id,
    token_hash: tokenHash,
    device_info: deviceInfo,
    ip_address: ipAddress,
    expires_at: expiresAt,
  });

  let preferences = await UserPreferences.findOne({ user: user._id });
  if (!preferences) {
    preferences = await UserPreferences.create({ user: user._id });
  }

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      profile_image: user.profile_image,
      currency: user.currency,
      monthly_salary: user.monthly_salary,
      createdAt: user.createdAt,
    },
    preferences,
    accessToken,
    refreshToken: rawRefreshToken,
    sessionId: session._id.toString(),
  };
}

/**
 * Refresh tokens with token rotation and reuse detection
 */
async function refreshSessionToken({ refreshToken, deviceInfo = 'Mobile Device', ipAddress = '127.0.0.1' }) {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.status = 400;
    throw error;
  }

  const incomingHash = hashToken(refreshToken);
  const session = await Session.findOne({ token_hash: incomingHash });

  if (!session) {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }

  // Token reuse detection: If session is already revoked, breach suspected! Revoke all sessions.
  if (session.is_revoked) {
    await Session.updateMany({ user: session.user }, { is_revoked: true });
    const error = new Error('Compromised session detected. All sessions have been revoked. Please log in again.');
    error.status = 403;
    throw error;
  }

  const now = new Date();
  if (new Date(session.expires_at) < now) {
    session.is_revoked = true;
    await session.save();
    const error = new Error('Refresh token expired. Please log in again.');
    error.status = 401;
    throw error;
  }

  const user = await User.findById(session.user);
  if (!user) {
    const error = new Error('User not found');
    error.status = 401;
    throw error;
  }

  // Token Rotation: Invalidate previous token
  session.is_revoked = true;
  session.last_used_at = now;
  await session.save();

  // Generate new tokens
  const newAccessToken = signAccessToken({ id: user._id.toString(), email: user.email, name: user.name });
  const newRefreshToken = generateRefreshToken();
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 86400000);

  const newSession = await Session.create({
    user: user._id,
    token_hash: newTokenHash,
    device_info: deviceInfo,
    ip_address: ipAddress,
    expires_at: expiresAt,
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    sessionId: newSession._id.toString(),
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    },
  };
}

/**
 * Revoke single refresh session
 */
async function revokeSession(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await Session.updateOne({ token_hash: tokenHash }, { is_revoked: true });
}

/**
 * Revoke all sessions for a user
 */
async function revokeAllUserSessions(userId) {
  await Session.updateMany({ user: userId }, { is_revoked: true });
}

/**
 * Request password recovery token
 */
async function createPasswordResetToken(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email, a reset token has been generated.',
    };
  }

  const resetToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Invalidate old tokens
  await PasswordReset.updateMany({ user: user._id }, { is_used: true });

  await PasswordReset.create({
    user: user._id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return {
    success: true,
    message: 'Password reset token generated successfully.',
    resetToken,
  };
}

/**
 * Reset password using token
 */
async function resetPasswordWithToken(token, newPassword) {
  if (!token || !newPassword) {
    const error = new Error('Token and new password are required');
    error.status = 400;
    throw error;
  }

  const tokenHash = hashToken(token.trim());
  const resetRecord = await PasswordReset.findOne({ token_hash: tokenHash, is_used: false });

  if (!resetRecord) {
    const error = new Error('Invalid or already used password reset token');
    error.status = 400;
    throw error;
  }

  if (new Date(resetRecord.expires_at) < new Date()) {
    const error = new Error('Password reset token has expired. Please request a new one.');
    error.status = 400;
    throw error;
  }

  const passwordHash = await hashPassword(newPassword);

  await User.findByIdAndUpdate(resetRecord.user, { password_hash: passwordHash });

  resetRecord.is_used = true;
  await resetRecord.save();

  // Invalidate all active user sessions for security
  await Session.updateMany({ user: resetRecord.user }, { is_revoked: true });

  return { success: true, message: 'Password has been reset successfully. Please log in with your new password.' };
}

/**
 * Get user preferences
 */
async function getPreferencesByUserId(userId) {
  let pref = await UserPreferences.findOne({ user: userId });
  if (!pref) {
    pref = await UserPreferences.create({ user: userId });
  }
  return pref;
}

/**
 * Update user preferences
 */
async function updatePreferences(userId, data) {
  const pref = await UserPreferences.findOneAndUpdate(
    { user: userId },
    { $set: data },
    { new: true, upsert: true }
  );
  return pref;
}

/**
 * Get active sessions for user
 */
async function getUserSessions(userId) {
  return await Session.find({ user: userId }).sort({ last_used_at: -1 });
}

/**
 * Revoke specific session by ID
 */
async function revokeSessionById(userId, sessionId) {
  await Session.findOneAndUpdate({ _id: sessionId, user: userId }, { is_revoked: true });
  return { success: true, message: 'Session revoked successfully' };
}

module.exports = {
  registerUser,
  authenticateUser,
  refreshSessionToken,
  revokeSession,
  revokeAllUserSessions,
  createPasswordResetToken,
  resetPasswordWithToken,
  getPreferencesByUserId,
  updatePreferences,
  getUserSessions,
  revokeSessionById,
};
