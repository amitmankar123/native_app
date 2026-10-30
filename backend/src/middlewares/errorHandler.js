/**
 * Centralized Error Handling Middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || (res.statusCode !== 200 ? res.statusCode : 500);

  // Avoid logging sensitive tokens or passwords
  const sanitizedBody = { ...req.body };
  if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
  if (sanitizedBody.newPassword) sanitizedBody.newPassword = '[REDACTED]';
  if (sanitizedBody.refreshToken) sanitizedBody.refreshToken = '[REDACTED]';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { errorHandler };
