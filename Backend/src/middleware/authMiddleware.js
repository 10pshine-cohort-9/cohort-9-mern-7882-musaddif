import { verifyToken } from '../utils/token.js';
import { getAccessCookieName } from '../utils/authCookies.js';
import pool from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Prefer the Authorization header (mobile/API clients); fall back to the
  // httpOnly access cookie set for browser clients so tokens never need to be
  // exposed to JavaScript.
  const token =
    (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
    req.cookies?.[getAccessCookieName()] ||
    null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
    if (!decoded || decoded.type !== 'access' || decoded.userId === undefined || decoded.userId === null) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload.',
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }

  try {
    // Verify the user still exists and that their token version is current so
    // that revoked sessions (e.g. after password reset/logout) fail immediately.
    const result = await pool.query(
      'SELECT id, token_version FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0 || result.rows[0].token_version !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token.',
      });
    }

    req.userId = decoded.userId;
    return next();
  } catch (error) {
    return next(error);
  }
};