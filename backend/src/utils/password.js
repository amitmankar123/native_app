const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string');
  }
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify password using bcrypt
 */
async function verifyPassword(password, storedHash) {
  if (!password || !storedHash) {
    return false;
  }
  return await bcrypt.compare(password, storedHash);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
