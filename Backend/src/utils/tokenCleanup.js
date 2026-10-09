import pool from '../config/db.js';
import logger from '../utils/logger.js';

/**
 * Periodic cleanup of expired or consumed auth tokens.
 *
 * password_reset_tokens and refresh_tokens both grow without bound as tokens
 * are issued, so a recurring DELETE keeps the tables (and their indexes) small.
 * Deletes are idempotent, so multiple API processes running this concurrently
 * are harmless.
 */
export const cleanupExpiredTokens = async () => {
  try {
    const [passwordReset, refresh] = await Promise.all([
      pool.query(
        `DELETE FROM password_reset_tokens
         WHERE expires_at < NOW() OR used_at IS NOT NULL`
      ),
      pool.query(
        `DELETE FROM refresh_tokens
         WHERE expires_at < NOW() OR revoked_at IS NOT NULL`
      ),
    ]);

    logger.info(
      {
        passwordResetDeleted: passwordReset.rowCount,
        refreshDeleted: refresh.rowCount,
      },
      'Expired/consumed tokens cleaned up'
    );
  } catch (error) {
    logger.error({ err: error }, 'Token cleanup failed');
  }
};

/**
 * Start the periodic cleanup. Runs once shortly after boot and then on an
 * interval. The timer is unref'd so it never prevents the process from
 * exiting cleanly in tests or short-lived processes.
 */
export const startTokenCleanup = (intervalMs = 60 * 60 * 1000) => {
  cleanupExpiredTokens();
  const timer = setInterval(cleanupExpiredTokens, intervalMs);
  timer.unref();
  return timer;
};