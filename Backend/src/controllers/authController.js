import bcrypt from 'bcrypt';
import pool from '../config/db.js';
import {
  generateToken,
  generateRefreshToken,
  hashRefreshToken,
  generateResetToken,
  hashResetToken,
  verifyToken,
  getRefreshTokenExpiryDays,
} from '../utils/token.js';
import { validateName, validateEmail, validatePassword } from '../utils/validation.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { setAuthCookies, clearAuthCookies, getAccessCookieName, getRefreshCookieName } from '../utils/authCookies.js';
import logger from '../utils/logger.js';


/**
 * Persist a new refresh (session) token for a user.
 * @param {import('pg').Pool | import('pg').PoolClient} executor
 * @param {number} userId
 * @returns {Promise<string>} The raw (unhashed) refresh token to hand to the client.
 */
const saveRefreshToken = async (executor, userId) => {
  const rawToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + getRefreshTokenExpiryDays() * 24 * 60 * 60 * 1000);
  await executor.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hashRefreshToken(rawToken), expiresAt]
  );
  return rawToken;
};

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Input Validation
    const nameErr = validateName(name);
    if (nameErr) return res.status(400).json({ success: false, message: nameErr });

    const emailErr = validateEmail(email);
    if (emailErr) return res.status(400).json({ success: false, message: emailErr });

    const passErr = validatePassword(password);
    if (passErr) return res.status(400).json({ success: false, message: passErr });

    // 2. Data Normalization
    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    // 3. Check for existing user. To prevent account enumeration, an existing
    // email gets the same status + success message as a fresh registration.
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        user: null,
        token: null,
        refreshToken: null,
      });
    }

    // 4. Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Insert new user into database
    const newUserResult = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, avatar_url, token_version, created_at`,
      [trimmedName, normalizedEmail, passwordHash]
    );

    const user = newUserResult.rows[0];

    // 6. Generate access + refresh tokens
    const token = generateToken(user.id, user.token_version);
    const refreshToken = await saveRefreshToken(pool, user.id);

    logger.info({ userId: user.id }, 'User registered successfully');

    // 7. Send Response (never expose password_hash)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    // Unique-violation race (two simultaneous registrations for the same
    // email): respond identically to the existing-email case to avoid leaking
    // that the account exists.
    if (error && error.code === '23505') {
      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        user: null,
        token: null,
        refreshToken: null,
      });
    }
    next(error);
  }
};

/**
 * Login existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Find user by email
    const userResult = await pool.query(
      'SELECT id, name, email, password_hash, avatar_url, token_version FROM users WHERE email = $1',
      [normalizedEmail]
    );

    const genericErrorMessage = 'Invalid email or password.';

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: genericErrorMessage,
      });
    }

    const user = userResult.rows[0];

    // 2. Compare password hash
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: genericErrorMessage,
      });
    }

    // 3. Generate access + refresh tokens
    const token = generateToken(user.id, user.token_version);
    const refreshToken = await saveRefreshToken(pool, user.id);

    logger.info({ userId: user.id }, 'User logged in successfully');

    // 4. Persist tokens in httpOnly cookies for browser clients and return
    // them in the body for API/mobile clients.
    setAuthCookies(res, { token, refreshToken });

    // 5. Return safe user payload
    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const userId = req.userId;

    const userResult = await pool.query(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    const user = userResult.rows[0];

    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Rotate a refresh token (single-use session renewal)
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res, next) => {
  const client = await pool.connect();
  try {
    // Mobile/API clients send the refresh token in the body; browser clients
    // rely on the httpOnly refresh cookie.
    const bodyRefresh = req.body && typeof req.body.refreshToken === 'string' ? req.body.refreshToken : null;
    const rawRefreshToken = bodyRefresh || req.cookies?.[getRefreshCookieName()] || null;

    if (!rawRefreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.',
      });
    }

    const tokenHash = hashRefreshToken(rawRefreshToken);

    await client.query('BEGIN');

    // Atomically consume the old refresh token so it cannot be reused.
    const consumed = await client.query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP
       RETURNING id, user_id`,
      [tokenHash]
    );

    if (consumed.rows.length === 0) {
      await client.query('ROLLBACK');
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    const userId = consumed.rows[0].user_id;

    const userResult = await client.query(
      'SELECT id, name, email, avatar_url, token_version FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.',
      });
    }

    const user = userResult.rows[0];

    // Issue a new refresh token (previous one is already revoked above).
    const newRefreshToken = await saveRefreshToken(client, user.id);

    await client.query('COMMIT');

    const freshAccessToken = generateToken(user.id, user.token_version);
    setAuthCookies(res, { token: freshAccessToken, refreshToken: newRefreshToken });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
      token: freshAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      // Ignore rollback errors (transaction may already be closed).
    }
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const emailErr = validateEmail(email);
    if (emailErr) {
      return res.status(400).json({ success: false, message: emailErr });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      logger.info({ userId: user.id }, 'Password reset requested for existing user');

      // Generate raw reset token and token hash (do not log raw token)
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);

      // Expiration set to 15 minutes from now
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      // Store in DB
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      // Send password reset email
      const clientUrl = process.env.CLIENT_URL;
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;

      try {
        const info = await sendPasswordResetEmail(normalizedEmail, resetUrl);
        logger.info({ userId: user.id, messageId: info && info.messageId }, 'Password reset email sent');
      } catch (emailError) {
        logger.error({ err: emailError, userId: user.id }, 'Failed to send password reset email');
        // Don't block the response if email fails — log for debugging
      }
    }

    // Always return generic response to prevent email enumeration
    return res.status(200).json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password using token — atomic: the token is consumed in the same
 * transaction that updates the password, so it cannot be reused. Reset also
 * bumps the user's token_version and revokes all refresh sessions.
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { token, password } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required.',
      });
    }

    const passErr = validatePassword(password);
    if (passErr) {
      return res.status(400).json({ success: false, message: passErr });
    }

    // Hash incoming raw token to compare against database
    const tokenHash = hashResetToken(token);

    await client.query('BEGIN');

    // Atomically consume the reset token: single UPDATE ensures a concurrent
    // request cannot reuse the same token (only one row will match).
    const consumed = await client.query(
      `UPDATE password_reset_tokens
       SET used_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP
       RETURNING user_id`,
      [tokenHash]
    );

    if (consumed.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    const userId = consumed.rows[0].user_id;

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(password, saltRounds);

    // Update password and invalidate all previously issued JWTs
    await client.query(
      `UPDATE users
       SET password_hash = $1, token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPasswordHash, userId]
    );

    // Revoke all refresh (session) tokens for the user
    await client.query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND revoked_at IS NULL`,
      [userId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (e) {
      // Ignore rollback errors (transaction may already be closed).
    }
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Logout user — revokes the server-side session.
 * POST /api/auth/logout
 *
 * Intentionally unauthenticated: a client must always be able to sign out,
 * even after its access token has expired. Revocation is possession-based — it
 * only invalidates the sessions the caller can prove it holds (a refresh token
 * via cookie/body, or a valid access token), so the public endpoint leaks
 * nothing an attacker does not already control. A per-IP rate limiter
 * (logoutLimiter) bounds abuse of the revocation logic.
 */
export const logout = async (req, res, next) => {
  try {
    const bodyRefresh = req.body && typeof req.body.refreshToken === 'string' ? req.body.refreshToken : null;
    const suppliedRefreshToken = bodyRefresh || req.cookies?.[getRefreshCookieName()] || null;

    if (suppliedRefreshToken) {
      // Revoke the specific refresh session provided by the client.
      await pool.query(
        `UPDATE refresh_tokens
         SET revoked_at = CURRENT_TIMESTAMP
         WHERE token_hash = $1 AND revoked_at IS NULL`,
        [hashRefreshToken(suppliedRefreshToken)]
      );
    } else {
      // Fallback: if a valid access token is present, revoke all of the user's
      // refresh sessions so logout still invalidates the account sessions.
      const authHeader = req.headers && req.headers['authorization'];
      const accessToken =
        (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null) ||
        req.cookies?.[getAccessCookieName()] ||
        null;

      if (accessToken) {
        try {
          const decoded = verifyToken(accessToken);
          if (decoded && decoded.type === 'access' && decoded.userId) {
            await pool.query(
              `UPDATE refresh_tokens
               SET revoked_at = CURRENT_TIMESTAMP
               WHERE user_id = $1 AND revoked_at IS NULL`,
              [decoded.userId]
            );
          }
        } catch (e) {
          // Ignore invalid/expired access tokens during logout.
        }
      }
    }

    // Always clear the auth cookies so browser sessions end cleanly even if no
    // revocable token was supplied.
    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};