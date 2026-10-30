const { verifyAccessToken } = require('../utils/jwt');
const User = require('../models/User');

/**
 * JWT Authentication Middleware for MongoDB
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No access token provided',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password_hash');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired. Please refresh session.',
      });
    }

    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Not authorized: Invalid access token',
    });
  }
};

module.exports = { protect };
