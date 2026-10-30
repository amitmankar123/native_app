/**
 * In-memory sliding window rate limiter
 */
const rateLimitBuckets = new Map();

// Periodic cleanup every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitBuckets.entries()) {
    if (now > record.resetTime) {
      rateLimitBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000).unref();

function rateLimiter({ windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests, please try again later.' } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const key = `${req.baseUrl || req.path}:${ip}`;
    const now = Date.now();

    let record = rateLimitBuckets.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      rateLimitBuckets.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        message,
        retryAfter,
      });
    }

    next();
  };
}

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 30, // 30 login/register attempts per window
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

const apiLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 min
  max: 180, // 180 requests per minute
  message: 'API rate limit exceeded. Please slow down.',
});

module.exports = {
  rateLimiter,
  authLimiter,
  apiLimiter,
};

