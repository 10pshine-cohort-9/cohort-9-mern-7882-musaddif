import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Access tokens are intentionally short-lived; clients renew them via a
// refresh token (see /api/auth/refresh).
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10);

/**
 * Validate the JWT configuration.
 *
 * Fails fast when JWT_SECRET is missing or too weak. Throws a generic error
 * that deliberately never includes the secret value.
 */
export const assertJwtConfig = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || typeof secret !== 'string') {
    throw new Error('JWT_SECRET environment variable is required but was not provided.');
  }
  if (Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes/characters long.');
  }
};

/**
 * Generate a short-lived access JWT for an authenticated user.
 * @param {number|string} userId
 * @param {number} tokenVersion - Current token_version of the user.
 * @returns {string} JWT Token
 */
export const generateToken = (userId, tokenVersion = 0) => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. The server cannot start without it.');
  }
  return jwt.sign({ userId, tokenVersion, type: 'access' }, JWT_SECRET, {
    expiresIn: JWT_ACCESS_EXPIRES_IN,
  });
};

/**
 * Verify a JWT.
 * @param {string} token
 * @returns {object} Decoded payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

/**
 * Generate a cryptographically secure random refresh token.
 * @returns {string} Raw token string (96 hex chars = 48 random bytes)
 */
export const generateRefreshToken = () => {
  return crypto.randomBytes(48).toString('hex');
};

/**
 * Hash a raw refresh token using SHA-256 for secure storage.
 * @param {string} token
 * @returns {string} Hashed token hex
 */
export const hashRefreshToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Generate cryptographically secure random token for password reset
 * @returns {string} Raw token string
 */
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash raw reset token using SHA-256 for secure storage
 * @param {string} token
 * @returns {string} Hashed token hex
 */
export const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const getAccessTokenExpiry = () => JWT_ACCESS_EXPIRES_IN;
export const getRefreshTokenExpiryDays = () => REFRESH_TOKEN_EXPIRES_DAYS;