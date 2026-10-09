import { rateLimit, ipKeyGenerator } from 'express-rate-limit';

const toNumber = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const clientKey = (req) => ipKeyGenerator(req.ip, 56);

/**
 * Build an express-rate-limit middleware with consistent JSON responses.
 *
 * All limiters send `429 Too Many Requests` with the app's standard
 * `{ success: false, message }` envelope. Rate limiting is per-IP (and, for
 * login/register/forgot-password, keyed per email address so one shared IP
 * cannot lock out every user).
 */
export const createRateLimiter = ({ windowMs, limit, message = 'Too many requests, please try again later.', keyGenerator }) => {
  return rateLimit({
    windowMs,
    limit,
    keyGenerator,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message,
      });
    },
  });
};

// Global API limiter — generous so normal authenticated usage is unaffected.
const GLOBAL_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const GLOBAL_LIMIT = toNumber(process.env.RATE_LIMIT_GLOBAL, 300);
const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_STRICT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const normalizedKey = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// Per-IP + per-email key prevents a single NAT/office IP from being blocked
// for everyone while still throttling brute-force attempts per account.
export const authKeyGenerator = (req) => `${clientKey(req)}:${normalizedKey(req.body && req.body.email)}`;

export const apiLimiter = createRateLimiter({
  windowMs: GLOBAL_WINDOW_MS,
  limit: GLOBAL_LIMIT,
  message: 'Too many requests, please try again later.',
});

export const loginLimiter = createRateLimiter({
  windowMs: AUTH_WINDOW_MS,
  limit: toNumber(process.env.RATE_LIMIT_LOGIN, 20),
  keyGenerator: authKeyGenerator,
  message: 'Too many login attempts. Please try again later.',
});

export const registerLimiter = createRateLimiter({
  windowMs: AUTH_STRICT_WINDOW_MS,
  limit: toNumber(process.env.RATE_LIMIT_REGISTER, 10),
  keyGenerator: authKeyGenerator,
  message: 'Too many registration attempts. Please try again later.',
});

export const forgotPasswordLimiter = createRateLimiter({
  windowMs: AUTH_STRICT_WINDOW_MS,
  limit: toNumber(process.env.RATE_LIMIT_FORGOT_PASSWORD, 5),
  keyGenerator: authKeyGenerator,
  message: 'Too many password reset requests. Please try again later.',
});

export const resetPasswordLimiter = createRateLimiter({
  windowMs: AUTH_WINDOW_MS,
  limit: toNumber(process.env.RATE_LIMIT_RESET_PASSWORD, 5),
  message: 'Too many password reset attempts. Please try again later.',
});

export const refreshLimiter = createRateLimiter({
  windowMs: AUTH_WINDOW_MS,
  limit: toNumber(process.env.RATE_LIMIT_REFRESH, 60),
  message: 'Too many session refresh attempts. Please try again later.',
});

// Logout is intentionally unauthenticated (clients must be able to sign out
// even with an expired access token), so a per-IP limiter bounds abuse of the
// revocation endpoint.
export const logoutLimiter = createRateLimiter({
  windowMs: AUTH_WINDOW_MS,
  limit: toNumber(process.env.RATE_LIMIT_LOGOUT, 30),
  message: 'Too many logout attempts. Please try again later.',
});

// The AI grammar endpoint runs an expensive in-process model, so it gets a
// dedicated strict limit keyed per authenticated user.
export const aiLimiter = createRateLimiter({
  windowMs: AUTH_WINDOW_MS,
  limit: toNumber(process.env.RATE_LIMIT_AI, 20),
  keyGenerator: (req) => (req.userId ? String(req.userId) : clientKey(req)),
  message: 'Too many grammar check requests. Please try again later.',
});