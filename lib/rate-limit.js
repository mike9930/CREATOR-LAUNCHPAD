// Simple in-memory rate limiter
const rateLimitMap = new Map();

export function rateLimit({ windowMs = 60000, max = 10 }) {
  return function checkRateLimit(identifier) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing requests for this identifier
    let requests = rateLimitMap.get(identifier) || [];

    // Filter out old requests
    requests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= max) {
      return {
        success: false,
        remaining: 0,
        resetTime: Math.min(...requests) + windowMs,
      };
    }

    // Add new request
    requests.push(now);
    rateLimitMap.set(identifier, requests);

    return {
      success: true,
      remaining: max - requests.length,
      resetTime: now + windowMs,
    };
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, requests] of rateLimitMap.entries()) {
    const filtered = requests.filter(timestamp => timestamp > now - 300000); // 5 min max
    if (filtered.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, filtered);
    }
  }
}, 60000);

// Pre-configured rate limiters
export const votingRateLimiter = rateLimit({ windowMs: 60000, max: 10 }); // 10 per minute
export const loginRateLimiter = rateLimit({ windowMs: 300000, max: 5 }); // 5 per 5 minutes
export const paymentRateLimiter = rateLimit({ windowMs: 60000, max: 5 }); // 5 per minute
