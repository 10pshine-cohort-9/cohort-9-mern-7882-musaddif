import bcrypt from 'bcryptjs';
import pool from '../config/db.js';
import { generateToken, generateResetToken, hashResetToken } from '../utils/token.js';
import { validateName, validateEmail, validatePassword } from '../utils/validation.js';
import { sendPasswordResetEmail } from '../utils/email.js';


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

    // 3. Check for existing user
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists.',
      });
    }

    // 4. Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Insert new user into database
    const newUserResult = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, avatar_url, created_at`,
      [trimmedName, normalizedEmail, passwordHash]
    );

    const user = newUserResult.rows[0];

    // 6. Generate JWT Token
    const token = generateToken(user.id);

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
    });
  } catch (error) {
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
      'SELECT id, name, email, password_hash, avatar_url FROM users WHERE email = $1',
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

    // 3. Generate JWT Token
    const token = generateToken(user.id);

    // 4. Return safe user payload
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
 * Request password reset
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res, next) => {
  
  try {
    const { email } = req.body;
console.log("email:", email);

    const emailErr = validateEmail(email);
    if (emailErr) {
      return res.status(400).json({ success: false, message: emailErr });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
      console.log('[Auth] forgotPassword request for:', normalizedEmail);

      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        console.log('[Auth] User found for forgot-password:', { id: user.id, email: normalizedEmail });

      // Generate raw reset token and token hash (do not log raw token)
      const rawToken = generateResetToken();
      const tokenHash = hashResetToken(rawToken);
      console.log('[Auth] Generated password reset token hash for user id:', user.id);

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
        console.log('[Auth] Attempting to send password reset email to:', normalizedEmail);
        const info = await sendPasswordResetEmail(normalizedEmail, resetUrl);
        if (info && info.messageId) {
          console.log('[Auth] sendPasswordResetEmail succeeded:', { to: normalizedEmail, messageId: info.messageId });
        } else {
          console.log('[Auth] sendPasswordResetEmail resolved without messageId for', normalizedEmail);
        }
      } catch (emailError) {
        console.error('[Auth][Email Error] Failed to send password reset email to', normalizedEmail, '-', emailError && emailError.message ? emailError.message : emailError);
        if (emailError && emailError.code) console.error('[Auth][Email Error] code:', emailError.code);
        if (emailError && emailError.response) console.error('[Auth][Email Error] response:', emailError.response);
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
 * Reset password using token
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res, next) => {
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

    // Find reset token entry
    const tokenResult = await pool.query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.',
      });
    }

    const resetRecord = tokenResult.rows[0];

    // Check if token has already been used
    if (resetRecord.used_at) {
      return res.status(400).json({
        success: false,
        message: 'This reset token has already been used.',
      });
    }

    // Check token expiration
    const now = new Date();
    if (new Date(resetRecord.expires_at) < now) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token has expired.',
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(password, saltRounds);

    // Update user password
    await pool.query(
      `UPDATE users
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newPasswordHash, resetRecord.user_id]
    );

    // Mark token as used
    await pool.query(
      `UPDATE password_reset_tokens
       SET used_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [resetRecord.id]
    );

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
