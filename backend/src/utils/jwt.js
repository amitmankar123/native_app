const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'expense_tracker_jwt_super_secure_secret_2026_key!';
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // 30 days

/**
 * Sign a short-lived access token
 */
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Verify access token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Generate a random cryptographically secure refresh token
 */
function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Hash a token for secure database storage
 */
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY_DAYS,
};
